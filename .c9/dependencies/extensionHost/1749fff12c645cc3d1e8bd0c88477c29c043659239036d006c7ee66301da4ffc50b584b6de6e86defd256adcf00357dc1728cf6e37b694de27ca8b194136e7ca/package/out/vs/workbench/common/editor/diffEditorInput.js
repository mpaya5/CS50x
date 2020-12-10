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
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/common/editor/textEditorModel", "vs/workbench/common/editor/diffEditorModel", "vs/workbench/common/editor/textDiffEditorModel"], function (require, exports, editor_1, textEditorModel_1, diffEditorModel_1, textDiffEditorModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The base editor input for the diff editor. It is made up of two editor inputs, the original version
     * and the modified version.
     */
    class DiffEditorInput extends editor_1.SideBySideEditorInput {
        constructor(name, description, original, modified, forceOpenAsBinary) {
            super(name, description, original, modified);
            this.forceOpenAsBinary = forceOpenAsBinary;
        }
        getTypeId() {
            return DiffEditorInput.ID;
        }
        get originalInput() {
            return this.details;
        }
        get modifiedInput() {
            return this.master;
        }
        resolve() {
            return __awaiter(this, void 0, void 0, function* () {
                // Create Model - we never reuse our cached model if refresh is true because we cannot
                // decide for the inputs within if the cached model can be reused or not. There may be
                // inputs that need to be loaded again and thus we always recreate the model and dispose
                // the previous one - if any.
                const resolvedModel = yield this.createModel();
                if (this.cachedModel) {
                    this.cachedModel.dispose();
                }
                this.cachedModel = resolvedModel;
                return this.cachedModel;
            });
        }
        getPreferredEditorId(candidates) {
            return this.forceOpenAsBinary ? editor_1.BINARY_DIFF_EDITOR_ID : editor_1.TEXT_DIFF_EDITOR_ID;
        }
        createModel() {
            return __awaiter(this, void 0, void 0, function* () {
                // Join resolve call over two inputs and build diff editor model
                const models = yield Promise.all([
                    this.originalInput.resolve(),
                    this.modifiedInput.resolve()
                ]);
                const originalEditorModel = models[0];
                const modifiedEditorModel = models[1];
                // If both are text models, return textdiffeditor model
                if (modifiedEditorModel instanceof textEditorModel_1.BaseTextEditorModel && originalEditorModel instanceof textEditorModel_1.BaseTextEditorModel) {
                    return new textDiffEditorModel_1.TextDiffEditorModel(originalEditorModel, modifiedEditorModel);
                }
                // Otherwise return normal diff model
                return new diffEditorModel_1.DiffEditorModel(originalEditorModel, modifiedEditorModel);
            });
        }
        dispose() {
            // Free the diff editor model but do not propagate the dispose() call to the two inputs
            // We never created the two inputs (original and modified) so we can not dispose
            // them without sideeffects.
            if (this.cachedModel) {
                this.cachedModel.dispose();
                this.cachedModel = null;
            }
            super.dispose();
        }
    }
    DiffEditorInput.ID = 'workbench.editors.diffEditorInput';
    exports.DiffEditorInput = DiffEditorInput;
});
//# sourceMappingURL=diffEditorInput.js.map