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
define(["require", "exports", "vs/nls", "vs/workbench/browser/parts/editor/binaryEditor", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/workbench/contrib/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/platform/storage/common/storage", "vs/workbench/services/environment/common/environmentService", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener"], function (require, exports, nls, binaryEditor_1, telemetry_1, themeService_1, fileEditorInput_1, files_1, editorService_1, storage_1, environmentService_1, files_2, instantiation_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * An implementation of editor for binary files like images.
     */
    let BinaryFileEditor = class BinaryFileEditor extends binaryEditor_1.BaseBinaryResourceEditor {
        constructor(telemetryService, themeService, openerService, editorService, storageService, fileService, environmentService, instantiationService) {
            super(BinaryFileEditor.ID, {
                openInternal: (input, options) => this.openInternal(input, options),
                openExternal: resource => this.openerService.open(resource, { openExternal: true })
            }, telemetryService, themeService, fileService, environmentService, storageService, instantiationService);
            this.openerService = openerService;
            this.editorService = editorService;
        }
        openInternal(input, options) {
            return __awaiter(this, void 0, void 0, function* () {
                if (input instanceof fileEditorInput_1.FileEditorInput) {
                    input.setForceOpenAsText();
                    yield this.editorService.openEditor(input, options, this.group);
                }
            });
        }
        getTitle() {
            return this.input ? this.input.getName() : nls.localize('binaryFileEditor', "Binary File Viewer");
        }
    };
    BinaryFileEditor.ID = files_1.BINARY_FILE_EDITOR_ID;
    BinaryFileEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, opener_1.IOpenerService),
        __param(3, editorService_1.IEditorService),
        __param(4, storage_1.IStorageService),
        __param(5, files_2.IFileService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService),
        __param(7, instantiation_1.IInstantiationService)
    ], BinaryFileEditor);
    exports.BinaryFileEditor = BinaryFileEditor;
});
//# sourceMappingURL=binaryFileEditor.js.map