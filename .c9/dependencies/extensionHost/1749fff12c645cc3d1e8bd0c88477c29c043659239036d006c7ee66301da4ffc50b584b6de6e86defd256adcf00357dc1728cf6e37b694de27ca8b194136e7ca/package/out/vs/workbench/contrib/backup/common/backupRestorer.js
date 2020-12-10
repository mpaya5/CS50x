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
define(["require", "exports", "vs/workbench/services/backup/common/backup", "vs/workbench/services/editor/common/editorService", "vs/base/common/network", "vs/platform/lifecycle/common/lifecycle", "vs/base/common/resources", "vs/workbench/services/environment/common/environmentService"], function (require, exports, backup_1, editorService_1, network_1, lifecycle_1, resources_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BackupRestorer = class BackupRestorer {
        constructor(editorService, backupFileService, lifecycleService, environmentService) {
            this.editorService = editorService;
            this.backupFileService = backupFileService;
            this.lifecycleService = lifecycleService;
            this.environmentService = environmentService;
            this.restoreBackups();
        }
        restoreBackups() {
            this.lifecycleService.when(3 /* Restored */).then(() => this.doRestoreBackups());
        }
        doRestoreBackups() {
            return __awaiter(this, void 0, void 0, function* () {
                // Find all files and untitled with backups
                const backups = yield this.backupFileService.getWorkspaceFileBackups();
                const unresolvedBackups = yield this.doResolveOpenedBackups(backups);
                // Some failed to restore or were not opened at all so we open and resolve them manually
                if (unresolvedBackups.length > 0) {
                    yield this.doOpenEditors(unresolvedBackups);
                    return this.doResolveOpenedBackups(unresolvedBackups);
                }
                return undefined;
            });
        }
        doResolveOpenedBackups(backups) {
            return __awaiter(this, void 0, void 0, function* () {
                const unresolvedBackups = [];
                yield Promise.all(backups.map((backup) => __awaiter(this, void 0, void 0, function* () {
                    const openedEditor = this.editorService.getOpened({ resource: backup });
                    if (openedEditor) {
                        try {
                            yield openedEditor.resolve(); // trigger load
                        }
                        catch (error) {
                            unresolvedBackups.push(backup); // ignore error and remember as unresolved
                        }
                    }
                    else {
                        unresolvedBackups.push(backup);
                    }
                })));
                return unresolvedBackups;
            });
        }
        doOpenEditors(resources) {
            return __awaiter(this, void 0, void 0, function* () {
                const hasOpenedEditors = this.editorService.visibleEditors.length > 0;
                const inputs = resources.map((resource, index) => this.resolveInput(resource, index, hasOpenedEditors));
                // Open all remaining backups as editors and resolve them to load their backups
                yield this.editorService.openEditors(inputs);
            });
        }
        resolveInput(resource, index, hasOpenedEditors) {
            const options = { pinned: true, preserveFocus: true, inactive: index > 0 || hasOpenedEditors };
            // this is a (weak) strategy to find out if the untitled input had
            // an associated file path or not by just looking at the path. and
            // if so, we must ensure to restore the local resource it had.
            if (resource.scheme === network_1.Schemas.untitled && !BackupRestorer.UNTITLED_REGEX.test(resource.path)) {
                return { resource: resources_1.toLocalResource(resource, this.environmentService.configuration.remoteAuthority), options, forceUntitled: true };
            }
            return { resource, options };
        }
    };
    BackupRestorer.UNTITLED_REGEX = /Untitled-\d+/;
    BackupRestorer = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, backup_1.IBackupFileService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService)
    ], BackupRestorer);
    exports.BackupRestorer = BackupRestorer;
});
//# sourceMappingURL=backupRestorer.js.map