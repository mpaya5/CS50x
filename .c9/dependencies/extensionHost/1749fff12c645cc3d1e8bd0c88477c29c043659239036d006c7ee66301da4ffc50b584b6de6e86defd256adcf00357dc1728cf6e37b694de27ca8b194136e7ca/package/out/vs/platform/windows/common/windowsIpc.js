/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/platform/windows/common/windows", "vs/platform/workspaces/common/workspaces", "vs/base/common/uri", "vs/platform/history/common/history"], function (require, exports, event_1, windows_1, workspaces_1, uri_1, history_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WindowsChannel {
        constructor(service) {
            this.service = service;
            this.onWindowOpen = event_1.Event.buffer(service.onWindowOpen, true);
            this.onWindowFocus = event_1.Event.buffer(service.onWindowFocus, true);
            this.onWindowBlur = event_1.Event.buffer(service.onWindowBlur, true);
            this.onWindowMaximize = event_1.Event.buffer(service.onWindowMaximize, true);
            this.onWindowUnmaximize = event_1.Event.buffer(service.onWindowUnmaximize, true);
            this.onRecentlyOpenedChange = event_1.Event.buffer(service.onRecentlyOpenedChange, true);
        }
        listen(_, event) {
            switch (event) {
                case 'onWindowOpen': return this.onWindowOpen;
                case 'onWindowFocus': return this.onWindowFocus;
                case 'onWindowBlur': return this.onWindowBlur;
                case 'onWindowMaximize': return this.onWindowMaximize;
                case 'onWindowUnmaximize': return this.onWindowUnmaximize;
                case 'onRecentlyOpenedChange': return this.onRecentlyOpenedChange;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'pickFileFolderAndOpen': return this.service.pickFileFolderAndOpen(arg);
                case 'pickFileAndOpen': return this.service.pickFileAndOpen(arg);
                case 'pickFolderAndOpen': return this.service.pickFolderAndOpen(arg);
                case 'pickWorkspaceAndOpen': return this.service.pickWorkspaceAndOpen(arg);
                case 'showMessageBox': return this.service.showMessageBox(arg[0], arg[1]);
                case 'showSaveDialog': return this.service.showSaveDialog(arg[0], arg[1]);
                case 'showOpenDialog': return this.service.showOpenDialog(arg[0], arg[1]);
                case 'reloadWindow': return this.service.reloadWindow(arg[0], arg[1]);
                case 'openDevTools': return this.service.openDevTools(arg[0], arg[1]);
                case 'toggleDevTools': return this.service.toggleDevTools(arg);
                case 'closeWorkspace': return this.service.closeWorkspace(arg);
                case 'enterWorkspace': return this.service.enterWorkspace(arg[0], uri_1.URI.revive(arg[1]));
                case 'toggleFullScreen': return this.service.toggleFullScreen(arg);
                case 'setRepresentedFilename': return this.service.setRepresentedFilename(arg[0], arg[1]);
                case 'addRecentlyOpened': return this.service.addRecentlyOpened(arg.map((recent) => {
                    if (history_1.isRecentFile(recent)) {
                        recent.fileUri = uri_1.URI.revive(recent.fileUri);
                    }
                    else if (history_1.isRecentFolder(recent)) {
                        recent.folderUri = uri_1.URI.revive(recent.folderUri);
                    }
                    else {
                        recent.workspace = workspaces_1.reviveWorkspaceIdentifier(recent.workspace);
                    }
                    return recent;
                }));
                case 'removeFromRecentlyOpened': return this.service.removeFromRecentlyOpened(arg.map(uri_1.URI.revive));
                case 'clearRecentlyOpened': return this.service.clearRecentlyOpened();
                case 'newWindowTab': return this.service.newWindowTab();
                case 'showPreviousWindowTab': return this.service.showPreviousWindowTab();
                case 'showNextWindowTab': return this.service.showNextWindowTab();
                case 'moveWindowTabToNewWindow': return this.service.moveWindowTabToNewWindow();
                case 'mergeAllWindowTabs': return this.service.mergeAllWindowTabs();
                case 'toggleWindowTabsBar': return this.service.toggleWindowTabsBar();
                case 'updateTouchBar': return this.service.updateTouchBar(arg[0], arg[1]);
                case 'getRecentlyOpened': return this.service.getRecentlyOpened(arg);
                case 'focusWindow': return this.service.focusWindow(arg);
                case 'closeWindow': return this.service.closeWindow(arg);
                case 'isFocused': return this.service.isFocused(arg);
                case 'isMaximized': return this.service.isMaximized(arg);
                case 'maximizeWindow': return this.service.maximizeWindow(arg);
                case 'unmaximizeWindow': return this.service.unmaximizeWindow(arg);
                case 'minimizeWindow': return this.service.minimizeWindow(arg);
                case 'onWindowTitleDoubleClick': return this.service.onWindowTitleDoubleClick(arg);
                case 'setDocumentEdited': return this.service.setDocumentEdited(arg[0], arg[1]);
                case 'openWindow': {
                    const urisToOpen = arg[1];
                    const options = arg[2];
                    urisToOpen.forEach(r => {
                        if (windows_1.isWorkspaceToOpen(r)) {
                            r.workspaceUri = uri_1.URI.revive(r.workspaceUri);
                        }
                        else if (windows_1.isFolderToOpen(r)) {
                            r.folderUri = uri_1.URI.revive(r.folderUri);
                        }
                        else {
                            r.fileUri = uri_1.URI.revive(r.fileUri);
                        }
                    });
                    options.waitMarkerFileURI = options.waitMarkerFileURI && uri_1.URI.revive(options.waitMarkerFileURI);
                    return this.service.openWindow(arg[0], urisToOpen, options);
                }
                case 'openNewWindow': return this.service.openNewWindow(arg);
                case 'openExtensionDevelopmentHostWindow': return this.service.openExtensionDevelopmentHostWindow(arg[0], arg[1]);
                case 'getWindows': return this.service.getWindows();
                case 'getWindowCount': return this.service.getWindowCount();
                case 'relaunch': return this.service.relaunch(arg[0]);
                case 'whenSharedProcessReady': return this.service.whenSharedProcessReady();
                case 'toggleSharedProcess': return this.service.toggleSharedProcess();
                case 'quit': return this.service.quit();
                case 'log': return this.service.log(arg[0], arg[1]);
                case 'showItemInFolder': return this.service.showItemInFolder(uri_1.URI.revive(arg));
                case 'getActiveWindowId': return this.service.getActiveWindowId();
                case 'openExternal': return this.service.openExternal(arg);
                case 'startCrashReporter': return this.service.startCrashReporter(arg);
                case 'openAboutDialog': return this.service.openAboutDialog();
                case 'resolveProxy': return this.service.resolveProxy(arg[0], arg[1]);
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.WindowsChannel = WindowsChannel;
});
//# sourceMappingURL=windowsIpc.js.map