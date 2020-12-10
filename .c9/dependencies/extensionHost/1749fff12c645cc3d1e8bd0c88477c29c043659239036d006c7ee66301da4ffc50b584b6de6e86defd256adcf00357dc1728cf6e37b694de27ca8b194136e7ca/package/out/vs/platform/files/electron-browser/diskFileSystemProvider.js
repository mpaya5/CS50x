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
define(["require", "exports", "electron", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/platform", "vs/nls", "vs/base/common/path"], function (require, exports, electron_1, diskFileSystemProvider_1, platform_1, nls_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DiskFileSystemProvider extends diskFileSystemProvider_1.DiskFileSystemProvider {
        get capabilities() {
            if (!this._capabilities) {
                this._capabilities = super.capabilities | 4096 /* Trash */;
            }
            return this._capabilities;
        }
        doDelete(filePath, opts) {
            const _super = Object.create(null, {
                doDelete: { get: () => super.doDelete }
            });
            return __awaiter(this, void 0, void 0, function* () {
                if (!opts.useTrash) {
                    return _super.doDelete.call(this, filePath, opts);
                }
                const result = electron_1.shell.moveItemToTrash(filePath);
                if (!result) {
                    throw new Error(platform_1.isWindows ? nls_1.localize('binFailed', "Failed to move '{0}' to the recycle bin", path_1.basename(filePath)) : nls_1.localize('trashFailed', "Failed to move '{0}' to the trash", path_1.basename(filePath)));
                }
            });
        }
    }
    exports.DiskFileSystemProvider = DiskFileSystemProvider;
});
//# sourceMappingURL=diskFileSystemProvider.js.map