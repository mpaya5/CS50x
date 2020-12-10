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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/platform/files/common/files"], function (require, exports, event_1, lifecycle_1, resources, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class File {
        constructor(name) {
            this.type = files_1.FileType.File;
            this.ctime = Date.now();
            this.mtime = Date.now();
            this.size = 0;
            this.name = name;
        }
    }
    class Directory {
        constructor(name) {
            this.type = files_1.FileType.Directory;
            this.ctime = Date.now();
            this.mtime = Date.now();
            this.size = 0;
            this.name = name;
            this.entries = new Map();
        }
    }
    class InMemoryUserDataProvider extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.capabilities = 2 /* FileReadWrite */;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.root = new Directory('');
            // --- manage file events
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this._bufferedChanges = [];
        }
        // --- manage file metadata
        stat(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._lookup(resource, false);
            });
        }
        readdir(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                const entry = this._lookupAsDirectory(resource, false);
                let result = [];
                for (const [name, child] of entry.entries) {
                    result.push([name, child.type]);
                }
                return result;
            });
        }
        // --- manage file contents
        readFile(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                const data = this._lookupAsFile(resource, false).data;
                if (data) {
                    return data;
                }
                throw new files_1.FileSystemProviderError('file not found', files_1.FileSystemProviderErrorCode.FileNotFound);
            });
        }
        writeFile(resource, content, opts) {
            return __awaiter(this, void 0, void 0, function* () {
                let basename = resources.basename(resource);
                let parent = this._lookupParentDirectory(resource);
                let entry = parent.entries.get(basename);
                if (entry instanceof Directory) {
                    throw new files_1.FileSystemProviderError('file is directory', files_1.FileSystemProviderErrorCode.FileIsADirectory);
                }
                if (!entry && !opts.create) {
                    throw new files_1.FileSystemProviderError('file not found', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                if (entry && opts.create && !opts.overwrite) {
                    throw new files_1.FileSystemProviderError('file exists already', files_1.FileSystemProviderErrorCode.FileExists);
                }
                if (!entry) {
                    entry = new File(basename);
                    parent.entries.set(basename, entry);
                    this._fireSoon({ type: 1 /* ADDED */, resource });
                }
                entry.mtime = Date.now();
                entry.size = content.byteLength;
                entry.data = content;
                this._fireSoon({ type: 0 /* UPDATED */, resource });
            });
        }
        // --- manage files/folders
        rename(from, to, opts) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!opts.overwrite && this._lookup(to, true)) {
                    throw new files_1.FileSystemProviderError('file exists already', files_1.FileSystemProviderErrorCode.FileExists);
                }
                let entry = this._lookup(from, false);
                let oldParent = this._lookupParentDirectory(from);
                let newParent = this._lookupParentDirectory(to);
                let newName = resources.basename(to);
                oldParent.entries.delete(entry.name);
                entry.name = newName;
                newParent.entries.set(newName, entry);
                this._fireSoon({ type: 2 /* DELETED */, resource: from }, { type: 1 /* ADDED */, resource: to });
            });
        }
        delete(resource, opts) {
            return __awaiter(this, void 0, void 0, function* () {
                let dirname = resources.dirname(resource);
                let basename = resources.basename(resource);
                let parent = this._lookupAsDirectory(dirname, false);
                if (!parent.entries.has(basename)) {
                    throw new files_1.FileSystemProviderError('file not found', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                parent.entries.delete(basename);
                parent.mtime = Date.now();
                parent.size -= 1;
                this._fireSoon({ type: 0 /* UPDATED */, resource: dirname }, { resource, type: 2 /* DELETED */ });
            });
        }
        mkdir(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                let basename = resources.basename(resource);
                let dirname = resources.dirname(resource);
                let parent = this._lookupAsDirectory(dirname, false);
                let entry = new Directory(basename);
                parent.entries.set(entry.name, entry);
                parent.mtime = Date.now();
                parent.size += 1;
                this._fireSoon({ type: 0 /* UPDATED */, resource: dirname }, { type: 1 /* ADDED */, resource });
            });
        }
        _lookup(uri, silent) {
            let parts = uri.path.split('/');
            let entry = this.root;
            for (const part of parts) {
                if (!part) {
                    continue;
                }
                let child;
                if (entry instanceof Directory) {
                    child = entry.entries.get(part);
                }
                if (!child) {
                    if (!silent) {
                        throw new files_1.FileSystemProviderError('file not found', files_1.FileSystemProviderErrorCode.FileNotFound);
                    }
                    else {
                        return undefined;
                    }
                }
                entry = child;
            }
            return entry;
        }
        _lookupAsDirectory(uri, silent) {
            let entry = this._lookup(uri, silent);
            if (entry instanceof Directory) {
                return entry;
            }
            throw new files_1.FileSystemProviderError('file not a directory', files_1.FileSystemProviderErrorCode.FileNotADirectory);
        }
        _lookupAsFile(uri, silent) {
            let entry = this._lookup(uri, silent);
            if (entry instanceof File) {
                return entry;
            }
            throw new files_1.FileSystemProviderError('file is a directory', files_1.FileSystemProviderErrorCode.FileIsADirectory);
        }
        _lookupParentDirectory(uri) {
            const dirname = resources.dirname(uri);
            return this._lookupAsDirectory(dirname, false);
        }
        watch(resource, opts) {
            // ignore, fires for all changes...
            return lifecycle_1.Disposable.None;
        }
        _fireSoon(...changes) {
            this._bufferedChanges.push(...changes);
            if (this._fireSoonHandle) {
                clearTimeout(this._fireSoonHandle);
            }
            this._fireSoonHandle = setTimeout(() => {
                this._onDidChangeFile.fire(this._bufferedChanges);
                this._bufferedChanges.length = 0;
            }, 5);
        }
    }
    exports.InMemoryUserDataProvider = InMemoryUserDataProvider;
});
//# sourceMappingURL=inMemoryUserDataProvider.js.map