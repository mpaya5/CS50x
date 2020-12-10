/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/nls", "vs/platform/workspace/common/workspace", "vs/workbench/services/workspace/common/workspaceEditing", "vs/base/common/resources", "vs/workbench/services/viewlet/browser/viewlet", "vs/base/common/cancellation", "vs/base/common/labels", "vs/platform/commands/common/commands", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/platform/dialogs/common/dialogs"], function (require, exports, nls, workspace_1, workspaceEditing_1, resources, viewlet_1, cancellation_1, labels_1, commands_1, files_1, label_1, quickInput_1, getIconClasses_1, modelService_1, modeService_1, dialogs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ADD_ROOT_FOLDER_COMMAND_ID = 'addRootFolder';
    exports.ADD_ROOT_FOLDER_LABEL = nls.localize('addFolderToWorkspace', "Add Folder to Workspace...");
    exports.PICK_WORKSPACE_FOLDER_COMMAND_ID = '_workbench.pickWorkspaceFolder';
    // Command registration
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.action.files.openFileFolderInNewWindow',
        handler: (accessor) => accessor.get(dialogs_1.IFileDialogService).pickFileFolderAndOpen({ forceNewWindow: true })
    });
    commands_1.CommandsRegistry.registerCommand({
        id: '_files.pickFolderAndOpen',
        handler: (accessor, options) => accessor.get(dialogs_1.IFileDialogService).pickFolderAndOpen(options)
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.action.files.openFolderInNewWindow',
        handler: (accessor) => accessor.get(dialogs_1.IFileDialogService).pickFolderAndOpen({ forceNewWindow: true })
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.action.files.openFileInNewWindow',
        handler: (accessor) => accessor.get(dialogs_1.IFileDialogService).pickFileAndOpen({ forceNewWindow: true })
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.action.openWorkspaceInNewWindow',
        handler: (accessor) => accessor.get(dialogs_1.IFileDialogService).pickWorkspaceAndOpen({ forceNewWindow: true })
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.ADD_ROOT_FOLDER_COMMAND_ID,
        handler: (accessor) => __awaiter(this, void 0, void 0, function* () {
            const viewletService = accessor.get(viewlet_1.IViewletService);
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const dialogsService = accessor.get(dialogs_1.IFileDialogService);
            const folders = yield dialogsService.showOpenDialog({
                openLabel: labels_1.mnemonicButtonLabel(nls.localize({ key: 'add', comment: ['&& denotes a mnemonic'] }, "&&Add")),
                title: nls.localize('addFolderToWorkspaceTitle', "Add Folder to Workspace"),
                canSelectFolders: true,
                canSelectMany: true,
                defaultUri: dialogsService.defaultFolderPath()
            });
            if (!folders || !folders.length) {
                return;
            }
            yield workspaceEditingService.addFolders(folders.map(folder => ({ uri: resources.removeTrailingPathSeparator(folder) })));
            yield viewletService.openViewlet(viewletService.getDefaultViewletId(), true);
        })
    });
    commands_1.CommandsRegistry.registerCommand(exports.PICK_WORKSPACE_FOLDER_COMMAND_ID, function (accessor, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const labelService = accessor.get(label_1.ILabelService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const modelService = accessor.get(modelService_1.IModelService);
            const modeService = accessor.get(modeService_1.IModeService);
            const folders = contextService.getWorkspace().folders;
            if (!folders.length) {
                return;
            }
            const folderPicks = folders.map(folder => {
                return {
                    label: folder.name,
                    description: labelService.getUriLabel(resources.dirname(folder.uri), { relative: true }),
                    folder,
                    iconClasses: getIconClasses_1.getIconClasses(modelService, modeService, folder.uri, files_1.FileKind.ROOT_FOLDER)
                };
            });
            const options = (args ? args[0] : undefined) || Object.create(null);
            if (!options.activeItem) {
                options.activeItem = folderPicks[0];
            }
            if (!options.placeHolder) {
                options.placeHolder = nls.localize('workspaceFolderPickerPlaceholder', "Select workspace folder");
            }
            if (typeof options.matchOnDescription !== 'boolean') {
                options.matchOnDescription = true;
            }
            const token = (args ? args[1] : undefined) || cancellation_1.CancellationToken.None;
            const pick = yield quickInputService.pick(folderPicks, options, token);
            if (pick) {
                return folders[folderPicks.indexOf(pick)];
            }
            return;
        });
    });
});
//# sourceMappingURL=workspaceCommands.js.map