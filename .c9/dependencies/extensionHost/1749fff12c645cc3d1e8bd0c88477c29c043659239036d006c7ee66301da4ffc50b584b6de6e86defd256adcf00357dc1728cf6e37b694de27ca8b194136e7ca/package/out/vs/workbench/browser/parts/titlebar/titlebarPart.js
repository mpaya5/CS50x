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
define(["require", "exports", "vs/base/common/path", "vs/base/common/resources", "vs/workbench/browser/part", "vs/workbench/services/title/common/titleService", "vs/base/browser/browser", "vs/platform/windows/common/windows", "vs/platform/contextview/browser/contextView", "vs/base/browser/mouseEvent", "vs/base/common/actions", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorService", "vs/base/common/lifecycle", "vs/nls", "vs/workbench/common/editor", "vs/workbench/services/environment/common/environmentService", "vs/platform/workspace/common/workspace", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/color", "vs/base/common/strings", "vs/base/browser/dom", "vs/workbench/browser/parts/titlebar/menubarControl", "vs/platform/instantiation/common/instantiation", "vs/base/common/labels", "vs/platform/label/common/label", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/async", "vs/platform/instantiation/common/extensions", "vs/base/common/network", "vs/css!./media/titlebarpart"], function (require, exports, path_1, resources, part_1, titleService_1, browser_1, windows_1, contextView_1, mouseEvent_1, actions_1, configuration_1, editorService_1, lifecycle_1, nls, editor_1, environmentService_1, workspace_1, themeService_1, theme_1, platform_1, uri_1, color_1, strings_1, dom_1, menubarControl_1, instantiation_1, labels_1, label_1, event_1, storage_1, layoutService_1, async_1, extensions_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TitlebarPart = class TitlebarPart extends part_1.Part {
        constructor(contextMenuService, windowService, configurationService, windowsService, editorService, environmentService, contextService, instantiationService, themeService, labelService, storageService, layoutService) {
            super("workbench.parts.titlebar" /* TITLEBAR_PART */, { hasTitle: false }, themeService, storageService, layoutService);
            this.contextMenuService = contextMenuService;
            this.windowService = windowService;
            this.configurationService = configurationService;
            this.windowsService = windowsService;
            this.editorService = editorService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.instantiationService = instantiationService;
            this.labelService = labelService;
            //#region IView
            this.minimumWidth = 0;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            //#endregion
            this._onMenubarVisibilityChange = this._register(new event_1.Emitter());
            this.onMenubarVisibilityChange = this._onMenubarVisibilityChange.event;
            this.properties = { isPure: true, isAdmin: false };
            this.activeEditorListeners = this._register(new lifecycle_1.DisposableStore());
            this.titleUpdater = this._register(new async_1.RunOnceScheduler(() => this.doUpdateTitle(), 0));
            this.registerListeners();
        }
        get minimumHeight() { return platform_1.isMacintosh && !platform_1.isWeb ? 22 / browser_1.getZoomFactor() : (30 / (this.configurationService.getValue('window.menuBarVisibility') === 'hidden' ? browser_1.getZoomFactor() : 1)); }
        get maximumHeight() { return platform_1.isMacintosh && !platform_1.isWeb ? 22 / browser_1.getZoomFactor() : (30 / (this.configurationService.getValue('window.menuBarVisibility') === 'hidden' ? browser_1.getZoomFactor() : 1)); }
        registerListeners() {
            this._register(this.windowService.onDidChangeFocus(focused => focused ? this.onFocus() : this.onBlur()));
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChanged(e)));
            this._register(this.editorService.onDidActiveEditorChange(() => this.onActiveEditorChange()));
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.titleUpdater.schedule()));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.titleUpdater.schedule()));
            this._register(this.contextService.onDidChangeWorkspaceName(() => this.titleUpdater.schedule()));
            this._register(this.labelService.onDidChangeFormatters(() => this.titleUpdater.schedule()));
        }
        onBlur() {
            this.isInactive = true;
            this.updateStyles();
        }
        onFocus() {
            this.isInactive = false;
            this.updateStyles();
        }
        onConfigurationChanged(event) {
            if (event.affectsConfiguration('window.title')) {
                this.titleUpdater.schedule();
            }
            if (event.affectsConfiguration('window.doubleClickIconToClose')) {
                if (this.appIcon) {
                    this.onUpdateAppIconDragBehavior();
                }
            }
        }
        onMenubarVisibilityChanged(visible) {
            if (platform_1.isWeb || platform_1.isWindows || platform_1.isLinux) {
                // Hide title when toggling menu bar
                if (!platform_1.isWeb && this.configurationService.getValue('window.menuBarVisibility') === 'toggle' && visible) {
                    // Hack to fix issue #52522 with layered webkit-app-region elements appearing under cursor
                    dom_1.hide(this.dragRegion);
                    setTimeout(() => dom_1.show(this.dragRegion), 50);
                }
                this.adjustTitleMarginToCenter();
                this._onMenubarVisibilityChange.fire(visible);
            }
        }
        onMenubarFocusChanged(focused) {
            if (!platform_1.isWeb && (platform_1.isWindows || platform_1.isLinux)) {
                if (focused) {
                    dom_1.hide(this.dragRegion);
                }
                else {
                    dom_1.show(this.dragRegion);
                }
            }
        }
        onActiveEditorChange() {
            // Dispose old listeners
            this.activeEditorListeners.clear();
            // Calculate New Window Title
            this.titleUpdater.schedule();
            // Apply listener for dirty and label changes
            const activeEditor = this.editorService.activeEditor;
            if (activeEditor instanceof editor_1.EditorInput) {
                this.activeEditorListeners.add(activeEditor.onDidChangeDirty(() => this.titleUpdater.schedule()));
                this.activeEditorListeners.add(activeEditor.onDidChangeLabel(() => this.titleUpdater.schedule()));
            }
            // Represented File Name
            this.updateRepresentedFilename();
        }
        updateRepresentedFilename() {
            const file = editor_1.toResource(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.MASTER, filterByScheme: network_1.Schemas.file });
            const path = file ? file.fsPath : '';
            // Apply to window
            this.windowService.setRepresentedFilename(path);
            // Keep for context menu
            this.representedFileName = path;
        }
        doUpdateTitle() {
            const title = this.getWindowTitle();
            // Always set the native window title to identify us properly to the OS
            let nativeTitle = title;
            if (!strings_1.trim(nativeTitle)) {
                nativeTitle = this.environmentService.appNameLong;
            }
            window.document.title = nativeTitle;
            // Apply custom title if we can
            if (this.title) {
                this.title.innerText = title;
            }
            else {
                this.pendingTitle = title;
            }
            if ((platform_1.isWeb || platform_1.isWindows || platform_1.isLinux) && this.title) {
                if (this.lastLayoutDimensions) {
                    this.updateLayout(this.lastLayoutDimensions);
                }
            }
        }
        getWindowTitle() {
            let title = this.doGetWindowTitle();
            if (this.properties.isAdmin) {
                title = `${title || this.environmentService.appNameLong} ${TitlebarPart.NLS_USER_IS_ADMIN}`;
            }
            if (!this.properties.isPure) {
                title = `${title || this.environmentService.appNameLong} ${TitlebarPart.NLS_UNSUPPORTED}`;
            }
            if (this.environmentService.isExtensionDevelopment) {
                title = `${TitlebarPart.NLS_EXTENSION_HOST} - ${title || this.environmentService.appNameLong}`;
            }
            return title;
        }
        updateProperties(properties) {
            const isAdmin = typeof properties.isAdmin === 'boolean' ? properties.isAdmin : this.properties.isAdmin;
            const isPure = typeof properties.isPure === 'boolean' ? properties.isPure : this.properties.isPure;
            if (isAdmin !== this.properties.isAdmin || isPure !== this.properties.isPure) {
                this.properties.isAdmin = isAdmin;
                this.properties.isPure = isPure;
                this.titleUpdater.schedule();
            }
        }
        /**
         * Possible template values:
         *
         * {activeEditorLong}: e.g. /Users/Development/myFolder/myFileFolder/myFile.txt
         * {activeEditorMedium}: e.g. myFolder/myFileFolder/myFile.txt
         * {activeEditorShort}: e.g. myFile.txt
         * {activeFolderLong}: e.g. /Users/Development/myFolder/myFileFolder
         * {activeFolderMedium}: e.g. myFolder/myFileFolder
         * {activeFolderShort}: e.g. myFileFolder
         * {rootName}: e.g. myFolder1, myFolder2, myFolder3
         * {rootPath}: e.g. /Users/Development
         * {folderName}: e.g. myFolder
         * {folderPath}: e.g. /Users/Development/myFolder
         * {appName}: e.g. VS Code
         * {dirty}: indicator
         * {separator}: conditional separator
         */
        doGetWindowTitle() {
            const editor = this.editorService.activeEditor;
            const workspace = this.contextService.getWorkspace();
            // Compute root
            let root;
            if (workspace.configuration) {
                root = workspace.configuration;
            }
            else if (workspace.folders.length) {
                root = workspace.folders[0].uri;
            }
            // Compute active editor folder
            const editorResource = editor ? editor_1.toResource(editor) : undefined;
            let editorFolderResource = editorResource ? resources.dirname(editorResource) : undefined;
            if (editorFolderResource && editorFolderResource.path === '.') {
                editorFolderResource = undefined;
            }
            // Compute folder resource
            // Single Root Workspace: always the root single workspace in this case
            // Otherwise: root folder of the currently active file if any
            const folder = this.contextService.getWorkbenchState() === 2 /* FOLDER */ ? workspace.folders[0] : this.contextService.getWorkspaceFolder(editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.MASTER }));
            // Variables
            const activeEditorShort = editor ? editor.getTitle(0 /* SHORT */) : '';
            const activeEditorMedium = editor ? editor.getTitle(1 /* MEDIUM */) : activeEditorShort;
            const activeEditorLong = editor ? editor.getTitle(2 /* LONG */) : activeEditorMedium;
            const activeFolderShort = editorFolderResource ? resources.basename(editorFolderResource) : '';
            const activeFolderMedium = editorFolderResource ? this.labelService.getUriLabel(editorFolderResource, { relative: true }) : '';
            const activeFolderLong = editorFolderResource ? this.labelService.getUriLabel(editorFolderResource) : '';
            const rootName = this.labelService.getWorkspaceLabel(workspace);
            const rootPath = root ? this.labelService.getUriLabel(root) : '';
            const folderName = folder ? folder.name : '';
            const folderPath = folder ? this.labelService.getUriLabel(folder.uri) : '';
            const dirty = editor && editor.isDirty() ? TitlebarPart.TITLE_DIRTY : '';
            const appName = this.environmentService.appNameLong;
            const separator = TitlebarPart.TITLE_SEPARATOR;
            const titleTemplate = this.configurationService.getValue('window.title');
            return labels_1.template(titleTemplate, {
                activeEditorShort,
                activeEditorLong,
                activeEditorMedium,
                activeFolderShort,
                activeFolderMedium,
                activeFolderLong,
                rootName,
                rootPath,
                folderName,
                folderPath,
                dirty,
                appName,
                separator: { label: separator }
            });
        }
        createContentArea(parent) {
            this.element = parent;
            // Draggable region that we can manipulate for #52522
            if (!platform_1.isWeb) {
                this.dragRegion = dom_1.append(this.element, dom_1.$('div.titlebar-drag-region'));
            }
            // App Icon (Native Windows/Linux)
            if (!platform_1.isMacintosh && !platform_1.isWeb) {
                this.appIcon = dom_1.append(this.element, dom_1.$('div.window-appicon'));
                this.onUpdateAppIconDragBehavior();
                this._register(dom_1.addDisposableListener(this.appIcon, dom_1.EventType.DBLCLICK, (e => {
                    this.windowService.closeWindow();
                })));
            }
            // Menubar: install a custom menu bar depending on configuration
            if (windows_1.getTitleBarStyle(this.configurationService, this.environmentService) !== 'native' && (!platform_1.isMacintosh || platform_1.isWeb)) {
                this.customMenubar = this._register(this.instantiationService.createInstance(menubarControl_1.CustomMenubarControl));
                this.menubar = dom_1.append(this.element, dom_1.$('div.menubar'));
                this.menubar.setAttribute('role', 'menubar');
                this.customMenubar.create(this.menubar);
                this._register(this.customMenubar.onVisibilityChange(e => this.onMenubarVisibilityChanged(e)));
                this._register(this.customMenubar.onFocusStateChange(e => this.onMenubarFocusChanged(e)));
            }
            // Title
            this.title = dom_1.append(this.element, dom_1.$('div.window-title'));
            if (this.pendingTitle) {
                this.title.innerText = this.pendingTitle;
            }
            else {
                this.titleUpdater.schedule();
            }
            // Maximize/Restore on doubleclick
            if (platform_1.isMacintosh && !platform_1.isWeb) {
                this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.DBLCLICK, e => {
                    dom_1.EventHelper.stop(e);
                    this.onTitleDoubleclick();
                }));
            }
            // Context menu on title
            [dom_1.EventType.CONTEXT_MENU, dom_1.EventType.MOUSE_DOWN].forEach(event => {
                this._register(dom_1.addDisposableListener(this.title, event, e => {
                    if (e.type === dom_1.EventType.CONTEXT_MENU || e.metaKey) {
                        dom_1.EventHelper.stop(e);
                        this.onContextMenu(e);
                    }
                }));
            });
            // Window Controls (Native Windows/Linux)
            if (!platform_1.isMacintosh && !platform_1.isWeb) {
                this.windowControls = dom_1.append(this.element, dom_1.$('div.window-controls-container'));
                // Minimize
                const minimizeIconContainer = dom_1.append(this.windowControls, dom_1.$('div.window-icon-bg'));
                const minimizeIcon = dom_1.append(minimizeIconContainer, dom_1.$('div.window-icon'));
                dom_1.addClass(minimizeIcon, 'window-minimize');
                this._register(dom_1.addDisposableListener(minimizeIcon, dom_1.EventType.CLICK, e => {
                    this.windowService.minimizeWindow();
                }));
                // Restore
                const restoreIconContainer = dom_1.append(this.windowControls, dom_1.$('div.window-icon-bg'));
                this.maxRestoreControl = dom_1.append(restoreIconContainer, dom_1.$('div.window-icon'));
                dom_1.addClass(this.maxRestoreControl, 'window-max-restore');
                this._register(dom_1.addDisposableListener(this.maxRestoreControl, dom_1.EventType.CLICK, (e) => __awaiter(this, void 0, void 0, function* () {
                    const maximized = yield this.windowService.isMaximized();
                    if (maximized) {
                        return this.windowService.unmaximizeWindow();
                    }
                    return this.windowService.maximizeWindow();
                })));
                // Close
                const closeIconContainer = dom_1.append(this.windowControls, dom_1.$('div.window-icon-bg'));
                dom_1.addClass(closeIconContainer, 'window-close-bg');
                const closeIcon = dom_1.append(closeIconContainer, dom_1.$('div.window-icon'));
                dom_1.addClass(closeIcon, 'window-close');
                this._register(dom_1.addDisposableListener(closeIcon, dom_1.EventType.CLICK, e => {
                    this.windowService.closeWindow();
                }));
                // Resizer
                this.resizer = dom_1.append(this.element, dom_1.$('div.resizer'));
                const isMaximized = this.environmentService.configuration.maximized ? true : false;
                this.onDidChangeMaximized(isMaximized);
                this.windowService.onDidChangeMaximize(this.onDidChangeMaximized, this);
            }
            // Since the title area is used to drag the window, we do not want to steal focus from the
            // currently active element. So we restore focus after a timeout back to where it was.
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.MOUSE_DOWN, e => {
                if (e.target && dom_1.isAncestor(e.target, this.menubar)) {
                    return;
                }
                const active = document.activeElement;
                setTimeout(() => {
                    if (active instanceof HTMLElement) {
                        active.focus();
                    }
                }, 0 /* need a timeout because we are in capture phase */);
            }, true /* use capture to know the currently active element properly */));
            this.updateStyles();
            return this.element;
        }
        onDidChangeMaximized(maximized) {
            if (this.maxRestoreControl) {
                if (maximized) {
                    dom_1.removeClass(this.maxRestoreControl, 'window-maximize');
                    dom_1.addClass(this.maxRestoreControl, 'window-unmaximize');
                }
                else {
                    dom_1.removeClass(this.maxRestoreControl, 'window-unmaximize');
                    dom_1.addClass(this.maxRestoreControl, 'window-maximize');
                }
            }
            if (this.resizer) {
                if (maximized) {
                    dom_1.hide(this.resizer);
                }
                else {
                    dom_1.show(this.resizer);
                }
            }
            this.adjustTitleMarginToCenter();
        }
        updateStyles() {
            super.updateStyles();
            // Part container
            if (this.element) {
                if (this.isInactive) {
                    dom_1.addClass(this.element, 'inactive');
                }
                else {
                    dom_1.removeClass(this.element, 'inactive');
                }
                const titleBackground = this.getColor(this.isInactive ? theme_1.TITLE_BAR_INACTIVE_BACKGROUND : theme_1.TITLE_BAR_ACTIVE_BACKGROUND);
                this.element.style.backgroundColor = titleBackground;
                if (titleBackground && color_1.Color.fromHex(titleBackground).isLighter()) {
                    dom_1.addClass(this.element, 'light');
                }
                else {
                    dom_1.removeClass(this.element, 'light');
                }
                const titleForeground = this.getColor(this.isInactive ? theme_1.TITLE_BAR_INACTIVE_FOREGROUND : theme_1.TITLE_BAR_ACTIVE_FOREGROUND);
                this.element.style.color = titleForeground;
                const titleBorder = this.getColor(theme_1.TITLE_BAR_BORDER);
                this.element.style.borderBottom = titleBorder ? `1px solid ${titleBorder}` : null;
            }
        }
        onTitleDoubleclick() {
            this.windowService.onWindowTitleDoubleClick();
        }
        onUpdateAppIconDragBehavior() {
            const setting = this.configurationService.getValue('window.doubleClickIconToClose');
            if (setting) {
                this.appIcon.style['-webkit-app-region'] = 'no-drag';
            }
            else {
                this.appIcon.style['-webkit-app-region'] = 'drag';
            }
        }
        onContextMenu(e) {
            // Find target anchor
            const event = new mouseEvent_1.StandardMouseEvent(e);
            const anchor = { x: event.posx, y: event.posy };
            // Show menu
            const actions = this.getContextMenuActions();
            if (actions.length) {
                this.contextMenuService.showContextMenu({
                    getAnchor: () => anchor,
                    getActions: () => actions,
                    onHide: () => actions.forEach(a => a.dispose())
                });
            }
        }
        getContextMenuActions() {
            const actions = [];
            if (this.representedFileName) {
                const segments = this.representedFileName.split(path_1.posix.sep);
                for (let i = segments.length; i > 0; i--) {
                    const isFile = (i === segments.length);
                    let pathOffset = i;
                    if (!isFile) {
                        pathOffset++; // for segments which are not the file name we want to open the folder
                    }
                    const path = segments.slice(0, pathOffset).join(path_1.posix.sep);
                    let label;
                    if (!isFile) {
                        label = labels_1.getBaseLabel(path_1.dirname(path));
                    }
                    else {
                        label = labels_1.getBaseLabel(path);
                    }
                    actions.push(new ShowItemInFolderAction(path, label || path_1.posix.sep, this.windowsService));
                }
            }
            return actions;
        }
        adjustTitleMarginToCenter() {
            if (this.customMenubar) {
                const leftMarker = (this.appIcon ? this.appIcon.clientWidth : 0) + this.menubar.clientWidth + 10;
                const rightMarker = this.element.clientWidth - (this.windowControls ? this.windowControls.clientWidth : 0) - 10;
                // Not enough space to center the titlebar within window,
                // Center between menu and window controls
                if (leftMarker > (this.element.clientWidth - this.title.clientWidth) / 2 ||
                    rightMarker < (this.element.clientWidth + this.title.clientWidth) / 2) {
                    this.title.style.position = null;
                    this.title.style.left = null;
                    this.title.style.transform = null;
                    return;
                }
            }
            this.title.style.position = 'absolute';
            this.title.style.left = '50%';
            this.title.style.transform = 'translate(-50%, 0)';
        }
        updateLayout(dimension) {
            this.lastLayoutDimensions = dimension;
            if (windows_1.getTitleBarStyle(this.configurationService, this.environmentService) === 'custom') {
                // Only prevent zooming behavior on macOS or when the menubar is not visible
                if ((!platform_1.isWeb && platform_1.isMacintosh) || this.configurationService.getValue('window.menuBarVisibility') === 'hidden') {
                    this.title.style.zoom = `${1 / browser_1.getZoomFactor()}`;
                    if (!platform_1.isWeb && (platform_1.isWindows || platform_1.isLinux)) {
                        this.appIcon.style.zoom = `${1 / browser_1.getZoomFactor()}`;
                        this.windowControls.style.zoom = `${1 / browser_1.getZoomFactor()}`;
                    }
                }
                else {
                    this.title.style.zoom = null;
                    if (!platform_1.isWeb && (platform_1.isWindows || platform_1.isLinux)) {
                        this.appIcon.style.zoom = null;
                        this.windowControls.style.zoom = null;
                    }
                }
                dom_1.runAtThisOrScheduleAtNextAnimationFrame(() => this.adjustTitleMarginToCenter());
                if (this.customMenubar) {
                    const menubarDimension = new dom_1.Dimension(0, dimension.height);
                    this.customMenubar.layout(menubarDimension);
                }
            }
        }
        layout(width, height) {
            this.updateLayout(new dom_1.Dimension(width, height));
            super.layoutContents(width, height);
        }
        toJSON() {
            return {
                type: "workbench.parts.titlebar" /* TITLEBAR_PART */
            };
        }
    };
    TitlebarPart.NLS_UNSUPPORTED = nls.localize('patchedWindowTitle', "[Unsupported]");
    TitlebarPart.NLS_USER_IS_ADMIN = platform_1.isWindows ? nls.localize('userIsAdmin', "[Administrator]") : nls.localize('userIsSudo', "[Superuser]");
    TitlebarPart.NLS_EXTENSION_HOST = nls.localize('devExtensionWindowTitlePrefix', "[Extension Development Host]");
    TitlebarPart.TITLE_DIRTY = '\u25cf ';
    TitlebarPart.TITLE_SEPARATOR = platform_1.isMacintosh ? ' — ' : ' - '; // macOS uses special - separator
    TitlebarPart = __decorate([
        __param(0, contextView_1.IContextMenuService),
        __param(1, windows_1.IWindowService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, windows_1.IWindowsService),
        __param(4, editorService_1.IEditorService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, themeService_1.IThemeService),
        __param(9, label_1.ILabelService),
        __param(10, storage_1.IStorageService),
        __param(11, layoutService_1.IWorkbenchLayoutService)
    ], TitlebarPart);
    exports.TitlebarPart = TitlebarPart;
    class ShowItemInFolderAction extends actions_1.Action {
        constructor(path, label, windowsService) {
            super('showItemInFolder.action.id', label);
            this.path = path;
            this.windowsService = windowsService;
        }
        run() {
            return this.windowsService.showItemInFolder(uri_1.URI.file(this.path));
        }
    }
    themeService_1.registerThemingParticipant((theme, collector) => {
        const titlebarActiveFg = theme.getColor(theme_1.TITLE_BAR_ACTIVE_FOREGROUND);
        if (titlebarActiveFg) {
            collector.addRule(`
		.monaco-workbench .part.titlebar > .window-controls-container .window-icon {
			background-color: ${titlebarActiveFg};
		}
		`);
        }
        const titlebarInactiveFg = theme.getColor(theme_1.TITLE_BAR_INACTIVE_FOREGROUND);
        if (titlebarInactiveFg) {
            collector.addRule(`
		.monaco-workbench .part.titlebar.inactive > .window-controls-container .window-icon {
				background-color: ${titlebarInactiveFg};
			}
		`);
        }
    });
    extensions_1.registerSingleton(titleService_1.ITitleService, TitlebarPart);
});
//# sourceMappingURL=titlebarPart.js.map