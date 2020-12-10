var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/test/workbenchTestServices", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/untitled/common/untitledEditorService", "vs/platform/files/common/files", "vs/base/common/network", "vs/platform/instantiation/common/serviceCollection", "vs/base/node/pfs", "vs/base/common/lifecycle", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/base/test/node/testUtils", "os", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/uuid", "vs/base/common/path", "vs/base/common/amd", "vs/base/node/encoding", "vs/workbench/services/textfile/node/textFileService", "vs/editor/common/model/textModel", "vs/base/common/platform", "fs", "vs/base/test/node/encoding/encoding.test"], function (require, exports, assert, uri_1, workbenchTestServices_1, textfiles_1, untitledEditorService_1, files_1, network_1, serviceCollection_1, pfs_1, lifecycle_1, fileService_1, log_1, testUtils_1, os_1, diskFileSystemProvider_1, uuid_1, path_1, amd_1, encoding_1, textFileService_1, textModel_1, platform_1, fs_1, encoding_test_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ServiceAccessor = class ServiceAccessor {
        constructor(textFileService, untitledEditorService) {
            this.textFileService = textFileService;
            this.untitledEditorService = untitledEditorService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, textfiles_1.ITextFileService),
        __param(1, untitledEditorService_1.IUntitledEditorService)
    ], ServiceAccessor);
    class TestNodeTextFileService extends textFileService_1.NodeTextFileService {
        get encoding() {
            if (!this._testEncoding) {
                this._testEncoding = this._register(this.instantiationService.createInstance(TestEncodingOracle));
            }
            return this._testEncoding;
        }
    }
    class TestEncodingOracle extends textFileService_1.EncodingOracle {
        get encodingOverrides() {
            return [
                { extension: 'utf16le', encoding: encoding_1.UTF16le },
                { extension: 'utf16be', encoding: encoding_1.UTF16be },
                { extension: 'utf8bom', encoding: encoding_1.UTF8_with_bom }
            ];
        }
        set encodingOverrides(overrides) { }
    }
    suite('Files - TextFileService i/o', () => {
        const parentDir = testUtils_1.getRandomTestPath(os_1.tmpdir(), 'vsctests', 'textfileservice');
        let accessor;
        const disposables = new lifecycle_1.DisposableStore();
        let service;
        let testDir;
        setup(() => __awaiter(this, void 0, void 0, function* () {
            const instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
            const logService = new log_1.NullLogService();
            const fileService = new fileService_1.FileService(logService);
            const fileProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
            disposables.add(fileService.registerProvider(network_1.Schemas.file, fileProvider));
            disposables.add(fileProvider);
            const collection = new serviceCollection_1.ServiceCollection();
            collection.set(files_1.IFileService, fileService);
            service = instantiationService.createChild(collection).createInstance(TestNodeTextFileService);
            const id = uuid_1.generateUuid();
            testDir = path_1.join(parentDir, id);
            const sourceDir = amd_1.getPathFromAmdModule(require, './fixtures');
            yield pfs_1.copy(sourceDir, testDir);
        }));
        teardown(() => __awaiter(this, void 0, void 0, function* () {
            accessor.textFileService.models.clear();
            accessor.textFileService.models.dispose();
            accessor.untitledEditorService.revertAll();
            disposables.clear();
            yield pfs_1.rimraf(parentDir, pfs_1.RimRafMode.MOVE);
        }));
        test('create - no encoding - content empty', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.txt'));
            yield service.create(resource);
            assert.equal(yield pfs_1.exists(resource.fsPath), true);
        }));
        test('create - no encoding - content provided', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.txt'));
            yield service.create(resource, 'Hello World');
            assert.equal(yield pfs_1.exists(resource.fsPath), true);
            assert.equal((yield pfs_1.readFile(resource.fsPath)).toString(), 'Hello World');
        }));
        test('create - UTF 16 LE - no content', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf16le'));
            yield service.create(resource);
            assert.equal(yield pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF16le);
        }));
        test('create - UTF 16 LE - content provided', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf16le'));
            yield service.create(resource, 'Hello World');
            assert.equal(yield pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF16le);
        }));
        test('create - UTF 16 BE - no content', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf16be'));
            yield service.create(resource);
            assert.equal(yield pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF16be);
        }));
        test('create - UTF 16 BE - content provided', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf16be'));
            yield service.create(resource, 'Hello World');
            assert.equal(yield pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF16be);
        }));
        test('create - UTF 8 BOM - no content', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf8bom'));
            yield service.create(resource);
            assert.equal(yield pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
        }));
        test('create - UTF 8 BOM - content provided', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf8bom'));
            yield service.create(resource, 'Hello World');
            assert.equal(yield pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
        }));
        test('create - UTF 8 BOM - empty content - snapshot', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf8bom'));
            yield service.create(resource, textModel_1.TextModel.createFromString('').createSnapshot());
            assert.equal(yield pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
        }));
        test('create - UTF 8 BOM - content provided - snapshot', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small_new.utf8bom'));
            yield service.create(resource, textModel_1.TextModel.createFromString('Hello World').createSnapshot());
            assert.equal(yield pfs_1.exists(resource.fsPath), true);
            const detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
        }));
        test('write - use encoding (UTF 16 BE) - small content as string', () => __awaiter(this, void 0, void 0, function* () {
            yield testEncoding(uri_1.URI.file(path_1.join(testDir, 'small.txt')), encoding_1.UTF16be, 'Hello\nWorld', 'Hello\nWorld');
        }));
        test('write - use encoding (UTF 16 BE) - small content as snapshot', () => __awaiter(this, void 0, void 0, function* () {
            yield testEncoding(uri_1.URI.file(path_1.join(testDir, 'small.txt')), encoding_1.UTF16be, textModel_1.TextModel.createFromString('Hello\nWorld').createSnapshot(), 'Hello\nWorld');
        }));
        test('write - use encoding (UTF 16 BE) - large content as string', () => __awaiter(this, void 0, void 0, function* () {
            yield testEncoding(uri_1.URI.file(path_1.join(testDir, 'lorem.txt')), encoding_1.UTF16be, 'Hello\nWorld', 'Hello\nWorld');
        }));
        test('write - use encoding (UTF 16 BE) - large content as snapshot', () => __awaiter(this, void 0, void 0, function* () {
            yield testEncoding(uri_1.URI.file(path_1.join(testDir, 'lorem.txt')), encoding_1.UTF16be, textModel_1.TextModel.createFromString('Hello\nWorld').createSnapshot(), 'Hello\nWorld');
        }));
        function testEncoding(resource, encoding, content, expectedContent) {
            return __awaiter(this, void 0, void 0, function* () {
                yield service.write(resource, content, { encoding });
                const detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
                assert.equal(detectedEncoding, encoding);
                const resolved = yield service.readStream(resource);
                assert.equal(resolved.encoding, encoding);
                assert.equal(textfiles_1.snapshotToString(resolved.value.create(platform_1.isWindows ? 2 /* CRLF */ : 1 /* LF */).createSnapshot(false)), expectedContent);
            });
        }
        test('write - use encoding (cp1252)', () => __awaiter(this, void 0, void 0, function* () {
            const filePath = path_1.join(testDir, 'some_cp1252.txt');
            const contents = yield pfs_1.readFile(filePath, 'utf8');
            const eol = /\r\n/.test(contents) ? '\r\n' : '\n';
            yield testEncodingKeepsData(uri_1.URI.file(filePath), 'cp1252', ['ObjectCount = LoadObjects("Öffentlicher Ordner");', '', 'Private = "Persönliche Information"', ''].join(eol));
        }));
        test('write - use encoding (shiftjis)', () => __awaiter(this, void 0, void 0, function* () {
            yield testEncodingKeepsData(uri_1.URI.file(path_1.join(testDir, 'some_shiftjs.txt')), 'shiftjis', '中文abc');
        }));
        test('write - use encoding (gbk)', () => __awaiter(this, void 0, void 0, function* () {
            yield testEncodingKeepsData(uri_1.URI.file(path_1.join(testDir, 'some_gbk.txt')), 'gbk', '中国abc');
        }));
        test('write - use encoding (cyrillic)', () => __awaiter(this, void 0, void 0, function* () {
            yield testEncodingKeepsData(uri_1.URI.file(path_1.join(testDir, 'some_cyrillic.txt')), 'cp866', 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя');
        }));
        test('write - use encoding (big5)', () => __awaiter(this, void 0, void 0, function* () {
            yield testEncodingKeepsData(uri_1.URI.file(path_1.join(testDir, 'some_big5.txt')), 'cp950', '中文abc');
        }));
        function testEncodingKeepsData(resource, encoding, expected) {
            return __awaiter(this, void 0, void 0, function* () {
                let resolved = yield service.readStream(resource, { encoding });
                const content = textfiles_1.snapshotToString(resolved.value.create(platform_1.isWindows ? 2 /* CRLF */ : 1 /* LF */).createSnapshot(false));
                assert.equal(content, expected);
                yield service.write(resource, content, { encoding });
                resolved = yield service.readStream(resource, { encoding });
                assert.equal(textfiles_1.snapshotToString(resolved.value.create(2 /* CRLF */).createSnapshot(false)), content);
                yield service.write(resource, textModel_1.TextModel.createFromString(content).createSnapshot(), { encoding });
                resolved = yield service.readStream(resource, { encoding });
                assert.equal(textfiles_1.snapshotToString(resolved.value.create(2 /* CRLF */).createSnapshot(false)), content);
            });
        }
        test('write - no encoding - content as string', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const content = (yield pfs_1.readFile(resource.fsPath)).toString();
            yield service.write(resource, content);
            const resolved = yield service.readStream(resource);
            assert.equal(resolved.value.getFirstLineText(999999), content);
        }));
        test('write - no encoding - content as snapshot', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            const content = (yield pfs_1.readFile(resource.fsPath)).toString();
            yield service.write(resource, textModel_1.TextModel.createFromString(content).createSnapshot());
            const resolved = yield service.readStream(resource);
            assert.equal(resolved.value.getFirstLineText(999999), content);
        }));
        test('write - encoding preserved (UTF 16 LE) - content as string', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_utf16le.css'));
            const resolved = yield service.readStream(resource);
            assert.equal(resolved.encoding, encoding_1.UTF16le);
            yield testEncoding(uri_1.URI.file(path_1.join(testDir, 'some_utf16le.css')), encoding_1.UTF16le, 'Hello\nWorld', 'Hello\nWorld');
        }));
        test('write - encoding preserved (UTF 16 LE) - content as snapshot', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_utf16le.css'));
            const resolved = yield service.readStream(resource);
            assert.equal(resolved.encoding, encoding_1.UTF16le);
            yield testEncoding(uri_1.URI.file(path_1.join(testDir, 'some_utf16le.css')), encoding_1.UTF16le, textModel_1.TextModel.createFromString('Hello\nWorld').createSnapshot(), 'Hello\nWorld');
        }));
        test('write - UTF8 variations - content as string', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'index.html'));
            let detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, null);
            const content = (yield pfs_1.readFile(resource.fsPath)).toString() + 'updates';
            yield service.write(resource, content, { encoding: encoding_1.UTF8_with_bom });
            detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
            // ensure BOM preserved
            yield service.write(resource, content, { encoding: encoding_1.UTF8 });
            detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
            // allow to remove BOM
            yield service.write(resource, content, { encoding: encoding_1.UTF8, overwriteEncoding: true });
            detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, null);
            // BOM does not come back
            yield service.write(resource, content, { encoding: encoding_1.UTF8 });
            detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, null);
        }));
        test('write - UTF8 variations - content as snapshot', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'index.html'));
            let detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, null);
            const model = textModel_1.TextModel.createFromString((yield pfs_1.readFile(resource.fsPath)).toString() + 'updates');
            yield service.write(resource, model.createSnapshot(), { encoding: encoding_1.UTF8_with_bom });
            detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
            // ensure BOM preserved
            yield service.write(resource, model.createSnapshot(), { encoding: encoding_1.UTF8 });
            detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
            // allow to remove BOM
            yield service.write(resource, model.createSnapshot(), { encoding: encoding_1.UTF8, overwriteEncoding: true });
            detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, null);
            // BOM does not come back
            yield service.write(resource, model.createSnapshot(), { encoding: encoding_1.UTF8 });
            detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, null);
        }));
        test('write - preserve UTF8 BOM - content as string', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_utf8_bom.txt'));
            let detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
            yield service.write(resource, 'Hello World');
            detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
        }));
        test('write - ensure BOM in empty file - content as string', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            yield service.write(resource, '', { encoding: encoding_1.UTF8_with_bom });
            let detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
        }));
        test('write - ensure BOM in empty file - content as snapshot', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            yield service.write(resource, textModel_1.TextModel.createFromString('').createSnapshot(), { encoding: encoding_1.UTF8_with_bom });
            let detectedEncoding = yield encoding_test_1.detectEncodingByBOM(resource.fsPath);
            assert.equal(detectedEncoding, encoding_1.UTF8);
        }));
        test('readStream - small text', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            yield testReadStream(resource);
        }));
        test('readStream - large text', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            yield testReadStream(resource);
        }));
        function testReadStream(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield service.readStream(resource);
                assert.equal(result.name, path_1.basename(resource.fsPath));
                assert.equal(result.size, fs_1.statSync(resource.fsPath).size);
                assert.equal(textfiles_1.snapshotToString(result.value.create(1 /* LF */).createSnapshot(false)), textfiles_1.snapshotToString(textModel_1.TextModel.createFromString(fs_1.readFileSync(resource.fsPath).toString()).createSnapshot(false)));
            });
        }
        test('read - small text', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'small.txt'));
            yield testRead(resource);
        }));
        test('read - large text', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'lorem.txt'));
            yield testRead(resource);
        }));
        function testRead(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield service.read(resource);
                assert.equal(result.name, path_1.basename(resource.fsPath));
                assert.equal(result.size, fs_1.statSync(resource.fsPath).size);
                assert.equal(result.value, fs_1.readFileSync(resource.fsPath).toString());
            });
        }
        test('readStream - encoding picked up (CP1252)', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_small_cp1252.txt'));
            const encoding = 'windows1252';
            const result = yield service.readStream(resource, { encoding });
            assert.equal(result.encoding, encoding);
            assert.equal(result.value.getFirstLineText(999999), 'Private = "Persönlicheß Information"');
        }));
        test('read - encoding picked up (CP1252)', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_small_cp1252.txt'));
            const encoding = 'windows1252';
            const result = yield service.read(resource, { encoding });
            assert.equal(result.encoding, encoding);
            assert.equal(result.value, 'Private = "Persönlicheß Information"');
        }));
        test('read - encoding picked up (binary)', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_small_cp1252.txt'));
            const encoding = 'binary';
            const result = yield service.read(resource, { encoding });
            assert.equal(result.encoding, encoding);
            assert.equal(result.value, 'Private = "Persönlicheß Information"');
        }));
        test('read - encoding picked up (base64)', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_small_cp1252.txt'));
            const encoding = 'base64';
            const result = yield service.read(resource, { encoding });
            assert.equal(result.encoding, encoding);
            assert.equal(result.value, btoa('Private = "Persönlicheß Information"'));
        }));
        test('readStream - user overrides BOM', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_utf16le.css'));
            const result = yield service.readStream(resource, { encoding: 'windows1252' });
            assert.equal(result.encoding, 'windows1252');
        }));
        test('readStream - BOM removed', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_utf8_bom.txt'));
            const result = yield service.readStream(resource);
            assert.equal(result.value.getFirstLineText(999999), 'This is some UTF 8 with BOM file.');
        }));
        test('readStream - invalid encoding', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'index.html'));
            const result = yield service.readStream(resource, { encoding: 'superduper' });
            assert.equal(result.encoding, 'utf8');
        }));
        test('readStream - encoding override', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some.utf16le'));
            const result = yield service.readStream(resource, { encoding: 'windows1252' });
            assert.equal(result.encoding, 'utf16le');
            assert.equal(result.value.getFirstLineText(999999), 'This is some UTF 16 with BOM file.');
        }));
        test('readStream - large Big5', () => __awaiter(this, void 0, void 0, function* () {
            yield testLargeEncoding('big5', '中文abc');
        }));
        test('readStream - large CP1252', () => __awaiter(this, void 0, void 0, function* () {
            yield testLargeEncoding('cp1252', 'öäüß');
        }));
        test('readStream - large Cyrillic', () => __awaiter(this, void 0, void 0, function* () {
            yield testLargeEncoding('cp866', 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя');
        }));
        test('readStream - large GBK', () => __awaiter(this, void 0, void 0, function* () {
            yield testLargeEncoding('gbk', '中国abc');
        }));
        test('readStream - large ShiftJS', () => __awaiter(this, void 0, void 0, function* () {
            yield testLargeEncoding('shiftjis', '中文abc');
        }));
        test('readStream - large UTF8 BOM', () => __awaiter(this, void 0, void 0, function* () {
            yield testLargeEncoding('utf8bom', 'öäüß');
        }));
        test('readStream - large UTF16 LE', () => __awaiter(this, void 0, void 0, function* () {
            yield testLargeEncoding('utf16le', 'öäüß');
        }));
        test('readStream - large UTF16 BE', () => __awaiter(this, void 0, void 0, function* () {
            yield testLargeEncoding('utf16be', 'öäüß');
        }));
        function testLargeEncoding(encoding, needle) {
            return __awaiter(this, void 0, void 0, function* () {
                const resource = uri_1.URI.file(path_1.join(testDir, `lorem_${encoding}.txt`));
                const result = yield service.readStream(resource, { encoding });
                assert.equal(result.encoding, encoding);
                const contents = textfiles_1.snapshotToString(result.value.create(1 /* LF */).createSnapshot(false));
                assert.equal(contents.indexOf(needle), 0);
                assert.ok(contents.indexOf(needle, 10) > 0);
            });
        }
        test('readStream - UTF16 LE (no BOM)', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'utf16_le_nobom.txt'));
            const result = yield service.readStream(resource);
            assert.equal(result.encoding, 'utf16le');
        }));
        test('readStream - UTF16 BE (no BOM)', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'utf16_be_nobom.txt'));
            const result = yield service.readStream(resource);
            assert.equal(result.encoding, 'utf16be');
        }));
        test('readStream - autoguessEncoding', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'some_cp1252.txt'));
            const result = yield service.readStream(resource, { autoGuessEncoding: true });
            assert.equal(result.encoding, 'windows1252');
        }));
        test('readStream - FILE_IS_BINARY', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'binary.txt'));
            let error = undefined;
            try {
                yield service.readStream(resource, { acceptTextOnly: true });
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.equal(error.textFileOperationResult, 0 /* FILE_IS_BINARY */);
            const result = yield service.readStream(uri_1.URI.file(path_1.join(testDir, 'small.txt')), { acceptTextOnly: true });
            assert.equal(result.name, 'small.txt');
        }));
        test('read - FILE_IS_BINARY', () => __awaiter(this, void 0, void 0, function* () {
            const resource = uri_1.URI.file(path_1.join(testDir, 'binary.txt'));
            let error = undefined;
            try {
                yield service.read(resource, { acceptTextOnly: true });
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.equal(error.textFileOperationResult, 0 /* FILE_IS_BINARY */);
            const result = yield service.read(uri_1.URI.file(path_1.join(testDir, 'small.txt')), { acceptTextOnly: true });
            assert.equal(result.name, 'small.txt');
        }));
    });
});
//# sourceMappingURL=textFileService.io.test.js.map