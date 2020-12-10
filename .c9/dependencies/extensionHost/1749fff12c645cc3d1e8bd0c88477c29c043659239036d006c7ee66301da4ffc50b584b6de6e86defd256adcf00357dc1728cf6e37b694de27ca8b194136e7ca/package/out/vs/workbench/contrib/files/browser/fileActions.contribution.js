/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/contrib/files/browser/fileActions", "vs/workbench/contrib/files/browser/saveErrorHandler", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/base/common/keyCodes", "vs/workbench/contrib/files/browser/fileCommands", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/common/platform", "vs/workbench/contrib/files/common/files", "vs/workbench/browser/actions/workspaceCommands", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/common/resources", "vs/platform/list/browser/listService", "vs/base/common/uri", "vs/base/common/network", "vs/workbench/browser/contextkeys", "vs/workbench/browser/actions/workspaceActions"], function (require, exports, nls, platform_1, fileActions_1, saveErrorHandler_1, actions_1, actions_2, keyCodes_1, fileCommands_1, commands_1, contextkey_1, keybindingsRegistry_1, platform_2, files_1, workspaceCommands_1, editorCommands_1, textfiles_1, resources_1, listService_1, uri_1, network_1, contextkeys_1, workspaceActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Contribute Global Actions
    const category = { value: nls.localize('filesCategory', "File"), original: 'File' };
    const registry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.SaveAllAction, fileActions_1.SaveAllAction.ID, fileActions_1.SaveAllAction.LABEL, { primary: undefined, mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 49 /* KEY_S */ }, win: { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 49 /* KEY_S */) } }), 'File: Save All', category.value);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.GlobalCompareResourcesAction, fileActions_1.GlobalCompareResourcesAction.ID, fileActions_1.GlobalCompareResourcesAction.LABEL), 'File: Compare Active File With...', category.value);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.FocusFilesExplorer, fileActions_1.FocusFilesExplorer.ID, fileActions_1.FocusFilesExplorer.LABEL), 'File: Focus on Files Explorer', category.value);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.ShowActiveFileInExplorer, fileActions_1.ShowActiveFileInExplorer.ID, fileActions_1.ShowActiveFileInExplorer.LABEL), 'File: Reveal Active File in Side Bar', category.value);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.CollapseExplorerView, fileActions_1.CollapseExplorerView.ID, fileActions_1.CollapseExplorerView.LABEL), 'File: Collapse Folders in Explorer', category.value);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.RefreshExplorerView, fileActions_1.RefreshExplorerView.ID, fileActions_1.RefreshExplorerView.LABEL), 'File: Refresh Explorer', category.value);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.GlobalNewUntitledFileAction, fileActions_1.GlobalNewUntitledFileAction.ID, fileActions_1.GlobalNewUntitledFileAction.LABEL, { primary: 2048 /* CtrlCmd */ | 44 /* KEY_N */ }), 'File: New Untitled File', category.value);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.ShowOpenedFileInNewWindow, fileActions_1.ShowOpenedFileInNewWindow.ID, fileActions_1.ShowOpenedFileInNewWindow.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 45 /* KEY_O */) }), 'File: Open Active File in New Window', category.value);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.CompareWithClipboardAction, fileActions_1.CompareWithClipboardAction.ID, fileActions_1.CompareWithClipboardAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 33 /* KEY_C */) }), 'File: Compare Active File with Clipboard', category.value);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.ToggleAutoSaveAction, fileActions_1.ToggleAutoSaveAction.ID, fileActions_1.ToggleAutoSaveAction.LABEL), 'File: Toggle Auto Save', category.value);
    const fileCategory = nls.localize('file', "File");
    if (platform_2.isMacintosh) {
        registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.OpenFileFolderAction, workspaceActions_1.OpenFileFolderAction.ID, workspaceActions_1.OpenFileFolderAction.LABEL, { primary: 2048 /* CtrlCmd */ | 45 /* KEY_O */ }), 'File: Open...', fileCategory);
        if (!platform_2.isWeb) {
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: workspaceActions_1.OpenLocalFileFolderCommand.ID,
                weight: 200 /* WorkbenchContrib */,
                primary: 2048 /* CtrlCmd */ | 45 /* KEY_O */,
                when: contextkeys_1.RemoteFileDialogContext,
                description: { description: workspaceActions_1.OpenLocalFileFolderCommand.LABEL, args: [] },
                handler: workspaceActions_1.OpenLocalFileFolderCommand.handler()
            });
        }
    }
    else {
        registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.OpenFileAction, workspaceActions_1.OpenFileAction.ID, workspaceActions_1.OpenFileAction.LABEL, { primary: 2048 /* CtrlCmd */ | 45 /* KEY_O */ }), 'File: Open File...', fileCategory);
        registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.OpenFolderAction, workspaceActions_1.OpenFolderAction.ID, workspaceActions_1.OpenFolderAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 45 /* KEY_O */) }), 'File: Open Folder...', fileCategory);
        if (!platform_2.isWeb) {
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: workspaceActions_1.OpenLocalFileCommand.ID,
                weight: 200 /* WorkbenchContrib */,
                primary: 2048 /* CtrlCmd */ | 45 /* KEY_O */,
                when: contextkeys_1.RemoteFileDialogContext,
                description: { description: workspaceActions_1.OpenLocalFileCommand.LABEL, args: [] },
                handler: workspaceActions_1.OpenLocalFileCommand.handler()
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: workspaceActions_1.OpenLocalFolderCommand.ID,
                weight: 200 /* WorkbenchContrib */,
                primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 45 /* KEY_O */),
                when: contextkeys_1.RemoteFileDialogContext,
                description: { description: workspaceActions_1.OpenLocalFolderCommand.LABEL, args: [] },
                handler: workspaceActions_1.OpenLocalFolderCommand.handler()
            });
        }
    }
    if (!platform_2.isWeb) {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: workspaceActions_1.SaveLocalFileCommand.ID,
            weight: 200 /* WorkbenchContrib */,
            primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 49 /* KEY_S */,
            when: contextkeys_1.RemoteFileDialogContext,
            description: { description: workspaceActions_1.SaveLocalFileCommand.LABEL, args: [] },
            handler: workspaceActions_1.SaveLocalFileCommand.handler()
        });
    }
    const workspacesCategory = nls.localize('workspaces', "Workspaces");
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(workspaceActions_1.OpenWorkspaceAction, workspaceActions_1.OpenWorkspaceAction.ID, workspaceActions_1.OpenWorkspaceAction.LABEL), 'Workspaces: Open Workspace...', workspacesCategory, contextkeys_1.SupportsWorkspacesContext);
    // Commands
    commands_1.CommandsRegistry.registerCommand('_files.windowOpen', fileCommands_1.openWindowCommand);
    commands_1.CommandsRegistry.registerCommand('_files.newWindow', fileCommands_1.newWindowCommand);
    const explorerCommandsWeightBonus = 10; // give our commands a little bit more weight over other default list/tree commands
    const RENAME_ID = 'renameFile';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: RENAME_ID,
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceNotReadonlyContext),
        primary: 60 /* F2 */,
        mac: {
            primary: 3 /* Enter */
        },
        handler: fileActions_1.renameHandler
    });
    const MOVE_FILE_TO_TRASH_ID = 'moveFileToTrash';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: MOVE_FILE_TO_TRASH_ID,
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceNotReadonlyContext, files_1.ExplorerResourceMoveableToTrash),
        primary: 20 /* Delete */,
        mac: {
            primary: 2048 /* CtrlCmd */ | 1 /* Backspace */
        },
        handler: fileActions_1.moveFileToTrashHandler
    });
    const DELETE_FILE_ID = 'deleteFile';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: DELETE_FILE_ID,
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceNotReadonlyContext),
        primary: 1024 /* Shift */ | 20 /* Delete */,
        mac: {
            primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 1 /* Backspace */
        },
        handler: fileActions_1.deleteFileHandler
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: DELETE_FILE_ID,
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceNotReadonlyContext, files_1.ExplorerResourceMoveableToTrash.toNegated()),
        primary: 20 /* Delete */,
        mac: {
            primary: 2048 /* CtrlCmd */ | 1 /* Backspace */
        },
        handler: fileActions_1.deleteFileHandler
    });
    const CUT_FILE_ID = 'filesExplorer.cut';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: CUT_FILE_ID,
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated()),
        primary: 2048 /* CtrlCmd */ | 54 /* KEY_X */,
        handler: fileActions_1.cutFileHandler,
    });
    const COPY_FILE_ID = 'filesExplorer.copy';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: COPY_FILE_ID,
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated()),
        primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
        handler: fileActions_1.copyFileHandler,
    });
    const PASTE_FILE_ID = 'filesExplorer.paste';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: PASTE_FILE_ID,
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext),
        primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */,
        handler: fileActions_1.pasteFileHandler
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'filesExplorer.cancelCut',
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceCut),
        primary: 9 /* Escape */,
        handler: (accessor) => {
            const explorerService = accessor.get(files_1.IExplorerService);
            explorerService.setToCopy([], true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'filesExplorer.openFilePreserveFocus',
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerFolderContext.toNegated()),
        primary: 10 /* Space */,
        handler: fileActions_1.openFilePreserveFocusHandler
    });
    const copyPathCommand = {
        id: fileCommands_1.COPY_PATH_COMMAND_ID,
        title: nls.localize('copyPath', "Copy Path")
    };
    const copyRelativePathCommand = {
        id: fileCommands_1.COPY_RELATIVE_PATH_COMMAND_ID,
        title: nls.localize('copyRelativePath', "Copy Relative Path")
    };
    // Editor Title Context Menu
    appendEditorTitleContextMenuItem(fileCommands_1.COPY_PATH_COMMAND_ID, copyPathCommand.title, resources_1.ResourceContextKey.IsFileSystemResource, '1_cutcopypaste');
    appendEditorTitleContextMenuItem(fileCommands_1.COPY_RELATIVE_PATH_COMMAND_ID, copyRelativePathCommand.title, resources_1.ResourceContextKey.IsFileSystemResource, '1_cutcopypaste');
    appendEditorTitleContextMenuItem(fileCommands_1.REVEAL_IN_OS_COMMAND_ID, fileCommands_1.REVEAL_IN_OS_LABEL, resources_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.file));
    appendEditorTitleContextMenuItem(fileCommands_1.REVEAL_IN_OS_COMMAND_ID, fileCommands_1.REVEAL_IN_OS_LABEL, contextkey_1.ContextKeyExpr.and(contextkeys_1.IsWebContext.toNegated(), resources_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.userData)));
    appendEditorTitleContextMenuItem(fileCommands_1.REVEAL_IN_EXPLORER_COMMAND_ID, nls.localize('revealInSideBar', "Reveal in Side Bar"), resources_1.ResourceContextKey.IsFileSystemResource);
    function appendEditorTitleContextMenuItem(id, title, when, group) {
        // Menu
        actions_1.MenuRegistry.appendMenuItem(9 /* EditorTitleContext */, {
            command: { id, title },
            when,
            group: group || '2_files'
        });
    }
    // Editor Title Menu for Conflict Resolution
    appendSaveConflictEditorTitleAction('workbench.files.action.acceptLocalChanges', nls.localize('acceptLocalChanges', "Use your changes and overwrite file contents"), {
        light: uri_1.URI.parse(require.toUrl(`vs/workbench/contrib/files/browser/media/check-light.svg`)),
        dark: uri_1.URI.parse(require.toUrl(`vs/workbench/contrib/files/browser/media/check-dark.svg`))
    }, -10, saveErrorHandler_1.acceptLocalChangesCommand);
    appendSaveConflictEditorTitleAction('workbench.files.action.revertLocalChanges', nls.localize('revertLocalChanges', "Discard your changes and revert to file contents"), {
        light: uri_1.URI.parse(require.toUrl(`vs/workbench/contrib/files/browser/media/undo-light.svg`)),
        dark: uri_1.URI.parse(require.toUrl(`vs/workbench/contrib/files/browser/media/undo-dark.svg`))
    }, -9, saveErrorHandler_1.revertLocalChangesCommand);
    function appendSaveConflictEditorTitleAction(id, title, iconLocation, order, command) {
        // Command
        commands_1.CommandsRegistry.registerCommand(id, command);
        // Action
        actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
            command: { id, title, iconLocation },
            when: contextkey_1.ContextKeyExpr.equals(saveErrorHandler_1.CONFLICT_RESOLUTION_CONTEXT, true),
            group: 'navigation',
            order
        });
    }
    // Menu registration - command palette
    function appendToCommandPalette(id, title, category, when) {
        actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
            command: {
                id,
                title,
                category
            },
            when
        });
    }
    const downloadLabel = nls.localize('download', "Download");
    appendToCommandPalette(fileCommands_1.COPY_PATH_COMMAND_ID, { value: nls.localize('copyPathOfActive', "Copy Path of Active File"), original: 'Copy Path of Active File' }, category);
    appendToCommandPalette(fileCommands_1.COPY_RELATIVE_PATH_COMMAND_ID, { value: nls.localize('copyRelativePathOfActive', "Copy Relative Path of Active File"), original: 'Copy Relative Path of Active File' }, category);
    appendToCommandPalette(fileCommands_1.SAVE_FILE_COMMAND_ID, { value: fileCommands_1.SAVE_FILE_LABEL, original: 'Save' }, category);
    appendToCommandPalette(fileCommands_1.SAVE_FILE_WITHOUT_FORMATTING_COMMAND_ID, { value: fileCommands_1.SAVE_FILE_WITHOUT_FORMATTING_LABEL, original: 'Save without Formatting' }, category);
    appendToCommandPalette(fileCommands_1.SAVE_ALL_IN_GROUP_COMMAND_ID, { value: nls.localize('saveAllInGroup', "Save All in Group"), original: 'Save All in Group' }, category);
    appendToCommandPalette(fileCommands_1.SAVE_FILES_COMMAND_ID, { value: nls.localize('saveFiles', "Save All Files"), original: 'Save All Files' }, category);
    appendToCommandPalette(fileCommands_1.REVERT_FILE_COMMAND_ID, { value: nls.localize('revert', "Revert File"), original: 'Revert File' }, category);
    appendToCommandPalette(fileCommands_1.COMPARE_WITH_SAVED_COMMAND_ID, { value: nls.localize('compareActiveWithSaved', "Compare Active File with Saved"), original: 'Compare Active File with Saved' }, category);
    appendToCommandPalette(fileCommands_1.REVEAL_IN_OS_COMMAND_ID, { value: fileCommands_1.REVEAL_IN_OS_LABEL, original: platform_2.isWindows ? 'Reveal in Explorer' : platform_2.isMacintosh ? 'Reveal in Finder' : 'Open Containing Folder' }, category);
    appendToCommandPalette(fileCommands_1.SAVE_FILE_AS_COMMAND_ID, { value: fileCommands_1.SAVE_FILE_AS_LABEL, original: 'Save As...' }, category);
    appendToCommandPalette(editorCommands_1.CLOSE_EDITOR_COMMAND_ID, { value: nls.localize('closeEditor', "Close Editor"), original: 'Close Editor' }, { value: nls.localize('view', "View"), original: 'View' });
    appendToCommandPalette(fileActions_1.NEW_FILE_COMMAND_ID, { value: fileActions_1.NEW_FILE_LABEL, original: 'New File' }, category, contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'));
    appendToCommandPalette(fileActions_1.NEW_FOLDER_COMMAND_ID, { value: fileActions_1.NEW_FOLDER_LABEL, original: 'New Folder' }, category, contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'));
    appendToCommandPalette(fileActions_1.DOWNLOAD_COMMAND_ID, { value: downloadLabel, original: 'Download' }, category, contextkey_1.ContextKeyExpr.and(contextkeys_1.IsWebContext.toNegated(), resources_1.ResourceContextKey.Scheme.notEqualsTo(network_1.Schemas.file)));
    // Menu registration - open editors
    const openToSideCommand = {
        id: fileCommands_1.OPEN_TO_SIDE_COMMAND_ID,
        title: nls.localize('openToSide', "Open to the Side")
    };
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: 'navigation',
        order: 10,
        command: openToSideCommand,
        when: resources_1.ResourceContextKey.IsFileSystemResource
    });
    const revealInOsCommand = {
        id: fileCommands_1.REVEAL_IN_OS_COMMAND_ID,
        title: platform_2.isWindows ? nls.localize('revealInWindows', "Reveal in Explorer") : platform_2.isMacintosh ? nls.localize('revealInMac', "Reveal in Finder") : nls.localize('openContainer', "Open Containing Folder")
    };
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: 'navigation',
        order: 20,
        command: revealInOsCommand,
        when: resources_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: '1_cutcopypaste',
        order: 10,
        command: copyPathCommand,
        when: resources_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: '1_cutcopypaste',
        order: 20,
        command: copyRelativePathCommand,
        when: resources_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: '2_save',
        order: 10,
        command: {
            id: fileCommands_1.SAVE_FILE_COMMAND_ID,
            title: fileCommands_1.SAVE_FILE_LABEL,
            precondition: fileCommands_1.DirtyEditorContext
        },
        when: contextkey_1.ContextKeyExpr.and(resources_1.ResourceContextKey.IsFileSystemResource, textfiles_1.AutoSaveContext.notEqualsTo('afterDelay') && textfiles_1.AutoSaveContext.notEqualsTo(''))
    });
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: '2_save',
        order: 20,
        command: {
            id: fileCommands_1.REVERT_FILE_COMMAND_ID,
            title: nls.localize('revert', "Revert File"),
            precondition: fileCommands_1.DirtyEditorContext
        },
        when: contextkey_1.ContextKeyExpr.and(resources_1.ResourceContextKey.IsFileSystemResource, textfiles_1.AutoSaveContext.notEqualsTo('afterDelay') && textfiles_1.AutoSaveContext.notEqualsTo(''))
    });
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: '2_save',
        command: {
            id: fileCommands_1.SAVE_FILE_AS_COMMAND_ID,
            title: fileCommands_1.SAVE_FILE_AS_LABEL
        },
        when: resources_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.untitled)
    });
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: '2_save',
        command: {
            id: fileCommands_1.SAVE_ALL_IN_GROUP_COMMAND_ID,
            title: nls.localize('saveAll', "Save All")
        },
        when: contextkey_1.ContextKeyExpr.and(fileCommands_1.OpenEditorsGroupContext, textfiles_1.AutoSaveContext.notEqualsTo('afterDelay') && textfiles_1.AutoSaveContext.notEqualsTo(''))
    });
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: '3_compare',
        order: 10,
        command: {
            id: fileCommands_1.COMPARE_WITH_SAVED_COMMAND_ID,
            title: nls.localize('compareWithSaved', "Compare with Saved"),
            precondition: fileCommands_1.DirtyEditorContext
        },
        when: contextkey_1.ContextKeyExpr.and(resources_1.ResourceContextKey.IsFileSystemResource, textfiles_1.AutoSaveContext.notEqualsTo('afterDelay') && textfiles_1.AutoSaveContext.notEqualsTo(''), listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    const compareResourceCommand = {
        id: fileCommands_1.COMPARE_RESOURCE_COMMAND_ID,
        title: nls.localize('compareWithSelected', "Compare with Selected")
    };
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: '3_compare',
        order: 20,
        command: compareResourceCommand,
        when: contextkey_1.ContextKeyExpr.and(resources_1.ResourceContextKey.HasResource, fileCommands_1.ResourceSelectedForCompareContext, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    const selectForCompareCommand = {
        id: fileCommands_1.SELECT_FOR_COMPARE_COMMAND_ID,
        title: nls.localize('compareSource', "Select for Compare")
    };
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: '3_compare',
        order: 30,
        command: selectForCompareCommand,
        when: contextkey_1.ContextKeyExpr.and(resources_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    const compareSelectedCommand = {
        id: fileCommands_1.COMPARE_SELECTED_COMMAND_ID,
        title: nls.localize('compareSelected', "Compare Selected")
    };
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: '3_compare',
        order: 30,
        command: compareSelectedCommand,
        when: contextkey_1.ContextKeyExpr.and(resources_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection)
    });
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: '4_close',
        order: 10,
        command: {
            id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
            title: nls.localize('close', "Close")
        },
        when: fileCommands_1.OpenEditorsGroupContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: '4_close',
        order: 20,
        command: {
            id: editorCommands_1.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID,
            title: nls.localize('closeOthers', "Close Others")
        },
        when: fileCommands_1.OpenEditorsGroupContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: '4_close',
        order: 30,
        command: {
            id: editorCommands_1.CLOSE_SAVED_EDITORS_COMMAND_ID,
            title: nls.localize('closeSaved', "Close Saved")
        }
    });
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: '4_close',
        order: 40,
        command: {
            id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
            title: nls.localize('closeAll', "Close All")
        }
    });
    // Menu registration - explorer
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: 'navigation',
        order: 4,
        command: {
            id: fileActions_1.NEW_FILE_COMMAND_ID,
            title: fileActions_1.NEW_FILE_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: files_1.ExplorerFolderContext
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: 'navigation',
        order: 6,
        command: {
            id: fileActions_1.NEW_FOLDER_COMMAND_ID,
            title: fileActions_1.NEW_FOLDER_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: files_1.ExplorerFolderContext
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: 'navigation',
        order: 10,
        command: openToSideCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), resources_1.ResourceContextKey.HasResource)
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: 'navigation',
        order: 20,
        command: revealInOsCommand,
        when: resources_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.file)
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '3_compare',
        order: 20,
        command: compareResourceCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), resources_1.ResourceContextKey.HasResource, fileCommands_1.ResourceSelectedForCompareContext, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '3_compare',
        order: 30,
        command: selectForCompareCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), resources_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '3_compare',
        order: 30,
        command: compareSelectedCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), resources_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection)
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '5_cutcopypaste',
        order: 8,
        command: {
            id: CUT_FILE_ID,
            title: nls.localize('cut', "Cut")
        },
        when: files_1.ExplorerRootContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '5_cutcopypaste',
        order: 10,
        command: {
            id: COPY_FILE_ID,
            title: fileActions_1.COPY_FILE_LABEL
        },
        when: files_1.ExplorerRootContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '5_cutcopypaste',
        order: 20,
        command: {
            id: PASTE_FILE_ID,
            title: fileActions_1.PASTE_FILE_LABEL,
            precondition: contextkey_1.ContextKeyExpr.and(files_1.ExplorerResourceNotReadonlyContext, fileActions_1.FileCopiedContext)
        },
        when: files_1.ExplorerFolderContext
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '5_cutcopypaste',
        order: 30,
        command: {
            id: fileActions_1.DOWNLOAD_COMMAND_ID,
            title: downloadLabel,
        },
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.IsWebContext.toNegated(), resources_1.ResourceContextKey.Scheme.notEqualsTo(network_1.Schemas.file))
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '6_copypath',
        order: 30,
        command: copyPathCommand,
        when: resources_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '6_copypath',
        order: 30,
        command: copyRelativePathCommand,
        when: resources_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '2_workspace',
        order: 10,
        command: {
            id: workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID,
            title: workspaceCommands_1.ADD_ROOT_FOLDER_LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext, contextkeys_1.SupportsWorkspacesContext)
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '2_workspace',
        order: 30,
        command: {
            id: fileCommands_1.REMOVE_ROOT_FOLDER_COMMAND_ID,
            title: fileCommands_1.REMOVE_ROOT_FOLDER_LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext, files_1.ExplorerFolderContext)
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '7_modification',
        order: 10,
        command: {
            id: RENAME_ID,
            title: fileActions_1.TRIGGER_RENAME_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: files_1.ExplorerRootContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '7_modification',
        order: 20,
        command: {
            id: MOVE_FILE_TO_TRASH_ID,
            title: fileActions_1.MOVE_FILE_TO_TRASH_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        alt: {
            id: DELETE_FILE_ID,
            title: nls.localize('deleteFile', "Delete Permanently"),
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceMoveableToTrash)
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '7_modification',
        order: 20,
        command: {
            id: DELETE_FILE_ID,
            title: nls.localize('deleteFile', "Delete Permanently"),
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceMoveableToTrash.toNegated())
    });
    // Empty Editor Group Context Menu
    actions_1.MenuRegistry.appendMenuItem(10 /* EmptyEditorGroupContext */, { command: { id: fileActions_1.GlobalNewUntitledFileAction.ID, title: nls.localize('newFile', "New File") }, group: '1_file', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(10 /* EmptyEditorGroupContext */, { command: { id: 'workbench.action.quickOpen', title: nls.localize('openFile', "Open File...") }, group: '1_file', order: 20 });
    // File menu
    actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
        group: '1_new',
        command: {
            id: fileActions_1.GlobalNewUntitledFileAction.ID,
            title: nls.localize({ key: 'miNewFile', comment: ['&& denotes a mnemonic'] }, "&&New File")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
        group: '4_save',
        command: {
            id: fileCommands_1.SAVE_FILE_COMMAND_ID,
            title: nls.localize({ key: 'miSave', comment: ['&& denotes a mnemonic'] }, "&&Save")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
        group: '4_save',
        command: {
            id: fileCommands_1.SAVE_FILE_AS_COMMAND_ID,
            title: nls.localize({ key: 'miSaveAs', comment: ['&& denotes a mnemonic'] }, "Save &&As...")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
        group: '4_save',
        command: {
            id: fileActions_1.SaveAllAction.ID,
            title: nls.localize({ key: 'miSaveAll', comment: ['&& denotes a mnemonic'] }, "Save A&&ll")
        },
        order: 3
    });
    if (platform_2.isMacintosh) {
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '2_open',
            command: {
                id: workspaceActions_1.OpenFileFolderAction.ID,
                title: nls.localize({ key: 'miOpen', comment: ['&& denotes a mnemonic'] }, "&&Open...")
            },
            order: 1
        });
    }
    else {
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '2_open',
            command: {
                id: workspaceActions_1.OpenFileAction.ID,
                title: nls.localize({ key: 'miOpenFile', comment: ['&& denotes a mnemonic'] }, "&&Open File...")
            },
            order: 1
        });
        actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
            group: '2_open',
            command: {
                id: workspaceActions_1.OpenFolderAction.ID,
                title: nls.localize({ key: 'miOpenFolder', comment: ['&& denotes a mnemonic'] }, "Open &&Folder...")
            },
            order: 2
        });
    }
    actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
        group: '2_open',
        command: {
            id: workspaceActions_1.OpenWorkspaceAction.ID,
            title: nls.localize({ key: 'miOpenWorkspace', comment: ['&& denotes a mnemonic'] }, "Open Wor&&kspace...")
        },
        order: 3,
        when: contextkeys_1.SupportsWorkspacesContext
    });
    actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
        group: '5_autosave',
        command: {
            id: fileActions_1.ToggleAutoSaveAction.ID,
            title: nls.localize({ key: 'miAutoSave', comment: ['&& denotes a mnemonic'] }, "A&&uto Save"),
            toggled: contextkey_1.ContextKeyExpr.notEquals('config.files.autoSave', 'off')
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
        group: '6_close',
        command: {
            id: fileCommands_1.REVERT_FILE_COMMAND_ID,
            title: nls.localize({ key: 'miRevert', comment: ['&& denotes a mnemonic'] }, "Re&&vert File")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
        group: '6_close',
        command: {
            id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
            title: nls.localize({ key: 'miCloseEditor', comment: ['&& denotes a mnemonic'] }, "&&Close Editor")
        },
        order: 2
    });
    // Go to menu
    actions_1.MenuRegistry.appendMenuItem(16 /* MenubarGoMenu */, {
        group: '3_global_nav',
        command: {
            id: 'workbench.action.quickOpen',
            title: nls.localize({ key: 'miGotoFile', comment: ['&& denotes a mnemonic'] }, "Go to &&File...")
        },
        order: 1
    });
});
//# sourceMappingURL=fileActions.contribution.js.map