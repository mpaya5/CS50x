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
define(["require", "exports", "electron", "vs/base/common/objects", "vs/base/common/platform", "vs/platform/product/node/product", "vs/platform/environment/node/argvHelper", "vs/platform/environment/node/argv", "vs/base/node/pfs", "vs/code/node/paths", "vs/platform/lifecycle/electron-main/lifecycleMain", "vs/base/parts/ipc/node/ipc.net", "vs/platform/launch/electron-main/launchService", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/instantiation/common/descriptors", "vs/platform/log/common/log", "vs/platform/state/node/stateService", "vs/platform/state/common/state", "vs/platform/environment/common/environment", "vs/platform/environment/node/environmentService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/node/configurationService", "vs/platform/request/common/request", "vs/platform/request/electron-main/requestService", "fs", "vs/code/electron-main/app", "vs/nls", "vs/base/common/labels", "vs/platform/log/node/spdlogService", "vs/platform/log/common/bufferLog", "vs/base/common/errors", "vs/platform/theme/electron-main/themeMainService", "vs/base/common/functional", "vs/platform/sign/common/sign", "vs/platform/sign/node/signService", "vs/platform/diagnostics/node/diagnosticsIpc", "vs/platform/update/node/update.config.contribution"], function (require, exports, electron_1, objects_1, platform, product_1, argvHelper_1, argv_1, pfs_1, paths_1, lifecycleMain_1, ipc_net_1, launchService_1, instantiationService_1, serviceCollection_1, descriptors_1, log_1, stateService_1, state_1, environment_1, environmentService_1, configuration_1, configurationService_1, request_1, requestService_1, fs, app_1, nls_1, labels_1, spdlogService_1, bufferLog_1, errors_1, themeMainService_1, functional_1, sign_1, signService_1, diagnosticsIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExpectedError extends Error {
        constructor() {
            super(...arguments);
            this.isExpected = true;
        }
    }
    class CodeMain {
        main() {
            // Set the error handler early enough so that we are not getting the
            // default electron error dialog popping up
            errors_1.setUnexpectedErrorHandler(err => console.error(err));
            // Parse arguments
            let args;
            try {
                args = argvHelper_1.parseMainProcessArgv(process.argv);
                args = paths_1.validatePaths(args);
            }
            catch (err) {
                console.error(err.message);
                electron_1.app.exit(1);
                return;
            }
            // If we are started with --wait create a random temporary file
            // and pass it over to the starting instance. We can use this file
            // to wait for it to be deleted to monitor that the edited file
            // is closed and then exit the waiting process.
            //
            // Note: we are not doing this if the wait marker has been already
            // added as argument. This can happen if Code was started from CLI.
            if (args.wait && !args.waitMarkerFilePath) {
                const waitMarkerFilePath = argv_1.createWaitMarkerFile(args.verbose);
                if (waitMarkerFilePath) {
                    argv_1.addArg(process.argv, '--waitMarkerFilePath', waitMarkerFilePath);
                    args.waitMarkerFilePath = waitMarkerFilePath;
                }
            }
            // Launch
            this.startup(args);
        }
        startup(args) {
            return __awaiter(this, void 0, void 0, function* () {
                // We need to buffer the spdlog logs until we are sure
                // we are the only instance running, otherwise we'll have concurrent
                // log file access on Windows (https://github.com/Microsoft/vscode/issues/41218)
                const bufferLogService = new bufferLog_1.BufferLogService();
                const [instantiationService, instanceEnvironment] = this.createServices(args, bufferLogService);
                try {
                    // Init services
                    yield instantiationService.invokeFunction((accessor) => __awaiter(this, void 0, void 0, function* () {
                        const environmentService = accessor.get(environment_1.IEnvironmentService);
                        const configurationService = accessor.get(configuration_1.IConfigurationService);
                        const stateService = accessor.get(state_1.IStateService);
                        try {
                            yield this.initServices(environmentService, configurationService, stateService);
                        }
                        catch (error) {
                            // Show a dialog for errors that can be resolved by the user
                            this.handleStartupDataDirError(environmentService, error);
                            throw error;
                        }
                    }));
                    // Startup
                    yield instantiationService.invokeFunction((accessor) => __awaiter(this, void 0, void 0, function* () {
                        const environmentService = accessor.get(environment_1.IEnvironmentService);
                        const logService = accessor.get(log_1.ILogService);
                        const lifecycleService = accessor.get(lifecycleMain_1.ILifecycleService);
                        const configurationService = accessor.get(configuration_1.IConfigurationService);
                        const mainIpcServer = yield this.doStartup(logService, environmentService, lifecycleService, instantiationService, true);
                        bufferLogService.logger = new spdlogService_1.SpdLogService('main', environmentService.logsPath, bufferLogService.getLevel());
                        functional_1.once(lifecycleService.onWillShutdown)(() => configurationService.dispose());
                        return instantiationService.createInstance(app_1.CodeApplication, mainIpcServer, instanceEnvironment).startup();
                    }));
                }
                catch (error) {
                    instantiationService.invokeFunction(this.quit, error);
                }
            });
        }
        createServices(args, bufferLogService) {
            const services = new serviceCollection_1.ServiceCollection();
            const environmentService = new environmentService_1.EnvironmentService(args, process.execPath);
            const instanceEnvironment = this.patchEnvironment(environmentService); // Patch `process.env` with the instance's environment
            services.set(environment_1.IEnvironmentService, environmentService);
            const logService = new log_1.MultiplexLogService([new log_1.ConsoleLogMainService(log_1.getLogLevel(environmentService)), bufferLogService]);
            process.once('exit', () => logService.dispose());
            services.set(log_1.ILogService, logService);
            services.set(configuration_1.IConfigurationService, new configurationService_1.ConfigurationService(environmentService.settingsResource));
            services.set(lifecycleMain_1.ILifecycleService, new descriptors_1.SyncDescriptor(lifecycleMain_1.LifecycleService));
            services.set(state_1.IStateService, new descriptors_1.SyncDescriptor(stateService_1.StateService));
            services.set(request_1.IRequestService, new descriptors_1.SyncDescriptor(requestService_1.RequestService));
            services.set(themeMainService_1.IThemeMainService, new descriptors_1.SyncDescriptor(themeMainService_1.ThemeMainService));
            services.set(sign_1.ISignService, new descriptors_1.SyncDescriptor(signService_1.SignService));
            return [new instantiationService_1.InstantiationService(services, true), instanceEnvironment];
        }
        initServices(environmentService, configurationService, stateService) {
            // Environment service (paths)
            const environmentServiceInitialization = Promise.all([
                environmentService.extensionsPath,
                environmentService.nodeCachedDataDir,
                environmentService.logsPath,
                environmentService.globalStorageHome,
                environmentService.workspaceStorageHome,
                environmentService.backupHome.fsPath
            ].map((path) => path ? pfs_1.mkdirp(path) : undefined));
            // Configuration service
            const configurationServiceInitialization = configurationService.initialize();
            // State service
            const stateServiceInitialization = stateService.init();
            return Promise.all([environmentServiceInitialization, configurationServiceInitialization, stateServiceInitialization]);
        }
        patchEnvironment(environmentService) {
            const instanceEnvironment = {
                VSCODE_IPC_HOOK: environmentService.mainIPCHandle,
                VSCODE_NLS_CONFIG: process.env['VSCODE_NLS_CONFIG'],
                VSCODE_LOGS: process.env['VSCODE_LOGS']
            };
            if (process.env['VSCODE_PORTABLE']) {
                instanceEnvironment['VSCODE_PORTABLE'] = process.env['VSCODE_PORTABLE'];
            }
            objects_1.assign(process.env, instanceEnvironment);
            return instanceEnvironment;
        }
        doStartup(logService, environmentService, lifecycleService, instantiationService, retry) {
            return __awaiter(this, void 0, void 0, function* () {
                // Try to setup a server for running. If that succeeds it means
                // we are the first instance to startup. Otherwise it is likely
                // that another instance is already running.
                let server;
                try {
                    server = yield ipc_net_1.serve(environmentService.mainIPCHandle);
                    functional_1.once(lifecycleService.onWillShutdown)(() => server.dispose());
                }
                catch (error) {
                    // Handle unexpected errors (the only expected error is EADDRINUSE that
                    // indicates a second instance of Code is running)
                    if (error.code !== 'EADDRINUSE') {
                        // Show a dialog for errors that can be resolved by the user
                        this.handleStartupDataDirError(environmentService, error);
                        // Any other runtime error is just printed to the console
                        throw error;
                    }
                    // Since we are the second instance, we do not want to show the dock
                    if (platform.isMacintosh) {
                        electron_1.app.dock.hide();
                    }
                    // there's a running instance, let's connect to it
                    let client;
                    try {
                        client = yield ipc_net_1.connect(environmentService.mainIPCHandle, 'main');
                    }
                    catch (error) {
                        // Handle unexpected connection errors by showing a dialog to the user
                        if (!retry || platform.isWindows || error.code !== 'ECONNREFUSED') {
                            if (error.code === 'EPERM') {
                                this.showStartupWarningDialog(nls_1.localize('secondInstanceAdmin', "A second instance of {0} is already running as administrator.", product_1.default.nameShort), nls_1.localize('secondInstanceAdminDetail', "Please close the other instance and try again."));
                            }
                            throw error;
                        }
                        // it happens on Linux and OS X that the pipe is left behind
                        // let's delete it, since we can't connect to it and then
                        // retry the whole thing
                        try {
                            fs.unlinkSync(environmentService.mainIPCHandle);
                        }
                        catch (error) {
                            logService.warn('Could not delete obsolete instance handle', error);
                            throw error;
                        }
                        return this.doStartup(logService, environmentService, lifecycleService, instantiationService, false);
                    }
                    // Tests from CLI require to be the only instance currently
                    if (environmentService.extensionTestsLocationURI && !environmentService.debugExtensionHost.break) {
                        const msg = 'Running extension tests from the command line is currently only supported if no other instance of Code is running.';
                        logService.error(msg);
                        client.dispose();
                        throw new Error(msg);
                    }
                    // Show a warning dialog after some timeout if it takes long to talk to the other instance
                    // Skip this if we are running with --wait where it is expected that we wait for a while.
                    // Also skip when gathering diagnostics (--status) which can take a longer time.
                    let startupWarningDialogHandle = undefined;
                    if (!environmentService.wait && !environmentService.status) {
                        startupWarningDialogHandle = setTimeout(() => {
                            this.showStartupWarningDialog(nls_1.localize('secondInstanceNoResponse', "Another instance of {0} is running but not responding", product_1.default.nameShort), nls_1.localize('secondInstanceNoResponseDetail', "Please close all other instances and try again."));
                        }, 10000);
                    }
                    const channel = client.getChannel('launch');
                    const launchClient = new launchService_1.LaunchChannelClient(channel);
                    // Process Info
                    if (environmentService.args.status) {
                        return instantiationService.invokeFunction((accessor) => __awaiter(this, void 0, void 0, function* () {
                            // Create a diagnostic service connected to the existing shared process
                            const sharedProcessClient = yield ipc_net_1.connect(environmentService.sharedIPCHandle, 'main');
                            const diagnosticsChannel = sharedProcessClient.getChannel('diagnostics');
                            const diagnosticsService = new diagnosticsIpc_1.DiagnosticsService(diagnosticsChannel);
                            const mainProcessInfo = yield launchClient.getMainProcessInfo();
                            const remoteDiagnostics = yield launchClient.getRemoteDiagnostics({ includeProcesses: true, includeWorkspaceMetadata: true });
                            const diagnostics = yield diagnosticsService.getDiagnostics(mainProcessInfo, remoteDiagnostics);
                            console.log(diagnostics);
                            throw new ExpectedError();
                        }));
                    }
                    // Windows: allow to set foreground
                    if (platform.isWindows) {
                        yield this.windowsAllowSetForegroundWindow(launchClient, logService);
                    }
                    // Send environment over...
                    logService.trace('Sending env to running instance...');
                    yield launchClient.start(environmentService.args, process.env);
                    // Cleanup
                    yield client.dispose();
                    // Now that we started, make sure the warning dialog is prevented
                    if (startupWarningDialogHandle) {
                        clearTimeout(startupWarningDialogHandle);
                    }
                    throw new ExpectedError('Sent env to running instance. Terminating...');
                }
                // Print --status usage info
                if (environmentService.args.status) {
                    logService.warn('Warning: The --status argument can only be used if Code is already running. Please run it again after Code has started.');
                    throw new ExpectedError('Terminating...');
                }
                // dock might be hidden at this case due to a retry
                if (platform.isMacintosh) {
                    electron_1.app.dock.show();
                }
                // Set the VSCODE_PID variable here when we are sure we are the first
                // instance to startup. Otherwise we would wrongly overwrite the PID
                process.env['VSCODE_PID'] = String(process.pid);
                return server;
            });
        }
        handleStartupDataDirError(environmentService, error) {
            if (error.code === 'EACCES' || error.code === 'EPERM') {
                const directories = [environmentService.userDataPath];
                if (environmentService.extensionsPath) {
                    directories.push(environmentService.extensionsPath);
                }
                if (environmentService_1.xdgRuntimeDir) {
                    directories.push(environmentService_1.xdgRuntimeDir);
                }
                this.showStartupWarningDialog(nls_1.localize('startupDataDirError', "Unable to write program user data."), nls_1.localize('startupUserDataAndExtensionsDirErrorDetail', "Please make sure the following directories are writeable:\n\n{0}", directories.join('\n')));
            }
        }
        showStartupWarningDialog(message, detail) {
            electron_1.dialog.showMessageBox({
                title: product_1.default.nameLong,
                type: 'warning',
                buttons: [labels_1.mnemonicButtonLabel(nls_1.localize({ key: 'close', comment: ['&& denotes a mnemonic'] }, "&&Close"))],
                message,
                detail,
                noLink: true
            });
        }
        windowsAllowSetForegroundWindow(client, logService) {
            return __awaiter(this, void 0, void 0, function* () {
                if (platform.isWindows) {
                    const processId = yield client.getMainProcessId();
                    logService.trace('Sending some foreground love to the running instance:', processId);
                    try {
                        (yield new Promise((resolve_1, reject_1) => { require(['windows-foreground-love'], resolve_1, reject_1); })).allowSetForegroundWindow(processId);
                    }
                    catch (error) {
                        logService.error(error);
                    }
                }
            });
        }
        quit(accessor, reason) {
            const logService = accessor.get(log_1.ILogService);
            const lifecycleService = accessor.get(lifecycleMain_1.ILifecycleService);
            let exitCode = 0;
            if (reason) {
                if (reason.isExpected) {
                    if (reason.message) {
                        logService.trace(reason.message);
                    }
                }
                else {
                    exitCode = 1; // signal error to the outside
                    if (reason.stack) {
                        logService.error(reason.stack);
                    }
                    else {
                        logService.error(`Startup error: ${reason.toString()}`);
                    }
                }
            }
            lifecycleService.kill(exitCode);
        }
    }
    // Main Startup
    const code = new CodeMain();
    code.main();
});
//# sourceMappingURL=main.js.map