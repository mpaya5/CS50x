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
define(["require", "exports", "vs/nls", "os", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/uri", "vs/platform/product/node/product", "vs/platform/environment/common/environment", "electron", "vs/base/common/event", "vs/platform/url/common/url", "vs/platform/lifecycle/electron-main/lifecycleMain", "vs/platform/windows/electron-main/windows", "vs/platform/history/common/history", "vs/base/common/network", "vs/base/common/labels", "vs/base/common/platform", "vs/platform/log/common/log"], function (require, exports, nls, os, lifecycle_1, objects_1, uri_1, product_1, environment_1, electron_1, event_1, url_1, lifecycleMain_1, windows_1, history_1, network_1, labels_1, platform_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WindowsService = class WindowsService extends lifecycle_1.Disposable {
        constructor(sharedProcess, windowsMainService, environmentService, urlService, lifecycleService, historyService, logService) {
            super();
            this.sharedProcess = sharedProcess;
            this.windowsMainService = windowsMainService;
            this.environmentService = environmentService;
            this.lifecycleService = lifecycleService;
            this.historyService = historyService;
            this.logService = logService;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            this.onWindowOpen = event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-created', (_, w) => w.id), id => !!this.windowsMainService.getWindowById(id));
            this.onWindowBlur = event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-blur', (_, w) => w.id), id => !!this.windowsMainService.getWindowById(id));
            this.onWindowMaximize = event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-maximize', (_, w) => w.id), id => !!this.windowsMainService.getWindowById(id));
            this.onWindowUnmaximize = event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-unmaximize', (_, w) => w.id), id => !!this.windowsMainService.getWindowById(id));
            this.onWindowFocus = event_1.Event.any(event_1.Event.map(event_1.Event.filter(event_1.Event.map(this.windowsMainService.onWindowsCountChanged, () => this.windowsMainService.getLastActiveWindow()), w => !!w), w => w.id), event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-focus', (_, w) => w.id), id => !!this.windowsMainService.getWindowById(id)));
            this.onRecentlyOpenedChange = this.historyService.onRecentlyOpenedChange;
            urlService.registerHandler(this);
            // remember last active window id
            event_1.Event.latch(event_1.Event.any(this.onWindowOpen, this.onWindowFocus))(id => this._activeWindowId = id, null, this.disposables);
        }
        pickFileFolderAndOpen(options) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#pickFileFolderAndOpen');
                this.windowsMainService.pickFileFolderAndOpen(options);
            });
        }
        pickFileAndOpen(options) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#pickFileAndOpen');
                this.windowsMainService.pickFileAndOpen(options);
            });
        }
        pickFolderAndOpen(options) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#pickFolderAndOpen');
                this.windowsMainService.pickFolderAndOpen(options);
            });
        }
        pickWorkspaceAndOpen(options) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#pickWorkspaceAndOpen');
                this.windowsMainService.pickWorkspaceAndOpen(options);
            });
        }
        showMessageBox(windowId, options) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#showMessageBox', windowId);
                return this.withWindow(windowId, codeWindow => this.windowsMainService.showMessageBox(options, codeWindow), () => this.windowsMainService.showMessageBox(options));
            });
        }
        showSaveDialog(windowId, options) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#showSaveDialog', windowId);
                return this.withWindow(windowId, codeWindow => this.windowsMainService.showSaveDialog(options, codeWindow), () => this.windowsMainService.showSaveDialog(options));
            });
        }
        showOpenDialog(windowId, options) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#showOpenDialog', windowId);
                return this.withWindow(windowId, codeWindow => this.windowsMainService.showOpenDialog(options, codeWindow), () => this.windowsMainService.showOpenDialog(options));
            });
        }
        reloadWindow(windowId, args) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#reloadWindow', windowId);
                return this.withWindow(windowId, codeWindow => this.windowsMainService.reload(codeWindow, args));
            });
        }
        openDevTools(windowId, options) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#openDevTools', windowId);
                return this.withWindow(windowId, codeWindow => codeWindow.win.webContents.openDevTools(options));
            });
        }
        toggleDevTools(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#toggleDevTools', windowId);
                return this.withWindow(windowId, codeWindow => {
                    const contents = codeWindow.win.webContents;
                    if (platform_1.isMacintosh && codeWindow.hasHiddenTitleBarStyle() && !codeWindow.isFullScreen() && !contents.isDevToolsOpened()) {
                        contents.openDevTools({ mode: 'undocked' }); // due to https://github.com/electron/electron/issues/3647
                    }
                    else {
                        contents.toggleDevTools();
                    }
                });
            });
        }
        updateTouchBar(windowId, items) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#updateTouchBar', windowId);
                return this.withWindow(windowId, codeWindow => codeWindow.updateTouchBar(items));
            });
        }
        closeWorkspace(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#closeWorkspace', windowId);
                return this.withWindow(windowId, codeWindow => this.windowsMainService.closeWorkspace(codeWindow));
            });
        }
        enterWorkspace(windowId, path) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#enterWorkspace', windowId);
                return this.withWindow(windowId, codeWindow => this.windowsMainService.enterWorkspace(codeWindow, path));
            });
        }
        toggleFullScreen(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#toggleFullScreen', windowId);
                return this.withWindow(windowId, codeWindow => codeWindow.toggleFullScreen());
            });
        }
        setRepresentedFilename(windowId, fileName) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#setRepresentedFilename', windowId);
                return this.withWindow(windowId, codeWindow => codeWindow.setRepresentedFilename(fileName));
            });
        }
        addRecentlyOpened(recents) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#addRecentlyOpened');
                this.historyService.addRecentlyOpened(recents);
            });
        }
        removeFromRecentlyOpened(paths) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#removeFromRecentlyOpened');
                this.historyService.removeFromRecentlyOpened(paths);
            });
        }
        clearRecentlyOpened() {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#clearRecentlyOpened');
                this.historyService.clearRecentlyOpened();
            });
        }
        getRecentlyOpened(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#getRecentlyOpened', windowId);
                return this.withWindow(windowId, codeWindow => this.historyService.getRecentlyOpened(codeWindow.config.workspace, codeWindow.config.folderUri, codeWindow.config.filesToOpenOrCreate), () => this.historyService.getRecentlyOpened());
            });
        }
        newWindowTab() {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#newWindowTab');
                this.windowsMainService.openNewTabbedWindow(5 /* API */);
            });
        }
        showPreviousWindowTab() {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#showPreviousWindowTab');
                electron_1.Menu.sendActionToFirstResponder('selectPreviousTab:');
            });
        }
        showNextWindowTab() {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#showNextWindowTab');
                electron_1.Menu.sendActionToFirstResponder('selectNextTab:');
            });
        }
        moveWindowTabToNewWindow() {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#moveWindowTabToNewWindow');
                electron_1.Menu.sendActionToFirstResponder('moveTabToNewWindow:');
            });
        }
        mergeAllWindowTabs() {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#mergeAllWindowTabs');
                electron_1.Menu.sendActionToFirstResponder('mergeAllWindows:');
            });
        }
        toggleWindowTabsBar() {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#toggleWindowTabsBar');
                electron_1.Menu.sendActionToFirstResponder('toggleTabBar:');
            });
        }
        focusWindow(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#focusWindow', windowId);
                if (platform_1.isMacintosh) {
                    return this.withWindow(windowId, codeWindow => codeWindow.win.show());
                }
                else {
                    return this.withWindow(windowId, codeWindow => codeWindow.win.focus());
                }
            });
        }
        closeWindow(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#closeWindow', windowId);
                return this.withWindow(windowId, codeWindow => codeWindow.win.close());
            });
        }
        isFocused(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#isFocused', windowId);
                return this.withWindow(windowId, codeWindow => codeWindow.win.isFocused(), () => false);
            });
        }
        isMaximized(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#isMaximized', windowId);
                return this.withWindow(windowId, codeWindow => codeWindow.win.isMaximized(), () => false);
            });
        }
        maximizeWindow(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#maximizeWindow', windowId);
                return this.withWindow(windowId, codeWindow => codeWindow.win.maximize());
            });
        }
        unmaximizeWindow(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#unmaximizeWindow', windowId);
                return this.withWindow(windowId, codeWindow => codeWindow.win.unmaximize());
            });
        }
        minimizeWindow(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#minimizeWindow', windowId);
                return this.withWindow(windowId, codeWindow => codeWindow.win.minimize());
            });
        }
        onWindowTitleDoubleClick(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#onWindowTitleDoubleClick', windowId);
                return this.withWindow(windowId, codeWindow => codeWindow.onWindowTitleDoubleClick());
            });
        }
        setDocumentEdited(windowId, flag) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#setDocumentEdited', windowId);
                return this.withWindow(windowId, codeWindow => {
                    if (codeWindow.win.isDocumentEdited() !== flag) {
                        codeWindow.win.setDocumentEdited(flag);
                    }
                });
            });
        }
        openWindow(windowId, urisToOpen, options) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#openWindow');
                if (!urisToOpen || !urisToOpen.length) {
                    return undefined;
                }
                this.windowsMainService.open({
                    context: 5 /* API */,
                    contextWindowId: windowId,
                    urisToOpen: urisToOpen,
                    cli: options.args ? Object.assign({}, this.environmentService.args, options.args) : this.environmentService.args,
                    forceNewWindow: options.forceNewWindow,
                    forceReuseWindow: options.forceReuseWindow,
                    diffMode: options.diffMode,
                    addMode: options.addMode,
                    gotoLineMode: options.gotoLineMode,
                    noRecentEntry: options.noRecentEntry,
                    waitMarkerFileURI: options.waitMarkerFileURI
                });
            });
        }
        openNewWindow(options) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#openNewWindow ' + JSON.stringify(options));
                this.windowsMainService.openNewWindow(5 /* API */, options);
            });
        }
        openExtensionDevelopmentHostWindow(args, env) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#openExtensionDevelopmentHostWindow ' + JSON.stringify(args));
                if (args.extensionDevelopmentPath) {
                    this.windowsMainService.openExtensionDevelopmentHostWindow(args.extensionDevelopmentPath, {
                        context: 5 /* API */,
                        cli: args,
                        userEnv: Object.keys(env).length > 0 ? env : undefined
                    });
                }
            });
        }
        getWindows() {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#getWindows');
                const windows = this.windowsMainService.getWindows();
                const result = windows.map(w => ({ id: w.id, workspace: w.openedWorkspace, folderUri: w.openedFolderUri, title: w.win.getTitle(), filename: w.getRepresentedFilename() }));
                return result;
            });
        }
        getWindowCount() {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#getWindowCount');
                return this.windowsMainService.getWindows().length;
            });
        }
        log(severity, args) {
            return __awaiter(this, void 0, void 0, function* () {
                let consoleFn = console.log;
                switch (severity) {
                    case 'error':
                        consoleFn = console.error;
                        break;
                    case 'warn':
                        consoleFn = console.warn;
                        break;
                    case 'info':
                        consoleFn = console.info;
                        break;
                }
                consoleFn.call(console, ...args);
            });
        }
        showItemInFolder(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#showItemInFolder');
                if (resource.scheme === network_1.Schemas.file) {
                    electron_1.shell.showItemInFolder(resource.fsPath);
                }
            });
        }
        getActiveWindowId() {
            return __awaiter(this, void 0, void 0, function* () {
                return this._activeWindowId;
            });
        }
        openExternal(url) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#openExternal');
                electron_1.shell.openExternal(url);
                return true;
            });
        }
        startCrashReporter(config) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#startCrashReporter');
                electron_1.crashReporter.start(config);
            });
        }
        quit() {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#quit');
                this.windowsMainService.quit();
            });
        }
        relaunch(options) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#relaunch');
                this.lifecycleService.relaunch(options);
            });
        }
        whenSharedProcessReady() {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#whenSharedProcessReady');
                return this.sharedProcess.whenReady();
            });
        }
        toggleSharedProcess() {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#toggleSharedProcess');
                this.sharedProcess.toggle();
            });
        }
        openAboutDialog() {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('windowsService#openAboutDialog');
                let version = electron_1.app.getVersion();
                if (product_1.default.target) {
                    version = `${version} (${product_1.default.target} setup)`;
                }
                const isSnap = process.platform === 'linux' && process.env.SNAP && process.env.SNAP_REVISION;
                const detail = nls.localize('aboutDetail', "Version: {0}\nCommit: {1}\nDate: {2}\nElectron: {3}\nChrome: {4}\nNode.js: {5}\nV8: {6}\nOS: {7}", version, product_1.default.commit || 'Unknown', product_1.default.date || 'Unknown', process.versions['electron'], process.versions['chrome'], process.versions['node'], process.versions['v8'], `${os.type()} ${os.arch()} ${os.release()}${isSnap ? ' snap' : ''}`);
                const ok = nls.localize('okButton', "OK");
                const copy = labels_1.mnemonicButtonLabel(nls.localize({ key: 'copy', comment: ['&& denotes a mnemonic'] }, "&&Copy"));
                let buttons;
                if (platform_1.isLinux) {
                    buttons = [copy, ok];
                }
                else {
                    buttons = [ok, copy];
                }
                const result = yield this.windowsMainService.showMessageBox({
                    title: product_1.default.nameLong,
                    type: 'info',
                    message: product_1.default.nameLong,
                    detail: `\n${detail}`,
                    buttons,
                    noLink: true,
                    defaultId: buttons.indexOf(ok),
                    cancelId: buttons.indexOf(ok)
                }, this.windowsMainService.getFocusedWindow() || this.windowsMainService.getLastActiveWindow());
                if (buttons[result.button] === copy) {
                    electron_1.clipboard.writeText(detail);
                }
            });
        }
        handleURL(uri) {
            return __awaiter(this, void 0, void 0, function* () {
                // Catch file URLs
                if (uri.authority === network_1.Schemas.file && !!uri.path) {
                    this.openFileForURI({ fileUri: uri_1.URI.file(uri.fsPath) }); // using fsPath on a non-file URI...
                    return true;
                }
                return false;
            });
        }
        openFileForURI(uri) {
            const cli = objects_1.assign(Object.create(null), this.environmentService.args);
            const urisToOpen = [uri];
            this.windowsMainService.open({ context: 5 /* API */, cli, urisToOpen, gotoLineMode: true });
        }
        resolveProxy(windowId, url) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise(resolve => {
                    const codeWindow = this.windowsMainService.getWindowById(windowId);
                    if (codeWindow) {
                        codeWindow.win.webContents.session.resolveProxy(url, proxy => {
                            resolve(proxy);
                        });
                    }
                    else {
                        resolve();
                    }
                });
            });
        }
        withWindow(windowId, fn, fallback) {
            const codeWindow = this.windowsMainService.getWindowById(windowId);
            if (codeWindow) {
                return fn(codeWindow);
            }
            if (fallback) {
                return fallback();
            }
            return undefined;
        }
    };
    WindowsService = __decorate([
        __param(1, windows_1.IWindowsMainService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, url_1.IURLService),
        __param(4, lifecycleMain_1.ILifecycleService),
        __param(5, history_1.IHistoryMainService),
        __param(6, log_1.ILogService)
    ], WindowsService);
    exports.WindowsService = WindowsService;
});
//# sourceMappingURL=windowsService.js.map