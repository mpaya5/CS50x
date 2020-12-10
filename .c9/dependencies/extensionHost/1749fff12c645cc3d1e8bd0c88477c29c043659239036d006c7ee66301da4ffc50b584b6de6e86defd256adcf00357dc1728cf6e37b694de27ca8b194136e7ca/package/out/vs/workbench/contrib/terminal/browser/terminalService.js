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
define(["require", "exports", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalService", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/layout/browser/layoutService", "vs/platform/lifecycle/common/lifecycle", "vs/platform/storage/common/storage", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/workbench/contrib/terminal/browser/terminalTab", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "vs/platform/files/common/files", "vs/workbench/contrib/terminal/browser/terminalInstance", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/contrib/terminal/browser/terminalConfigHelper", "vs/platform/quickinput/common/quickInput", "vs/platform/configuration/common/configuration"], function (require, exports, terminal_1, terminalService_1, contextkey_1, panelService_1, layoutService_1, lifecycle_1, storage_1, dialogs_1, notification_1, terminalTab_1, instantiation_1, extensions_1, files_1, terminalInstance_1, remoteAgentService_1, terminalConfigHelper_1, quickInput_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalService = class TerminalService extends terminalService_1.TerminalService {
        constructor(contextKeyService, panelService, _layoutService, lifecycleService, storageService, notificationService, dialogService, _instantiationService, extensionService, fileService, remoteAgentService, terminalNativeService, quickInputService, configurationService) {
            super(contextKeyService, panelService, lifecycleService, storageService, notificationService, dialogService, extensionService, fileService, remoteAgentService, terminalNativeService, quickInputService, configurationService);
            this._layoutService = _layoutService;
            this._instantiationService = _instantiationService;
            this.terminalNativeService = terminalNativeService;
            this.quickInputService = quickInputService;
            this.configurationService = configurationService;
            this._configHelper = this._instantiationService.createInstance(terminalConfigHelper_1.TerminalConfigHelper, this.terminalNativeService.linuxDistro);
        }
        get configHelper() { return this._configHelper; }
        createInstance(container, shellLaunchConfig) {
            const instance = this._instantiationService.createInstance(terminalInstance_1.TerminalInstance, this._terminalFocusContextKey, this._configHelper, container, shellLaunchConfig);
            this._onInstanceCreated.fire(instance);
            return instance;
        }
        createTerminal(shell = {}) {
            if (shell.hideFromUser) {
                const instance = this.createInstance(undefined, shell);
                this._backgroundedTerminalInstances.push(instance);
                this._initInstanceListeners(instance);
                return instance;
            }
            const terminalTab = this._instantiationService.createInstance(terminalTab_1.TerminalTab, this._terminalFocusContextKey, this.configHelper, this._terminalContainer, shell);
            this._terminalTabs.push(terminalTab);
            const instance = terminalTab.terminalInstances[0];
            terminalTab.addDisposable(terminalTab.onDisposed(this._onTabDisposed.fire, this._onTabDisposed));
            terminalTab.addDisposable(terminalTab.onInstancesChanged(this._onInstancesChanged.fire, this._onInstancesChanged));
            this._initInstanceListeners(instance);
            if (this.terminalInstances.length === 1) {
                // It's the first instance so it should be made active automatically
                this.setActiveInstanceByIndex(0);
            }
            this._onInstancesChanged.fire();
            return instance;
        }
        _showBackgroundTerminal(instance) {
            this._backgroundedTerminalInstances.splice(this._backgroundedTerminalInstances.indexOf(instance), 1);
            instance.shellLaunchConfig.hideFromUser = false;
            const terminalTab = this._instantiationService.createInstance(terminalTab_1.TerminalTab, this._terminalFocusContextKey, this.configHelper, this._terminalContainer, instance);
            this._terminalTabs.push(terminalTab);
            terminalTab.addDisposable(terminalTab.onDisposed(this._onTabDisposed.fire, this._onTabDisposed));
            terminalTab.addDisposable(terminalTab.onInstancesChanged(this._onInstancesChanged.fire, this._onInstancesChanged));
            if (this.terminalInstances.length === 1) {
                // It's the first instance so it should be made active automatically
                this.setActiveInstanceByIndex(0);
            }
            this._onInstancesChanged.fire();
        }
        focusFindWidget() {
            return this.showPanel(false).then(() => {
                const panel = this._panelService.getActivePanel();
                panel.focusFindWidget();
                this._findWidgetVisible.set(true);
            });
        }
        hideFindWidget() {
            const panel = this._panelService.getActivePanel();
            if (panel && panel.getId() === terminal_1.TERMINAL_PANEL_ID) {
                panel.hideFindWidget();
                this._findWidgetVisible.reset();
                panel.focus();
            }
        }
        findNext() {
            const panel = this._panelService.getActivePanel();
            if (panel && panel.getId() === terminal_1.TERMINAL_PANEL_ID) {
                panel.showFindWidget();
                panel.getFindWidget().find(false);
            }
        }
        findPrevious() {
            const panel = this._panelService.getActivePanel();
            if (panel && panel.getId() === terminal_1.TERMINAL_PANEL_ID) {
                panel.showFindWidget();
                panel.getFindWidget().find(true);
            }
        }
        setContainers(panelContainer, terminalContainer) {
            this._configHelper.panelContainer = panelContainer;
            this._terminalContainer = terminalContainer;
            this._terminalTabs.forEach(tab => tab.attachToElement(terminalContainer));
        }
        hidePanel() {
            const panel = this._panelService.getActivePanel();
            if (panel && panel.getId() === terminal_1.TERMINAL_PANEL_ID) {
                this._layoutService.setPanelHidden(true);
            }
        }
    };
    TerminalService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, panelService_1.IPanelService),
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, lifecycle_1.ILifecycleService),
        __param(4, storage_1.IStorageService),
        __param(5, notification_1.INotificationService),
        __param(6, dialogs_1.IDialogService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, extensions_1.IExtensionService),
        __param(9, files_1.IFileService),
        __param(10, remoteAgentService_1.IRemoteAgentService),
        __param(11, terminal_1.ITerminalNativeService),
        __param(12, quickInput_1.IQuickInputService),
        __param(13, configuration_1.IConfigurationService)
    ], TerminalService);
    exports.TerminalService = TerminalService;
});
//# sourceMappingURL=terminalService.js.map