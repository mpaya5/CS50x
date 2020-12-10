/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "os", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/actions", "vs/base/common/keyCodes", "vs/base/common/platform", "vs/workbench/electron-browser/actions/helpActions", "vs/workbench/electron-browser/actions/developerActions", "vs/workbench/electron-browser/actions/windowActions", "vs/workbench/browser/actions/workspaceActions", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/commands/common/commands", "vs/workbench/browser/actions/workspaceCommands", "vs/workbench/browser/contextkeys", "vs/workbench/common/editor", "vs/platform/windows/common/windows"], function (require, exports, platform_1, nls, os, actions_1, configurationRegistry_1, actions_2, keyCodes_1, platform_2, helpActions_1, developerActions_1, windowActions_1, workspaceActions_1, contextkey_1, keybindingsRegistry_1, commands_1, workspaceCommands_1, contextkeys_1, editor_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Actions
    (function registerActions() {
        const registry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
        // Actions: File
        (function registerFileActions() {
            const fileCategory = nls.localize('file', "File");
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.CloseWorkspaceAction, workspaceActions_1.CloseWorkspaceAction.ID, workspaceActions_1.CloseWorkspaceAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 36 /* KEY_F */) }), 'File: Close Workspace', fileCategory);
        })();
        // Actions: View
        (function registerViewActions() {
            const viewCategory = nls.localize('view', "View");
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.ZoomInAction, windowActions_1.ZoomInAction.ID, windowActions_1.ZoomInAction.LABEL, { primary: 2048 /* CtrlCmd */ | 81 /* US_EQUAL */, secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 81 /* US_EQUAL */, 2048 /* CtrlCmd */ | 104 /* NUMPAD_ADD */] }), 'View: Zoom In', viewCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.ZoomOutAction, windowActions_1.ZoomOutAction.ID, windowActions_1.ZoomOutAction.LABEL, { primary: 2048 /* CtrlCmd */ | 83 /* US_MINUS */, secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 83 /* US_MINUS */, 2048 /* CtrlCmd */ | 106 /* NUMPAD_SUBTRACT */], linux: { primary: 2048 /* CtrlCmd */ | 83 /* US_MINUS */, secondary: [2048 /* CtrlCmd */ | 106 /* NUMPAD_SUBTRACT */] } }), 'View: Zoom Out', viewCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.ZoomResetAction, windowActions_1.ZoomResetAction.ID, windowActions_1.ZoomResetAction.LABEL, { primary: 2048 /* CtrlCmd */ | 93 /* NUMPAD_0 */ }), 'View: Reset Zoom', viewCategory);
        })();
        // Actions: Window
        (function registerWindowActions() {
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.NewWindowAction, windowActions_1.NewWindowAction.ID, windowActions_1.NewWindowAction.LABEL, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 44 /* KEY_N */ }), 'New Window');
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.CloseCurrentWindowAction, windowActions_1.CloseCurrentWindowAction.ID, windowActions_1.CloseCurrentWindowAction.LABEL, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 53 /* KEY_W */ }), 'Close Window');
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.SwitchWindow, windowActions_1.SwitchWindow.ID, windowActions_1.SwitchWindow.LABEL, { primary: 0, mac: { primary: 256 /* WinCtrl */ | 53 /* KEY_W */ } }), 'Switch Window...');
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.QuickSwitchWindow, windowActions_1.QuickSwitchWindow.ID, windowActions_1.QuickSwitchWindow.LABEL), 'Quick Switch Window...');
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: windowActions_1.CloseCurrentWindowAction.ID,
                weight: 200 /* WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(editor_1.NoEditorsVisibleContext, editor_1.SingleEditorGroupsContext),
                primary: 2048 /* CtrlCmd */ | 53 /* KEY_W */,
                handler: accessor => {
                    const windowService = accessor.get(windows_1.IWindowService);
                    windowService.closeWindow();
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: 'workbench.action.quit',
                weight: 200 /* WorkbenchContrib */,
                handler(accessor) {
                    const windowsService = accessor.get(windows_1.IWindowsService);
                    windowsService.quit();
                },
                when: undefined,
                mac: { primary: 2048 /* CtrlCmd */ | 47 /* KEY_Q */ },
                linux: { primary: 2048 /* CtrlCmd */ | 47 /* KEY_Q */ }
            });
        })();
        // Actions: Workspaces
        (function registerWorkspaceActions() {
            const workspacesCategory = nls.localize('workspaces', "Workspaces");
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.AddRootFolderAction, workspaceActions_1.AddRootFolderAction.ID, workspaceActions_1.AddRootFolderAction.LABEL), 'Workspaces: Add Folder to Workspace...', workspacesCategory, contextkeys_1.SupportsWorkspacesContext);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.GlobalRemoveRootFolderAction, workspaceActions_1.GlobalRemoveRootFolderAction.ID, workspaceActions_1.GlobalRemoveRootFolderAction.LABEL), 'Workspaces: Remove Folder from Workspace...', workspacesCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.SaveWorkspaceAsAction, workspaceActions_1.SaveWorkspaceAsAction.ID, workspaceActions_1.SaveWorkspaceAsAction.LABEL), 'Workspaces: Save Workspace As...', workspacesCategory, contextkeys_1.SupportsWorkspacesContext);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.DuplicateWorkspaceInNewWindowAction, workspaceActions_1.DuplicateWorkspaceInNewWindowAction.ID, workspaceActions_1.DuplicateWorkspaceInNewWindowAction.LABEL), 'Workspaces: Duplicate Workspace in New Window', workspacesCategory);
        })();
        // Actions: macOS Native Tabs
        (function registerMacOSNativeTabsActions() {
            if (platform_2.isMacintosh) {
                [
                    { handler: windowActions_1.NewWindowTabHandler, id: 'workbench.action.newWindowTab', title: { value: nls.localize('newTab', "New Window Tab"), original: 'New Window Tab' } },
                    { handler: windowActions_1.ShowPreviousWindowTabHandler, id: 'workbench.action.showPreviousWindowTab', title: { value: nls.localize('showPreviousTab', "Show Previous Window Tab"), original: 'Show Previous Window Tab' } },
                    { handler: windowActions_1.ShowNextWindowTabHandler, id: 'workbench.action.showNextWindowTab', title: { value: nls.localize('showNextWindowTab', "Show Next Window Tab"), original: 'Show Next Window Tab' } },
                    { handler: windowActions_1.MoveWindowTabToNewWindowHandler, id: 'workbench.action.moveWindowTabToNewWindow', title: { value: nls.localize('moveWindowTabToNewWindow', "Move Window Tab to New Window"), original: 'Move Window Tab to New Window' } },
                    { handler: windowActions_1.MergeWindowTabsHandlerHandler, id: 'workbench.action.mergeAllWindowTabs', title: { value: nls.localize('mergeAllWindowTabs', "Merge All Windows"), original: 'Merge All Windows' } },
                    { handler: windowActions_1.ToggleWindowTabsBarHandler, id: 'workbench.action.toggleWindowTabsBar', title: { value: nls.localize('toggleWindowTabsBar', "Toggle Window Tabs Bar"), original: 'Toggle Window Tabs Bar' } }
                ].forEach(command => {
                    commands_1.CommandsRegistry.registerCommand(command.id, command.handler);
                    actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
                        command,
                        when: contextkeys_1.HasMacNativeTabsContext
                    });
                });
            }
        })();
        // Actions: Developer
        (function registerDeveloperActions() {
            const developerCategory = nls.localize('developer', "Developer");
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(developerActions_1.ToggleSharedProcessAction, developerActions_1.ToggleSharedProcessAction.ID, developerActions_1.ToggleSharedProcessAction.LABEL), 'Developer: Toggle Shared Process', developerCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(windowActions_1.ReloadWindowWithExtensionsDisabledAction, windowActions_1.ReloadWindowWithExtensionsDisabledAction.ID, windowActions_1.ReloadWindowWithExtensionsDisabledAction.LABEL), 'Developer: Reload Window With Extensions Disabled', developerCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(developerActions_1.ToggleDevToolsAction, developerActions_1.ToggleDevToolsAction.ID, developerActions_1.ToggleDevToolsAction.LABEL), 'Developer: Toggle Developer Tools', developerCategory);
            keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
                id: developerActions_1.ToggleDevToolsAction.ID,
                weight: 200 /* WorkbenchContrib */ + 50,
                when: contextkeys_1.IsDevelopmentContext,
                primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 39 /* KEY_I */,
                mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 39 /* KEY_I */ }
            });
        })();
        // Actions: help
        (function registerHelpActions() {
            const helpCategory = nls.localize('help', "Help");
            if (helpActions_1.KeybindingsReferenceAction.AVAILABLE) {
                registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.KeybindingsReferenceAction, helpActions_1.KeybindingsReferenceAction.ID, helpActions_1.KeybindingsReferenceAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 48 /* KEY_R */) }), 'Help: Keyboard Shortcuts Reference', helpCategory);
            }
            if (helpActions_1.OpenDocumentationUrlAction.AVAILABLE) {
                registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.OpenDocumentationUrlAction, helpActions_1.OpenDocumentationUrlAction.ID, helpActions_1.OpenDocumentationUrlAction.LABEL), 'Help: Documentation', helpCategory);
            }
            if (helpActions_1.OpenIntroductoryVideosUrlAction.AVAILABLE) {
                registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.OpenIntroductoryVideosUrlAction, helpActions_1.OpenIntroductoryVideosUrlAction.ID, helpActions_1.OpenIntroductoryVideosUrlAction.LABEL), 'Help: Introductory Videos', helpCategory);
            }
            if (helpActions_1.OpenTipsAndTricksUrlAction.AVAILABLE) {
                registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.OpenTipsAndTricksUrlAction, helpActions_1.OpenTipsAndTricksUrlAction.ID, helpActions_1.OpenTipsAndTricksUrlAction.LABEL), 'Help: Tips and Tricks', helpCategory);
            }
            if (helpActions_1.OpenNewsletterSignupUrlAction.AVAILABLE) {
                registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.OpenNewsletterSignupUrlAction, helpActions_1.OpenNewsletterSignupUrlAction.ID, helpActions_1.OpenNewsletterSignupUrlAction.LABEL), 'Help: Tips and Tricks', helpCategory);
            }
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.OpenTwitterUrlAction, helpActions_1.OpenTwitterUrlAction.ID, helpActions_1.OpenTwitterUrlAction.LABEL), 'Help: Join Us on Twitter', helpCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.OpenRequestFeatureUrlAction, helpActions_1.OpenRequestFeatureUrlAction.ID, helpActions_1.OpenRequestFeatureUrlAction.LABEL), 'Help: Search Feature Requests', helpCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.OpenLicenseUrlAction, helpActions_1.OpenLicenseUrlAction.ID, helpActions_1.OpenLicenseUrlAction.LABEL), 'Help: View License', helpCategory);
            registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(helpActions_1.OpenPrivacyStatementUrlAction, helpActions_1.OpenPrivacyStatementUrlAction.ID, helpActions_1.OpenPrivacyStatementUrlAction.LABEL), 'Help: Privacy Statement', helpCategory);
        })();
    })();
    // Menu
    (function registerMenu() {
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '1_new',
            command: {
                id: windowActions_1.NewWindowAction.ID,
                title: nls.localize({ key: 'miNewWindow', comment: ['&& denotes a mnemonic'] }, "New &&Window")
            },
            order: 2
        });
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '3_workspace',
            command: {
                id: workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID,
                title: nls.localize({ key: 'miAddFolderToWorkspace', comment: ['&& denotes a mnemonic'] }, "A&&dd Folder to Workspace...")
            },
            order: 1,
            when: contextkeys_1.SupportsWorkspacesContext
        });
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '3_workspace',
            command: {
                id: workspaceActions_1.SaveWorkspaceAsAction.ID,
                title: nls.localize('miSaveWorkspaceAs', "Save Workspace As...")
            },
            order: 2,
            when: contextkeys_1.SupportsWorkspacesContext
        });
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '6_close',
            command: {
                id: workspaceActions_1.CloseWorkspaceAction.ID,
                title: nls.localize({ key: 'miCloseFolder', comment: ['&& denotes a mnemonic'] }, "Close &&Folder"),
                precondition: contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0')
            },
            order: 3,
            when: contextkeys_1.WorkbenchStateContext.notEqualsTo('workspace')
        });
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '6_close',
            command: {
                id: workspaceActions_1.CloseWorkspaceAction.ID,
                title: nls.localize({ key: 'miCloseWorkspace', comment: ['&& denotes a mnemonic'] }, "Close &&Workspace")
            },
            order: 3,
            when: contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')
        });
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '6_close',
            command: {
                id: windowActions_1.CloseCurrentWindowAction.ID,
                title: nls.localize({ key: 'miCloseWindow', comment: ['&& denotes a mnemonic'] }, "Clos&&e Window")
            },
            order: 4
        });
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: 'z_Exit',
            command: {
                id: 'workbench.action.quit',
                title: nls.localize({ key: 'miExit', comment: ['&& denotes a mnemonic'] }, "E&&xit")
            },
            order: 1,
            when: contextkeys_1.IsMacContext.toNegated()
        });
        // Zoom
        actions_1.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
            group: '3_zoom',
            command: {
                id: windowActions_1.ZoomInAction.ID,
                title: nls.localize({ key: 'miZoomIn', comment: ['&& denotes a mnemonic'] }, "&&Zoom In")
            },
            order: 1
        });
        actions_1.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
            group: '3_zoom',
            command: {
                id: windowActions_1.ZoomOutAction.ID,
                title: nls.localize({ key: 'miZoomOut', comment: ['&& denotes a mnemonic'] }, "&&Zoom Out")
            },
            order: 2
        });
        actions_1.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
            group: '3_zoom',
            command: {
                id: windowActions_1.ZoomResetAction.ID,
                title: nls.localize({ key: 'miZoomReset', comment: ['&& denotes a mnemonic'] }, "&&Reset Zoom")
            },
            order: 3
        });
        // Help
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '1_welcome',
            command: {
                id: helpActions_1.OpenDocumentationUrlAction.ID,
                title: nls.localize({ key: 'miDocumentation', comment: ['&& denotes a mnemonic'] }, "&&Documentation")
            },
            order: 3
        });
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '1_welcome',
            command: {
                id: 'update.showCurrentReleaseNotes',
                title: nls.localize({ key: 'miReleaseNotes', comment: ['&& denotes a mnemonic'] }, "&&Release Notes")
            },
            order: 4
        });
        // Reference
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '2_reference',
            command: {
                id: helpActions_1.KeybindingsReferenceAction.ID,
                title: nls.localize({ key: 'miKeyboardShortcuts', comment: ['&& denotes a mnemonic'] }, "&&Keyboard Shortcuts Reference")
            },
            order: 1
        });
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '2_reference',
            command: {
                id: helpActions_1.OpenIntroductoryVideosUrlAction.ID,
                title: nls.localize({ key: 'miIntroductoryVideos', comment: ['&& denotes a mnemonic'] }, "Introductory &&Videos")
            },
            order: 2
        });
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '2_reference',
            command: {
                id: helpActions_1.OpenTipsAndTricksUrlAction.ID,
                title: nls.localize({ key: 'miTipsAndTricks', comment: ['&& denotes a mnemonic'] }, "Tips and Tri&&cks")
            },
            order: 3
        });
        // Feedback
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '3_feedback',
            command: {
                id: helpActions_1.OpenTwitterUrlAction.ID,
                title: nls.localize({ key: 'miTwitter', comment: ['&& denotes a mnemonic'] }, "&&Join Us on Twitter")
            },
            order: 1
        });
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '3_feedback',
            command: {
                id: helpActions_1.OpenRequestFeatureUrlAction.ID,
                title: nls.localize({ key: 'miUserVoice', comment: ['&& denotes a mnemonic'] }, "&&Search Feature Requests")
            },
            order: 2
        });
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '3_feedback',
            command: {
                id: 'workbench.action.openIssueReporter',
                title: nls.localize({ key: 'miReportIssue', comment: ['&& denotes a mnemonic', 'Translate this to "Report Issue in English" in all languages please!'] }, "Report &&Issue")
            },
            order: 3
        });
        // Legal
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '4_legal',
            command: {
                id: helpActions_1.OpenLicenseUrlAction.ID,
                title: nls.localize({ key: 'miLicense', comment: ['&& denotes a mnemonic'] }, "View &&License")
            },
            order: 1
        });
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '4_legal',
            command: {
                id: helpActions_1.OpenPrivacyStatementUrlAction.ID,
                title: nls.localize({ key: 'miPrivacyStatement', comment: ['&& denotes a mnemonic'] }, "Privac&&y Statement")
            },
            order: 2
        });
        // Tools
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '5_tools',
            command: {
                id: developerActions_1.ToggleDevToolsAction.ID,
                title: nls.localize({ key: 'miToggleDevTools', comment: ['&& denotes a mnemonic'] }, "&&Toggle Developer Tools")
            },
            order: 1
        });
        actions_1.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
            group: '5_tools',
            command: {
                id: 'workbench.action.openProcessExplorer',
                title: nls.localize({ key: 'miOpenProcessExplorerer', comment: ['&& denotes a mnemonic'] }, "Open &&Process Explorer")
            },
            order: 2
        });
    })();
    // Configuration
    (function registerConfiguration() {
        const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        // Window
        registry.registerConfiguration({
            'id': 'window',
            'order': 8,
            'title': nls.localize('windowConfigurationTitle', "Window"),
            'type': 'object',
            'properties': {
                'window.openFilesInNewWindow': {
                    'type': 'string',
                    'enum': ['on', 'off', 'default'],
                    'enumDescriptions': [
                        nls.localize('window.openFilesInNewWindow.on', "Files will open in a new window."),
                        nls.localize('window.openFilesInNewWindow.off', "Files will open in the window with the files' folder open or the last active window."),
                        platform_2.isMacintosh ?
                            nls.localize('window.openFilesInNewWindow.defaultMac', "Files will open in the window with the files' folder open or the last active window unless opened via the Dock or from Finder.") :
                            nls.localize('window.openFilesInNewWindow.default', "Files will open in a new window unless picked from within the application (e.g. via the File menu).")
                    ],
                    'default': 'off',
                    'scope': 1 /* APPLICATION */,
                    'markdownDescription': platform_2.isMacintosh ?
                        nls.localize('openFilesInNewWindowMac', "Controls whether files should open in a new window. \nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).") :
                        nls.localize('openFilesInNewWindow', "Controls whether files should open in a new window.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).")
                },
                'window.openWithoutArgumentsInNewWindow': {
                    'type': 'string',
                    'enum': ['on', 'off'],
                    'enumDescriptions': [
                        nls.localize('window.openWithoutArgumentsInNewWindow.on', "Open a new empty window."),
                        nls.localize('window.openWithoutArgumentsInNewWindow.off', "Focus the last active running instance.")
                    ],
                    'default': platform_2.isMacintosh ? 'off' : 'on',
                    'scope': 1 /* APPLICATION */,
                    'markdownDescription': nls.localize('openWithoutArgumentsInNewWindow', "Controls whether a new empty window should open when starting a second instance without arguments or if the last running instance should get focus.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).")
                },
                'window.restoreWindows': {
                    'type': 'string',
                    'enum': ['all', 'folders', 'one', 'none'],
                    'enumDescriptions': [
                        nls.localize('window.reopenFolders.all', "Reopen all windows."),
                        nls.localize('window.reopenFolders.folders', "Reopen all folders. Empty workspaces will not be restored."),
                        nls.localize('window.reopenFolders.one', "Reopen the last active window."),
                        nls.localize('window.reopenFolders.none', "Never reopen a window. Always start with an empty one.")
                    ],
                    'default': 'one',
                    'scope': 1 /* APPLICATION */,
                    'description': nls.localize('restoreWindows', "Controls how windows are being reopened after a restart.")
                },
                'window.restoreFullscreen': {
                    'type': 'boolean',
                    'default': false,
                    'scope': 1 /* APPLICATION */,
                    'description': nls.localize('restoreFullscreen', "Controls whether a window should restore to full screen mode if it was exited in full screen mode.")
                },
                'window.zoomLevel': {
                    'type': 'number',
                    'default': 0,
                    'description': nls.localize('zoomLevel', "Adjust the zoom level of the window. The original size is 0 and each increment above (e.g. 1) or below (e.g. -1) represents zooming 20% larger or smaller. You can also enter decimals to adjust the zoom level with a finer granularity.")
                },
                'window.newWindowDimensions': {
                    'type': 'string',
                    'enum': ['default', 'inherit', 'maximized', 'fullscreen'],
                    'enumDescriptions': [
                        nls.localize('window.newWindowDimensions.default', "Open new windows in the center of the screen."),
                        nls.localize('window.newWindowDimensions.inherit', "Open new windows with same dimension as last active one."),
                        nls.localize('window.newWindowDimensions.maximized', "Open new windows maximized."),
                        nls.localize('window.newWindowDimensions.fullscreen', "Open new windows in full screen mode.")
                    ],
                    'default': 'default',
                    'scope': 1 /* APPLICATION */,
                    'description': nls.localize('newWindowDimensions', "Controls the dimensions of opening a new window when at least one window is already opened. Note that this setting does not have an impact on the first window that is opened. The first window will always restore the size and location as you left it before closing.")
                },
                'window.closeWhenEmpty': {
                    'type': 'boolean',
                    'default': false,
                    'description': nls.localize('closeWhenEmpty', "Controls whether closing the last editor should also close the window. This setting only applies for windows that do not show folders.")
                },
                'window.autoDetectHighContrast': {
                    'type': 'boolean',
                    'default': true,
                    'description': nls.localize('autoDetectHighContrast', "If enabled, will automatically change to high contrast theme if Windows is using a high contrast theme, and to dark theme when switching away from a Windows high contrast theme."),
                    'scope': 1 /* APPLICATION */,
                    'included': platform_2.isWindows
                },
                'window.doubleClickIconToClose': {
                    'type': 'boolean',
                    'default': false,
                    'scope': 1 /* APPLICATION */,
                    'markdownDescription': nls.localize('window.doubleClickIconToClose', "If enabled, double clicking the application icon in the title bar will close the window and the window cannot be dragged by the icon. This setting only has an effect when `#window.titleBarStyle#` is set to `custom`.")
                },
                'window.titleBarStyle': {
                    'type': 'string',
                    'enum': ['native', 'custom'],
                    'default': platform_2.isLinux ? 'native' : 'custom',
                    'scope': 1 /* APPLICATION */,
                    'description': nls.localize('titleBarStyle', "Adjust the appearance of the window title bar. On Linux and Windows, this setting also affects the application and context menu appearances. Changes require a full restart to apply.")
                },
                'window.nativeTabs': {
                    'type': 'boolean',
                    'default': false,
                    'scope': 1 /* APPLICATION */,
                    'description': nls.localize('window.nativeTabs', "Enables macOS Sierra window tabs. Note that changes require a full restart to apply and that native tabs will disable a custom title bar style if configured."),
                    'included': platform_2.isMacintosh && parseFloat(os.release()) >= 16 // Minimum: macOS Sierra (10.12.x = darwin 16.x)
                },
                'window.nativeFullScreen': {
                    'type': 'boolean',
                    'default': true,
                    'description': nls.localize('window.nativeFullScreen', "Controls if native full-screen should be used on macOS. Disable this option to prevent macOS from creating a new space when going full-screen."),
                    'scope': 1 /* APPLICATION */,
                    'included': platform_2.isMacintosh
                },
                'window.clickThroughInactive': {
                    'type': 'boolean',
                    'default': true,
                    'scope': 1 /* APPLICATION */,
                    'description': nls.localize('window.clickThroughInactive', "If enabled, clicking on an inactive window will both activate the window and trigger the element under the mouse if it is clickable. If disabled, clicking anywhere on an inactive window will activate it only and a second click is required on the element."),
                    'included': platform_2.isMacintosh
                }
            }
        });
        // Telemetry
        registry.registerConfiguration({
            'id': 'telemetry',
            'order': 110,
            title: nls.localize('telemetryConfigurationTitle', "Telemetry"),
            'type': 'object',
            'properties': {
                'telemetry.enableCrashReporter': {
                    'type': 'boolean',
                    'description': nls.localize('telemetry.enableCrashReporting', "Enable crash reports to be sent to a Microsoft online service. \nThis option requires restart to take effect."),
                    'default': true,
                    'tags': ['usesOnlineServices']
                }
            }
        });
    })();
});
//# sourceMappingURL=desktop.contribution.js.map