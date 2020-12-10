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
define(["require", "exports", "vs/workbench/common/editor", "vs/platform/files/common/files", "vs/base/common/network", "vs/base/common/resources"], function (require, exports, editor_1, files_1, network_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * An editor model that just represents a resource that can be loaded.
     */
    let BinaryEditorModel = class BinaryEditorModel extends editor_1.EditorModel {
        constructor(resource, name, fileService) {
            super();
            this.resource = resource;
            this.name = name;
            this.fileService = fileService;
            this.resource = resource;
            this.name = name;
            if (resource.scheme === network_1.Schemas.data) {
                const metadata = resources_1.DataUri.parseMetaData(resource);
                if (metadata.has(resources_1.DataUri.META_DATA_SIZE)) {
                    this.size = Number(metadata.get(resources_1.DataUri.META_DATA_SIZE));
                }
                this.mime = metadata.get(resources_1.DataUri.META_DATA_MIME);
            }
        }
        /**
         * The name of the binary resource.
         */
        getName() {
            return this.name;
        }
        /**
         * The resource of the binary resource.
         */
        getResource() {
            return this.resource;
        }
        /**
         * The size of the binary resource if known.
         */
        getSize() {
            return this.size;
        }
        /**
         * The mime of the binary resource if known.
         */
        getMime() {
            return this.mime;
        }
        /**
         * The etag of the binary resource if known.
         */
        getETag() {
            return this.etag;
        }
        load() {
            return __awaiter(this, void 0, void 0, function* () {
                // Make sure to resolve up to date stat for file resources
                if (this.fileService.canHandleResource(this.resource)) {
                    const stat = yield this.fileService.resolve(this.resource, { resolveMetadata: true });
                    this.etag = stat.etag;
                    if (typeof stat.size === 'number') {
                        this.size = stat.size;
                    }
                }
                return this;
            });
        }
    };
    BinaryEditorModel = __decorate([
        __param(2, files_1.IFileService)
    ], BinaryEditorModel);
    exports.BinaryEditorModel = BinaryEditorModel;
});
//# sourceMappingURL=binaryEditorModel.js.map