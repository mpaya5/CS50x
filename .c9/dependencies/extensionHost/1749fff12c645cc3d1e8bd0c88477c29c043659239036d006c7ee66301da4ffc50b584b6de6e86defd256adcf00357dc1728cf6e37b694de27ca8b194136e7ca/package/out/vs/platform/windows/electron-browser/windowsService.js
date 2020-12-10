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
define(["require", "exports", "vs/platform/workspaces/common/workspaces", "vs/platform/history/common/history", "vs/base/common/uri", "vs/platform/ipc/electron-browser/mainProcessService"], function (require, exports, workspaces_1, history_1, uri_1, mainProcessService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WindowsService = class WindowsService {
        constructor(mainProcessService) {
            this.channel = mainProcessService.getChannel('windows');
        }
        get onWindowOpen() { return this.channel.listen('onWindowOpen'); }
        get onWindowFocus() { return this.channel.listen('onWindowFocus'); }
        get onWindowBlur() { return this.channel.listen('onWindowBlur'); }
        get onWindowMaximize() { return this.channel.listen('onWindowMaximize'); }
        get onWindowUnmaximize() { return this.channel.listen('onWindowUnmaximize'); }
        get onRecentlyOpenedChange() { return this.channel.listen('onRecentlyOpenedChange'); }
        pickFileFolderAndOpen(options) {
            return this.channel.call('pickFileFolderAndOpen', options);
        }
        pickFileAndOpen(options) {
            return this.channel.call('pickFileAndOpen', options);
        }
        pickFolderAndOpen(options) {
            return this.channel.call('pickFolderAndOpen', options);
        }
        pickWorkspaceAndOpen(options) {
            return this.channel.call('pickWorkspaceAndOpen', options);
        }
        showMessageBox(windowId, options) {
            return this.channel.call('showMessageBox', [windowId, options]);
        }
        showSaveDialog(windowId, options) {
            return this.channel.call('showSaveDialog', [windowId, options]);
        }
        showOpenDialog(windowId, options) {
            return this.channel.call('showOpenDialog', [windowId, options]);
        }
        reloadWindow(windowId, args) {
            return this.channel.call('reloadWindow', [windowId, args]);
        }
        openDevTools(windowId, options) {
            return this.channel.call('openDevTools', [windowId, options]);
        }
        toggleDevTools(windowId) {
            return this.channel.call('toggleDevTools', windowId);
        }
        closeWorkspace(windowId) {
            return this.channel.call('closeWorkspace', windowId);
        }
        enterWorkspace(windowId, path) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield this.channel.call('enterWorkspace', [windowId, path]);
                if (result) {
                    result.workspace = workspaces_1.reviveWorkspaceIdentifier(result.workspace);
                }
                return result;
            });
        }
        toggleFullScreen(windowId) {
            return this.channel.call('toggleFullScreen', windowId);
        }
        setRepresentedFilename(windowId, fileName) {
            return this.channel.call('setRepresentedFilename', [windowId, fileName]);
        }
        addRecentlyOpened(recent) {
            return this.channel.call('addRecentlyOpened', recent);
        }
        removeFromRecentlyOpened(paths) {
            return this.channel.call('removeFromRecentlyOpened', paths);
        }
        clearRecentlyOpened() {
            return this.channel.call('clearRecentlyOpened');
        }
        getRecentlyOpened(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                const recentlyOpened = yield this.channel.call('getRecentlyOpened', windowId);
                recentlyOpened.workspaces.forEach(recent => history_1.isRecentWorkspace(recent) ? recent.workspace = workspaces_1.reviveWorkspaceIdentifier(recent.workspace) : recent.folderUri = uri_1.URI.revive(recent.folderUri));
                recentlyOpened.files.forEach(recent => recent.fileUri = uri_1.URI.revive(recent.fileUri));
                return recentlyOpened;
            });
        }
        newWindowTab() {
            return this.channel.call('newWindowTab');
        }
        showPreviousWindowTab() {
            return this.channel.call('showPreviousWindowTab');
        }
        showNextWindowTab() {
            return this.channel.call('showNextWindowTab');
        }
        moveWindowTabToNewWindow() {
            return this.channel.call('moveWindowTabToNewWindow');
        }
        mergeAllWindowTabs() {
            return this.channel.call('mergeAllWindowTabs');
        }
        toggleWindowTabsBar() {
            return this.channel.call('toggleWindowTabsBar');
        }
        focusWindow(windowId) {
            return this.channel.call('focusWindow', windowId);
        }
        closeWindow(windowId) {
            return this.channel.call('closeWindow', windowId);
        }
        isFocused(windowId) {
            return this.channel.call('isFocused', windowId);
        }
        isMaximized(windowId) {
            return this.channel.call('isMaximized', windowId);
        }
        maximizeWindow(windowId) {
            return this.channel.call('maximizeWindow', windowId);
        }
        unmaximizeWindow(windowId) {
            return this.channel.call('unmaximizeWindow', windowId);
        }
        minimizeWindow(windowId) {
            return this.channel.call('minimizeWindow', windowId);
        }
        onWindowTitleDoubleClick(windowId) {
            return this.channel.call('onWindowTitleDoubleClick', windowId);
        }
        setDocumentEdited(windowId, flag) {
            return this.channel.call('setDocumentEdited', [windowId, flag]);
        }
        quit() {
            return this.channel.call('quit');
        }
        relaunch(options) {
            return this.channel.call('relaunch', [options]);
        }
        whenSharedProcessReady() {
            return this.channel.call('whenSharedProcessReady');
        }
        toggleSharedProcess() {
            return this.channel.call('toggleSharedProcess');
        }
        openWindow(windowId, uris, options) {
            return this.channel.call('openWindow', [windowId, uris, options]);
        }
        openNewWindow(options) {
            return this.channel.call('openNewWindow', options);
        }
        openExtensionDevelopmentHostWindow(args, env) {
            return this.channel.call('openExtensionDevelopmentHostWindow', [args, env]);
        }
        getWindows() {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield this.channel.call('getWindows');
                for (const win of result) {
                    if (win.folderUri) {
                        win.folderUri = uri_1.URI.revive(win.folderUri);
                    }
                    if (win.workspace) {
                        win.workspace = workspaces_1.reviveWorkspaceIdentifier(win.workspace);
                    }
                }
                return result;
            });
        }
        getWindowCount() {
            return this.channel.call('getWindowCount');
        }
        log(severity, args) {
            return this.channel.call('log', [severity, args]);
        }
        showItemInFolder(path) {
            return this.channel.call('showItemInFolder', path);
        }
        getActiveWindowId() {
            return this.channel.call('getActiveWindowId');
        }
        openExternal(url) {
            return this.channel.call('openExternal', url);
        }
        startCrashReporter(config) {
            return this.channel.call('startCrashReporter', config);
        }
        updateTouchBar(windowId, items) {
            return this.channel.call('updateTouchBar', [windowId, items]);
        }
        openAboutDialog() {
            return this.channel.call('openAboutDialog');
        }
        resolveProxy(windowId, url) {
            return Promise.resolve(this.channel.call('resolveProxy', [windowId, url]));
        }
    };
    WindowsService = __decorate([
        __param(0, mainProcessService_1.IMainProcessService)
    ], WindowsService);
    exports.WindowsService = WindowsService;
});
//# sourceMappingURL=windowsService.js.map