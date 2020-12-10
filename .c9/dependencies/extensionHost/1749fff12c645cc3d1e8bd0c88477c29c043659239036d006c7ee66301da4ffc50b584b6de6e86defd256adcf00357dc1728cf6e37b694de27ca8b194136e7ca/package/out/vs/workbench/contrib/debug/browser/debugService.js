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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/severity", "vs/base/browser/ui/aria/aria", "vs/platform/contextkey/common/contextkey", "vs/platform/markers/common/markers", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/services/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/files/common/files", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/debugViewModel", "vs/workbench/contrib/debug/browser/debugActions", "vs/workbench/contrib/debug/browser/debugConfigurationManager", "vs/workbench/contrib/markers/browser/constants", "vs/workbench/contrib/tasks/common/taskService", "vs/workbench/contrib/files/common/files", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/textfile/common/textfiles", "vs/platform/configuration/common/configuration", "vs/platform/workspace/common/workspace", "vs/workbench/services/editor/common/editorService", "vs/base/common/console", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/base/common/actions", "vs/base/common/objects", "vs/workbench/contrib/debug/browser/debugSession", "vs/base/common/lifecycle", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugUtils", "vs/base/common/errorsWithActions", "vs/base/common/async", "vs/platform/debug/common/extensionHostDebug", "vs/editor/browser/editorBrowser", "vs/base/common/cancellation"], function (require, exports, nls, event_1, uri_1, arrays_1, errors, severity_1, aria, contextkey_1, markers_1, lifecycle_1, extensions_1, instantiation_1, files_1, telemetry_1, storage_1, debugModel_1, debugViewModel_1, debugactions, debugConfigurationManager_1, constants_1, taskService_1, files_2, viewlet_1, panelService_1, layoutService_1, textfiles_1, configuration_1, workspace_1, editorService_1, console_1, dialogs_1, notification_1, actions_1, objects_1, debugSession_1, lifecycle_2, debug_1, debugUtils_1, errorsWithActions_1, async_1, extensionHostDebug_1, editorBrowser_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const DEBUG_BREAKPOINTS_KEY = 'debug.breakpoint';
    const DEBUG_FUNCTION_BREAKPOINTS_KEY = 'debug.functionbreakpoint';
    const DEBUG_DATA_BREAKPOINTS_KEY = 'debug.databreakpoint';
    const DEBUG_EXCEPTION_BREAKPOINTS_KEY = 'debug.exceptionbreakpoint';
    const DEBUG_WATCH_EXPRESSIONS_KEY = 'debug.watchexpressions';
    function once(match, event) {
        return (listener, thisArgs = null, disposables) => {
            const result = event(e => {
                if (match(e)) {
                    result.dispose();
                    return listener.call(thisArgs, e);
                }
            }, null, disposables);
            return result;
        };
    }
    var TaskRunResult;
    (function (TaskRunResult) {
        TaskRunResult[TaskRunResult["Failure"] = 0] = "Failure";
        TaskRunResult[TaskRunResult["Success"] = 1] = "Success";
    })(TaskRunResult || (TaskRunResult = {}));
    let DebugService = class DebugService {
        constructor(storageService, editorService, textFileService, viewletService, panelService, notificationService, dialogService, layoutService, telemetryService, contextService, contextKeyService, lifecycleService, instantiationService, extensionService, markerService, taskService, fileService, configurationService, extensionHostDebugService) {
            this.storageService = storageService;
            this.editorService = editorService;
            this.textFileService = textFileService;
            this.viewletService = viewletService;
            this.panelService = panelService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.layoutService = layoutService;
            this.telemetryService = telemetryService;
            this.contextService = contextService;
            this.lifecycleService = lifecycleService;
            this.instantiationService = instantiationService;
            this.extensionService = extensionService;
            this.markerService = markerService;
            this.taskService = taskService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.extensionHostDebugService = extensionHostDebugService;
            this.initializing = false;
            this.toDispose = [];
            this.breakpointsToSendOnResourceSaved = new Set();
            this._onDidChangeState = new event_1.Emitter();
            this._onDidNewSession = new event_1.Emitter();
            this._onWillNewSession = new event_1.Emitter();
            this._onDidEndSession = new event_1.Emitter();
            this.configurationManager = this.instantiationService.createInstance(debugConfigurationManager_1.ConfigurationManager, this);
            this.toDispose.push(this.configurationManager);
            this.debugType = debug_1.CONTEXT_DEBUG_TYPE.bindTo(contextKeyService);
            this.debugState = debug_1.CONTEXT_DEBUG_STATE.bindTo(contextKeyService);
            this.inDebugMode = debug_1.CONTEXT_IN_DEBUG_MODE.bindTo(contextKeyService);
            this.model = new debugModel_1.DebugModel(this.loadBreakpoints(), this.loadFunctionBreakpoints(), this.loadExceptionBreakpoints(), this.loadDataBreakpoints(), this.loadWatchExpressions(), this.textFileService);
            this.toDispose.push(this.model);
            this.viewModel = new debugViewModel_1.ViewModel(contextKeyService);
            this.toDispose.push(this.fileService.onFileChanges(e => this.onFileChanges(e)));
            this.lifecycleService.onShutdown(this.dispose, this);
            this.toDispose.push(this.extensionHostDebugService.onAttachSession(event => {
                const session = this.model.getSession(event.sessionId, true);
                if (session) {
                    // EH was started in debug mode -> attach to it
                    session.configuration.request = 'attach';
                    session.configuration.port = event.port;
                    session.setSubId(event.subId);
                    this.launchOrAttachToSession(session).then(undefined, errors.onUnexpectedError);
                }
            }));
            this.toDispose.push(this.extensionHostDebugService.onTerminateSession(event => {
                const session = this.model.getSession(event.sessionId);
                if (session && session.subId === event.subId) {
                    session.disconnect().then(undefined, errors.onUnexpectedError);
                }
            }));
            this.toDispose.push(this.extensionHostDebugService.onLogToSession(event => {
                const session = this.model.getSession(event.sessionId, true);
                if (session) {
                    // extension logged output -> show it in REPL
                    const sev = event.log.severity === 'warn' ? severity_1.default.Warning : event.log.severity === 'error' ? severity_1.default.Error : severity_1.default.Info;
                    const { args, stack } = console_1.parse(event.log);
                    const frame = !!stack ? console_1.getFirstFrame(stack) : undefined;
                    session.logToRepl(sev, args, frame);
                }
            }));
            this.toDispose.push(this.viewModel.onDidFocusStackFrame(() => {
                this.onStateChange();
            }));
            this.toDispose.push(this.viewModel.onDidFocusSession(session => {
                const id = session ? session.getId() : undefined;
                this.model.setBreakpointsSessionId(id);
                this.onStateChange();
            }));
        }
        getModel() {
            return this.model;
        }
        getViewModel() {
            return this.viewModel;
        }
        getConfigurationManager() {
            return this.configurationManager;
        }
        sourceIsNotAvailable(uri) {
            this.model.sourceIsNotAvailable(uri);
        }
        dispose() {
            this.toDispose = lifecycle_2.dispose(this.toDispose);
        }
        //---- state management
        get state() {
            const focusedSession = this.viewModel.focusedSession;
            if (focusedSession) {
                return focusedSession.state;
            }
            return this.initializing ? 1 /* Initializing */ : 0 /* Inactive */;
        }
        startInitializingState() {
            if (!this.initializing) {
                this.initializing = true;
                this.onStateChange();
            }
        }
        endInitializingState() {
            if (this.initCancellationToken) {
                this.initCancellationToken.cancel();
                this.initCancellationToken = undefined;
            }
            if (this.initializing) {
                this.initializing = false;
                this.onStateChange();
            }
        }
        onStateChange() {
            const state = this.state;
            if (this.previousState !== state) {
                this.debugState.set(debug_1.getStateLabel(state));
                this.inDebugMode.set(state !== 0 /* Inactive */);
                this.previousState = state;
                this._onDidChangeState.fire(state);
            }
        }
        get onDidChangeState() {
            return this._onDidChangeState.event;
        }
        get onDidNewSession() {
            return this._onDidNewSession.event;
        }
        get onWillNewSession() {
            return this._onWillNewSession.event;
        }
        get onDidEndSession() {
            return this._onDidEndSession.event;
        }
        //---- life cycle management
        /**
         * main entry point
         * properly manages compounds, checks for errors and handles the initializing state.
         */
        startDebugging(launch, configOrName, noDebug = false, parentSession) {
            this.startInitializingState();
            // make sure to save all files and that the configuration is up to date
            return this.extensionService.activateByEvent('onDebug').then(() => {
                return this.textFileService.saveAll().then(() => this.configurationService.reloadConfiguration(launch ? launch.workspace : undefined).then(() => {
                    return this.extensionService.whenInstalledExtensionsRegistered().then(() => {
                        let config;
                        let compound;
                        if (!configOrName) {
                            configOrName = this.configurationManager.selectedConfiguration.name;
                        }
                        if (typeof configOrName === 'string' && launch) {
                            config = launch.getConfiguration(configOrName);
                            compound = launch.getCompound(configOrName);
                            const sessions = this.model.getSessions();
                            const alreadyRunningMessage = nls.localize('configurationAlreadyRunning', "There is already a debug configuration \"{0}\" running.", configOrName);
                            if (sessions.some(s => s.configuration.name === configOrName && (!launch || !launch.workspace || !s.root || s.root.uri.toString() === launch.workspace.uri.toString()))) {
                                return Promise.reject(new Error(alreadyRunningMessage));
                            }
                            if (compound && compound.configurations && sessions.some(p => compound.configurations.indexOf(p.configuration.name) !== -1)) {
                                return Promise.reject(new Error(alreadyRunningMessage));
                            }
                        }
                        else if (typeof configOrName !== 'string') {
                            config = configOrName;
                        }
                        if (compound) {
                            // we are starting a compound debug, first do some error checking and than start each configuration in the compound
                            if (!compound.configurations) {
                                return Promise.reject(new Error(nls.localize({ key: 'compoundMustHaveConfigurations', comment: ['compound indicates a "compounds" configuration item', '"configurations" is an attribute and should not be localized'] }, "Compound must have \"configurations\" attribute set in order to start multiple configurations.")));
                            }
                            return Promise.all(compound.configurations.map(configData => {
                                const name = typeof configData === 'string' ? configData : configData.name;
                                if (name === compound.name) {
                                    return Promise.resolve(false);
                                }
                                let launchForName;
                                if (typeof configData === 'string') {
                                    const launchesContainingName = this.configurationManager.getLaunches().filter(l => !!l.getConfiguration(name));
                                    if (launchesContainingName.length === 1) {
                                        launchForName = launchesContainingName[0];
                                    }
                                    else if (launch && launchesContainingName.length > 1 && launchesContainingName.indexOf(launch) >= 0) {
                                        // If there are multiple launches containing the configuration give priority to the configuration in the current launch
                                        launchForName = launch;
                                    }
                                    else {
                                        return Promise.reject(new Error(launchesContainingName.length === 0 ? nls.localize('noConfigurationNameInWorkspace', "Could not find launch configuration '{0}' in the workspace.", name)
                                            : nls.localize('multipleConfigurationNamesInWorkspace', "There are multiple launch configurations '{0}' in the workspace. Use folder name to qualify the configuration.", name)));
                                    }
                                }
                                else if (configData.folder) {
                                    const launchesMatchingConfigData = this.configurationManager.getLaunches().filter(l => l.workspace && l.workspace.name === configData.folder && !!l.getConfiguration(configData.name));
                                    if (launchesMatchingConfigData.length === 1) {
                                        launchForName = launchesMatchingConfigData[0];
                                    }
                                    else {
                                        return Promise.reject(new Error(nls.localize('noFolderWithName', "Can not find folder with name '{0}' for configuration '{1}' in compound '{2}'.", configData.folder, configData.name, compound.name)));
                                    }
                                }
                                return this.createSession(launchForName, launchForName.getConfiguration(name), noDebug, parentSession);
                            })).then(values => values.every(success => !!success)); // Compound launch is a success only if each configuration launched successfully
                        }
                        if (configOrName && !config) {
                            const message = !!launch ? nls.localize('configMissing', "Configuration '{0}' is missing in 'launch.json'.", typeof configOrName === 'string' ? configOrName : JSON.stringify(configOrName)) :
                                nls.localize('launchJsonDoesNotExist', "'launch.json' does not exist.");
                            return Promise.reject(new Error(message));
                        }
                        return this.createSession(launch, config, noDebug, parentSession);
                    });
                }));
            }).then(success => {
                // make sure to get out of initializing state, and propagate the result
                this.endInitializingState();
                return success;
            }, err => {
                this.endInitializingState();
                return Promise.reject(err);
            });
        }
        /**
         * gets the debugger for the type, resolves configurations by providers, substitutes variables and runs prelaunch tasks
         */
        createSession(launch, config, noDebug, parentSession) {
            // We keep the debug type in a separate variable 'type' so that a no-folder config has no attributes.
            // Storing the type in the config would break extensions that assume that the no-folder case is indicated by an empty config.
            let type;
            if (config) {
                type = config.type;
            }
            else {
                // a no-folder workspace has no launch.config
                config = Object.create(null);
            }
            const unresolvedConfig = objects_1.deepClone(config);
            if (noDebug) {
                config.noDebug = true;
            }
            const debuggerThenable = type ? Promise.resolve() : this.configurationManager.guessDebugger().then(dbgr => { type = dbgr && dbgr.type; });
            return debuggerThenable.then(() => {
                this.initCancellationToken = new cancellation_1.CancellationTokenSource();
                return this.configurationManager.resolveConfigurationByProviders(launch && launch.workspace ? launch.workspace.uri : undefined, type, config, this.initCancellationToken.token).then(config => {
                    // a falsy config indicates an aborted launch
                    if (config && config.type) {
                        return this.substituteVariables(launch, config).then(resolvedConfig => {
                            if (!resolvedConfig) {
                                // User canceled resolving of interactive variables, silently return
                                return false;
                            }
                            if (!this.configurationManager.getDebugger(resolvedConfig.type) || (config.request !== 'attach' && config.request !== 'launch')) {
                                let message;
                                if (config.request !== 'attach' && config.request !== 'launch') {
                                    message = config.request ? nls.localize('debugRequestNotSupported', "Attribute '{0}' has an unsupported value '{1}' in the chosen debug configuration.", 'request', config.request)
                                        : nls.localize('debugRequesMissing', "Attribute '{0}' is missing from the chosen debug configuration.", 'request');
                                }
                                else {
                                    message = resolvedConfig.type ? nls.localize('debugTypeNotSupported', "Configured debug type '{0}' is not supported.", resolvedConfig.type) :
                                        nls.localize('debugTypeMissing', "Missing property 'type' for the chosen launch configuration.");
                                }
                                return this.showError(message).then(() => false);
                            }
                            const workspace = launch ? launch.workspace : undefined;
                            return this.runTaskAndCheckErrors(workspace, resolvedConfig.preLaunchTask).then(result => {
                                if (result === 1 /* Success */) {
                                    return this.doCreateSession(workspace, { resolved: resolvedConfig, unresolved: unresolvedConfig }, parentSession);
                                }
                                return false;
                            });
                        }, err => {
                            if (err && err.message) {
                                return this.showError(err.message).then(() => false);
                            }
                            if (this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                                return this.showError(nls.localize('noFolderWorkspaceDebugError', "The active file can not be debugged. Make sure it is saved and that you have a debug extension installed for that file type."))
                                    .then(() => false);
                            }
                            return !!launch && launch.openConfigFile(false, true, undefined, this.initCancellationToken ? this.initCancellationToken.token : undefined).then(() => false);
                        });
                    }
                    if (launch && type && config === null) { // show launch.json only for "config" being "null".
                        return launch.openConfigFile(false, true, type, this.initCancellationToken ? this.initCancellationToken.token : undefined).then(() => false);
                    }
                    return false;
                });
            });
        }
        /**
         * instantiates the new session, initializes the session, registers session listeners and reports telemetry
         */
        doCreateSession(root, configuration, parentSession) {
            const session = this.instantiationService.createInstance(debugSession_1.DebugSession, configuration, root, this.model, parentSession);
            this.model.addSession(session);
            // register listeners as the very first thing!
            this.registerSessionListeners(session);
            // since the Session is now properly registered under its ID and hooked, we can announce it
            // this event doesn't go to extensions
            this._onWillNewSession.fire(session);
            const openDebug = this.configurationService.getValue('debug').openDebug;
            // Open debug viewlet based on the visibility of the side bar and openDebug setting. Do not open for 'run without debug'
            if (!configuration.resolved.noDebug && (openDebug === 'openOnSessionStart' || (openDebug === 'openOnFirstSessionStart' && this.viewModel.firstSessionStart))) {
                this.viewletService.openViewlet(debug_1.VIEWLET_ID).then(undefined, errors.onUnexpectedError);
            }
            return this.launchOrAttachToSession(session).then(() => {
                const internalConsoleOptions = session.configuration.internalConsoleOptions || this.configurationService.getValue('debug').internalConsoleOptions;
                if (internalConsoleOptions === 'openOnSessionStart' || (this.viewModel.firstSessionStart && internalConsoleOptions === 'openOnFirstSessionStart')) {
                    this.panelService.openPanel(debug_1.REPL_ID, false);
                }
                this.viewModel.firstSessionStart = false;
                const showSubSessions = this.configurationService.getValue('debug').showSubSessionsInToolBar;
                const sessions = this.model.getSessions();
                const shownSessions = showSubSessions ? sessions : sessions.filter(s => !s.parentSession);
                if (shownSessions.length > 1) {
                    this.viewModel.setMultiSessionView(true);
                }
                // since the initialized response has arrived announce the new Session (including extensions)
                this._onDidNewSession.fire(session);
                return this.telemetryDebugSessionStart(root, session.configuration.type);
            }).then(() => true, (error) => {
                if (errors.isPromiseCanceledError(error)) {
                    // don't show 'canceled' error messages to the user #7906
                    return Promise.resolve(false);
                }
                // Show the repl if some error got logged there #5870
                if (session && session.getReplElements().length > 0) {
                    this.panelService.openPanel(debug_1.REPL_ID, false);
                }
                if (session.configuration && session.configuration.request === 'attach' && session.configuration.__autoAttach) {
                    // ignore attach timeouts in auto attach mode
                    return Promise.resolve(false);
                }
                const errorMessage = error instanceof Error ? error.message : error;
                this.telemetryDebugMisconfiguration(session.configuration ? session.configuration.type : undefined, errorMessage);
                return this.showError(errorMessage, errorsWithActions_1.isErrorWithActions(error) ? error.actions : []).then(() => false);
            });
        }
        launchOrAttachToSession(session, forceFocus = false) {
            const dbgr = this.configurationManager.getDebugger(session.configuration.type);
            return session.initialize(dbgr).then(() => {
                return session.launchOrAttach(session.configuration).then(() => {
                    if (forceFocus || !this.viewModel.focusedSession) {
                        this.focusStackFrame(undefined, undefined, session);
                    }
                });
            }).then(undefined, err => {
                session.shutdown();
                return Promise.reject(err);
            });
        }
        registerSessionListeners(session) {
            const sessionRunningScheduler = new async_1.RunOnceScheduler(() => {
                // Do not immediatly defocus the stack frame if the session is running
                if (session.state === 3 /* Running */ && this.viewModel.focusedSession === session) {
                    this.viewModel.setFocus(undefined, this.viewModel.focusedThread, session, false);
                }
            }, 200);
            this.toDispose.push(session.onDidChangeState(() => {
                if (session.state === 3 /* Running */ && this.viewModel.focusedSession === session) {
                    sessionRunningScheduler.schedule();
                }
                if (session === this.viewModel.focusedSession) {
                    this.onStateChange();
                }
            }));
            this.toDispose.push(session.onDidEndAdapter(adapterExitEvent => {
                if (adapterExitEvent.error) {
                    this.notificationService.error(nls.localize('debugAdapterCrash', "Debug adapter process has terminated unexpectedly ({0})", adapterExitEvent.error.message || adapterExitEvent.error.toString()));
                }
                // 'Run without debugging' mode VSCode must terminate the extension host. More details: #3905
                if (debugUtils_1.isExtensionHostDebugging(session.configuration) && session.state === 3 /* Running */ && session.configuration.noDebug) {
                    this.extensionHostDebugService.close(session.getId());
                }
                this.telemetryDebugSessionStop(session, adapterExitEvent);
                if (session.configuration.postDebugTask) {
                    this.runTask(session.root, session.configuration.postDebugTask).then(undefined, err => this.notificationService.error(err));
                }
                session.shutdown();
                this.endInitializingState();
                this._onDidEndSession.fire(session);
                const focusedSession = this.viewModel.focusedSession;
                if (focusedSession && focusedSession.getId() === session.getId()) {
                    this.focusStackFrame(undefined);
                }
                if (this.model.getSessions().length === 0) {
                    this.viewModel.setMultiSessionView(false);
                    if (this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */) && this.configurationService.getValue('debug').openExplorerOnEnd) {
                        this.viewletService.openViewlet(files_2.VIEWLET_ID);
                    }
                    // Data breakpoints that can not be persisted should be cleared when a session ends
                    const dataBreakpoints = this.model.getDataBreakpoints().filter(dbp => !dbp.canPersist);
                    dataBreakpoints.forEach(dbp => this.model.removeDataBreakpoints(dbp.getId()));
                }
            }));
        }
        restartSession(session, restartData) {
            return this.textFileService.saveAll().then(() => {
                const isAutoRestart = !!restartData;
                const runTasks = () => {
                    if (isAutoRestart) {
                        // Do not run preLaunch and postDebug tasks for automatic restarts
                        return Promise.resolve(1 /* Success */);
                    }
                    return this.runTask(session.root, session.configuration.postDebugTask)
                        .then(() => this.runTaskAndCheckErrors(session.root, session.configuration.preLaunchTask));
                };
                if (session.capabilities.supportsRestartRequest) {
                    return runTasks().then(taskResult => taskResult === 1 /* Success */ ? session.restart() : undefined);
                }
                if (debugUtils_1.isExtensionHostDebugging(session.configuration)) {
                    return runTasks().then(taskResult => taskResult === 1 /* Success */ ? this.extensionHostDebugService.reload(session.getId()) : undefined);
                }
                const shouldFocus = !!this.viewModel.focusedSession && session.getId() === this.viewModel.focusedSession.getId();
                // If the restart is automatic  -> disconnect, otherwise -> terminate #55064
                return (isAutoRestart ? session.disconnect(true) : session.terminate(true)).then(() => {
                    return new Promise((c, e) => {
                        setTimeout(() => {
                            runTasks().then(taskResult => {
                                if (taskResult !== 1 /* Success */) {
                                    return;
                                }
                                // Read the configuration again if a launch.json has been changed, if not just use the inmemory configuration
                                let needsToSubstitute = false;
                                let unresolved;
                                const launch = session.root ? this.configurationManager.getLaunch(session.root.uri) : undefined;
                                if (launch) {
                                    unresolved = launch.getConfiguration(session.configuration.name);
                                    if (unresolved && !objects_1.equals(unresolved, session.unresolvedConfiguration)) {
                                        // Take the type from the session since the debug extension might overwrite it #21316
                                        unresolved.type = session.configuration.type;
                                        unresolved.noDebug = session.configuration.noDebug;
                                        needsToSubstitute = true;
                                    }
                                }
                                let substitutionThenable = Promise.resolve(session.configuration);
                                if (launch && needsToSubstitute && unresolved) {
                                    this.initCancellationToken = new cancellation_1.CancellationTokenSource();
                                    substitutionThenable = this.configurationManager.resolveConfigurationByProviders(launch.workspace ? launch.workspace.uri : undefined, unresolved.type, unresolved, this.initCancellationToken.token)
                                        .then(resolved => {
                                        if (resolved) {
                                            // start debugging
                                            return this.substituteVariables(launch, resolved);
                                        }
                                        else if (resolved === null) {
                                            // abort debugging silently and open launch.json
                                            return Promise.resolve(null);
                                        }
                                        else {
                                            // abort debugging silently
                                            return Promise.resolve(undefined);
                                        }
                                    });
                                }
                                substitutionThenable.then(resolved => {
                                    if (!resolved) {
                                        return c(undefined);
                                    }
                                    session.setConfiguration({ resolved, unresolved });
                                    session.configuration.__restart = restartData;
                                    this.launchOrAttachToSession(session, shouldFocus).then(() => {
                                        this._onDidNewSession.fire(session);
                                        c(undefined);
                                    }, err => e(err));
                                });
                            });
                        }, 300);
                    });
                });
            });
        }
        stopSession(session) {
            if (session) {
                return session.terminate();
            }
            const sessions = this.model.getSessions();
            if (sessions.length === 0) {
                this.endInitializingState();
            }
            return Promise.all(sessions.map(s => s.terminate()));
        }
        substituteVariables(launch, config) {
            const dbg = this.configurationManager.getDebugger(config.type);
            if (dbg) {
                let folder = undefined;
                if (launch && launch.workspace) {
                    folder = launch.workspace;
                }
                else {
                    const folders = this.contextService.getWorkspace().folders;
                    if (folders.length === 1) {
                        folder = folders[0];
                    }
                }
                return dbg.substituteVariables(folder, config).then(config => {
                    return config;
                }, (err) => {
                    this.showError(err.message);
                    return undefined; // bail out
                });
            }
            return Promise.resolve(config);
        }
        showError(message, errorActions = []) {
            const configureAction = this.instantiationService.createInstance(debugactions.ConfigureAction, debugactions.ConfigureAction.ID, debugactions.ConfigureAction.LABEL);
            const actions = [...errorActions, configureAction];
            return this.dialogService.show(severity_1.default.Error, message, actions.map(a => a.label).concat(nls.localize('cancel', "Cancel")), { cancelId: actions.length }).then(choice => {
                if (choice < actions.length) {
                    return actions[choice].run();
                }
                return undefined;
            });
        }
        //---- task management
        runTaskAndCheckErrors(root, taskId) {
            const debugAnywayAction = new actions_1.Action('debug.debugAnyway', nls.localize('debugAnyway', "Debug Anyway"), undefined, true, () => Promise.resolve(1 /* Success */));
            return this.runTask(root, taskId).then((taskSummary) => {
                const errorCount = taskId ? this.markerService.getStatistics().errors : 0;
                const successExitCode = taskSummary && taskSummary.exitCode === 0;
                const failureExitCode = taskSummary && taskSummary.exitCode !== undefined && taskSummary.exitCode !== 0;
                if (successExitCode || (errorCount === 0 && !failureExitCode)) {
                    return 1 /* Success */;
                }
                const taskLabel = typeof taskId === 'string' ? taskId : taskId ? taskId.name : '';
                const message = errorCount > 1
                    ? nls.localize('preLaunchTaskErrors', "Errors exist after running preLaunchTask '{0}'.", taskLabel)
                    : errorCount === 1
                        ? nls.localize('preLaunchTaskError', "Error exists after running preLaunchTask '{0}'.", taskLabel)
                        : nls.localize('preLaunchTaskExitCode', "The preLaunchTask '{0}' terminated with exit code {1}.", taskLabel, taskSummary.exitCode);
                const showErrorsAction = new actions_1.Action('debug.showErrors', nls.localize('showErrors', "Show Errors"), undefined, true, () => {
                    this.panelService.openPanel(constants_1.default.MARKERS_PANEL_ID);
                    return Promise.resolve(0 /* Failure */);
                });
                return this.showError(message, [debugAnywayAction, showErrorsAction]);
            }, (err) => {
                return this.showError(err.message, [debugAnywayAction, this.taskService.configureAction()]);
            });
        }
        runTask(root, taskId) {
            if (!taskId) {
                return Promise.resolve(null);
            }
            if (!root) {
                return Promise.reject(new Error(nls.localize('invalidTaskReference', "Task '{0}' can not be referenced from a launch configuration that is in a different workspace folder.", typeof taskId === 'string' ? taskId : taskId.type)));
            }
            // run a task before starting a debug session
            return this.taskService.getTask(root, taskId).then(task => {
                if (!task) {
                    const errorMessage = typeof taskId === 'string'
                        ? nls.localize('DebugTaskNotFoundWithTaskId', "Could not find the task '{0}'.", taskId)
                        : nls.localize('DebugTaskNotFound', "Could not find the specified task.");
                    return Promise.reject(errorsWithActions_1.createErrorWithActions(errorMessage));
                }
                // If a task is missing the problem matcher the promise will never complete, so we need to have a workaround #35340
                let taskStarted = false;
                const promise = this.taskService.getActiveTasks().then(tasks => {
                    if (tasks.filter(t => t._id === task._id).length) {
                        // task is already running - nothing to do.
                        return Promise.resolve(null);
                    }
                    once(e => ((e.kind === "active" /* Active */) || (e.kind === "dependsOnStarted" /* DependsOnStarted */)) && e.taskId === task._id, this.taskService.onDidStateChange)(() => {
                        // Task is active, so everything seems to be fine, no need to prompt after 10 seconds
                        // Use case being a slow running task should not be prompted even though it takes more than 10 seconds
                        taskStarted = true;
                    });
                    const taskPromise = this.taskService.run(task);
                    if (task.configurationProperties.isBackground) {
                        return new Promise((c, e) => once(e => e.kind === "inactive" /* Inactive */ && e.taskId === task._id, this.taskService.onDidStateChange)(() => {
                            taskStarted = true;
                            c(null);
                        }));
                    }
                    return taskPromise;
                });
                return new Promise((c, e) => {
                    promise.then(result => {
                        taskStarted = true;
                        c(result);
                    }, error => e(error));
                    setTimeout(() => {
                        if (!taskStarted) {
                            const errorMessage = typeof taskId === 'string'
                                ? nls.localize('taskNotTrackedWithTaskId', "The specified task cannot be tracked.")
                                : nls.localize('taskNotTracked', "The task '{0}' cannot be tracked.", JSON.stringify(taskId));
                            e({ severity: severity_1.default.Error, message: errorMessage });
                        }
                    }, 10000);
                });
            });
        }
        //---- focus management
        focusStackFrame(stackFrame, thread, session, explicit) {
            if (!session) {
                if (stackFrame || thread) {
                    session = stackFrame ? stackFrame.thread.session : thread.session;
                }
                else {
                    const sessions = this.model.getSessions();
                    const stoppedSession = sessions.filter(s => s.state === 2 /* Stopped */).shift();
                    session = stoppedSession || (sessions.length ? sessions[0] : undefined);
                }
            }
            if (!thread) {
                if (stackFrame) {
                    thread = stackFrame.thread;
                }
                else {
                    const threads = session ? session.getAllThreads() : undefined;
                    const stoppedThread = threads && threads.filter(t => t.stopped).shift();
                    thread = stoppedThread || (threads && threads.length ? threads[0] : undefined);
                }
            }
            if (!stackFrame) {
                if (thread) {
                    const callStack = thread.getCallStack();
                    stackFrame = arrays_1.first(callStack, sf => !!(sf && sf.source && sf.source.available && sf.source.presentationHint !== 'deemphasize'), undefined);
                }
            }
            if (stackFrame) {
                stackFrame.openInEditor(this.editorService, true).then(editor => {
                    if (editor) {
                        const control = editor.getControl();
                        if (stackFrame && editorBrowser_1.isCodeEditor(control) && control.hasModel()) {
                            const model = control.getModel();
                            if (stackFrame.range.startLineNumber <= model.getLineCount()) {
                                const lineContent = control.getModel().getLineContent(stackFrame.range.startLineNumber);
                                aria.alert(nls.localize('debuggingPaused', "Debugging paused {0}, {1} {2} {3}", thread && thread.stoppedDetails ? `, reason ${thread.stoppedDetails.reason}` : '', stackFrame.source ? stackFrame.source.name : '', stackFrame.range.startLineNumber, lineContent));
                            }
                        }
                    }
                });
            }
            if (session) {
                this.debugType.set(session.configuration.type);
            }
            else {
                this.debugType.reset();
            }
            this.viewModel.setFocus(stackFrame, thread, session, !!explicit);
        }
        //---- watches
        addWatchExpression(name) {
            const we = this.model.addWatchExpression(name);
            this.viewModel.setSelectedExpression(we);
            this.storeWatchExpressions();
        }
        renameWatchExpression(id, newName) {
            this.model.renameWatchExpression(id, newName);
            this.storeWatchExpressions();
        }
        moveWatchExpression(id, position) {
            this.model.moveWatchExpression(id, position);
            this.storeWatchExpressions();
        }
        removeWatchExpressions(id) {
            this.model.removeWatchExpressions(id);
            this.storeWatchExpressions();
        }
        //---- breakpoints
        enableOrDisableBreakpoints(enable, breakpoint) {
            return __awaiter(this, void 0, void 0, function* () {
                if (breakpoint) {
                    this.model.setEnablement(breakpoint, enable);
                    if (breakpoint instanceof debugModel_1.Breakpoint) {
                        yield this.sendBreakpoints(breakpoint.uri);
                    }
                    else if (breakpoint instanceof debugModel_1.FunctionBreakpoint) {
                        yield this.sendFunctionBreakpoints();
                    }
                    else if (breakpoint instanceof debugModel_1.DataBreakpoint) {
                        yield this.sendDataBreakpoints();
                    }
                    else {
                        yield this.sendExceptionBreakpoints();
                    }
                }
                else {
                    this.model.enableOrDisableAllBreakpoints(enable);
                    yield this.sendAllBreakpoints();
                }
                this.storeBreakpoints();
            });
        }
        addBreakpoints(uri, rawBreakpoints, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const breakpoints = this.model.addBreakpoints(uri, rawBreakpoints);
                breakpoints.forEach(bp => aria.status(nls.localize('breakpointAdded', "Added breakpoint, line {0}, file {1}", bp.lineNumber, uri.fsPath)));
                breakpoints.forEach(bp => this.telemetryDebugAddBreakpoint(bp, context));
                yield this.sendBreakpoints(uri);
                this.storeBreakpoints();
                return breakpoints;
            });
        }
        updateBreakpoints(uri, data, sendOnResourceSaved) {
            return __awaiter(this, void 0, void 0, function* () {
                this.model.updateBreakpoints(data);
                if (sendOnResourceSaved) {
                    this.breakpointsToSendOnResourceSaved.add(uri.toString());
                }
                else {
                    yield this.sendBreakpoints(uri);
                }
                this.storeBreakpoints();
            });
        }
        removeBreakpoints(id) {
            return __awaiter(this, void 0, void 0, function* () {
                const toRemove = this.model.getBreakpoints().filter(bp => !id || bp.getId() === id);
                toRemove.forEach(bp => aria.status(nls.localize('breakpointRemoved', "Removed breakpoint, line {0}, file {1}", bp.lineNumber, bp.uri.fsPath)));
                const urisToClear = arrays_1.distinct(toRemove, bp => bp.uri.toString()).map(bp => bp.uri);
                this.model.removeBreakpoints(toRemove);
                yield Promise.all(urisToClear.map(uri => this.sendBreakpoints(uri)));
                this.storeBreakpoints();
            });
        }
        setBreakpointsActivated(activated) {
            this.model.setBreakpointsActivated(activated);
            return this.sendAllBreakpoints();
        }
        addFunctionBreakpoint(name, id) {
            const newFunctionBreakpoint = this.model.addFunctionBreakpoint(name || '', id);
            this.viewModel.setSelectedFunctionBreakpoint(newFunctionBreakpoint);
        }
        renameFunctionBreakpoint(id, newFunctionName) {
            return __awaiter(this, void 0, void 0, function* () {
                this.model.renameFunctionBreakpoint(id, newFunctionName);
                yield this.sendFunctionBreakpoints();
                this.storeBreakpoints();
            });
        }
        removeFunctionBreakpoints(id) {
            return __awaiter(this, void 0, void 0, function* () {
                this.model.removeFunctionBreakpoints(id);
                yield this.sendFunctionBreakpoints();
                this.storeBreakpoints();
            });
        }
        addDataBreakpoint(label, dataId, canPersist) {
            return __awaiter(this, void 0, void 0, function* () {
                this.model.addDataBreakpoint(label, dataId, canPersist);
                yield this.sendDataBreakpoints();
                this.storeBreakpoints();
            });
        }
        removeDataBreakpoints(id) {
            return __awaiter(this, void 0, void 0, function* () {
                this.model.removeDataBreakpoints(id);
                yield this.sendDataBreakpoints();
                this.storeBreakpoints();
            });
        }
        sendAllBreakpoints(session) {
            return Promise.all(arrays_1.distinct(this.model.getBreakpoints(), bp => bp.uri.toString()).map(bp => this.sendBreakpoints(bp.uri, false, session)))
                .then(() => this.sendFunctionBreakpoints(session))
                // send exception breakpoints at the end since some debug adapters rely on the order
                .then(() => this.sendExceptionBreakpoints(session))
                .then(() => this.sendDataBreakpoints(session));
        }
        sendBreakpoints(modelUri, sourceModified = false, session) {
            const breakpointsToSend = this.model.getBreakpoints({ uri: modelUri, enabledOnly: true });
            return this.sendToOneOrAllSessions(session, s => s.sendBreakpoints(modelUri, breakpointsToSend, sourceModified));
        }
        sendFunctionBreakpoints(session) {
            const breakpointsToSend = this.model.getFunctionBreakpoints().filter(fbp => fbp.enabled && this.model.areBreakpointsActivated());
            return this.sendToOneOrAllSessions(session, s => {
                return s.capabilities.supportsFunctionBreakpoints ? s.sendFunctionBreakpoints(breakpointsToSend) : Promise.resolve(undefined);
            });
        }
        sendDataBreakpoints(session) {
            const breakpointsToSend = this.model.getDataBreakpoints().filter(fbp => fbp.enabled && this.model.areBreakpointsActivated());
            return this.sendToOneOrAllSessions(session, s => {
                return s.capabilities.supportsDataBreakpoints ? s.sendDataBreakpoints(breakpointsToSend) : Promise.resolve(undefined);
            });
        }
        sendExceptionBreakpoints(session) {
            const enabledExceptionBps = this.model.getExceptionBreakpoints().filter(exb => exb.enabled);
            return this.sendToOneOrAllSessions(session, s => {
                return s.sendExceptionBreakpoints(enabledExceptionBps);
            });
        }
        sendToOneOrAllSessions(session, send) {
            if (session) {
                return send(session);
            }
            return Promise.all(this.model.getSessions().map(s => send(s))).then(() => undefined);
        }
        onFileChanges(fileChangesEvent) {
            const toRemove = this.model.getBreakpoints().filter(bp => fileChangesEvent.contains(bp.uri, 2 /* DELETED */));
            if (toRemove.length) {
                this.model.removeBreakpoints(toRemove);
            }
            fileChangesEvent.getUpdated().forEach(event => {
                if (this.breakpointsToSendOnResourceSaved.delete(event.resource.toString())) {
                    this.sendBreakpoints(event.resource, true);
                }
            });
        }
        loadBreakpoints() {
            let result;
            try {
                result = JSON.parse(this.storageService.get(DEBUG_BREAKPOINTS_KEY, 1 /* WORKSPACE */, '[]')).map((breakpoint) => {
                    return new debugModel_1.Breakpoint(uri_1.URI.parse(breakpoint.uri.external || breakpoint.source.uri.external), breakpoint.lineNumber, breakpoint.column, breakpoint.enabled, breakpoint.condition, breakpoint.hitCondition, breakpoint.logMessage, breakpoint.adapterData, this.textFileService);
                });
            }
            catch (e) { }
            return result || [];
        }
        loadFunctionBreakpoints() {
            let result;
            try {
                result = JSON.parse(this.storageService.get(DEBUG_FUNCTION_BREAKPOINTS_KEY, 1 /* WORKSPACE */, '[]')).map((fb) => {
                    return new debugModel_1.FunctionBreakpoint(fb.name, fb.enabled, fb.hitCondition, fb.condition, fb.logMessage);
                });
            }
            catch (e) { }
            return result || [];
        }
        loadExceptionBreakpoints() {
            let result;
            try {
                result = JSON.parse(this.storageService.get(DEBUG_EXCEPTION_BREAKPOINTS_KEY, 1 /* WORKSPACE */, '[]')).map((exBreakpoint) => {
                    return new debugModel_1.ExceptionBreakpoint(exBreakpoint.filter, exBreakpoint.label, exBreakpoint.enabled);
                });
            }
            catch (e) { }
            return result || [];
        }
        loadDataBreakpoints() {
            let result;
            try {
                result = JSON.parse(this.storageService.get(DEBUG_DATA_BREAKPOINTS_KEY, 1 /* WORKSPACE */, '[]')).map((dbp) => {
                    return new debugModel_1.DataBreakpoint(dbp.label, dbp.dataId, true, dbp.enabled, dbp.hitCondition, dbp.condition, dbp.logMessage);
                });
            }
            catch (e) { }
            return result || [];
        }
        loadWatchExpressions() {
            let result;
            try {
                result = JSON.parse(this.storageService.get(DEBUG_WATCH_EXPRESSIONS_KEY, 1 /* WORKSPACE */, '[]')).map((watchStoredData) => {
                    return new debugModel_1.Expression(watchStoredData.name, watchStoredData.id);
                });
            }
            catch (e) { }
            return result || [];
        }
        storeWatchExpressions() {
            const watchExpressions = this.model.getWatchExpressions();
            if (watchExpressions.length) {
                this.storageService.store(DEBUG_WATCH_EXPRESSIONS_KEY, JSON.stringify(watchExpressions.map(we => ({ name: we.name, id: we.getId() }))), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(DEBUG_WATCH_EXPRESSIONS_KEY, 1 /* WORKSPACE */);
            }
        }
        storeBreakpoints() {
            const breakpoints = this.model.getBreakpoints();
            if (breakpoints.length) {
                this.storageService.store(DEBUG_BREAKPOINTS_KEY, JSON.stringify(breakpoints), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(DEBUG_BREAKPOINTS_KEY, 1 /* WORKSPACE */);
            }
            const functionBreakpoints = this.model.getFunctionBreakpoints();
            if (functionBreakpoints.length) {
                this.storageService.store(DEBUG_FUNCTION_BREAKPOINTS_KEY, JSON.stringify(functionBreakpoints), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(DEBUG_FUNCTION_BREAKPOINTS_KEY, 1 /* WORKSPACE */);
            }
            const dataBreakpoints = this.model.getDataBreakpoints().filter(dbp => dbp.canPersist);
            if (dataBreakpoints.length) {
                this.storageService.store(DEBUG_DATA_BREAKPOINTS_KEY, JSON.stringify(dataBreakpoints), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(DEBUG_DATA_BREAKPOINTS_KEY, 1 /* WORKSPACE */);
            }
            const exceptionBreakpoints = this.model.getExceptionBreakpoints();
            if (exceptionBreakpoints.length) {
                this.storageService.store(DEBUG_EXCEPTION_BREAKPOINTS_KEY, JSON.stringify(exceptionBreakpoints), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(DEBUG_EXCEPTION_BREAKPOINTS_KEY, 1 /* WORKSPACE */);
            }
        }
        //---- telemetry
        telemetryDebugSessionStart(root, type) {
            const dbgr = this.configurationManager.getDebugger(type);
            if (!dbgr) {
                return Promise.resolve();
            }
            const extension = dbgr.getMainExtensionDescriptor();
            /* __GDPR__
                "debugSessionStart" : {
                    "type": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "breakpointCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "exceptionBreakpoints": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "watchExpressionsCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "extensionName": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" },
                    "isBuiltin": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true},
                    "launchJsonExists": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                }
            */
            return this.telemetryService.publicLog('debugSessionStart', {
                type: type,
                breakpointCount: this.model.getBreakpoints().length,
                exceptionBreakpoints: this.model.getExceptionBreakpoints(),
                watchExpressionsCount: this.model.getWatchExpressions().length,
                extensionName: extension.identifier.value,
                isBuiltin: extension.isBuiltin,
                launchJsonExists: root && !!this.configurationService.getValue('launch', { resource: root.uri })
            });
        }
        telemetryDebugSessionStop(session, adapterExitEvent) {
            const breakpoints = this.model.getBreakpoints();
            /* __GDPR__
                "debugSessionStop" : {
                    "type" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "success": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "sessionLengthInSeconds": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "breakpointCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "watchExpressionsCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                }
            */
            return this.telemetryService.publicLog('debugSessionStop', {
                type: session && session.configuration.type,
                success: adapterExitEvent.emittedStopped || breakpoints.length === 0,
                sessionLengthInSeconds: adapterExitEvent.sessionLengthInSeconds,
                breakpointCount: breakpoints.length,
                watchExpressionsCount: this.model.getWatchExpressions().length
            });
        }
        telemetryDebugMisconfiguration(debugType, message) {
            /* __GDPR__
                "debugMisconfiguration" : {
                    "type" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "error": { "classification": "CallstackOrException", "purpose": "FeatureInsight" }
                }
            */
            return this.telemetryService.publicLog('debugMisconfiguration', {
                type: debugType,
                error: message
            });
        }
        telemetryDebugAddBreakpoint(breakpoint, context) {
            /* __GDPR__
                "debugAddBreakpoint" : {
                    "context": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "hasCondition": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "hasHitCondition": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "hasLogMessage": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                }
            */
            return this.telemetryService.publicLog('debugAddBreakpoint', {
                context: context,
                hasCondition: !!breakpoint.condition,
                hasHitCondition: !!breakpoint.hitCondition,
                hasLogMessage: !!breakpoint.logMessage
            });
        }
    };
    DebugService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, editorService_1.IEditorService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, viewlet_1.IViewletService),
        __param(4, panelService_1.IPanelService),
        __param(5, notification_1.INotificationService),
        __param(6, dialogs_1.IDialogService),
        __param(7, layoutService_1.IWorkbenchLayoutService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, workspace_1.IWorkspaceContextService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, lifecycle_1.ILifecycleService),
        __param(12, instantiation_1.IInstantiationService),
        __param(13, extensions_1.IExtensionService),
        __param(14, markers_1.IMarkerService),
        __param(15, taskService_1.ITaskService),
        __param(16, files_1.IFileService),
        __param(17, configuration_1.IConfigurationService),
        __param(18, extensionHostDebug_1.IExtensionHostDebugService)
    ], DebugService);
    exports.DebugService = DebugService;
});
//# sourceMappingURL=debugService.js.map