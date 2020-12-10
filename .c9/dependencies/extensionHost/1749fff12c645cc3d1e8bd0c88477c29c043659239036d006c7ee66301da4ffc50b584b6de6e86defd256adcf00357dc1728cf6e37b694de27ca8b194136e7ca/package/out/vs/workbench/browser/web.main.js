/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/base/common/performance", "vs/base/browser/dom", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/browser/workbench", "vs/platform/remote/common/remoteAgentFileSystemChannel", "vs/workbench/services/environment/common/environmentService", "vs/platform/product/common/product", "vs/workbench/services/remote/browser/remoteAgentServiceImpl", "vs/platform/remote/browser/remoteAuthorityResolverService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/base/common/network", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/base/common/errors", "vs/base/common/uri", "vs/workbench/services/configuration/browser/configurationService", "vs/workbench/services/configuration/browser/configurationCache", "vs/platform/sign/common/sign", "vs/platform/sign/browser/signService", "vs/base/common/hash", "vs/workbench/services/userData/common/fileUserDataProvider", "vs/platform/environment/common/environment", "vs/base/common/resources", "vs/platform/storage/browser/storageService", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/workbench/services/userData/common/inMemoryUserDataProvider", "vs/platform/driver/browser/driver", "vs/platform/log/common/bufferLog", "vs/platform/log/common/fileLogService", "vs/base/common/date", "vs/workbench/services/log/browser/indexedDBLogProvider", "vs/workbench/services/log/common/inMemoryLogProvider"], function (require, exports, performance_1, dom_1, serviceCollection_1, log_1, lifecycle_1, environmentService_1, workbench_1, remoteAgentFileSystemChannel_1, environmentService_2, product_1, remoteAgentServiceImpl_1, remoteAuthorityResolverService_1, remoteAuthorityResolver_1, remoteAgentService_1, files_1, fileService_1, network_1, workspace_1, configuration_1, errors_1, uri_1, configurationService_1, configurationCache_1, sign_1, signService_1, hash_1, fileUserDataProvider_1, environment_1, resources_1, storageService_1, storage_1, themeService_1, inMemoryUserDataProvider_1, driver_1, bufferLog_1, fileLogService_1, date_1, indexedDBLogProvider_1, inMemoryLogProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CodeRendererMain extends lifecycle_1.Disposable {
        constructor(domElement, configuration) {
            super();
            this.domElement = domElement;
            this.configuration = configuration;
        }
        open() {
            return __awaiter(this, void 0, void 0, function* () {
                const services = yield this.initServices();
                yield dom_1.domContentLoaded();
                performance_1.mark('willStartWorkbench');
                // Base Theme
                this.restoreBaseTheme();
                // Create Workbench
                const workbench = new workbench_1.Workbench(this.domElement, services.serviceCollection, services.logService);
                // Layout
                this._register(dom_1.addDisposableListener(window, dom_1.EventType.RESIZE, () => workbench.layout()));
                // Workbench Lifecycle
                this._register(workbench.onBeforeShutdown(event => {
                    if (services.storageService.hasPendingUpdate) {
                        console.warn('Unload prevented: pending storage update');
                        event.veto(true); // prevent data loss from pending storage update
                    }
                }));
                this._register(workbench.onWillShutdown(() => {
                    services.storageService.close();
                    this.saveBaseTheme();
                }));
                this._register(workbench.onShutdown(() => this.dispose()));
                // Driver
                if (this.configuration.driver) {
                    (() => __awaiter(this, void 0, void 0, function* () { return this._register(yield driver_1.registerWindowDriver()); }))();
                }
                // Startup
                workbench.startup();
            });
        }
        restoreBaseTheme() {
            dom_1.addClass(this.domElement, window.localStorage.getItem('baseTheme') || themeService_1.getThemeTypeSelector(themeService_1.DARK));
        }
        saveBaseTheme() {
            const classes = this.domElement.className;
            const baseThemes = [themeService_1.DARK, themeService_1.LIGHT, themeService_1.HIGH_CONTRAST].map(baseTheme => themeService_1.getThemeTypeSelector(baseTheme));
            for (const baseTheme of baseThemes) {
                if (classes.indexOf(baseTheme) >= 0) {
                    window.localStorage.setItem('baseTheme', baseTheme);
                    break;
                }
            }
        }
        initServices() {
            return __awaiter(this, void 0, void 0, function* () {
                const serviceCollection = new serviceCollection_1.ServiceCollection();
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // NOTE: DO NOT ADD ANY OTHER SERVICE INTO THE COLLECTION HERE.
                // CONTRIBUTE IT VIA WORKBENCH.WEB.MAIN.TS AND registerSingleton().
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // Log
                const logsPath = uri_1.URI.file(date_1.toLocalISOString(new Date()).replace(/-|:|\.\d+Z$/g, '')).with({ scheme: 'vscode-log' });
                const logService = new bufferLog_1.BufferLogService();
                serviceCollection.set(log_1.ILogService, logService);
                const payload = this.resolveWorkspaceInitializationPayload();
                // Environment
                const environmentService = new environmentService_1.BrowserWorkbenchEnvironmentService(Object.assign({ workspaceId: payload.id, logsPath }, this.configuration));
                serviceCollection.set(environmentService_2.IWorkbenchEnvironmentService, environmentService);
                // Product
                const productService = this.createProductService();
                serviceCollection.set(product_1.IProductService, productService);
                // Remote
                const remoteAuthorityResolverService = new remoteAuthorityResolverService_1.RemoteAuthorityResolverService();
                serviceCollection.set(remoteAuthorityResolver_1.IRemoteAuthorityResolverService, remoteAuthorityResolverService);
                // Signing
                const signService = new signService_1.SignService(environmentService.configuration.connectionToken);
                serviceCollection.set(sign_1.ISignService, signService);
                // Remote Agent
                const remoteAgentService = this._register(new remoteAgentServiceImpl_1.RemoteAgentService(this.configuration.webSocketFactory, environmentService, productService, remoteAuthorityResolverService, signService, logService));
                serviceCollection.set(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
                // Files
                const fileService = this._register(new fileService_1.FileService(logService));
                serviceCollection.set(files_1.IFileService, fileService);
                this.registerFileSystemProviders(environmentService, fileService, remoteAgentService, logService, logsPath);
                // Long running services (workspace, config, storage)
                const services = yield Promise.all([
                    this.createWorkspaceService(payload, environmentService, fileService, remoteAgentService, logService).then(service => {
                        // Workspace
                        serviceCollection.set(workspace_1.IWorkspaceContextService, service);
                        // Configuration
                        serviceCollection.set(configuration_1.IConfigurationService, service);
                        return service;
                    }),
                    this.createStorageService(payload, environmentService, fileService, logService).then(service => {
                        // Storage
                        serviceCollection.set(storage_1.IStorageService, service);
                        return service;
                    })
                ]);
                return { serviceCollection, logService, storageService: services[1] };
            });
        }
        registerFileSystemProviders(environmentService, fileService, remoteAgentService, logService, logsPath) {
            // Logger
            const indexedDBLogProvider = new indexedDBLogProvider_1.IndexedDBLogProvider(logsPath.scheme);
            (() => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield indexedDBLogProvider.database;
                    fileService.registerProvider(logsPath.scheme, indexedDBLogProvider);
                }
                catch (error) {
                    logService.info('Error while creating indexedDB log provider. Falling back to in-memory log provider.');
                    logService.error(error);
                    fileService.registerProvider(logsPath.scheme, new inMemoryLogProvider_1.InMemoryLogProvider(logsPath.scheme));
                }
                const consoleLogService = new log_1.ConsoleLogService(logService.getLevel());
                const fileLogService = new fileLogService_1.FileLogService('window', environmentService.logFile, logService.getLevel(), fileService);
                logService.logger = new log_1.MultiplexLogService([consoleLogService, fileLogService]);
            }))();
            const connection = remoteAgentService.getConnection();
            if (connection) {
                // Remote file system
                const channel = connection.getChannel(remoteAgentFileSystemChannel_1.REMOTE_FILE_SYSTEM_CHANNEL_NAME);
                const remoteFileSystemProvider = this._register(new remoteAgentFileSystemChannel_1.RemoteExtensionsFileSystemProvider(channel, remoteAgentService.getEnvironment()));
                fileService.registerProvider(network_1.Schemas.vscodeRemote, remoteFileSystemProvider);
                if (!this.configuration.userDataProvider) {
                    const remoteUserDataUri = this.getRemoteUserDataUri();
                    if (remoteUserDataUri) {
                        this.configuration.userDataProvider = this._register(new fileUserDataProvider_1.FileUserDataProvider(remoteUserDataUri, resources_1.joinPath(remoteUserDataUri, environment_1.BACKUPS), remoteFileSystemProvider, environmentService));
                    }
                }
            }
            // User data
            if (!this.configuration.userDataProvider) {
                this.configuration.userDataProvider = this._register(new inMemoryUserDataProvider_1.InMemoryUserDataProvider());
            }
            fileService.registerProvider(network_1.Schemas.userData, this.configuration.userDataProvider);
        }
        createProductService() {
            const productConfiguration = Object.assign({}, this.configuration.productConfiguration ? this.configuration.productConfiguration : {
                version: '1.38.0-unknown',
                nameLong: 'Unknown',
                extensionAllowedProposedApi: [],
            }, { urlProtocol: '' });
            return Object.assign({ _serviceBrand: undefined }, productConfiguration);
        }
        createStorageService(payload, environmentService, fileService, logService) {
            return __awaiter(this, void 0, void 0, function* () {
                const storageService = new storageService_1.BrowserStorageService(environmentService, fileService);
                try {
                    yield storageService.initialize(payload);
                    return storageService;
                }
                catch (error) {
                    errors_1.onUnexpectedError(error);
                    logService.error(error);
                    return storageService;
                }
            });
        }
        createWorkspaceService(payload, environmentService, fileService, remoteAgentService, logService) {
            return __awaiter(this, void 0, void 0, function* () {
                const workspaceService = new configurationService_1.WorkspaceService({ remoteAuthority: this.configuration.remoteAuthority, configurationCache: new configurationCache_1.ConfigurationCache() }, environmentService, fileService, remoteAgentService);
                try {
                    yield workspaceService.initialize(payload);
                    return workspaceService;
                }
                catch (error) {
                    errors_1.onUnexpectedError(error);
                    logService.error(error);
                    return workspaceService;
                }
            });
        }
        resolveWorkspaceInitializationPayload() {
            // Multi-root workspace
            if (this.configuration.workspaceUri) {
                return { id: hash_1.hash(uri_1.URI.revive(this.configuration.workspaceUri).toString()).toString(16), configPath: uri_1.URI.revive(this.configuration.workspaceUri) };
            }
            // Single-folder workspace
            if (this.configuration.folderUri) {
                return { id: hash_1.hash(uri_1.URI.revive(this.configuration.folderUri).toString()).toString(16), folder: uri_1.URI.revive(this.configuration.folderUri) };
            }
            return { id: 'empty-window' };
        }
        getRemoteUserDataUri() {
            const element = document.getElementById('vscode-remote-user-data-uri');
            if (element) {
                const remoteUserDataPath = element.getAttribute('data-settings');
                if (remoteUserDataPath) {
                    return resources_1.joinPath(uri_1.URI.revive(JSON.parse(remoteUserDataPath)), 'User');
                }
            }
            return null;
        }
    }
    function main(domElement, options) {
        const renderer = new CodeRendererMain(domElement, options);
        return renderer.open();
    }
    exports.main = main;
});
//# sourceMappingURL=web.main.js.map