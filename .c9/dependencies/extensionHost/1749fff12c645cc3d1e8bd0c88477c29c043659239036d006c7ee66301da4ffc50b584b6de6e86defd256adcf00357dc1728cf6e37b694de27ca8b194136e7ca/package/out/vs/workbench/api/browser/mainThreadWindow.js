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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/windows/common/windows", "vs/workbench/api/common/extHostCustomers", "../common/extHost.protocol", "vs/platform/remote/common/tunnel", "vs/workbench/services/environment/common/environmentService", "vs/workbench/contrib/webview/common/portMapping", "vs/platform/opener/common/opener"], function (require, exports, event_1, lifecycle_1, uri_1, windows_1, extHostCustomers_1, extHost_protocol_1, tunnel_1, environmentService_1, portMapping_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MainThreadWindow = class MainThreadWindow {
        constructor(extHostContext, windowService, openerService, tunnelService, environmentService) {
            this.windowService = windowService;
            this.openerService = openerService;
            this.tunnelService = tunnelService;
            this.environmentService = environmentService;
            this.disposables = new lifecycle_1.DisposableStore();
            this._tunnels = new Map();
            this.proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostWindow);
            event_1.Event.latch(windowService.onDidChangeFocus)(this.proxy.$onDidChangeWindowFocus, this.proxy, this.disposables);
        }
        dispose() {
            this.disposables.dispose();
            for (const tunnel of this._tunnels.values()) {
                tunnel.then(tunnel => tunnel.dispose());
            }
            this._tunnels.clear();
        }
        $getWindowVisibility() {
            return this.windowService.isFocused();
        }
        $openUri(uriComponent, options) {
            return __awaiter(this, void 0, void 0, function* () {
                let uri = uri_1.URI.revive(uriComponent);
                if (options.allowTunneling && !!this.environmentService.configuration.remoteAuthority) {
                    const portMappingRequest = portMapping_1.extractLocalHostUriMetaDataForPortMapping(uri);
                    if (portMappingRequest) {
                        const tunnel = yield this.getOrCreateTunnel(portMappingRequest.port);
                        if (tunnel) {
                            uri = uri.with({ authority: `127.0.0.1:${tunnel.tunnelLocalPort}` });
                        }
                    }
                }
                return this.openerService.open(uri, { openExternal: true });
            });
        }
        getOrCreateTunnel(remotePort) {
            const existing = this._tunnels.get(remotePort);
            if (existing) {
                return existing;
            }
            const tunnel = this.tunnelService.openTunnel(remotePort);
            if (tunnel) {
                this._tunnels.set(remotePort, tunnel);
            }
            return tunnel;
        }
    };
    MainThreadWindow = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadWindow),
        __param(1, windows_1.IWindowService),
        __param(2, opener_1.IOpenerService),
        __param(3, tunnel_1.ITunnelService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService)
    ], MainThreadWindow);
    exports.MainThreadWindow = MainThreadWindow;
});
//# sourceMappingURL=mainThreadWindow.js.map