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
define(["require", "exports", "fs", "graceful-fs", "crypto", "vs/base/common/performance", "vs/workbench/browser/workbench", "vs/workbench/electron-browser/window", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/errors", "vs/base/common/platform", "vs/base/common/uri", "vs/workbench/services/configuration/browser/configurationService", "vs/workbench/services/environment/node/environmentService", "vs/workbench/services/environment/common/environmentService", "vs/platform/instantiation/common/serviceCollection", "vs/base/node/pfs", "vs/workbench/services/keybinding/electron-browser/nativeKeymapService", "electron", "vs/platform/workspaces/common/workspaces", "vs/platform/log/common/log", "vs/platform/storage/node/storageService", "vs/platform/log/common/logIpc", "vs/base/common/network", "vs/base/common/extpath", "vs/platform/storage/node/storageIpc", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/base/common/lifecycle", "vs/platform/driver/electron-browser/driver", "vs/platform/ipc/electron-browser/mainProcessService", "vs/platform/remote/electron-browser/remoteAuthorityResolverService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/remote/electron-browser/remoteAgentServiceImpl", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/files/common/fileService", "vs/platform/files/common/files", "vs/platform/files/electron-browser/diskFileSystemProvider", "vs/platform/remote/common/remoteAgentFileSystemChannel", "vs/workbench/services/configuration/node/configurationExportHelper", "vs/workbench/services/configuration/node/configurationCache", "vs/platform/log/node/spdlogService", "vs/platform/sign/node/signService", "vs/platform/sign/common/sign", "vs/workbench/services/userData/common/fileUserDataProvider", "vs/base/common/resources", "vs/platform/product/common/product", "vs/platform/product/node/product"], function (require, exports, fs, gracefulFs, crypto_1, performance_1, workbench_1, window_1, browser_1, dom_1, errors_1, platform_1, uri_1, configurationService_1, environmentService_1, environmentService_2, serviceCollection_1, pfs_1, nativeKeymapService_1, electron_1, workspaces_1, log_1, storageService_1, logIpc_1, network_1, extpath_1, storageIpc_1, workspace_1, configuration_1, storage_1, lifecycle_1, driver_1, mainProcessService_1, remoteAuthorityResolverService_1, remoteAuthorityResolver_1, remoteAgentServiceImpl_1, remoteAgentService_1, fileService_1, files_1, diskFileSystemProvider_1, remoteAgentFileSystemChannel_1, configurationExportHelper_1, configurationCache_1, spdlogService_1, signService_1, sign_1, fileUserDataProvider_1, resources_1, product_1, product_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CodeRendererMain extends lifecycle_1.Disposable {
        constructor(configuration) {
            super();
            this.environmentService = new environmentService_1.WorkbenchEnvironmentService(configuration, configuration.execPath);
            this.init();
        }
        init() {
            // Enable gracefulFs
            gracefulFs.gracefulify(fs);
            // Massage configuration file URIs
            this.reviveUris();
            // Setup perf
            performance_1.importEntries(this.environmentService.configuration.perfEntries);
            // Browser config
            browser_1.setZoomFactor(electron_1.webFrame.getZoomFactor()); // Ensure others can listen to zoom level changes
            browser_1.setZoomLevel(electron_1.webFrame.getZoomLevel(), true /* isTrusted */); // Can be trusted because we are not setting it ourselves (https://github.com/Microsoft/vscode/issues/26151)
            browser_1.setFullscreen(!!this.environmentService.configuration.fullscreen);
            // Keyboard support
            nativeKeymapService_1.KeyboardMapperFactory.INSTANCE._onKeyboardLayoutChanged();
        }
        reviveUris() {
            if (this.environmentService.configuration.folderUri) {
                this.environmentService.configuration.folderUri = uri_1.URI.revive(this.environmentService.configuration.folderUri);
            }
            if (this.environmentService.configuration.workspace) {
                this.environmentService.configuration.workspace = workspaces_1.reviveWorkspaceIdentifier(this.environmentService.configuration.workspace);
            }
            const filesToWait = this.environmentService.configuration.filesToWait;
            const filesToWaitPaths = filesToWait && filesToWait.paths;
            [filesToWaitPaths, this.environmentService.configuration.filesToOpenOrCreate, this.environmentService.configuration.filesToDiff].forEach(paths => {
                if (Array.isArray(paths)) {
                    paths.forEach(path => {
                        if (path.fileUri) {
                            path.fileUri = uri_1.URI.revive(path.fileUri);
                        }
                    });
                }
            });
            if (filesToWait) {
                filesToWait.waitMarkerFileUri = uri_1.URI.revive(filesToWait.waitMarkerFileUri);
            }
        }
        open() {
            return __awaiter(this, void 0, void 0, function* () {
                const services = yield this.initServices();
                yield dom_1.domContentLoaded();
                performance_1.mark('willStartWorkbench');
                // Create Workbench
                const workbench = new workbench_1.Workbench(document.body, services.serviceCollection, services.logService);
                // Layout
                this._register(dom_1.addDisposableListener(window, dom_1.EventType.RESIZE, e => this.onWindowResize(e, true, workbench)));
                // Workbench Lifecycle
                this._register(workbench.onShutdown(() => this.dispose()));
                this._register(workbench.onWillShutdown(event => event.join(services.storageService.close())));
                // Startup
                const instantiationService = workbench.startup();
                // Window
                this._register(instantiationService.createInstance(window_1.ElectronWindow));
                // Driver
                if (this.environmentService.configuration.driver) {
                    instantiationService.invokeFunction((accessor) => __awaiter(this, void 0, void 0, function* () { return this._register(yield driver_1.registerWindowDriver(accessor)); }));
                }
                // Config Exporter
                if (this.environmentService.configuration['export-default-configuration']) {
                    instantiationService.createInstance(configurationExportHelper_1.DefaultConfigurationExportHelper);
                }
                // Logging
                services.logService.trace('workbench configuration', JSON.stringify(this.environmentService.configuration));
            });
        }
        onWindowResize(e, retry, workbench) {
            if (e.target === window) {
                if (window.document && window.document.body && window.document.body.clientWidth === 0) {
                    // TODO@Ben this is an electron issue on macOS when simple fullscreen is enabled
                    // where for some reason the window clientWidth is reported as 0 when switching
                    // between simple fullscreen and normal screen. In that case we schedule the layout
                    // call at the next animation frame once, in the hope that the dimensions are
                    // proper then.
                    if (retry) {
                        dom_1.scheduleAtNextAnimationFrame(() => this.onWindowResize(e, false, workbench));
                    }
                    return;
                }
                workbench.layout();
            }
        }
        initServices() {
            return __awaiter(this, void 0, void 0, function* () {
                const serviceCollection = new serviceCollection_1.ServiceCollection();
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // NOTE: DO NOT ADD ANY OTHER SERVICE INTO THE COLLECTION HERE.
                // CONTRIBUTE IT VIA WORKBENCH.DESKTOP.MAIN.TS AND registerSingleton().
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // Main Process
                const mainProcessService = this._register(new mainProcessService_1.MainProcessService(this.environmentService.configuration.windowId));
                serviceCollection.set(mainProcessService_1.IMainProcessService, mainProcessService);
                // Environment
                serviceCollection.set(environmentService_2.IWorkbenchEnvironmentService, this.environmentService);
                // Product
                serviceCollection.set(product_1.IProductService, Object.assign({ _serviceBrand: undefined }, product_2.default));
                // Log
                const logService = this._register(this.createLogService(mainProcessService, this.environmentService));
                serviceCollection.set(log_1.ILogService, logService);
                // Remote
                const remoteAuthorityResolverService = new remoteAuthorityResolverService_1.RemoteAuthorityResolverService();
                serviceCollection.set(remoteAuthorityResolver_1.IRemoteAuthorityResolverService, remoteAuthorityResolverService);
                // Sign
                const signService = new signService_1.SignService();
                serviceCollection.set(sign_1.ISignService, signService);
                const remoteAgentService = this._register(new remoteAgentServiceImpl_1.RemoteAgentService(this.environmentService.configuration, this.environmentService, remoteAuthorityResolverService, signService, logService));
                serviceCollection.set(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
                // Files
                const fileService = this._register(new fileService_1.FileService(logService));
                serviceCollection.set(files_1.IFileService, fileService);
                const diskFileSystemProvider = this._register(new diskFileSystemProvider_1.DiskFileSystemProvider(logService));
                fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
                // User Data Provider
                fileService.registerProvider(network_1.Schemas.userData, new fileUserDataProvider_1.FileUserDataProvider(this.environmentService.appSettingsHome, this.environmentService.backupHome, diskFileSystemProvider, this.environmentService));
                const connection = remoteAgentService.getConnection();
                if (connection) {
                    const channel = connection.getChannel(remoteAgentFileSystemChannel_1.REMOTE_FILE_SYSTEM_CHANNEL_NAME);
                    const remoteFileSystemProvider = this._register(new remoteAgentFileSystemChannel_1.RemoteExtensionsFileSystemProvider(channel, remoteAgentService.getEnvironment()));
                    fileService.registerProvider(network_1.Schemas.vscodeRemote, remoteFileSystemProvider);
                }
                const payload = yield this.resolveWorkspaceInitializationPayload();
                const services = yield Promise.all([
                    this.createWorkspaceService(payload, fileService, remoteAgentService, logService).then(service => {
                        // Workspace
                        serviceCollection.set(workspace_1.IWorkspaceContextService, service);
                        // Configuration
                        serviceCollection.set(configuration_1.IConfigurationService, service);
                        return service;
                    }),
                    this.createStorageService(payload, logService, mainProcessService).then(service => {
                        // Storage
                        serviceCollection.set(storage_1.IStorageService, service);
                        return service;
                    })
                ]);
                return { serviceCollection, logService, storageService: services[1] };
            });
        }
        resolveWorkspaceInitializationPayload() {
            return __awaiter(this, void 0, void 0, function* () {
                // Multi-root workspace
                if (this.environmentService.configuration.workspace) {
                    return this.environmentService.configuration.workspace;
                }
                // Single-folder workspace
                let workspaceInitializationPayload;
                if (this.environmentService.configuration.folderUri) {
                    workspaceInitializationPayload = yield this.resolveSingleFolderWorkspaceInitializationPayload(this.environmentService.configuration.folderUri);
                }
                // Fallback to empty workspace if we have no payload yet.
                if (!workspaceInitializationPayload) {
                    let id;
                    if (this.environmentService.configuration.backupWorkspaceResource) {
                        id = resources_1.basename(this.environmentService.configuration.backupWorkspaceResource); // we know the backupPath must be a unique path so we leverage its name as workspace ID
                    }
                    else if (this.environmentService.isExtensionDevelopment) {
                        id = 'ext-dev'; // extension development window never stores backups and is a singleton
                    }
                    else {
                        throw new Error('Unexpected window configuration without backupPath');
                    }
                    workspaceInitializationPayload = { id };
                }
                return workspaceInitializationPayload;
            });
        }
        resolveSingleFolderWorkspaceInitializationPayload(folderUri) {
            return __awaiter(this, void 0, void 0, function* () {
                // Return early the folder is not local
                if (folderUri.scheme !== network_1.Schemas.file) {
                    return { id: crypto_1.createHash('md5').update(folderUri.toString()).digest('hex'), folder: folderUri };
                }
                function computeLocalDiskFolderId(folder, stat) {
                    let ctime;
                    if (platform_1.isLinux) {
                        ctime = stat.ino; // Linux: birthtime is ctime, so we cannot use it! We use the ino instead!
                    }
                    else if (platform_1.isMacintosh) {
                        ctime = stat.birthtime.getTime(); // macOS: birthtime is fine to use as is
                    }
                    else if (platform_1.isWindows) {
                        if (typeof stat.birthtimeMs === 'number') {
                            ctime = Math.floor(stat.birthtimeMs); // Windows: fix precision issue in node.js 8.x to get 7.x results (see https://github.com/nodejs/node/issues/19897)
                        }
                        else {
                            ctime = stat.birthtime.getTime();
                        }
                    }
                    // we use the ctime as extra salt to the ID so that we catch the case of a folder getting
                    // deleted and recreated. in that case we do not want to carry over previous state
                    return crypto_1.createHash('md5').update(folder.fsPath).update(ctime ? String(ctime) : '').digest('hex');
                }
                // For local: ensure path is absolute and exists
                try {
                    const sanitizedFolderPath = extpath_1.sanitizeFilePath(folderUri.fsPath, process.env['VSCODE_CWD'] || process.cwd());
                    const fileStat = yield pfs_1.stat(sanitizedFolderPath);
                    const sanitizedFolderUri = uri_1.URI.file(sanitizedFolderPath);
                    return {
                        id: computeLocalDiskFolderId(sanitizedFolderUri, fileStat),
                        folder: sanitizedFolderUri
                    };
                }
                catch (error) {
                    errors_1.onUnexpectedError(error);
                }
                return;
            });
        }
        createWorkspaceService(payload, fileService, remoteAgentService, logService) {
            return __awaiter(this, void 0, void 0, function* () {
                const workspaceService = new configurationService_1.WorkspaceService({ remoteAuthority: this.environmentService.configuration.remoteAuthority, configurationCache: new configurationCache_1.ConfigurationCache(this.environmentService) }, this.environmentService, fileService, remoteAgentService);
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
        createStorageService(payload, logService, mainProcessService) {
            return __awaiter(this, void 0, void 0, function* () {
                const globalStorageDatabase = new storageIpc_1.GlobalStorageDatabaseChannelClient(mainProcessService.getChannel('storage'));
                const storageService = new storageService_1.StorageService(globalStorageDatabase, logService, this.environmentService);
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
        createLogService(mainProcessService, environmentService) {
            const spdlogService = new spdlogService_1.SpdLogService(`renderer${this.environmentService.configuration.windowId}`, environmentService.logsPath, this.environmentService.configuration.logLevel);
            const consoleLogService = new log_1.ConsoleLogService(this.environmentService.configuration.logLevel);
            const logService = new log_1.MultiplexLogService([consoleLogService, spdlogService]);
            const logLevelClient = new logIpc_1.LogLevelSetterChannelClient(mainProcessService.getChannel('loglevel'));
            return new logIpc_1.FollowerLogService(logLevelClient, logService);
        }
    }
    function main(configuration) {
        const renderer = new CodeRendererMain(configuration);
        return renderer.open();
    }
    exports.main = main;
});
//# sourceMappingURL=desktop.main.js.map