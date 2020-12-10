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
define(["require", "exports", "assert", "os", "vs/base/common/path", "vs/base/common/uuid", "vs/base/node/pfs", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/base/common/network", "vs/base/common/uri", "vs/workbench/services/userData/common/fileUserDataProvider", "vs/base/common/resources", "vs/base/common/buffer", "vs/platform/files/electron-browser/diskFileSystemProvider", "vs/platform/environment/common/environment", "vs/base/common/lifecycle", "vs/workbench/services/environment/browser/environmentService", "vs/base/common/event", "vs/base/common/async"], function (require, exports, assert, os, path, uuid, pfs, fileService_1, log_1, network_1, uri_1, fileUserDataProvider_1, resources_1, buffer_1, diskFileSystemProvider_1, environment_1, lifecycle_1, environmentService_1, event_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('FileUserDataProvider', () => {
        let testObject;
        let rootPath;
        let userDataPath;
        let backupsPath;
        let userDataResource;
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => __awaiter(this, void 0, void 0, function* () {
            const logService = new log_1.NullLogService();
            testObject = new fileService_1.FileService(logService);
            disposables.add(testObject);
            const diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
            disposables.add(diskFileSystemProvider);
            disposables.add(testObject.registerProvider(network_1.Schemas.file, diskFileSystemProvider));
            rootPath = path.join(os.tmpdir(), 'vsctests', uuid.generateUuid());
            userDataPath = path.join(rootPath, 'user');
            backupsPath = path.join(rootPath, environment_1.BACKUPS);
            userDataResource = uri_1.URI.file(userDataPath).with({ scheme: network_1.Schemas.userData });
            yield Promise.all([pfs.mkdirp(userDataPath), pfs.mkdirp(backupsPath)]);
            const environmentService = new environmentService_1.BrowserWorkbenchEnvironmentService({ remoteAuthority: 'remote', workspaceId: 'workspaceId', logsPath: uri_1.URI.file('logFile') });
            environmentService.userRoamingDataHome = userDataResource;
            const userDataFileSystemProvider = new fileUserDataProvider_1.FileUserDataProvider(uri_1.URI.file(userDataPath), uri_1.URI.file(backupsPath), diskFileSystemProvider, environmentService);
            disposables.add(userDataFileSystemProvider);
            disposables.add(testObject.registerProvider(network_1.Schemas.userData, userDataFileSystemProvider));
        }));
        teardown(() => __awaiter(this, void 0, void 0, function* () {
            disposables.clear();
            yield pfs.rimraf(rootPath, pfs.RimRafMode.MOVE);
        }));
        test('exists return false when file does not exist', () => __awaiter(this, void 0, void 0, function* () {
            const exists = yield testObject.exists(resources_1.joinPath(userDataResource, 'settings.json'));
            assert.equal(exists, false);
        }));
        test('read file throws error if not exist', () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield testObject.readFile(resources_1.joinPath(userDataResource, 'settings.json'));
                assert.fail('Should fail since file does not exist');
            }
            catch (e) { }
        }));
        test('read existing file', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.writeFile(path.join(userDataPath, 'settings.json'), '{}');
            const result = yield testObject.readFile(resources_1.joinPath(userDataResource, 'settings.json'));
            assert.equal(result.value, '{}');
        }));
        test('create file', () => __awaiter(this, void 0, void 0, function* () {
            const resource = resources_1.joinPath(userDataResource, 'settings.json');
            const actual1 = yield testObject.createFile(resource, buffer_1.VSBuffer.fromString('{}'));
            assert.equal(actual1.resource.toString(), resource.toString());
            const actual2 = yield pfs.readFile(path.join(userDataPath, 'settings.json'));
            assert.equal(actual2, '{}');
        }));
        test('write file creates the file if not exist', () => __awaiter(this, void 0, void 0, function* () {
            const resource = resources_1.joinPath(userDataResource, 'settings.json');
            const actual1 = yield testObject.writeFile(resource, buffer_1.VSBuffer.fromString('{}'));
            assert.equal(actual1.resource.toString(), resource.toString());
            const actual2 = yield pfs.readFile(path.join(userDataPath, 'settings.json'));
            assert.equal(actual2, '{}');
        }));
        test('write to existing file', () => __awaiter(this, void 0, void 0, function* () {
            const resource = resources_1.joinPath(userDataResource, 'settings.json');
            yield pfs.writeFile(path.join(userDataPath, 'settings.json'), '{}');
            const actual1 = yield testObject.writeFile(resource, buffer_1.VSBuffer.fromString('{a:1}'));
            assert.equal(actual1.resource.toString(), resource.toString());
            const actual2 = yield pfs.readFile(path.join(userDataPath, 'settings.json'));
            assert.equal(actual2, '{a:1}');
        }));
        test('delete file', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.writeFile(path.join(userDataPath, 'settings.json'), '');
            yield testObject.del(resources_1.joinPath(userDataResource, 'settings.json'));
            const result = yield pfs.exists(path.join(userDataPath, 'settings.json'));
            assert.equal(false, result);
        }));
        test('resolve file', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.writeFile(path.join(userDataPath, 'settings.json'), '');
            const result = yield testObject.resolve(resources_1.joinPath(userDataResource, 'settings.json'));
            assert.ok(!result.isDirectory);
            assert.ok(result.children === undefined);
        }));
        test('exists return false for folder that does not exist', () => __awaiter(this, void 0, void 0, function* () {
            const exists = yield testObject.exists(resources_1.joinPath(userDataResource, 'snippets'));
            assert.equal(exists, false);
        }));
        test('exists return true for folder that exists', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.mkdirp(path.join(userDataPath, 'snippets'));
            const exists = yield testObject.exists(resources_1.joinPath(userDataResource, 'snippets'));
            assert.equal(exists, true);
        }));
        test('read file throws error for folder', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.mkdirp(path.join(userDataPath, 'snippets'));
            try {
                yield testObject.readFile(resources_1.joinPath(userDataResource, 'snippets'));
                assert.fail('Should fail since read file is not supported for folders');
            }
            catch (e) { }
        }));
        test('read file under folder', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.mkdirp(path.join(userDataPath, 'snippets'));
            yield pfs.writeFile(path.join(userDataPath, 'snippets', 'settings.json'), '{}');
            const resource = resources_1.joinPath(userDataResource, 'snippets/settings.json');
            const actual = yield testObject.readFile(resource);
            assert.equal(actual.resource.toString(), resource.toString());
            assert.equal(actual.value, '{}');
        }));
        test('read file under sub folder', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.mkdirp(path.join(userDataPath, 'snippets', 'java'));
            yield pfs.writeFile(path.join(userDataPath, 'snippets', 'java', 'settings.json'), '{}');
            const resource = resources_1.joinPath(userDataResource, 'snippets/java/settings.json');
            const actual = yield testObject.readFile(resource);
            assert.equal(actual.resource.toString(), resource.toString());
            assert.equal(actual.value, '{}');
        }));
        test('create file under folder that exists', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.mkdirp(path.join(userDataPath, 'snippets'));
            const resource = resources_1.joinPath(userDataResource, 'snippets/settings.json');
            const actual1 = yield testObject.createFile(resource, buffer_1.VSBuffer.fromString('{}'));
            assert.equal(actual1.resource.toString(), resource.toString());
            const actual2 = yield pfs.readFile(path.join(userDataPath, 'snippets', 'settings.json'));
            assert.equal(actual2, '{}');
        }));
        test('create file under folder that does not exist', () => __awaiter(this, void 0, void 0, function* () {
            const resource = resources_1.joinPath(userDataResource, 'snippets/settings.json');
            const actual1 = yield testObject.createFile(resource, buffer_1.VSBuffer.fromString('{}'));
            assert.equal(actual1.resource.toString(), resource.toString());
            const actual2 = yield pfs.readFile(path.join(userDataPath, 'snippets', 'settings.json'));
            assert.equal(actual2, '{}');
        }));
        test('write to not existing file under container that exists', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.mkdirp(path.join(userDataPath, 'snippets'));
            const resource = resources_1.joinPath(userDataResource, 'snippets/settings.json');
            const actual1 = yield testObject.writeFile(resource, buffer_1.VSBuffer.fromString('{}'));
            assert.equal(actual1.resource.toString(), resource.toString());
            const actual = yield pfs.readFile(path.join(userDataPath, 'snippets', 'settings.json'));
            assert.equal(actual, '{}');
        }));
        test('write to not existing file under container that does not exists', () => __awaiter(this, void 0, void 0, function* () {
            const resource = resources_1.joinPath(userDataResource, 'snippets/settings.json');
            const actual1 = yield testObject.writeFile(resource, buffer_1.VSBuffer.fromString('{}'));
            assert.equal(actual1.resource.toString(), resource.toString());
            const actual = yield pfs.readFile(path.join(userDataPath, 'snippets', 'settings.json'));
            assert.equal(actual, '{}');
        }));
        test('write to existing file under container', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.mkdirp(path.join(userDataPath, 'snippets'));
            yield pfs.writeFile(path.join(userDataPath, 'snippets', 'settings.json'), '{}');
            const resource = resources_1.joinPath(userDataResource, 'snippets/settings.json');
            const actual1 = yield testObject.writeFile(resource, buffer_1.VSBuffer.fromString('{a:1}'));
            assert.equal(actual1.resource.toString(), resource.toString());
            const actual = yield pfs.readFile(path.join(userDataPath, 'snippets', 'settings.json'));
            assert.equal(actual.toString(), '{a:1}');
        }));
        test('write file under sub container', () => __awaiter(this, void 0, void 0, function* () {
            const resource = resources_1.joinPath(userDataResource, 'snippets/java/settings.json');
            const actual1 = yield testObject.writeFile(resource, buffer_1.VSBuffer.fromString('{}'));
            assert.equal(actual1.resource.toString(), resource.toString());
            const actual = yield pfs.readFile(path.join(userDataPath, 'snippets', 'java', 'settings.json'));
            assert.equal(actual, '{}');
        }));
        test('delete throws error for folder that does not exist', () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield testObject.del(resources_1.joinPath(userDataResource, 'snippets'));
                assert.fail('Should fail the folder does not exist');
            }
            catch (e) { }
        }));
        test('delete not existing file under container that exists', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.mkdirp(path.join(userDataPath, 'snippets'));
            try {
                yield testObject.del(resources_1.joinPath(userDataResource, 'snippets/settings.json'));
                assert.fail('Should fail since file does not exist');
            }
            catch (e) { }
        }));
        test('delete not existing file under container that does not exists', () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield testObject.del(resources_1.joinPath(userDataResource, 'snippets/settings.json'));
                assert.fail('Should fail since file does not exist');
            }
            catch (e) { }
        }));
        test('delete existing file under folder', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.mkdirp(path.join(userDataPath, 'snippets'));
            yield pfs.writeFile(path.join(userDataPath, 'snippets', 'settings.json'), '{}');
            yield testObject.del(resources_1.joinPath(userDataResource, 'snippets/settings.json'));
            const exists = yield pfs.exists(path.join(userDataPath, 'snippets', 'settings.json'));
            assert.equal(exists, false);
        }));
        test('resolve folder', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.mkdirp(path.join(userDataPath, 'snippets'));
            yield pfs.writeFile(path.join(userDataPath, 'snippets', 'settings.json'), '{}');
            const result = yield testObject.resolve(resources_1.joinPath(userDataResource, 'snippets'));
            assert.ok(result.isDirectory);
            assert.ok(result.children !== undefined);
            assert.equal(result.children.length, 1);
            assert.equal(result.children[0].resource.toString(), resources_1.joinPath(userDataResource, 'snippets/settings.json').toString());
        }));
        test('read backup file', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.writeFile(path.join(backupsPath, 'backup.json'), '{}');
            const result = yield testObject.readFile(resources_1.joinPath(userDataResource, `${environment_1.BACKUPS}/backup.json`));
            assert.equal(result.value, '{}');
        }));
        test('create backup file', () => __awaiter(this, void 0, void 0, function* () {
            yield testObject.createFile(resources_1.joinPath(userDataResource, `${environment_1.BACKUPS}/backup.json`), buffer_1.VSBuffer.fromString('{}'));
            const result = yield pfs.readFile(path.join(backupsPath, 'backup.json'));
            assert.equal(result, '{}');
        }));
        test('write backup file', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.writeFile(path.join(backupsPath, 'backup.json'), '{}');
            yield testObject.writeFile(resources_1.joinPath(userDataResource, `${environment_1.BACKUPS}/backup.json`), buffer_1.VSBuffer.fromString('{a:1}'));
            const result = yield pfs.readFile(path.join(backupsPath, 'backup.json'));
            assert.equal(result, '{a:1}');
        }));
        test('resolve backups folder', () => __awaiter(this, void 0, void 0, function* () {
            yield pfs.writeFile(path.join(backupsPath, 'backup.json'), '{}');
            const result = yield testObject.resolve(resources_1.joinPath(userDataResource, environment_1.BACKUPS));
            assert.ok(result.isDirectory);
            assert.ok(result.children !== undefined);
            assert.equal(result.children.length, 1);
            assert.equal(result.children[0].resource.toString(), resources_1.joinPath(userDataResource, `${environment_1.BACKUPS}/backup.json`).toString());
        }));
    });
    class TestFileSystemProvider {
        constructor(onDidChangeFile) {
            this.onDidChangeFile = onDidChangeFile;
            this.capabilities = 2 /* FileReadWrite */;
            this.onDidChangeCapabilities = event_1.Event.None;
        }
        watch() { return lifecycle_1.Disposable.None; }
        stat() { throw new Error('Not Supported'); }
        mkdir(resource) { throw new Error('Not Supported'); }
        rename() { throw new Error('Not Supported'); }
        readFile(resource) { throw new Error('Not Supported'); }
        readdir(resource) { throw new Error('Not Supported'); }
        writeFile() { throw new Error('Not Supported'); }
        delete() { throw new Error('Not Supported'); }
    }
    suite('FileUserDataProvider - Watching', () => {
        let testObject;
        let localBackupsResource;
        let localUserDataResource;
        let userDataResource;
        const disposables = new lifecycle_1.DisposableStore();
        const fileEventEmitter = new event_1.Emitter();
        disposables.add(fileEventEmitter);
        setup(() => {
            const rootPath = path.join(os.tmpdir(), 'vsctests', uuid.generateUuid());
            const userDataPath = path.join(rootPath, 'user');
            const backupsPath = path.join(rootPath, environment_1.BACKUPS);
            localBackupsResource = uri_1.URI.file(backupsPath);
            localUserDataResource = uri_1.URI.file(userDataPath);
            userDataResource = localUserDataResource.with({ scheme: network_1.Schemas.userData });
            const environmentService = new environmentService_1.BrowserWorkbenchEnvironmentService({ remoteAuthority: 'remote', workspaceId: 'workspaceId', logsPath: uri_1.URI.file('logFile') });
            environmentService.userRoamingDataHome = userDataResource;
            const userDataFileSystemProvider = new fileUserDataProvider_1.FileUserDataProvider(localUserDataResource, localBackupsResource, new TestFileSystemProvider(fileEventEmitter.event), environmentService);
            disposables.add(userDataFileSystemProvider);
            testObject = new fileService_1.FileService(new log_1.NullLogService());
            disposables.add(testObject);
            disposables.add(testObject.registerProvider(network_1.Schemas.userData, userDataFileSystemProvider));
        });
        teardown(() => {
            disposables.clear();
        });
        test('file added change event', done => {
            const expected = resources_1.joinPath(userDataResource, 'settings.json');
            const target = resources_1.joinPath(localUserDataResource, 'settings.json');
            testObject.onFileChanges(e => {
                if (e.contains(expected, 1 /* ADDED */)) {
                    done();
                }
            });
            fileEventEmitter.fire([{
                    resource: target,
                    type: 1 /* ADDED */
                }]);
        });
        test('file updated change event', done => {
            const expected = resources_1.joinPath(userDataResource, 'settings.json');
            const target = resources_1.joinPath(localUserDataResource, 'settings.json');
            testObject.onFileChanges(e => {
                if (e.contains(expected, 0 /* UPDATED */)) {
                    done();
                }
            });
            fileEventEmitter.fire([{
                    resource: target,
                    type: 0 /* UPDATED */
                }]);
        });
        test('file deleted change event', done => {
            const expected = resources_1.joinPath(userDataResource, 'settings.json');
            const target = resources_1.joinPath(localUserDataResource, 'settings.json');
            testObject.onFileChanges(e => {
                if (e.contains(expected, 2 /* DELETED */)) {
                    done();
                }
            });
            fileEventEmitter.fire([{
                    resource: target,
                    type: 2 /* DELETED */
                }]);
        });
        test('file under folder created change event', done => {
            const expected = resources_1.joinPath(userDataResource, 'snippets', 'settings.json');
            const target = resources_1.joinPath(localUserDataResource, 'snippets', 'settings.json');
            testObject.onFileChanges(e => {
                if (e.contains(expected, 1 /* ADDED */)) {
                    done();
                }
            });
            fileEventEmitter.fire([{
                    resource: target,
                    type: 1 /* ADDED */
                }]);
        });
        test('file under folder updated change event', done => {
            const expected = resources_1.joinPath(userDataResource, 'snippets', 'settings.json');
            const target = resources_1.joinPath(localUserDataResource, 'snippets', 'settings.json');
            testObject.onFileChanges(e => {
                if (e.contains(expected, 0 /* UPDATED */)) {
                    done();
                }
            });
            fileEventEmitter.fire([{
                    resource: target,
                    type: 0 /* UPDATED */
                }]);
        });
        test('file under folder deleted change event', done => {
            const expected = resources_1.joinPath(userDataResource, 'snippets', 'settings.json');
            const target = resources_1.joinPath(localUserDataResource, 'snippets', 'settings.json');
            testObject.onFileChanges(e => {
                if (e.contains(expected, 2 /* DELETED */)) {
                    done();
                }
            });
            fileEventEmitter.fire([{
                    resource: target,
                    type: 2 /* DELETED */
                }]);
        });
        test('event is not triggered if file is not under user data', () => __awaiter(this, void 0, void 0, function* () {
            const target = resources_1.joinPath(resources_1.dirname(localUserDataResource), 'settings.json');
            let triggered = false;
            testObject.onFileChanges(() => triggered = true);
            fileEventEmitter.fire([{
                    resource: target,
                    type: 2 /* DELETED */
                }]);
            yield async_1.timeout(0);
            if (triggered) {
                assert.fail('event should not be triggered');
            }
        }));
        test('backup file created change event', done => {
            const expected = resources_1.joinPath(userDataResource, environment_1.BACKUPS, 'settings.json');
            const target = resources_1.joinPath(localBackupsResource, 'settings.json');
            testObject.onFileChanges(e => {
                if (e.contains(expected, 1 /* ADDED */)) {
                    done();
                }
            });
            fileEventEmitter.fire([{
                    resource: target,
                    type: 1 /* ADDED */
                }]);
        });
        test('backup file update change event', done => {
            const expected = resources_1.joinPath(userDataResource, environment_1.BACKUPS, 'settings.json');
            const target = resources_1.joinPath(localBackupsResource, 'settings.json');
            testObject.onFileChanges(e => {
                if (e.contains(expected, 0 /* UPDATED */)) {
                    done();
                }
            });
            fileEventEmitter.fire([{
                    resource: target,
                    type: 0 /* UPDATED */
                }]);
        });
        test('backup file delete change event', done => {
            const expected = resources_1.joinPath(userDataResource, environment_1.BACKUPS, 'settings.json');
            const target = resources_1.joinPath(localBackupsResource, 'settings.json');
            testObject.onFileChanges(e => {
                if (e.contains(expected, 2 /* DELETED */)) {
                    done();
                }
            });
            fileEventEmitter.fire([{
                    resource: target,
                    type: 2 /* DELETED */
                }]);
        });
    });
});
//# sourceMappingURL=fileUserDataProvider.test.js.map