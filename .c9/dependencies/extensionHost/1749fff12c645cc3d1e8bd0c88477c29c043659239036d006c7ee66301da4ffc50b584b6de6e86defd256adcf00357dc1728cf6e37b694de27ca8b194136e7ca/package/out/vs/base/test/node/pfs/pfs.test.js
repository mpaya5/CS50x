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
define(["require", "exports", "assert", "os", "vs/base/common/path", "fs", "stream", "vs/base/common/uuid", "vs/base/node/pfs", "vs/base/common/async", "vs/base/common/amd", "vs/base/common/cancellation", "vs/base/common/platform", "vs/base/common/normalization", "vs/base/common/buffer"], function (require, exports, assert, os, path, fs, stream_1, uuid, pfs, async_1, amd_1, cancellation_1, platform_1, normalization_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const chunkSize = 64 * 1024;
    const readError = 'Error while reading';
    function toReadable(value, throwError) {
        const totalChunks = Math.ceil(value.length / chunkSize);
        const stringChunks = [];
        for (let i = 0, j = 0; i < totalChunks; ++i, j += chunkSize) {
            stringChunks[i] = value.substr(j, chunkSize);
        }
        let counter = 0;
        return new stream_1.Readable({
            read: function () {
                if (throwError) {
                    this.emit('error', new Error(readError));
                }
                let res;
                let canPush = true;
                while (canPush && (res = stringChunks[counter++])) {
                    canPush = this.push(res);
                }
                // EOS
                if (!res) {
                    this.push(null);
                }
            },
            encoding: 'utf8'
        });
    }
    suite('PFS', () => {
        test('writeFile', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            const testFile = path.join(newDir, 'writefile.txt');
            yield pfs.mkdirp(newDir, 493);
            assert.ok(fs.existsSync(newDir));
            yield pfs.writeFile(testFile, 'Hello World', (null));
            assert.equal(fs.readFileSync(testFile), 'Hello World');
            yield pfs.rimraf(parentDir, pfs.RimRafMode.MOVE);
        }));
        test('writeFile - parallel write on different files works', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            const testFile1 = path.join(newDir, 'writefile1.txt');
            const testFile2 = path.join(newDir, 'writefile2.txt');
            const testFile3 = path.join(newDir, 'writefile3.txt');
            const testFile4 = path.join(newDir, 'writefile4.txt');
            const testFile5 = path.join(newDir, 'writefile5.txt');
            yield pfs.mkdirp(newDir, 493);
            assert.ok(fs.existsSync(newDir));
            yield Promise.all([
                pfs.writeFile(testFile1, 'Hello World 1', (null)),
                pfs.writeFile(testFile2, 'Hello World 2', (null)),
                pfs.writeFile(testFile3, 'Hello World 3', (null)),
                pfs.writeFile(testFile4, 'Hello World 4', (null)),
                pfs.writeFile(testFile5, 'Hello World 5', (null))
            ]);
            assert.equal(fs.readFileSync(testFile1), 'Hello World 1');
            assert.equal(fs.readFileSync(testFile2), 'Hello World 2');
            assert.equal(fs.readFileSync(testFile3), 'Hello World 3');
            assert.equal(fs.readFileSync(testFile4), 'Hello World 4');
            assert.equal(fs.readFileSync(testFile5), 'Hello World 5');
            yield pfs.rimraf(parentDir, pfs.RimRafMode.MOVE);
        }));
        test('writeFile - parallel write on same files works and is sequentalized', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            const testFile = path.join(newDir, 'writefile.txt');
            yield pfs.mkdirp(newDir, 493);
            assert.ok(fs.existsSync(newDir));
            yield Promise.all([
                pfs.writeFile(testFile, 'Hello World 1', undefined),
                pfs.writeFile(testFile, 'Hello World 2', undefined),
                async_1.timeout(10).then(() => pfs.writeFile(testFile, 'Hello World 3', undefined)),
                pfs.writeFile(testFile, 'Hello World 4', undefined),
                async_1.timeout(10).then(() => pfs.writeFile(testFile, 'Hello World 5', undefined))
            ]);
            assert.equal(fs.readFileSync(testFile), 'Hello World 5');
            yield pfs.rimraf(parentDir, pfs.RimRafMode.MOVE);
        }));
        test('rimraf - simple - unlink', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            yield pfs.mkdirp(newDir, 493);
            fs.writeFileSync(path.join(newDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync(path.join(newDir, 'someOtherFile.txt'), 'Contents');
            yield pfs.rimraf(newDir);
            assert.ok(!fs.existsSync(newDir));
        }));
        test('rimraf - simple - move', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            yield pfs.mkdirp(newDir, 493);
            fs.writeFileSync(path.join(newDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync(path.join(newDir, 'someOtherFile.txt'), 'Contents');
            yield pfs.rimraf(newDir, pfs.RimRafMode.MOVE);
            assert.ok(!fs.existsSync(newDir));
        }));
        test('rimraf - recursive folder structure - unlink', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            yield pfs.mkdirp(newDir, 493);
            fs.writeFileSync(path.join(newDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync(path.join(newDir, 'someOtherFile.txt'), 'Contents');
            fs.mkdirSync(path.join(newDir, 'somefolder'));
            fs.writeFileSync(path.join(newDir, 'somefolder', 'somefile.txt'), 'Contents');
            yield pfs.rimraf(newDir);
            assert.ok(!fs.existsSync(newDir));
        }));
        test('rimraf - recursive folder structure - move', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            yield pfs.mkdirp(newDir, 493);
            fs.writeFileSync(path.join(newDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync(path.join(newDir, 'someOtherFile.txt'), 'Contents');
            fs.mkdirSync(path.join(newDir, 'somefolder'));
            fs.writeFileSync(path.join(newDir, 'somefolder', 'somefile.txt'), 'Contents');
            yield pfs.rimraf(newDir, pfs.RimRafMode.MOVE);
            assert.ok(!fs.existsSync(newDir));
        }));
        test('rimraf - simple ends with dot - move', () => __awaiter(this, void 0, void 0, function* () {
            const id = `${uuid.generateUuid()}.`;
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            yield pfs.mkdirp(newDir, 493);
            fs.writeFileSync(path.join(newDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync(path.join(newDir, 'someOtherFile.txt'), 'Contents');
            yield pfs.rimraf(newDir, pfs.RimRafMode.MOVE);
            assert.ok(!fs.existsSync(newDir));
        }));
        test('rimraf - simple ends with dot slash/backslash - move', () => __awaiter(this, void 0, void 0, function* () {
            const id = `${uuid.generateUuid()}.`;
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            yield pfs.mkdirp(newDir, 493);
            fs.writeFileSync(path.join(newDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync(path.join(newDir, 'someOtherFile.txt'), 'Contents');
            yield pfs.rimraf(`${newDir}${path.sep}`, pfs.RimRafMode.MOVE);
            assert.ok(!fs.existsSync(newDir));
        }));
        test('rimrafSync - swallows file not found error', function () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            pfs.rimrafSync(newDir);
            assert.ok(!fs.existsSync(newDir));
        });
        test('rimrafSync - simple', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            yield pfs.mkdirp(newDir, 493);
            fs.writeFileSync(path.join(newDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync(path.join(newDir, 'someOtherFile.txt'), 'Contents');
            pfs.rimrafSync(newDir);
            assert.ok(!fs.existsSync(newDir));
        }));
        test('rimrafSync - recursive folder structure', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            yield pfs.mkdirp(newDir, 493);
            fs.writeFileSync(path.join(newDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync(path.join(newDir, 'someOtherFile.txt'), 'Contents');
            fs.mkdirSync(path.join(newDir, 'somefolder'));
            fs.writeFileSync(path.join(newDir, 'somefolder', 'somefile.txt'), 'Contents');
            pfs.rimrafSync(newDir);
            assert.ok(!fs.existsSync(newDir));
        }));
        test('moveIgnoreError', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            yield pfs.mkdirp(newDir, 493);
            try {
                yield pfs.renameIgnoreError(path.join(newDir, 'foo'), path.join(newDir, 'bar'));
                return pfs.rimraf(parentDir, pfs.RimRafMode.MOVE);
            }
            catch (error) {
                assert.fail(error);
                return Promise.reject(error);
            }
        }));
        test('copy, move and delete', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const id2 = uuid.generateUuid();
            const sourceDir = amd_1.getPathFromAmdModule(require, './fixtures');
            const parentDir = path.join(os.tmpdir(), 'vsctests', 'pfs');
            const targetDir = path.join(parentDir, id);
            const targetDir2 = path.join(parentDir, id2);
            yield pfs.copy(sourceDir, targetDir);
            assert.ok(fs.existsSync(targetDir));
            assert.ok(fs.existsSync(path.join(targetDir, 'index.html')));
            assert.ok(fs.existsSync(path.join(targetDir, 'site.css')));
            assert.ok(fs.existsSync(path.join(targetDir, 'examples')));
            assert.ok(fs.statSync(path.join(targetDir, 'examples')).isDirectory());
            assert.ok(fs.existsSync(path.join(targetDir, 'examples', 'small.jxs')));
            yield pfs.move(targetDir, targetDir2);
            assert.ok(!fs.existsSync(targetDir));
            assert.ok(fs.existsSync(targetDir2));
            assert.ok(fs.existsSync(path.join(targetDir2, 'index.html')));
            assert.ok(fs.existsSync(path.join(targetDir2, 'site.css')));
            assert.ok(fs.existsSync(path.join(targetDir2, 'examples')));
            assert.ok(fs.statSync(path.join(targetDir2, 'examples')).isDirectory());
            assert.ok(fs.existsSync(path.join(targetDir2, 'examples', 'small.jxs')));
            yield pfs.move(path.join(targetDir2, 'index.html'), path.join(targetDir2, 'index_moved.html'));
            assert.ok(!fs.existsSync(path.join(targetDir2, 'index.html')));
            assert.ok(fs.existsSync(path.join(targetDir2, 'index_moved.html')));
            yield pfs.rimraf(parentDir, pfs.RimRafMode.MOVE);
            assert.ok(!fs.existsSync(parentDir));
        }));
        test('mkdirp', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            yield pfs.mkdirp(newDir, 493);
            assert.ok(fs.existsSync(newDir));
            return pfs.rimraf(parentDir, pfs.RimRafMode.MOVE);
        }));
        test('mkdirp cancellation', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            const source = new cancellation_1.CancellationTokenSource();
            const mkdirpPromise = pfs.mkdirp(newDir, 493, source.token);
            source.cancel();
            yield mkdirpPromise;
            assert.ok(!fs.existsSync(newDir));
            return pfs.rimraf(parentDir, pfs.RimRafMode.MOVE);
        }));
        test('readDirsInDir', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            yield pfs.mkdirp(newDir, 493);
            fs.mkdirSync(path.join(newDir, 'somefolder1'));
            fs.mkdirSync(path.join(newDir, 'somefolder2'));
            fs.mkdirSync(path.join(newDir, 'somefolder3'));
            fs.writeFileSync(path.join(newDir, 'somefile.txt'), 'Contents');
            fs.writeFileSync(path.join(newDir, 'someOtherFile.txt'), 'Contents');
            const result = yield pfs.readDirsInDir(newDir);
            assert.equal(result.length, 3);
            assert.ok(result.indexOf('somefolder1') !== -1);
            assert.ok(result.indexOf('somefolder2') !== -1);
            assert.ok(result.indexOf('somefolder3') !== -1);
            yield pfs.rimraf(newDir);
        }));
        test('stat link', () => __awaiter(this, void 0, void 0, function* () {
            if (platform_1.isWindows) {
                return Promise.resolve(); // Symlinks are not the same on win, and we can not create them programitically without admin privileges
            }
            const id1 = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id1);
            const directory = path.join(parentDir, 'pfs', id1);
            const id2 = uuid.generateUuid();
            const symbolicLink = path.join(parentDir, 'pfs', id2);
            yield pfs.mkdirp(directory, 493);
            fs.symlinkSync(directory, symbolicLink);
            let statAndIsLink = yield pfs.statLink(directory);
            assert.ok(!statAndIsLink.isSymbolicLink);
            statAndIsLink = yield pfs.statLink(symbolicLink);
            assert.ok(statAndIsLink.isSymbolicLink);
            pfs.rimrafSync(directory);
        }));
        test('readdir', () => __awaiter(this, void 0, void 0, function* () {
            if (normalization_1.canNormalize && typeof process.versions['electron'] !== 'undefined' /* needs electron */) {
                const id = uuid.generateUuid();
                const parentDir = path.join(os.tmpdir(), 'vsctests', id);
                const newDir = path.join(parentDir, 'pfs', id, 'öäü');
                yield pfs.mkdirp(newDir, 493);
                assert.ok(fs.existsSync(newDir));
                const children = yield pfs.readdir(path.join(parentDir, 'pfs', id));
                assert.equal(children.some(n => n === 'öäü'), true); // Mac always converts to NFD, so
                yield pfs.rimraf(parentDir);
            }
        }));
        test('writeFile (string)', () => __awaiter(this, void 0, void 0, function* () {
            const smallData = 'Hello World';
            const bigData = (new Array(100 * 1024)).join('Large String\n');
            return testWriteFileAndFlush(smallData, smallData, bigData, bigData);
        }));
        test('writeFile (Buffer)', () => __awaiter(this, void 0, void 0, function* () {
            const smallData = 'Hello World';
            const bigData = (new Array(100 * 1024)).join('Large String\n');
            return testWriteFileAndFlush(Buffer.from(smallData), smallData, Buffer.from(bigData), bigData);
        }));
        test('writeFile (UInt8Array)', () => __awaiter(this, void 0, void 0, function* () {
            const smallData = 'Hello World';
            const bigData = (new Array(100 * 1024)).join('Large String\n');
            return testWriteFileAndFlush(buffer_1.VSBuffer.fromString(smallData).buffer, smallData, buffer_1.VSBuffer.fromString(bigData).buffer, bigData);
        }));
        test('writeFile (stream)', () => __awaiter(this, void 0, void 0, function* () {
            const smallData = 'Hello World';
            const bigData = (new Array(100 * 1024)).join('Large String\n');
            return testWriteFileAndFlush(toReadable(smallData), smallData, toReadable(bigData), bigData);
        }));
        function testWriteFileAndFlush(smallData, smallDataValue, bigData, bigDataValue) {
            return __awaiter(this, void 0, void 0, function* () {
                const id = uuid.generateUuid();
                const parentDir = path.join(os.tmpdir(), 'vsctests', id);
                const newDir = path.join(parentDir, 'pfs', id);
                const testFile = path.join(newDir, 'flushed.txt');
                yield pfs.mkdirp(newDir, 493);
                assert.ok(fs.existsSync(newDir));
                yield pfs.writeFile(testFile, smallData);
                assert.equal(fs.readFileSync(testFile), smallDataValue);
                yield pfs.writeFile(testFile, bigData);
                assert.equal(fs.readFileSync(testFile), bigDataValue);
                yield pfs.rimraf(parentDir);
            });
        }
        test('writeFile (file stream)', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const sourceFile = amd_1.getPathFromAmdModule(require, './fixtures/index.html');
            const newDir = path.join(parentDir, 'pfs', id);
            const testFile = path.join(newDir, 'flushed.txt');
            yield pfs.mkdirp(newDir, 493);
            assert.ok(fs.existsSync(newDir));
            yield pfs.writeFile(testFile, fs.createReadStream(sourceFile));
            assert.equal(fs.readFileSync(testFile).toString(), fs.readFileSync(sourceFile).toString());
            yield pfs.rimraf(parentDir);
        }));
        test('writeFile (string, error handling)', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            const testFile = path.join(newDir, 'flushed.txt');
            yield pfs.mkdirp(newDir, 493);
            assert.ok(fs.existsSync(newDir));
            fs.mkdirSync(testFile); // this will trigger an error because testFile is now a directory!
            let expectedError;
            try {
                yield pfs.writeFile(testFile, 'Hello World');
            }
            catch (error) {
                expectedError = error;
            }
            assert.ok(expectedError);
            yield pfs.rimraf(parentDir);
        }));
        test('writeFile (stream, error handling EISDIR)', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            const testFile = path.join(newDir, 'flushed.txt');
            yield pfs.mkdirp(newDir, 493);
            assert.ok(fs.existsSync(newDir));
            fs.mkdirSync(testFile); // this will trigger an error because testFile is now a directory!
            const readable = toReadable('Hello World');
            let expectedError;
            try {
                yield pfs.writeFile(testFile, readable);
            }
            catch (error) {
                expectedError = error;
            }
            if (!expectedError || expectedError.code !== 'EISDIR') {
                return Promise.reject(new Error('Expected EISDIR error for writing to folder but got: ' + (expectedError ? expectedError.code : 'no error')));
            }
            // verify that the stream is still consumable (for https://github.com/Microsoft/vscode/issues/42542)
            assert.equal(readable.read(), 'Hello World');
            yield pfs.rimraf(parentDir);
        }));
        test('writeFile (stream, error handling READERROR)', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            const testFile = path.join(newDir, 'flushed.txt');
            yield pfs.mkdirp(newDir, 493);
            assert.ok(fs.existsSync(newDir));
            let expectedError;
            try {
                yield pfs.writeFile(testFile, toReadable('Hello World', true /* throw error */));
            }
            catch (error) {
                expectedError = error;
            }
            if (!expectedError || expectedError.message !== readError) {
                return Promise.reject(new Error('Expected error for writing to folder'));
            }
            yield pfs.rimraf(parentDir);
        }));
        test('writeFile (stream, error handling EACCES)', () => __awaiter(this, void 0, void 0, function* () {
            if (platform_1.isLinux) {
                return Promise.resolve(); // somehow this test fails on Linux in our TFS builds
            }
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            const testFile = path.join(newDir, 'flushed.txt');
            yield pfs.mkdirp(newDir, 493);
            assert.ok(fs.existsSync(newDir));
            fs.writeFileSync(testFile, '');
            fs.chmodSync(testFile, 33060); // make readonly
            let expectedError;
            try {
                yield pfs.writeFile(testFile, toReadable('Hello World'));
            }
            catch (error) {
                expectedError = error;
            }
            if (!expectedError || !(expectedError.code !== 'EACCES' || expectedError.code !== 'EPERM')) {
                return Promise.reject(new Error('Expected EACCES/EPERM error for writing to folder but got: ' + (expectedError ? expectedError.code : 'no error')));
            }
            yield pfs.rimraf(parentDir);
        }));
        test('writeFile (file stream, error handling)', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const sourceFile = amd_1.getPathFromAmdModule(require, './fixtures/index.html');
            const newDir = path.join(parentDir, 'pfs', id);
            const testFile = path.join(newDir, 'flushed.txt');
            yield pfs.mkdirp(newDir, 493);
            assert.ok(fs.existsSync(newDir));
            fs.mkdirSync(testFile); // this will trigger an error because testFile is now a directory!
            let expectedError;
            try {
                yield pfs.writeFile(testFile, fs.createReadStream(sourceFile));
            }
            catch (error) {
                expectedError = error;
            }
            if (!expectedError) {
                return Promise.reject(new Error('Expected error for writing to folder'));
            }
            yield pfs.rimraf(parentDir);
        }));
        test('writeFileSync', () => __awaiter(this, void 0, void 0, function* () {
            const id = uuid.generateUuid();
            const parentDir = path.join(os.tmpdir(), 'vsctests', id);
            const newDir = path.join(parentDir, 'pfs', id);
            const testFile = path.join(newDir, 'flushed.txt');
            yield pfs.mkdirp(newDir, 493);
            assert.ok(fs.existsSync(newDir));
            pfs.writeFileSync(testFile, 'Hello World');
            assert.equal(fs.readFileSync(testFile), 'Hello World');
            const largeString = (new Array(100 * 1024)).join('Large String\n');
            pfs.writeFileSync(testFile, largeString);
            assert.equal(fs.readFileSync(testFile), largeString);
            yield pfs.rimraf(parentDir);
        }));
    });
});
//# sourceMappingURL=pfs.test.js.map