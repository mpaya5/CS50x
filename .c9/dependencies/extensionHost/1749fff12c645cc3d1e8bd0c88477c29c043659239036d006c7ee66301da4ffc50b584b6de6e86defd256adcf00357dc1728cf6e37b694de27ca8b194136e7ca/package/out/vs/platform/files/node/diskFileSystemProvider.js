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
define(["require", "exports", "fs", "util", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/event", "vs/base/common/platform", "vs/base/node/pfs", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/extpath", "vs/base/common/async", "vs/platform/log/common/log", "vs/nls", "vs/platform/files/node/watcher/watcher", "vs/platform/files/node/watcher/unix/watcherService", "vs/platform/files/node/watcher/win32/watcherService", "vs/platform/files/node/watcher/nsfw/watcherService", "vs/platform/files/node/watcher/nodejs/watcherService"], function (require, exports, fs_1, util_1, lifecycle_1, files_1, event_1, platform_1, pfs_1, path_1, resources_1, extpath_1, async_1, log_1, nls_1, watcher_1, watcherService_1, watcherService_2, watcherService_3, watcherService_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DiskFileSystemProvider extends lifecycle_1.Disposable {
        constructor(logService, watcherOptions) {
            super();
            this.logService = logService;
            this.watcherOptions = watcherOptions;
            //#region File Capabilities
            this.onDidChangeCapabilities = event_1.Event.None;
            this.mapHandleToPos = new Map();
            this.writeHandles = new Set();
            this.canFlush = true;
            //#endregion
            //#region File Watching
            this._onDidWatchErrorOccur = this._register(new event_1.Emitter());
            this.onDidErrorOccur = this._onDidWatchErrorOccur.event;
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.recursiveFoldersToWatch = [];
            this.recursiveWatchRequestDelayer = this._register(new async_1.ThrottledDelayer(0));
        }
        get capabilities() {
            if (!this._capabilities) {
                this._capabilities =
                    2 /* FileReadWrite */ |
                        4 /* FileOpenReadWriteClose */ |
                        8 /* FileFolderCopy */;
                if (platform_1.isLinux) {
                    this._capabilities |= 1024 /* PathCaseSensitive */;
                }
            }
            return this._capabilities;
        }
        //#endregion
        //#region File Metadata Resolving
        stat(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const { stat, isSymbolicLink } = yield pfs_1.statLink(this.toFilePath(resource)); // cannot use fs.stat() here to support links properly
                    let type;
                    if (isSymbolicLink) {
                        type = files_1.FileType.SymbolicLink | (stat.isDirectory() ? files_1.FileType.Directory : files_1.FileType.File);
                    }
                    else {
                        type = stat.isFile() ? files_1.FileType.File : stat.isDirectory() ? files_1.FileType.Directory : files_1.FileType.Unknown;
                    }
                    return {
                        type,
                        ctime: stat.ctime.getTime(),
                        mtime: stat.mtime.getTime(),
                        size: stat.size
                    };
                }
                catch (error) {
                    throw this.toFileSystemProviderError(error);
                }
            });
        }
        readdir(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const children = yield pfs_1.readdir(this.toFilePath(resource));
                    const result = [];
                    yield Promise.all(children.map((child) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            const stat = yield this.stat(resources_1.joinPath(resource, child));
                            result.push([child, stat.type]);
                        }
                        catch (error) {
                            this.logService.trace(error); // ignore errors for individual entries that can arise from permission denied
                        }
                    })));
                    return result;
                }
                catch (error) {
                    throw this.toFileSystemProviderError(error);
                }
            });
        }
        //#endregion
        //#region File Reading/Writing
        readFile(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const filePath = this.toFilePath(resource);
                    return yield pfs_1.readFile(filePath);
                }
                catch (error) {
                    throw this.toFileSystemProviderError(error);
                }
            });
        }
        writeFile(resource, content, opts) {
            return __awaiter(this, void 0, void 0, function* () {
                let handle = undefined;
                try {
                    const filePath = this.toFilePath(resource);
                    // Validate target
                    const fileExists = yield pfs_1.exists(filePath);
                    if (fileExists && !opts.overwrite) {
                        throw files_1.createFileSystemProviderError(new Error(nls_1.localize('fileExists', "File already exists")), files_1.FileSystemProviderErrorCode.FileExists);
                    }
                    else if (!fileExists && !opts.create) {
                        throw files_1.createFileSystemProviderError(new Error(nls_1.localize('fileNotExists', "File does not exist")), files_1.FileSystemProviderErrorCode.FileNotFound);
                    }
                    // Open
                    handle = yield this.open(resource, { create: true });
                    // Write content at once
                    yield this.write(handle, 0, content, 0, content.byteLength);
                }
                catch (error) {
                    throw this.toFileSystemProviderError(error);
                }
                finally {
                    if (typeof handle === 'number') {
                        yield this.close(handle);
                    }
                }
            });
        }
        open(resource, opts) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const filePath = this.toFilePath(resource);
                    let flags = undefined;
                    if (opts.create) {
                        if (platform_1.isWindows && (yield pfs_1.exists(filePath))) {
                            try {
                                // On Windows and if the file exists, we use a different strategy of saving the file
                                // by first truncating the file and then writing with r+ flag. This helps to save hidden files on Windows
                                // (see https://github.com/Microsoft/vscode/issues/931) and prevent removing alternate data streams
                                // (see https://github.com/Microsoft/vscode/issues/6363)
                                yield pfs_1.truncate(filePath, 0);
                                // After a successful truncate() the flag can be set to 'r+' which will not truncate.
                                flags = 'r+';
                            }
                            catch (error) {
                                this.logService.trace(error);
                            }
                        }
                        // we take opts.create as a hint that the file is opened for writing
                        // as such we use 'w' to truncate an existing or create the
                        // file otherwise. we do not allow reading.
                        if (!flags) {
                            flags = 'w';
                        }
                    }
                    else {
                        // otherwise we assume the file is opened for reading
                        // as such we use 'r' to neither truncate, nor create
                        // the file.
                        flags = 'r';
                    }
                    const handle = yield util_1.promisify(fs_1.open)(filePath, flags);
                    // remember this handle to track file position of the handle
                    // we init the position to 0 since the file descriptor was
                    // just created and the position was not moved so far (see
                    // also http://man7.org/linux/man-pages/man2/open.2.html -
                    // "The file offset is set to the beginning of the file.")
                    this.mapHandleToPos.set(handle, 0);
                    // remember that this handle was used for writing
                    if (opts.create) {
                        this.writeHandles.add(handle);
                    }
                    return handle;
                }
                catch (error) {
                    throw this.toFileSystemProviderError(error);
                }
            });
        }
        close(fd) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    // remove this handle from map of positions
                    this.mapHandleToPos.delete(fd);
                    // if a handle is closed that was used for writing, ensure
                    // to flush the contents to disk if possible.
                    if (this.writeHandles.delete(fd) && this.canFlush) {
                        try {
                            yield util_1.promisify(fs_1.fdatasync)(fd);
                        }
                        catch (error) {
                            // In some exotic setups it is well possible that node fails to sync
                            // In that case we disable flushing and log the error to our logger
                            this.canFlush = false;
                            this.logService.error(error);
                        }
                    }
                    return yield util_1.promisify(fs_1.close)(fd);
                }
                catch (error) {
                    throw this.toFileSystemProviderError(error);
                }
            });
        }
        read(fd, pos, data, offset, length) {
            return __awaiter(this, void 0, void 0, function* () {
                const normalizedPos = this.normalizePos(fd, pos);
                let bytesRead = null;
                try {
                    const result = yield util_1.promisify(fs_1.read)(fd, data, offset, length, normalizedPos);
                    if (typeof result === 'number') {
                        bytesRead = result; // node.d.ts fail
                    }
                    else {
                        bytesRead = result.bytesRead;
                    }
                    return bytesRead;
                }
                catch (error) {
                    throw this.toFileSystemProviderError(error);
                }
                finally {
                    this.updatePos(fd, normalizedPos, bytesRead);
                }
            });
        }
        normalizePos(fd, pos) {
            // when calling fs.read/write we try to avoid passing in the "pos" argument and
            // rather prefer to pass in "null" because this avoids an extra seek(pos)
            // call that in some cases can even fail (e.g. when opening a file over FTP -
            // see https://github.com/microsoft/vscode/issues/73884).
            //
            // as such, we compare the passed in position argument with our last known
            // position for the file descriptor and use "null" if they match.
            if (pos === this.mapHandleToPos.get(fd)) {
                return null;
            }
            return pos;
        }
        updatePos(fd, pos, bytesLength) {
            const lastKnownPos = this.mapHandleToPos.get(fd);
            if (typeof lastKnownPos === 'number') {
                // pos !== null signals that previously a position was used that is
                // not null. node.js documentation explains, that in this case
                // the internal file pointer is not moving and as such we do not move
                // our position pointer.
                //
                // Docs: "If position is null, data will be read from the current file position,
                // and the file position will be updated. If position is an integer, the file position
                // will remain unchanged."
                if (typeof pos === 'number') {
                    // do not modify the position
                }
                // bytesLength = number is a signal that the read/write operation was
                // successful and as such we need to advance the position in the Map
                //
                // Docs (http://man7.org/linux/man-pages/man2/read.2.html):
                // "On files that support seeking, the read operation commences at the
                // file offset, and the file offset is incremented by the number of
                // bytes read."
                //
                // Docs (http://man7.org/linux/man-pages/man2/write.2.html):
                // "For a seekable file (i.e., one to which lseek(2) may be applied, for
                // example, a regular file) writing takes place at the file offset, and
                // the file offset is incremented by the number of bytes actually
                // written."
                else if (typeof bytesLength === 'number') {
                    this.mapHandleToPos.set(fd, lastKnownPos + bytesLength);
                }
                // bytesLength = null signals an error in the read/write operation
                // and as such we drop the handle from the Map because the position
                // is unspecificed at this point.
                else {
                    this.mapHandleToPos.delete(fd);
                }
            }
        }
        write(fd, pos, data, offset, length) {
            return __awaiter(this, void 0, void 0, function* () {
                // we know at this point that the file to write to is truncated and thus empty
                // if the write now fails, the file remains empty. as such we really try hard
                // to ensure the write succeeds by retrying up to three times.
                return async_1.retry(() => this.doWrite(fd, pos, data, offset, length), 100 /* ms delay */, 3 /* retries */);
            });
        }
        doWrite(fd, pos, data, offset, length) {
            return __awaiter(this, void 0, void 0, function* () {
                const normalizedPos = this.normalizePos(fd, pos);
                let bytesWritten = null;
                try {
                    const result = yield util_1.promisify(fs_1.write)(fd, data, offset, length, normalizedPos);
                    if (typeof result === 'number') {
                        bytesWritten = result; // node.d.ts fail
                    }
                    else {
                        bytesWritten = result.bytesWritten;
                    }
                    return bytesWritten;
                }
                catch (error) {
                    throw this.toFileSystemProviderError(error);
                }
                finally {
                    this.updatePos(fd, normalizedPos, bytesWritten);
                }
            });
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        mkdir(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield util_1.promisify(fs_1.mkdir)(this.toFilePath(resource));
                }
                catch (error) {
                    throw this.toFileSystemProviderError(error);
                }
            });
        }
        delete(resource, opts) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const filePath = this.toFilePath(resource);
                    yield this.doDelete(filePath, opts);
                }
                catch (error) {
                    throw this.toFileSystemProviderError(error);
                }
            });
        }
        doDelete(filePath, opts) {
            return __awaiter(this, void 0, void 0, function* () {
                if (opts.recursive) {
                    yield pfs_1.rimraf(filePath, pfs_1.RimRafMode.MOVE);
                }
                else {
                    yield pfs_1.unlink(filePath);
                }
            });
        }
        rename(from, to, opts) {
            return __awaiter(this, void 0, void 0, function* () {
                const fromFilePath = this.toFilePath(from);
                const toFilePath = this.toFilePath(to);
                if (fromFilePath === toFilePath) {
                    return; // simulate node.js behaviour here and do a no-op if paths match
                }
                try {
                    // Ensure target does not exist
                    yield this.validateTargetDeleted(from, to, 'move', opts && opts.overwrite);
                    // Move
                    yield pfs_1.move(fromFilePath, toFilePath);
                }
                catch (error) {
                    // rewrite some typical errors that can happen especially around symlinks
                    // to something the user can better understand
                    if (error.code === 'EINVAL' || error.code === 'EBUSY' || error.code === 'ENAMETOOLONG') {
                        error = new Error(nls_1.localize('moveError', "Unable to move '{0}' into '{1}' ({2}).", path_1.basename(fromFilePath), path_1.basename(path_1.dirname(toFilePath)), error.toString()));
                    }
                    throw this.toFileSystemProviderError(error);
                }
            });
        }
        copy(from, to, opts) {
            return __awaiter(this, void 0, void 0, function* () {
                const fromFilePath = this.toFilePath(from);
                const toFilePath = this.toFilePath(to);
                if (fromFilePath === toFilePath) {
                    return; // simulate node.js behaviour here and do a no-op if paths match
                }
                try {
                    // Ensure target does not exist
                    yield this.validateTargetDeleted(from, to, 'copy', opts && opts.overwrite);
                    // Copy
                    yield pfs_1.copy(fromFilePath, toFilePath);
                }
                catch (error) {
                    // rewrite some typical errors that can happen especially around symlinks
                    // to something the user can better understand
                    if (error.code === 'EINVAL' || error.code === 'EBUSY' || error.code === 'ENAMETOOLONG') {
                        error = new Error(nls_1.localize('copyError', "Unable to copy '{0}' into '{1}' ({2}).", path_1.basename(fromFilePath), path_1.basename(path_1.dirname(toFilePath)), error.toString()));
                    }
                    throw this.toFileSystemProviderError(error);
                }
            });
        }
        validateTargetDeleted(from, to, mode, overwrite) {
            return __awaiter(this, void 0, void 0, function* () {
                const isPathCaseSensitive = !!(this.capabilities & 1024 /* PathCaseSensitive */);
                const fromFilePath = this.toFilePath(from);
                const toFilePath = this.toFilePath(to);
                let isSameResourceWithDifferentPathCase = false;
                if (!isPathCaseSensitive) {
                    isSameResourceWithDifferentPathCase = extpath_1.isEqual(fromFilePath, toFilePath, true /* ignore case */);
                }
                if (isSameResourceWithDifferentPathCase && mode === 'copy') {
                    throw files_1.createFileSystemProviderError(new Error('File cannot be copied to same path with different path case'), files_1.FileSystemProviderErrorCode.FileExists);
                }
                // handle existing target (unless this is a case change)
                if (!isSameResourceWithDifferentPathCase && (yield pfs_1.exists(toFilePath))) {
                    if (!overwrite) {
                        throw files_1.createFileSystemProviderError(new Error('File at target already exists'), files_1.FileSystemProviderErrorCode.FileExists);
                    }
                    // Delete target
                    yield this.delete(to, { recursive: true, useTrash: false });
                }
            });
        }
        get onDidChangeFile() { return this._onDidChangeFile.event; }
        watch(resource, opts) {
            if (opts.recursive) {
                return this.watchRecursive(resource, opts.excludes);
            }
            return this.watchNonRecursive(resource); // TODO@ben ideally the same watcher can be used in both cases
        }
        watchRecursive(resource, excludes) {
            // Add to list of folders to watch recursively
            const folderToWatch = { path: this.toFilePath(resource), excludes };
            this.recursiveFoldersToWatch.push(folderToWatch);
            // Trigger update
            this.refreshRecursiveWatchers();
            return lifecycle_1.toDisposable(() => {
                // Remove from list of folders to watch recursively
                this.recursiveFoldersToWatch.splice(this.recursiveFoldersToWatch.indexOf(folderToWatch), 1);
                // Trigger update
                this.refreshRecursiveWatchers();
            });
        }
        refreshRecursiveWatchers() {
            // Buffer requests for recursive watching to decide on right watcher
            // that supports potentially watching more than one folder at once
            this.recursiveWatchRequestDelayer.trigger(() => {
                this.doRefreshRecursiveWatchers();
                return Promise.resolve();
            });
        }
        doRefreshRecursiveWatchers() {
            // Reuse existing
            if (this.recursiveWatcher instanceof watcherService_3.FileWatcher) {
                this.recursiveWatcher.setFolders(this.recursiveFoldersToWatch);
            }
            // Create new
            else {
                // Dispose old
                lifecycle_1.dispose(this.recursiveWatcher);
                this.recursiveWatcher = undefined;
                // Create new if we actually have folders to watch
                if (this.recursiveFoldersToWatch.length > 0) {
                    let watcherImpl;
                    let watcherOptions = undefined;
                    // requires a polling watcher
                    if (this.watcherOptions && this.watcherOptions.usePolling) {
                        watcherImpl = watcherService_1.FileWatcher;
                        watcherOptions = this.watcherOptions;
                    }
                    // Single Folder Watcher
                    else {
                        if (this.recursiveFoldersToWatch.length === 1) {
                            if (platform_1.isWindows) {
                                watcherImpl = watcherService_2.FileWatcher;
                            }
                            else {
                                watcherImpl = watcherService_1.FileWatcher;
                            }
                        }
                        // Multi Folder Watcher
                        else {
                            watcherImpl = watcherService_3.FileWatcher;
                        }
                    }
                    // Create and start watching
                    this.recursiveWatcher = new watcherImpl(this.recursiveFoldersToWatch, event => this._onDidChangeFile.fire(watcher_1.toFileChanges(event)), msg => {
                        if (msg.type === 'error') {
                            this._onDidWatchErrorOccur.fire(msg.message);
                        }
                        this.logService[msg.type](msg.message);
                    }, this.logService.getLevel() === log_1.LogLevel.Trace, watcherOptions);
                    if (!this.recursiveWatcherLogLevelListener) {
                        this.recursiveWatcherLogLevelListener = this.logService.onDidChangeLogLevel(() => {
                            if (this.recursiveWatcher) {
                                this.recursiveWatcher.setVerboseLogging(this.logService.getLevel() === log_1.LogLevel.Trace);
                            }
                        });
                    }
                }
            }
        }
        watchNonRecursive(resource) {
            const watcherService = new watcherService_4.FileWatcher(this.toFilePath(resource), changes => this._onDidChangeFile.fire(watcher_1.toFileChanges(changes)), msg => {
                if (msg.type === 'error') {
                    this._onDidWatchErrorOccur.fire(msg.message);
                }
                this.logService[msg.type](msg.message);
            }, this.logService.getLevel() === log_1.LogLevel.Trace);
            const logLevelListener = this.logService.onDidChangeLogLevel(() => {
                watcherService.setVerboseLogging(this.logService.getLevel() === log_1.LogLevel.Trace);
            });
            return lifecycle_1.combinedDisposable(watcherService, logLevelListener);
        }
        //#endregion
        //#region Helpers
        toFilePath(resource) {
            return path_1.normalize(resource.fsPath);
        }
        toFileSystemProviderError(error) {
            if (error instanceof files_1.FileSystemProviderError) {
                return error; // avoid double conversion
            }
            let code;
            switch (error.code) {
                case 'ENOENT':
                    code = files_1.FileSystemProviderErrorCode.FileNotFound;
                    break;
                case 'EISDIR':
                    code = files_1.FileSystemProviderErrorCode.FileIsADirectory;
                    break;
                case 'EEXIST':
                    code = files_1.FileSystemProviderErrorCode.FileExists;
                    break;
                case 'EPERM':
                case 'EACCES':
                    code = files_1.FileSystemProviderErrorCode.NoPermissions;
                    break;
                default:
                    code = files_1.FileSystemProviderErrorCode.Unknown;
            }
            return files_1.createFileSystemProviderError(error, code);
        }
        //#endregion
        dispose() {
            super.dispose();
            lifecycle_1.dispose(this.recursiveWatcher);
            this.recursiveWatcher = undefined;
            lifecycle_1.dispose(this.recursiveWatcherLogLevelListener);
            this.recursiveWatcherLogLevelListener = undefined;
        }
    }
    exports.DiskFileSystemProvider = DiskFileSystemProvider;
});
//# sourceMappingURL=diskFileSystemProvider.js.map