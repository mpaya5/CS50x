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
define(["require", "exports", "vs/platform/files/common/files", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/errors"], function (require, exports, files_1, event_1, lifecycle_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FetchFileSystemProvider {
        constructor() {
            this.capabilities = 2048 /* Readonly */ + 2 /* FileReadWrite */ + 1024 /* PathCaseSensitive */;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.onDidChangeFile = event_1.Event.None;
        }
        // working implementations
        readFile(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const res = yield fetch(resource.toString(true));
                    if (res.status === 200) {
                        return new Uint8Array(yield res.arrayBuffer());
                    }
                    throw new files_1.FileSystemProviderError(res.statusText, files_1.FileSystemProviderErrorCode.Unknown);
                }
                catch (err) {
                    throw new files_1.FileSystemProviderError(err, files_1.FileSystemProviderErrorCode.Unknown);
                }
            });
        }
        // fake implementations
        stat(_resource) {
            return __awaiter(this, void 0, void 0, function* () {
                return {
                    type: files_1.FileType.File,
                    size: 0,
                    mtime: 0,
                    ctime: 0
                };
            });
        }
        watch() {
            return lifecycle_1.Disposable.None;
        }
        // error implementations
        writeFile(_resource, _content, _opts) {
            throw new errors_1.NotImplementedError();
        }
        readdir(_resource) {
            throw new errors_1.NotImplementedError();
        }
        mkdir(_resource) {
            throw new errors_1.NotImplementedError();
        }
        delete(_resource, _opts) {
            throw new errors_1.NotImplementedError();
        }
        rename(_from, _to, _opts) {
            throw new errors_1.NotImplementedError();
        }
    }
    exports.FetchFileSystemProvider = FetchFileSystemProvider;
});
//# sourceMappingURL=webWorkerFileSystemProvider.js.map