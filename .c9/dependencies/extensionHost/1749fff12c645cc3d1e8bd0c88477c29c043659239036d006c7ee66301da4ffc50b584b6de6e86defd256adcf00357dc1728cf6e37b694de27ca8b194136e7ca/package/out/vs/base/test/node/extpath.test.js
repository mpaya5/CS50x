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
define(["require", "exports", "assert", "os", "vs/base/common/path", "vs/base/common/uuid", "vs/base/node/pfs", "vs/base/node/extpath"], function (require, exports, assert, os, path, uuid, pfs, extpath_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Extpath', () => {
        test('realcase', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'extpath', id);
            yield pfs.mkdirp(newDir, 493);
            // assume case insensitive file system
            if (process.platform === 'win32' || process.platform === 'darwin') {
                const upper = newDir.toUpperCase();
                const real = extpath_1.realcaseSync(upper);
                if (real) { // can be null in case of permission errors
                    assert.notEqual(real, upper);
                    assert.equal(real.toUpperCase(), upper);
                    assert.equal(real, newDir);
                }
            }
            // linux, unix, etc. -> assume case sensitive file system
            else {
                const real = extpath_1.realcaseSync(newDir);
                assert.equal(real, newDir);
            }
            yield pfs.rimraf(parentDir, pfs.RimRafMode.MOVE);
        }));
        test('realpath', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'extpath', id);
            yield pfs.mkdirp(newDir, 493);
            const realpathVal = yield extpath_1.realpath(newDir);
            assert.ok(realpathVal);
            yield pfs.rimraf(parentDir, pfs.RimRafMode.MOVE);
        }));
        test('realpathSync', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'extpath', id);
            yield pfs.mkdirp(newDir, 493);
            let realpath;
            try {
                realpath = extpath_1.realpathSync(newDir);
            }
            catch (error) {
                assert.ok(!error);
            }
            assert.ok(realpath);
            yield pfs.rimraf(parentDir, pfs.RimRafMode.MOVE);
        }));
    });
});
//# sourceMappingURL=extpath.test.js.map