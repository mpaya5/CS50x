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
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/platform/windows/common/windows", "vs/platform/workspace/common/workspace", "vs/workbench/services/workspace/common/workspaceEditing", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/editor/common/editorService", "vs/platform/commands/common/commands", "vs/workbench/browser/actions/workspaceCommands", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/base/common/network", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/common/editor", "vs/platform/actions/common/actions", "vs/workbench/browser/contextkeys", "vs/platform/instantiation/common/instantiation"], function (require, exports, actions_1, nls, windows_1, workspace_1, workspaceEditing_1, workspaces_1, editorService_1, commands_1, workspaceCommands_1, dialogs_1, notification_1, network_1, environmentService_1, textfiles_1, editor_1, actions_2, contextkeys_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let OpenFileAction = class OpenFileAction extends actions_1.Action {
        constructor(id, label, dialogService) {
            super(id, label);
            this.dialogService = dialogService;
        }
        run(event, data) {
            return this.dialogService.pickFileAndOpen({ forceNewWindow: false, telemetryExtraData: data });
        }
    };
    OpenFileAction.ID = 'workbench.action.files.openFile';
    OpenFileAction.LABEL = nls.localize('openFile', "Open File...");
    OpenFileAction = __decorate([
        __param(2, dialogs_1.IFileDialogService)
    ], OpenFileAction);
    exports.OpenFileAction = OpenFileAction;
    var OpenLocalFileCommand;
    (function (OpenLocalFileCommand) {
        OpenLocalFileCommand.ID = 'workbench.action.files.openLocalFile';
        OpenLocalFileCommand.LABEL = nls.localize('openLocalFile', "Open Local File...");
        function handler() {
            return accessor => {
                const dialogService = accessor.get(dialogs_1.IFileDialogService);
                return dialogService.pickFileAndOpen({ forceNewWindow: false, availableFileSystems: [network_1.Schemas.file] });
            };
        }
        OpenLocalFileCommand.handler = handler;
    })(OpenLocalFileCommand = exports.OpenLocalFileCommand || (exports.OpenLocalFileCommand = {}));
    var SaveLocalFileCommand;
    (function (SaveLocalFileCommand) {
        SaveLocalFileCommand.ID = 'workbench.action.files.saveLocalFile';
        SaveLocalFileCommand.LABEL = nls.localize('saveLocalFile', "Save Local File...");
        function handler() {
            return accessor => {
                const textFileService = accessor.get(textfiles_1.ITextFileService);
                const editorService = accessor.get(editorService_1.IEditorService);
                let resource = editor_1.toResource(editorService.activeEditor);
                const options = { force: true, availableFileSystems: [network_1.Schemas.file] };
                if (resource) {
                    return textFileService.saveAs(resource, undefined, options);
                }
                return Promise.resolve(undefined);
            };
        }
        SaveLocalFileCommand.handler = handler;
    })(SaveLocalFileCommand = exports.SaveLocalFileCommand || (exports.SaveLocalFileCommand = {}));
    let OpenFolderAction = class OpenFolderAction extends actions_1.Action {
        constructor(id, label, dialogService) {
            super(id, label);
            this.dialogService = dialogService;
        }
        run(event, data) {
            return this.dialogService.pickFolderAndOpen({ forceNewWindow: false, telemetryExtraData: data });
        }
    };
    OpenFolderAction.ID = 'workbench.action.files.openFolder';
    OpenFolderAction.LABEL = nls.localize('openFolder', "Open Folder...");
    OpenFolderAction = __decorate([
        __param(2, dialogs_1.IFileDialogService)
    ], OpenFolderAction);
    exports.OpenFolderAction = OpenFolderAction;
    var OpenLocalFolderCommand;
    (function (OpenLocalFolderCommand) {
        OpenLocalFolderCommand.ID = 'workbench.action.files.openLocalFolder';
        OpenLocalFolderCommand.LABEL = nls.localize('openLocalFolder', "Open Local Folder...");
        function handler() {
            return accessor => {
                const dialogService = accessor.get(dialogs_1.IFileDialogService);
                return dialogService.pickFolderAndOpen({ forceNewWindow: false, availableFileSystems: [network_1.Schemas.file] });
            };
        }
        OpenLocalFolderCommand.handler = handler;
    })(OpenLocalFolderCommand = exports.OpenLocalFolderCommand || (exports.OpenLocalFolderCommand = {}));
    let OpenFileFolderAction = class OpenFileFolderAction extends actions_1.Action {
        constructor(id, label, dialogService) {
            super(id, label);
            this.dialogService = dialogService;
        }
        run(event, data) {
            return this.dialogService.pickFileFolderAndOpen({ forceNewWindow: false, telemetryExtraData: data });
        }
    };
    OpenFileFolderAction.ID = 'workbench.action.files.openFileFolder';
    OpenFileFolderAction.LABEL = nls.localize('openFileFolder', "Open...");
    OpenFileFolderAction = __decorate([
        __param(2, dialogs_1.IFileDialogService)
    ], OpenFileFolderAction);
    exports.OpenFileFolderAction = OpenFileFolderAction;
    var OpenLocalFileFolderCommand;
    (function (OpenLocalFileFolderCommand) {
        OpenLocalFileFolderCommand.ID = 'workbench.action.files.openLocalFileFolder';
        OpenLocalFileFolderCommand.LABEL = nls.localize('openLocalFileFolder', "Open Local...");
        function handler() {
            return accessor => {
                const dialogService = accessor.get(dialogs_1.IFileDialogService);
                return dialogService.pickFileFolderAndOpen({ forceNewWindow: false, availableFileSystems: [network_1.Schemas.file] });
            };
        }
        OpenLocalFileFolderCommand.handler = handler;
    })(OpenLocalFileFolderCommand = exports.OpenLocalFileFolderCommand || (exports.OpenLocalFileFolderCommand = {}));
    let AddRootFolderAction = class AddRootFolderAction extends actions_1.Action {
        constructor(id, label, commandService) {
            super(id, label);
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID);
        }
    };
    AddRootFolderAction.ID = 'workbench.action.addRootFolder';
    AddRootFolderAction.LABEL = workspaceCommands_1.ADD_ROOT_FOLDER_LABEL;
    AddRootFolderAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], AddRootFolderAction);
    exports.AddRootFolderAction = AddRootFolderAction;
    let GlobalRemoveRootFolderAction = class GlobalRemoveRootFolderAction extends actions_1.Action {
        constructor(id, label, workspaceEditingService, contextService, commandService) {
            super(id, label);
            this.workspaceEditingService = workspaceEditingService;
            this.contextService = contextService;
            this.commandService = commandService;
        }
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                const state = this.contextService.getWorkbenchState();
                // Workspace / Folder
                if (state === 3 /* WORKSPACE */ || state === 2 /* FOLDER */) {
                    const folder = yield this.commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID);
                    if (folder) {
                        yield this.workspaceEditingService.removeFolders([folder.uri]);
                    }
                }
                return true;
            });
        }
    };
    GlobalRemoveRootFolderAction.ID = 'workbench.action.removeRootFolder';
    GlobalRemoveRootFolderAction.LABEL = nls.localize('globalRemoveFolderFromWorkspace', "Remove Folder from Workspace...");
    GlobalRemoveRootFolderAction = __decorate([
        __param(2, workspaceEditing_1.IWorkspaceEditingService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, commands_1.ICommandService)
    ], GlobalRemoveRootFolderAction);
    exports.GlobalRemoveRootFolderAction = GlobalRemoveRootFolderAction;
    let SaveWorkspaceAsAction = class SaveWorkspaceAsAction extends actions_1.Action {
        constructor(id, label, contextService, workspaceEditingService) {
            super(id, label);
            this.contextService = contextService;
            this.workspaceEditingService = workspaceEditingService;
        }
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                const configPathUri = yield this.workspaceEditingService.pickNewWorkspacePath();
                if (configPathUri) {
                    switch (this.contextService.getWorkbenchState()) {
                        case 1 /* EMPTY */:
                        case 2 /* FOLDER */:
                            const folders = this.contextService.getWorkspace().folders.map(folder => ({ uri: folder.uri }));
                            return this.workspaceEditingService.createAndEnterWorkspace(folders, configPathUri);
                        case 3 /* WORKSPACE */:
                            return this.workspaceEditingService.saveAndEnterWorkspace(configPathUri);
                    }
                }
            });
        }
    };
    SaveWorkspaceAsAction.ID = 'workbench.action.saveWorkspaceAs';
    SaveWorkspaceAsAction.LABEL = nls.localize('saveWorkspaceAsAction', "Save Workspace As...");
    SaveWorkspaceAsAction = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, workspaceEditing_1.IWorkspaceEditingService)
    ], SaveWorkspaceAsAction);
    exports.SaveWorkspaceAsAction = SaveWorkspaceAsAction;
    let OpenWorkspaceAction = class OpenWorkspaceAction extends actions_1.Action {
        constructor(id, label, dialogService) {
            super(id, label);
            this.dialogService = dialogService;
        }
        run(event, data) {
            return this.dialogService.pickWorkspaceAndOpen({ telemetryExtraData: data });
        }
    };
    OpenWorkspaceAction.ID = 'workbench.action.openWorkspace';
    OpenWorkspaceAction.LABEL = nls.localize('openWorkspaceAction', "Open Workspace...");
    OpenWorkspaceAction = __decorate([
        __param(2, dialogs_1.IFileDialogService)
    ], OpenWorkspaceAction);
    exports.OpenWorkspaceAction = OpenWorkspaceAction;
    let CloseWorkspaceAction = class CloseWorkspaceAction extends actions_1.Action {
        constructor(id, label, contextService, notificationService, windowService) {
            super(id, label);
            this.contextService = contextService;
            this.notificationService = notificationService;
            this.windowService = windowService;
        }
        run() {
            if (this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                this.notificationService.info(nls.localize('noWorkspaceOpened', "There is currently no workspace opened in this instance to close."));
                return Promise.resolve(undefined);
            }
            return this.windowService.closeWorkspace();
        }
    };
    CloseWorkspaceAction.ID = 'workbench.action.closeFolder';
    CloseWorkspaceAction.LABEL = nls.localize('closeWorkspace', "Close Workspace");
    CloseWorkspaceAction = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, notification_1.INotificationService),
        __param(4, windows_1.IWindowService)
    ], CloseWorkspaceAction);
    exports.CloseWorkspaceAction = CloseWorkspaceAction;
    let OpenWorkspaceConfigFileAction = class OpenWorkspaceConfigFileAction extends actions_1.Action {
        constructor(id, label, workspaceContextService, editorService) {
            super(id, label);
            this.workspaceContextService = workspaceContextService;
            this.editorService = editorService;
            this.enabled = !!this.workspaceContextService.getWorkspace().configuration;
        }
        run() {
            const configuration = this.workspaceContextService.getWorkspace().configuration;
            if (configuration) {
                return this.editorService.openEditor({ resource: configuration });
            }
            return Promise.resolve();
        }
    };
    OpenWorkspaceConfigFileAction.ID = 'workbench.action.openWorkspaceConfigFile';
    OpenWorkspaceConfigFileAction.LABEL = nls.localize('openWorkspaceConfigFile', "Open Workspace Configuration File");
    OpenWorkspaceConfigFileAction = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, editorService_1.IEditorService)
    ], OpenWorkspaceConfigFileAction);
    exports.OpenWorkspaceConfigFileAction = OpenWorkspaceConfigFileAction;
    let DuplicateWorkspaceInNewWindowAction = class DuplicateWorkspaceInNewWindowAction extends actions_1.Action {
        constructor(id, label, workspaceContextService, workspaceEditingService, windowService, workspacesService, environmentService) {
            super(id, label);
            this.workspaceContextService = workspaceContextService;
            this.workspaceEditingService = workspaceEditingService;
            this.windowService = windowService;
            this.workspacesService = workspacesService;
            this.environmentService = environmentService;
        }
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                const folders = this.workspaceContextService.getWorkspace().folders;
                const remoteAuthority = this.environmentService.configuration.remoteAuthority;
                const newWorkspace = yield this.workspacesService.createUntitledWorkspace(folders, remoteAuthority);
                yield this.workspaceEditingService.copyWorkspaceSettings(newWorkspace);
                return this.windowService.openWindow([{ workspaceUri: newWorkspace.configPath }], { forceNewWindow: true });
            });
        }
    };
    DuplicateWorkspaceInNewWindowAction.ID = 'workbench.action.duplicateWorkspaceInNewWindow';
    DuplicateWorkspaceInNewWindowAction.LABEL = nls.localize('duplicateWorkspaceInNewWindow', "Duplicate Workspace in New Window");
    DuplicateWorkspaceInNewWindowAction = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, workspaceEditing_1.IWorkspaceEditingService),
        __param(4, windows_1.IWindowService),
        __param(5, workspaces_1.IWorkspacesService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService)
    ], DuplicateWorkspaceInNewWindowAction);
    exports.DuplicateWorkspaceInNewWindowAction = DuplicateWorkspaceInNewWindowAction;
    // --- Menu Registration
    const workspacesCategory = nls.localize('workspaces', "Workspaces");
    commands_1.CommandsRegistry.registerCommand(OpenWorkspaceConfigFileAction.ID, serviceAccessor => {
        serviceAccessor.get(instantiation_1.IInstantiationService).createInstance(OpenWorkspaceConfigFileAction, OpenWorkspaceConfigFileAction.ID, OpenWorkspaceConfigFileAction.LABEL).run();
    });
    actions_2.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
        command: {
            id: OpenWorkspaceConfigFileAction.ID,
            title: { value: `${workspacesCategory}: ${OpenWorkspaceConfigFileAction.LABEL}`, original: 'Workspaces: Open Workspace Configuration File' },
        },
        when: contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')
    });
});
//# sourceMappingURL=workspaceActions.js.map