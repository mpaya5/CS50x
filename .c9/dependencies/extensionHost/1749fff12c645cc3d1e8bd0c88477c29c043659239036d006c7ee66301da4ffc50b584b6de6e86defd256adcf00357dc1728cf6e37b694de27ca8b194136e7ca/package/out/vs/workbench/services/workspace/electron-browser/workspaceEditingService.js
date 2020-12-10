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
define(["require", "exports", "vs/workbench/services/workspace/common/workspaceEditing", "vs/nls", "vs/platform/workspace/common/workspace", "vs/platform/windows/common/windows", "vs/workbench/services/configuration/common/jsonEditing", "vs/platform/workspaces/common/workspaces", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/backup/common/backup", "vs/workbench/services/backup/common/backupFileService", "vs/platform/commands/common/commands", "vs/base/common/arrays", "vs/base/common/platform", "vs/base/common/resources", "vs/platform/notification/common/notification", "vs/platform/files/common/files", "vs/workbench/services/environment/common/environmentService", "vs/platform/lifecycle/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/base/common/labels", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/label/common/label", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, workspaceEditing_1, nls, workspace_1, windows_1, jsonEditing_1, workspaces_1, storage_1, configurationRegistry_1, platform_1, extensions_1, backup_1, backupFileService_1, commands_1, arrays_1, platform_2, resources_1, notification_1, files_1, environmentService_1, lifecycle_1, dialogs_1, labels_1, configuration_1, extensions_2, label_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WorkspaceEditingService = class WorkspaceEditingService {
        constructor(jsonEditingService, contextService, windowService, configurationService, storageService, extensionService, backupFileService, notificationService, commandService, fileService, textFileService, windowsService, workspaceService, environmentService, fileDialogService, dialogService, lifecycleService, labelService) {
            this.jsonEditingService = jsonEditingService;
            this.contextService = contextService;
            this.windowService = windowService;
            this.configurationService = configurationService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.backupFileService = backupFileService;
            this.notificationService = notificationService;
            this.commandService = commandService;
            this.fileService = fileService;
            this.textFileService = textFileService;
            this.windowsService = windowsService;
            this.workspaceService = workspaceService;
            this.environmentService = environmentService;
            this.fileDialogService = fileDialogService;
            this.dialogService = dialogService;
            this.lifecycleService = lifecycleService;
            this.labelService = labelService;
            this.registerListeners();
        }
        registerListeners() {
            this.lifecycleService.onBeforeShutdown((e) => __awaiter(this, void 0, void 0, function* () {
                const saveOperation = this.saveUntitedBeforeShutdown(e.reason);
                if (saveOperation) {
                    e.veto(saveOperation);
                }
            }));
        }
        saveUntitedBeforeShutdown(reason) {
            return __awaiter(this, void 0, void 0, function* () {
                if (reason !== 4 /* LOAD */ && reason !== 1 /* CLOSE */) {
                    return false; // only interested when window is closing or loading
                }
                const workspaceIdentifier = this.getCurrentWorkspaceIdentifier();
                if (!workspaceIdentifier || !resources_1.isEqualOrParent(workspaceIdentifier.configPath, this.environmentService.untitledWorkspacesHome)) {
                    return false; // only care about untitled workspaces to ask for saving
                }
                const windowCount = yield this.windowsService.getWindowCount();
                if (reason === 1 /* CLOSE */ && !platform_2.isMacintosh && windowCount === 1) {
                    return false; // Windows/Linux: quits when last window is closed, so do not ask then
                }
                let ConfirmResult;
                (function (ConfirmResult) {
                    ConfirmResult[ConfirmResult["SAVE"] = 0] = "SAVE";
                    ConfirmResult[ConfirmResult["DONT_SAVE"] = 1] = "DONT_SAVE";
                    ConfirmResult[ConfirmResult["CANCEL"] = 2] = "CANCEL";
                })(ConfirmResult || (ConfirmResult = {}));
                const save = { label: labels_1.mnemonicButtonLabel(nls.localize('save', "Save")), result: ConfirmResult.SAVE };
                const dontSave = { label: labels_1.mnemonicButtonLabel(nls.localize('doNotSave', "Don't Save")), result: ConfirmResult.DONT_SAVE };
                const cancel = { label: nls.localize('cancel', "Cancel"), result: ConfirmResult.CANCEL };
                const buttons = [];
                if (platform_2.isWindows) {
                    buttons.push(save, dontSave, cancel);
                }
                else if (platform_2.isLinux) {
                    buttons.push(dontSave, cancel, save);
                }
                else {
                    buttons.push(save, cancel, dontSave);
                }
                const message = nls.localize('saveWorkspaceMessage', "Do you want to save your workspace configuration as a file?");
                const detail = nls.localize('saveWorkspaceDetail', "Save your workspace if you plan to open it again.");
                const cancelId = buttons.indexOf(cancel);
                const res = yield this.dialogService.show(notification_1.Severity.Warning, message, buttons.map(button => button.label), { detail, cancelId });
                switch (buttons[res].result) {
                    // Cancel: veto unload
                    case ConfirmResult.CANCEL:
                        return true;
                    // Don't Save: delete workspace
                    case ConfirmResult.DONT_SAVE:
                        this.workspaceService.deleteUntitledWorkspace(workspaceIdentifier);
                        return false;
                    // Save: save workspace, but do not veto unload if path provided
                    case ConfirmResult.SAVE: {
                        const newWorkspacePath = yield this.pickNewWorkspacePath();
                        if (!newWorkspacePath) {
                            return true; // keep veto if no target was provided
                        }
                        try {
                            yield this.saveWorkspaceAs(workspaceIdentifier, newWorkspacePath);
                            const newWorkspaceIdentifier = yield this.workspaceService.getWorkspaceIdentifier(newWorkspacePath);
                            const label = this.labelService.getWorkspaceLabel(newWorkspaceIdentifier, { verbose: true });
                            this.windowService.addRecentlyOpened([{ label, workspace: newWorkspaceIdentifier }]);
                            this.workspaceService.deleteUntitledWorkspace(workspaceIdentifier);
                        }
                        catch (error) {
                            // ignore
                        }
                        return false;
                    }
                }
            });
        }
        pickNewWorkspacePath() {
            return this.fileDialogService.showSaveDialog({
                saveLabel: labels_1.mnemonicButtonLabel(nls.localize('save', "Save")),
                title: nls.localize('saveWorkspace', "Save Workspace"),
                filters: workspaces_1.WORKSPACE_FILTER,
                defaultUri: this.fileDialogService.defaultWorkspacePath()
            });
        }
        updateFolders(index, deleteCount, foldersToAdd, donotNotifyError) {
            const folders = this.contextService.getWorkspace().folders;
            let foldersToDelete = [];
            if (typeof deleteCount === 'number') {
                foldersToDelete = folders.slice(index, index + deleteCount).map(f => f.uri);
            }
            const wantsToDelete = foldersToDelete.length > 0;
            const wantsToAdd = Array.isArray(foldersToAdd) && foldersToAdd.length > 0;
            if (!wantsToAdd && !wantsToDelete) {
                return Promise.resolve(); // return early if there is nothing to do
            }
            // Add Folders
            if (wantsToAdd && !wantsToDelete && Array.isArray(foldersToAdd)) {
                return this.doAddFolders(foldersToAdd, index, donotNotifyError);
            }
            // Delete Folders
            if (wantsToDelete && !wantsToAdd) {
                return this.removeFolders(foldersToDelete);
            }
            // Add & Delete Folders
            else {
                // if we are in single-folder state and the folder is replaced with
                // other folders, we handle this specially and just enter workspace
                // mode with the folders that are being added.
                if (this.includesSingleFolderWorkspace(foldersToDelete)) {
                    return this.createAndEnterWorkspace(foldersToAdd);
                }
                // if we are not in workspace-state, we just add the folders
                if (this.contextService.getWorkbenchState() !== 3 /* WORKSPACE */) {
                    return this.doAddFolders(foldersToAdd, index, donotNotifyError);
                }
                // finally, update folders within the workspace
                return this.doUpdateFolders(foldersToAdd, foldersToDelete, index, donotNotifyError);
            }
        }
        doUpdateFolders(foldersToAdd, foldersToDelete, index, donotNotifyError = false) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.contextService.updateFolders(foldersToAdd, foldersToDelete, index);
                }
                catch (error) {
                    if (donotNotifyError) {
                        throw error;
                    }
                    this.handleWorkspaceConfigurationEditingError(error);
                }
            });
        }
        addFolders(foldersToAdd, donotNotifyError = false) {
            return this.doAddFolders(foldersToAdd, undefined, donotNotifyError);
        }
        doAddFolders(foldersToAdd, index, donotNotifyError = false) {
            return __awaiter(this, void 0, void 0, function* () {
                const state = this.contextService.getWorkbenchState();
                if (this.environmentService.configuration.remoteAuthority) {
                    // Do not allow workspace folders with scheme different than the current remote scheme
                    const schemas = this.contextService.getWorkspace().folders.map(f => f.uri.scheme);
                    if (schemas.length && foldersToAdd.some(f => schemas.indexOf(f.uri.scheme) === -1)) {
                        return Promise.reject(new Error(nls.localize('differentSchemeRoots', "Workspace folders from different providers are not allowed in the same workspace.")));
                    }
                }
                // If we are in no-workspace or single-folder workspace, adding folders has to
                // enter a workspace.
                if (state !== 3 /* WORKSPACE */) {
                    let newWorkspaceFolders = this.contextService.getWorkspace().folders.map(folder => ({ uri: folder.uri }));
                    newWorkspaceFolders.splice(typeof index === 'number' ? index : newWorkspaceFolders.length, 0, ...foldersToAdd);
                    newWorkspaceFolders = arrays_1.distinct(newWorkspaceFolders, folder => resources_1.getComparisonKey(folder.uri));
                    if (state === 1 /* EMPTY */ && newWorkspaceFolders.length === 0 || state === 2 /* FOLDER */ && newWorkspaceFolders.length === 1) {
                        return; // return if the operation is a no-op for the current state
                    }
                    return this.createAndEnterWorkspace(newWorkspaceFolders);
                }
                // Delegate addition of folders to workspace service otherwise
                try {
                    yield this.contextService.addFolders(foldersToAdd, index);
                }
                catch (error) {
                    if (donotNotifyError) {
                        throw error;
                    }
                    this.handleWorkspaceConfigurationEditingError(error);
                }
            });
        }
        removeFolders(foldersToRemove, donotNotifyError = false) {
            return __awaiter(this, void 0, void 0, function* () {
                // If we are in single-folder state and the opened folder is to be removed,
                // we create an empty workspace and enter it.
                if (this.includesSingleFolderWorkspace(foldersToRemove)) {
                    return this.createAndEnterWorkspace([]);
                }
                // Delegate removal of folders to workspace service otherwise
                try {
                    yield this.contextService.removeFolders(foldersToRemove);
                }
                catch (error) {
                    if (donotNotifyError) {
                        throw error;
                    }
                    this.handleWorkspaceConfigurationEditingError(error);
                }
            });
        }
        includesSingleFolderWorkspace(folders) {
            if (this.contextService.getWorkbenchState() === 2 /* FOLDER */) {
                const workspaceFolder = this.contextService.getWorkspace().folders[0];
                return (folders.some(folder => resources_1.isEqual(folder, workspaceFolder.uri)));
            }
            return false;
        }
        createAndEnterWorkspace(folders, path) {
            return __awaiter(this, void 0, void 0, function* () {
                if (path && !(yield this.isValidTargetWorkspacePath(path))) {
                    return;
                }
                const remoteAuthority = this.environmentService.configuration.remoteAuthority;
                const untitledWorkspace = yield this.workspaceService.createUntitledWorkspace(folders, remoteAuthority);
                if (path) {
                    yield this.saveWorkspaceAs(untitledWorkspace, path);
                }
                else {
                    path = untitledWorkspace.configPath;
                }
                return this.enterWorkspace(path);
            });
        }
        saveAndEnterWorkspace(path) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!(yield this.isValidTargetWorkspacePath(path))) {
                    return;
                }
                const workspaceIdentifier = this.getCurrentWorkspaceIdentifier();
                if (!workspaceIdentifier) {
                    return;
                }
                yield this.saveWorkspaceAs(workspaceIdentifier, path);
                return this.enterWorkspace(path);
            });
        }
        isValidTargetWorkspacePath(path) {
            return __awaiter(this, void 0, void 0, function* () {
                const windows = yield this.windowsService.getWindows();
                // Prevent overwriting a workspace that is currently opened in another window
                if (windows.some(window => !!window.workspace && resources_1.isEqual(window.workspace.configPath, path))) {
                    const options = {
                        type: 'info',
                        buttons: [nls.localize('ok', "OK")],
                        message: nls.localize('workspaceOpenedMessage', "Unable to save workspace '{0}'", resources_1.basename(path)),
                        detail: nls.localize('workspaceOpenedDetail', "The workspace is already opened in another window. Please close that window first and then try again."),
                        noLink: true
                    };
                    yield this.windowService.showMessageBox(options);
                    return false;
                }
                return true; // OK
            });
        }
        saveWorkspaceAs(workspace, targetConfigPathURI) {
            return __awaiter(this, void 0, void 0, function* () {
                const configPathURI = workspace.configPath;
                // Return early if target is same as source
                if (resources_1.isEqual(configPathURI, targetConfigPathURI)) {
                    return;
                }
                // Read the contents of the workspace file, update it to new location and save it.
                const raw = yield this.fileService.readFile(configPathURI);
                const newRawWorkspaceContents = workspaces_1.rewriteWorkspaceFileForNewLocation(raw.value.toString(), configPathURI, targetConfigPathURI);
                yield this.textFileService.create(targetConfigPathURI, newRawWorkspaceContents, { overwrite: true });
            });
        }
        handleWorkspaceConfigurationEditingError(error) {
            switch (error.code) {
                case 1 /* ERROR_INVALID_FILE */:
                    this.onInvalidWorkspaceConfigurationFileError();
                    break;
                case 0 /* ERROR_FILE_DIRTY */:
                    this.onWorkspaceConfigurationFileDirtyError();
                    break;
                default:
                    this.notificationService.error(error.message);
            }
        }
        onInvalidWorkspaceConfigurationFileError() {
            const message = nls.localize('errorInvalidTaskConfiguration', "Unable to write into workspace configuration file. Please open the file to correct errors/warnings in it and try again.");
            this.askToOpenWorkspaceConfigurationFile(message);
        }
        onWorkspaceConfigurationFileDirtyError() {
            const message = nls.localize('errorWorkspaceConfigurationFileDirty', "Unable to write into workspace configuration file because the file is dirty. Please save it and try again.");
            this.askToOpenWorkspaceConfigurationFile(message);
        }
        askToOpenWorkspaceConfigurationFile(message) {
            this.notificationService.prompt(notification_1.Severity.Error, message, [{
                    label: nls.localize('openWorkspaceConfigurationFile', "Open Workspace Configuration"),
                    run: () => this.commandService.executeCommand('workbench.action.openWorkspaceConfigFile')
                }]);
        }
        enterWorkspace(path) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!!this.environmentService.extensionTestsLocationURI) {
                    throw new Error('Entering a new workspace is not possible in tests.');
                }
                const workspace = yield this.workspaceService.getWorkspaceIdentifier(path);
                // Settings migration (only if we come from a folder workspace)
                if (this.contextService.getWorkbenchState() === 2 /* FOLDER */) {
                    yield this.migrateWorkspaceSettings(workspace);
                }
                const workspaceImpl = this.contextService;
                yield workspaceImpl.initialize(workspace);
                const result = yield this.windowService.enterWorkspace(path);
                if (result) {
                    // Migrate storage to new workspace
                    yield this.migrateStorage(result.workspace);
                    // Reinitialize backup service
                    this.environmentService.configuration.backupPath = result.backupPath;
                    this.environmentService.configuration.backupWorkspaceResource = result.backupPath ? backup_1.toBackupWorkspaceResource(result.backupPath, this.environmentService) : undefined;
                    if (this.backupFileService instanceof backupFileService_1.BackupFileService) {
                        this.backupFileService.reinitialize();
                    }
                }
                // TODO@aeschli: workaround until restarting works
                if (this.environmentService.configuration.remoteAuthority) {
                    this.windowService.reloadWindow();
                }
                // Restart the extension host: entering a workspace means a new location for
                // storage and potentially a change in the workspace.rootPath property.
                else {
                    this.extensionService.restartExtensionHost();
                }
            });
        }
        migrateStorage(toWorkspace) {
            const storageImpl = this.storageService;
            return storageImpl.migrate(toWorkspace);
        }
        migrateWorkspaceSettings(toWorkspace) {
            return this.doCopyWorkspaceSettings(toWorkspace, setting => setting.scope === 3 /* WINDOW */);
        }
        copyWorkspaceSettings(toWorkspace) {
            return this.doCopyWorkspaceSettings(toWorkspace);
        }
        doCopyWorkspaceSettings(toWorkspace, filter) {
            const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            const targetWorkspaceConfiguration = {};
            for (const key of this.configurationService.keys().workspace) {
                if (configurationProperties[key]) {
                    if (filter && !filter(configurationProperties[key])) {
                        continue;
                    }
                    targetWorkspaceConfiguration[key] = this.configurationService.inspect(key).workspace;
                }
            }
            return this.jsonEditingService.write(toWorkspace.configPath, { key: 'settings', value: targetWorkspaceConfiguration }, true);
        }
        getCurrentWorkspaceIdentifier() {
            const workspace = this.contextService.getWorkspace();
            if (workspace && workspace.configuration) {
                return { id: workspace.id, configPath: workspace.configuration };
            }
            return undefined;
        }
    };
    WorkspaceEditingService = __decorate([
        __param(0, jsonEditing_1.IJSONEditingService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, windows_1.IWindowService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, storage_1.IStorageService),
        __param(5, extensions_1.IExtensionService),
        __param(6, backup_1.IBackupFileService),
        __param(7, notification_1.INotificationService),
        __param(8, commands_1.ICommandService),
        __param(9, files_1.IFileService),
        __param(10, textfiles_1.ITextFileService),
        __param(11, windows_1.IWindowsService),
        __param(12, workspaces_1.IWorkspacesService),
        __param(13, environmentService_1.IWorkbenchEnvironmentService),
        __param(14, dialogs_1.IFileDialogService),
        __param(15, dialogs_1.IDialogService),
        __param(16, lifecycle_1.ILifecycleService),
        __param(17, label_1.ILabelService)
    ], WorkspaceEditingService);
    exports.WorkspaceEditingService = WorkspaceEditingService;
    extensions_2.registerSingleton(workspaceEditing_1.IWorkspaceEditingService, WorkspaceEditingService, true);
});
//# sourceMappingURL=workspaceEditingService.js.map