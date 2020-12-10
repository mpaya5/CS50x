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
define(["require", "exports", "vs/workbench/common/editor", "vs/platform/files/common/files", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/workbench/services/textfile/common/textfiles", "vs/platform/contextkey/common/contextkeys", "vs/platform/registry/common/platform", "vs/workbench/common/views", "vs/base/common/network", "vs/platform/instantiation/common/instantiation", "vs/base/common/functional"], function (require, exports, editor_1, files_1, contextkey_1, lifecycle_1, modelService_1, modeService_1, textfiles_1, contextkeys_1, platform_1, views_1, network_1, instantiation_1, functional_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Explorer viewlet id.
     */
    exports.VIEWLET_ID = 'workbench.view.explorer';
    /**
     * Explorer viewlet container.
     */
    exports.VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer(exports.VIEWLET_ID);
    exports.IExplorerService = instantiation_1.createDecorator('explorerService');
    /**
     * Context Keys to use with keybindings for the Explorer and Open Editors view
     */
    exports.ExplorerViewletVisibleContext = new contextkey_1.RawContextKey('explorerViewletVisible', true);
    exports.ExplorerFolderContext = new contextkey_1.RawContextKey('explorerResourceIsFolder', false);
    exports.ExplorerResourceReadonlyContext = new contextkey_1.RawContextKey('explorerResourceReadonly', false);
    exports.ExplorerResourceNotReadonlyContext = exports.ExplorerResourceReadonlyContext.toNegated();
    exports.ExplorerRootContext = new contextkey_1.RawContextKey('explorerResourceIsRoot', false);
    exports.ExplorerResourceCut = new contextkey_1.RawContextKey('explorerResourceCut', false);
    exports.ExplorerResourceMoveableToTrash = new contextkey_1.RawContextKey('explorerResourceMoveableToTrash', false);
    exports.FilesExplorerFocusedContext = new contextkey_1.RawContextKey('filesExplorerFocus', true);
    exports.OpenEditorsVisibleContext = new contextkey_1.RawContextKey('openEditorsVisible', false);
    exports.OpenEditorsFocusedContext = new contextkey_1.RawContextKey('openEditorsFocus', true);
    exports.ExplorerFocusedContext = new contextkey_1.RawContextKey('explorerViewletFocus', true);
    exports.FilesExplorerFocusCondition = contextkey_1.ContextKeyExpr.and(exports.ExplorerViewletVisibleContext, exports.FilesExplorerFocusedContext, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey));
    exports.ExplorerFocusCondition = contextkey_1.ContextKeyExpr.and(exports.ExplorerViewletVisibleContext, exports.ExplorerFocusedContext, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey));
    /**
     * Text file editor id.
     */
    exports.TEXT_FILE_EDITOR_ID = 'workbench.editors.files.textFileEditor';
    /**
     * File editor input id.
     */
    exports.FILE_EDITOR_INPUT_ID = 'workbench.editors.files.fileEditorInput';
    /**
     * Binary file editor id.
     */
    exports.BINARY_FILE_EDITOR_ID = 'workbench.editors.files.binaryFileEditor';
    exports.SortOrderConfiguration = {
        DEFAULT: 'default',
        MIXED: 'mixed',
        FILES_FIRST: 'filesFirst',
        TYPE: 'type',
        MODIFIED: 'modified'
    };
    let TextFileContentProvider = class TextFileContentProvider extends lifecycle_1.Disposable {
        constructor(textFileService, fileService, modeService, modelService) {
            super();
            this.textFileService = textFileService;
            this.fileService = fileService;
            this.modeService = modeService;
            this.modelService = modelService;
            this.fileWatcherDisposable = this._register(new lifecycle_1.MutableDisposable());
        }
        static open(resource, scheme, label, editorService, options) {
            return __awaiter(this, void 0, void 0, function* () {
                yield editorService.openEditor({
                    leftResource: TextFileContentProvider.resourceToTextFile(scheme, resource),
                    rightResource: resource,
                    label,
                    options
                });
            });
        }
        static resourceToTextFile(scheme, resource) {
            return resource.with({ scheme, query: JSON.stringify({ scheme: resource.scheme }) });
        }
        static textFileToResource(resource) {
            return resource.with({ scheme: JSON.parse(resource.query)['scheme'], query: null });
        }
        provideTextContent(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                const savedFileResource = TextFileContentProvider.textFileToResource(resource);
                // Make sure our text file is resolved up to date
                const codeEditorModel = yield this.resolveEditorModel(resource);
                // Make sure to keep contents up to date when it changes
                if (!this.fileWatcherDisposable.value) {
                    this.fileWatcherDisposable.value = this.fileService.onFileChanges(changes => {
                        if (changes.contains(savedFileResource, 0 /* UPDATED */)) {
                            this.resolveEditorModel(resource, false /* do not create if missing */); // update model when resource changes
                        }
                    });
                    if (codeEditorModel) {
                        functional_1.once(codeEditorModel.onWillDispose)(() => this.fileWatcherDisposable.clear());
                    }
                }
                return codeEditorModel;
            });
        }
        resolveEditorModel(resource, createAsNeeded = true) {
            return __awaiter(this, void 0, void 0, function* () {
                const savedFileResource = TextFileContentProvider.textFileToResource(resource);
                const content = yield this.textFileService.readStream(savedFileResource);
                let codeEditorModel = this.modelService.getModel(resource);
                if (codeEditorModel) {
                    this.modelService.updateModel(codeEditorModel, content.value);
                }
                else if (createAsNeeded) {
                    const textFileModel = this.modelService.getModel(savedFileResource);
                    let languageSelector;
                    if (textFileModel) {
                        languageSelector = this.modeService.create(textFileModel.getModeId());
                    }
                    else {
                        languageSelector = this.modeService.createByFilepathOrFirstLine(savedFileResource);
                    }
                    codeEditorModel = this.modelService.createModel(content.value, languageSelector, resource);
                }
                return codeEditorModel;
            });
        }
    };
    TextFileContentProvider = __decorate([
        __param(0, textfiles_1.ITextFileService),
        __param(1, files_1.IFileService),
        __param(2, modeService_1.IModeService),
        __param(3, modelService_1.IModelService)
    ], TextFileContentProvider);
    exports.TextFileContentProvider = TextFileContentProvider;
    class OpenEditor {
        constructor(_editor, _group) {
            this._editor = _editor;
            this._group = _group;
            // noop
        }
        get editor() {
            return this._editor;
        }
        get editorIndex() {
            return this._group.getIndexOfEditor(this.editor);
        }
        get group() {
            return this._group;
        }
        get groupId() {
            return this._group.id;
        }
        getId() {
            return `openeditor:${this.groupId}:${this.editorIndex}:${this.editor.getName()}:${this.editor.getDescription()}`;
        }
        isPreview() {
            return this._group.previewEditor === this.editor;
        }
        isUntitled() {
            return !!editor_1.toResource(this.editor, { supportSideBySide: editor_1.SideBySideEditor.MASTER, filterByScheme: network_1.Schemas.untitled });
        }
        isDirty() {
            return this.editor.isDirty();
        }
        getResource() {
            return editor_1.toResource(this.editor, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
        }
    }
    exports.OpenEditor = OpenEditor;
});
//# sourceMappingURL=files.js.map