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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/common/editor/binaryEditorModel", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/workbench/browser/parts/editor/resourceViewer", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/workbench/services/environment/common/environmentService", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls, event_1, baseEditor_1, binaryEditorModel_1, scrollableElement_1, resourceViewer_1, dom_1, lifecycle_1, storage_1, environmentService_1, files_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /*
     * This class is only intended to be subclassed and not instantiated.
     */
    let BaseBinaryResourceEditor = class BaseBinaryResourceEditor extends baseEditor_1.BaseEditor {
        constructor(id, callbacks, telemetryService, themeService, fileService, environmentService, storageService, instantiationService) {
            super(id, telemetryService, themeService, storageService);
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.instantiationService = instantiationService;
            this._onMetadataChanged = this._register(new event_1.Emitter());
            this.onMetadataChanged = this._onMetadataChanged.event;
            this._onDidOpenInPlace = this._register(new event_1.Emitter());
            this.onDidOpenInPlace = this._onDidOpenInPlace.event;
            this.callbacks = callbacks;
        }
        getTitle() {
            return this.input ? this.input.getName() : nls.localize('binaryEditor', "Binary Viewer");
        }
        createEditor(parent) {
            // Container for Binary
            this.binaryContainer = document.createElement('div');
            this.binaryContainer.className = 'binary-container';
            this.binaryContainer.style.outline = 'none';
            this.binaryContainer.tabIndex = 0; // enable focus support from the editor part (do not remove)
            // Custom Scrollbars
            this.scrollbar = this._register(new scrollableElement_1.DomScrollableElement(this.binaryContainer, { horizontal: 1 /* Auto */, vertical: 1 /* Auto */ }));
            parent.appendChild(this.scrollbar.getDomNode());
        }
        setInput(input, options, token) {
            const _super = Object.create(null, {
                setInput: { get: () => super.setInput }
            });
            return __awaiter(this, void 0, void 0, function* () {
                yield _super.setInput.call(this, input, options, token);
                const model = yield input.resolve();
                // Check for cancellation
                if (token.isCancellationRequested) {
                    return;
                }
                // Assert Model instance
                if (!(model instanceof binaryEditorModel_1.BinaryEditorModel)) {
                    throw new Error('Unable to open file as binary');
                }
                // Render Input
                if (this.resourceViewerContext) {
                    this.resourceViewerContext.dispose();
                }
                this.resourceViewerContext = resourceViewer_1.ResourceViewer.show({ name: model.getName(), resource: model.getResource(), size: model.getSize(), etag: model.getETag(), mime: model.getMime() }, this.fileService, this.binaryContainer, this.scrollbar, {
                    openInternalClb: () => this.handleOpenInternalCallback(input, options),
                    openExternalClb: this.environmentService.configuration.remoteAuthority ? undefined : resource => this.callbacks.openExternal(resource),
                    metadataClb: meta => this.handleMetadataChanged(meta)
                }, this.instantiationService);
            });
        }
        handleOpenInternalCallback(input, options) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.callbacks.openInternal(input, options);
                // Signal to listeners that the binary editor has been opened in-place
                this._onDidOpenInPlace.fire();
            });
        }
        handleMetadataChanged(meta) {
            this.metadata = meta;
            this._onMetadataChanged.fire();
        }
        getMetadata() {
            return this.metadata;
        }
        clearInput() {
            // Clear Meta
            this.handleMetadataChanged(undefined);
            // Clear Resource Viewer
            dom_1.clearNode(this.binaryContainer);
            lifecycle_1.dispose(this.resourceViewerContext);
            this.resourceViewerContext = undefined;
            super.clearInput();
        }
        layout(dimension) {
            // Pass on to Binary Container
            dom_1.size(this.binaryContainer, dimension.width, dimension.height);
            this.scrollbar.scanDomNode();
            if (this.resourceViewerContext && this.resourceViewerContext.layout) {
                this.resourceViewerContext.layout(dimension);
            }
        }
        focus() {
            this.binaryContainer.focus();
        }
        dispose() {
            this.binaryContainer.remove();
            lifecycle_1.dispose(this.resourceViewerContext);
            this.resourceViewerContext = undefined;
            super.dispose();
        }
    };
    BaseBinaryResourceEditor = __decorate([
        __param(4, files_1.IFileService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, storage_1.IStorageService),
        __param(7, instantiation_1.IInstantiationService)
    ], BaseBinaryResourceEditor);
    exports.BaseBinaryResourceEditor = BaseBinaryResourceEditor;
});
//# sourceMappingURL=binaryEditor.js.map