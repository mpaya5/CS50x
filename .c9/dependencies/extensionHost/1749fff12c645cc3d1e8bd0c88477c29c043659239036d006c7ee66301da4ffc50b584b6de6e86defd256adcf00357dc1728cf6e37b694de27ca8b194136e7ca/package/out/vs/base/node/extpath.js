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
define(["require", "exports", "fs", "vs/base/common/strings", "vs/base/common/path", "vs/base/node/pfs", "util"], function (require, exports, fs, strings_1, path_1, pfs_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Copied from: https://github.com/Microsoft/vscode-node-debug/blob/master/src/node/pathUtilities.ts#L83
     *
     * Given an absolute, normalized, and existing file path 'realcase' returns the exact path that the file has on disk.
     * On a case insensitive file system, the returned path might differ from the original path by character casing.
     * On a case sensitive file system, the returned path will always be identical to the original path.
     * In case of errors, null is returned. But you cannot use this function to verify that a path exists.
     * realcaseSync does not handle '..' or '.' path segments and it does not take the locale into account.
     */
    function realcaseSync(path) {
        const dir = path_1.dirname(path);
        if (path === dir) { // end recursion
            return path;
        }
        const name = (path_1.basename(path) /* can be '' for windows drive letters */ || path).toLowerCase();
        try {
            const entries = pfs_1.readdirSync(dir);
            const found = entries.filter(e => e.toLowerCase() === name); // use a case insensitive search
            if (found.length === 1) {
                // on a case sensitive filesystem we cannot determine here, whether the file exists or not, hence we need the 'file exists' precondition
                const prefix = realcaseSync(dir); // recurse
                if (prefix) {
                    return path_1.join(prefix, found[0]);
                }
            }
            else if (found.length > 1) {
                // must be a case sensitive $filesystem
                const ix = found.indexOf(name);
                if (ix >= 0) { // case sensitive
                    const prefix = realcaseSync(dir); // recurse
                    if (prefix) {
                        return path_1.join(prefix, found[ix]);
                    }
                }
            }
        }
        catch (error) {
            // silently ignore error
        }
        return null;
    }
    exports.realcaseSync = realcaseSync;
    function realpath(path) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield util_1.promisify(fs.realpath)(path);
            }
            catch (error) {
                // We hit an error calling fs.realpath(). Since fs.realpath() is doing some path normalization
                // we now do a similar normalization and then try again if we can access the path with read
                // permissions at least. If that succeeds, we return that path.
                // fs.realpath() is resolving symlinks and that can fail in certain cases. The workaround is
                // to not resolve links but to simply see if the path is read accessible or not.
                const normalizedPath = normalizePath(path);
                yield util_1.promisify(fs.access)(normalizedPath, fs.constants.R_OK);
                return normalizedPath;
            }
        });
    }
    exports.realpath = realpath;
    function realpathSync(path) {
        try {
            return fs.realpathSync(path);
        }
        catch (error) {
            // We hit an error calling fs.realpathSync(). Since fs.realpathSync() is doing some path normalization
            // we now do a similar normalization and then try again if we can access the path with read
            // permissions at least. If that succeeds, we return that path.
            // fs.realpath() is resolving symlinks and that can fail in certain cases. The workaround is
            // to not resolve links but to simply see if the path is read accessible or not.
            const normalizedPath = normalizePath(path);
            fs.accessSync(normalizedPath, fs.constants.R_OK); // throws in case of an error
            return normalizedPath;
        }
    }
    exports.realpathSync = realpathSync;
    function normalizePath(path) {
        return strings_1.rtrim(path_1.normalize(path), path_1.sep);
    }
});
//# sourceMappingURL=extpath.js.map