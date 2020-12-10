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
define(["require", "exports", "vs/nls", "vs/base/common/decorators", "vs/base/common/resources", "vs/workbench/common/editor", "vs/workbench/common/editor/binaryEditorModel", "vs/workbench/services/textfile/common/textfiles", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/resolverService", "vs/workbench/contrib/files/common/files", "vs/platform/label/common/label"], function (require, exports, nls_1, decorators_1, resources_1, editor_1, binaryEditorModel_1, textfiles_1, instantiation_1, resolverService_1, files_1, label_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ForceOpenAs;
    (function (ForceOpenAs) {
        ForceOpenAs[ForceOpenAs["None"] = 0] = "None";
        ForceOpenAs[ForceOpenAs["Text"] = 1] = "Text";
        ForceOpenAs[ForceOpenAs["Binary"] = 2] = "Binary";
    })(ForceOpenAs || (ForceOpenAs = {}));
    /**
     * A file editor input is the input type for the file editor of file system resources.
     */
    let FileEditorInput = class FileEditorInput extends editor_1.EditorInput {
        /**
         * An editor input who's contents are retrieved from file services.
         */
        constructor(resource, preferredEncoding, preferredMode, instantiationService, textFileService, textModelResolverService, labelService) {
            super();
            this.resource = resource;
            this.instantiationService = instantiationService;
            this.textFileService = textFileService;
            this.textModelResolverService = textModelResolverService;
            this.labelService = labelService;
            this.forceOpenAs = 0 /* None */;
            if (preferredEncoding) {
                this.setPreferredEncoding(preferredEncoding);
            }
            if (preferredMode) {
                this.setPreferredMode(preferredMode);
            }
            this.registerListeners();
        }
        registerListeners() {
            // Model changes
            this._register(this.textFileService.models.onModelDirty(e => this.onDirtyStateChange(e)));
            this._register(this.textFileService.models.onModelSaveError(e => this.onDirtyStateChange(e)));
            this._register(this.textFileService.models.onModelSaved(e => this.onDirtyStateChange(e)));
            this._register(this.textFileService.models.onModelReverted(e => this.onDirtyStateChange(e)));
            this._register(this.textFileService.models.onModelOrphanedChanged(e => this.onModelOrphanedChanged(e)));
        }
        onDirtyStateChange(e) {
            if (e.resource.toString() === this.resource.toString()) {
                this._onDidChangeDirty.fire();
            }
        }
        onModelOrphanedChanged(e) {
            if (e.resource.toString() === this.resource.toString()) {
                this._onDidChangeLabel.fire();
            }
        }
        getResource() {
            return this.resource;
        }
        getEncoding() {
            const textModel = this.textFileService.models.get(this.resource);
            if (textModel) {
                return textModel.getEncoding();
            }
            return this.preferredEncoding;
        }
        getPreferredEncoding() {
            return this.preferredEncoding;
        }
        setEncoding(encoding, mode) {
            this.setPreferredEncoding(encoding);
            const textModel = this.textFileService.models.get(this.resource);
            if (textModel) {
                textModel.setEncoding(encoding, mode);
            }
        }
        setPreferredEncoding(encoding) {
            this.preferredEncoding = encoding;
            this.forceOpenAs = 1 /* Text */; // encoding is a good hint to open the file as text
        }
        getPreferredMode() {
            return this.preferredMode;
        }
        setMode(mode) {
            this.setPreferredMode(mode);
            const textModel = this.textFileService.models.get(this.resource);
            if (textModel) {
                textModel.setMode(mode);
            }
        }
        setPreferredMode(mode) {
            this.preferredMode = mode;
            this.forceOpenAs = 1 /* Text */; // mode is a good hint to open the file as text
        }
        setForceOpenAsText() {
            this.forceOpenAs = 1 /* Text */;
        }
        setForceOpenAsBinary() {
            this.forceOpenAs = 2 /* Binary */;
        }
        getTypeId() {
            return files_1.FILE_EDITOR_INPUT_ID;
        }
        getName() {
            if (!this.name) {
                this.name = this.labelService.getUriBasenameLabel(this.resource);
            }
            return this.decorateLabel(this.name);
        }
        get shortDescription() {
            return this.labelService.getUriBasenameLabel(resources_1.dirname(this.resource));
        }
        get mediumDescription() {
            return this.labelService.getUriLabel(resources_1.dirname(this.resource), { relative: true });
        }
        get longDescription() {
            return this.labelService.getUriLabel(resources_1.dirname(this.resource));
        }
        getDescription(verbosity = 1 /* MEDIUM */) {
            let description;
            switch (verbosity) {
                case 0 /* SHORT */:
                    description = this.shortDescription;
                    break;
                case 2 /* LONG */:
                    description = this.longDescription;
                    break;
                case 1 /* MEDIUM */:
                default:
                    description = this.mediumDescription;
                    break;
            }
            return description;
        }
        get shortTitle() {
            return this.getName();
        }
        get mediumTitle() {
            return this.labelService.getUriLabel(this.resource, { relative: true });
        }
        get longTitle() {
            return this.labelService.getUriLabel(this.resource);
        }
        getTitle(verbosity) {
            let title;
            switch (verbosity) {
                case 0 /* SHORT */:
                    title = this.shortTitle;
                    // already decorated by getName()
                    break;
                default:
                case 1 /* MEDIUM */:
                    title = this.mediumTitle;
                    title = this.decorateLabel(title);
                    break;
                case 2 /* LONG */:
                    title = this.longTitle;
                    title = this.decorateLabel(title);
                    break;
            }
            return title;
        }
        decorateLabel(label) {
            const model = this.textFileService.models.get(this.resource);
            if (model && model.hasState(5 /* ORPHAN */)) {
                return nls_1.localize('orphanedFile', "{0} (deleted)", label);
            }
            if (model && model.isReadonly()) {
                return nls_1.localize('readonlyFile', "{0} (read-only)", label);
            }
            return label;
        }
        isDirty() {
            const model = this.textFileService.models.get(this.resource);
            if (!model) {
                return false;
            }
            if (model.hasState(4 /* CONFLICT */) || model.hasState(6 /* ERROR */)) {
                return true; // always indicate dirty state if we are in conflict or error state
            }
            if (this.textFileService.getAutoSaveMode() === 1 /* AFTER_SHORT_DELAY */) {
                return false; // fast auto save enabled so we do not declare dirty
            }
            return model.isDirty();
        }
        confirmSave() {
            return this.textFileService.confirmSave([this.resource]);
        }
        save() {
            return this.textFileService.save(this.resource);
        }
        revert(options) {
            return this.textFileService.revert(this.resource, options);
        }
        getPreferredEditorId(candidates) {
            return this.forceOpenAs === 2 /* Binary */ ? files_1.BINARY_FILE_EDITOR_ID : files_1.TEXT_FILE_EDITOR_ID;
        }
        resolve() {
            // Resolve as binary
            if (this.forceOpenAs === 2 /* Binary */) {
                return this.doResolveAsBinary();
            }
            // Resolve as text
            return this.doResolveAsText();
        }
        doResolveAsText() {
            return __awaiter(this, void 0, void 0, function* () {
                // Resolve as text
                try {
                    yield this.textFileService.models.loadOrCreate(this.resource, {
                        mode: this.preferredMode,
                        encoding: this.preferredEncoding,
                        reload: { async: true },
                        allowBinary: this.forceOpenAs === 1 /* Text */,
                        reason: 1 /* EDITOR */
                    });
                    // This is a bit ugly, because we first resolve the model and then resolve a model reference. the reason being that binary
                    // or very large files do not resolve to a text file model but should be opened as binary files without text. First calling into
                    // loadOrCreate ensures we are not creating model references for these kind of resources.
                    // In addition we have a bit of payload to take into account (encoding, reload) that the text resolver does not handle yet.
                    if (!this.textModelReference) {
                        this.textModelReference = this.textModelResolverService.createModelReference(this.resource);
                    }
                    const ref = yield this.textModelReference;
                    return ref.object;
                }
                catch (error) {
                    // In case of an error that indicates that the file is binary or too large, just return with the binary editor model
                    if (error.textFileOperationResult === 0 /* FILE_IS_BINARY */ ||
                        error.fileOperationResult === 7 /* FILE_TOO_LARGE */) {
                        return this.doResolveAsBinary();
                    }
                    // Bubble any other error up
                    throw error;
                }
            });
        }
        doResolveAsBinary() {
            return __awaiter(this, void 0, void 0, function* () {
                return this.instantiationService.createInstance(binaryEditorModel_1.BinaryEditorModel, this.resource, this.getName()).load();
            });
        }
        isResolved() {
            return !!this.textFileService.models.get(this.resource);
        }
        dispose() {
            // Model reference
            if (this.textModelReference) {
                this.textModelReference.then(ref => ref.dispose());
                this.textModelReference = null;
            }
            super.dispose();
        }
        matches(otherInput) {
            if (super.matches(otherInput) === true) {
                return true;
            }
            if (otherInput) {
                return otherInput instanceof FileEditorInput && otherInput.resource.toString() === this.resource.toString();
            }
            return false;
        }
    };
    __decorate([
        decorators_1.memoize
    ], FileEditorInput.prototype, "shortTitle", null);
    __decorate([
        decorators_1.memoize
    ], FileEditorInput.prototype, "mediumTitle", null);
    __decorate([
        decorators_1.memoize
    ], FileEditorInput.prototype, "longTitle", null);
    FileEditorInput = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, resolverService_1.ITextModelService),
        __param(6, label_1.ILabelService)
    ], FileEditorInput);
    exports.FileEditorInput = FileEditorInput;
});
//# sourceMappingURL=fileEditorInput.js.map