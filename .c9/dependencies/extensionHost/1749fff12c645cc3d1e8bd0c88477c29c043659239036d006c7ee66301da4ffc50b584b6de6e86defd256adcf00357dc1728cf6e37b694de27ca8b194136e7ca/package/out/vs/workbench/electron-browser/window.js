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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/errors", "vs/base/common/objects", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/platform/files/common/files", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/platform/telemetry/common/telemetry", "vs/platform/windows/common/windows", "vs/platform/contextview/browser/contextView", "vs/workbench/services/title/common/titleService", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/browser/browser", "vs/platform/commands/common/commands", "vs/workbench/services/keybinding/electron-browser/nativeKeymapService", "electron", "vs/workbench/services/workspace/common/workspaceEditing", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/services/integrity/common/integrity", "vs/base/common/platform", "vs/platform/product/node/product", "vs/platform/product/node/package", "vs/platform/notification/common/notification", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/environment/common/environmentService", "vs/platform/accessibility/common/accessibility", "vs/platform/workspace/common/workspace", "vs/base/common/arrays", "vs/platform/configuration/common/configuration", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation", "../browser/parts/titlebar/menubarControl", "vs/platform/label/common/label", "vs/platform/update/common/update", "vs/platform/storage/common/storage", "../services/preferences/common/preferences", "vs/platform/environment/common/environment", "vs/platform/menubar/node/menubar", "vs/base/common/types", "vs/platform/opener/common/opener", "vs/base/common/network"], function (require, exports, nls, uri_1, errors, objects_1, DOM, actionbar_1, actions_1, files_1, editor_1, editorService_1, telemetry_1, windows_1, contextView_1, titleService_1, workbenchThemeService_1, browser, commands_1, nativeKeymapService_1, electron_1, workspaceEditing_1, actions_2, contextkey_1, menuEntryActionViewItem_1, async_1, lifecycle_1, lifecycle_2, integrity_1, platform_1, product_1, package_1, notification_1, keybinding_1, environmentService_1, accessibility_1, workspace_1, arrays_1, configuration_1, textfiles_1, resources_1, instantiation_1, menubarControl_1, label_1, update_1, storage_1, preferences_1, environment_1, menubar_1, types_1, opener_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const TextInputActions = [
        new actions_1.Action('undo', nls.localize('undo', "Undo"), undefined, true, () => Promise.resolve(document.execCommand('undo'))),
        new actions_1.Action('redo', nls.localize('redo', "Redo"), undefined, true, () => Promise.resolve(document.execCommand('redo'))),
        new actionbar_1.Separator(),
        new actions_1.Action('editor.action.clipboardCutAction', nls.localize('cut', "Cut"), undefined, true, () => Promise.resolve(document.execCommand('cut'))),
        new actions_1.Action('editor.action.clipboardCopyAction', nls.localize('copy', "Copy"), undefined, true, () => Promise.resolve(document.execCommand('copy'))),
        new actions_1.Action('editor.action.clipboardPasteAction', nls.localize('paste', "Paste"), undefined, true, () => Promise.resolve(document.execCommand('paste'))),
        new actionbar_1.Separator(),
        new actions_1.Action('editor.action.selectAll', nls.localize('selectAll', "Select All"), undefined, true, () => Promise.resolve(document.execCommand('selectAll')))
    ];
    let ElectronWindow = class ElectronWindow extends lifecycle_1.Disposable {
        constructor(editorService, windowsService, windowService, configurationService, titleService, themeService, notificationService, commandService, keybindingService, contextMenuService, telemetryService, workspaceEditingService, fileService, menuService, lifecycleService, integrityService, environmentService, accessibilityService, contextService, textFileService, instantiationService, openerService) {
            super();
            this.editorService = editorService;
            this.windowsService = windowsService;
            this.windowService = windowService;
            this.configurationService = configurationService;
            this.titleService = titleService;
            this.themeService = themeService;
            this.notificationService = notificationService;
            this.commandService = commandService;
            this.keybindingService = keybindingService;
            this.contextMenuService = contextMenuService;
            this.telemetryService = telemetryService;
            this.workspaceEditingService = workspaceEditingService;
            this.fileService = fileService;
            this.menuService = menuService;
            this.lifecycleService = lifecycleService;
            this.integrityService = integrityService;
            this.environmentService = environmentService;
            this.accessibilityService = accessibilityService;
            this.contextService = contextService;
            this.textFileService = textFileService;
            this.instantiationService = instantiationService;
            this.openerService = openerService;
            this.touchBarDisposables = this._register(new lifecycle_1.DisposableStore());
            this.closeEmptyWindowScheduler = this._register(new async_1.RunOnceScheduler(() => this.onAllEditorsClosed(), 50));
            this.pendingFoldersToAdd = [];
            this.addFoldersScheduler = this._register(new async_1.RunOnceScheduler(() => this.doAddFolders(), 100));
            this.registerListeners();
            this.create();
        }
        registerListeners() {
            // React to editor input changes
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateTouchbarMenu()));
            // prevent opening a real URL inside the shell
            [DOM.EventType.DRAG_OVER, DOM.EventType.DROP].forEach(event => {
                window.document.body.addEventListener(event, (e) => {
                    DOM.EventHelper.stop(e);
                });
            });
            // Support runAction event
            electron_1.ipcRenderer.on('vscode:runAction', (event, request) => __awaiter(this, void 0, void 0, function* () {
                const args = request.args || [];
                // If we run an action from the touchbar, we fill in the currently active resource
                // as payload because the touch bar items are context aware depending on the editor
                if (request.from === 'touchbar') {
                    const activeEditor = this.editorService.activeEditor;
                    if (activeEditor) {
                        const resource = editor_1.toResource(activeEditor, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
                        if (resource) {
                            args.push(resource);
                        }
                    }
                }
                else {
                    args.push({ from: request.from }); // TODO@telemetry this is a bit weird to send this to every action?
                }
                try {
                    yield this.commandService.executeCommand(request.id, ...args);
                    this.telemetryService.publicLog2('commandExecuted', { id: request.id, from: request.from });
                }
                catch (error) {
                    this.notificationService.error(error);
                }
            }));
            // Support runKeybinding event
            electron_1.ipcRenderer.on('vscode:runKeybinding', (event, request) => {
                if (document.activeElement) {
                    this.keybindingService.dispatchByUserSettingsLabel(request.userSettingsLabel, document.activeElement);
                }
            });
            // Error reporting from main
            electron_1.ipcRenderer.on('vscode:reportError', (event, error) => {
                if (error) {
                    errors.onUnexpectedError(JSON.parse(error));
                }
            });
            // Support openFiles event for existing and new files
            electron_1.ipcRenderer.on('vscode:openFiles', (event, request) => this.onOpenFiles(request));
            // Support addFolders event if we have a workspace opened
            electron_1.ipcRenderer.on('vscode:addFolders', (event, request) => this.onAddFoldersRequest(request));
            // Message support
            electron_1.ipcRenderer.on('vscode:showInfoMessage', (event, message) => {
                this.notificationService.info(message);
            });
            // Fullscreen Events
            electron_1.ipcRenderer.on('vscode:enterFullScreen', () => __awaiter(this, void 0, void 0, function* () {
                yield this.lifecycleService.when(2 /* Ready */);
                browser.setFullscreen(true);
            }));
            electron_1.ipcRenderer.on('vscode:leaveFullScreen', () => __awaiter(this, void 0, void 0, function* () {
                yield this.lifecycleService.when(2 /* Ready */);
                browser.setFullscreen(false);
            }));
            // High Contrast Events
            electron_1.ipcRenderer.on('vscode:enterHighContrast', () => __awaiter(this, void 0, void 0, function* () {
                const windowConfig = this.configurationService.getValue('window');
                if (windowConfig && windowConfig.autoDetectHighContrast) {
                    yield this.lifecycleService.when(2 /* Ready */);
                    this.themeService.setColorTheme(workbenchThemeService_1.VS_HC_THEME, undefined);
                }
            }));
            electron_1.ipcRenderer.on('vscode:leaveHighContrast', () => __awaiter(this, void 0, void 0, function* () {
                const windowConfig = this.configurationService.getValue('window');
                if (windowConfig && windowConfig.autoDetectHighContrast) {
                    yield this.lifecycleService.when(2 /* Ready */);
                    this.themeService.restoreColorTheme();
                }
            }));
            // keyboard layout changed event
            electron_1.ipcRenderer.on('vscode:keyboardLayoutChanged', () => {
                nativeKeymapService_1.KeyboardMapperFactory.INSTANCE._onKeyboardLayoutChanged();
            });
            // keyboard layout changed event
            electron_1.ipcRenderer.on('vscode:accessibilitySupportChanged', (event, accessibilitySupportEnabled) => {
                this.accessibilityService.setAccessibilitySupport(accessibilitySupportEnabled ? 2 /* Enabled */ : 1 /* Disabled */);
            });
            // Zoom level changes
            this.updateWindowZoomLevel();
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('window.zoomLevel')) {
                    this.updateWindowZoomLevel();
                }
                else if (e.affectsConfiguration('keyboard.touchbar.enabled') || e.affectsConfiguration('keyboard.touchbar.ignored')) {
                    this.updateTouchbarMenu();
                }
            }));
            // Context menu support in input/textarea
            window.document.addEventListener('contextmenu', e => this.onContextMenu(e));
            // Listen to visible editor changes
            this._register(this.editorService.onDidVisibleEditorsChange(() => this.onDidVisibleEditorsChange()));
            // Listen to editor closing (if we run with --wait)
            const filesToWait = this.environmentService.configuration.filesToWait;
            if (filesToWait) {
                const waitMarkerFile = filesToWait.waitMarkerFileUri;
                const resourcesToWaitFor = arrays_1.coalesce(filesToWait.paths.map(p => p.fileUri));
                this._register(this.trackClosedWaitFiles(waitMarkerFile, resourcesToWaitFor));
            }
        }
        onDidVisibleEditorsChange() {
            // Close when empty: check if we should close the window based on the setting
            // Overruled by: window has a workspace opened or this window is for extension development
            // or setting is disabled. Also enabled when running with --wait from the command line.
            const visibleEditors = this.editorService.visibleControls;
            if (visibleEditors.length === 0 && this.contextService.getWorkbenchState() === 1 /* EMPTY */ && !this.environmentService.isExtensionDevelopment) {
                const closeWhenEmpty = this.configurationService.getValue('window.closeWhenEmpty');
                if (closeWhenEmpty || this.environmentService.args.wait) {
                    this.closeEmptyWindowScheduler.schedule();
                }
            }
        }
        onAllEditorsClosed() {
            const visibleEditors = this.editorService.visibleControls.length;
            if (visibleEditors === 0) {
                this.windowService.closeWindow();
            }
        }
        onContextMenu(e) {
            if (e.target instanceof HTMLElement) {
                const target = e.target;
                if (target.nodeName && (target.nodeName.toLowerCase() === 'input' || target.nodeName.toLowerCase() === 'textarea')) {
                    DOM.EventHelper.stop(e, true);
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => e,
                        getActions: () => TextInputActions,
                        onHide: () => target.focus() // fixes https://github.com/Microsoft/vscode/issues/52948
                    });
                }
            }
        }
        updateWindowZoomLevel() {
            const windowConfig = this.configurationService.getValue();
            let newZoomLevel = 0;
            if (windowConfig.window && typeof windowConfig.window.zoomLevel === 'number') {
                newZoomLevel = windowConfig.window.zoomLevel;
                // Leave early if the configured zoom level did not change (https://github.com/Microsoft/vscode/issues/1536)
                if (this.previousConfiguredZoomLevel === newZoomLevel) {
                    return;
                }
                this.previousConfiguredZoomLevel = newZoomLevel;
            }
            if (electron_1.webFrame.getZoomLevel() !== newZoomLevel) {
                electron_1.webFrame.setZoomLevel(newZoomLevel);
                browser.setZoomFactor(electron_1.webFrame.getZoomFactor());
                // See https://github.com/Microsoft/vscode/issues/26151
                // Cannot be trusted because the webFrame might take some time
                // until it really applies the new zoom level
                browser.setZoomLevel(electron_1.webFrame.getZoomLevel(), /*isTrusted*/ false);
            }
        }
        create() {
            // Native menu controller
            if (platform_1.isMacintosh || windows_1.getTitleBarStyle(this.configurationService, this.environmentService) === 'native') {
                this._register(this.instantiationService.createInstance(NativeMenubarControl));
            }
            // Handle open calls
            this.setupOpenHandlers();
            // Emit event when vscode is ready
            this.lifecycleService.when(2 /* Ready */).then(() => electron_1.ipcRenderer.send('vscode:workbenchReady', this.windowService.windowId));
            // Integrity warning
            this.integrityService.isPure().then(res => this.titleService.updateProperties({ isPure: res.isPure }));
            // Root warning
            this.lifecycleService.when(3 /* Restored */).then(() => {
                let isAdminPromise;
                if (platform_1.isWindows) {
                    isAdminPromise = new Promise((resolve_1, reject_1) => { require(['native-is-elevated'], resolve_1, reject_1); }).then(isElevated => isElevated()); // not using async here due to https://github.com/microsoft/vscode/issues/74321
                }
                else {
                    isAdminPromise = Promise.resolve(platform_1.isRootUser());
                }
                return isAdminPromise.then(isAdmin => {
                    // Update title
                    this.titleService.updateProperties({ isAdmin });
                    // Show warning message (unix only)
                    if (isAdmin && !platform_1.isWindows) {
                        this.notificationService.warn(nls.localize('runningAsRoot', "It is not recommended to run {0} as root user.", product_1.default.nameShort));
                    }
                });
            });
            // Touchbar menu (if enabled)
            this.updateTouchbarMenu();
            // Crash reporter (if enabled)
            if (!this.environmentService.disableCrashReporter && product_1.default.crashReporter && product_1.default.hockeyApp && this.configurationService.getValue('telemetry.enableCrashReporter')) {
                this.setupCrashReporter();
            }
        }
        setupOpenHandlers() {
            // Block window.open() calls
            const $this = this;
            window.open = function () {
                throw new Error('Prevented call to window.open(). Use IOpenerService instead!');
            };
            // Handle internal open() calls
            this.openerService.registerOpener({
                open(resource, options) {
                    return __awaiter(this, void 0, void 0, function* () {
                        // If either the caller wants to open externally or the
                        // scheme is one where we prefer to open externally
                        // we handle this resource by delegating the opening to
                        // the main process to prevent window focus issues.
                        const scheme = resource.scheme.toLowerCase();
                        const preferOpenExternal = (scheme === network_1.Schemas.mailto || scheme === network_1.Schemas.http || scheme === network_1.Schemas.https);
                        if ((options && options.openExternal) || preferOpenExternal) {
                            const success = yield $this.windowsService.openExternal(encodeURI(resource.toString(true)));
                            if (!success && resource.scheme === network_1.Schemas.file) {
                                // if opening failed, and this is a file, we can still try to reveal it
                                yield $this.windowsService.showItemInFolder(resource);
                            }
                            return true;
                        }
                        return false; // not handled by us
                    });
                }
            });
        }
        updateTouchbarMenu() {
            if (!platform_1.isMacintosh) {
                return; // macOS only
            }
            // Dispose old
            this.touchBarDisposables.clear();
            this.touchBarMenu = undefined;
            // Create new (delayed)
            this.touchBarUpdater = new async_1.RunOnceScheduler(() => this.doUpdateTouchbarMenu(), 300);
            this.touchBarDisposables.add(this.touchBarUpdater);
            this.touchBarUpdater.schedule();
        }
        doUpdateTouchbarMenu() {
            if (!this.touchBarMenu) {
                this.touchBarMenu = this.editorService.invokeWithinEditorContext(accessor => this.menuService.createMenu(36 /* TouchBarContext */, accessor.get(contextkey_1.IContextKeyService)));
                this.touchBarDisposables.add(this.touchBarMenu);
                this.touchBarDisposables.add(this.touchBarMenu.onDidChange(() => this.touchBarUpdater.schedule()));
            }
            const actions = [];
            const disabled = this.configurationService.getValue('keyboard.touchbar.enabled') === false;
            const ignoredItems = this.configurationService.getValue('keyboard.touchbar.ignored') || [];
            // Fill actions into groups respecting order
            this.touchBarDisposables.add(menuEntryActionViewItem_1.createAndFillInActionBarActions(this.touchBarMenu, undefined, actions));
            // Convert into command action multi array
            const items = [];
            let group = [];
            if (!disabled) {
                for (const action of actions) {
                    // Command
                    if (action instanceof actions_2.MenuItemAction) {
                        if (ignoredItems.indexOf(action.item.id) >= 0) {
                            continue; // ignored
                        }
                        group.push(action.item);
                    }
                    // Separator
                    else if (action instanceof actionbar_1.Separator) {
                        if (group.length) {
                            items.push(group);
                        }
                        group = [];
                    }
                }
                if (group.length) {
                    items.push(group);
                }
            }
            // Only update if the actions have changed
            if (!objects_1.equals(this.lastInstalledTouchedBar, items)) {
                this.lastInstalledTouchedBar = items;
                this.windowService.updateTouchBar(items);
            }
        }
        setupCrashReporter() {
            return __awaiter(this, void 0, void 0, function* () {
                // base options with product info
                const options = {
                    companyName: product_1.default.crashReporter.companyName,
                    productName: product_1.default.crashReporter.productName,
                    submitURL: platform_1.isWindows ? product_1.default.hockeyApp[process.arch === 'ia32' ? 'win32-ia32' : 'win32-x64'] : platform_1.isLinux ? product_1.default.hockeyApp[`linux-x64`] : product_1.default.hockeyApp.darwin,
                    extra: {
                        vscode_version: package_1.default.version,
                        vscode_commit: product_1.default.commit
                    }
                };
                // mixin telemetry info
                const info = yield this.telemetryService.getTelemetryInfo();
                objects_1.assign(options.extra, { vscode_sessionId: info.sessionId });
                // start crash reporter right here
                electron_1.crashReporter.start(objects_1.deepClone(options));
                // start crash reporter in the main process
                return this.windowsService.startCrashReporter(options);
            });
        }
        onAddFoldersRequest(request) {
            // Buffer all pending requests
            this.pendingFoldersToAdd.push(...request.foldersToAdd.map(f => uri_1.URI.revive(f)));
            // Delay the adding of folders a bit to buffer in case more requests are coming
            if (!this.addFoldersScheduler.isScheduled()) {
                this.addFoldersScheduler.schedule();
            }
        }
        doAddFolders() {
            const foldersToAdd = [];
            this.pendingFoldersToAdd.forEach(folder => {
                foldersToAdd.push(({ uri: folder }));
            });
            this.pendingFoldersToAdd = [];
            this.workspaceEditingService.addFolders(foldersToAdd);
        }
        onOpenFiles(request) {
            return __awaiter(this, void 0, void 0, function* () {
                const inputs = [];
                const diffMode = !!(request.filesToDiff && (request.filesToDiff.length === 2));
                if (!diffMode && request.filesToOpenOrCreate) {
                    inputs.push(...(yield editor_1.pathsToEditors(request.filesToOpenOrCreate, this.fileService)));
                }
                if (diffMode && request.filesToDiff) {
                    inputs.push(...(yield editor_1.pathsToEditors(request.filesToDiff, this.fileService)));
                }
                if (inputs.length) {
                    this.openResources(inputs, diffMode);
                }
                if (request.filesToWait && inputs.length) {
                    // In wait mode, listen to changes to the editors and wait until the files
                    // are closed that the user wants to wait for. When this happens we delete
                    // the wait marker file to signal to the outside that editing is done.
                    const waitMarkerFile = uri_1.URI.revive(request.filesToWait.waitMarkerFileUri);
                    const resourcesToWaitFor = arrays_1.coalesce(request.filesToWait.paths.map(p => uri_1.URI.revive(p.fileUri)));
                    this.trackClosedWaitFiles(waitMarkerFile, resourcesToWaitFor);
                }
            });
        }
        trackClosedWaitFiles(waitMarkerFile, resourcesToWaitFor) {
            const listener = this.editorService.onDidCloseEditor(() => __awaiter(this, void 0, void 0, function* () {
                // In wait mode, listen to changes to the editors and wait until the files
                // are closed that the user wants to wait for. When this happens we delete
                // the wait marker file to signal to the outside that editing is done.
                if (resourcesToWaitFor.every(resource => !this.editorService.isOpen({ resource }))) {
                    // If auto save is configured with the default delay (1s) it is possible
                    // to close the editor while the save still continues in the background. As such
                    // we have to also check if the files to wait for are dirty and if so wait
                    // for them to get saved before deleting the wait marker file.
                    const dirtyFilesToWait = this.textFileService.getDirty(resourcesToWaitFor);
                    if (dirtyFilesToWait.length > 0) {
                        yield Promise.all(dirtyFilesToWait.map((dirtyFileToWait) => __awaiter(this, void 0, void 0, function* () { return yield this.joinResourceSaved(dirtyFileToWait); })));
                    }
                    listener.dispose();
                    yield this.fileService.del(waitMarkerFile);
                }
            }));
            return listener;
        }
        joinResourceSaved(resource) {
            return new Promise(resolve => {
                if (!this.textFileService.isDirty(resource)) {
                    return resolve(); // return early if resource is not dirty
                }
                // Otherwise resolve promise when resource is saved
                const listener = this.textFileService.models.onModelSaved(e => {
                    if (resources_1.isEqual(resource, e.resource)) {
                        listener.dispose();
                        resolve();
                    }
                });
            });
        }
        openResources(resources, diffMode) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.lifecycleService.when(2 /* Ready */);
                // In diffMode we open 2 resources as diff
                if (diffMode && resources.length === 2) {
                    return this.editorService.openEditor({ leftResource: resources[0].resource, rightResource: resources[1].resource, options: { pinned: true } });
                }
                // For one file, just put it into the current active editor
                if (resources.length === 1) {
                    return this.editorService.openEditor(resources[0]);
                }
                // Otherwise open all
                return this.editorService.openEditors(resources);
            });
        }
    };
    ElectronWindow = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, windows_1.IWindowsService),
        __param(2, windows_1.IWindowService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, titleService_1.ITitleService),
        __param(5, workbenchThemeService_1.IWorkbenchThemeService),
        __param(6, notification_1.INotificationService),
        __param(7, commands_1.ICommandService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, workspaceEditing_1.IWorkspaceEditingService),
        __param(12, files_1.IFileService),
        __param(13, actions_2.IMenuService),
        __param(14, lifecycle_2.ILifecycleService),
        __param(15, integrity_1.IIntegrityService),
        __param(16, environmentService_1.IWorkbenchEnvironmentService),
        __param(17, accessibility_1.IAccessibilityService),
        __param(18, workspace_1.IWorkspaceContextService),
        __param(19, textfiles_1.ITextFileService),
        __param(20, instantiation_1.IInstantiationService),
        __param(21, opener_1.IOpenerService)
    ], ElectronWindow);
    exports.ElectronWindow = ElectronWindow;
    let NativeMenubarControl = class NativeMenubarControl extends menubarControl_1.MenubarControl {
        constructor(menuService, windowService, windowsService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService, menubarService) {
            super(menuService, windowService, windowsService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService);
            this.menubarService = menubarService;
            if (platform_1.isMacintosh && !platform_1.isWeb) {
                this.menus['Preferences'] = this._register(this.menuService.createMenu(20 /* MenubarPreferencesMenu */, this.contextKeyService));
                this.topLevelTitles['Preferences'] = nls.localize('mPreferences', "Preferences");
            }
            for (const topLevelMenuName of Object.keys(this.topLevelTitles)) {
                const menu = this.menus[topLevelMenuName];
                if (menu) {
                    this._register(menu.onDidChange(() => this.updateMenubar()));
                }
            }
            this.windowService.getRecentlyOpened().then((recentlyOpened) => {
                this.recentlyOpened = recentlyOpened;
                this.doUpdateMenubar(true);
            });
            this.registerListeners();
        }
        doUpdateMenubar(firstTime) {
            // Send menus to main process to be rendered by Electron
            const menubarData = { menus: {}, keybindings: {} };
            if (this.getMenubarMenus(menubarData)) {
                this.menubarService.updateMenubar(this.windowService.windowId, menubarData);
            }
        }
        getMenubarMenus(menubarData) {
            if (!menubarData) {
                return false;
            }
            menubarData.keybindings = this.getAdditionalKeybindings();
            for (const topLevelMenuName of Object.keys(this.topLevelTitles)) {
                const menu = this.menus[topLevelMenuName];
                if (menu) {
                    const menubarMenu = { items: [] };
                    this.populateMenuItems(menu, menubarMenu, menubarData.keybindings);
                    if (menubarMenu.items.length === 0) {
                        return false; // Menus are incomplete
                    }
                    menubarData.menus[topLevelMenuName] = menubarMenu;
                }
            }
            return true;
        }
        populateMenuItems(menu, menuToPopulate, keybindings) {
            let groups = menu.getActions();
            for (let group of groups) {
                const [, actions] = group;
                actions.forEach(menuItem => {
                    if (menuItem instanceof actions_2.SubmenuItemAction) {
                        const submenu = { items: [] };
                        if (!this.menus[menuItem.item.submenu]) {
                            this.menus[menuItem.item.submenu] = this.menuService.createMenu(menuItem.item.submenu, this.contextKeyService);
                            this._register(this.menus[menuItem.item.submenu].onDidChange(() => this.updateMenubar()));
                        }
                        const menuToDispose = this.menuService.createMenu(menuItem.item.submenu, this.contextKeyService);
                        this.populateMenuItems(menuToDispose, submenu, keybindings);
                        let menubarSubmenuItem = {
                            id: menuItem.id,
                            label: menuItem.label,
                            submenu: submenu
                        };
                        menuToPopulate.items.push(menubarSubmenuItem);
                        menuToDispose.dispose();
                    }
                    else {
                        if (menuItem.id === 'workbench.action.openRecent') {
                            const actions = this.getOpenRecentActions().map(this.transformOpenRecentAction);
                            menuToPopulate.items.push(...actions);
                        }
                        let menubarMenuItem = {
                            id: menuItem.id,
                            label: menuItem.label
                        };
                        if (menuItem.checked) {
                            menubarMenuItem.checked = true;
                        }
                        if (!menuItem.enabled) {
                            menubarMenuItem.enabled = false;
                        }
                        menubarMenuItem.label = this.calculateActionLabel(menubarMenuItem);
                        keybindings[menuItem.id] = this.getMenubarKeybinding(menuItem.id);
                        menuToPopulate.items.push(menubarMenuItem);
                    }
                });
                menuToPopulate.items.push({ id: 'vscode.menubar.separator' });
            }
            if (menuToPopulate.items.length > 0) {
                menuToPopulate.items.pop();
            }
        }
        transformOpenRecentAction(action) {
            if (action instanceof actionbar_1.Separator) {
                return { id: 'vscode.menubar.separator' };
            }
            return {
                id: action.id,
                uri: action.uri,
                enabled: action.enabled,
                label: action.label
            };
        }
        getAdditionalKeybindings() {
            const keybindings = {};
            if (platform_1.isMacintosh) {
                const keybinding = this.getMenubarKeybinding('workbench.action.quit');
                if (keybinding) {
                    keybindings['workbench.action.quit'] = keybinding;
                }
            }
            return keybindings;
        }
        getMenubarKeybinding(id) {
            const binding = this.keybindingService.lookupKeybinding(id);
            if (!binding) {
                return undefined;
            }
            // first try to resolve a native accelerator
            const electronAccelerator = binding.getElectronAccelerator();
            if (electronAccelerator) {
                return { label: electronAccelerator, userSettingsLabel: types_1.withNullAsUndefined(binding.getUserSettingsLabel()) };
            }
            // we need this fallback to support keybindings that cannot show in electron menus (e.g. chords)
            const acceleratorLabel = binding.getLabel();
            if (acceleratorLabel) {
                return { label: acceleratorLabel, isNative: false, userSettingsLabel: types_1.withNullAsUndefined(binding.getUserSettingsLabel()) };
            }
            return undefined;
        }
    };
    NativeMenubarControl = __decorate([
        __param(0, actions_2.IMenuService),
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
        __param(13, menubar_1.IMenubarService)
    ], NativeMenubarControl);
});
//# sourceMappingURL=window.js.map