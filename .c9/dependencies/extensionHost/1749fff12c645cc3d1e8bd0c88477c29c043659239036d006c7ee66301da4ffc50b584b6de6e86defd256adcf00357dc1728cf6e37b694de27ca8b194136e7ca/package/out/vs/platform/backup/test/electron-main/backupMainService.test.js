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
define(["require", "exports", "assert", "vs/base/common/platform", "fs", "os", "vs/base/common/path", "vs/base/node/pfs", "vs/base/common/uri", "vs/platform/environment/node/environmentService", "vs/platform/environment/node/argv", "vs/platform/backup/electron-main/backupMainService", "vs/platform/files/common/files", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/log/common/log", "crypto", "vs/base/test/node/testUtils", "vs/base/common/network"], function (require, exports, assert, platform, fs, os, path, pfs, uri_1, environmentService_1, argv_1, backupMainService_1, files_1, testConfigurationService_1, log_1, crypto_1, testUtils_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('BackupMainService', () => {
        function assertEqualUris(actual, expected) {
            assert.deepEqual(actual.map(a => a.toString()), expected.map(a => a.toString()));
        }
        const parentDir = testUtils_1.getRandomTestPath(os.tmpdir(), 'vsctests', 'backupservice');
        const backupHome = path.join(parentDir, 'Backups');
        const backupWorkspacesPath = path.join(backupHome, 'workspaces.json');
        const environmentService = new environmentService_1.EnvironmentService(argv_1.parseArgs(process.argv), process.execPath);
        class TestBackupMainService extends backupMainService_1.BackupMainService {
            constructor(backupHome, backupWorkspacesPath, configService) {
                super(environmentService, configService, new log_1.ConsoleLogMainService());
                this.backupHome = backupHome;
                this.workspacesJsonPath = backupWorkspacesPath;
            }
            toBackupPath(arg) {
                const id = arg instanceof uri_1.URI ? super.getFolderHash(arg) : arg;
                return path.join(this.backupHome, id);
            }
            getFolderHash(folderUri) {
                return super.getFolderHash(folderUri);
            }
            toLegacyBackupPath(folderPath) {
                return path.join(this.backupHome, super.getLegacyFolderHash(folderPath));
            }
        }
        function toWorkspace(path) {
            return {
                id: crypto_1.createHash('md5').update(sanitizePath(path)).digest('hex'),
                configPath: uri_1.URI.file(path)
            };
        }
        function toWorkspaceBackupInfo(path, remoteAuthority) {
            return {
                workspace: {
                    id: crypto_1.createHash('md5').update(sanitizePath(path)).digest('hex'),
                    configPath: uri_1.URI.file(path)
                },
                remoteAuthority
            };
        }
        function toSerializedWorkspace(ws) {
            return {
                id: ws.id,
                configURIPath: ws.configPath.toString()
            };
        }
        function ensureFolderExists(uri) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!fs.existsSync(uri.fsPath)) {
                    fs.mkdirSync(uri.fsPath);
                }
                const backupFolder = service.toBackupPath(uri);
                yield createBackupFolder(backupFolder);
            });
        }
        function ensureWorkspaceExists(workspace) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!fs.existsSync(workspace.configPath.fsPath)) {
                    yield pfs.writeFile(workspace.configPath.fsPath, 'Hello');
                }
                const backupFolder = service.toBackupPath(workspace.id);
                yield createBackupFolder(backupFolder);
                return workspace;
            });
        }
        function createBackupFolder(backupFolder) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!fs.existsSync(backupFolder)) {
                    fs.mkdirSync(backupFolder);
                    fs.mkdirSync(path.join(backupFolder, network_1.Schemas.file));
                    yield pfs.writeFile(path.join(backupFolder, network_1.Schemas.file, 'foo.txt'), 'Hello');
                }
            });
        }
        function sanitizePath(p) {
            return platform.isLinux ? p : p.toLowerCase();
        }
        const fooFile = uri_1.URI.file(platform.isWindows ? 'C:\\foo' : '/foo');
        const barFile = uri_1.URI.file(platform.isWindows ? 'C:\\bar' : '/bar');
        const existingTestFolder1 = uri_1.URI.file(path.join(parentDir, 'folder1'));
        let service;
        let configService;
        setup(() => {
            // Delete any existing backups completely and then re-create it.
            return pfs.rimraf(backupHome, pfs.RimRafMode.MOVE).then(() => {
                return pfs.mkdirp(backupHome);
            }).then(() => {
                configService = new testConfigurationService_1.TestConfigurationService();
                service = new TestBackupMainService(backupHome, backupWorkspacesPath, configService);
                return service.initialize();
            });
        });
        teardown(() => {
            return pfs.rimraf(backupHome, pfs.RimRafMode.MOVE);
        });
        test('service validates backup workspaces on startup and cleans up (folder workspaces)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(1000 * 10); // increase timeout for this test
                // 1) backup workspace path does not exist
                service.registerFolderBackupSync(fooFile);
                service.registerFolderBackupSync(barFile);
                yield service.initialize();
                assertEqualUris(service.getFolderBackupPaths(), []);
                // 2) backup workspace path exists with empty contents within
                fs.mkdirSync(service.toBackupPath(fooFile));
                fs.mkdirSync(service.toBackupPath(barFile));
                service.registerFolderBackupSync(fooFile);
                service.registerFolderBackupSync(barFile);
                yield service.initialize();
                assertEqualUris(service.getFolderBackupPaths(), []);
                assert.ok(!fs.existsSync(service.toBackupPath(fooFile)));
                assert.ok(!fs.existsSync(service.toBackupPath(barFile)));
                // 3) backup workspace path exists with empty folders within
                fs.mkdirSync(service.toBackupPath(fooFile));
                fs.mkdirSync(service.toBackupPath(barFile));
                fs.mkdirSync(path.join(service.toBackupPath(fooFile), network_1.Schemas.file));
                fs.mkdirSync(path.join(service.toBackupPath(barFile), network_1.Schemas.untitled));
                service.registerFolderBackupSync(fooFile);
                service.registerFolderBackupSync(barFile);
                yield service.initialize();
                assertEqualUris(service.getFolderBackupPaths(), []);
                assert.ok(!fs.existsSync(service.toBackupPath(fooFile)));
                assert.ok(!fs.existsSync(service.toBackupPath(barFile)));
                // 4) backup workspace path points to a workspace that no longer exists
                // so it should convert the backup worspace to an empty workspace backup
                const fileBackups = path.join(service.toBackupPath(fooFile), network_1.Schemas.file);
                fs.mkdirSync(service.toBackupPath(fooFile));
                fs.mkdirSync(service.toBackupPath(barFile));
                fs.mkdirSync(fileBackups);
                service.registerFolderBackupSync(fooFile);
                assert.equal(service.getFolderBackupPaths().length, 1);
                assert.equal(service.getEmptyWindowBackupPaths().length, 0);
                fs.writeFileSync(path.join(fileBackups, 'backup.txt'), '');
                yield service.initialize();
                assert.equal(service.getFolderBackupPaths().length, 0);
                assert.equal(service.getEmptyWindowBackupPaths().length, 1);
            });
        });
        test('service validates backup workspaces on startup and cleans up (root workspaces)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(1000 * 10); // increase timeout for this test
                // 1) backup workspace path does not exist
                service.registerWorkspaceBackupSync(toWorkspaceBackupInfo(fooFile.fsPath));
                service.registerWorkspaceBackupSync(toWorkspaceBackupInfo(barFile.fsPath));
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
                // 2) backup workspace path exists with empty contents within
                fs.mkdirSync(service.toBackupPath(fooFile));
                fs.mkdirSync(service.toBackupPath(barFile));
                service.registerWorkspaceBackupSync(toWorkspaceBackupInfo(fooFile.fsPath));
                service.registerWorkspaceBackupSync(toWorkspaceBackupInfo(barFile.fsPath));
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
                assert.ok(!fs.existsSync(service.toBackupPath(fooFile)));
                assert.ok(!fs.existsSync(service.toBackupPath(barFile)));
                // 3) backup workspace path exists with empty folders within
                fs.mkdirSync(service.toBackupPath(fooFile));
                fs.mkdirSync(service.toBackupPath(barFile));
                fs.mkdirSync(path.join(service.toBackupPath(fooFile), network_1.Schemas.file));
                fs.mkdirSync(path.join(service.toBackupPath(barFile), network_1.Schemas.untitled));
                service.registerWorkspaceBackupSync(toWorkspaceBackupInfo(fooFile.fsPath));
                service.registerWorkspaceBackupSync(toWorkspaceBackupInfo(barFile.fsPath));
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
                assert.ok(!fs.existsSync(service.toBackupPath(fooFile)));
                assert.ok(!fs.existsSync(service.toBackupPath(barFile)));
                // 4) backup workspace path points to a workspace that no longer exists
                // so it should convert the backup worspace to an empty workspace backup
                const fileBackups = path.join(service.toBackupPath(fooFile), network_1.Schemas.file);
                fs.mkdirSync(service.toBackupPath(fooFile));
                fs.mkdirSync(service.toBackupPath(barFile));
                fs.mkdirSync(fileBackups);
                service.registerWorkspaceBackupSync(toWorkspaceBackupInfo(fooFile.fsPath));
                assert.equal(service.getWorkspaceBackups().length, 1);
                assert.equal(service.getEmptyWindowBackupPaths().length, 0);
                fs.writeFileSync(path.join(fileBackups, 'backup.txt'), '');
                yield service.initialize();
                assert.equal(service.getWorkspaceBackups().length, 0);
                assert.equal(service.getEmptyWindowBackupPaths().length, 1);
            });
        });
        test('service supports to migrate backup data from another location', () => {
            const backupPathToMigrate = service.toBackupPath(fooFile);
            fs.mkdirSync(backupPathToMigrate);
            fs.writeFileSync(path.join(backupPathToMigrate, 'backup.txt'), 'Some Data');
            service.registerFolderBackupSync(uri_1.URI.file(backupPathToMigrate));
            const workspaceBackupPath = service.registerWorkspaceBackupSync(toWorkspaceBackupInfo(barFile.fsPath), backupPathToMigrate);
            assert.ok(fs.existsSync(workspaceBackupPath));
            assert.ok(fs.existsSync(path.join(workspaceBackupPath, 'backup.txt')));
            assert.ok(!fs.existsSync(backupPathToMigrate));
            const emptyBackups = service.getEmptyWindowBackupPaths();
            assert.equal(0, emptyBackups.length);
        });
        test('service backup migration makes sure to preserve existing backups', () => {
            const backupPathToMigrate = service.toBackupPath(fooFile);
            fs.mkdirSync(backupPathToMigrate);
            fs.writeFileSync(path.join(backupPathToMigrate, 'backup.txt'), 'Some Data');
            service.registerFolderBackupSync(uri_1.URI.file(backupPathToMigrate));
            const backupPathToPreserve = service.toBackupPath(barFile);
            fs.mkdirSync(backupPathToPreserve);
            fs.writeFileSync(path.join(backupPathToPreserve, 'backup.txt'), 'Some Data');
            service.registerFolderBackupSync(uri_1.URI.file(backupPathToPreserve));
            const workspaceBackupPath = service.registerWorkspaceBackupSync(toWorkspaceBackupInfo(barFile.fsPath), backupPathToMigrate);
            assert.ok(fs.existsSync(workspaceBackupPath));
            assert.ok(fs.existsSync(path.join(workspaceBackupPath, 'backup.txt')));
            assert.ok(!fs.existsSync(backupPathToMigrate));
            const emptyBackups = service.getEmptyWindowBackupPaths();
            assert.equal(1, emptyBackups.length);
            assert.equal(1, fs.readdirSync(path.join(backupHome, emptyBackups[0].backupFolder)).length);
        });
        suite('migrate path to URI', () => {
            test('migration folder path to URI makes sure to preserve existing backups', () => __awaiter(this, void 0, void 0, function* () {
                let path1 = path.join(parentDir, 'folder1');
                let path2 = path.join(parentDir, 'FOLDER2');
                let uri1 = uri_1.URI.file(path1);
                let uri2 = uri_1.URI.file(path2);
                if (!fs.existsSync(path1)) {
                    fs.mkdirSync(path1);
                }
                if (!fs.existsSync(path2)) {
                    fs.mkdirSync(path2);
                }
                const backupFolder1 = service.toLegacyBackupPath(path1);
                if (!fs.existsSync(backupFolder1)) {
                    fs.mkdirSync(backupFolder1);
                    fs.mkdirSync(path.join(backupFolder1, network_1.Schemas.file));
                    yield pfs.writeFile(path.join(backupFolder1, network_1.Schemas.file, 'unsaved1.txt'), 'Legacy');
                }
                const backupFolder2 = service.toLegacyBackupPath(path2);
                if (!fs.existsSync(backupFolder2)) {
                    fs.mkdirSync(backupFolder2);
                    fs.mkdirSync(path.join(backupFolder2, network_1.Schemas.file));
                    yield pfs.writeFile(path.join(backupFolder2, network_1.Schemas.file, 'unsaved2.txt'), 'Legacy');
                }
                const workspacesJson = { rootWorkspaces: [], folderWorkspaces: [path1, path2], emptyWorkspaces: [] };
                yield pfs.writeFile(backupWorkspacesPath, JSON.stringify(workspacesJson));
                yield service.initialize();
                const content = yield pfs.readFile(backupWorkspacesPath, 'utf-8');
                const json = JSON.parse(content);
                assert.deepEqual(json.folderURIWorkspaces, [uri1.toString(), uri2.toString()]);
                const newBackupFolder1 = service.toBackupPath(uri1);
                assert.ok(fs.existsSync(path.join(newBackupFolder1, network_1.Schemas.file, 'unsaved1.txt')));
                const newBackupFolder2 = service.toBackupPath(uri2);
                assert.ok(fs.existsSync(path.join(newBackupFolder2, network_1.Schemas.file, 'unsaved2.txt')));
            }));
            test('migrate storage file', () => __awaiter(this, void 0, void 0, function* () {
                let folderPath = path.join(parentDir, 'f1');
                ensureFolderExists(uri_1.URI.file(folderPath));
                const backupFolderPath = service.toLegacyBackupPath(folderPath);
                yield createBackupFolder(backupFolderPath);
                let workspacePath = path.join(parentDir, 'f2.code-workspace');
                const workspace = toWorkspace(workspacePath);
                yield ensureWorkspaceExists(workspace);
                const workspacesJson = { rootWorkspaces: [{ id: workspace.id, configPath: workspacePath }], folderWorkspaces: [folderPath], emptyWorkspaces: [] };
                yield pfs.writeFile(backupWorkspacesPath, JSON.stringify(workspacesJson));
                yield service.initialize();
                const content = yield pfs.readFile(backupWorkspacesPath, 'utf-8');
                const json = JSON.parse(content);
                assert.deepEqual(json.folderURIWorkspaces, [uri_1.URI.file(folderPath).toString()]);
                assert.deepEqual(json.rootURIWorkspaces, [{ id: workspace.id, configURIPath: uri_1.URI.file(workspacePath).toString() }]);
                assertEqualUris(service.getWorkspaceBackups().map(w => w.workspace.configPath), [workspace.configPath]);
            }));
        });
        suite('loadSync', () => {
            test('getFolderBackupPaths() should return [] when workspaces.json doesn\'t exist', () => {
                assertEqualUris(service.getFolderBackupPaths(), []);
            });
            test('getFolderBackupPaths() should return [] when workspaces.json is not properly formed JSON', () => __awaiter(this, void 0, void 0, function* () {
                fs.writeFileSync(backupWorkspacesPath, '');
                yield service.initialize();
                assertEqualUris(service.getFolderBackupPaths(), []);
                fs.writeFileSync(backupWorkspacesPath, '{]');
                yield service.initialize();
                assertEqualUris(service.getFolderBackupPaths(), []);
                fs.writeFileSync(backupWorkspacesPath, 'foo');
                yield service.initialize();
                assertEqualUris(service.getFolderBackupPaths(), []);
            }));
            test('getFolderBackupPaths() should return [] when folderWorkspaces in workspaces.json is absent', () => __awaiter(this, void 0, void 0, function* () {
                fs.writeFileSync(backupWorkspacesPath, '{}');
                yield service.initialize();
                assertEqualUris(service.getFolderBackupPaths(), []);
            }));
            test('getFolderBackupPaths() should return [] when folderWorkspaces in workspaces.json is not a string array', () => __awaiter(this, void 0, void 0, function* () {
                fs.writeFileSync(backupWorkspacesPath, '{"folderWorkspaces":{}}');
                yield service.initialize();
                assertEqualUris(service.getFolderBackupPaths(), []);
                fs.writeFileSync(backupWorkspacesPath, '{"folderWorkspaces":{"foo": ["bar"]}}');
                yield service.initialize();
                assertEqualUris(service.getFolderBackupPaths(), []);
                fs.writeFileSync(backupWorkspacesPath, '{"folderWorkspaces":{"foo": []}}');
                yield service.initialize();
                assertEqualUris(service.getFolderBackupPaths(), []);
                fs.writeFileSync(backupWorkspacesPath, '{"folderWorkspaces":{"foo": "bar"}}');
                yield service.initialize();
                assertEqualUris(service.getFolderBackupPaths(), []);
                fs.writeFileSync(backupWorkspacesPath, '{"folderWorkspaces":"foo"}');
                yield service.initialize();
                assertEqualUris(service.getFolderBackupPaths(), []);
                fs.writeFileSync(backupWorkspacesPath, '{"folderWorkspaces":1}');
                yield service.initialize();
                assertEqualUris(service.getFolderBackupPaths(), []);
            }));
            test('getFolderBackupPaths() should return [] when files.hotExit = "onExitAndWindowClose"', () => __awaiter(this, void 0, void 0, function* () {
                service.registerFolderBackupSync(uri_1.URI.file(fooFile.fsPath.toUpperCase()));
                assertEqualUris(service.getFolderBackupPaths(), [uri_1.URI.file(fooFile.fsPath.toUpperCase())]);
                configService.setUserConfiguration('files.hotExit', files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE);
                yield service.initialize();
                assertEqualUris(service.getFolderBackupPaths(), []);
            }));
            test('getWorkspaceBackups() should return [] when workspaces.json doesn\'t exist', () => {
                assert.deepEqual(service.getWorkspaceBackups(), []);
            });
            test('getWorkspaceBackups() should return [] when workspaces.json is not properly formed JSON', () => __awaiter(this, void 0, void 0, function* () {
                fs.writeFileSync(backupWorkspacesPath, '');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
                fs.writeFileSync(backupWorkspacesPath, '{]');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
                fs.writeFileSync(backupWorkspacesPath, 'foo');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
            }));
            test('getWorkspaceBackups() should return [] when folderWorkspaces in workspaces.json is absent', () => __awaiter(this, void 0, void 0, function* () {
                fs.writeFileSync(backupWorkspacesPath, '{}');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
            }));
            test('getWorkspaceBackups() should return [] when rootWorkspaces in workspaces.json is not a object array', () => __awaiter(this, void 0, void 0, function* () {
                fs.writeFileSync(backupWorkspacesPath, '{"rootWorkspaces":{}}');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
                fs.writeFileSync(backupWorkspacesPath, '{"rootWorkspaces":{"foo": ["bar"]}}');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
                fs.writeFileSync(backupWorkspacesPath, '{"rootWorkspaces":{"foo": []}}');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
                fs.writeFileSync(backupWorkspacesPath, '{"rootWorkspaces":{"foo": "bar"}}');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
                fs.writeFileSync(backupWorkspacesPath, '{"rootWorkspaces":"foo"}');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
                fs.writeFileSync(backupWorkspacesPath, '{"rootWorkspaces":1}');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
            }));
            test('getWorkspaceBackups() should return [] when rootURIWorkspaces in workspaces.json is not a object array', () => __awaiter(this, void 0, void 0, function* () {
                fs.writeFileSync(backupWorkspacesPath, '{"rootURIWorkspaces":{}}');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
                fs.writeFileSync(backupWorkspacesPath, '{"rootURIWorkspaces":{"foo": ["bar"]}}');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
                fs.writeFileSync(backupWorkspacesPath, '{"rootURIWorkspaces":{"foo": []}}');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
                fs.writeFileSync(backupWorkspacesPath, '{"rootURIWorkspaces":{"foo": "bar"}}');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
                fs.writeFileSync(backupWorkspacesPath, '{"rootURIWorkspaces":"foo"}');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
                fs.writeFileSync(backupWorkspacesPath, '{"rootURIWorkspaces":1}');
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
            }));
            test('getWorkspaceBackups() should return [] when files.hotExit = "onExitAndWindowClose"', () => __awaiter(this, void 0, void 0, function* () {
                const upperFooPath = fooFile.fsPath.toUpperCase();
                service.registerWorkspaceBackupSync(toWorkspaceBackupInfo(upperFooPath));
                assert.equal(service.getWorkspaceBackups().length, 1);
                assertEqualUris(service.getWorkspaceBackups().map(r => r.workspace.configPath), [uri_1.URI.file(upperFooPath)]);
                configService.setUserConfiguration('files.hotExit', files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE);
                yield service.initialize();
                assert.deepEqual(service.getWorkspaceBackups(), []);
            }));
            test('getEmptyWorkspaceBackupPaths() should return [] when workspaces.json doesn\'t exist', () => {
                assert.deepEqual(service.getEmptyWindowBackupPaths(), []);
            });
            test('getEmptyWorkspaceBackupPaths() should return [] when workspaces.json is not properly formed JSON', () => __awaiter(this, void 0, void 0, function* () {
                fs.writeFileSync(backupWorkspacesPath, '');
                yield service.initialize();
                assert.deepEqual(service.getEmptyWindowBackupPaths(), []);
                fs.writeFileSync(backupWorkspacesPath, '{]');
                yield service.initialize();
                assert.deepEqual(service.getEmptyWindowBackupPaths(), []);
                fs.writeFileSync(backupWorkspacesPath, 'foo');
                yield service.initialize();
                assert.deepEqual(service.getEmptyWindowBackupPaths(), []);
            }));
            test('getEmptyWorkspaceBackupPaths() should return [] when folderWorkspaces in workspaces.json is absent', () => __awaiter(this, void 0, void 0, function* () {
                fs.writeFileSync(backupWorkspacesPath, '{}');
                yield service.initialize();
                assert.deepEqual(service.getEmptyWindowBackupPaths(), []);
            }));
            test('getEmptyWorkspaceBackupPaths() should return [] when folderWorkspaces in workspaces.json is not a string array', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    this.timeout(5000);
                    fs.writeFileSync(backupWorkspacesPath, '{"emptyWorkspaces":{}}');
                    yield service.initialize();
                    assert.deepEqual(service.getEmptyWindowBackupPaths(), []);
                    fs.writeFileSync(backupWorkspacesPath, '{"emptyWorkspaces":{"foo": ["bar"]}}');
                    yield service.initialize();
                    assert.deepEqual(service.getEmptyWindowBackupPaths(), []);
                    fs.writeFileSync(backupWorkspacesPath, '{"emptyWorkspaces":{"foo": []}}');
                    yield service.initialize();
                    assert.deepEqual(service.getEmptyWindowBackupPaths(), []);
                    fs.writeFileSync(backupWorkspacesPath, '{"emptyWorkspaces":{"foo": "bar"}}');
                    yield service.initialize();
                    assert.deepEqual(service.getEmptyWindowBackupPaths(), []);
                    fs.writeFileSync(backupWorkspacesPath, '{"emptyWorkspaces":"foo"}');
                    yield service.initialize();
                    assert.deepEqual(service.getEmptyWindowBackupPaths(), []);
                    fs.writeFileSync(backupWorkspacesPath, '{"emptyWorkspaces":1}');
                    yield service.initialize();
                    assert.deepEqual(service.getEmptyWindowBackupPaths(), []);
                });
            });
        });
        suite('dedupeFolderWorkspaces', () => {
            test('should ignore duplicates (folder workspace)', () => __awaiter(this, void 0, void 0, function* () {
                yield ensureFolderExists(existingTestFolder1);
                const workspacesJson = {
                    rootURIWorkspaces: [],
                    folderURIWorkspaces: [existingTestFolder1.toString(), existingTestFolder1.toString()],
                    emptyWorkspaceInfos: []
                };
                yield pfs.writeFile(backupWorkspacesPath, JSON.stringify(workspacesJson));
                yield service.initialize();
                const buffer = yield pfs.readFile(backupWorkspacesPath, 'utf-8');
                const json = JSON.parse(buffer);
                assert.deepEqual(json.folderURIWorkspaces, [existingTestFolder1.toString()]);
            }));
            test('should ignore duplicates on Windows and Mac (folder workspace)', () => __awaiter(this, void 0, void 0, function* () {
                yield ensureFolderExists(existingTestFolder1);
                const workspacesJson = {
                    rootURIWorkspaces: [],
                    folderURIWorkspaces: [existingTestFolder1.toString(), existingTestFolder1.toString().toLowerCase()],
                    emptyWorkspaceInfos: []
                };
                yield pfs.writeFile(backupWorkspacesPath, JSON.stringify(workspacesJson));
                yield service.initialize();
                const buffer = yield pfs.readFile(backupWorkspacesPath, 'utf-8');
                const json = JSON.parse(buffer);
                assert.deepEqual(json.folderURIWorkspaces, [existingTestFolder1.toString()]);
            }));
            test('should ignore duplicates on Windows and Mac (root workspace)', () => __awaiter(this, void 0, void 0, function* () {
                const workspacePath = path.join(parentDir, 'Foo.code-workspace');
                const workspacePath1 = path.join(parentDir, 'FOO.code-workspace');
                const workspacePath2 = path.join(parentDir, 'foo.code-workspace');
                const workspace1 = yield ensureWorkspaceExists(toWorkspace(workspacePath));
                const workspace2 = yield ensureWorkspaceExists(toWorkspace(workspacePath1));
                const workspace3 = yield ensureWorkspaceExists(toWorkspace(workspacePath2));
                const workspacesJson = {
                    rootURIWorkspaces: [workspace1, workspace2, workspace3].map(toSerializedWorkspace),
                    folderURIWorkspaces: [],
                    emptyWorkspaceInfos: []
                };
                yield pfs.writeFile(backupWorkspacesPath, JSON.stringify(workspacesJson));
                yield service.initialize();
                const buffer = yield pfs.readFile(backupWorkspacesPath, 'utf-8');
                const json = JSON.parse(buffer);
                assert.equal(json.rootURIWorkspaces.length, platform.isLinux ? 3 : 1);
                if (platform.isLinux) {
                    assert.deepEqual(json.rootURIWorkspaces.map(r => r.configURIPath), [uri_1.URI.file(workspacePath).toString(), uri_1.URI.file(workspacePath1).toString(), uri_1.URI.file(workspacePath2).toString()]);
                }
                else {
                    assert.deepEqual(json.rootURIWorkspaces.map(r => r.configURIPath), [uri_1.URI.file(workspacePath).toString()], 'should return the first duplicated entry');
                }
            }));
        });
        suite('registerWindowForBackups', () => {
            test('should persist paths to workspaces.json (folder workspace)', () => __awaiter(this, void 0, void 0, function* () {
                service.registerFolderBackupSync(fooFile);
                service.registerFolderBackupSync(barFile);
                assertEqualUris(service.getFolderBackupPaths(), [fooFile, barFile]);
                const buffer = yield pfs.readFile(backupWorkspacesPath, 'utf-8');
                const json = JSON.parse(buffer);
                assert.deepEqual(json.folderURIWorkspaces, [fooFile.toString(), barFile.toString()]);
            }));
            test('should persist paths to workspaces.json (root workspace)', () => __awaiter(this, void 0, void 0, function* () {
                const ws1 = toWorkspaceBackupInfo(fooFile.fsPath);
                service.registerWorkspaceBackupSync(ws1);
                const ws2 = toWorkspaceBackupInfo(barFile.fsPath);
                service.registerWorkspaceBackupSync(ws2);
                assertEqualUris(service.getWorkspaceBackups().map(b => b.workspace.configPath), [fooFile, barFile]);
                assert.equal(ws1.workspace.id, service.getWorkspaceBackups()[0].workspace.id);
                assert.equal(ws2.workspace.id, service.getWorkspaceBackups()[1].workspace.id);
                const buffer = yield pfs.readFile(backupWorkspacesPath, 'utf-8');
                const json = JSON.parse(buffer);
                assert.deepEqual(json.rootURIWorkspaces.map(b => b.configURIPath), [fooFile.toString(), barFile.toString()]);
                assert.equal(ws1.workspace.id, json.rootURIWorkspaces[0].id);
                assert.equal(ws2.workspace.id, json.rootURIWorkspaces[1].id);
            }));
        });
        test('should always store the workspace path in workspaces.json using the case given, regardless of whether the file system is case-sensitive (folder workspace)', () => {
            service.registerFolderBackupSync(uri_1.URI.file(fooFile.fsPath.toUpperCase()));
            assertEqualUris(service.getFolderBackupPaths(), [uri_1.URI.file(fooFile.fsPath.toUpperCase())]);
            return pfs.readFile(backupWorkspacesPath, 'utf-8').then(buffer => {
                const json = JSON.parse(buffer);
                assert.deepEqual(json.folderURIWorkspaces, [uri_1.URI.file(fooFile.fsPath.toUpperCase()).toString()]);
            });
        });
        test('should always store the workspace path in workspaces.json using the case given, regardless of whether the file system is case-sensitive (root workspace)', () => {
            const upperFooPath = fooFile.fsPath.toUpperCase();
            service.registerWorkspaceBackupSync(toWorkspaceBackupInfo(upperFooPath));
            assertEqualUris(service.getWorkspaceBackups().map(b => b.workspace.configPath), [uri_1.URI.file(upperFooPath)]);
            return pfs.readFile(backupWorkspacesPath, 'utf-8').then(buffer => {
                const json = JSON.parse(buffer);
                assert.deepEqual(json.rootURIWorkspaces.map(b => b.configURIPath), [uri_1.URI.file(upperFooPath).toString()]);
            });
        });
        suite('removeBackupPathSync', () => {
            test('should remove folder workspaces from workspaces.json (folder workspace)', () => {
                service.registerFolderBackupSync(fooFile);
                service.registerFolderBackupSync(barFile);
                service.unregisterFolderBackupSync(fooFile);
                return pfs.readFile(backupWorkspacesPath, 'utf-8').then(buffer => {
                    const json = JSON.parse(buffer);
                    assert.deepEqual(json.folderURIWorkspaces, [barFile.toString()]);
                    service.unregisterFolderBackupSync(barFile);
                    return pfs.readFile(backupWorkspacesPath, 'utf-8').then(content => {
                        const json2 = JSON.parse(content);
                        assert.deepEqual(json2.folderURIWorkspaces, []);
                    });
                });
            });
            test('should remove folder workspaces from workspaces.json (root workspace)', () => {
                const ws1 = toWorkspaceBackupInfo(fooFile.fsPath);
                service.registerWorkspaceBackupSync(ws1);
                const ws2 = toWorkspaceBackupInfo(barFile.fsPath);
                service.registerWorkspaceBackupSync(ws2);
                service.unregisterWorkspaceBackupSync(ws1.workspace);
                return pfs.readFile(backupWorkspacesPath, 'utf-8').then(buffer => {
                    const json = JSON.parse(buffer);
                    assert.deepEqual(json.rootURIWorkspaces.map(r => r.configURIPath), [barFile.toString()]);
                    service.unregisterWorkspaceBackupSync(ws2.workspace);
                    return pfs.readFile(backupWorkspacesPath, 'utf-8').then(content => {
                        const json2 = JSON.parse(content);
                        assert.deepEqual(json2.rootURIWorkspaces, []);
                    });
                });
            });
            test('should remove empty workspaces from workspaces.json', () => {
                service.registerEmptyWindowBackupSync('foo');
                service.registerEmptyWindowBackupSync('bar');
                service.unregisterEmptyWindowBackupSync('foo');
                return pfs.readFile(backupWorkspacesPath, 'utf-8').then(buffer => {
                    const json = JSON.parse(buffer);
                    assert.deepEqual(json.emptyWorkspaces, ['bar']);
                    service.unregisterEmptyWindowBackupSync('bar');
                    return pfs.readFile(backupWorkspacesPath, 'utf-8').then(content => {
                        const json2 = JSON.parse(content);
                        assert.deepEqual(json2.emptyWorkspaces, []);
                    });
                });
            });
            test('should fail gracefully when removing a path that doesn\'t exist', () => __awaiter(this, void 0, void 0, function* () {
                yield ensureFolderExists(existingTestFolder1); // make sure backup folder exists, so the folder is not removed on loadSync
                const workspacesJson = { rootURIWorkspaces: [], folderURIWorkspaces: [existingTestFolder1.toString()], emptyWorkspaceInfos: [] };
                yield pfs.writeFile(backupWorkspacesPath, JSON.stringify(workspacesJson));
                yield service.initialize();
                service.unregisterFolderBackupSync(barFile);
                service.unregisterEmptyWindowBackupSync('test');
                const content = yield pfs.readFile(backupWorkspacesPath, 'utf-8');
                const json = JSON.parse(content);
                assert.deepEqual(json.folderURIWorkspaces, [existingTestFolder1.toString()]);
            }));
        });
        suite('getWorkspaceHash', () => {
            test('should ignore case on Windows and Mac', () => {
                // Skip test on Linux
                if (platform.isLinux) {
                    return;
                }
                if (platform.isMacintosh) {
                    assert.equal(service.getFolderHash(uri_1.URI.file('/foo')), service.getFolderHash(uri_1.URI.file('/FOO')));
                }
                if (platform.isWindows) {
                    assert.equal(service.getFolderHash(uri_1.URI.file('c:\\foo')), service.getFolderHash(uri_1.URI.file('C:\\FOO')));
                }
            });
        });
        suite('mixed path casing', () => {
            test('should handle case insensitive paths properly (registerWindowForBackupsSync) (folder workspace)', () => {
                service.registerFolderBackupSync(fooFile);
                service.registerFolderBackupSync(uri_1.URI.file(fooFile.fsPath.toUpperCase()));
                if (platform.isLinux) {
                    assert.equal(service.getFolderBackupPaths().length, 2);
                }
                else {
                    assert.equal(service.getFolderBackupPaths().length, 1);
                }
            });
            test('should handle case insensitive paths properly (registerWindowForBackupsSync) (root workspace)', () => {
                service.registerWorkspaceBackupSync(toWorkspaceBackupInfo(fooFile.fsPath));
                service.registerWorkspaceBackupSync(toWorkspaceBackupInfo(fooFile.fsPath.toUpperCase()));
                if (platform.isLinux) {
                    assert.equal(service.getWorkspaceBackups().length, 2);
                }
                else {
                    assert.equal(service.getWorkspaceBackups().length, 1);
                }
            });
            test('should handle case insensitive paths properly (removeBackupPathSync) (folder workspace)', () => {
                // same case
                service.registerFolderBackupSync(fooFile);
                service.unregisterFolderBackupSync(fooFile);
                assert.equal(service.getFolderBackupPaths().length, 0);
                // mixed case
                service.registerFolderBackupSync(fooFile);
                service.unregisterFolderBackupSync(uri_1.URI.file(fooFile.fsPath.toUpperCase()));
                if (platform.isLinux) {
                    assert.equal(service.getFolderBackupPaths().length, 1);
                }
                else {
                    assert.equal(service.getFolderBackupPaths().length, 0);
                }
            });
        });
    });
});
//# sourceMappingURL=backupMainService.test.js.map