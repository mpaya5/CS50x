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
define(["require", "exports", "assert", "os", "vs/base/common/path", "vs/base/test/node/testUtils", "vs/platform/state/node/stateService", "vs/base/node/pfs"], function (require, exports, assert, os, path, testUtils_1, stateService_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('StateService', () => {
        const parentDir = testUtils_1.getRandomTestPath(os.tmpdir(), 'vsctests', 'stateservice');
        const storageFile = path.join(parentDir, 'storage.json');
        teardown(() => __awaiter(this, void 0, void 0, function* () {
            yield pfs_1.rimraf(parentDir, pfs_1.RimRafMode.MOVE);
        }));
        test('Basics', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs_1.mkdirp(parentDir);
            pfs_1.writeFileSync(storageFile, '');
            let service = new stateService_1.FileStorage(storageFile, () => null);
            service.setItem('some.key', 'some.value');
            assert.equal(service.getItem('some.key'), 'some.value');
            service.removeItem('some.key');
            assert.equal(service.getItem('some.key', 'some.default'), 'some.default');
            assert.ok(!service.getItem('some.unknonw.key'));
            service.setItem('some.other.key', 'some.other.value');
            service = new stateService_1.FileStorage(storageFile, () => null);
            assert.equal(service.getItem('some.other.key'), 'some.other.value');
            service.setItem('some.other.key', 'some.other.value');
            assert.equal(service.getItem('some.other.key'), 'some.other.value');
            service.setItem('some.undefined.key', undefined);
            assert.equal(service.getItem('some.undefined.key', 'some.default'), 'some.default');
            service.setItem('some.null.key', null);
            assert.equal(service.getItem('some.null.key', 'some.default'), 'some.default');
        }));
    });
});
//# sourceMappingURL=state.test.js.map