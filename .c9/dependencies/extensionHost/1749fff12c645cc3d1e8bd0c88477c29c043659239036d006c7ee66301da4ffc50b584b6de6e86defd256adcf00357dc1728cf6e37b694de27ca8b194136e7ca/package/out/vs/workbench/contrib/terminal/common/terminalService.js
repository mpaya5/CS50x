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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/platform/contextkey/common/contextkey", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/services/panel/common/panelService", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/storage/common/storage", "vs/base/common/uri", "vs/editor/contrib/find/findState", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/extensions/common/extensions", "vs/platform/files/common/files", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/base/common/platform", "vs/base/common/path", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/quickinput/common/quickInput", "vs/platform/configuration/common/configuration"], function (require, exports, nls, event_1, contextkey_1, lifecycle_1, panelService_1, terminal_1, storage_1, uri_1, findState_1, notification_1, dialogs_1, extensions_1, files_1, terminalEnvironment_1, platform_1, path_1, remoteAgentService_1, quickInput_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalService = class TerminalService {
        constructor(_contextKeyService, _panelService, lifecycleService, _storageService, _notificationService, _dialogService, _extensionService, _fileService, _remoteAgentService, _terminalNativeService, _quickInputService, _configurationService) {
            this._contextKeyService = _contextKeyService;
            this._panelService = _panelService;
            this.lifecycleService = lifecycleService;
            this._storageService = _storageService;
            this._notificationService = _notificationService;
            this._dialogService = _dialogService;
            this._extensionService = _extensionService;
            this._fileService = _fileService;
            this._remoteAgentService = _remoteAgentService;
            this._terminalNativeService = _terminalNativeService;
            this._quickInputService = _quickInputService;
            this._configurationService = _configurationService;
            this._terminalTabs = [];
            this._backgroundedTerminalInstances = [];
            this._extHostsReady = {};
            this._onActiveTabChanged = new event_1.Emitter();
            this._onInstanceCreated = new event_1.Emitter();
            this._onInstanceDisposed = new event_1.Emitter();
            this._onInstanceProcessIdReady = new event_1.Emitter();
            this._onInstanceRequestSpawnExtHostProcess = new event_1.Emitter();
            this._onInstanceRequestStartExtensionTerminal = new event_1.Emitter();
            this._onInstanceDimensionsChanged = new event_1.Emitter();
            this._onInstanceMaximumDimensionsChanged = new event_1.Emitter();
            this._onInstancesChanged = new event_1.Emitter();
            this._onInstanceTitleChanged = new event_1.Emitter();
            this._onActiveInstanceChanged = new event_1.Emitter();
            this._onTabDisposed = new event_1.Emitter();
            this._onRequestAvailableShells = new event_1.Emitter();
            this._activeTabIndex = 0;
            this._isShuttingDown = false;
            this._findState = new findState_1.FindReplaceState();
            lifecycleService.onBeforeShutdown(event => event.veto(this._onBeforeShutdown()));
            lifecycleService.onShutdown(() => this._onShutdown());
            this._terminalNativeService.onOpenFileRequest(e => this._onOpenFileRequest(e));
            this._terminalNativeService.onOsResume(() => this._onOsResume());
            this._terminalFocusContextKey = terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS.bindTo(this._contextKeyService);
            this._findWidgetVisible = terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_VISIBLE.bindTo(this._contextKeyService);
            this.onTabDisposed(tab => this._removeTab(tab));
            this.onActiveTabChanged(() => {
                const instance = this.getActiveInstance();
                this._onActiveInstanceChanged.fire(instance ? instance : undefined);
            });
            this._handleContextKeys();
        }
        get _terminalInstances() {
            return this._terminalTabs.reduce((p, c) => p.concat(c.terminalInstances), []);
        }
        get activeTabIndex() { return this._activeTabIndex; }
        get terminalInstances() { return this._terminalInstances; }
        get terminalTabs() { return this._terminalTabs; }
        get onActiveTabChanged() { return this._onActiveTabChanged.event; }
        get onInstanceCreated() { return this._onInstanceCreated.event; }
        get onInstanceDisposed() { return this._onInstanceDisposed.event; }
        get onInstanceProcessIdReady() { return this._onInstanceProcessIdReady.event; }
        get onInstanceRequestSpawnExtHostProcess() { return this._onInstanceRequestSpawnExtHostProcess.event; }
        get onInstanceRequestStartExtensionTerminal() { return this._onInstanceRequestStartExtensionTerminal.event; }
        get onInstanceDimensionsChanged() { return this._onInstanceDimensionsChanged.event; }
        get onInstanceMaximumDimensionsChanged() { return this._onInstanceMaximumDimensionsChanged.event; }
        get onInstancesChanged() { return this._onInstancesChanged.event; }
        get onInstanceTitleChanged() { return this._onInstanceTitleChanged.event; }
        get onActiveInstanceChanged() { return this._onActiveInstanceChanged.event; }
        get onTabDisposed() { return this._onTabDisposed.event; }
        get onRequestAvailableShells() { return this._onRequestAvailableShells.event; }
        _handleContextKeys() {
            const terminalIsOpenContext = terminal_1.KEYBINDING_CONTEXT_TERMINAL_IS_OPEN.bindTo(this._contextKeyService);
            const updateTerminalContextKeys = () => {
                terminalIsOpenContext.set(this.terminalInstances.length > 0);
            };
            this.onInstancesChanged(() => updateTerminalContextKeys());
        }
        getActiveOrCreateInstance(wasNewTerminalAction) {
            const activeInstance = this.getActiveInstance();
            return activeInstance ? activeInstance : this.createTerminal(undefined, wasNewTerminalAction);
        }
        requestSpawnExtHostProcess(proxy, shellLaunchConfig, activeWorkspaceRootUri, cols, rows, isWorkspaceShellAllowed) {
            this._extensionService.whenInstalledExtensionsRegistered().then(() => __awaiter(this, void 0, void 0, function* () {
                // Wait for the remoteAuthority to be ready (and listening for events) before firing
                // the event to spawn the ext host process
                const conn = this._remoteAgentService.getConnection();
                const remoteAuthority = conn ? conn.remoteAuthority : 'null';
                yield this._whenExtHostReady(remoteAuthority);
                this._onInstanceRequestSpawnExtHostProcess.fire({ proxy, shellLaunchConfig, activeWorkspaceRootUri, cols, rows, isWorkspaceShellAllowed });
            }));
        }
        requestStartExtensionTerminal(proxy, cols, rows) {
            this._onInstanceRequestStartExtensionTerminal.fire({ proxy, cols, rows });
        }
        extHostReady(remoteAuthority) {
            return __awaiter(this, void 0, void 0, function* () {
                this._createExtHostReadyEntry(remoteAuthority);
                this._extHostsReady[remoteAuthority].resolve();
            });
        }
        _whenExtHostReady(remoteAuthority) {
            return __awaiter(this, void 0, void 0, function* () {
                this._createExtHostReadyEntry(remoteAuthority);
                return this._extHostsReady[remoteAuthority].promise;
            });
        }
        _createExtHostReadyEntry(remoteAuthority) {
            if (this._extHostsReady[remoteAuthority]) {
                return;
            }
            let resolve;
            const promise = new Promise(r => resolve = r);
            this._extHostsReady[remoteAuthority] = { promise, resolve };
        }
        _onBeforeShutdown() {
            if (this.terminalInstances.length === 0) {
                // No terminal instances, don't veto
                return false;
            }
            if (this.configHelper.config.confirmOnExit) {
                // veto if configured to show confirmation and the user choosed not to exit
                return this._showTerminalCloseConfirmation().then(veto => {
                    if (!veto) {
                        this._isShuttingDown = true;
                    }
                    return veto;
                });
            }
            this._isShuttingDown = true;
            return false;
        }
        _onShutdown() {
            // Dispose of all instances
            this.terminalInstances.forEach(instance => instance.dispose(true));
        }
        _onOpenFileRequest(request) {
            // if the request to open files is coming in from the integrated terminal (identified though
            // the termProgram variable) and we are instructed to wait for editors close, wait for the
            // marker file to get deleted and then focus back to the integrated terminal.
            if (request.termProgram === 'vscode' && request.filesToWait) {
                const waitMarkerFileUri = uri_1.URI.revive(request.filesToWait.waitMarkerFileUri);
                this._terminalNativeService.whenFileDeleted(waitMarkerFileUri).then(() => {
                    if (this.terminalInstances.length > 0) {
                        const terminal = this.getActiveInstance();
                        if (terminal) {
                            terminal.focus();
                        }
                    }
                });
            }
        }
        _onOsResume() {
            const activeTab = this.getActiveTab();
            if (!activeTab) {
                return;
            }
            activeTab.terminalInstances.forEach(instance => instance.forceRedraw());
        }
        getTabLabels() {
            return this._terminalTabs.filter(tab => tab.terminalInstances.length > 0).map((tab, index) => `${index + 1}: ${tab.title ? tab.title : ''}`);
        }
        getFindState() {
            return this._findState;
        }
        _removeTab(tab) {
            // Get the index of the tab and remove it from the list
            const index = this._terminalTabs.indexOf(tab);
            const wasActiveTab = tab === this.getActiveTab();
            if (index !== -1) {
                this._terminalTabs.splice(index, 1);
            }
            // Adjust focus if the tab was active
            if (wasActiveTab && this._terminalTabs.length > 0) {
                // TODO: Only focus the new tab if the removed tab had focus?
                // const hasFocusOnExit = tab.activeInstance.hadFocusOnExit;
                const newIndex = index < this._terminalTabs.length ? index : this._terminalTabs.length - 1;
                this.setActiveTabByIndex(newIndex);
                const activeInstance = this.getActiveInstance();
                if (activeInstance) {
                    activeInstance.focus(true);
                }
            }
            // Hide the panel if there are no more instances, provided that VS Code is not shutting
            // down. When shutting down the panel is locked in place so that it is restored upon next
            // launch.
            if (this._terminalTabs.length === 0 && !this._isShuttingDown) {
                this.hidePanel();
                this._onActiveInstanceChanged.fire(undefined);
            }
            // Fire events
            this._onInstancesChanged.fire();
            if (wasActiveTab) {
                this._onActiveTabChanged.fire();
            }
        }
        refreshActiveTab() {
            // Fire active instances changed
            this._onActiveTabChanged.fire();
        }
        getActiveTab() {
            if (this._activeTabIndex < 0 || this._activeTabIndex >= this._terminalTabs.length) {
                return null;
            }
            return this._terminalTabs[this._activeTabIndex];
        }
        getActiveInstance() {
            const tab = this.getActiveTab();
            if (!tab) {
                return null;
            }
            return tab.activeInstance;
        }
        getInstanceFromId(terminalId) {
            let bgIndex = -1;
            this._backgroundedTerminalInstances.forEach((terminalInstance, i) => {
                if (terminalInstance.id === terminalId) {
                    bgIndex = i;
                }
            });
            if (bgIndex !== -1) {
                return this._backgroundedTerminalInstances[bgIndex];
            }
            try {
                return this.terminalInstances[this._getIndexFromId(terminalId)];
            }
            catch (_a) {
                return undefined;
            }
        }
        getInstanceFromIndex(terminalIndex) {
            return this.terminalInstances[terminalIndex];
        }
        setActiveInstance(terminalInstance) {
            // If this was a hideFromUser terminal created by the API this was triggered by show,
            // in which case we need to create the terminal tab
            if (terminalInstance.shellLaunchConfig.hideFromUser) {
                this._showBackgroundTerminal(terminalInstance);
            }
            this.setActiveInstanceByIndex(this._getIndexFromId(terminalInstance.id));
        }
        setActiveTabByIndex(tabIndex) {
            if (tabIndex >= this._terminalTabs.length) {
                return;
            }
            const didTabChange = this._activeTabIndex !== tabIndex;
            this._activeTabIndex = tabIndex;
            this._terminalTabs.forEach((t, i) => t.setVisible(i === this._activeTabIndex));
            if (didTabChange) {
                this._onActiveTabChanged.fire();
            }
        }
        _getInstanceFromGlobalInstanceIndex(index) {
            let currentTabIndex = 0;
            while (index >= 0 && currentTabIndex < this._terminalTabs.length) {
                const tab = this._terminalTabs[currentTabIndex];
                const count = tab.terminalInstances.length;
                if (index < count) {
                    return {
                        tab,
                        tabIndex: currentTabIndex,
                        instance: tab.terminalInstances[index],
                        localInstanceIndex: index
                    };
                }
                index -= count;
                currentTabIndex++;
            }
            return null;
        }
        setActiveInstanceByIndex(terminalIndex) {
            const query = this._getInstanceFromGlobalInstanceIndex(terminalIndex);
            if (!query) {
                return;
            }
            query.tab.setActiveInstanceByIndex(query.localInstanceIndex);
            const didTabChange = this._activeTabIndex !== query.tabIndex;
            this._activeTabIndex = query.tabIndex;
            this._terminalTabs.forEach((t, i) => t.setVisible(i === query.tabIndex));
            // Only fire the event if there was a change
            if (didTabChange) {
                this._onActiveTabChanged.fire();
            }
        }
        setActiveTabToNext() {
            if (this._terminalTabs.length <= 1) {
                return;
            }
            let newIndex = this._activeTabIndex + 1;
            if (newIndex >= this._terminalTabs.length) {
                newIndex = 0;
            }
            this.setActiveTabByIndex(newIndex);
        }
        setActiveTabToPrevious() {
            if (this._terminalTabs.length <= 1) {
                return;
            }
            let newIndex = this._activeTabIndex - 1;
            if (newIndex < 0) {
                newIndex = this._terminalTabs.length - 1;
            }
            this.setActiveTabByIndex(newIndex);
        }
        splitInstance(instanceToSplit, shellLaunchConfig = {}) {
            const tab = this._getTabForInstance(instanceToSplit);
            if (!tab) {
                return null;
            }
            const instance = tab.split(this._terminalFocusContextKey, this.configHelper, shellLaunchConfig);
            if (!instance) {
                this._showNotEnoughSpaceToast();
                return null;
            }
            this._initInstanceListeners(instance);
            this._onInstancesChanged.fire();
            this._terminalTabs.forEach((t, i) => t.setVisible(i === this._activeTabIndex));
            return instance;
        }
        _initInstanceListeners(instance) {
            instance.addDisposable(instance.onDisposed(this._onInstanceDisposed.fire, this._onInstanceDisposed));
            instance.addDisposable(instance.onTitleChanged(this._onInstanceTitleChanged.fire, this._onInstanceTitleChanged));
            instance.addDisposable(instance.onProcessIdReady(this._onInstanceProcessIdReady.fire, this._onInstanceProcessIdReady));
            instance.addDisposable(instance.onDimensionsChanged(() => this._onInstanceDimensionsChanged.fire(instance)));
            instance.addDisposable(instance.onMaximumDimensionsChanged(() => this._onInstanceMaximumDimensionsChanged.fire(instance)));
            instance.addDisposable(instance.onFocus(this._onActiveInstanceChanged.fire, this._onActiveInstanceChanged));
        }
        _getTabForInstance(instance) {
            for (const tab of this._terminalTabs) {
                if (tab.terminalInstances.indexOf(instance) !== -1) {
                    return tab;
                }
            }
            return null;
        }
        showPanel(focus) {
            return new Promise((complete) => {
                const panel = this._panelService.getActivePanel();
                if (!panel || panel.getId() !== terminal_1.TERMINAL_PANEL_ID) {
                    this._panelService.openPanel(terminal_1.TERMINAL_PANEL_ID, focus);
                    if (focus) {
                        // Do the focus call asynchronously as going through the
                        // command palette will force editor focus
                        setTimeout(() => {
                            const instance = this.getActiveInstance();
                            if (instance) {
                                instance.focusWhenReady(true).then(() => complete(undefined));
                            }
                            else {
                                complete(undefined);
                            }
                        }, 0);
                    }
                    else {
                        complete(undefined);
                    }
                }
                else {
                    if (focus) {
                        // Do the focus call asynchronously as going through the
                        // command palette will force editor focus
                        setTimeout(() => {
                            const instance = this.getActiveInstance();
                            if (instance) {
                                instance.focusWhenReady(true).then(() => complete(undefined));
                            }
                            else {
                                complete(undefined);
                            }
                        }, 0);
                    }
                    else {
                        complete(undefined);
                    }
                }
                return undefined;
            });
        }
        _getIndexFromId(terminalId) {
            let terminalIndex = -1;
            this.terminalInstances.forEach((terminalInstance, i) => {
                if (terminalInstance.id === terminalId) {
                    terminalIndex = i;
                }
            });
            if (terminalIndex === -1) {
                throw new Error(`Terminal with ID ${terminalId} does not exist (has it already been disposed?)`);
            }
            return terminalIndex;
        }
        manageWorkspaceShellPermissions() {
            return __awaiter(this, void 0, void 0, function* () {
                const allowItem = { label: nls.localize('workbench.action.terminal.allowWorkspaceShell', "Allow Workspace Shell Configuration") };
                const disallowItem = { label: nls.localize('workbench.action.terminal.disallowWorkspaceShell', "Disallow Workspace Shell Configuration") };
                const value = yield this._quickInputService.pick([allowItem, disallowItem], { canPickMany: false });
                if (!value) {
                    return;
                }
                this.configHelper.setWorkspaceShellAllowed(value === allowItem);
            });
        }
        _showTerminalCloseConfirmation() {
            return __awaiter(this, void 0, void 0, function* () {
                let message;
                if (this.terminalInstances.length === 1) {
                    message = nls.localize('terminalService.terminalCloseConfirmationSingular', "There is an active terminal session, do you want to kill it?");
                }
                else {
                    message = nls.localize('terminalService.terminalCloseConfirmationPlural', "There are {0} active terminal sessions, do you want to kill them?", this.terminalInstances.length);
                }
                const res = yield this._dialogService.confirm({
                    message,
                    type: 'warning',
                });
                return !res.confirmed;
            });
        }
        _showNotEnoughSpaceToast() {
            this._notificationService.info(nls.localize('terminal.minWidth', "Not enough space to split terminal."));
        }
        _validateShellPaths(label, potentialPaths) {
            if (potentialPaths.length === 0) {
                return Promise.resolve(null);
            }
            const current = potentialPaths.shift();
            if (current === '') {
                return this._validateShellPaths(label, potentialPaths);
            }
            return this._fileService.exists(uri_1.URI.file(current)).then(exists => {
                if (!exists) {
                    return this._validateShellPaths(label, potentialPaths);
                }
                return [label, current];
            });
        }
        preparePathForTerminalAsync(originalPath, executable, title) {
            return new Promise(c => {
                if (!executable) {
                    c(originalPath);
                    return;
                }
                const hasSpace = originalPath.indexOf(' ') !== -1;
                const pathBasename = path_1.basename(executable, '.exe');
                const isPowerShell = pathBasename === 'pwsh' ||
                    title === 'pwsh' ||
                    pathBasename === 'powershell' ||
                    title === 'powershell';
                if (isPowerShell && (hasSpace || originalPath.indexOf('\'') !== -1)) {
                    c(`& '${originalPath.replace(/'/g, '\'\'')}'`);
                    return;
                }
                if (platform_1.isWindows) {
                    // 17063 is the build number where wsl path was introduced.
                    // Update Windows uriPath to be executed in WSL.
                    const lowerExecutable = executable.toLowerCase();
                    if (this._terminalNativeService.getWindowsBuildNumber() >= 17063 &&
                        (lowerExecutable.indexOf('wsl') !== -1 || (lowerExecutable.indexOf('bash.exe') !== -1 && lowerExecutable.toLowerCase().indexOf('git') === -1))) {
                        c(this._terminalNativeService.getWslPath(originalPath));
                        return;
                    }
                    else if (hasSpace) {
                        c('"' + originalPath + '"');
                    }
                    else {
                        c(originalPath);
                    }
                    return;
                }
                c(terminalEnvironment_1.escapeNonWindowsPath(originalPath));
            });
        }
        selectDefaultWindowsShell() {
            return this._detectWindowsShells().then(shells => {
                const options = {
                    placeHolder: nls.localize('terminal.integrated.chooseWindowsShell', "Select your preferred terminal shell, you can change this later in your settings")
                };
                const quickPickItems = shells.map(s => {
                    return { label: s.label, description: s.path };
                });
                return this._quickInputService.pick(quickPickItems, options).then((value) => __awaiter(this, void 0, void 0, function* () {
                    if (!value) {
                        return undefined;
                    }
                    const shell = value.description;
                    const env = yield this._remoteAgentService.getEnvironment();
                    let platformKey;
                    if (env) {
                        platformKey = env.os === 1 /* Windows */ ? 'windows' : (env.os === 2 /* Macintosh */ ? 'osx' : 'linux');
                    }
                    else {
                        platformKey = platform_1.isWindows ? 'windows' : (platform_1.isMacintosh ? 'osx' : 'linux');
                    }
                    yield this._configurationService.updateValue(`terminal.integrated.shell.${platformKey}`, shell, 1 /* USER */).then(() => shell);
                    return Promise.resolve();
                }));
            });
        }
        _detectWindowsShells() {
            return new Promise(r => this._onRequestAvailableShells.fire(r));
        }
    };
    TerminalService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, panelService_1.IPanelService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, storage_1.IStorageService),
        __param(4, notification_1.INotificationService),
        __param(5, dialogs_1.IDialogService),
        __param(6, extensions_1.IExtensionService),
        __param(7, files_1.IFileService),
        __param(8, remoteAgentService_1.IRemoteAgentService),
        __param(9, terminal_1.ITerminalNativeService),
        __param(10, quickInput_1.IQuickInputService),
        __param(11, configuration_1.IConfigurationService)
    ], TerminalService);
    exports.TerminalService = TerminalService;
});
//# sourceMappingURL=terminalService.js.map