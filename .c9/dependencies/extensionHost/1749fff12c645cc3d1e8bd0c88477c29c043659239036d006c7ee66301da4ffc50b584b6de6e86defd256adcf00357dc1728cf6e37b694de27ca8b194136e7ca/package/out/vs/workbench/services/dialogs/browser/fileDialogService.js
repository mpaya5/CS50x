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
define(["require", "exports", "vs/nls", "vs/platform/windows/common/windows", "vs/platform/dialogs/common/dialogs", "vs/platform/workspace/common/workspace", "vs/workbench/services/history/common/history", "vs/workbench/services/environment/common/environmentService", "vs/base/common/uri", "vs/base/common/network", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/dialogs/browser/remoteFileDialog", "vs/platform/workspaces/common/workspaces", "vs/platform/remote/common/remoteHosts", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/files/common/files", "vs/base/common/platform"], function (require, exports, nls, windows_1, dialogs_1, workspace_1, history_1, environmentService_1, uri_1, network_1, resources, instantiation_1, remoteFileDialog_1, workspaces_1, remoteHosts_1, configuration_1, extensions_1, files_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let FileDialogService = class FileDialogService {
        constructor(windowService, contextService, historyService, environmentService, instantiationService, configurationService, fileService) {
            this.windowService = windowService;
            this.contextService = contextService;
            this.historyService = historyService;
            this.environmentService = environmentService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.fileService = fileService;
        }
        defaultFilePath(schemeFilter = this.getSchemeFilterForWindow()) {
            // Check for last active file first...
            let candidate = this.historyService.getLastActiveFile(schemeFilter);
            // ...then for last active file root
            if (!candidate) {
                candidate = this.historyService.getLastActiveWorkspaceRoot(schemeFilter);
            }
            else {
                candidate = candidate && resources.dirname(candidate);
            }
            return candidate || undefined;
        }
        defaultFolderPath(schemeFilter = this.getSchemeFilterForWindow()) {
            // Check for last active file root first...
            let candidate = this.historyService.getLastActiveWorkspaceRoot(schemeFilter);
            // ...then for last active file
            if (!candidate) {
                candidate = this.historyService.getLastActiveFile(schemeFilter);
            }
            return candidate && resources.dirname(candidate) || undefined;
        }
        defaultWorkspacePath(schemeFilter = this.getSchemeFilterForWindow()) {
            // Check for current workspace config file first...
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                const configuration = this.contextService.getWorkspace().configuration;
                if (configuration && !isUntitledWorkspace(configuration, this.environmentService)) {
                    return resources.dirname(configuration) || undefined;
                }
            }
            // ...then fallback to default file path
            return this.defaultFilePath(schemeFilter);
        }
        toNativeOpenDialogOptions(options) {
            return {
                forceNewWindow: options.forceNewWindow,
                telemetryExtraData: options.telemetryExtraData,
                defaultPath: options.defaultUri && options.defaultUri.fsPath
            };
        }
        shouldUseSimplified(schema) {
            const setting = this.configurationService.getValue('files.simpleDialog.enable');
            return (schema !== network_1.Schemas.file) || (setting === true);
        }
        addFileSchemaIfNeeded(schema) {
            // Include File schema unless the schema is web
            // Don't allow untitled schema through.
            if (platform_1.isWeb) {
                return schema === network_1.Schemas.untitled ? [network_1.Schemas.file] : [schema];
            }
            else {
                return schema === network_1.Schemas.untitled ? [network_1.Schemas.file] : (schema !== network_1.Schemas.file ? [schema, network_1.Schemas.file] : [schema]);
            }
        }
        pickFileFolderAndOpen(options) {
            return __awaiter(this, void 0, void 0, function* () {
                const schema = this.getFileSystemSchema(options);
                if (!options.defaultUri) {
                    options.defaultUri = this.defaultFilePath(schema);
                }
                if (this.shouldUseSimplified(schema)) {
                    const title = nls.localize('openFileOrFolder.title', 'Open File Or Folder');
                    const availableFileSystems = this.addFileSchemaIfNeeded(schema);
                    const uri = yield this.pickRemoteResource({ canSelectFiles: true, canSelectFolders: true, canSelectMany: false, defaultUri: options.defaultUri, title, availableFileSystems });
                    if (uri) {
                        const stat = yield this.fileService.resolve(uri);
                        const toOpen = stat.isDirectory ? { folderUri: uri } : { fileUri: uri };
                        return this.windowService.openWindow([toOpen], { forceNewWindow: options.forceNewWindow });
                    }
                    return;
                }
                return this.windowService.pickFileFolderAndOpen(this.toNativeOpenDialogOptions(options));
            });
        }
        pickFileAndOpen(options) {
            return __awaiter(this, void 0, void 0, function* () {
                const schema = this.getFileSystemSchema(options);
                if (!options.defaultUri) {
                    options.defaultUri = this.defaultFilePath(schema);
                }
                if (this.shouldUseSimplified(schema)) {
                    const title = nls.localize('openFile.title', 'Open File');
                    const availableFileSystems = this.addFileSchemaIfNeeded(schema);
                    const uri = yield this.pickRemoteResource({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, defaultUri: options.defaultUri, title, availableFileSystems });
                    if (uri) {
                        return this.windowService.openWindow([{ fileUri: uri }], { forceNewWindow: options.forceNewWindow });
                    }
                    return;
                }
                return this.windowService.pickFileAndOpen(this.toNativeOpenDialogOptions(options));
            });
        }
        pickFolderAndOpen(options) {
            return __awaiter(this, void 0, void 0, function* () {
                const schema = this.getFileSystemSchema(options);
                if (!options.defaultUri) {
                    options.defaultUri = this.defaultFolderPath(schema);
                }
                if (this.shouldUseSimplified(schema)) {
                    const title = nls.localize('openFolder.title', 'Open Folder');
                    const availableFileSystems = this.addFileSchemaIfNeeded(schema);
                    const uri = yield this.pickRemoteResource({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false, defaultUri: options.defaultUri, title, availableFileSystems });
                    if (uri) {
                        return this.windowService.openWindow([{ folderUri: uri }], { forceNewWindow: options.forceNewWindow });
                    }
                    return;
                }
                return this.windowService.pickFolderAndOpen(this.toNativeOpenDialogOptions(options));
            });
        }
        pickWorkspaceAndOpen(options) {
            return __awaiter(this, void 0, void 0, function* () {
                const schema = this.getFileSystemSchema(options);
                if (!options.defaultUri) {
                    options.defaultUri = this.defaultWorkspacePath(schema);
                }
                if (this.shouldUseSimplified(schema)) {
                    const title = nls.localize('openWorkspace.title', 'Open Workspace');
                    const filters = [{ name: nls.localize('filterName.workspace', 'Workspace'), extensions: [workspaces_1.WORKSPACE_EXTENSION] }];
                    const availableFileSystems = this.addFileSchemaIfNeeded(schema);
                    const uri = yield this.pickRemoteResource({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, defaultUri: options.defaultUri, title, filters, availableFileSystems });
                    if (uri) {
                        return this.windowService.openWindow([{ workspaceUri: uri }], { forceNewWindow: options.forceNewWindow });
                    }
                    return;
                }
                return this.windowService.pickWorkspaceAndOpen(this.toNativeOpenDialogOptions(options));
            });
        }
        pickFileToSave(options) {
            return __awaiter(this, void 0, void 0, function* () {
                const schema = this.getFileSystemSchema(options);
                if (this.shouldUseSimplified(schema)) {
                    if (!options.availableFileSystems) {
                        options.availableFileSystems = this.addFileSchemaIfNeeded(schema);
                    }
                    options.title = nls.localize('saveFileAs.title', 'Save As');
                    return this.saveRemoteResource(options);
                }
                const result = yield this.windowService.showSaveDialog(this.toNativeSaveDialogOptions(options));
                if (result) {
                    return uri_1.URI.file(result);
                }
                return;
            });
        }
        toNativeSaveDialogOptions(options) {
            options.defaultUri = options.defaultUri ? uri_1.URI.file(options.defaultUri.path) : undefined;
            return {
                defaultPath: options.defaultUri && options.defaultUri.fsPath,
                buttonLabel: options.saveLabel,
                filters: options.filters,
                title: options.title
            };
        }
        showSaveDialog(options) {
            return __awaiter(this, void 0, void 0, function* () {
                const schema = this.getFileSystemSchema(options);
                if (this.shouldUseSimplified(schema)) {
                    if (!options.availableFileSystems) {
                        options.availableFileSystems = this.addFileSchemaIfNeeded(schema);
                    }
                    return this.saveRemoteResource(options);
                }
                const result = yield this.windowService.showSaveDialog(this.toNativeSaveDialogOptions(options));
                if (result) {
                    return uri_1.URI.file(result);
                }
                return;
            });
        }
        showOpenDialog(options) {
            return __awaiter(this, void 0, void 0, function* () {
                const schema = this.getFileSystemSchema(options);
                if (this.shouldUseSimplified(schema)) {
                    if (!options.availableFileSystems) {
                        options.availableFileSystems = this.addFileSchemaIfNeeded(schema);
                    }
                    const uri = yield this.pickRemoteResource(options);
                    return uri ? [uri] : undefined;
                }
                const defaultUri = options.defaultUri;
                const newOptions = {
                    title: options.title,
                    defaultPath: defaultUri && defaultUri.fsPath,
                    buttonLabel: options.openLabel,
                    filters: options.filters,
                    properties: []
                };
                newOptions.properties.push('createDirectory');
                if (options.canSelectFiles) {
                    newOptions.properties.push('openFile');
                }
                if (options.canSelectFolders) {
                    newOptions.properties.push('openDirectory');
                }
                if (options.canSelectMany) {
                    newOptions.properties.push('multiSelections');
                }
                const result = yield this.windowService.showOpenDialog(newOptions);
                return result ? result.map(uri_1.URI.file) : undefined;
            });
        }
        pickRemoteResource(options) {
            const remoteFileDialog = this.instantiationService.createInstance(remoteFileDialog_1.RemoteFileDialog);
            return remoteFileDialog.showOpenDialog(options);
        }
        saveRemoteResource(options) {
            const remoteFileDialog = this.instantiationService.createInstance(remoteFileDialog_1.RemoteFileDialog);
            return remoteFileDialog.showSaveDialog(options);
        }
        getSchemeFilterForWindow() {
            return !this.environmentService.configuration.remoteAuthority ? network_1.Schemas.file : remoteHosts_1.REMOTE_HOST_SCHEME;
        }
        getFileSystemSchema(options) {
            return options.availableFileSystems && options.availableFileSystems[0] || this.getSchemeFilterForWindow();
        }
    };
    FileDialogService = __decorate([
        __param(0, windows_1.IWindowService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, history_1.IHistoryService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, files_1.IFileService)
    ], FileDialogService);
    exports.FileDialogService = FileDialogService;
    function isUntitledWorkspace(path, environmentService) {
        return resources.isEqualOrParent(path, environmentService.untitledWorkspacesHome);
    }
    extensions_1.registerSingleton(dialogs_1.IFileDialogService, FileDialogService, true);
});
//# sourceMappingURL=fileDialogService.js.map