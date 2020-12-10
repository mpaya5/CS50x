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
define(["require", "exports", "electron", "vs/base/common/platform", "vs/code/electron-main/windows", "vs/platform/windows/common/windows", "vs/platform/windows/common/windowsIpc", "vs/platform/windows/electron-main/windowsService", "vs/platform/lifecycle/electron-main/lifecycleMain", "vs/code/node/shellEnv", "vs/platform/update/common/update", "vs/platform/update/node/updateIpc", "vs/base/parts/ipc/electron-main/ipc.electron-main", "vs/base/parts/ipc/node/ipc.net", "vs/code/electron-main/sharedProcess", "vs/platform/launch/electron-main/launchService", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/instantiation/common/descriptors", "vs/platform/log/common/log", "vs/platform/state/common/state", "vs/platform/environment/common/environment", "vs/platform/configuration/common/configuration", "vs/platform/url/common/url", "vs/platform/url/node/urlIpc", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/telemetry/node/telemetryIpc", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/node/commonProperties", "vs/base/parts/ipc/common/ipc", "vs/platform/product/node/product", "vs/platform/product/node/package", "vs/code/electron-main/auth", "vs/base/common/lifecycle", "vs/platform/windows/electron-main/windows", "vs/platform/history/common/history", "vs/base/common/uri", "vs/platform/workspaces/node/workspacesIpc", "vs/platform/workspaces/common/workspaces", "vs/base/node/id", "vs/platform/update/electron-main/updateService.win32", "vs/platform/update/electron-main/updateService.linux", "vs/platform/update/electron-main/updateService.darwin", "vs/platform/issue/node/issue", "vs/platform/issue/node/issueIpc", "vs/platform/issue/electron-main/issueService", "vs/platform/log/common/logIpc", "vs/base/common/errors", "vs/platform/url/electron-main/electronUrlListener", "vs/platform/driver/electron-main/driver", "vs/platform/menubar/node/menubar", "vs/platform/menubar/electron-main/menubarService", "vs/platform/menubar/node/menubarIpc", "vs/platform/environment/node/argv", "vs/base/common/async", "vs/base/parts/contextmenu/electron-main/contextmenu", "os", "vs/base/common/path", "vs/nls", "vs/base/common/network", "vs/platform/update/electron-main/updateService.snap", "vs/platform/storage/node/storageMainService", "vs/platform/storage/node/storageIpc", "vs/base/common/strings", "vs/platform/backup/electron-main/backupMainService", "vs/platform/backup/common/backup", "vs/platform/history/electron-main/historyMainService", "vs/platform/url/node/urlService", "vs/platform/workspaces/electron-main/workspacesMainService", "fs", "vs/platform/diagnostics/node/diagnosticsIpc", "vs/platform/diagnostics/node/diagnosticsService", "vs/platform/files/common/fileService", "vs/platform/files/common/files", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/debug/common/extensionHostDebugIpc"], function (require, exports, electron_1, platform_1, windows_1, windows_2, windowsIpc_1, windowsService_1, lifecycleMain_1, shellEnv_1, update_1, updateIpc_1, ipc_electron_main_1, ipc_net_1, sharedProcess_1, launchService_1, instantiation_1, serviceCollection_1, descriptors_1, log_1, state_1, environment_1, configuration_1, url_1, urlIpc_1, telemetry_1, telemetryUtils_1, telemetryIpc_1, telemetryService_1, commonProperties_1, ipc_1, product_1, package_1, auth_1, lifecycle_1, windows_3, history_1, uri_1, workspacesIpc_1, workspaces_1, id_1, updateService_win32_1, updateService_linux_1, updateService_darwin_1, issue_1, issueIpc_1, issueService_1, logIpc_1, errors_1, electronUrlListener_1, driver_1, menubar_1, menubarService_1, menubarIpc_1, argv_1, async_1, contextmenu_1, os_1, path_1, nls_1, network_1, updateService_snap_1, storageMainService_1, storageIpc_1, strings_1, backupMainService_1, backup_1, historyMainService_1, urlService_1, workspacesMainService_1, fs_1, diagnosticsIpc_1, diagnosticsService_1, fileService_1, files_1, diskFileSystemProvider_1, extensionHostDebugIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CodeApplication = class CodeApplication extends lifecycle_1.Disposable {
        constructor(mainIpcServer, userEnv, instantiationService, logService, environmentService, lifecycleService, configurationService, stateService) {
            super();
            this.mainIpcServer = mainIpcServer;
            this.userEnv = userEnv;
            this.instantiationService = instantiationService;
            this.logService = logService;
            this.environmentService = environmentService;
            this.lifecycleService = lifecycleService;
            this.configurationService = configurationService;
            this.stateService = stateService;
            this.registerListeners();
        }
        registerListeners() {
            // We handle uncaught exceptions here to prevent electron from opening a dialog to the user
            errors_1.setUnexpectedErrorHandler(err => this.onUnexpectedError(err));
            process.on('uncaughtException', err => this.onUnexpectedError(err));
            process.on('unhandledRejection', (reason) => errors_1.onUnexpectedError(reason));
            // Dispose on shutdown
            this.lifecycleService.onWillShutdown(() => this.dispose());
            // Contextmenu via IPC support
            contextmenu_1.registerContextMenuListener();
            electron_1.app.on('accessibility-support-changed', (event, accessibilitySupportEnabled) => {
                if (this.windowsMainService) {
                    this.windowsMainService.sendToAll('vscode:accessibilitySupportChanged', accessibilitySupportEnabled);
                }
            });
            electron_1.app.on('activate', (event, hasVisibleWindows) => {
                this.logService.trace('App#activate');
                // Mac only event: open new window when we get activated
                if (!hasVisibleWindows && this.windowsMainService) {
                    this.windowsMainService.openNewWindow(1 /* DOCK */);
                }
            });
            // Security related measures (https://electronjs.org/docs/tutorial/security)
            //
            // !!! DO NOT CHANGE without consulting the documentation !!!
            //
            // app.on('remote-get-guest-web-contents', event => event.preventDefault()); // TODO@Ben TODO@Matt revisit this need for <webview>
            electron_1.app.on('remote-require', (event, sender, module) => {
                this.logService.trace('App#on(remote-require): prevented');
                event.preventDefault();
            });
            electron_1.app.on('remote-get-global', (event, sender, module) => {
                this.logService.trace(`App#on(remote-get-global): prevented on ${module}`);
                event.preventDefault();
            });
            electron_1.app.on('remote-get-builtin', (event, sender, module) => {
                this.logService.trace(`App#on(remote-get-builtin): prevented on ${module}`);
                if (module !== 'clipboard') {
                    event.preventDefault();
                }
            });
            electron_1.app.on('remote-get-current-window', event => {
                this.logService.trace(`App#on(remote-get-current-window): prevented`);
                event.preventDefault();
            });
            electron_1.app.on('remote-get-current-web-contents', event => {
                if (this.environmentService.args.driver) {
                    return; // the driver needs access to web contents
                }
                this.logService.trace(`App#on(remote-get-current-web-contents): prevented`);
                event.preventDefault();
            });
            electron_1.app.on('web-contents-created', (_event, contents) => {
                contents.on('will-attach-webview', (event, webPreferences, params) => {
                    const isValidWebviewSource = (source) => {
                        if (!source) {
                            return false;
                        }
                        if (source === 'data:text/html;charset=utf-8,%3C%21DOCTYPE%20html%3E%0D%0A%3Chtml%20lang%3D%22en%22%20style%3D%22width%3A%20100%25%3B%20height%3A%20100%25%22%3E%0D%0A%3Chead%3E%0D%0A%09%3Ctitle%3EVirtual%20Document%3C%2Ftitle%3E%0D%0A%3C%2Fhead%3E%0D%0A%3Cbody%20style%3D%22margin%3A%200%3B%20overflow%3A%20hidden%3B%20width%3A%20100%25%3B%20height%3A%20100%25%22%3E%0D%0A%3C%2Fbody%3E%0D%0A%3C%2Fhtml%3E') {
                            return true;
                        }
                        const srcUri = uri_1.URI.parse(source).fsPath.toLowerCase();
                        const rootUri = uri_1.URI.file(this.environmentService.appRoot).fsPath.toLowerCase();
                        return strings_1.startsWith(srcUri, rootUri + path_1.sep);
                    };
                    // Ensure defaults
                    delete webPreferences.preload;
                    webPreferences.nodeIntegration = false;
                    // Verify URLs being loaded
                    if (isValidWebviewSource(params.src) && isValidWebviewSource(webPreferences.preloadURL)) {
                        return;
                    }
                    delete webPreferences.preloadUrl;
                    // Otherwise prevent loading
                    this.logService.error('webContents#web-contents-created: Prevented webview attach');
                    event.preventDefault();
                });
                contents.on('will-navigate', event => {
                    this.logService.error('webContents#will-navigate: Prevented webcontent navigation');
                    event.preventDefault();
                });
                contents.on('new-window', (event, url) => {
                    event.preventDefault(); // prevent code that wants to open links
                    electron_1.shell.openExternal(url);
                });
            });
            let macOpenFileURIs = [];
            let runningTimeout = null;
            electron_1.app.on('open-file', (event, path) => {
                this.logService.trace('App#open-file: ', path);
                event.preventDefault();
                // Keep in array because more might come!
                macOpenFileURIs.push(this.getURIToOpenFromPathSync(path));
                // Clear previous handler if any
                if (runningTimeout !== null) {
                    clearTimeout(runningTimeout);
                    runningTimeout = null;
                }
                // Handle paths delayed in case more are coming!
                runningTimeout = setTimeout(() => {
                    if (this.windowsMainService) {
                        this.windowsMainService.open({
                            context: 1 /* DOCK */ /* can also be opening from finder while app is running */,
                            cli: this.environmentService.args,
                            urisToOpen: macOpenFileURIs,
                            gotoLineMode: false,
                            preferNewWindow: true /* dropping on the dock or opening from finder prefers to open in a new window */
                        });
                        macOpenFileURIs = [];
                        runningTimeout = null;
                    }
                }, 100);
            });
            electron_1.app.on('new-window-for-tab', () => {
                if (this.windowsMainService) {
                    this.windowsMainService.openNewWindow(4 /* DESKTOP */); //macOS native tab "+" button
                }
            });
            electron_1.ipcMain.on('vscode:exit', (event, code) => {
                this.logService.trace('IPC#vscode:exit', code);
                this.dispose();
                this.lifecycleService.kill(code);
            });
            electron_1.ipcMain.on('vscode:fetchShellEnv', (event) => __awaiter(this, void 0, void 0, function* () {
                const webContents = event.sender;
                try {
                    const shellEnv = yield shellEnv_1.getShellEnvironment(this.logService, this.environmentService);
                    if (!webContents.isDestroyed()) {
                        webContents.send('vscode:acceptShellEnv', shellEnv);
                    }
                }
                catch (error) {
                    if (!webContents.isDestroyed()) {
                        webContents.send('vscode:acceptShellEnv', {});
                    }
                    this.logService.error('Error fetching shell env', error);
                }
            }));
            electron_1.ipcMain.on('vscode:toggleDevTools', (event) => event.sender.toggleDevTools());
            electron_1.ipcMain.on('vscode:openDevTools', (event) => event.sender.openDevTools());
            electron_1.ipcMain.on('vscode:reloadWindow', (event) => event.sender.reload());
            // Some listeners after window opened
            (() => __awaiter(this, void 0, void 0, function* () {
                yield this.lifecycleService.when(3 /* AfterWindowOpen */);
                // After waking up from sleep  (after window opened)
                electron_1.powerMonitor.on('resume', () => {
                    if (this.windowsMainService) {
                        this.windowsMainService.sendToAll('vscode:osResume', undefined);
                    }
                });
                // Keyboard layout changes (after window opened)
                const nativeKeymap = yield new Promise((resolve_1, reject_1) => { require(['native-keymap'], resolve_1, reject_1); });
                nativeKeymap.onDidChangeKeyboardLayout(() => {
                    if (this.windowsMainService) {
                        this.windowsMainService.sendToAll('vscode:keyboardLayoutChanged', false);
                    }
                });
            }))();
        }
        onUnexpectedError(err) {
            if (err) {
                // take only the message and stack property
                const friendlyError = {
                    message: err.message,
                    stack: err.stack
                };
                // handle on client side
                if (this.windowsMainService) {
                    this.windowsMainService.sendToFocused('vscode:reportError', JSON.stringify(friendlyError));
                }
            }
            this.logService.error(`[uncaught exception in main]: ${err}`);
            if (err.stack) {
                this.logService.error(err.stack);
            }
        }
        startup() {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.debug('Starting VS Code');
                this.logService.debug(`from: ${this.environmentService.appRoot}`);
                this.logService.debug('args:', this.environmentService.args);
                // Make sure we associate the program with the app user model id
                // This will help Windows to associate the running program with
                // any shortcut that is pinned to the taskbar and prevent showing
                // two icons in the taskbar for the same app.
                if (platform_1.isWindows && product_1.default.win32AppUserModelId) {
                    electron_1.app.setAppUserModelId(product_1.default.win32AppUserModelId);
                }
                // Fix native tabs on macOS 10.13
                // macOS enables a compatibility patch for any bundle ID beginning with
                // "com.microsoft.", which breaks native tabs for VS Code when using this
                // identifier (from the official build).
                // Explicitly opt out of the patch here before creating any windows.
                // See: https://github.com/Microsoft/vscode/issues/35361#issuecomment-399794085
                try {
                    if (platform_1.isMacintosh && this.configurationService.getValue('window.nativeTabs') === true && !electron_1.systemPreferences.getUserDefault('NSUseImprovedLayoutPass', 'boolean')) {
                        electron_1.systemPreferences.setUserDefault('NSUseImprovedLayoutPass', 'boolean', true);
                    }
                }
                catch (error) {
                    this.logService.error(error);
                }
                // Create Electron IPC Server
                const electronIpcServer = new ipc_electron_main_1.Server();
                // Resolve unique machine ID
                this.logService.trace('Resolving machine identifier...');
                const { machineId, trueMachineId } = yield this.resolveMachineId();
                this.logService.trace(`Resolved machine identifier: ${machineId} (trueMachineId: ${trueMachineId})`);
                // Spawn shared process after the first window has opened and 3s have passed
                const sharedProcess = this.instantiationService.createInstance(sharedProcess_1.SharedProcess, machineId, this.userEnv);
                const sharedProcessClient = sharedProcess.whenReady().then(() => ipc_net_1.connect(this.environmentService.sharedIPCHandle, 'main'));
                this.lifecycleService.when(3 /* AfterWindowOpen */).then(() => {
                    this._register(new async_1.RunOnceScheduler(() => __awaiter(this, void 0, void 0, function* () {
                        const userEnv = yield shellEnv_1.getShellEnvironment(this.logService, this.environmentService);
                        sharedProcess.spawn(userEnv);
                    }), 3000)).schedule();
                });
                // Services
                const appInstantiationService = yield this.createServices(machineId, trueMachineId, sharedProcess, sharedProcessClient);
                // Create driver
                if (this.environmentService.driverHandle) {
                    const server = yield driver_1.serve(electronIpcServer, this.environmentService.driverHandle, this.environmentService, appInstantiationService);
                    this.logService.info('Driver started at:', this.environmentService.driverHandle);
                    this._register(server);
                }
                // Setup Auth Handler
                const authHandler = appInstantiationService.createInstance(auth_1.ProxyAuthHandler);
                this._register(authHandler);
                // Open Windows
                const windows = appInstantiationService.invokeFunction(accessor => this.openFirstWindow(accessor, electronIpcServer, sharedProcessClient));
                // Post Open Windows Tasks
                this.afterWindowOpen();
                // Tracing: Stop tracing after windows are ready if enabled
                if (this.environmentService.args.trace) {
                    this.stopTracingEventually(windows);
                }
            });
        }
        resolveMachineId() {
            return __awaiter(this, void 0, void 0, function* () {
                // We cache the machineId for faster lookups on startup
                // and resolve it only once initially if not cached
                let machineId = this.stateService.getItem(CodeApplication.MACHINE_ID_KEY);
                if (!machineId) {
                    machineId = yield id_1.getMachineId();
                    this.stateService.setItem(CodeApplication.MACHINE_ID_KEY, machineId);
                }
                // Check if machineId is hashed iBridge Device
                let trueMachineId;
                if (platform_1.isMacintosh && machineId === '6c9d2bc8f91b89624add29c0abeae7fb42bf539fa1cdb2e3e57cd668fa9bcead') {
                    trueMachineId = this.stateService.getItem(CodeApplication.TRUE_MACHINE_ID_KEY);
                    if (!trueMachineId) {
                        trueMachineId = yield id_1.getMachineId();
                        this.stateService.setItem(CodeApplication.TRUE_MACHINE_ID_KEY, trueMachineId);
                    }
                }
                return { machineId, trueMachineId };
            });
        }
        createServices(machineId, trueMachineId, sharedProcess, sharedProcessClient) {
            return __awaiter(this, void 0, void 0, function* () {
                const services = new serviceCollection_1.ServiceCollection();
                // Files
                const fileService = this._register(new fileService_1.FileService(this.logService));
                services.set(files_1.IFileService, fileService);
                const diskFileSystemProvider = this._register(new diskFileSystemProvider_1.DiskFileSystemProvider(this.logService));
                fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
                switch (process.platform) {
                    case 'win32':
                        services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_win32_1.Win32UpdateService));
                        break;
                    case 'linux':
                        if (process.env.SNAP && process.env.SNAP_REVISION) {
                            services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_snap_1.SnapUpdateService, [process.env.SNAP, process.env.SNAP_REVISION]));
                        }
                        else {
                            services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_linux_1.LinuxUpdateService));
                        }
                        break;
                    case 'darwin':
                        services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_darwin_1.DarwinUpdateService));
                        break;
                }
                services.set(windows_3.IWindowsMainService, new descriptors_1.SyncDescriptor(windows_1.WindowsManager, [machineId, this.userEnv]));
                services.set(windows_2.IWindowsService, new descriptors_1.SyncDescriptor(windowsService_1.WindowsService, [sharedProcess]));
                services.set(launchService_1.ILaunchService, new descriptors_1.SyncDescriptor(launchService_1.LaunchService));
                const diagnosticsChannel = ipc_1.getDelayedChannel(sharedProcessClient.then(client => client.getChannel('diagnostics')));
                services.set(diagnosticsService_1.IDiagnosticsService, new descriptors_1.SyncDescriptor(diagnosticsIpc_1.DiagnosticsService, [diagnosticsChannel]));
                services.set(issue_1.IIssueService, new descriptors_1.SyncDescriptor(issueService_1.IssueService, [machineId, this.userEnv]));
                services.set(menubar_1.IMenubarService, new descriptors_1.SyncDescriptor(menubarService_1.MenubarService));
                const storageMainService = new storageMainService_1.StorageMainService(this.logService, this.environmentService);
                services.set(storageMainService_1.IStorageMainService, storageMainService);
                this.lifecycleService.onWillShutdown(e => e.join(storageMainService.close()));
                const backupMainService = new backupMainService_1.BackupMainService(this.environmentService, this.configurationService, this.logService);
                services.set(backup_1.IBackupMainService, backupMainService);
                services.set(history_1.IHistoryMainService, new descriptors_1.SyncDescriptor(historyMainService_1.HistoryMainService));
                services.set(url_1.IURLService, new descriptors_1.SyncDescriptor(urlService_1.URLService));
                services.set(workspaces_1.IWorkspacesMainService, new descriptors_1.SyncDescriptor(workspacesMainService_1.WorkspacesMainService));
                // Telemetry
                if (!this.environmentService.isExtensionDevelopment && !this.environmentService.args['disable-telemetry'] && !!product_1.default.enableTelemetry) {
                    const channel = ipc_1.getDelayedChannel(sharedProcessClient.then(client => client.getChannel('telemetryAppender')));
                    const appender = telemetryUtils_1.combinedAppender(new telemetryIpc_1.TelemetryAppenderClient(channel), new telemetryUtils_1.LogAppender(this.logService));
                    const commonProperties = commonProperties_1.resolveCommonProperties(product_1.default.commit, package_1.default.version, machineId, product_1.default.msftInternalDomains, this.environmentService.installSourcePath);
                    const piiPaths = this.environmentService.extensionsPath ? [this.environmentService.appRoot, this.environmentService.extensionsPath] : [this.environmentService.appRoot];
                    const config = { appender, commonProperties, piiPaths, trueMachineId };
                    services.set(telemetry_1.ITelemetryService, new descriptors_1.SyncDescriptor(telemetryService_1.TelemetryService, [config]));
                }
                else {
                    services.set(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
                }
                // Init services that require it
                yield backupMainService.initialize();
                return this.instantiationService.createChild(services);
            });
        }
        stopTracingEventually(windows) {
            this.logService.info(`Tracing: waiting for windows to get ready...`);
            let recordingStopped = false;
            const stopRecording = (timeout) => {
                if (recordingStopped) {
                    return;
                }
                recordingStopped = true; // only once
                electron_1.contentTracing.stopRecording(path_1.join(os_1.homedir(), `${product_1.default.applicationName}-${Math.random().toString(16).slice(-4)}.trace.txt`), path => {
                    if (!timeout) {
                        if (this.windowsMainService) {
                            this.windowsMainService.showMessageBox({
                                type: 'info',
                                message: nls_1.localize('trace.message', "Successfully created trace."),
                                detail: nls_1.localize('trace.detail', "Please create an issue and manually attach the following file:\n{0}", path),
                                buttons: [nls_1.localize('trace.ok', "Ok")]
                            }, this.windowsMainService.getLastActiveWindow());
                        }
                    }
                    else {
                        this.logService.info(`Tracing: data recorded (after 30s timeout) to ${path}`);
                    }
                });
            };
            // Wait up to 30s before creating the trace anyways
            const timeoutHandle = setTimeout(() => stopRecording(true), 30000);
            // Wait for all windows to get ready and stop tracing then
            Promise.all(windows.map(window => window.ready())).then(() => {
                clearTimeout(timeoutHandle);
                stopRecording(false);
            });
        }
        openFirstWindow(accessor, electronIpcServer, sharedProcessClient) {
            // Register more Main IPC services
            const launchService = accessor.get(launchService_1.ILaunchService);
            const launchChannel = new launchService_1.LaunchChannel(launchService);
            this.mainIpcServer.registerChannel('launch', launchChannel);
            // Register more Electron IPC services
            const updateService = accessor.get(update_1.IUpdateService);
            const updateChannel = new updateIpc_1.UpdateChannel(updateService);
            electronIpcServer.registerChannel('update', updateChannel);
            const issueService = accessor.get(issue_1.IIssueService);
            const issueChannel = new issueIpc_1.IssueChannel(issueService);
            electronIpcServer.registerChannel('issue', issueChannel);
            const workspacesService = accessor.get(workspaces_1.IWorkspacesMainService);
            const workspacesChannel = new workspacesIpc_1.WorkspacesChannel(workspacesService);
            electronIpcServer.registerChannel('workspaces', workspacesChannel);
            const windowsService = accessor.get(windows_2.IWindowsService);
            const windowsChannel = new windowsIpc_1.WindowsChannel(windowsService);
            electronIpcServer.registerChannel('windows', windowsChannel);
            sharedProcessClient.then(client => client.registerChannel('windows', windowsChannel));
            const menubarService = accessor.get(menubar_1.IMenubarService);
            const menubarChannel = new menubarIpc_1.MenubarChannel(menubarService);
            electronIpcServer.registerChannel('menubar', menubarChannel);
            const urlService = accessor.get(url_1.IURLService);
            const urlChannel = new urlIpc_1.URLServiceChannel(urlService);
            electronIpcServer.registerChannel('url', urlChannel);
            const storageMainService = accessor.get(storageMainService_1.IStorageMainService);
            const storageChannel = this._register(new storageIpc_1.GlobalStorageDatabaseChannel(this.logService, storageMainService));
            electronIpcServer.registerChannel('storage', storageChannel);
            // Log level management
            const logLevelChannel = new logIpc_1.LogLevelSetterChannel(accessor.get(log_1.ILogService));
            electronIpcServer.registerChannel('loglevel', logLevelChannel);
            sharedProcessClient.then(client => client.registerChannel('loglevel', logLevelChannel));
            // ExtensionHost Debug broadcast service
            electronIpcServer.registerChannel(extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel.ChannelName, new extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel());
            // Signal phase: ready (services set)
            this.lifecycleService.phase = 2 /* Ready */;
            // Propagate to clients
            const windowsMainService = this.windowsMainService = accessor.get(windows_3.IWindowsMainService);
            // Create a URL handler which forwards to the last active window
            const activeWindowManager = new windows_2.ActiveWindowManager(windowsService);
            const activeWindowRouter = new ipc_1.StaticRouter(ctx => activeWindowManager.getActiveClientId().then(id => ctx === id));
            const urlHandlerChannel = electronIpcServer.getChannel('urlHandler', activeWindowRouter);
            const multiplexURLHandler = new urlIpc_1.URLHandlerChannelClient(urlHandlerChannel);
            // On Mac, Code can be running without any open windows, so we must create a window to handle urls,
            // if there is none
            if (platform_1.isMacintosh) {
                const environmentService = accessor.get(environment_1.IEnvironmentService);
                urlService.registerHandler({
                    handleURL(uri) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (windowsMainService.getWindowCount() === 0) {
                                const cli = Object.assign({}, environmentService.args);
                                const [window] = windowsMainService.open({ context: 5 /* API */, cli, forceEmpty: true, gotoLineMode: true });
                                yield window.ready();
                                return urlService.open(uri);
                            }
                            return false;
                        });
                    }
                });
            }
            // Register the multiple URL handler
            urlService.registerHandler(multiplexURLHandler);
            // Watch Electron URLs and forward them to the UrlService
            const args = this.environmentService.args;
            const urls = args['open-url'] ? args._urls : [];
            const urlListener = new electronUrlListener_1.ElectronURLListener(urls || [], urlService, windowsMainService);
            this._register(urlListener);
            // Open our first window
            const macOpenFiles = global.macOpenFiles;
            const context = !!process.env['VSCODE_CLI'] ? 0 /* CLI */ : 4 /* DESKTOP */;
            const hasCliArgs = argv_1.hasArgs(args._);
            const hasFolderURIs = argv_1.hasArgs(args['folder-uri']);
            const hasFileURIs = argv_1.hasArgs(args['file-uri']);
            const noRecentEntry = args['skip-add-to-recently-opened'] === true;
            const waitMarkerFileURI = args.wait && args.waitMarkerFilePath ? uri_1.URI.file(args.waitMarkerFilePath) : undefined;
            // new window if "-n" was used without paths
            if (args['new-window'] && !hasCliArgs && !hasFolderURIs && !hasFileURIs) {
                return windowsMainService.open({
                    context,
                    cli: args,
                    forceNewWindow: true,
                    forceEmpty: true,
                    noRecentEntry,
                    waitMarkerFileURI,
                    initialStartup: true
                });
            }
            // mac: open-file event received on startup
            if (macOpenFiles && macOpenFiles.length && !hasCliArgs && !hasFolderURIs && !hasFileURIs) {
                return windowsMainService.open({
                    context: 1 /* DOCK */,
                    cli: args,
                    urisToOpen: macOpenFiles.map(file => this.getURIToOpenFromPathSync(file)),
                    noRecentEntry,
                    waitMarkerFileURI,
                    gotoLineMode: false,
                    initialStartup: true
                });
            }
            // default: read paths from cli
            return windowsMainService.open({
                context,
                cli: args,
                forceNewWindow: args['new-window'] || (!hasCliArgs && args['unity-launch']),
                diffMode: args.diff,
                noRecentEntry,
                waitMarkerFileURI,
                gotoLineMode: args.goto,
                initialStartup: true
            });
        }
        getURIToOpenFromPathSync(path) {
            try {
                const fileStat = fs_1.statSync(path);
                if (fileStat.isDirectory()) {
                    return { folderUri: uri_1.URI.file(path) };
                }
                if (workspaces_1.hasWorkspaceFileExtension(path)) {
                    return { workspaceUri: uri_1.URI.file(path) };
                }
            }
            catch (error) {
                // ignore errors
            }
            return { fileUri: uri_1.URI.file(path) };
        }
        afterWindowOpen() {
            // Signal phase: after window open
            this.lifecycleService.phase = 3 /* AfterWindowOpen */;
            // Remote Authorities
            this.handleRemoteAuthorities();
        }
        handleRemoteAuthorities() {
            electron_1.protocol.registerHttpProtocol(network_1.Schemas.vscodeRemoteResource, (request, callback) => {
                callback({
                    url: request.url.replace(/^vscode-remote-resource:/, 'http:'),
                    method: request.method
                });
            });
        }
    };
    CodeApplication.MACHINE_ID_KEY = 'telemetry.machineId';
    CodeApplication.TRUE_MACHINE_ID_KEY = 'telemetry.trueMachineId';
    CodeApplication = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, log_1.ILogService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, lifecycleMain_1.ILifecycleService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, state_1.IStateService)
    ], CodeApplication);
    exports.CodeApplication = CodeApplication;
});
//# sourceMappingURL=app.js.map