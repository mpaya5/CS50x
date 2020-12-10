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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/workbench/common/contributions", "vs/platform/statusbar/common/statusbar", "vs/platform/label/common/label", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/remote/common/remoteHosts", "vs/workbench/services/extensions/common/extensions", "vs/platform/quickinput/common/quickInput", "vs/platform/log/common/log", "vs/platform/dialogs/common/dialogs", "vs/platform/dialogs/node/dialogIpc", "vs/platform/download/common/downloadIpc", "vs/platform/log/common/logIpc", "electron", "vs/workbench/services/environment/common/environmentService", "vs/platform/progress/common/progress", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/severity", "vs/workbench/browser/actions/windowActions", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/windows/common/windows", "vs/workbench/browser/contextkeys", "vs/platform/download/common/download"], function (require, exports, nls, platform_1, theme_1, themeService_1, remoteAgentService_1, lifecycle_1, actions_1, contributions_1, statusbar_1, label_1, contextkey_1, commands_1, remoteHosts_1, extensions_1, quickInput_1, log_1, dialogs_1, dialogIpc_1, downloadIpc_1, logIpc_1, electron_1, environmentService_1, progress_1, configuration_1, configurationRegistry_1, severity_1, windowActions_1, remoteAuthorityResolver_1, windows_1, contextkeys_1, download_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const WINDOW_ACTIONS_COMMAND_ID = 'remote.showActions';
    const CLOSE_REMOTE_COMMAND_ID = 'remote.closeRemote';
    let RemoteWindowActiveIndicator = class RemoteWindowActiveIndicator extends lifecycle_1.Disposable {
        constructor(statusbarService, environmentService, labelService, contextKeyService, menuService, quickInputService, commandService, extensionService, remoteAgentService, remoteAuthorityResolverService, windowService) {
            super();
            this.statusbarService = statusbarService;
            this.labelService = labelService;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
            this.hasWindowActions = false;
            this.connectionState = undefined;
            this.windowCommandMenu = this.menuService.createMenu(35 /* StatusBarWindowIndicatorMenu */, this.contextKeyService);
            this._register(this.windowCommandMenu);
            this._register(commands_1.CommandsRegistry.registerCommand(WINDOW_ACTIONS_COMMAND_ID, _ => this.showIndicatorActions(this.windowCommandMenu)));
            this._register(commands_1.CommandsRegistry.registerCommand(CLOSE_REMOTE_COMMAND_ID, _ => this.remoteAuthority && windowService.openNewWindow({ reuseWindow: true })));
            this.remoteAuthority = environmentService.configuration.remoteAuthority;
            contextkeys_1.Deprecated_RemoteAuthorityContext.bindTo(this.contextKeyService).set(this.remoteAuthority || '');
            if (this.remoteAuthority) {
                // Pending entry until extensions are ready
                this.renderWindowIndicator(nls.localize('host.open', "$(sync~spin) Opening Remote..."), undefined, WINDOW_ACTIONS_COMMAND_ID);
                this.connectionState = 'initializing';
                contextkeys_1.RemoteConnectionState.bindTo(this.contextKeyService).set(this.connectionState);
                actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
                    group: '6_close',
                    command: {
                        id: CLOSE_REMOTE_COMMAND_ID,
                        title: nls.localize({ key: 'miCloseRemote', comment: ['&& denotes a mnemonic'] }, "Close Re&&mote Connection")
                    },
                    order: 3.5
                });
                const connection = remoteAgentService.getConnection();
                if (connection) {
                    this._register(connection.onDidStateChange((e) => {
                        switch (e.type) {
                            case 0 /* ConnectionLost */:
                            case 3 /* ReconnectionPermanentFailure */:
                            case 2 /* ReconnectionRunning */:
                            case 1 /* ReconnectionWait */:
                                this.setDisconnected(true);
                                break;
                            case 4 /* ConnectionGain */:
                                this.setDisconnected(false);
                                break;
                        }
                    }));
                }
            }
            extensionService.whenInstalledExtensionsRegistered().then(_ => {
                if (this.remoteAuthority) {
                    this._register(this.labelService.onDidChangeFormatters(e => this.updateWindowIndicator()));
                    remoteAuthorityResolverService.resolveAuthority(this.remoteAuthority).then(() => this.setDisconnected(false), () => this.setDisconnected(true));
                }
                this._register(this.windowCommandMenu.onDidChange(e => this.updateWindowActions()));
                this.updateWindowIndicator();
            });
        }
        setDisconnected(isDisconnected) {
            const newState = isDisconnected ? 'disconnected' : 'connected';
            if (this.connectionState !== newState) {
                this.connectionState = newState;
                contextkeys_1.RemoteConnectionState.bindTo(this.contextKeyService).set(this.connectionState);
                contextkeys_1.Deprecated_RemoteAuthorityContext.bindTo(this.contextKeyService).set(isDisconnected ? `disconnected/${this.remoteAuthority}` : this.remoteAuthority);
                this.updateWindowIndicator();
            }
        }
        updateWindowIndicator() {
            const windowActionCommand = (this.remoteAuthority || this.windowCommandMenu.getActions().length) ? WINDOW_ACTIONS_COMMAND_ID : undefined;
            if (this.remoteAuthority) {
                const hostLabel = this.labelService.getHostLabel(remoteHosts_1.REMOTE_HOST_SCHEME, this.remoteAuthority) || this.remoteAuthority;
                if (this.connectionState !== 'disconnected') {
                    this.renderWindowIndicator(`$(remote) ${hostLabel}`, nls.localize('host.tooltip', "Editing on {0}", hostLabel), windowActionCommand);
                }
                else {
                    this.renderWindowIndicator(`$(alert) ${nls.localize('disconnectedFrom', "Disconnected from")} ${hostLabel}`, nls.localize('host.tooltipDisconnected', "Disconnected from {0}", hostLabel), windowActionCommand);
                }
            }
            else {
                if (windowActionCommand) {
                    this.renderWindowIndicator(`$(remote)`, nls.localize('noHost.tooltip', "Open a remote window"), windowActionCommand);
                }
                else if (this.windowIndicatorEntry) {
                    this.windowIndicatorEntry.dispose();
                    this.windowIndicatorEntry = undefined;
                }
            }
        }
        updateWindowActions() {
            const newHasWindowActions = this.windowCommandMenu.getActions().length > 0;
            if (newHasWindowActions !== this.hasWindowActions) {
                this.hasWindowActions = newHasWindowActions;
                this.updateWindowIndicator();
            }
        }
        renderWindowIndicator(text, tooltip, command) {
            const properties = {
                backgroundColor: themeService_1.themeColorFromId(theme_1.STATUS_BAR_HOST_NAME_BACKGROUND), color: themeService_1.themeColorFromId(theme_1.STATUS_BAR_HOST_NAME_FOREGROUND), text, tooltip, command
            };
            if (this.windowIndicatorEntry) {
                this.windowIndicatorEntry.update(properties);
            }
            else {
                this.windowIndicatorEntry = this.statusbarService.addEntry(properties, 'status.host', nls.localize('status.host', "Remote Host"), 0 /* LEFT */, Number.MAX_VALUE /* first entry */);
            }
        }
        showIndicatorActions(menu) {
            const actions = menu.getActions();
            const items = [];
            for (let actionGroup of actions) {
                if (items.length) {
                    items.push({ type: 'separator' });
                }
                for (let action of actionGroup[1]) {
                    if (action instanceof actions_1.MenuItemAction) {
                        let label = typeof action.item.title === 'string' ? action.item.title : action.item.title.value;
                        if (action.item.category) {
                            const category = typeof action.item.category === 'string' ? action.item.category : action.item.category.value;
                            label = nls.localize('cat.title', "{0}: {1}", category, label);
                        }
                        items.push({
                            type: 'item',
                            id: action.item.id,
                            label
                        });
                    }
                }
            }
            if (this.remoteAuthority) {
                if (items.length) {
                    items.push({ type: 'separator' });
                }
                items.push({
                    type: 'item',
                    id: CLOSE_REMOTE_COMMAND_ID,
                    label: nls.localize('closeRemote.title', 'Close Remote Connection')
                });
            }
            const quickPick = this.quickInputService.createQuickPick();
            quickPick.items = items;
            quickPick.canSelectMany = false;
            quickPick.onDidAccept(_ => {
                const selectedItems = quickPick.selectedItems;
                if (selectedItems.length === 1) {
                    this.commandService.executeCommand(selectedItems[0].id);
                }
                quickPick.hide();
            });
            quickPick.show();
        }
    };
    RemoteWindowActiveIndicator = __decorate([
        __param(0, statusbar_1.IStatusbarService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, label_1.ILabelService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, actions_1.IMenuService),
        __param(5, quickInput_1.IQuickInputService),
        __param(6, commands_1.ICommandService),
        __param(7, extensions_1.IExtensionService),
        __param(8, remoteAgentService_1.IRemoteAgentService),
        __param(9, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(10, windows_1.IWindowsService)
    ], RemoteWindowActiveIndicator);
    exports.RemoteWindowActiveIndicator = RemoteWindowActiveIndicator;
    let RemoteChannelsContribution = class RemoteChannelsContribution {
        constructor(logService, remoteAgentService, dialogService, downloadService) {
            const connection = remoteAgentService.getConnection();
            if (connection) {
                connection.registerChannel('dialog', new dialogIpc_1.DialogChannel(dialogService));
                connection.registerChannel('download', new downloadIpc_1.DownloadServiceChannel(downloadService));
                connection.registerChannel('loglevel', new logIpc_1.LogLevelSetterChannel(logService));
            }
        }
    };
    RemoteChannelsContribution = __decorate([
        __param(0, log_1.ILogService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, dialogs_1.IDialogService),
        __param(3, download_1.IDownloadService)
    ], RemoteChannelsContribution);
    let RemoteAgentDiagnosticListener = class RemoteAgentDiagnosticListener {
        constructor(remoteAgentService, labelService) {
            electron_1.ipcRenderer.on('vscode:getDiagnosticInfo', (event, request) => {
                const connection = remoteAgentService.getConnection();
                if (connection) {
                    const hostName = labelService.getHostLabel(remoteHosts_1.REMOTE_HOST_SCHEME, connection.remoteAuthority);
                    remoteAgentService.getDiagnosticInfo(request.args)
                        .then(info => {
                        if (info) {
                            info.hostName = hostName;
                        }
                        electron_1.ipcRenderer.send(request.replyChannel, info);
                    })
                        .catch(e => {
                        const errorMessage = e && e.message ? `Fetching remote diagnostics for '${hostName}' failed: ${e.message}` : `Fetching remote diagnostics for '${hostName}' failed.`;
                        electron_1.ipcRenderer.send(request.replyChannel, { hostName, errorMessage });
                    });
                }
                else {
                    electron_1.ipcRenderer.send(request.replyChannel);
                }
            });
        }
    };
    RemoteAgentDiagnosticListener = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, label_1.ILabelService)
    ], RemoteAgentDiagnosticListener);
    class ProgressReporter {
        constructor(currentProgress) {
            this._currentProgress = null;
            this.lastReport = null;
            this._currentProgress = currentProgress;
        }
        set currentProgress(progress) {
            this._currentProgress = progress;
        }
        report(message) {
            if (message) {
                this.lastReport = message;
            }
            if (this.lastReport && this._currentProgress) {
                this._currentProgress.report({ message: this.lastReport });
            }
        }
    }
    let RemoteExtensionHostEnvironmentUpdater = class RemoteExtensionHostEnvironmentUpdater {
        constructor(remoteAgentService, remoteResolverService, extensionService) {
            const connection = remoteAgentService.getConnection();
            if (connection) {
                connection.onDidStateChange((e) => __awaiter(this, void 0, void 0, function* () {
                    if (e.type === 4 /* ConnectionGain */) {
                        const resolveResult = yield remoteResolverService.resolveAuthority(connection.remoteAuthority);
                        if (resolveResult.options && resolveResult.options.extensionHostEnv) {
                            yield extensionService.setRemoteEnvironment(resolveResult.options.extensionHostEnv);
                        }
                    }
                }));
            }
        }
    };
    RemoteExtensionHostEnvironmentUpdater = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(2, extensions_1.IExtensionService)
    ], RemoteExtensionHostEnvironmentUpdater);
    let RemoteAgentConnectionStatusListener = class RemoteAgentConnectionStatusListener {
        constructor(remoteAgentService, progressService, dialogService, commandService, contextKeyService) {
            const connection = remoteAgentService.getConnection();
            if (connection) {
                let currentProgressPromiseResolve = null;
                let progressReporter = null;
                let lastLocation = null;
                let currentTimer = null;
                let reconnectWaitEvent = null;
                let disposableListener = null;
                function showProgress(location, buttons) {
                    if (currentProgressPromiseResolve) {
                        currentProgressPromiseResolve();
                    }
                    const promise = new Promise((resolve) => currentProgressPromiseResolve = resolve);
                    lastLocation = location;
                    if (location === 20 /* Dialog */) {
                        // Show dialog
                        progressService.withProgress({ location: 20 /* Dialog */, buttons }, (progress) => { if (progressReporter) {
                            progressReporter.currentProgress = progress;
                        } return promise; }, (choice) => {
                            // Handle choice from dialog
                            if (choice === 0 && buttons && reconnectWaitEvent) {
                                reconnectWaitEvent.skipWait();
                            }
                            else {
                                showProgress(15 /* Notification */, buttons);
                            }
                            progressReporter.report();
                        });
                    }
                    else {
                        // Show notification
                        progressService.withProgress({ location: 15 /* Notification */, buttons }, (progress) => { if (progressReporter) {
                            progressReporter.currentProgress = progress;
                        } return promise; }, (choice) => {
                            // Handle choice from notification
                            if (choice === 0 && buttons && reconnectWaitEvent) {
                                reconnectWaitEvent.skipWait();
                            }
                            else {
                                hideProgress();
                            }
                        });
                    }
                }
                function hideProgress() {
                    if (currentProgressPromiseResolve) {
                        currentProgressPromiseResolve();
                    }
                    currentProgressPromiseResolve = null;
                }
                connection.onDidStateChange((e) => {
                    if (currentTimer) {
                        currentTimer.dispose();
                        currentTimer = null;
                    }
                    if (disposableListener) {
                        disposableListener.dispose();
                        disposableListener = null;
                    }
                    switch (e.type) {
                        case 0 /* ConnectionLost */:
                            if (!currentProgressPromiseResolve) {
                                progressReporter = new ProgressReporter(null);
                                showProgress(20 /* Dialog */, [nls.localize('reconnectNow', "Reconnect Now")]);
                            }
                            progressReporter.report(nls.localize('connectionLost', "Connection Lost"));
                            break;
                        case 1 /* ReconnectionWait */:
                            hideProgress();
                            reconnectWaitEvent = e;
                            showProgress(lastLocation || 15 /* Notification */, [nls.localize('reconnectNow', "Reconnect Now")]);
                            currentTimer = new ReconnectionTimer(progressReporter, Date.now() + 1000 * e.durationSeconds);
                            break;
                        case 2 /* ReconnectionRunning */:
                            hideProgress();
                            showProgress(lastLocation || 15 /* Notification */);
                            progressReporter.report(nls.localize('reconnectionRunning', "Attempting to reconnect..."));
                            // Register to listen for quick input is opened
                            disposableListener = contextKeyService.onDidChangeContext((contextKeyChangeEvent) => {
                                const reconnectInteraction = new Set(['inQuickOpen']);
                                if (contextKeyChangeEvent.affectsSome(reconnectInteraction)) {
                                    // Need to move from dialog if being shown and user needs to type in a prompt
                                    if (lastLocation === 20 /* Dialog */ && progressReporter !== null) {
                                        hideProgress();
                                        showProgress(15 /* Notification */);
                                        progressReporter.report();
                                    }
                                }
                            });
                            break;
                        case 3 /* ReconnectionPermanentFailure */:
                            hideProgress();
                            progressReporter = null;
                            dialogService.show(severity_1.default.Error, nls.localize('reconnectionPermanentFailure', "Cannot reconnect. Please reload the window."), [nls.localize('reloadWindow', "Reload Window"), nls.localize('cancel', "Cancel")], { cancelId: 1 }).then(choice => {
                                // Reload the window
                                if (choice === 0) {
                                    commandService.executeCommand(windowActions_1.ReloadWindowAction.ID);
                                }
                            });
                            break;
                        case 4 /* ConnectionGain */:
                            hideProgress();
                            progressReporter = null;
                            break;
                    }
                });
            }
        }
    };
    RemoteAgentConnectionStatusListener = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, progress_1.IProgressService),
        __param(2, dialogs_1.IDialogService),
        __param(3, commands_1.ICommandService),
        __param(4, contextkey_1.IContextKeyService)
    ], RemoteAgentConnectionStatusListener);
    class ReconnectionTimer {
        constructor(progressReporter, completionTime) {
            this._progressReporter = progressReporter;
            this._completionTime = completionTime;
            this._token = setInterval(() => this._render(), 1000);
            this._render();
        }
        dispose() {
            clearInterval(this._token);
        }
        _render() {
            const remainingTimeMs = this._completionTime - Date.now();
            if (remainingTimeMs < 0) {
                return;
            }
            const remainingTime = Math.ceil(remainingTimeMs / 1000);
            if (remainingTime === 1) {
                this._progressReporter.report(nls.localize('reconnectionWaitOne', "Attempting to reconnect in {0} second...", remainingTime));
            }
            else {
                this._progressReporter.report(nls.localize('reconnectionWaitMany', "Attempting to reconnect in {0} seconds...", remainingTime));
            }
        }
    }
    let RemoteTelemetryEnablementUpdater = class RemoteTelemetryEnablementUpdater extends lifecycle_1.Disposable {
        constructor(remoteAgentService, configurationService) {
            super();
            this.remoteAgentService = remoteAgentService;
            this.configurationService = configurationService;
            this.updateRemoteTelemetryEnablement();
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('telemetry.enableTelemetry')) {
                    this.updateRemoteTelemetryEnablement();
                }
            }));
        }
        updateRemoteTelemetryEnablement() {
            if (!this.configurationService.getValue('telemetry.enableTelemetry')) {
                return this.remoteAgentService.disableTelemetry();
            }
            return Promise.resolve();
        }
    };
    RemoteTelemetryEnablementUpdater = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, configuration_1.IConfigurationService)
    ], RemoteTelemetryEnablementUpdater);
    let RemoteEmptyWorkbenchPresentation = class RemoteEmptyWorkbenchPresentation extends lifecycle_1.Disposable {
        constructor(environmentService, remoteAuthorityResolverService, configurationService, commandService) {
            super();
            function shouldShowExplorer() {
                const startupEditor = configurationService.getValue('workbench.startupEditor');
                return startupEditor !== 'welcomePage' && startupEditor !== 'welcomePageInEmptyWorkbench';
            }
            function shouldShowTerminal() {
                return shouldShowExplorer();
            }
            const { remoteAuthority, folderUri, workspace } = environmentService.configuration;
            if (remoteAuthority && !folderUri && !workspace) {
                remoteAuthorityResolverService.resolveAuthority(remoteAuthority).then(() => {
                    if (shouldShowExplorer()) {
                        commandService.executeCommand('workbench.view.explorer');
                    }
                    if (shouldShowTerminal()) {
                        commandService.executeCommand('workbench.action.terminal.toggleTerminal');
                    }
                });
            }
        }
    };
    RemoteEmptyWorkbenchPresentation = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, commands_1.ICommandService)
    ], RemoteEmptyWorkbenchPresentation);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteChannelsContribution, 1 /* Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteAgentDiagnosticListener, 4 /* Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteAgentConnectionStatusListener, 4 /* Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteExtensionHostEnvironmentUpdater, 4 /* Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteWindowActiveIndicator, 1 /* Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteTelemetryEnablementUpdater, 2 /* Ready */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteEmptyWorkbenchPresentation, 1 /* Starting */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        id: 'remote',
        title: nls.localize('remote', "Remote"),
        type: 'object',
        properties: {
            'remote.extensionKind': {
                type: 'object',
                markdownDescription: nls.localize('remote.extensionKind', "Override the kind of an extension. `ui` extensions are installed and run on the local machine while `workspace` extensions are run on the remote. By overriding an extension's default kind using this setting, you specify if that extension should be installed and enabled locally or remotely."),
                patternProperties: {
                    '([a-z0-9A-Z][a-z0-9\-A-Z]*)\\.([a-z0-9A-Z][a-z0-9\-A-Z]*)$': {
                        type: 'string',
                        enum: [
                            'ui',
                            'workspace'
                        ],
                        enumDescriptions: [
                            nls.localize('ui', "UI extension kind. In a remote window, such extensions are enabled only when available on the local machine."),
                            nls.localize('workspace', "Workspace extension kind. In a remote window, such extensions are enabled only when available on the remote.")
                        ],
                        default: 'ui'
                    },
                },
                default: {
                    'pub.name': 'ui'
                }
            }
        }
    });
});
//# sourceMappingURL=remote.contribution.js.map