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
define(["require", "exports", "assert", "os", "vs/base/common/path", "vs/base/node/pfs", "../chokidarWatcherService", "vs/base/common/platform", "vs/base/common/async"], function (require, exports, assert, os, path, pfs, chokidarWatcherService_1, platform, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function newRequest(basePath, ignored = []) {
        return { path: basePath, excludes: ignored };
    }
    function assertNormalizedRootPath(inputPaths, expectedPaths) {
        const requests = inputPaths.map(path => newRequest(path));
        const actual = chokidarWatcherService_1.normalizeRoots(requests);
        assert.deepEqual(Object.keys(actual).sort(), expectedPaths);
    }
    function assertNormalizedRequests(inputRequests, expectedRequests) {
        const actual = chokidarWatcherService_1.normalizeRoots(inputRequests);
        const actualPath = Object.keys(actual).sort();
        const expectedPaths = Object.keys(expectedRequests).sort();
        assert.deepEqual(actualPath, expectedPaths);
        for (let path of actualPath) {
            let a = expectedRequests[path].sort((r1, r2) => r1.path.localeCompare(r2.path));
            let e = expectedRequests[path].sort((r1, r2) => r1.path.localeCompare(r2.path));
            assert.deepEqual(a, e);
        }
    }
    function sort(changes) {
        return changes.sort((c1, c2) => {
            return c1.path.localeCompare(c2.path);
        });
    }
    function wait(time) {
        return new async_1.Delayer(time).trigger(() => { });
    }
    function assertFileEvents(actuals, expected) {
        return __awaiter(this, void 0, void 0, function* () {
            let repeats = 40;
            while ((actuals.length < expected.length) && repeats-- > 0) {
                yield wait(50);
            }
            assert.deepEqual(sort(actuals), sort(expected));
            actuals.length = 0;
        });
    }
    suite('Chokidar normalizeRoots', () => {
        test('should not impacts roots that don\'t overlap', () => {
            if (platform.isWindows) {
                assertNormalizedRootPath(['C:\\a'], ['C:\\a']);
                assertNormalizedRootPath(['C:\\a', 'C:\\b'], ['C:\\a', 'C:\\b']);
                assertNormalizedRootPath(['C:\\a', 'C:\\b', 'C:\\c\\d\\e'], ['C:\\a', 'C:\\b', 'C:\\c\\d\\e']);
            }
            else {
                assertNormalizedRootPath(['/a'], ['/a']);
                assertNormalizedRootPath(['/a', '/b'], ['/a', '/b']);
                assertNormalizedRootPath(['/a', '/b', '/c/d/e'], ['/a', '/b', '/c/d/e']);
            }
        });
        test('should remove sub-folders of other roots', () => {
            if (platform.isWindows) {
                assertNormalizedRootPath(['C:\\a', 'C:\\a\\b'], ['C:\\a']);
                assertNormalizedRootPath(['C:\\a', 'C:\\b', 'C:\\a\\b'], ['C:\\a', 'C:\\b']);
                assertNormalizedRootPath(['C:\\b\\a', 'C:\\a', 'C:\\b', 'C:\\a\\b'], ['C:\\a', 'C:\\b']);
                assertNormalizedRootPath(['C:\\a', 'C:\\a\\b', 'C:\\a\\c\\d'], ['C:\\a']);
            }
            else {
                assertNormalizedRootPath(['/a', '/a/b'], ['/a']);
                assertNormalizedRootPath(['/a', '/b', '/a/b'], ['/a', '/b']);
                assertNormalizedRootPath(['/b/a', '/a', '/b', '/a/b'], ['/a', '/b']);
                assertNormalizedRootPath(['/a', '/a/b', '/a/c/d'], ['/a']);
                assertNormalizedRootPath(['/a/c/d/e', '/a/b/d', '/a/c/d', '/a/c/e/f', '/a/b'], ['/a/b', '/a/c/d', '/a/c/e/f']);
            }
        });
        test('should remove duplicates', () => {
            if (platform.isWindows) {
                assertNormalizedRootPath(['C:\\a', 'C:\\a\\', 'C:\\a'], ['C:\\a']);
            }
            else {
                assertNormalizedRootPath(['/a', '/a/', '/a'], ['/a']);
                assertNormalizedRootPath(['/a', '/b', '/a/b'], ['/a', '/b']);
                assertNormalizedRootPath(['/b/a', '/a', '/b', '/a/b'], ['/a', '/b']);
                assertNormalizedRootPath(['/a', '/a/b', '/a/c/d'], ['/a']);
            }
        });
        test('nested requests', () => {
            let p1, p2, p3;
            if (platform.isWindows) {
                p1 = 'C:\\a';
                p2 = 'C:\\a\\b';
                p3 = 'C:\\a\\b\\c';
            }
            else {
                p1 = '/a';
                p2 = '/a/b';
                p3 = '/a/b/c';
            }
            const r1 = newRequest(p1, ['**/*.ts']);
            const r2 = newRequest(p2, ['**/*.js']);
            const r3 = newRequest(p3, ['**/*.ts']);
            assertNormalizedRequests([r1, r2], { [p1]: [r1, r2] });
            assertNormalizedRequests([r2, r1], { [p1]: [r1, r2] });
            assertNormalizedRequests([r1, r2, r3], { [p1]: [r1, r2, r3] });
            assertNormalizedRequests([r1, r3], { [p1]: [r1] });
            assertNormalizedRequests([r2, r3], { [p2]: [r2, r3] });
        });
    });
    suite.skip('Chokidar watching', () => {
        const tmpdir = os.tmpdir();
        const testDir = path.join(tmpdir, 'chokidartest-' + Date.now());
        const aFolder = path.join(testDir, 'a');
        const bFolder = path.join(testDir, 'b');
        const b2Folder = path.join(bFolder, 'b2');
        const service = new chokidarWatcherService_1.ChokidarWatcherService();
        const result = [];
        let error = null;
        suiteSetup(() => __awaiter(this, void 0, void 0, function* () {
            yield pfs.mkdirp(testDir);
            yield pfs.mkdirp(aFolder);
            yield pfs.mkdirp(bFolder);
            yield pfs.mkdirp(b2Folder);
            const opts = { verboseLogging: false, pollingInterval: 200 };
            service.watch(opts)(e => {
                if (Array.isArray(e)) {
                    result.push(...e);
                }
            });
            service.onLogMessage(msg => {
                if (msg.type === 'error') {
                    console.log('set error', msg.message);
                    error = msg.message;
                }
            });
        }));
        suiteTeardown(() => __awaiter(this, void 0, void 0, function* () {
            yield pfs.rimraf(testDir, pfs.RimRafMode.MOVE);
            yield service.stop();
        }));
        setup(() => {
            result.length = 0;
            assert.equal(error, null);
        });
        teardown(() => {
            assert.equal(error, null);
        });
        test('simple file operations, single root, no ignore', () => __awaiter(this, void 0, void 0, function* () {
            let request = { path: testDir, excludes: [] };
            service.setRoots([request]);
            yield wait(300);
            assert.equal(service.wacherCount, 1);
            // create a file
            let testFilePath = path.join(testDir, 'file.txt');
            yield pfs.writeFile(testFilePath, '');
            yield assertFileEvents(result, [{ path: testFilePath, type: 1 /* ADDED */ }]);
            // modify a file
            yield pfs.writeFile(testFilePath, 'Hello');
            yield assertFileEvents(result, [{ path: testFilePath, type: 0 /* UPDATED */ }]);
            // create a folder
            let testFolderPath = path.join(testDir, 'newFolder');
            yield pfs.mkdirp(testFolderPath);
            // copy a file
            let copiedFilePath = path.join(testFolderPath, 'file2.txt');
            yield pfs.copy(testFilePath, copiedFilePath);
            yield assertFileEvents(result, [{ path: copiedFilePath, type: 1 /* ADDED */ }, { path: testFolderPath, type: 1 /* ADDED */ }]);
            // delete a file
            yield pfs.rimraf(copiedFilePath, pfs.RimRafMode.MOVE);
            let renamedFilePath = path.join(testFolderPath, 'file3.txt');
            // move a file
            yield pfs.rename(testFilePath, renamedFilePath);
            yield assertFileEvents(result, [{ path: copiedFilePath, type: 2 /* DELETED */ }, { path: testFilePath, type: 2 /* DELETED */ }, { path: renamedFilePath, type: 1 /* ADDED */ }]);
            // delete a folder
            yield pfs.rimraf(testFolderPath, pfs.RimRafMode.MOVE);
            yield assertFileEvents(result, [{ path: testFolderPath, type: 2 /* DELETED */ }, { path: renamedFilePath, type: 2 /* DELETED */ }]);
        }));
        test('simple file operations, ignore', () => __awaiter(this, void 0, void 0, function* () {
            let request = { path: testDir, excludes: ['**/b/**', '**/*.js', '.git/**'] };
            service.setRoots([request]);
            yield wait(300);
            assert.equal(service.wacherCount, 1);
            // create various ignored files
            let file1 = path.join(bFolder, 'file1.txt'); // hidden
            yield pfs.writeFile(file1, 'Hello');
            let file2 = path.join(b2Folder, 'file2.txt'); // hidden
            yield pfs.writeFile(file2, 'Hello');
            let folder1 = path.join(bFolder, 'folder1'); // hidden
            yield pfs.mkdirp(folder1);
            let folder2 = path.join(aFolder, 'b'); // hidden
            yield pfs.mkdirp(folder2);
            let folder3 = path.join(testDir, '.git'); // hidden
            yield pfs.mkdirp(folder3);
            let folder4 = path.join(testDir, '.git1');
            yield pfs.mkdirp(folder4);
            let folder5 = path.join(aFolder, '.git');
            yield pfs.mkdirp(folder5);
            let file3 = path.join(aFolder, 'file3.js'); // hidden
            yield pfs.writeFile(file3, 'var x;');
            let file4 = path.join(aFolder, 'file4.txt');
            yield pfs.writeFile(file4, 'Hello');
            yield assertFileEvents(result, [{ path: file4, type: 1 /* ADDED */ }, { path: folder4, type: 1 /* ADDED */ }, { path: folder5, type: 1 /* ADDED */ }]);
            // move some files
            let movedFile1 = path.join(folder2, 'file1.txt'); // from ignored to ignored
            yield pfs.rename(file1, movedFile1);
            let movedFile2 = path.join(aFolder, 'file2.txt'); // from ignored to visible
            yield pfs.rename(file2, movedFile2);
            let movedFile3 = path.join(aFolder, 'file3.txt'); // from ignored file ext to visible
            yield pfs.rename(file3, movedFile3);
            yield assertFileEvents(result, [{ path: movedFile2, type: 1 /* ADDED */ }, { path: movedFile3, type: 1 /* ADDED */ }]);
            // delete all files
            yield pfs.rimraf(movedFile1); // hidden
            yield pfs.rimraf(movedFile2, pfs.RimRafMode.MOVE);
            yield pfs.rimraf(movedFile3, pfs.RimRafMode.MOVE);
            yield pfs.rimraf(folder1); // hidden
            yield pfs.rimraf(folder2); // hidden
            yield pfs.rimraf(folder3); // hidden
            yield pfs.rimraf(folder4, pfs.RimRafMode.MOVE);
            yield pfs.rimraf(folder5, pfs.RimRafMode.MOVE);
            yield pfs.rimraf(file4, pfs.RimRafMode.MOVE);
            yield assertFileEvents(result, [{ path: movedFile2, type: 2 /* DELETED */ }, { path: movedFile3, type: 2 /* DELETED */ }, { path: file4, type: 2 /* DELETED */ }, { path: folder4, type: 2 /* DELETED */ }, { path: folder5, type: 2 /* DELETED */ }]);
        }));
        test('simple file operations, multiple roots', () => __awaiter(this, void 0, void 0, function* () {
            let request1 = { path: aFolder, excludes: ['**/*.js'] };
            let request2 = { path: b2Folder, excludes: ['**/*.ts'] };
            service.setRoots([request1, request2]);
            yield wait(300);
            assert.equal(service.wacherCount, 2);
            // create some files
            let folderPath1 = path.join(aFolder, 'folder1');
            yield pfs.mkdirp(folderPath1);
            let filePath1 = path.join(folderPath1, 'file1.json');
            yield pfs.writeFile(filePath1, '');
            let filePath2 = path.join(folderPath1, 'file2.js'); // filtered
            yield pfs.writeFile(filePath2, '');
            let folderPath2 = path.join(b2Folder, 'folder2');
            yield pfs.mkdirp(folderPath2);
            let filePath3 = path.join(folderPath2, 'file3.ts'); // filtered
            yield pfs.writeFile(filePath3, '');
            let filePath4 = path.join(testDir, 'file4.json'); // outside roots
            yield pfs.writeFile(filePath4, '');
            yield assertFileEvents(result, [{ path: folderPath1, type: 1 /* ADDED */ }, { path: filePath1, type: 1 /* ADDED */ }, { path: folderPath2, type: 1 /* ADDED */ }]);
            // change roots
            let request3 = { path: aFolder, excludes: ['**/*.json'] };
            service.setRoots([request3]);
            yield wait(300);
            assert.equal(service.wacherCount, 1);
            // delete all
            yield pfs.rimraf(folderPath1, pfs.RimRafMode.MOVE);
            yield pfs.rimraf(folderPath2, pfs.RimRafMode.MOVE);
            yield pfs.rimraf(filePath4, pfs.RimRafMode.MOVE);
            yield assertFileEvents(result, [{ path: folderPath1, type: 2 /* DELETED */ }, { path: filePath2, type: 2 /* DELETED */ }]);
        }));
        test('simple file operations, nested roots', () => __awaiter(this, void 0, void 0, function* () {
            let request1 = { path: testDir, excludes: ['**/b2/**'] };
            let request2 = { path: bFolder, excludes: ['**/b3/**'] };
            service.setRoots([request1, request2]);
            yield wait(300);
            assert.equal(service.wacherCount, 1);
            // create files
            let filePath1 = path.join(bFolder, 'file1.xml'); // visible by both
            yield pfs.writeFile(filePath1, '');
            let filePath2 = path.join(b2Folder, 'file2.xml'); // filtered by root1, but visible by root2
            yield pfs.writeFile(filePath2, '');
            let folderPath1 = path.join(b2Folder, 'b3'); // filtered
            yield pfs.mkdirp(folderPath1);
            let filePath3 = path.join(folderPath1, 'file3.xml'); // filtered
            yield pfs.writeFile(filePath3, '');
            yield assertFileEvents(result, [{ path: filePath1, type: 1 /* ADDED */ }, { path: filePath2, type: 1 /* ADDED */ }]);
            let renamedFilePath2 = path.join(folderPath1, 'file2.xml');
            // move a file
            yield pfs.rename(filePath2, renamedFilePath2);
            yield assertFileEvents(result, [{ path: filePath2, type: 2 /* DELETED */ }]);
            // delete all
            yield pfs.rimraf(folderPath1, pfs.RimRafMode.MOVE);
            yield pfs.rimraf(filePath1, pfs.RimRafMode.MOVE);
            yield assertFileEvents(result, [{ path: filePath1, type: 2 /* DELETED */ }]);
        }));
    });
});
//# sourceMappingURL=chockidarWatcherService.test.js.map