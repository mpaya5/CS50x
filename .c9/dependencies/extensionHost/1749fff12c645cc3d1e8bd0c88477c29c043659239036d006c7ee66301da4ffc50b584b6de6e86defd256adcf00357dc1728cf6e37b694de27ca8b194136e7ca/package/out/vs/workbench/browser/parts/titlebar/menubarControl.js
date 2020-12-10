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
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/theme/common/themeService", "vs/platform/windows/common/windows", "vs/platform/contextkey/common/contextkey", "vs/base/common/actions", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/dom", "vs/platform/keybinding/common/keybinding", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/history/common/history", "vs/base/common/async", "vs/workbench/common/theme", "vs/platform/label/common/label", "vs/platform/update/common/update", "vs/platform/storage/common/storage", "vs/platform/notification/common/notification", "vs/workbench/services/preferences/common/preferences", "vs/platform/environment/common/environment", "vs/base/browser/ui/menu/menubar", "vs/base/browser/ui/menu/menu", "vs/platform/theme/common/styler", "vs/base/common/objects", "vs/base/common/labels", "vs/platform/accessibility/common/accessibility", "vs/workbench/services/layout/browser/layoutService", "vs/base/browser/browser"], function (require, exports, nls, actions_1, themeService_1, windows_1, contextkey_1, actions_2, actionbar_1, DOM, keybinding_1, platform_1, configuration_1, event_1, lifecycle_1, history_1, async_1, theme_1, label_1, update_1, storage_1, notification_1, preferences_1, environment_1, menubar_1, menu_1, styler_1, objects_1, labels_1, accessibility_1, layoutService_1, browser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MenubarControl extends lifecycle_1.Disposable {
        constructor(menuService, windowService, windowsService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService) {
            super();
            this.menuService = menuService;
            this.windowService = windowService;
            this.windowsService = windowsService;
            this.contextKeyService = contextKeyService;
            this.keybindingService = keybindingService;
            this.configurationService = configurationService;
            this.labelService = labelService;
            this.updateService = updateService;
            this.storageService = storageService;
            this.notificationService = notificationService;
            this.preferencesService = preferencesService;
            this.environmentService = environmentService;
            this.accessibilityService = accessibilityService;
            this.keys = [
                'window.menuBarVisibility',
                'window.enableMenuBarMnemonics',
                'window.customMenuBarAltFocus',
                'window.nativeTabs'
            ];
            this.topLevelTitles = {
                'File': nls.localize({ key: 'mFile', comment: ['&& denotes a mnemonic'] }, "&&File"),
                'Edit': nls.localize({ key: 'mEdit', comment: ['&& denotes a mnemonic'] }, "&&Edit"),
                'Selection': nls.localize({ key: 'mSelection', comment: ['&& denotes a mnemonic'] }, "&&Selection"),
                'View': nls.localize({ key: 'mView', comment: ['&& denotes a mnemonic'] }, "&&View"),
                'Go': nls.localize({ key: 'mGoto', comment: ['&& denotes a mnemonic'] }, "&&Go"),
                'Debug': nls.localize({ key: 'mDebug', comment: ['&& denotes a mnemonic'] }, "&&Debug"),
                'Terminal': nls.localize({ key: 'mTerminal', comment: ['&& denotes a mnemonic'] }, "&&Terminal"),
                'Help': nls.localize({ key: 'mHelp', comment: ['&& denotes a mnemonic'] }, "&&Help")
            };
            this.menus = {
                'File': this._register(this.menuService.createMenu(15 /* MenubarFileMenu */, this.contextKeyService)),
                'Edit': this._register(this.menuService.createMenu(14 /* MenubarEditMenu */, this.contextKeyService)),
                'Selection': this._register(this.menuService.createMenu(22 /* MenubarSelectionMenu */, this.contextKeyService)),
                'View': this._register(this.menuService.createMenu(26 /* MenubarViewMenu */, this.contextKeyService)),
                'Go': this._register(this.menuService.createMenu(16 /* MenubarGoMenu */, this.contextKeyService)),
                'Debug': this._register(this.menuService.createMenu(13 /* MenubarDebugMenu */, this.contextKeyService)),
                'Terminal': this._register(this.menuService.createMenu(25 /* MenubarTerminalMenu */, this.contextKeyService)),
                'Help': this._register(this.menuService.createMenu(17 /* MenubarHelpMenu */, this.contextKeyService))
            };
            this.menuUpdater = this._register(new async_1.RunOnceScheduler(() => this.doUpdateMenubar(false), 200));
            this.notifyUserOfCustomMenubarAccessibility();
        }
        registerListeners() {
            // Update when config changes
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
            // Listen to update service
            this.updateService.onStateChange(() => this.updateMenubar());
            // Listen for changes in recently opened menu
            this._register(this.windowsService.onRecentlyOpenedChange(() => { this.onRecentlyOpenedChange(); }));
            // Listen to keybindings change
            this._register(this.keybindingService.onDidUpdateKeybindings(() => this.updateMenubar()));
            // Update recent menu items on formatter registration
            this._register(this.labelService.onDidChangeFormatters(() => { this.onRecentlyOpenedChange(); }));
        }
        updateMenubar() {
            this.menuUpdater.schedule();
        }
        calculateActionLabel(action) {
            let label = action.label;
            switch (action.id) {
                default:
                    break;
            }
            return label;
        }
        getOpenRecentActions() {
            if (!this.recentlyOpened) {
                return [];
            }
            const { workspaces, files } = this.recentlyOpened;
            const result = [];
            if (workspaces.length > 0) {
                for (let i = 0; i < MenubarControl.MAX_MENU_RECENT_ENTRIES && i < workspaces.length; i++) {
                    result.push(this.createOpenRecentMenuAction(workspaces[i]));
                }
                result.push(new actionbar_1.Separator());
            }
            if (files.length > 0) {
                for (let i = 0; i < MenubarControl.MAX_MENU_RECENT_ENTRIES && i < files.length; i++) {
                    result.push(this.createOpenRecentMenuAction(files[i]));
                }
                result.push(new actionbar_1.Separator());
            }
            return result;
        }
        onConfigurationUpdated(event) {
            if (this.keys.some(key => event.affectsConfiguration(key))) {
                this.updateMenubar();
            }
            if (event.affectsConfiguration('editor.accessibilitySupport')) {
                this.notifyUserOfCustomMenubarAccessibility();
            }
        }
        onRecentlyOpenedChange() {
            this.windowService.getRecentlyOpened().then(recentlyOpened => {
                this.recentlyOpened = recentlyOpened;
                this.updateMenubar();
            });
        }
        createOpenRecentMenuAction(recent) {
            let label;
            let uri;
            let commandId;
            let uriToOpen;
            if (history_1.isRecentFolder(recent)) {
                uri = recent.folderUri;
                label = recent.label || this.labelService.getWorkspaceLabel(uri, { verbose: true });
                commandId = 'openRecentFolder';
                uriToOpen = { folderUri: uri };
            }
            else if (history_1.isRecentWorkspace(recent)) {
                uri = recent.workspace.configPath;
                label = recent.label || this.labelService.getWorkspaceLabel(recent.workspace, { verbose: true });
                commandId = 'openRecentWorkspace';
                uriToOpen = { workspaceUri: uri };
            }
            else {
                uri = recent.fileUri;
                label = recent.label || this.labelService.getUriLabel(uri);
                commandId = 'openRecentFile';
                uriToOpen = { fileUri: uri };
            }
            const ret = new actions_2.Action(commandId, labels_1.unmnemonicLabel(label), undefined, undefined, (event) => {
                const openInNewWindow = event && ((!platform_1.isMacintosh && (event.ctrlKey || event.shiftKey)) || (platform_1.isMacintosh && (event.metaKey || event.altKey)));
                return this.windowService.openWindow([uriToOpen], {
                    forceNewWindow: openInNewWindow
                });
            });
            return objects_1.assign(ret, { uri: uri });
        }
        notifyUserOfCustomMenubarAccessibility() {
            if (platform_1.isWeb || platform_1.isMacintosh) {
                return;
            }
            const hasBeenNotified = this.storageService.getBoolean('menubar/accessibleMenubarNotified', 0 /* GLOBAL */, false);
            const usingCustomMenubar = windows_1.getTitleBarStyle(this.configurationService, this.environmentService) === 'custom';
            const detected = this.accessibilityService.getAccessibilitySupport() === 2 /* Enabled */;
            const config = this.configurationService.getValue('editor.accessibilitySupport');
            if (hasBeenNotified || usingCustomMenubar || !(config === 'on' || (config === 'auto' && detected))) {
                return;
            }
            const message = nls.localize('menubar.customTitlebarAccessibilityNotification', "Accessibility support is enabled for you. For the most accessible experience, we recommend the custom title bar style.");
            this.notificationService.prompt(notification_1.Severity.Info, message, [
                {
                    label: nls.localize('goToSetting', "Open Settings"),
                    run: () => {
                        return this.preferencesService.openGlobalSettings(undefined, { query: 'window.titleBarStyle' });
                    }
                }
            ]);
            this.storageService.store('menubar/accessibleMenubarNotified', true, 0 /* GLOBAL */);
        }
    }
    MenubarControl.MAX_MENU_RECENT_ENTRIES = 10;
    exports.MenubarControl = MenubarControl;
    let CustomMenubarControl = class CustomMenubarControl extends MenubarControl {
        constructor(menuService, windowService, windowsService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService, themeService, layoutService) {
            super(menuService, windowService, windowsService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService);
            this.themeService = themeService;
            this.layoutService = layoutService;
            this._onVisibilityChange = this._register(new event_1.Emitter());
            this._onFocusStateChange = this._register(new event_1.Emitter());
            this.windowService.getRecentlyOpened().then((recentlyOpened) => {
                this.recentlyOpened = recentlyOpened;
            });
            this.registerListeners();
            themeService_1.registerThemingParticipant((theme, collector) => {
                const menubarActiveWindowFgColor = theme.getColor(theme_1.TITLE_BAR_ACTIVE_FOREGROUND);
                if (menubarActiveWindowFgColor) {
                    collector.addRule(`
				.monaco-workbench .menubar > .menubar-menu-button {
					color: ${menubarActiveWindowFgColor};
				}

				.monaco-workbench .menubar .toolbar-toggle-more {
					background-color: ${menubarActiveWindowFgColor}
				}
				`);
                }
                const menubarInactiveWindowFgColor = theme.getColor(theme_1.TITLE_BAR_INACTIVE_FOREGROUND);
                if (menubarInactiveWindowFgColor) {
                    collector.addRule(`
					.monaco-workbench .menubar.inactive > .menubar-menu-button {
						color: ${menubarInactiveWindowFgColor};
					}

					.monaco-workbench .menubar.inactive > .menubar-menu-button .toolbar-toggle-more {
						background-color: ${menubarInactiveWindowFgColor}
					}
				`);
                }
                const menubarSelectedFgColor = theme.getColor(theme_1.MENUBAR_SELECTION_FOREGROUND);
                if (menubarSelectedFgColor) {
                    collector.addRule(`
					.monaco-workbench .menubar > .menubar-menu-button.open,
					.monaco-workbench .menubar > .menubar-menu-button:focus,
					.monaco-workbench .menubar:not(:focus-within) > .menubar-menu-button:hover {
						color: ${menubarSelectedFgColor};
					}

					.monaco-workbench .menubar  > .menubar-menu-button.open .toolbar-toggle-more,
					.monaco-workbench .menubar > .menubar-menu-button:focus .toolbar-toggle-more,
					.monaco-workbench .menubar:not(:focus-within) > .menubar-menu-button:hover .toolbar-toggle-more {
						background-color: ${menubarSelectedFgColor}
					}
				`);
                }
                const menubarSelectedBgColor = theme.getColor(theme_1.MENUBAR_SELECTION_BACKGROUND);
                if (menubarSelectedBgColor) {
                    collector.addRule(`
					.monaco-workbench .menubar > .menubar-menu-button.open,
					.monaco-workbench .menubar > .menubar-menu-button:focus,
					.monaco-workbench .menubar:not(:focus-within) > .menubar-menu-button:hover {
						background-color: ${menubarSelectedBgColor};
					}
				`);
                }
                const menubarSelectedBorderColor = theme.getColor(theme_1.MENUBAR_SELECTION_BORDER);
                if (menubarSelectedBorderColor) {
                    collector.addRule(`
					.monaco-workbench .menubar > .menubar-menu-button:hover {
						outline: dashed 1px;
					}

					.monaco-workbench .menubar > .menubar-menu-button.open,
					.monaco-workbench .menubar > .menubar-menu-button:focus {
						outline: solid 1px;
					}

					.monaco-workbench .menubar > .menubar-menu-button.open,
					.monaco-workbench .menubar > .menubar-menu-button:focus,
					.monaco-workbench .menubar > .menubar-menu-button:hover {
						outline-offset: -1px;
						outline-color: ${menubarSelectedBorderColor};
					}
				`);
                }
            });
        }
        doUpdateMenubar(firstTime) {
            this.setupCustomMenubar(firstTime);
        }
        getUpdateAction() {
            const state = this.updateService.state;
            switch (state.type) {
                case "uninitialized" /* Uninitialized */:
                    return null;
                case "idle" /* Idle */:
                    const windowId = this.windowService.windowId;
                    return new actions_2.Action('update.check', nls.localize({ key: 'checkForUpdates', comment: ['&& denotes a mnemonic'] }, "Check for &&Updates..."), undefined, true, () => this.updateService.checkForUpdates({ windowId }));
                case "checking for updates" /* CheckingForUpdates */:
                    return new actions_2.Action('update.checking', nls.localize('checkingForUpdates', "Checking for Updates..."), undefined, false);
                case "available for download" /* AvailableForDownload */:
                    return new actions_2.Action('update.downloadNow', nls.localize({ key: 'download now', comment: ['&& denotes a mnemonic'] }, "D&&ownload Now"), undefined, true, () => this.updateService.downloadUpdate());
                case "downloading" /* Downloading */:
                    return new actions_2.Action('update.downloading', nls.localize('DownloadingUpdate', "Downloading Update..."), undefined, false);
                case "downloaded" /* Downloaded */:
                    return new actions_2.Action('update.install', nls.localize({ key: 'installUpdate...', comment: ['&& denotes a mnemonic'] }, "Install &&Update..."), undefined, true, () => this.updateService.applyUpdate());
                case "updating" /* Updating */:
                    return new actions_2.Action('update.updating', nls.localize('installingUpdate', "Installing Update..."), undefined, false);
                case "ready" /* Ready */:
                    return new actions_2.Action('update.restart', nls.localize({ key: 'restartToUpdate', comment: ['&& denotes a mnemonic'] }, "Restart to &&Update"), undefined, true, () => this.updateService.quitAndInstall());
            }
        }
        get currentMenubarVisibility() {
            return this.configurationService.getValue('window.menuBarVisibility');
        }
        get currentDisableMenuBarAltFocus() {
            let settingValue = this.configurationService.getValue('window.customMenuBarAltFocus');
            let disableMenuBarAltBehavior = false;
            if (typeof settingValue === 'boolean') {
                disableMenuBarAltBehavior = !settingValue;
            }
            return disableMenuBarAltBehavior;
        }
        insertActionsBefore(nextAction, target) {
            switch (nextAction.id) {
                case 'workbench.action.openRecent':
                    target.push(...this.getOpenRecentActions());
                    break;
                case 'workbench.action.showAboutDialog':
                    if (!platform_1.isMacintosh && !platform_1.isWeb) {
                        const updateAction = this.getUpdateAction();
                        if (updateAction) {
                            updateAction.label = labels_1.mnemonicMenuLabel(updateAction.label);
                            target.push(updateAction);
                            target.push(new actionbar_1.Separator());
                        }
                    }
                    break;
                default:
                    break;
            }
        }
        get currentEnableMenuBarMnemonics() {
            let enableMenuBarMnemonics = this.configurationService.getValue('window.enableMenuBarMnemonics');
            if (typeof enableMenuBarMnemonics !== 'boolean') {
                enableMenuBarMnemonics = true;
            }
            return enableMenuBarMnemonics && (!platform_1.isWeb || browser_1.isFullscreen());
        }
        setupCustomMenubar(firstTime) {
            if (firstTime) {
                this.menubar = this._register(new menubar_1.MenuBar(this.container, {
                    enableMnemonics: this.currentEnableMenuBarMnemonics,
                    disableAltFocus: this.currentDisableMenuBarAltFocus,
                    visibility: this.currentMenubarVisibility,
                    getKeybinding: (action) => this.keybindingService.lookupKeybinding(action.id),
                }));
                this.accessibilityService.alwaysUnderlineAccessKeys().then(val => {
                    this.alwaysOnMnemonics = val;
                    this.menubar.update({ enableMnemonics: this.currentEnableMenuBarMnemonics, disableAltFocus: this.currentDisableMenuBarAltFocus, visibility: this.currentMenubarVisibility, getKeybinding: (action) => this.keybindingService.lookupKeybinding(action.id), alwaysOnMnemonics: this.alwaysOnMnemonics });
                });
                this._register(this.menubar.onFocusStateChange(e => this._onFocusStateChange.fire(e)));
                this._register(this.menubar.onVisibilityChange(e => this._onVisibilityChange.fire(e)));
                this._register(styler_1.attachMenuStyler(this.menubar, this.themeService));
            }
            else {
                this.menubar.update({ enableMnemonics: this.currentEnableMenuBarMnemonics, disableAltFocus: this.currentDisableMenuBarAltFocus, visibility: this.currentMenubarVisibility, getKeybinding: (action) => this.keybindingService.lookupKeybinding(action.id), alwaysOnMnemonics: this.alwaysOnMnemonics });
            }
            // Update the menu actions
            const updateActions = (menu, target, topLevelTitle) => {
                target.splice(0);
                let groups = menu.getActions();
                for (let group of groups) {
                    const [, actions] = group;
                    for (let action of actions) {
                        this.insertActionsBefore(action, target);
                        if (action instanceof actions_1.SubmenuItemAction) {
                            if (!this.menus[action.item.submenu]) {
                                this.menus[action.item.submenu] = this.menuService.createMenu(action.item.submenu, this.contextKeyService);
                                const submenu = this.menus[action.item.submenu];
                                this._register(submenu.onDidChange(() => {
                                    const actions = [];
                                    updateActions(menu, actions, topLevelTitle);
                                    this.menubar.updateMenu({ actions: actions, label: labels_1.mnemonicMenuLabel(this.topLevelTitles[topLevelTitle]) });
                                }, this));
                            }
                            const submenu = this.menus[action.item.submenu];
                            const submenuActions = [];
                            updateActions(submenu, submenuActions, topLevelTitle);
                            target.push(new menu_1.SubmenuAction(labels_1.mnemonicMenuLabel(action.label), submenuActions));
                        }
                        else {
                            action.label = labels_1.mnemonicMenuLabel(this.calculateActionLabel(action));
                            target.push(action);
                        }
                    }
                    target.push(new actionbar_1.Separator());
                }
                target.pop();
            };
            for (const title of Object.keys(this.topLevelTitles)) {
                const menu = this.menus[title];
                if (firstTime && menu) {
                    this._register(menu.onDidChange(() => {
                        const actions = [];
                        updateActions(menu, actions, title);
                        this.menubar.updateMenu({ actions: actions, label: labels_1.mnemonicMenuLabel(this.topLevelTitles[title]) });
                    }));
                }
                const actions = [];
                if (menu) {
                    updateActions(menu, actions, title);
                }
                if (!firstTime) {
                    this.menubar.updateMenu({ actions: actions, label: labels_1.mnemonicMenuLabel(this.topLevelTitles[title]) });
                }
                else {
                    this.menubar.push({ actions: actions, label: labels_1.mnemonicMenuLabel(this.topLevelTitles[title]) });
                }
            }
        }
        onDidChangeWindowFocus(hasFocus) {
            if (this.container) {
                if (hasFocus) {
                    DOM.removeClass(this.container, 'inactive');
                }
                else {
                    DOM.addClass(this.container, 'inactive');
                    this.menubar.blur();
                }
            }
        }
        registerListeners() {
            super.registerListeners();
            // Listen for window focus changes
            this._register(this.windowService.onDidChangeFocus(e => this.onDidChangeWindowFocus(e)));
            this._register(this.windowService.onDidChangeMaximize(e => this.updateMenubar()));
            this._register(DOM.addDisposableListener(window, DOM.EventType.RESIZE, () => {
                this.menubar.blur();
            }));
            // Mnemonics require fullscreen in web
            if (platform_1.isWeb) {
                this._register(this.layoutService.onFullscreenChange(e => this.updateMenubar()));
            }
        }
        get onVisibilityChange() {
            return this._onVisibilityChange.event;
        }
        get onFocusStateChange() {
            return this._onFocusStateChange.event;
        }
        getMenubarItemsDimensions() {
            if (this.menubar) {
                return new DOM.Dimension(this.menubar.getWidth(), this.menubar.getHeight());
            }
            return new DOM.Dimension(0, 0);
        }
        create(parent) {
            this.container = parent;
            // Build the menubar
            if (this.container) {
                this.doUpdateMenubar(true);
            }
            return this.container;
        }
        layout(dimension) {
            if (this.container) {
                this.container.style.height = `${dimension.height}px`;
            }
            if (this.menubar) {
                this.menubar.update({ enableMnemonics: this.currentEnableMenuBarMnemonics, disableAltFocus: this.currentDisableMenuBarAltFocus, visibility: this.currentMenubarVisibility, getKeybinding: (action) => this.keybindingService.lookupKeybinding(action.id), alwaysOnMnemonics: this.alwaysOnMnemonics });
            }
        }
    };
    CustomMenubarControl = __decorate([
        __param(0, actions_1.IMenuService),
        __param(1, windows_1.IWindowService),
        __param(2, windows_1.IWindowsService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, label_1.ILabelService),
        __param(7, update_1.IUpdateService),
        __param(8, storage_1.IStorageService),
        __param(9, notification_1.INotificationService),
        __param(10, preferences_1.IPreferencesService),
        __param(11, environment_1.IEnvironmentService),
        __param(12, accessibility_1.IAccessibilityService),
        __param(13, themeService_1.IThemeService),
        __param(14, layoutService_1.IWorkbenchLayoutService)
    ], CustomMenubarControl);
    exports.CustomMenubarControl = CustomMenubarControl;
});
//# sourceMappingURL=menubarControl.js.map