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
define(["require", "exports", "vs/platform/product/node/package", "os", "vs/base/common/uri", "vs/base/common/platform", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/base/common/event", "vs/workbench/api/common/extHostConfiguration", "vs/platform/log/common/log", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/async", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/contrib/terminal/node/terminal", "vs/workbench/contrib/terminal/node/terminalEnvironment", "vs/workbench/api/common/extHostRpcService"], function (require, exports, package_1, os, uri_1, platform, terminalEnvironment, event_1, extHostConfiguration_1, log_1, terminal_1, async_1, extHostWorkspace_1, terminal_2, terminalEnvironment_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BaseExtHostTerminal {
        constructor(_proxy, id) {
            this._proxy = _proxy;
            this._disposed = false;
            this._queuedRequests = [];
            this._idPromise = new Promise(c => {
                if (id !== undefined) {
                    this._id = id;
                    c(id);
                }
                else {
                    this._idPromiseComplete = c;
                }
            });
        }
        dispose() {
            if (!this._disposed) {
                this._disposed = true;
                this._queueApiRequest(this._proxy.$dispose, []);
            }
        }
        _checkDisposed() {
            if (this._disposed) {
                throw new Error('Terminal has already been disposed');
            }
        }
        _queueApiRequest(callback, args) {
            const request = new ApiRequest(callback, args);
            if (!this._id) {
                this._queuedRequests.push(request);
                return;
            }
            request.run(this._proxy, this._id);
        }
        _runQueuedRequests(id) {
            this._id = id;
            if (this._idPromiseComplete) {
                this._idPromiseComplete(id);
                this._idPromiseComplete = undefined;
            }
            this._queuedRequests.forEach((r) => {
                r.run(this._proxy, id);
            });
            this._queuedRequests.length = 0;
        }
    }
    exports.BaseExtHostTerminal = BaseExtHostTerminal;
    class ExtHostTerminal extends BaseExtHostTerminal {
        constructor(proxy, _name, id) {
            super(proxy, id);
            this._name = _name;
            /** @deprecated */
            this._onData = new event_1.Emitter();
            this.isOpen = false;
            this._pidPromise = new Promise(c => this._pidPromiseComplete = c);
        }
        /** @deprecated */
        get onDidWriteData() {
            // Tell the main side to start sending data if it's not already
            this._idPromise.then(id => {
                this._proxy.$registerOnDataListener(id);
            });
            return this._onData.event;
        }
        create(shellPath, shellArgs, cwd, env, waitOnExit, strictEnv, hideFromUser) {
            return __awaiter(this, void 0, void 0, function* () {
                const terminal = yield this._proxy.$createTerminal({ name: this._name, shellPath, shellArgs, cwd, env, waitOnExit, strictEnv, hideFromUser });
                this._name = terminal.name;
                this._runQueuedRequests(terminal.id);
            });
        }
        createExtensionTerminal() {
            return __awaiter(this, void 0, void 0, function* () {
                const terminal = yield this._proxy.$createTerminal({ name: this._name, isExtensionTerminal: true });
                this._name = terminal.name;
                this._runQueuedRequests(terminal.id);
                return terminal.id;
            });
        }
        get name() {
            return this._name || '';
        }
        set name(name) {
            this._name = name;
        }
        get dimensions() {
            if (this._cols === undefined || this._rows === undefined) {
                return undefined;
            }
            return {
                columns: this._cols,
                rows: this._rows
            };
        }
        setDimensions(cols, rows) {
            if (cols === this._cols && rows === this._rows) {
                // Nothing changed
                return false;
            }
            this._cols = cols;
            this._rows = rows;
            return true;
        }
        get processId() {
            return this._pidPromise;
        }
        sendText(text, addNewLine = true) {
            this._checkDisposed();
            this._queueApiRequest(this._proxy.$sendText, [text, addNewLine]);
        }
        show(preserveFocus) {
            this._checkDisposed();
            this._queueApiRequest(this._proxy.$show, [preserveFocus]);
        }
        hide() {
            this._checkDisposed();
            this._queueApiRequest(this._proxy.$hide, []);
        }
        _setProcessId(processId) {
            // The event may fire 2 times when the panel is restored
            if (this._pidPromiseComplete) {
                this._pidPromiseComplete(processId);
                this._pidPromiseComplete = undefined;
            }
            else {
                // Recreate the promise if this is the nth processId set (e.g. reused task terminals)
                this._pidPromise.then(pid => {
                    if (pid !== processId) {
                        this._pidPromise = Promise.resolve(processId);
                    }
                });
            }
        }
        _fireOnData(data) {
            this._onData.fire(data);
        }
    }
    exports.ExtHostTerminal = ExtHostTerminal;
    let ExtHostTerminalService = class ExtHostTerminalService {
        constructor(extHostRpc, _extHostConfiguration, _extHostWorkspace, 
        // C9 change
        // @IExtHostDocumentsAndEditors private _extHostDocumentsAndEditors: ExtHostDocumentsAndEditors,
        _logService) {
            this._extHostConfiguration = _extHostConfiguration;
            this._extHostWorkspace = _extHostWorkspace;
            this._logService = _logService;
            this._terminals = [];
            this._terminalProcesses = {};
            this._getTerminalPromises = {};
            // TODO: Pull this from main side
            this._isWorkspaceShellAllowed = false;
            this._onDidCloseTerminal = new event_1.Emitter();
            this._onDidOpenTerminal = new event_1.Emitter();
            this._onDidChangeActiveTerminal = new event_1.Emitter();
            this._onDidChangeTerminalDimensions = new event_1.Emitter();
            // C9 changes start
            // this._proxy = extHostRpc.getProxy(MainContext.MainThreadTerminalService);
            // this._onDidWriteTerminalData = new Emitter<vscode.TerminalDataWriteEvent>({
            // 	onFirstListenerAdd: () => this._proxy.$startSendingDataEvents(),
            // 	onLastListenerRemove: () => this._proxy.$stopSendingDataEvents()
            // });
            // this._updateLastActiveWorkspace();
            // this._updateVariableResolver();
            // this._registerListeners();
            // C9 changes end
        }
        get activeTerminal() { return this._activeTerminal; }
        get terminals() { return this._terminals; }
        get onDidCloseTerminal() { return this._onDidCloseTerminal && this._onDidCloseTerminal.event; }
        get onDidOpenTerminal() { return this._onDidOpenTerminal && this._onDidOpenTerminal.event; }
        get onDidChangeActiveTerminal() { return this._onDidChangeActiveTerminal && this._onDidChangeActiveTerminal.event; }
        get onDidChangeTerminalDimensions() { return this._onDidChangeTerminalDimensions && this._onDidChangeTerminalDimensions.event; }
        get onDidWriteTerminalData() { return this._onDidWriteTerminalData && this._onDidWriteTerminalData.event; }
        createTerminal(name, shellPath, shellArgs) {
            const terminal = new ExtHostTerminal(this._proxy, name);
            terminal.create(shellPath, shellArgs);
            this._terminals.push(terminal);
            return terminal;
        }
        createTerminalFromOptions(options) {
            const terminal = new ExtHostTerminal(this._proxy, options.name);
            terminal.create(options.shellPath, options.shellArgs, options.cwd, options.env, /*options.waitOnExit*/ undefined, options.strictEnv, options.hideFromUser);
            this._terminals.push(terminal);
            return terminal;
        }
        createExtensionTerminal(options) {
            const terminal = new ExtHostTerminal(this._proxy, options.name);
            const p = new ExtHostPseudoterminal(options.pty);
            terminal.createExtensionTerminal().then(id => this._setupExtHostProcessListeners(id, p));
            this._terminals.push(terminal);
            return terminal;
        }
        attachPtyToTerminal(id, pty) {
            const terminal = this._getTerminalByIdEventually(id);
            if (!terminal) {
                throw new Error(`Cannot resolve terminal with id ${id} for virtual process`);
            }
            const p = new ExtHostPseudoterminal(pty);
            this._setupExtHostProcessListeners(id, p);
        }
        getDefaultShell(useAutomationShell, configProvider) {
            const fetchSetting = (key) => {
                const setting = configProvider
                    .getConfiguration(key.substr(0, key.lastIndexOf('.')))
                    .inspect(key.substr(key.lastIndexOf('.') + 1));
                return this._apiInspectConfigToPlain(setting);
            };
            return terminalEnvironment.getDefaultShell(fetchSetting, this._isWorkspaceShellAllowed, terminal_2.getSystemShell(platform.platform), process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432'), process.env.windir, this._lastActiveWorkspace, this._variableResolver, this._logService, useAutomationShell);
        }
        _getDefaultShellArgs(useAutomationShell, configProvider) {
            const fetchSetting = (key) => {
                const setting = configProvider
                    .getConfiguration(key.substr(0, key.lastIndexOf('.')))
                    .inspect(key.substr(key.lastIndexOf('.') + 1));
                return this._apiInspectConfigToPlain(setting);
            };
            return terminalEnvironment.getDefaultShellArgs(fetchSetting, this._isWorkspaceShellAllowed, useAutomationShell, this._lastActiveWorkspace, this._variableResolver, this._logService);
        }
        $acceptActiveTerminalChanged(id) {
            return __awaiter(this, void 0, void 0, function* () {
                const original = this._activeTerminal;
                if (id === null) {
                    this._activeTerminal = undefined;
                    if (original !== this._activeTerminal) {
                        this._onDidChangeActiveTerminal.fire(this._activeTerminal);
                    }
                    return;
                }
                const terminal = yield this._getTerminalByIdEventually(id);
                if (terminal) {
                    this._activeTerminal = terminal;
                    if (original !== this._activeTerminal) {
                        this._onDidChangeActiveTerminal.fire(this._activeTerminal);
                    }
                }
            });
        }
        /** @deprecated */
        $acceptTerminalProcessData(id, data) {
            return __awaiter(this, void 0, void 0, function* () {
                const terminal = yield this._getTerminalByIdEventually(id);
                if (terminal) {
                    terminal._fireOnData(data);
                }
            });
        }
        $acceptTerminalProcessData2(id, data) {
            return __awaiter(this, void 0, void 0, function* () {
                const terminal = yield this._getTerminalByIdEventually(id);
                if (terminal) {
                    this._onDidWriteTerminalData.fire({ terminal, data });
                }
            });
        }
        $acceptTerminalDimensions(id, cols, rows) {
            return __awaiter(this, void 0, void 0, function* () {
                const terminal = yield this._getTerminalByIdEventually(id);
                if (terminal) {
                    if (terminal.setDimensions(cols, rows)) {
                        this._onDidChangeTerminalDimensions.fire({
                            terminal: terminal,
                            dimensions: terminal.dimensions
                        });
                    }
                }
            });
        }
        $acceptTerminalMaximumDimensions(id, cols, rows) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this._getTerminalByIdEventually(id);
                if (this._terminalProcesses[id]) {
                    // Extension pty terminal only - when virtual process resize fires it means that the
                    // terminal's maximum dimensions changed
                    this._terminalProcesses[id].resize(cols, rows);
                }
            });
        }
        $acceptTerminalTitleChange(id, name) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this._getTerminalByIdEventually(id);
                const extHostTerminal = this._getTerminalObjectById(this.terminals, id);
                if (extHostTerminal) {
                    extHostTerminal.name = name;
                }
            });
        }
        $acceptTerminalClosed(id) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this._getTerminalByIdEventually(id);
                const index = this._getTerminalObjectIndexById(this.terminals, id);
                if (index !== null) {
                    const terminal = this._terminals.splice(index, 1)[0];
                    this._onDidCloseTerminal.fire(terminal);
                }
            });
        }
        $acceptTerminalOpened(id, name) {
            const index = this._getTerminalObjectIndexById(this._terminals, id);
            if (index !== null) {
                // The terminal has already been created (via createTerminal*), only fire the event
                this._onDidOpenTerminal.fire(this.terminals[index]);
                this.terminals[index].isOpen = true;
                return;
            }
            const terminal = new ExtHostTerminal(this._proxy, name, id);
            this._terminals.push(terminal);
            this._onDidOpenTerminal.fire(terminal);
            terminal.isOpen = true;
        }
        $acceptTerminalProcessId(id, processId) {
            return __awaiter(this, void 0, void 0, function* () {
                const terminal = yield this._getTerminalByIdEventually(id);
                if (terminal) {
                    terminal._setProcessId(processId);
                }
            });
        }
        performTerminalIdAction(id, callback) {
            // TODO: Use await this._getTerminalByIdEventually(id);
            let terminal = this._getTerminalById(id);
            if (terminal) {
                callback(terminal);
            }
            else {
                // Retry one more time in case the terminal has not yet been initialized.
                setTimeout(() => {
                    terminal = this._getTerminalById(id);
                    if (terminal) {
                        callback(terminal);
                    }
                }, terminal_1.EXT_HOST_CREATION_DELAY * 2);
            }
        }
        _apiInspectConfigToPlain(config) {
            return {
                user: config ? config.globalValue : undefined,
                value: config ? config.workspaceValue : undefined,
                default: config ? config.defaultValue : undefined,
            };
        }
        _getNonInheritedEnv() {
            return __awaiter(this, void 0, void 0, function* () {
                const env = yield terminalEnvironment_1.getMainProcessParentEnv();
                env.VSCODE_IPC_HOOK_CLI = process.env['VSCODE_IPC_HOOK_CLI'];
                return env;
            });
        }
        // C9 changes start
        // private _registerListeners(): void {
        // 	this._extHostDocumentsAndEditors.onDidChangeActiveTextEditor(() => this._updateLastActiveWorkspace());
        // 	this._extHostWorkspace.onDidChangeWorkspace(() => this._updateVariableResolver());
        // }
        // private _updateLastActiveWorkspace(): void {
        // 	const activeEditor = this._extHostDocumentsAndEditors.activeEditor();
        // 	if (activeEditor) {
        // 		this._lastActiveWorkspace = this._extHostWorkspace.getWorkspaceFolder(activeEditor.document.uri) as IWorkspaceFolder;
        // 	}
        // }
        // private async _updateVariableResolver(): Promise<void> {
        // 	const configProvider = await this._extHostConfiguration.getConfigProvider();
        // 	const workspaceFolders = await this._extHostWorkspace.getWorkspaceFolders2();
        // 	this._variableResolver = new ExtHostVariableResolverService(workspaceFolders || [], this._extHostDocumentsAndEditors, configProvider);
        // }
        // C9 changes end
        $spawnExtHostProcess(id, shellLaunchConfigDto, activeWorkspaceRootUriComponents, cols, rows, isWorkspaceShellAllowed) {
            return __awaiter(this, void 0, void 0, function* () {
                const shellLaunchConfig = {
                    name: shellLaunchConfigDto.name,
                    executable: shellLaunchConfigDto.executable,
                    args: shellLaunchConfigDto.args,
                    cwd: typeof shellLaunchConfigDto.cwd === 'string' ? shellLaunchConfigDto.cwd : uri_1.URI.revive(shellLaunchConfigDto.cwd),
                    env: shellLaunchConfigDto.env
                };
                // Merge in shell and args from settings
                const platformKey = platform.isWindows ? 'windows' : (platform.isMacintosh ? 'osx' : 'linux');
                const configProvider = yield this._extHostConfiguration.getConfigProvider();
                if (!shellLaunchConfig.executable) {
                    shellLaunchConfig.executable = this.getDefaultShell(false, configProvider);
                    shellLaunchConfig.args = this._getDefaultShellArgs(false, configProvider);
                }
                else {
                    if (this._variableResolver) {
                        shellLaunchConfig.executable = this._variableResolver.resolve(this._lastActiveWorkspace, shellLaunchConfig.executable);
                        if (shellLaunchConfig.args) {
                            if (Array.isArray(shellLaunchConfig.args)) {
                                const resolvedArgs = [];
                                for (const arg of shellLaunchConfig.args) {
                                    resolvedArgs.push(this._variableResolver.resolve(this._lastActiveWorkspace, arg));
                                }
                                shellLaunchConfig.args = resolvedArgs;
                            }
                            else {
                                shellLaunchConfig.args = this._variableResolver.resolve(this._lastActiveWorkspace, shellLaunchConfig.args);
                            }
                        }
                    }
                }
                const activeWorkspaceRootUri = uri_1.URI.revive(activeWorkspaceRootUriComponents);
                // Get the environment
                const apiLastActiveWorkspace = yield this._extHostWorkspace.getWorkspaceFolder(activeWorkspaceRootUri);
                const lastActiveWorkspace = apiLastActiveWorkspace ? {
                    uri: apiLastActiveWorkspace.uri,
                    name: apiLastActiveWorkspace.name,
                    index: apiLastActiveWorkspace.index,
                    toResource: () => {
                        throw new Error('Not implemented');
                    }
                } : null;
                // Get the initial cwd
                const terminalConfig = configProvider.getConfiguration('terminal.integrated');
                const initialCwd = terminalEnvironment.getCwd(shellLaunchConfig, os.homedir(), lastActiveWorkspace ? lastActiveWorkspace : undefined, this._variableResolver, activeWorkspaceRootUri, terminalConfig.cwd, this._logService);
                shellLaunchConfig.cwd = initialCwd;
                const envFromConfig = this._apiInspectConfigToPlain(configProvider.getConfiguration('terminal.integrated').inspect(`env.${platformKey}`));
                const baseEnv = terminalConfig.get('inheritEnv', true) ? process.env : yield this._getNonInheritedEnv();
                const env = terminalEnvironment.createTerminalEnvironment(shellLaunchConfig, lastActiveWorkspace, envFromConfig, this._variableResolver, isWorkspaceShellAllowed, package_1.default.version, terminalConfig.get('setLocaleVariables', false), baseEnv);
                this._proxy.$sendResolvedLaunchConfig(id, shellLaunchConfig);
                // Fork the process and listen for messages
                this._logService.debug(`Terminal process launching on ext host`, shellLaunchConfig, initialCwd, cols, rows, env);
                // TODO: Support conpty on remote, it doesn't seem to work for some reason?
                // TODO: When conpty is enabled, only enable it when accessibilityMode is off
                // C9 changes start
                // const enableConpty = false; //terminalConfig.get('windowsEnableConpty') as boolean;
                // this._setupExtHostProcessListeners(id, new TerminalProcess(shellLaunchConfig, initialCwd, cols, rows, env, enableConpty, this._logService));
                // C9 changes end
            });
        }
        $startExtensionTerminal(id, initialDimensions) {
            return __awaiter(this, void 0, void 0, function* () {
                // Make sure the ExtHostTerminal exists so onDidOpenTerminal has fired before we call
                // Pseudoterminal.start
                const terminal = yield this._getTerminalByIdEventually(id);
                if (!terminal) {
                    return;
                }
                // Wait for onDidOpenTerminal to fire
                let openPromise;
                if (terminal.isOpen) {
                    openPromise = Promise.resolve();
                }
                else {
                    openPromise = new Promise(r => {
                        // Ensure open is called after onDidOpenTerminal
                        const listener = this.onDidOpenTerminal((e) => __awaiter(this, void 0, void 0, function* () {
                            if (e === terminal) {
                                listener.dispose();
                                r();
                            }
                        }));
                    });
                }
                yield openPromise;
                // Processes should be initialized here for normal virtual process terminals, however for
                // tasks they are responsible for attaching the virtual process to a terminal so this
                // function may be called before tasks is able to attach to the terminal.
                let retries = 5;
                while (retries-- > 0) {
                    if (this._terminalProcesses[id]) {
                        this._terminalProcesses[id].startSendingEvents(initialDimensions);
                        return;
                    }
                    yield async_1.timeout(50);
                }
            });
        }
        _setupExtHostProcessListeners(id, p) {
            p.onProcessReady((e) => this._proxy.$sendProcessReady(id, e.pid, e.cwd));
            p.onProcessTitleChanged(title => this._proxy.$sendProcessTitle(id, title));
            p.onProcessData(data => this._proxy.$sendProcessData(id, data));
            p.onProcessExit(exitCode => this._onProcessExit(id, exitCode));
            if (p.onProcessOverrideDimensions) {
                p.onProcessOverrideDimensions(e => this._proxy.$sendOverrideDimensions(id, e));
            }
            this._terminalProcesses[id] = p;
        }
        $acceptProcessInput(id, data) {
            this._terminalProcesses[id].input(data);
        }
        $acceptProcessResize(id, cols, rows) {
            try {
                this._terminalProcesses[id].resize(cols, rows);
            }
            catch (error) {
                // We tried to write to a closed pipe / channel.
                if (error.code !== 'EPIPE' && error.code !== 'ERR_IPC_CHANNEL_CLOSED') {
                    throw (error);
                }
            }
        }
        $acceptProcessShutdown(id, immediate) {
            this._terminalProcesses[id].shutdown(immediate);
        }
        $acceptProcessRequestInitialCwd(id) {
            this._terminalProcesses[id].getInitialCwd().then(initialCwd => this._proxy.$sendProcessInitialCwd(id, initialCwd));
        }
        $acceptProcessRequestCwd(id) {
            this._terminalProcesses[id].getCwd().then(cwd => this._proxy.$sendProcessCwd(id, cwd));
        }
        $acceptProcessRequestLatency(id) {
            return id;
        }
        $requestAvailableShells() {
            return terminal_2.detectAvailableShells();
        }
        $requestDefaultShellAndArgs(useAutomationShell) {
            return __awaiter(this, void 0, void 0, function* () {
                const configProvider = yield this._extHostConfiguration.getConfigProvider();
                return Promise.resolve({
                    shell: this.getDefaultShell(useAutomationShell, configProvider),
                    args: this._getDefaultShellArgs(useAutomationShell, configProvider)
                });
            });
        }
        _onProcessExit(id, exitCode) {
            // Remove process reference
            delete this._terminalProcesses[id];
            // Send exit event to main side
            this._proxy.$sendProcessExit(id, exitCode);
        }
        // TODO: This could be improved by using a single promise and resolve it when the terminal is ready
        _getTerminalByIdEventually(id, retries = 5) {
            if (!this._getTerminalPromises[id]) {
                this._getTerminalPromises[id] = this._createGetTerminalPromise(id, retries);
            }
            else {
                this._getTerminalPromises[id].then(c => {
                    return this._createGetTerminalPromise(id, retries);
                });
            }
            return this._getTerminalPromises[id];
        }
        _createGetTerminalPromise(id, retries = 5) {
            return new Promise(c => {
                if (retries === 0) {
                    c(undefined);
                    return;
                }
                const terminal = this._getTerminalById(id);
                if (terminal) {
                    c(terminal);
                }
                else {
                    // This should only be needed immediately after createTerminalRenderer is called as
                    // the ExtHostTerminal has not yet been iniitalized
                    async_1.timeout(200).then(() => c(this._createGetTerminalPromise(id, retries - 1)));
                }
            });
        }
        _getTerminalById(id) {
            return this._getTerminalObjectById(this._terminals, id);
        }
        _getTerminalObjectById(array, id) {
            const index = this._getTerminalObjectIndexById(array, id);
            return index !== null ? array[index] : null;
        }
        _getTerminalObjectIndexById(array, id) {
            let index = null;
            array.some((item, i) => {
                const thisId = item._id;
                if (thisId === id) {
                    index = i;
                    return true;
                }
                return false;
            });
            return index;
        }
        $acceptWorkspacePermissionsChanged(isAllowed) {
            this._isWorkspaceShellAllowed = isAllowed;
        }
    };
    ExtHostTerminalService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostConfiguration_1.IExtHostConfiguration),
        __param(2, extHostWorkspace_1.IExtHostWorkspace),
        __param(3, log_1.ILogService)
    ], ExtHostTerminalService);
    exports.ExtHostTerminalService = ExtHostTerminalService;
    class ApiRequest {
        constructor(callback, args) {
            this._callback = callback;
            this._args = args;
        }
        run(proxy, id) {
            this._callback.apply(proxy, [id].concat(this._args));
        }
    }
    class ExtHostPseudoterminal {
        constructor(_pty) {
            this._pty = _pty;
            this._onProcessData = new event_1.Emitter();
            this.onProcessData = this._onProcessData.event;
            this._onProcessExit = new event_1.Emitter();
            this.onProcessExit = this._onProcessExit.event;
            this._onProcessReady = new event_1.Emitter();
            this._onProcessTitleChanged = new event_1.Emitter();
            this.onProcessTitleChanged = this._onProcessTitleChanged.event;
            this._onProcessOverrideDimensions = new event_1.Emitter();
        }
        get onProcessReady() { return this._onProcessReady.event; }
        get onProcessOverrideDimensions() { return this._onProcessOverrideDimensions.event; }
        shutdown() {
            this._pty.close();
        }
        input(data) {
            if (this._pty.handleInput) {
                this._pty.handleInput(data);
            }
        }
        resize(cols, rows) {
            if (this._pty.setDimensions) {
                this._pty.setDimensions({ columns: cols, rows });
            }
        }
        getInitialCwd() {
            return Promise.resolve('');
        }
        getCwd() {
            return Promise.resolve('');
        }
        getLatency() {
            return Promise.resolve(0);
        }
        startSendingEvents(initialDimensions) {
            // Attach the listeners
            this._pty.onDidWrite(e => this._onProcessData.fire(e));
            if (this._pty.onDidClose) {
                this._pty.onDidClose(e => this._onProcessExit.fire(e || 0));
            }
            if (this._pty.onDidOverrideDimensions) {
                this._pty.onDidOverrideDimensions(e => this._onProcessOverrideDimensions.fire(e ? { cols: e.columns, rows: e.rows } : e));
            }
            this._pty.open(initialDimensions ? initialDimensions : undefined);
        }
    }
});
//# sourceMappingURL=extHostTerminalService.js.map