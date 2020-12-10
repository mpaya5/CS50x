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
define(["require", "exports", "assert", "os", "vs/platform/files/common/fileService", "vs/base/common/network", "vs/platform/files/node/diskFileSystemProvider", "vs/base/test/node/testUtils", "vs/base/common/uuid", "vs/base/common/path", "vs/base/common/amd", "vs/base/node/pfs", "vs/base/common/uri", "fs", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/buffer"], function (require, exports, assert, os_1, fileService_1, network_1, diskFileSystemProvider_1, testUtils_1, uuid_1, path_1, amd_1, pfs_1, uri_1, fs_1, files_1, log_1, platform_1, lifecycle_1, resources_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getByName(root, name) {
        if (root.children === undefined) {
            return null;
        }
        for (const child of root.children) {
            if (child.name === name) {
                return child;
            }
        }
        return null;
    }
    function toLineByLineReadable(content) {
        let chunks = content.split('\n');
        chunks = chunks.map((chunk, index) => {
            if (index === 0) {
                return chunk;
            }
            return '\n' + chunk;
        });
        return {
            read() {
                const chunk = chunks.shift();
                if (typeof chunk === 'string') {
                    return buffer_1.VSBuffer.fromString(chunk);
                }
                return null;
            }
        };
    }
    class TestDiskFileSystemProvider extends diskFileSystemProvider_1.DiskFileSystemProvider {
        constructor() {
            super(...arguments);
            this.totalBytesRead = 0;
            this.invalidStatSize = false;
        }
        get capabilities() {
            if (!this._testCapabilities) {
                this._testCapabilities =
                    2 /* FileReadWrite */ |
                        4 /* FileOpenReadWriteClose */ |
                        8 /* FileFolderCopy */;
                if (platform_1.isLinux) {
                    this._testCapabilities |= 1024 /* PathCaseSensitive */;
                }
            }
            return this._testCapabilities;
        }
        set capabilities(capabilities) {
            this._testCapabilities = capabilities;
        }
        setInvalidStatSize(disabled) {
            this.invalidStatSize = disabled;
        }
        stat(resource) {
            const _super = Object.create(null, {
                stat: { get: () => super.stat }
            });
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield _super.stat.call(this, resource);
                if (this.invalidStatSize) {
                    res.size = String(res.size); // for https://github.com/Microsoft/vscode/issues/72909
                }
                return res;
            });
        }
        read(fd, pos, data, offset, length) {
            const _super = Object.create(null, {
                read: { get: () => super.read }
            });
            return __awaiter(this, void 0, void 0, function* () {
                const bytesRead = yield _super.read.call(this, fd, pos, data, offset, length);
                this.totalBytesRead += bytesRead;
                return bytesRead;
            });
        }
        readFile(resource) {
            const _super = Object.create(null, {
                readFile: { get: () => super.readFile }
            });
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield _super.readFile.call(this, resource);
                this.totalBytesRead += res.byteLength;
                return res;
            });
        }
    }
    exports.TestDiskFileSystemProvider = TestDiskFileSystemProvider;
    suite('Disk File Service', function () {
        const parentDir = testUtils_1.getRandomTestPath(os_1.tmpdir(), 'vsctests', 'diskfileservice');
        const testSchema = 'test';
        let service;
        let fileProvider;
        let testProvider;
        let testDir;
        const disposables = new lifecycle_1.DisposableStore();
        // Given issues such as https://github.com/microsoft/vscode/issues/78602
        // we see random test failures when accessing the native file system. To
        // diagnose further, we retry node.js file access tests up to 3 times to
        // rule out any random disk issue.
        this.retries(3);
        setup(() => __awaiter(this, void 0, void 0, function* () {
            const logService = new log_1.NullLogService();
            service = new fileService_1.FileService(logService);
            disposables.add(service);
            fileProvider = new TestDiskFileSystemProvider(logService);
            disposables.add(service.registerProvider(network_1.Schemas.file, fileProvider));
            disposables.add(fileProvider);
            testProvider = new TestDiskFileSystemProvider(logService);
            disposables.add(service.registerProvider(testSchema, testProvider));
            disposables.add(testProvider);
            const id = uuid_1.generateUuid();
            testDir = path_1.join(parentDir, id);
            const sourceDir = amd_1.getPathFromAmdModule(require, './fixtures/service');
            yield pfs_1.copy(sourceDir, testDir);
        }));
        teardown(() => __awaiter(this, void 0, void 0, function* () {
            disposables.clear();
            yield pfs_1.rimraf(parentDir, pfs_1.RimRafMode.MOVE);
        }));
        test('createFolder', () => __awaiter(this, void 0, void 0, function* () {
            let event;
            disposables.add(service.onAfterOperation(e => event = e));
            const parent = yield service.resolve(uri_1.URI.file(testDir));
            const newFolderResource = uri_1.URI.file(path_1.join(parent.resource.fsPath, 'newFolder'));
            const newFolder = yield service.createFolder(newFolderResource);
            assert.equal(newFolder.name, 'newFolder');
            assert.equal(fs_1.existsSync(newFolder.resource.fsPath), true);
            assert.ok(event);
            assert.equal(event.resource.fsPath, newFolderResource.fsPath);
            assert.equal(event.operation, 0 /* CREATE */);
            assert.equal(event.target.resource.fsPath, newFolderResource.fsPath);
            assert.equal(event.target.isDirectory, true);
        }));
        test('createFolder: creating multiple folders at once', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let event;
                disposables.add(service.onAfterOperation(e => event = e));
                const multiFolderPaths = ['a', 'couple', 'of', 'folders'];
                const parent = yield service.resolve(uri_1.URI.file(testDir));
                const newFolderResource = uri_1.URI.file(path_1.join(parent.resource.fsPath, ...multiFolderPaths));
                const newFolder = yield service.createFolder(newFolderResource);
                const lastFolderName = multiFolderPaths[multiFolderPaths.length - 1];
                assert.equal(newFolder.name, lastFolderName);
                assert.equal(fs_1.existsSync(newFolder.resource.fsPath), true);
                assert.ok(event);
                assert.equal(event.resource.fsPath, newFolderResource.fsPath);
                assert.equal(event.operation, 0 /* CREATE */);
                assert.equal(event.target.resource.fsPath, newFolderResource.fsPath);
                assert.equal(event.target.isDirectory, true);
            });
        });
        test('exists', () => __awaiter(this, void 0, void 0, function* () {
            let exists = yield service.exists(uri_1.URI.file(testDir));
            assert.equal(exists, true);
            exists = yield service.exists(uri_1.URI.file(testDir + 'something'));
            assert.equal(exists, false);
        }));
        test('resolve', () => __awaiter(this, void 0, void 0, function* () {
            const resolved = yield service.resolve(uri_1.URI.file(testDir), { resolveTo: [uri_1.URI.file(path_1.join(testDir, 'deep'))] });
            assert.equal(resolved.children.length, 8);
            const deep = (getByName(resolved, 'deep'));
            assert.equal(deep.children.length, 4);
        }));
        test('resolve - directory', () => __awaiter(this, void 0, void 0, function* () {
            const testsElements = ['examples', 'other', 'index.html', 'site.css'];
            const result = yield service.resolve(uri_1.URI.file(amd_1.getPathFromAmdModule(require, './fixtures/resolver')));
            assert.ok(result);
            assert.ok(result.children);
            assert.ok(result.children.length > 0);
            assert.ok(result.isDirectory);
            assert.equal(result.children.length, testsElements.length);
            assert.ok(result.children.every(entry => {
                return testsElements.some(name => {
                    return path_1.basename(entry.resource.fsPath) === name;
                });
            }));
            result.children.forEach(value => {
                assert.ok(path_1.basename(value.resource.fsPath));
                if (['examples', 'other'].indexOf(path_1.basename(value.resource.fsPath)) >= 0) {
                    assert.ok(value.isDirectory);
                }
                else if (path_1.basename(value.resource.fsPath) === 'index.html') {
                    assert.ok(!value.isDirectory);
                    assert.ok(!value.children);
                }
                else if (path_1.basename(value.resource.fsPath) === 'site.css') {
                    assert.ok(!value.isDirectory);
                    assert.ok(!value.children);
                }
                else {
                    assert.ok(!'Unexpected value ' + path_1.basename(value.resource.fsPath));
                }
            });
        }));
        test('resolve - directory - with metadata', () => __awaiter(this, void 0, void 0, function* () {
            const testsElements = ['examples', 'other', 'index.html', 'site.css'];
            const result = yield service.resolve(uri_1.URI.file(amd_1.getPathFromAmdModule(require, './fixtures/resolver')), { resolveMetadata: true });
            assert.ok(result);
            assert.ok(result.children);
            assert.ok(result.children.length > 0);
            assert.ok(result.isDirectory);
            assert.equal(result.children.length, testsElements.length);
            assert.ok(result.children.every(entry => {
                return testsElements.some(name => {
                    return path_1.basename(entry.resource.fsPath) === name;
                });
            }));
            assert.ok(result.children.every(entry => entry.etag.length > 0));
            result.children.forEach(value => {
                assert.ok(path_1.basename(value.resource.fsPath));
                if (['examples', 'other'].indexOf(path_1.basename(value.resource.fsPath)) >= 0) {
                    assert.ok(value.isDirectory);
                }
                else if (path_1.basename(value.resource.fsPath) === 'index.html') {
                    assert.ok(!value.isDirectory);
                    assert.ok(!value.children);
                }
                else if (path_1.basename(value.resource.fsPath) === 'site.css') {
                    assert.ok(!value.isDirectory);
                    assert.ok(!value.children);
                }
                else {
                    assert.ok(!'Unexpected value ' + path_1.basename(value.resource.fsPath));
                }
            });
        }));
        test('resolve - directory - resolveTo single directory', () => __awaiter(this, void 0, void 0, function* () {
            const resolverFixturesPath = amd_1.getPathFromAmdModule(require, './fixtures/resolver');
            const result = yield service.resolve(uri_1.URI.file(resolverFixturesPath), { resolveTo: [uri_1.URI.file(path_1.join(resolverFixturesPath, 'other/deep'))] });
            assert.ok(result);
            assert.ok(result.children);
            assert.ok(result.children.length > 0);
            assert.ok(result.isDirectory);
            const children = result.children;
            assert.equal(children.length, 4);
            const other = getByName(result, 'other');
            assert.ok(other);
            assert.ok(other.children.length > 0);
            const deep = getByName(other, 'deep');
            assert.ok(deep);
            assert.ok(deep.children.length > 0);
            assert.equal(deep.children.length, 4);
        }));
        test('resolve directory - resolveTo multiple directories', () => __awaiter(this, void 0, void 0, function* () {
            const resolverFixturesPath = amd_1.getPathFromAmdModule(require, './fixtures/resolver');
            const result = yield service.resolve(uri_1.URI.file(resolverFixturesPath), {
                resolveTo: [
                    uri_1.URI.file(path_1.join(resolverFixturesPath, 'other/deep')),
                    uri_1.URI.file(path_1.join(resolverFixturesPath, 'examples'))
                ]
            });
            assert.ok(result);
            assert.ok(result.children);
            assert.ok(result.children.length > 0);
            assert.ok(result.isDirectory);
            const children = result.children;
            assert.equal(children.length, 4);
            const other = getByName(result, 'other');
            assert.ok(other);
            assert.ok(other.children.length > 0);
            const deep = getByName(other, 'deep');
            assert.ok(deep);
            assert.ok(deep.children.length > 0);
            assert.equal(deep.children.length, 4);
            const examples = getByName(result, 'examples');
            assert.ok(examples);
            assert.ok(examples.children.length > 0);
            assert.equal(examples.children.length, 4);
        }));
        test('resolve directory - resolveSingleChildFolders', () => __awaiter(this, void 0, void 0, function* () {
            const resolverFixturesPath = amd_1.getPathFromAmdModule(require, './fixtures/resolver/other');
            const result = yield service.resolve(uri_1.URI.file(resolverFixturesPath), { resolveSingleChildDescendants: true });
            assert.ok(result);
            assert.ok(result.children);
            assert.ok(result.children.length > 0);
            assert.ok(result.isDirectory);
            const children = result.children;
            assert.equal(children.length, 1);
            let deep = getByName(result, 'deep');
            assert.ok(deep);
            assert.ok(deep.children.length > 0);
            assert.equal(deep.children.length, 4);
        }));
        test('resolves', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield service.resolveAll([
                { resource: uri_1.URI.file(testDir), options: { resolveTo: [uri_1.URI.file(path_1.join(testDir, 'deep'))] } },
                { resource: uri_1.URI.file(path_1.join(testDir, 'deep')) }
            ]);
            const r1 = (res[0].stat);
            assert.equal(r1.children.length, 8);
            const deep = (getByName(r1, 'deep'));
            assert.equal(deep.children.length, 4);
            const r2 = (res[1].stat);
            assert.equal(r2.children.length, 4);
            assert.equal(r2.name, 'deep');
        }));
        test('resolve - folder symbolic link', () => __awaiter(this, void 0, void 0, function* () {
            if (platform_1.isWindows) {
                return; // not reliable on windows
            }
            const link = uri_1.URI.file(path_1.join(testDir, 'deep-link'));
            yield pfs_1.symlink(path_1.join(testDir, 'deep'), link.fsPath);
            const resolved = yield service.resolve(link);
            assert.equal(resolved.children.length, 4);
            assert.equal(resolved.isDirectory, true);
            assert.equal(resolved.isSymbolicLink, true);
        }));
        test('resolve - file symbolic link', () => __awaiter(this, void 0, void 0, function* () {
            if (platform_1.isWindows) {
                return; // not reliable on windows
            }
            const link = uri_1.URI.file(path_1.join(testDir, 'lorem.txt-linked'));
            yield pfs_1.symlink(path_1.join(testDir, 'lorem.txt'), link.fsPath);
            const resolved = yield service.resolve(link);
            assert.equal(resolved.isDirectory, false);
            assert.equal(resolved.isSymbolicLink, true);
        }));
        test('resolve - invalid symbolic link does not break', () => __awaiter(this, void 0, void 0, function* () {
            if (platform_1.isWindows) {
                return; // not reliable on windows
            }
            const link = uri_1.URI.file(path_1.join(testDir, 'foo'));
            yield pfs_1.symlink(link.fsPath, path_1.join(testDir, 'bar'));
            const resolved = yield service.resolve(uri_1.URI.file(testDir));
            assert.equal(resolved.isDirectory, true);
            assert.equal(resolved.children.length, 8);
        }));
        test('deleteFile', () => __awaiter(this, void 0, void 0, function* () {
            let event;
            disposables.add(service.onAfterOperation(e => event = e));
            const resource = uri_1.URI.file(path_1.join(testDir, 'deep', 'conway.js'));
            const source = yield service.resolve(resource);
            yield service.del(source.resource);
            assert.equal(fs_1.existsSync(source.resource.fsPath), false);
            assert.ok(event);
            assert.equal(event.resource.fsPath, resource.fsPath);
            assert.equal(event.operation, 1 /* DELETE */);
        }));
        test('deleteFolder (recursive)', () => __awaiter(this, void 0, void 0, function* () {
            let event;
            disposables.add(service.onAfterOperation(e => event = e));
            const resource = uri_1.URI.file(path_1.join(testDir, 'deep'));
            const source = yield service.resolve(resource);
            yield service.del(source.resource, { recursive: true });
            assert.equal(fs_1.existsSync(source.resource.fsPath), false);
            assert.ok(event);
            assert.equal(event.resource.fsPath, resource.fsPath);
            assert.equal(event.operation, 1 /* DELETE */);
        }));
        test('deleteFolder (non recursive)', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'deep'));
            const source = yield service.resolve(resource);
            let error;
            try {
                yield service.del(source.resource);
            }
            catch (e) {
                error = e;
            }
            assert.ok(error);
        }));
        test('move', () => __awaiter(this, void 0, void 0, function* () {
            let event;
            disposables.add(service.onAfterOperation(e => event = e));
            const source = uri_1.URI.file(path_1.join(testDir, 'index.html'));
            const sourceContents = fs_1.readFileSync(source.fsPath);
            const target = uri_1.URI.file(path_1.join(path_1.dirname(source.fsPath), 'other.html'));
            const renamed = yield service.move(source, target);
            assert.equal(fs_1.existsSync(renamed.resource.fsPath), true);
            assert.equal(fs_1.existsSync(source.fsPath), false);
            assert.ok(event);
            assert.equal(event.resource.fsPath, source.fsPath);
            assert.equal(event.operation, 2 /* MOVE */);
            assert.equal(event.target.resource.fsPath, renamed.resource.fsPath);
            const targetContents = fs_1.readFileSync(target.fsPath);
            assert.equal(sourceContents.byteLength, targetContents.byteLength);
            assert.equal(sourceContents.toString(), targetContents.toString());
        }));
        test('move - across providers (buffered => buffered)', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            setCapabilities(testProvider, 4 /* FileOpenReadWriteClose */);
            yield testMoveAcrossProviders();
        }));
        test('move - across providers (unbuffered => unbuffered)', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            setCapabilities(testProvider, 2 /* FileReadWrite */);
            yield testMoveAcrossProviders();
        }));
        test('move - across providers (buffered => unbuffered)', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            setCapabilities(testProvider, 2 /* FileReadWrite */);
            yield testMoveAcrossProviders();
        }));
        test('move - across providers (unbuffered => buffered)', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            setCapabilities(testProvider, 4 /* FileOpenReadWriteClose */);
            yield testMoveAcrossProviders();
        }));
        test('move - across providers - large (buffered => buffered)', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            setCapabilities(testProvider, 4 /* FileOpenReadWriteClose */);
            yield testMoveAcrossProviders('lorem.txt');
        }));
        test('move - across providers - large (unbuffered => unbuffered)', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            setCapabilities(testProvider, 2 /* FileReadWrite */);
            yield testMoveAcrossProviders('lorem.txt');
        }));
        test('move - across providers - large (buffered => unbuffered)', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            setCapabilities(testProvider, 2 /* FileReadWrite */);
            yield testMoveAcrossProviders('lorem.txt');
        }));
        test('move - across providers - large (unbuffered => buffered)', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            setCapabilities(testProvider, 4 /* FileOpenReadWriteClose */);
            yield testMoveAcrossProviders('lorem.txt');
        }));
        function testMoveAcrossProviders(sourceFile = 'index.html') {
            return __awaiter(this, void 0, void 0, function* () {
                let event;
                disposables.add(service.onAfterOperation(e => event = e));
                const source = uri_1.URI.file(path_1.join(testDir, sourceFile));
                const sourceContents = fs_1.readFileSync(source.fsPath);
                const target = uri_1.URI.file(path_1.join(path_1.dirname(source.fsPath), 'other.html')).with({ scheme: testSchema });
                const renamed = yield service.move(source, target);
                assert.equal(fs_1.existsSync(renamed.resource.fsPath), true);
                assert.equal(fs_1.existsSync(source.fsPath), false);
                assert.ok(event);
                assert.equal(event.resource.fsPath, source.fsPath);
                assert.equal(event.operation, 3 /* COPY */);
                assert.equal(event.target.resource.fsPath, renamed.resource.fsPath);
                const targetContents = fs_1.readFileSync(target.fsPath);
                assert.equal(sourceContents.byteLength, targetContents.byteLength);
                assert.equal(sourceContents.toString(), targetContents.toString());
            });
        }
        test('move - multi folder', () => __awaiter(this, void 0, void 0, function* () {
            let event;
            disposables.add(service.onAfterOperation(e => event = e));
            const multiFolderPaths = ['a', 'couple', 'of', 'folders'];
            const renameToPath = path_1.join(...multiFolderPaths, 'other.html');
            const source = uri_1.URI.file(path_1.join(testDir, 'index.html'));
            const renamed = yield service.move(source, uri_1.URI.file(path_1.join(path_1.dirname(source.fsPath), renameToPath)));
            assert.equal(fs_1.existsSync(renamed.resource.fsPath), true);
            assert.equal(fs_1.existsSync(source.fsPath), false);
            assert.ok(event);
            assert.equal(event.resource.fsPath, source.fsPath);
            assert.equal(event.operation, 2 /* MOVE */);
            assert.equal(event.target.resource.fsPath, renamed.resource.fsPath);
        }));
        test('move - directory', () => __awaiter(this, void 0, void 0, function* () {
            let event;
            disposables.add(service.onAfterOperation(e => event = e));
            const source = uri_1.URI.file(path_1.join(testDir, 'deep'));
            const renamed = yield service.move(source, uri_1.URI.file(path_1.join(path_1.dirname(source.fsPath), 'deeper')));
            assert.equal(fs_1.existsSync(renamed.resource.fsPath), true);
            assert.equal(fs_1.existsSync(source.fsPath), false);
            assert.ok(event);
            assert.equal(event.resource.fsPath, source.fsPath);
            assert.equal(event.operation, 2 /* MOVE */);
            assert.equal(event.target.resource.fsPath, renamed.resource.fsPath);
        }));
        test('move - directory - across providers (buffered => buffered)', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            setCapabilities(testProvider, 4 /* FileOpenReadWriteClose */);
            yield testMoveFolderAcrossProviders();
        }));
        test('move - directory - across providers (unbuffered => unbuffered)', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            setCapabilities(testProvider, 2 /* FileReadWrite */);
            yield testMoveFolderAcrossProviders();
        }));
        test('move - directory - across providers (buffered => unbuffered)', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            setCapabilities(testProvider, 2 /* FileReadWrite */);
            yield testMoveFolderAcrossProviders();
        }));
        test('move - directory - across providers (unbuffered => buffered)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                setCapabilities(fileProvider, 2 /* FileReadWrite */);
                setCapabilities(testProvider, 4 /* FileOpenReadWriteClose */);
                yield testMoveFolderAcrossProviders();
            });
        });
        function testMoveFolderAcrossProviders() {
            return __awaiter(this, void 0, void 0, function* () {
                let event;
                disposables.add(service.onAfterOperation(e => event = e));
                const source = uri_1.URI.file(path_1.join(testDir, 'deep'));
                const sourceChildren = fs_1.readdirSync(source.fsPath);
                const target = uri_1.URI.file(path_1.join(path_1.dirname(source.fsPath), 'deeper')).with({ scheme: testSchema });
                const renamed = yield service.move(source, target);
                assert.equal(fs_1.existsSync(renamed.resource.fsPath), true);
                assert.equal(fs_1.existsSync(source.fsPath), false);
                assert.ok(event);
                assert.equal(event.resource.fsPath, source.fsPath);
                assert.equal(event.operation, 3 /* COPY */);
                assert.equal(event.target.resource.fsPath, renamed.resource.fsPath);
                const targetChildren = fs_1.readdirSync(target.fsPath);
                assert.equal(sourceChildren.length, targetChildren.length);
                for (let i = 0; i < sourceChildren.length; i++) {
                    assert.equal(sourceChildren[i], targetChildren[i]);
                }
            });
        }
        test('move - MIX CASE', () => __awaiter(this, void 0, void 0, function* () {
            let event;
            disposables.add(service.onAfterOperation(e => event = e));
            const source = yield service.resolve(uri_1.URI.file(path_1.join(testDir, 'index.html')), { resolveMetadata: true });
            assert.ok(source.size > 0);
            const renamedResource = uri_1.URI.file(path_1.join(path_1.dirname(source.resource.fsPath), 'INDEX.html'));
            let renamed = yield service.move(source.resource, renamedResource);
            assert.equal(fs_1.existsSync(renamedResource.fsPath), true);
            assert.equal(path_1.basename(renamedResource.fsPath), 'INDEX.html');
            assert.ok(event);
            assert.equal(event.resource.fsPath, source.resource.fsPath);
            assert.equal(event.operation, 2 /* MOVE */);
            assert.equal(event.target.resource.fsPath, renamedResource.fsPath);
            renamed = yield service.resolve(renamedResource, { resolveMetadata: true });
            assert.equal(source.size, renamed.size);
        }));
        test('move - same file', () => __awaiter(this, void 0, void 0, function* () {
            let event;
            disposables.add(service.onAfterOperation(e => event = e));
            const source = yield service.resolve(uri_1.URI.file(path_1.join(testDir, 'index.html')), { resolveMetadata: true });
            assert.ok(source.size > 0);
            let renamed = yield service.move(source.resource, uri_1.URI.file(source.resource.fsPath));
            assert.equal(fs_1.existsSync(renamed.resource.fsPath), true);
            assert.equal(path_1.basename(renamed.resource.fsPath), 'index.html');
            assert.ok(event);
            assert.equal(event.resource.fsPath, source.resource.fsPath);
            assert.equal(event.operation, 2 /* MOVE */);
            assert.equal(event.target.resource.fsPath, renamed.resource.fsPath);
            renamed = yield service.resolve(renamed.resource, { resolveMetadata: true });
            assert.equal(source.size, renamed.size);
        }));
        test('move - same file #2', () => __awaiter(this, void 0, void 0, function* () {
            let event;
            disposables.add(service.onAfterOperation(e => event = e));
            const source = yield service.resolve(uri_1.URI.file(path_1.join(testDir, 'index.html')), { resolveMetadata: true });
            assert.ok(source.size > 0);
            const targetParent = uri_1.URI.file(testDir);
            const target = targetParent.with({ path: path_1.posix.join(targetParent.path, path_1.posix.basename(source.resource.path)) });
            let renamed = yield service.move(source.resource, target);
            assert.equal(fs_1.existsSync(renamed.resource.fsPath), true);
            assert.equal(path_1.basename(renamed.resource.fsPath), 'index.html');
            assert.ok(event);
            assert.equal(event.resource.fsPath, source.resource.fsPath);
            assert.equal(event.operation, 2 /* MOVE */);
            assert.equal(event.target.resource.fsPath, renamed.resource.fsPath);
            renamed = yield service.resolve(renamed.resource, { resolveMetadata: true });
            assert.equal(source.size, renamed.size);
        }));
        test('move - source parent of target', () => __awaiter(this, void 0, void 0, function* () {
            let event;
            disposables.add(service.onAfterOperation(e => event = e));
            let source = yield service.resolve(uri_1.URI.file(path_1.join(testDir, 'index.html')), { resolveMetadata: true });
            const originalSize = source.size;
            assert.ok(originalSize > 0);
            let error;
            try {
                yield service.move(uri_1.URI.file(testDir), uri_1.URI.file(path_1.join(testDir, 'binary.txt')));
            }
            catch (e) {
                error = e;
            }
            assert.ok(error);
            assert.ok(!event);
            source = yield service.resolve(source.resource, { resolveMetadata: true });
            assert.equal(originalSize, source.size);
        }));
        test('move - FILE_MOVE_CONFLICT', () => __awaiter(this, void 0, void 0, function* () {
            let event;
            disposables.add(service.onAfterOperation(e => event = e));
            let source = yield service.resolve(uri_1.URI.file(path_1.join(testDir, 'index.html')), { resolveMetadata: true });
            const originalSize = source.size;
            assert.ok(originalSize > 0);
            let error;
            try {
                yield service.move(source.resource, uri_1.URI.file(path_1.join(testDir, 'binary.txt')));
            }
            catch (e) {
                error = e;
            }
            assert.equal(error.fileOperationResult, 4 /* FILE_MOVE_CONFLICT */);
            assert.ok(!event);
            source = yield service.resolve(source.resource, { resolveMetadata: true });
            assert.equal(originalSize, source.size);
        }));
        test('move - overwrite folder with file', () => __awaiter(this, void 0, void 0, function* () {
            let createEvent;
            let moveEvent;
            let deleteEvent;
            disposables.add(service.onAfterOperation(e => {
                if (e.operation === 0 /* CREATE */) {
                    createEvent = e;
                }
                else if (e.operation === 1 /* DELETE */) {
                    deleteEvent = e;
                }
                else if (e.operation === 2 /* MOVE */) {
                    moveEvent = e;
                }
            }));
            const parent = yield service.resolve(uri_1.URI.file(testDir));
            const folderResource = uri_1.URI.file(path_1.join(parent.resource.fsPath, 'conway.js'));
            const f = yield service.createFolder(folderResource);
            const source = uri_1.URI.file(path_1.join(testDir, 'deep', 'conway.js'));
            const moved = yield service.move(source, f.resource, true);
            assert.equal(fs_1.existsSync(moved.resource.fsPath), true);
            assert.ok(fs_1.statSync(moved.resource.fsPath).isFile);
            assert.ok(createEvent);
            assert.ok(deleteEvent);
            assert.ok(moveEvent);
            assert.equal(moveEvent.resource.fsPath, source.fsPath);
            assert.equal(moveEvent.target.resource.fsPath, moved.resource.fsPath);
            assert.equal(deleteEvent.resource.fsPath, folderResource.fsPath);
        }));
        test('copy', () => __awaiter(this, void 0, void 0, function* () {
            yield doTestCopy();
        }));
        test('copy - unbuffered (FileSystemProviderCapabilities.FileReadWrite)', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            yield doTestCopy();
        }));
        test('copy - unbuffered large (FileSystemProviderCapabilities.FileReadWrite)', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            yield doTestCopy('lorem.txt');
        }));
        test('copy - buffered (FileSystemProviderCapabilities.FileOpenReadWriteClose)', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            yield doTestCopy();
        }));
        test('copy - buffered large (FileSystemProviderCapabilities.FileOpenReadWriteClose)', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            yield doTestCopy('lorem.txt');
        }));
        function setCapabilities(provider, capabilities) {
            provider.capabilities = capabilities;
            if (platform_1.isLinux) {
                provider.capabilities |= 1024 /* PathCaseSensitive */;
            }
        }
        function doTestCopy(sourceName = 'index.html') {
            return __awaiter(this, void 0, void 0, function* () {
                let event;
                disposables.add(service.onAfterOperation(e => event = e));
                const source = yield service.resolve(uri_1.URI.file(path_1.join(testDir, sourceName)));
                const target = uri_1.URI.file(path_1.join(testDir, 'other.html'));
                const copied = yield service.copy(source.resource, target);
                assert.equal(fs_1.existsSync(copied.resource.fsPath), true);
                assert.equal(fs_1.existsSync(source.resource.fsPath), true);
                assert.ok(event);
                assert.equal(event.resource.fsPath, source.resource.fsPath);
                assert.equal(event.operation, 3 /* COPY */);
                assert.equal(event.target.resource.fsPath, copied.resource.fsPath);
                const sourceContents = fs_1.readFileSync(source.resource.fsPath);
                const targetContents = fs_1.readFileSync(target.fsPath);
                assert.equal(sourceContents.byteLength, targetContents.byteLength);
                assert.equal(sourceContents.toString(), targetContents.toString());
            });
        }
        test('copy - overwrite folder with file', () => __awaiter(this, void 0, void 0, function* () {
            let createEvent;
            let copyEvent;
            let deleteEvent;
            disposables.add(service.onAfterOperation(e => {
                if (e.operation === 0 /* CREATE */) {
                    createEvent = e;
                }
                else if (e.operation === 1 /* DELETE */) {
                    deleteEvent = e;
                }
                else if (e.operation === 3 /* COPY */) {
                    copyEvent = e;
                }
            }));
            const parent = yield service.resolve(uri_1.URI.file(testDir));
            const folderResource = uri_1.URI.file(path_1.join(parent.resource.fsPath, 'conway.js'));
            const f = yield service.createFolder(folderResource);
            const source = uri_1.URI.file(path_1.join(testDir, 'deep', 'conway.js'));
            const copied = yield service.copy(source, f.resource, true);
            assert.equal(fs_1.existsSync(copied.resource.fsPath), true);
            assert.ok(fs_1.statSync(copied.resource.fsPath).isFile);
            assert.ok(createEvent);
            assert.ok(deleteEvent);
            assert.ok(copyEvent);
            assert.equal(copyEvent.resource.fsPath, source.fsPath);
            assert.equal(copyEvent.target.resource.fsPath, copied.resource.fsPath);
            assert.equal(deleteEvent.resource.fsPath, folderResource.fsPath);
        }));
        test('copy - MIX CASE same target - no overwrite', () => __awaiter(this, void 0, void 0, function* () {
            let source = yield service.resolve(uri_1.URI.file(path_1.join(testDir, 'index.html')), { resolveMetadata: true });
            const originalSize = source.size;
            assert.ok(originalSize > 0);
            const target = uri_1.URI.file(path_1.join(path_1.dirname(source.resource.fsPath), 'INDEX.html'));
            let error;
            let copied;
            try {
                copied = yield service.copy(source.resource, target);
            }
            catch (e) {
                error = e;
            }
            if (platform_1.isLinux) {
                assert.ok(!error);
                assert.equal(fs_1.existsSync(copied.resource.fsPath), true);
                assert.ok(fs_1.readdirSync(testDir).some(f => f === 'INDEX.html'));
                assert.equal(source.size, copied.size);
            }
            else {
                assert.ok(error);
                source = yield service.resolve(source.resource, { resolveMetadata: true });
                assert.equal(originalSize, source.size);
            }
        }));
        test('copy - MIX CASE same target - overwrite', () => __awaiter(this, void 0, void 0, function* () {
            let source = yield service.resolve(uri_1.URI.file(path_1.join(testDir, 'index.html')), { resolveMetadata: true });
            const originalSize = source.size;
            assert.ok(originalSize > 0);
            const target = uri_1.URI.file(path_1.join(path_1.dirname(source.resource.fsPath), 'INDEX.html'));
            let error;
            let copied;
            try {
                copied = yield service.copy(source.resource, target, true);
            }
            catch (e) {
                error = e;
            }
            if (platform_1.isLinux) {
                assert.ok(!error);
                assert.equal(fs_1.existsSync(copied.resource.fsPath), true);
                assert.ok(fs_1.readdirSync(testDir).some(f => f === 'INDEX.html'));
                assert.equal(source.size, copied.size);
            }
            else {
                assert.ok(error);
                source = yield service.resolve(source.resource, { resolveMetadata: true });
                assert.equal(originalSize, source.size);
            }
        }));
        test('copy - MIX CASE different taget - overwrite', () => __awaiter(this, void 0, void 0, function* () {
            const source = yield service.resolve(uri_1.URI.file(path_1.join(testDir, 'index.html')), { resolveMetadata: true });
            assert.ok(source.size > 0);
            const renamed = yield service.move(source.resource, uri_1.URI.file(path_1.join(path_1.dirname(source.resource.fsPath), 'CONWAY.js')));
            assert.equal(fs_1.existsSync(renamed.resource.fsPath), true);
            assert.ok(fs_1.readdirSync(testDir).some(f => f === 'CONWAY.js'));
            assert.equal(source.size, renamed.size);
            const source_1 = yield service.resolve(uri_1.URI.file(path_1.join(testDir, 'deep', 'conway.js')), { resolveMetadata: true });
            const target = uri_1.URI.file(path_1.join(testDir, path_1.basename(source_1.resource.path)));
            const res = yield service.copy(source_1.resource, target, true);
            assert.equal(fs_1.existsSync(res.resource.fsPath), true);
            assert.ok(fs_1.readdirSync(testDir).some(f => f === 'conway.js'));
            assert.equal(source_1.size, res.size);
        }));
        test('copy - same file', () => __awaiter(this, void 0, void 0, function* () {
            let event;
            disposables.add(service.onAfterOperation(e => event = e));
            const source = yield service.resolve(uri_1.URI.file(path_1.join(testDir, 'index.html')), { resolveMetadata: true });
            assert.ok(source.size > 0);
            let copied = yield service.copy(source.resource, uri_1.URI.file(source.resource.fsPath));
            assert.equal(fs_1.existsSync(copied.resource.fsPath), true);
            assert.equal(path_1.basename(copied.resource.fsPath), 'index.html');
            assert.ok(event);
            assert.equal(event.resource.fsPath, source.resource.fsPath);
            assert.equal(event.operation, 3 /* COPY */);
            assert.equal(event.target.resource.fsPath, copied.resource.fsPath);
            copied = yield service.resolve(source.resource, { resolveMetadata: true });
            assert.equal(source.size, copied.size);
        }));
        test('copy - same file #2', () => __awaiter(this, void 0, void 0, function* () {
            let event;
            disposables.add(service.onAfterOperation(e => event = e));
            const source = yield service.resolve(uri_1.URI.file(path_1.join(testDir, 'index.html')), { resolveMetadata: true });
            assert.ok(source.size > 0);
            const targetParent = uri_1.URI.file(testDir);
            const target = targetParent.with({ path: path_1.posix.join(targetParent.path, path_1.posix.basename(source.resource.path)) });
            let copied = yield service.copy(source.resource, uri_1.URI.file(target.fsPath));
            assert.equal(fs_1.existsSync(copied.resource.fsPath), true);
            assert.equal(path_1.basename(copied.resource.fsPath), 'index.html');
            assert.ok(event);
            assert.equal(event.resource.fsPath, source.resource.fsPath);
            assert.equal(event.operation, 3 /* COPY */);
            assert.equal(event.target.resource.fsPath, copied.resource.fsPath);
            copied = yield service.resolve(source.resource, { resolveMetadata: true });
            assert.equal(source.size, copied.size);
        }));
        test('readFile - small file - buffered', () => {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            return testReadFile(uri_1.URI.file(path_1.join(testDir, 'small.txt')));
        });
        test('readFile - small file - buffered / readonly', () => {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */ | 2048 /* Readonly */);
            return testReadFile(uri_1.URI.file(path_1.join(testDir, 'small.txt')));
        });
        test('readFile - small file - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            return testReadFile(uri_1.URI.file(path_1.join(testDir, 'small.txt')));
        }));
        test('readFile - small file - unbuffered / readonly', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */ | 2048 /* Readonly */);
            return testReadFile(uri_1.URI.file(path_1.join(testDir, 'small.txt')));
        }));
        test('readFile - large file - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            return testReadFile(uri_1.URI.file(path_1.join(testDir, 'lorem.txt')));
        }));
        test('readFile - large file - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            return testReadFile(uri_1.URI.file(path_1.join(testDir, 'lorem.txt')));
        }));
        function testReadFile(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                const content = yield service.readFile(resource);
                assert.equal(content.value.toString(), fs_1.readFileSync(resource.fsPath));
            });
        }
        test('readFile - Files are intermingled #38331 - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            let resource1 = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            let resource2 = uri_1.URI.file(path_1.join(testDir, 'some_utf16le.css'));
            // load in sequence and keep data
            const value1 = yield service.readFile(resource1);
            const value2 = yield service.readFile(resource2);
            // load in parallel in expect the same result
            const result = yield Promise.all([
                service.readFile(resource1),
                service.readFile(resource2)
            ]);
            assert.equal(result[0].value.toString(), value1.value.toString());
            assert.equal(result[1].value.toString(), value2.value.toString());
        }));
        test('readFile - Files are intermingled #38331 - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            let resource1 = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            let resource2 = uri_1.URI.file(path_1.join(testDir, 'some_utf16le.css'));
            // load in sequence and keep data
            const value1 = yield service.readFile(resource1);
            const value2 = yield service.readFile(resource2);
            // load in parallel in expect the same result
            const result = yield Promise.all([
                service.readFile(resource1),
                service.readFile(resource2)
            ]);
            assert.equal(result[0].value.toString(), value1.value.toString());
            assert.equal(result[1].value.toString(), value2.value.toString());
        }));
        test('readFile - from position (ASCII) - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const contents = yield service.readFile(resource, { position: 6 });
            assert.equal(contents.value.toString(), 'File');
        }));
        test('readFile - from position (with umlaut) - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_umlaut.txt'));
            const contents = yield service.readFile(resource, { position: Buffer.from('Small File with Ü').length });
            assert.equal(contents.value.toString(), 'mlaut');
        }));
        test('readFile - from position (ASCII) - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const contents = yield service.readFile(resource, { position: 6 });
            assert.equal(contents.value.toString(), 'File');
        }));
        test('readFile - from position (with umlaut) - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_umlaut.txt'));
            const contents = yield service.readFile(resource, { position: Buffer.from('Small File with Ü').length });
            assert.equal(contents.value.toString(), 'mlaut');
        }));
        test('readFile - 3 bytes (ASCII) - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const contents = yield service.readFile(resource, { length: 3 });
            assert.equal(contents.value.toString(), 'Sma');
        }));
        test('readFile - 3 bytes (ASCII) - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const contents = yield service.readFile(resource, { length: 3 });
            assert.equal(contents.value.toString(), 'Sma');
        }));
        test('readFile - 20000 bytes (large) - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            const contents = yield service.readFile(resource, { length: 20000 });
            assert.equal(contents.value.byteLength, 20000);
        }));
        test('readFile - 20000 bytes (large) - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            const contents = yield service.readFile(resource, { length: 20000 });
            assert.equal(contents.value.byteLength, 20000);
        }));
        test('readFile - 80000 bytes (large) - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            const contents = yield service.readFile(resource, { length: 80000 });
            assert.equal(contents.value.byteLength, 80000);
        }));
        test('readFile - 80000 bytes (large) - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            const contents = yield service.readFile(resource, { length: 80000 });
            assert.equal(contents.value.byteLength, 80000);
        }));
        test('readFile - FILE_IS_DIRECTORY', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'deep'));
            let error = undefined;
            try {
                yield service.readFile(resource);
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.equal(error.fileOperationResult, 0 /* FILE_IS_DIRECTORY */);
        }));
        test('readFile - FILE_NOT_FOUND', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, '404.html'));
            let error = undefined;
            try {
                yield service.readFile(resource);
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.equal(error.fileOperationResult, 1 /* FILE_NOT_FOUND */);
        }));
        test('readFile - FILE_NOT_MODIFIED_SINCE - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'index.html'));
            const contents = yield service.readFile(resource);
            fileProvider.totalBytesRead = 0;
            let error = undefined;
            try {
                yield service.readFile(resource, { etag: contents.etag });
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.equal(error.fileOperationResult, 2 /* FILE_NOT_MODIFIED_SINCE */);
            assert.equal(fileProvider.totalBytesRead, 0);
        }));
        test('readFile - FILE_NOT_MODIFIED_SINCE does not fire wrongly - https://github.com/Microsoft/vscode/issues/72909', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            fileProvider.setInvalidStatSize(true);
            const resource = uri_1.URI.file(path_1.join(testDir, 'index.html'));
            yield service.readFile(resource);
            let error = undefined;
            try {
                yield service.readFile(resource, { etag: undefined });
            }
            catch (err) {
                error = err;
            }
            assert.ok(!error);
        }));
        test('readFile - FILE_NOT_MODIFIED_SINCE - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'index.html'));
            const contents = yield service.readFile(resource);
            fileProvider.totalBytesRead = 0;
            let error = undefined;
            try {
                yield service.readFile(resource, { etag: contents.etag });
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.equal(error.fileOperationResult, 2 /* FILE_NOT_MODIFIED_SINCE */);
            assert.equal(fileProvider.totalBytesRead, 0);
        }));
        test('readFile - FILE_EXCEED_MEMORY_LIMIT - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'index.html'));
            let error = undefined;
            try {
                yield service.readFile(resource, { limits: { memory: 10 } });
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.equal(error.fileOperationResult, 9 /* FILE_EXCEED_MEMORY_LIMIT */);
        }));
        test('readFile - FILE_EXCEED_MEMORY_LIMIT - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'index.html'));
            let error = undefined;
            try {
                yield service.readFile(resource, { limits: { memory: 10 } });
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.equal(error.fileOperationResult, 9 /* FILE_EXCEED_MEMORY_LIMIT */);
        }));
        test('readFile - FILE_TOO_LARGE - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'index.html'));
            let error = undefined;
            try {
                yield service.readFile(resource, { limits: { size: 10 } });
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.equal(error.fileOperationResult, 7 /* FILE_TOO_LARGE */);
        }));
        test('readFile - FILE_TOO_LARGE - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'index.html'));
            let error = undefined;
            try {
                yield service.readFile(resource, { limits: { size: 10 } });
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.equal(error.fileOperationResult, 7 /* FILE_TOO_LARGE */);
        }));
        test('createFile', () => __awaiter(this, void 0, void 0, function* () {
            assertCreateFile(contents => buffer_1.VSBuffer.fromString(contents));
        }));
        test('createFile (readable)', () => __awaiter(this, void 0, void 0, function* () {
            assertCreateFile(contents => buffer_1.bufferToReadable(buffer_1.VSBuffer.fromString(contents)));
        }));
        test('createFile (stream)', () => __awaiter(this, void 0, void 0, function* () {
            assertCreateFile(contents => buffer_1.bufferToStream(buffer_1.VSBuffer.fromString(contents)));
        }));
        function assertCreateFile(converter) {
            return __awaiter(this, void 0, void 0, function* () {
                let event;
                disposables.add(service.onAfterOperation(e => event = e));
                const contents = 'Hello World';
                const resource = uri_1.URI.file(path_1.join(testDir, 'test.txt'));
                const fileStat = yield service.createFile(resource, converter(contents));
                assert.equal(fileStat.name, 'test.txt');
                assert.equal(fs_1.existsSync(fileStat.resource.fsPath), true);
                assert.equal(fs_1.readFileSync(fileStat.resource.fsPath), contents);
                assert.ok(event);
                assert.equal(event.resource.fsPath, resource.fsPath);
                assert.equal(event.operation, 0 /* CREATE */);
                assert.equal(event.target.resource.fsPath, resource.fsPath);
            });
        }
        test('createFile (does not overwrite by default)', () => __awaiter(this, void 0, void 0, function* () {
            const contents = 'Hello World';
            const resource = uri_1.URI.file(path_1.join(testDir, 'test.txt'));
            fs_1.writeFileSync(resource.fsPath, ''); // create file
            let error;
            try {
                yield service.createFile(resource, buffer_1.VSBuffer.fromString(contents));
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
        }));
        test('createFile (allows to overwrite existing)', () => __awaiter(this, void 0, void 0, function* () {
            let event;
            disposables.add(service.onAfterOperation(e => event = e));
            const contents = 'Hello World';
            const resource = uri_1.URI.file(path_1.join(testDir, 'test.txt'));
            fs_1.writeFileSync(resource.fsPath, ''); // create file
            const fileStat = yield service.createFile(resource, buffer_1.VSBuffer.fromString(contents), { overwrite: true });
            assert.equal(fileStat.name, 'test.txt');
            assert.equal(fs_1.existsSync(fileStat.resource.fsPath), true);
            assert.equal(fs_1.readFileSync(fileStat.resource.fsPath), contents);
            assert.ok(event);
            assert.equal(event.resource.fsPath, resource.fsPath);
            assert.equal(event.operation, 0 /* CREATE */);
            assert.equal(event.target.resource.fsPath, resource.fsPath);
        }));
        test('writeFile - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const content = fs_1.readFileSync(resource.fsPath);
            assert.equal(content, 'Small File');
            const newContent = 'Updates to the small file';
            yield service.writeFile(resource, buffer_1.VSBuffer.fromString(newContent));
            assert.equal(fs_1.readFileSync(resource.fsPath), newContent);
        }));
        test('writeFile (large file) - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            const content = fs_1.readFileSync(resource.fsPath);
            const newContent = content.toString() + content.toString();
            const fileStat = yield service.writeFile(resource, buffer_1.VSBuffer.fromString(newContent));
            assert.equal(fileStat.name, 'lorem.txt');
            assert.equal(fs_1.readFileSync(resource.fsPath), newContent);
        }));
        test('writeFile - buffered - readonly throws', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */ | 2048 /* Readonly */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const content = fs_1.readFileSync(resource.fsPath);
            assert.equal(content, 'Small File');
            const newContent = 'Updates to the small file';
            let error;
            try {
                yield service.writeFile(resource, buffer_1.VSBuffer.fromString(newContent));
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
        }));
        test('writeFile - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const content = fs_1.readFileSync(resource.fsPath);
            assert.equal(content, 'Small File');
            const newContent = 'Updates to the small file';
            yield service.writeFile(resource, buffer_1.VSBuffer.fromString(newContent));
            assert.equal(fs_1.readFileSync(resource.fsPath), newContent);
        }));
        test('writeFile (large file) - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            const content = fs_1.readFileSync(resource.fsPath);
            const newContent = content.toString() + content.toString();
            const fileStat = yield service.writeFile(resource, buffer_1.VSBuffer.fromString(newContent));
            assert.equal(fileStat.name, 'lorem.txt');
            assert.equal(fs_1.readFileSync(resource.fsPath), newContent);
        }));
        test('writeFile - unbuffered - readonly throws', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */ | 2048 /* Readonly */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const content = fs_1.readFileSync(resource.fsPath);
            assert.equal(content, 'Small File');
            const newContent = 'Updates to the small file';
            let error;
            try {
                yield service.writeFile(resource, buffer_1.VSBuffer.fromString(newContent));
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
        }));
        test('writeFile (large file) - multiple parallel writes queue up', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            const content = fs_1.readFileSync(resource.fsPath);
            const newContent = content.toString() + content.toString();
            yield Promise.all(['0', '00', '000', '0000', '00000'].map((offset) => __awaiter(this, void 0, void 0, function* () {
                const fileStat = yield service.writeFile(resource, buffer_1.VSBuffer.fromString(offset + newContent));
                assert.equal(fileStat.name, 'lorem.txt');
            })));
            const fileContent = fs_1.readFileSync(resource.fsPath).toString();
            assert.ok(['0', '00', '000', '0000', '00000'].some(offset => fileContent === offset + newContent));
        }));
        test('writeFile (readable) - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const content = fs_1.readFileSync(resource.fsPath);
            assert.equal(content, 'Small File');
            const newContent = 'Updates to the small file';
            yield service.writeFile(resource, toLineByLineReadable(newContent));
            assert.equal(fs_1.readFileSync(resource.fsPath), newContent);
        }));
        test('writeFile (large file - readable) - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            const content = fs_1.readFileSync(resource.fsPath);
            const newContent = content.toString() + content.toString();
            const fileStat = yield service.writeFile(resource, toLineByLineReadable(newContent));
            assert.equal(fileStat.name, 'lorem.txt');
            assert.equal(fs_1.readFileSync(resource.fsPath), newContent);
        }));
        test('writeFile (readable) - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const content = fs_1.readFileSync(resource.fsPath);
            assert.equal(content, 'Small File');
            const newContent = 'Updates to the small file';
            yield service.writeFile(resource, toLineByLineReadable(newContent));
            assert.equal(fs_1.readFileSync(resource.fsPath), newContent);
        }));
        test('writeFile (large file - readable) - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            const resource = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            const content = fs_1.readFileSync(resource.fsPath);
            const newContent = content.toString() + content.toString();
            const fileStat = yield service.writeFile(resource, toLineByLineReadable(newContent));
            assert.equal(fileStat.name, 'lorem.txt');
            assert.equal(fs_1.readFileSync(resource.fsPath), newContent);
        }));
        test('writeFile (stream) - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            const source = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const target = uri_1.URI.file(path_1.join(testDir, 'small-copy.txt'));
            const fileStat = yield service.writeFile(target, buffer_1.toVSBufferReadableStream(fs_1.createReadStream(source.fsPath)));
            assert.equal(fileStat.name, 'small-copy.txt');
            assert.equal(fs_1.readFileSync(source.fsPath).toString(), fs_1.readFileSync(target.fsPath).toString());
        }));
        test('writeFile (large file - stream) - buffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 4 /* FileOpenReadWriteClose */);
            const source = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            const target = uri_1.URI.file(path_1.join(testDir, 'lorem-copy.txt'));
            const fileStat = yield service.writeFile(target, buffer_1.toVSBufferReadableStream(fs_1.createReadStream(source.fsPath)));
            assert.equal(fileStat.name, 'lorem-copy.txt');
            assert.equal(fs_1.readFileSync(source.fsPath).toString(), fs_1.readFileSync(target.fsPath).toString());
        }));
        test('writeFile (stream) - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            const source = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const target = uri_1.URI.file(path_1.join(testDir, 'small-copy.txt'));
            const fileStat = yield service.writeFile(target, buffer_1.toVSBufferReadableStream(fs_1.createReadStream(source.fsPath)));
            assert.equal(fileStat.name, 'small-copy.txt');
            assert.equal(fs_1.readFileSync(source.fsPath).toString(), fs_1.readFileSync(target.fsPath).toString());
        }));
        test('writeFile (large file - stream) - unbuffered', () => __awaiter(this, void 0, void 0, function* () {
            setCapabilities(fileProvider, 2 /* FileReadWrite */);
            const source = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            const target = uri_1.URI.file(path_1.join(testDir, 'lorem-copy.txt'));
            const fileStat = yield service.writeFile(target, buffer_1.toVSBufferReadableStream(fs_1.createReadStream(source.fsPath)));
            assert.equal(fileStat.name, 'lorem-copy.txt');
            assert.equal(fs_1.readFileSync(source.fsPath).toString(), fs_1.readFileSync(target.fsPath).toString());
        }));
        test('writeFile (file is created including parents)', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'other', 'newfile.txt'));
            const content = 'File is created including parent';
            const fileStat = yield service.writeFile(resource, buffer_1.VSBuffer.fromString(content));
            assert.equal(fileStat.name, 'newfile.txt');
            assert.equal(fs_1.readFileSync(resource.fsPath), content);
        }));
        test('writeFile (error when folder is encountered)', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(testDir);
            let error = undefined;
            try {
                yield service.writeFile(resource, buffer_1.VSBuffer.fromString('File is created including parent'));
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
        }));
        test('writeFile (no error when providing up to date etag)', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const stat = yield service.resolve(resource);
            const content = fs_1.readFileSync(resource.fsPath);
            assert.equal(content, 'Small File');
            const newContent = 'Updates to the small file';
            yield service.writeFile(resource, buffer_1.VSBuffer.fromString(newContent), { etag: stat.etag, mtime: stat.mtime });
            assert.equal(fs_1.readFileSync(resource.fsPath), newContent);
        }));
        test('writeFile - error when writing to file that has been updated meanwhile', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const stat = yield service.resolve(resource);
            const content = fs_1.readFileSync(resource.fsPath).toString();
            assert.equal(content, 'Small File');
            const newContent = 'Updates to the small file';
            yield service.writeFile(resource, buffer_1.VSBuffer.fromString(newContent), { etag: stat.etag, mtime: stat.mtime });
            const newContentLeadingToError = newContent + newContent;
            const fakeMtime = 1000;
            const fakeSize = 1000;
            let error = undefined;
            try {
                yield service.writeFile(resource, buffer_1.VSBuffer.fromString(newContentLeadingToError), { etag: files_1.etag({ mtime: fakeMtime, size: fakeSize }), mtime: fakeMtime });
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.ok(error instanceof files_1.FileOperationError);
            assert.equal(error.fileOperationResult, 3 /* FILE_MODIFIED_SINCE */);
        }));
        test('writeFile - no error when writing to file where size is the same', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const stat = yield service.resolve(resource);
            const content = fs_1.readFileSync(resource.fsPath).toString();
            assert.equal(content, 'Small File');
            const newContent = content; // same content
            yield service.writeFile(resource, buffer_1.VSBuffer.fromString(newContent), { etag: stat.etag, mtime: stat.mtime });
            const newContentLeadingToNoError = newContent; // writing the same content should be OK
            const fakeMtime = 1000;
            const actualSize = newContent.length;
            let error = undefined;
            try {
                yield service.writeFile(resource, buffer_1.VSBuffer.fromString(newContentLeadingToNoError), { etag: files_1.etag({ mtime: fakeMtime, size: actualSize }), mtime: fakeMtime });
            }
            catch (err) {
                error = err;
            }
            assert.ok(!error);
        }));
        const runWatchTests = platform_1.isLinux;
        (runWatchTests ? test : test.skip)('watch - file', done => {
            const toWatch = uri_1.URI.file(path_1.join(testDir, 'index-watch1.html'));
            fs_1.writeFileSync(toWatch.fsPath, 'Init');
            assertWatch(toWatch, [[0 /* UPDATED */, toWatch]], done);
            setTimeout(() => fs_1.writeFileSync(toWatch.fsPath, 'Changes'), 50);
        });
        (runWatchTests && !platform_1.isWindows /* symbolic links not reliable on windows */ ? test : test.skip)('watch - file symbolic link', (done) => __awaiter(this, void 0, void 0, function* () {
            const toWatch = uri_1.URI.file(path_1.join(testDir, 'lorem.txt-linked'));
            yield pfs_1.symlink(path_1.join(testDir, 'lorem.txt'), toWatch.fsPath);
            assertWatch(toWatch, [[0 /* UPDATED */, toWatch]], done);
            setTimeout(() => fs_1.writeFileSync(toWatch.fsPath, 'Changes'), 50);
        }));
        (runWatchTests ? test : test.skip)('watch - file - multiple writes', done => {
            const toWatch = uri_1.URI.file(path_1.join(testDir, 'index-watch1.html'));
            fs_1.writeFileSync(toWatch.fsPath, 'Init');
            assertWatch(toWatch, [[0 /* UPDATED */, toWatch]], done);
            setTimeout(() => fs_1.writeFileSync(toWatch.fsPath, 'Changes 1'), 0);
            setTimeout(() => fs_1.writeFileSync(toWatch.fsPath, 'Changes 2'), 10);
            setTimeout(() => fs_1.writeFileSync(toWatch.fsPath, 'Changes 3'), 20);
        });
        (runWatchTests ? test : test.skip)('watch - file - delete file', done => {
            const toWatch = uri_1.URI.file(path_1.join(testDir, 'index-watch1.html'));
            fs_1.writeFileSync(toWatch.fsPath, 'Init');
            assertWatch(toWatch, [[2 /* DELETED */, toWatch]], done);
            setTimeout(() => fs_1.unlinkSync(toWatch.fsPath), 50);
        });
        (runWatchTests ? test : test.skip)('watch - file - rename file', done => {
            const toWatch = uri_1.URI.file(path_1.join(testDir, 'index-watch1.html'));
            const toWatchRenamed = uri_1.URI.file(path_1.join(testDir, 'index-watch1-renamed.html'));
            fs_1.writeFileSync(toWatch.fsPath, 'Init');
            assertWatch(toWatch, [[2 /* DELETED */, toWatch]], done);
            setTimeout(() => fs_1.renameSync(toWatch.fsPath, toWatchRenamed.fsPath), 50);
        });
        (runWatchTests ? test : test.skip)('watch - file - rename file (different case)', done => {
            const toWatch = uri_1.URI.file(path_1.join(testDir, 'index-watch1.html'));
            const toWatchRenamed = uri_1.URI.file(path_1.join(testDir, 'INDEX-watch1.html'));
            fs_1.writeFileSync(toWatch.fsPath, 'Init');
            if (platform_1.isLinux) {
                assertWatch(toWatch, [[2 /* DELETED */, toWatch]], done);
            }
            else {
                assertWatch(toWatch, [[0 /* UPDATED */, toWatch]], done); // case insensitive file system treat this as change
            }
            setTimeout(() => fs_1.renameSync(toWatch.fsPath, toWatchRenamed.fsPath), 50);
        });
        (runWatchTests ? test : test.skip)('watch - file (atomic save)', function (done) {
            const toWatch = uri_1.URI.file(path_1.join(testDir, 'index-watch2.html'));
            fs_1.writeFileSync(toWatch.fsPath, 'Init');
            assertWatch(toWatch, [[0 /* UPDATED */, toWatch]], done);
            setTimeout(() => {
                // Simulate atomic save by deleting the file, creating it under different name
                // and then replacing the previously deleted file with those contents
                const renamed = `${toWatch.fsPath}.bak`;
                fs_1.unlinkSync(toWatch.fsPath);
                fs_1.writeFileSync(renamed, 'Changes');
                fs_1.renameSync(renamed, toWatch.fsPath);
            }, 50);
        });
        (runWatchTests ? test : test.skip)('watch - folder (non recursive) - change file', done => {
            const watchDir = uri_1.URI.file(path_1.join(testDir, 'watch3'));
            fs_1.mkdirSync(watchDir.fsPath);
            const file = uri_1.URI.file(path_1.join(watchDir.fsPath, 'index.html'));
            fs_1.writeFileSync(file.fsPath, 'Init');
            assertWatch(watchDir, [[0 /* UPDATED */, file]], done);
            setTimeout(() => fs_1.writeFileSync(file.fsPath, 'Changes'), 50);
        });
        (runWatchTests ? test : test.skip)('watch - folder (non recursive) - add file', done => {
            const watchDir = uri_1.URI.file(path_1.join(testDir, 'watch4'));
            fs_1.mkdirSync(watchDir.fsPath);
            const file = uri_1.URI.file(path_1.join(watchDir.fsPath, 'index.html'));
            assertWatch(watchDir, [[1 /* ADDED */, file]], done);
            setTimeout(() => fs_1.writeFileSync(file.fsPath, 'Changes'), 50);
        });
        (runWatchTests ? test : test.skip)('watch - folder (non recursive) - delete file', done => {
            const watchDir = uri_1.URI.file(path_1.join(testDir, 'watch5'));
            fs_1.mkdirSync(watchDir.fsPath);
            const file = uri_1.URI.file(path_1.join(watchDir.fsPath, 'index.html'));
            fs_1.writeFileSync(file.fsPath, 'Init');
            assertWatch(watchDir, [[2 /* DELETED */, file]], done);
            setTimeout(() => fs_1.unlinkSync(file.fsPath), 50);
        });
        (runWatchTests ? test : test.skip)('watch - folder (non recursive) - add folder', done => {
            const watchDir = uri_1.URI.file(path_1.join(testDir, 'watch6'));
            fs_1.mkdirSync(watchDir.fsPath);
            const folder = uri_1.URI.file(path_1.join(watchDir.fsPath, 'folder'));
            assertWatch(watchDir, [[1 /* ADDED */, folder]], done);
            setTimeout(() => fs_1.mkdirSync(folder.fsPath), 50);
        });
        (runWatchTests ? test : test.skip)('watch - folder (non recursive) - delete folder', done => {
            const watchDir = uri_1.URI.file(path_1.join(testDir, 'watch7'));
            fs_1.mkdirSync(watchDir.fsPath);
            const folder = uri_1.URI.file(path_1.join(watchDir.fsPath, 'folder'));
            fs_1.mkdirSync(folder.fsPath);
            assertWatch(watchDir, [[2 /* DELETED */, folder]], done);
            setTimeout(() => pfs_1.rimrafSync(folder.fsPath), 50);
        });
        (runWatchTests && !platform_1.isWindows /* symbolic links not reliable on windows */ ? test : test.skip)('watch - folder (non recursive) - symbolic link - change file', (done) => __awaiter(this, void 0, void 0, function* () {
            const watchDir = uri_1.URI.file(path_1.join(testDir, 'deep-link'));
            yield pfs_1.symlink(path_1.join(testDir, 'deep'), watchDir.fsPath);
            const file = uri_1.URI.file(path_1.join(watchDir.fsPath, 'index.html'));
            fs_1.writeFileSync(file.fsPath, 'Init');
            assertWatch(watchDir, [[0 /* UPDATED */, file]], done);
            setTimeout(() => fs_1.writeFileSync(file.fsPath, 'Changes'), 50);
        }));
        (runWatchTests ? test : test.skip)('watch - folder (non recursive) - rename file', done => {
            const watchDir = uri_1.URI.file(path_1.join(testDir, 'watch8'));
            fs_1.mkdirSync(watchDir.fsPath);
            const file = uri_1.URI.file(path_1.join(watchDir.fsPath, 'index.html'));
            fs_1.writeFileSync(file.fsPath, 'Init');
            const fileRenamed = uri_1.URI.file(path_1.join(watchDir.fsPath, 'index-renamed.html'));
            assertWatch(watchDir, [[2 /* DELETED */, file], [1 /* ADDED */, fileRenamed]], done);
            setTimeout(() => fs_1.renameSync(file.fsPath, fileRenamed.fsPath), 50);
        });
        (runWatchTests && platform_1.isLinux /* this test requires a case sensitive file system */ ? test : test.skip)('watch - folder (non recursive) - rename file (different case)', done => {
            const watchDir = uri_1.URI.file(path_1.join(testDir, 'watch8'));
            fs_1.mkdirSync(watchDir.fsPath);
            const file = uri_1.URI.file(path_1.join(watchDir.fsPath, 'index.html'));
            fs_1.writeFileSync(file.fsPath, 'Init');
            const fileRenamed = uri_1.URI.file(path_1.join(watchDir.fsPath, 'INDEX.html'));
            assertWatch(watchDir, [[2 /* DELETED */, file], [1 /* ADDED */, fileRenamed]], done);
            setTimeout(() => fs_1.renameSync(file.fsPath, fileRenamed.fsPath), 50);
        });
        function assertWatch(toWatch, expected, done) {
            const watcherDisposable = service.watch(toWatch);
            function toString(type) {
                switch (type) {
                    case 1 /* ADDED */: return 'added';
                    case 2 /* DELETED */: return 'deleted';
                    case 0 /* UPDATED */: return 'updated';
                }
            }
            function printEvents(event) {
                return event.changes.map(change => `Change: type ${toString(change.type)} path ${change.resource.toString()}`).join('\n');
            }
            const listenerDisposable = service.onFileChanges(event => {
                watcherDisposable.dispose();
                listenerDisposable.dispose();
                try {
                    assert.equal(event.changes.length, expected.length, `Expected ${expected.length} events, but got ${event.changes.length}. Details (${printEvents(event)})`);
                    if (expected.length === 1) {
                        assert.equal(event.changes[0].type, expected[0][0], `Expected ${toString(expected[0][0])} but got ${toString(event.changes[0].type)}. Details (${printEvents(event)})`);
                        assert.equal(event.changes[0].resource.fsPath, expected[0][1].fsPath);
                    }
                    else {
                        for (const expect of expected) {
                            assert.equal(hasChange(event.changes, expect[0], expect[1]), true, `Unable to find ${toString(expect[0])} for ${expect[1].fsPath}. Details (${printEvents(event)})`);
                        }
                    }
                    done();
                }
                catch (error) {
                    done(error);
                }
            });
        }
        function hasChange(changes, type, resource) {
            return changes.some(change => change.type === type && resources_1.isEqual(change.resource, resource));
        }
        test('read - mixed positions', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            // read multiple times from position 0
            let buffer = buffer_1.VSBuffer.alloc(1024);
            let fd = yield fileProvider.open(resource, { create: false });
            for (let i = 0; i < 3; i++) {
                yield fileProvider.read(fd, 0, buffer.buffer, 0, 26);
                assert.equal(buffer.slice(0, 26).toString(), 'Lorem ipsum dolor sit amet');
            }
            yield fileProvider.close(fd);
            // read multiple times at various locations
            buffer = buffer_1.VSBuffer.alloc(1024);
            fd = yield fileProvider.open(resource, { create: false });
            let posInFile = 0;
            yield fileProvider.read(fd, posInFile, buffer.buffer, 0, 26);
            assert.equal(buffer.slice(0, 26).toString(), 'Lorem ipsum dolor sit amet');
            posInFile += 26;
            yield fileProvider.read(fd, posInFile, buffer.buffer, 0, 1);
            assert.equal(buffer.slice(0, 1).toString(), ',');
            posInFile += 1;
            yield fileProvider.read(fd, posInFile, buffer.buffer, 0, 12);
            assert.equal(buffer.slice(0, 12).toString(), ' consectetur');
            posInFile += 12;
            yield fileProvider.read(fd, 98 /* no longer in sequence of posInFile */, buffer.buffer, 0, 9);
            assert.equal(buffer.slice(0, 9).toString(), 'fermentum');
            yield fileProvider.read(fd, 27, buffer.buffer, 0, 12);
            assert.equal(buffer.slice(0, 12).toString(), ' consectetur');
            yield fileProvider.read(fd, 26, buffer.buffer, 0, 1);
            assert.equal(buffer.slice(0, 1).toString(), ',');
            yield fileProvider.read(fd, 0, buffer.buffer, 0, 26);
            assert.equal(buffer.slice(0, 26).toString(), 'Lorem ipsum dolor sit amet');
            yield fileProvider.read(fd, posInFile /* back in sequence */, buffer.buffer, 0, 11);
            assert.equal(buffer.slice(0, 11).toString(), ' adipiscing');
            yield fileProvider.close(fd);
        }));
        test('write - mixed positions', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            const buffer = buffer_1.VSBuffer.alloc(1024);
            const fdWrite = yield fileProvider.open(resource, { create: true });
            const fdRead = yield fileProvider.open(resource, { create: false });
            let posInFileWrite = 0;
            let posInFileRead = 0;
            const initialContents = buffer_1.VSBuffer.fromString('Lorem ipsum dolor sit amet');
            yield fileProvider.write(fdWrite, posInFileWrite, initialContents.buffer, 0, initialContents.byteLength);
            posInFileWrite += initialContents.byteLength;
            yield fileProvider.read(fdRead, posInFileRead, buffer.buffer, 0, 26);
            assert.equal(buffer.slice(0, 26).toString(), 'Lorem ipsum dolor sit amet');
            posInFileRead += 26;
            const contents = buffer_1.VSBuffer.fromString('Hello World');
            yield fileProvider.write(fdWrite, posInFileWrite, contents.buffer, 0, contents.byteLength);
            posInFileWrite += contents.byteLength;
            yield fileProvider.read(fdRead, posInFileRead, buffer.buffer, 0, contents.byteLength);
            assert.equal(buffer.slice(0, contents.byteLength).toString(), 'Hello World');
            posInFileRead += contents.byteLength;
            yield fileProvider.write(fdWrite, 6, contents.buffer, 0, contents.byteLength);
            yield fileProvider.read(fdRead, 0, buffer.buffer, 0, 11);
            assert.equal(buffer.slice(0, 11).toString(), 'Lorem Hello');
            yield fileProvider.write(fdWrite, posInFileWrite, contents.buffer, 0, contents.byteLength);
            posInFileWrite += contents.byteLength;
            yield fileProvider.read(fdRead, posInFileWrite - contents.byteLength, buffer.buffer, 0, contents.byteLength);
            assert.equal(buffer.slice(0, contents.byteLength).toString(), 'Hello World');
            yield fileProvider.close(fdWrite);
            yield fileProvider.close(fdRead);
        }));
    });
});
//# sourceMappingURL=diskFileService.test.js.map