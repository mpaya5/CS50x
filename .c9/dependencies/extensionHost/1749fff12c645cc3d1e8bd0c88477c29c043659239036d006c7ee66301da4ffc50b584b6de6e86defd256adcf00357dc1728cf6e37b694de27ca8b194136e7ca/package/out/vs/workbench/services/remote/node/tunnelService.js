/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "net", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService", "vs/platform/product/node/product", "vs/platform/remote/common/remoteAgentConnection", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/common/tunnel", "vs/platform/remote/node/nodeSocketFactory", "vs/platform/sign/common/sign", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log"], function (require, exports, net, async_1, lifecycle_1, environmentService_1, product_1, remoteAgentConnection_1, remoteAuthorityResolver_1, tunnel_1, nodeSocketFactory_1, sign_1, extensions_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createRemoteTunnel(options, tunnelRemotePort) {
        return __awaiter(this, void 0, void 0, function* () {
            const tunnel = new NodeRemoteTunnel(options, tunnelRemotePort);
            return tunnel.waitForReady();
        });
    }
    exports.createRemoteTunnel = createRemoteTunnel;
    class NodeRemoteTunnel extends lifecycle_1.Disposable {
        constructor(options, tunnelRemotePort) {
            super();
            this._options = options;
            this._server = net.createServer();
            this._barrier = new async_1.Barrier();
            this._listeningListener = () => this._barrier.open();
            this._server.on('listening', this._listeningListener);
            this._connectionListener = (socket) => this._onConnection(socket);
            this._server.on('connection', this._connectionListener);
            this.tunnelRemotePort = tunnelRemotePort;
            this.tunnelLocalPort = this._server.listen(0).address().port;
        }
        dispose() {
            super.dispose();
            this._server.removeListener('listening', this._listeningListener);
            this._server.removeListener('connection', this._connectionListener);
            this._server.close();
        }
        waitForReady() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this._barrier.wait();
                return this;
            });
        }
        _onConnection(localSocket) {
            return __awaiter(this, void 0, void 0, function* () {
                // pause reading on the socket until we have a chance to forward its data
                localSocket.pause();
                const protocol = yield remoteAgentConnection_1.connectRemoteAgentTunnel(this._options, this.tunnelRemotePort);
                const remoteSocket = protocol.getSocket().socket;
                const dataChunk = protocol.readEntireBuffer();
                protocol.dispose();
                if (dataChunk.byteLength > 0) {
                    localSocket.write(dataChunk.buffer);
                }
                localSocket.on('end', () => remoteSocket.end());
                localSocket.on('close', () => remoteSocket.end());
                remoteSocket.on('end', () => localSocket.end());
                remoteSocket.on('close', () => localSocket.end());
                localSocket.pipe(remoteSocket);
                remoteSocket.pipe(localSocket);
            });
        }
    }
    let TunnelService = class TunnelService {
        constructor(environmentService, remoteAuthorityResolverService, signService, logService) {
            this.environmentService = environmentService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this.signService = signService;
            this.logService = logService;
        }
        openTunnel(remotePort) {
            const remoteAuthority = this.environmentService.configuration.remoteAuthority;
            if (!remoteAuthority) {
                return undefined;
            }
            const options = {
                commit: product_1.default.commit,
                socketFactory: nodeSocketFactory_1.nodeSocketFactory,
                addressProvider: {
                    getAddress: () => __awaiter(this, void 0, void 0, function* () {
                        const { authority } = yield this.remoteAuthorityResolverService.resolveAuthority(remoteAuthority);
                        return { host: authority.host, port: authority.port };
                    })
                },
                signService: this.signService,
                logService: this.logService
            };
            return createRemoteTunnel(options, remotePort);
        }
    };
    TunnelService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(2, sign_1.ISignService),
        __param(3, log_1.ILogService)
    ], TunnelService);
    exports.TunnelService = TunnelService;
    extensions_1.registerSingleton(tunnel_1.ITunnelService, TunnelService, true);
});
//# sourceMappingURL=tunnelService.js.map