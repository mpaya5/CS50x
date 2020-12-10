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
define(["require", "exports", "vs/workbench/common/editor/diffEditorModel"], function (require, exports, diffEditorModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The base text editor model for the diff editor. It is made up of two text editor models, the original version
     * and the modified version.
     */
    class TextDiffEditorModel extends diffEditorModel_1.DiffEditorModel {
        constructor(originalModel, modifiedModel) {
            super(originalModel, modifiedModel);
            this.updateTextDiffEditorModel();
        }
        get originalModel() {
            return this._originalModel;
        }
        get modifiedModel() {
            return this._modifiedModel;
        }
        load() {
            const _super = Object.create(null, {
                load: { get: () => super.load }
            });
            return __awaiter(this, void 0, void 0, function* () {
                yield _super.load.call(this);
                this.updateTextDiffEditorModel();
                return this;
            });
        }
        updateTextDiffEditorModel() {
            if (this.originalModel.isResolved() && this.modifiedModel.isResolved()) {
                // Create new
                if (!this._textDiffEditorModel) {
                    this._textDiffEditorModel = {
                        original: this.originalModel.textEditorModel,
                        modified: this.modifiedModel.textEditorModel
                    };
                }
                // Update existing
                else {
                    this._textDiffEditorModel.original = this.originalModel.textEditorModel;
                    this._textDiffEditorModel.modified = this.modifiedModel.textEditorModel;
                }
            }
        }
        get textDiffEditorModel() {
            return this._textDiffEditorModel;
        }
        isResolved() {
            return !!this._textDiffEditorModel;
        }
        isReadonly() {
            return this.modifiedModel.isReadonly();
        }
        dispose() {
            // Free the diff editor model but do not propagate the dispose() call to the two models
            // inside. We never created the two models (original and modified) so we can not dispose
            // them without sideeffects. Rather rely on the models getting disposed when their related
            // inputs get disposed from the diffEditorInput.
            this._textDiffEditorModel = null;
            super.dispose();
        }
    }
    exports.TextDiffEditorModel = TextDiffEditorModel;
});
//# sourceMappingURL=textDiffEditorModel.js.map