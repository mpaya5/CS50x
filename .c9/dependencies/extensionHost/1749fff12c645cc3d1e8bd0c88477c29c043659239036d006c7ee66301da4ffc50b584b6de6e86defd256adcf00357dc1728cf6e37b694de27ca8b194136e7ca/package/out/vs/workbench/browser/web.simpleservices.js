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
define(["require", "exports", "vs/base/common/uri", "vs/base/browser/browser", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/platform/update/common/update", "vs/platform/windows/common/windows", "vs/platform/workspaces/common/workspaces", "vs/platform/history/common/history", "vs/workbench/services/workspace/common/workspaceEditing", "vs/platform/remote/common/tunnel", "vs/platform/workspace/common/workspace", "vs/base/browser/dom", "vs/workbench/services/editor/common/editorService", "vs/workbench/common/editor", "vs/platform/files/common/files", "vs/platform/configuration/common/configuration", "vs/platform/history/common/historyStorage", "vs/platform/dialogs/common/dialogs", "vs/platform/product/common/product", "vs/base/common/severity", "vs/nls", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/stats/common/workspaceStats"], function (require, exports, uri_1, browser, extensions_1, event_1, log_1, lifecycle_1, storage_1, update_1, windows_1, workspaces_1, history_1, workspaceEditing_1, tunnel_1, workspace_1, dom_1, editorService_1, editor_1, files_1, configuration_1, historyStorage_1, dialogs_1, product_1, severity_1, nls_1, clipboardService_1, workspaceStats_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Update
    class SimpleUpdateService {
        constructor() {
            this.onStateChange = event_1.Event.None;
        }
        checkForUpdates(context) {
            return Promise.resolve(undefined);
        }
        downloadUpdate() {
            return Promise.resolve(undefined);
        }
        applyUpdate() {
            return Promise.resolve(undefined);
        }
        quitAndInstall() {
            return Promise.resolve(undefined);
        }
        isLatestVersion() {
            return Promise.resolve(true);
        }
    }
    exports.SimpleUpdateService = SimpleUpdateService;
    extensions_1.registerSingleton(update_1.IUpdateService, SimpleUpdateService);
    //#endregion
    //#region Window
    let SimpleWindowService = class SimpleWindowService extends lifecycle_1.Disposable {
        constructor(editorService, fileService, configurationService, storageService, workspaceService, logService) {
            super();
            this.editorService = editorService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.storageService = storageService;
            this.workspaceService = workspaceService;
            this.logService = logService;
            this.onDidChangeFocus = event_1.Event.None;
            this.onDidChangeMaximize = event_1.Event.None;
            this.hasFocus = true;
            this.windowId = 0;
            this.addWorkspaceToRecentlyOpened();
            this.registerListeners();
        }
        addWorkspaceToRecentlyOpened() {
            const workspace = this.workspaceService.getWorkspace();
            switch (this.workspaceService.getWorkbenchState()) {
                case 2 /* FOLDER */:
                    this.addRecentlyOpened([{ folderUri: workspace.folders[0].uri }]);
                    break;
                case 3 /* WORKSPACE */:
                    this.addRecentlyOpened([{ workspace: { id: workspace.id, configPath: workspace.configuration } }]);
                    break;
            }
        }
        registerListeners() {
            this._register(dom_1.addDisposableListener(document, dom_1.EventType.FULLSCREEN_CHANGE, () => {
                if (document.fullscreenElement || document.webkitFullscreenElement) {
                    browser.setFullscreen(true);
                }
                else {
                    browser.setFullscreen(false);
                }
            }));
            this._register(dom_1.addDisposableListener(document, dom_1.EventType.WK_FULLSCREEN_CHANGE, () => {
                if (document.fullscreenElement || document.webkitFullscreenElement || document.webkitIsFullScreen) {
                    browser.setFullscreen(true);
                }
                else {
                    browser.setFullscreen(false);
                }
            }));
        }
        isFocused() {
            return Promise.resolve(this.hasFocus);
        }
        isMaximized() {
            return Promise.resolve(false);
        }
        pickFileFolderAndOpen(_options) {
            return Promise.resolve();
        }
        pickFileAndOpen(_options) {
            return Promise.resolve();
        }
        pickFolderAndOpen(_options) {
            return Promise.resolve();
        }
        pickWorkspaceAndOpen(_options) {
            return Promise.resolve();
        }
        reloadWindow() {
            window.location.reload();
            return Promise.resolve();
        }
        openDevTools() {
            return Promise.resolve();
        }
        toggleDevTools() {
            return Promise.resolve();
        }
        closeWorkspace() {
            return Promise.resolve();
        }
        enterWorkspace(_path) {
            return Promise.resolve(undefined);
        }
        toggleFullScreen(target) {
            if (!target) {
                return Promise.resolve();
            }
            // Chromium
            if (document.fullscreen !== undefined) {
                if (!document.fullscreen) {
                    return target.requestFullscreen().catch(() => {
                        // if it fails, chromium throws an exception with error undefined.
                        // re https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
                        console.warn('Toggle Full Screen failed');
                    });
                }
                else {
                    return document.exitFullscreen().catch(() => {
                        console.warn('Exit Full Screen failed');
                    });
                }
            }
            // Safari and Edge 14 are all using webkit prefix
            if (document.webkitIsFullScreen !== undefined) {
                try {
                    if (!document.webkitIsFullScreen) {
                        target.webkitRequestFullscreen(); // it's async, but doesn't return a real promise.
                    }
                    else {
                        document.webkitExitFullscreen(); // it's async, but doesn't return a real promise.
                    }
                }
                catch (_a) {
                    console.warn('Enter/Exit Full Screen failed');
                }
            }
            return Promise.resolve();
        }
        setRepresentedFilename(_fileName) {
            return Promise.resolve();
        }
        getRecentlyOpened() {
            return __awaiter(this, void 0, void 0, function* () {
                const recentlyOpenedRaw = this.storageService.get(SimpleWindowService.RECENTLY_OPENED_KEY, 0 /* GLOBAL */);
                if (recentlyOpenedRaw) {
                    return historyStorage_1.restoreRecentlyOpened(JSON.parse(recentlyOpenedRaw), this.logService);
                }
                return { workspaces: [], files: [] };
            });
        }
        addRecentlyOpened(recents) {
            return __awaiter(this, void 0, void 0, function* () {
                const recentlyOpened = yield this.getRecentlyOpened();
                recents.forEach(recent => {
                    if (history_1.isRecentFile(recent)) {
                        this.doRemoveFromRecentlyOpened(recentlyOpened, [recent.fileUri]);
                        recentlyOpened.files.unshift(recent);
                    }
                    else if (history_1.isRecentFolder(recent)) {
                        this.doRemoveFromRecentlyOpened(recentlyOpened, [recent.folderUri]);
                        recentlyOpened.workspaces.unshift(recent);
                    }
                    else {
                        this.doRemoveFromRecentlyOpened(recentlyOpened, [recent.workspace.configPath]);
                        recentlyOpened.workspaces.unshift(recent);
                    }
                });
                return this.saveRecentlyOpened(recentlyOpened);
            });
        }
        removeFromRecentlyOpened(paths) {
            return __awaiter(this, void 0, void 0, function* () {
                const recentlyOpened = yield this.getRecentlyOpened();
                this.doRemoveFromRecentlyOpened(recentlyOpened, paths);
                return this.saveRecentlyOpened(recentlyOpened);
            });
        }
        doRemoveFromRecentlyOpened(recentlyOpened, paths) {
            recentlyOpened.files = recentlyOpened.files.filter(file => {
                return !paths.some(path => path.toString() === file.fileUri.toString());
            });
            recentlyOpened.workspaces = recentlyOpened.workspaces.filter(workspace => {
                return !paths.some(path => path.toString() === (history_1.isRecentFolder(workspace) ? workspace.folderUri.toString() : workspace.workspace.configPath.toString()));
            });
        }
        saveRecentlyOpened(data) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.storageService.store(SimpleWindowService.RECENTLY_OPENED_KEY, JSON.stringify(historyStorage_1.toStoreData(data)), 0 /* GLOBAL */);
            });
        }
        focusWindow() {
            return Promise.resolve();
        }
        maximizeWindow() {
            return Promise.resolve();
        }
        unmaximizeWindow() {
            return Promise.resolve();
        }
        minimizeWindow() {
            return Promise.resolve();
        }
        openWindow(_uris, _options) {
            return __awaiter(this, void 0, void 0, function* () {
                const { openFolderInNewWindow } = this.shouldOpenNewWindow(_options);
                for (let i = 0; i < _uris.length; i++) {
                    const uri = _uris[i];
                    if ('folderUri' in uri) {
                        const newAddress = `${document.location.origin}/?folder=${uri.folderUri.path}`;
                        if (openFolderInNewWindow) {
                            window.open(newAddress);
                        }
                        else {
                            window.location.href = newAddress;
                        }
                    }
                    if ('workspaceUri' in uri) {
                        const newAddress = `${document.location.origin}/?workspace=${uri.workspaceUri.path}`;
                        if (openFolderInNewWindow) {
                            window.open(newAddress);
                        }
                        else {
                            window.location.href = newAddress;
                        }
                    }
                    if ('fileUri' in uri) {
                        const inputs = yield editor_1.pathsToEditors([uri], this.fileService);
                        this.editorService.openEditors(inputs);
                    }
                }
                return Promise.resolve();
            });
        }
        shouldOpenNewWindow(_options = {}) {
            const windowConfig = this.configurationService.getValue('window');
            const openFolderInNewWindowConfig = (windowConfig && windowConfig.openFoldersInNewWindow) || 'default' /* default */;
            let openFolderInNewWindow = !!_options.forceNewWindow && !_options.forceReuseWindow;
            if (!_options.forceNewWindow && !_options.forceReuseWindow && (openFolderInNewWindowConfig === 'on' || openFolderInNewWindowConfig === 'off')) {
                openFolderInNewWindow = (openFolderInNewWindowConfig === 'on');
            }
            return { openFolderInNewWindow };
        }
        closeWindow() {
            window.close();
            return Promise.resolve();
        }
        setDocumentEdited(_flag) {
            return Promise.resolve();
        }
        onWindowTitleDoubleClick() {
            return Promise.resolve();
        }
        showMessageBox(_options) {
            return Promise.resolve({ button: 0 });
        }
        showSaveDialog(_options) {
            throw new Error('not implemented');
        }
        showOpenDialog(_options) {
            throw new Error('not implemented');
        }
        updateTouchBar(_items) {
            return Promise.resolve();
        }
        resolveProxy(url) {
            return Promise.resolve(undefined);
        }
    };
    SimpleWindowService.RECENTLY_OPENED_KEY = 'recently.opened';
    SimpleWindowService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, files_1.IFileService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, storage_1.IStorageService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, log_1.ILogService)
    ], SimpleWindowService);
    exports.SimpleWindowService = SimpleWindowService;
    extensions_1.registerSingleton(windows_1.IWindowService, SimpleWindowService);
    //#endregion
    //#region Window
    let SimpleWindowsService = class SimpleWindowsService {
        constructor(dialogService, productService, clipboardService) {
            this.dialogService = dialogService;
            this.productService = productService;
            this.clipboardService = clipboardService;
            this.windowCount = 1;
            this.onWindowOpen = event_1.Event.None;
            this.onWindowFocus = event_1.Event.None;
            this.onWindowBlur = event_1.Event.None;
            this.onWindowMaximize = event_1.Event.None;
            this.onWindowUnmaximize = event_1.Event.None;
            this.onRecentlyOpenedChange = event_1.Event.None;
        }
        isFocused(_windowId) {
            return Promise.resolve(true);
        }
        pickFileFolderAndOpen(_options) {
            return Promise.resolve();
        }
        pickFileAndOpen(_options) {
            return Promise.resolve();
        }
        pickFolderAndOpen(_options) {
            return Promise.resolve();
        }
        pickWorkspaceAndOpen(_options) {
            return Promise.resolve();
        }
        reloadWindow(_windowId) {
            return Promise.resolve();
        }
        openDevTools(_windowId) {
            return Promise.resolve();
        }
        toggleDevTools(_windowId) {
            return Promise.resolve();
        }
        closeWorkspace(_windowId) {
            return Promise.resolve();
        }
        enterWorkspace(_windowId, _path) {
            return Promise.resolve(undefined);
        }
        toggleFullScreen(_windowId) {
            return Promise.resolve();
        }
        setRepresentedFilename(_windowId, _fileName) {
            return Promise.resolve();
        }
        addRecentlyOpened(recents) {
            return Promise.resolve();
        }
        removeFromRecentlyOpened(_paths) {
            return Promise.resolve();
        }
        clearRecentlyOpened() {
            return Promise.resolve();
        }
        getRecentlyOpened(_windowId) {
            return Promise.resolve({
                workspaces: [],
                files: []
            });
        }
        focusWindow(_windowId) {
            return Promise.resolve();
        }
        closeWindow(_windowId) {
            return Promise.resolve();
        }
        isMaximized(_windowId) {
            return Promise.resolve(false);
        }
        maximizeWindow(_windowId) {
            return Promise.resolve();
        }
        minimizeWindow(_windowId) {
            return Promise.resolve();
        }
        unmaximizeWindow(_windowId) {
            return Promise.resolve();
        }
        onWindowTitleDoubleClick(_windowId) {
            return Promise.resolve();
        }
        setDocumentEdited(_windowId, _flag) {
            return Promise.resolve();
        }
        quit() {
            return Promise.resolve();
        }
        relaunch(_options) {
            window.location.reload();
            return Promise.resolve();
        }
        whenSharedProcessReady() {
            return Promise.resolve();
        }
        toggleSharedProcess() {
            return Promise.resolve();
        }
        // Global methods
        openWindow(_windowId, _uris, _options) {
            return Promise.resolve();
        }
        openNewWindow() {
            return Promise.resolve();
        }
        openExtensionDevelopmentHostWindow(args, env) {
            // we pass the "ParsedArgs" as query parameters of the URL
            let newAddress = `${document.location.origin}/?`;
            let gotFolder = false;
            const addQueryParameter = (key, value) => {
                const lastChar = newAddress.charAt(newAddress.length - 1);
                if (lastChar !== '?' && lastChar !== '&') {
                    newAddress += '&';
                }
                newAddress += `${key}=${encodeURIComponent(value)}`;
            };
            const f = args['folder-uri'];
            if (f) {
                let u;
                if (Array.isArray(f)) {
                    if (f.length > 0) {
                        u = uri_1.URI.parse(f[0]);
                    }
                }
                else {
                    u = uri_1.URI.parse(f);
                }
                if (u) {
                    gotFolder = true;
                    addQueryParameter('folder', u.path);
                }
            }
            if (!gotFolder) {
                // request empty window
                addQueryParameter('ew', 'true');
            }
            const ep = args['extensionDevelopmentPath'];
            if (ep) {
                let u;
                if (Array.isArray(ep)) {
                    if (ep.length > 0) {
                        u = ep[0];
                    }
                }
                else {
                    u = ep;
                }
                if (u) {
                    addQueryParameter('edp', u);
                }
            }
            const di = args['debugId'];
            if (di) {
                addQueryParameter('di', di);
            }
            const ibe = args['inspect-brk-extensions'];
            if (ibe) {
                addQueryParameter('ibe', ibe);
            }
            window.open(newAddress);
            return Promise.resolve();
        }
        getWindows() {
            return Promise.resolve([]);
        }
        getWindowCount() {
            return Promise.resolve(this.windowCount);
        }
        log(_severity, _args) {
            return Promise.resolve();
        }
        showItemInFolder(_path) {
            return Promise.resolve();
        }
        newWindowTab() {
            return Promise.resolve();
        }
        showPreviousWindowTab() {
            return Promise.resolve();
        }
        showNextWindowTab() {
            return Promise.resolve();
        }
        moveWindowTabToNewWindow() {
            return Promise.resolve();
        }
        mergeAllWindowTabs() {
            return Promise.resolve();
        }
        toggleWindowTabsBar() {
            return Promise.resolve();
        }
        updateTouchBar(_windowId, _items) {
            return Promise.resolve();
        }
        getActiveWindowId() {
            return Promise.resolve(undefined);
        }
        // This needs to be handled from browser process to prevent
        // foreground ordering issues on Windows
        openExternal(_url) {
            dom_1.windowOpenNoOpener(_url);
            return Promise.resolve(true);
        }
        // TODO: this is a bit backwards
        startCrashReporter(_config) {
            return Promise.resolve();
        }
        showMessageBox(_windowId, _options) {
            throw new Error('not implemented');
        }
        showSaveDialog(_windowId, _options) {
            throw new Error('not implemented');
        }
        showOpenDialog(_windowId, _options) {
            throw new Error('not implemented');
        }
        openAboutDialog() {
            return __awaiter(this, void 0, void 0, function* () {
                const detail = nls_1.localize('aboutDetail', "Version: {0}\nCommit: {1}\nDate: {2}\nBrowser: {3}", this.productService.version || 'Unknown', this.productService.commit || 'Unknown', this.productService.date || 'Unknown', navigator.userAgent);
                const result = yield this.dialogService.show(severity_1.default.Info, this.productService.nameLong, [nls_1.localize('copy', "Copy"), nls_1.localize('ok', "OK")], { detail });
                if (result === 0) {
                    this.clipboardService.writeText(detail);
                }
            });
        }
        resolveProxy(windowId, url) {
            return Promise.resolve(undefined);
        }
    };
    SimpleWindowsService = __decorate([
        __param(0, dialogs_1.IDialogService),
        __param(1, product_1.IProductService),
        __param(2, clipboardService_1.IClipboardService)
    ], SimpleWindowsService);
    exports.SimpleWindowsService = SimpleWindowsService;
    extensions_1.registerSingleton(windows_1.IWindowsService, SimpleWindowsService);
    //#endregion
    //#region Workspace Editing
    class SimpleWorkspaceEditingService {
        addFolders(folders, donotNotifyError) {
            return Promise.resolve(undefined);
        }
        removeFolders(folders, donotNotifyError) {
            return Promise.resolve(undefined);
        }
        updateFolders(index, deleteCount, foldersToAdd, donotNotifyError) {
            return Promise.resolve(undefined);
        }
        enterWorkspace(path) {
            return Promise.resolve(undefined);
        }
        createAndEnterWorkspace(folders, path) {
            return Promise.resolve(undefined);
        }
        saveAndEnterWorkspace(path) {
            return Promise.resolve(undefined);
        }
        copyWorkspaceSettings(toWorkspace) {
            return Promise.resolve(undefined);
        }
        pickNewWorkspacePath() {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
    }
    exports.SimpleWorkspaceEditingService = SimpleWorkspaceEditingService;
    extensions_1.registerSingleton(workspaceEditing_1.IWorkspaceEditingService, SimpleWorkspaceEditingService, true);
    //#endregion
    //#region Workspaces
    class SimpleWorkspacesService {
        createUntitledWorkspace(folders, remoteAuthority) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
        deleteUntitledWorkspace(workspace) {
            return Promise.resolve(undefined);
        }
        getWorkspaceIdentifier(workspacePath) {
            // @ts-ignore
            return Promise.resolve(undefined);
        }
    }
    exports.SimpleWorkspacesService = SimpleWorkspacesService;
    extensions_1.registerSingleton(workspaces_1.IWorkspacesService, SimpleWorkspacesService);
    //#endregion
    //#region remote
    class SimpleTunnelService {
        openTunnel(remotePort) {
            return undefined;
        }
    }
    extensions_1.registerSingleton(tunnel_1.ITunnelService, SimpleTunnelService);
    //#endregion
    //#region workspace stats
    class SimpleWorkspaceStatsService {
        getTags() {
            return Promise.resolve({});
        }
        getTelemetryWorkspaceId(workspace, state) {
            return undefined;
        }
        getHashedRemotesFromUri(workspaceUri, stripEndingDotGit) {
            return Promise.resolve([]);
        }
    }
    extensions_1.registerSingleton(workspaceStats_1.IWorkspaceStatsService, SimpleWorkspaceStatsService);
});
//#endregion
//# sourceMappingURL=web.simpleservices.js.map