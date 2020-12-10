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
define(["require", "exports", "vs/base/common/event", "vs/workbench/services/environment/common/environmentService", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/remote/common/remoteAgentConnection", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/workbench/services/extensions/common/extensionDevOptions", "vs/platform/remote/common/remoteAuthorityResolver", "vs/base/common/platform", "vs/base/common/network", "vs/base/common/lifecycle", "vs/platform/lifecycle/common/lifecycle", "vs/base/common/buffer", "vs/platform/debug/common/extensionHostDebug", "vs/platform/product/common/product", "vs/platform/sign/common/sign"], function (require, exports, event_1, environmentService_1, label_1, log_1, remoteAgentConnection_1, telemetry_1, workspace_1, extensionHostProtocol_1, extensionDevOptions_1, remoteAuthorityResolver_1, platform, network_1, lifecycle_1, lifecycle_2, buffer_1, extensionHostDebug_1, product_1, sign_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let RemoteExtensionHostClient = class RemoteExtensionHostClient extends lifecycle_1.Disposable {
        constructor(_allExtensions, _initDataProvider, _socketFactory, _contextService, _environmentService, _telemetryService, _lifecycleService, _logService, _labelService, remoteAuthorityResolverService, _extensionHostDebugService, _productService, _signService) {
            super();
            this._allExtensions = _allExtensions;
            this._initDataProvider = _initDataProvider;
            this._socketFactory = _socketFactory;
            this._contextService = _contextService;
            this._environmentService = _environmentService;
            this._telemetryService = _telemetryService;
            this._lifecycleService = _lifecycleService;
            this._logService = _logService;
            this._labelService = _labelService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this._extensionHostDebugService = _extensionHostDebugService;
            this._productService = _productService;
            this._signService = _signService;
            this._onExit = this._register(new event_1.Emitter());
            this.onExit = this._onExit.event;
            this._protocol = null;
            this._terminating = false;
            this._register(this._lifecycleService.onShutdown(reason => this.dispose()));
            const devOpts = extensionDevOptions_1.parseExtensionDevOptions(this._environmentService);
            this._isExtensionDevHost = devOpts.isExtensionDevHost;
        }
        start() {
            const options = {
                commit: this._productService.commit,
                socketFactory: this._socketFactory,
                addressProvider: {
                    getAddress: () => __awaiter(this, void 0, void 0, function* () {
                        const { authority } = yield this.remoteAuthorityResolverService.resolveAuthority(this._initDataProvider.remoteAuthority);
                        return { host: authority.host, port: authority.port };
                    })
                },
                signService: this._signService,
                logService: this._logService
            };
            return this.remoteAuthorityResolverService.resolveAuthority(this._initDataProvider.remoteAuthority).then((resolverResult) => {
                const startParams = {
                    language: platform.language,
                    debugId: this._environmentService.debugExtensionHost.debugId,
                    break: this._environmentService.debugExtensionHost.break,
                    port: this._environmentService.debugExtensionHost.port,
                    env: resolverResult.options && resolverResult.options.extensionHostEnv
                };
                const extDevLocs = this._environmentService.extensionDevelopmentLocationURI;
                let debugOk = true;
                if (extDevLocs && extDevLocs.length > 0) {
                    // TODO@AW: handles only first path in array
                    if (extDevLocs[0].scheme === network_1.Schemas.file) {
                        debugOk = false;
                    }
                }
                if (!debugOk) {
                    startParams.break = false;
                }
                return remoteAgentConnection_1.connectRemoteAgentExtensionHost(options, startParams).then(result => {
                    let { protocol, debugPort } = result;
                    const isExtensionDevelopmentDebug = typeof debugPort === 'number';
                    if (debugOk && this._environmentService.isExtensionDevelopment && this._environmentService.debugExtensionHost.debugId && debugPort) {
                        this._extensionHostDebugService.attachSession(this._environmentService.debugExtensionHost.debugId, debugPort, this._initDataProvider.remoteAuthority);
                    }
                    protocol.onClose(() => {
                        this._onExtHostConnectionLost();
                    });
                    protocol.onSocketClose(() => {
                        if (this._isExtensionDevHost) {
                            this._onExtHostConnectionLost();
                        }
                    });
                    // 1) wait for the incoming `ready` event and send the initialization data.
                    // 2) wait for the incoming `initialized` event.
                    return new Promise((resolve, reject) => {
                        let handle = setTimeout(() => {
                            reject(new Error('timeout'));
                        }, 60 * 1000);
                        const disposable = protocol.onMessage(msg => {
                            if (extensionHostProtocol_1.isMessageOfType(msg, 1 /* Ready */)) {
                                // 1) Extension Host is ready to receive messages, initialize it
                                this._createExtHostInitData(isExtensionDevelopmentDebug).then(data => protocol.send(buffer_1.VSBuffer.fromString(JSON.stringify(data))));
                                return;
                            }
                            if (extensionHostProtocol_1.isMessageOfType(msg, 0 /* Initialized */)) {
                                // 2) Extension Host is initialized
                                clearTimeout(handle);
                                // stop listening for messages here
                                disposable.dispose();
                                // release this promise
                                this._protocol = protocol;
                                resolve(protocol);
                                return;
                            }
                            console.error(`received unexpected message during handshake phase from the extension host: `, msg);
                        });
                    });
                });
            });
        }
        _onExtHostConnectionLost() {
            if (this._isExtensionDevHost && this._environmentService.debugExtensionHost.debugId) {
                this._extensionHostDebugService.close(this._environmentService.debugExtensionHost.debugId);
            }
            if (this._terminating) {
                // Expected termination path (we asked the process to terminate)
                return;
            }
            this._onExit.fire([0, null]);
        }
        _createExtHostInitData(isExtensionDevelopmentDebug) {
            return Promise.all([this._allExtensions, this._telemetryService.getTelemetryInfo(), this._initDataProvider.getInitData()]).then(([allExtensions, telemetryInfo, remoteExtensionHostData]) => {
                // Collect all identifiers for extension ids which can be considered "resolved"
                const resolvedExtensions = allExtensions.filter(extension => !extension.main).map(extension => extension.identifier);
                const hostExtensions = allExtensions.filter(extension => extension.main && extension.api === 'none').map(extension => extension.identifier);
                const workspace = this._contextService.getWorkspace();
                const r = {
                    commit: this._productService.commit,
                    version: this._productService.version,
                    parentPid: remoteExtensionHostData.pid,
                    environment: {
                        isExtensionDevelopmentDebug,
                        appRoot: remoteExtensionHostData.appRoot,
                        appSettingsHome: remoteExtensionHostData.appSettingsHome,
                        appName: this._productService.nameLong,
                        appUriScheme: this._productService.urlProtocol,
                        appLanguage: platform.language,
                        extensionDevelopmentLocationURI: this._environmentService.extensionDevelopmentLocationURI,
                        extensionTestsLocationURI: this._environmentService.extensionTestsLocationURI,
                        globalStorageHome: remoteExtensionHostData.globalStorageHome,
                        userHome: remoteExtensionHostData.userHome,
                        webviewResourceRoot: this._environmentService.webviewResourceRoot,
                        webviewCspSource: this._environmentService.webviewCspSource,
                    },
                    workspace: this._contextService.getWorkbenchState() === 1 /* EMPTY */ ? null : {
                        configuration: workspace.configuration,
                        id: workspace.id,
                        name: this._labelService.getWorkspaceLabel(workspace)
                    },
                    remote: {
                        isRemote: true,
                        authority: this._initDataProvider.remoteAuthority
                    },
                    resolvedExtensions: resolvedExtensions,
                    hostExtensions: hostExtensions,
                    extensions: remoteExtensionHostData.extensions,
                    telemetryInfo,
                    logLevel: this._logService.getLevel(),
                    logsLocation: remoteExtensionHostData.extensionHostLogsPath,
                    autoStart: true,
                };
                return r;
            });
        }
        getInspectPort() {
            return undefined;
        }
        dispose() {
            super.dispose();
            this._terminating = true;
            if (this._protocol) {
                // Send the extension host a request to terminate itself
                // (graceful termination)
                const socket = this._protocol.getSocket();
                this._protocol.send(extensionHostProtocol_1.createMessageOfType(2 /* Terminate */));
                this._protocol.sendDisconnect();
                this._protocol.dispose();
                socket.end();
                this._protocol = null;
            }
        }
    };
    RemoteExtensionHostClient = __decorate([
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, lifecycle_2.ILifecycleService),
        __param(7, log_1.ILogService),
        __param(8, label_1.ILabelService),
        __param(9, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(10, extensionHostDebug_1.IExtensionHostDebugService),
        __param(11, product_1.IProductService),
        __param(12, sign_1.ISignService)
    ], RemoteExtensionHostClient);
    exports.RemoteExtensionHostClient = RemoteExtensionHostClient;
});
//# sourceMappingURL=remoteExtensionHostClient.js.map