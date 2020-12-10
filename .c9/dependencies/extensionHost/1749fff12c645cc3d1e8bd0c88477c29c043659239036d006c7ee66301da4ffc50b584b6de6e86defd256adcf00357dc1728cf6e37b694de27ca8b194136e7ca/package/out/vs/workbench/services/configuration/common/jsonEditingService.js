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
define(["require", "exports", "vs/nls", "vs/base/common/json", "vs/base/common/strings", "vs/base/common/jsonEdit", "vs/base/common/async", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/editor/common/services/resolverService", "vs/workbench/services/configuration/common/jsonEditing", "vs/platform/instantiation/common/extensions"], function (require, exports, nls, json, strings, jsonEdit_1, async_1, editOperation_1, range_1, selection_1, textfiles_1, files_1, resolverService_1, jsonEditing_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let JSONEditingService = class JSONEditingService {
        constructor(fileService, textModelResolverService, textFileService) {
            this.fileService = fileService;
            this.textModelResolverService = textModelResolverService;
            this.textFileService = textFileService;
            this.queue = new async_1.Queue();
        }
        write(resource, value, save) {
            return Promise.resolve(this.queue.queue(() => this.doWriteConfiguration(resource, value, save))); // queue up writes to prevent race conditions
        }
        doWriteConfiguration(resource, value, save) {
            return __awaiter(this, void 0, void 0, function* () {
                const reference = yield this.resolveAndValidate(resource, save);
                yield this.writeToBuffer(reference.object.textEditorModel, value);
                reference.dispose();
            });
        }
        writeToBuffer(model, value) {
            return __awaiter(this, void 0, void 0, function* () {
                const edit = this.getEdits(model, value)[0];
                if (this.applyEditsToBuffer(edit, model)) {
                    return this.textFileService.save(model.uri);
                }
            });
        }
        applyEditsToBuffer(edit, model) {
            const startPosition = model.getPositionAt(edit.offset);
            const endPosition = model.getPositionAt(edit.offset + edit.length);
            const range = new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column);
            let currentText = model.getValueInRange(range);
            if (edit.content !== currentText) {
                const editOperation = currentText ? editOperation_1.EditOperation.replace(range, edit.content) : editOperation_1.EditOperation.insert(startPosition, edit.content);
                model.pushEditOperations([new selection_1.Selection(startPosition.lineNumber, startPosition.column, startPosition.lineNumber, startPosition.column)], [editOperation], () => []);
                return true;
            }
            return false;
        }
        getEdits(model, configurationValue) {
            const { tabSize, insertSpaces } = model.getOptions();
            const eol = model.getEOL();
            const { key, value } = configurationValue;
            // Without key, the entire settings file is being replaced, so we just use JSON.stringify
            if (!key) {
                const content = JSON.stringify(value, null, insertSpaces ? strings.repeat(' ', tabSize) : '\t');
                return [{
                        content,
                        length: content.length,
                        offset: 0
                    }];
            }
            return jsonEdit_1.setProperty(model.getValue(), [key], value, { tabSize, insertSpaces, eol });
        }
        resolveModelReference(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                const exists = yield this.fileService.exists(resource);
                if (!exists) {
                    yield this.textFileService.write(resource, '{}', { encoding: 'utf8' });
                }
                return this.textModelResolverService.createModelReference(resource);
            });
        }
        hasParseErrors(model) {
            const parseErrors = [];
            json.parse(model.getValue(), parseErrors);
            return parseErrors.length > 0;
        }
        resolveAndValidate(resource, checkDirty) {
            return __awaiter(this, void 0, void 0, function* () {
                const reference = yield this.resolveModelReference(resource);
                const model = reference.object.textEditorModel;
                if (this.hasParseErrors(model)) {
                    return this.reject(1 /* ERROR_INVALID_FILE */);
                }
                // Target cannot be dirty if not writing into buffer
                if (checkDirty && this.textFileService.isDirty(resource)) {
                    return this.reject(0 /* ERROR_FILE_DIRTY */);
                }
                return reference;
            });
        }
        reject(code) {
            const message = this.toErrorMessage(code);
            return Promise.reject(new jsonEditing_1.JSONEditingError(message, code));
        }
        toErrorMessage(error) {
            switch (error) {
                // User issues
                case 1 /* ERROR_INVALID_FILE */: {
                    return nls.localize('errorInvalidFile', "Unable to write into the file. Please open the file to correct errors/warnings in the file and try again.");
                }
                case 0 /* ERROR_FILE_DIRTY */: {
                    return nls.localize('errorFileDirty', "Unable to write into the file because the file is dirty. Please save the file and try again.");
                }
            }
        }
    };
    JSONEditingService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, resolverService_1.ITextModelService),
        __param(2, textfiles_1.ITextFileService)
    ], JSONEditingService);
    exports.JSONEditingService = JSONEditingService;
    extensions_1.registerSingleton(jsonEditing_1.IJSONEditingService, JSONEditingService, true);
});
//# sourceMappingURL=jsonEditingService.js.map