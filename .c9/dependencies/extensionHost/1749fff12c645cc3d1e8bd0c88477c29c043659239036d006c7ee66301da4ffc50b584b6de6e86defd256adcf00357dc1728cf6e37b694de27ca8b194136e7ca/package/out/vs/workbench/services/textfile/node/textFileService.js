/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
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
define(["require", "exports", "os", "vs/nls", "vs/workbench/services/textfile/common/textFileService", "vs/workbench/services/textfile/common/textfiles", "vs/platform/instantiation/common/extensions", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/network", "vs/base/node/pfs", "vs/base/common/path", "vs/base/common/platform", "vs/platform/product/node/product", "vs/editor/common/services/resourceConfiguration", "vs/platform/workspace/common/workspace", "vs/base/node/encoding", "vs/platform/workspaces/common/workspaces", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "stream", "vs/editor/common/model/textModel", "vs/base/node/stream"], function (require, exports, os_1, nls_1, textFileService_1, textfiles_1, extensions_1, uri_1, files_1, network_1, pfs_1, path_1, platform_1, product_1, resourceConfiguration_1, workspace_1, encoding_1, workspaces_1, resources_1, lifecycle_1, environment_1, stream_1, textModel_1, stream_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class NodeTextFileService extends textFileService_1.TextFileService {
        get encoding() {
            if (!this._encoding) {
                this._encoding = this._register(this.instantiationService.createInstance(EncodingOracle));
            }
            return this._encoding;
        }
        read(resource, options) {
            return __awaiter(this, void 0, void 0, function* () {
                const [bufferStream, decoder] = yield this.doRead(resource, options);
                return Object.assign({}, bufferStream, { encoding: decoder.detected.encoding || encoding_1.UTF8, value: yield stream_2.nodeReadableToString(decoder.stream) });
            });
        }
        readStream(resource, options) {
            return __awaiter(this, void 0, void 0, function* () {
                const [bufferStream, decoder] = yield this.doRead(resource, options);
                return Object.assign({}, bufferStream, { encoding: decoder.detected.encoding || encoding_1.UTF8, value: yield textModel_1.createTextBufferFactoryFromStream(decoder.stream) });
            });
        }
        doRead(resource, options) {
            return __awaiter(this, void 0, void 0, function* () {
                // ensure limits
                options = this.ensureLimits(options);
                // read stream raw
                const bufferStream = yield this.fileService.readFileStream(resource, options);
                // read through encoding library
                const decoder = yield encoding_1.toDecodeStream(stream_2.streamToNodeReadable(bufferStream.value), {
                    guessEncoding: (options && options.autoGuessEncoding) || this.textResourceConfigurationService.getValue(resource, 'files.autoGuessEncoding'),
                    overwriteEncoding: detectedEncoding => this.encoding.getReadEncoding(resource, options, detectedEncoding)
                });
                // validate binary
                if (options && options.acceptTextOnly && decoder.detected.seemsBinary) {
                    throw new textfiles_1.TextFileOperationError(nls_1.localize('fileBinaryError', "File seems to be binary and cannot be opened as text"), 0 /* FILE_IS_BINARY */, options);
                }
                return [bufferStream, decoder];
            });
        }
        ensureLimits(options) {
            let ensuredOptions;
            if (!options) {
                ensuredOptions = Object.create(null);
            }
            else {
                ensuredOptions = options;
            }
            let ensuredLimits;
            if (!ensuredOptions.limits) {
                ensuredLimits = Object.create(null);
                ensuredOptions.limits = ensuredLimits;
            }
            else {
                ensuredLimits = ensuredOptions.limits;
            }
            if (typeof ensuredLimits.size !== 'number') {
                ensuredLimits.size = pfs_1.MAX_FILE_SIZE;
            }
            if (typeof ensuredLimits.memory !== 'number') {
                ensuredLimits.memory = Math.max(typeof this.environmentService.args['max-memory'] === 'string' ? parseInt(this.environmentService.args['max-memory']) * 1024 * 1024 || 0 : 0, pfs_1.MAX_HEAP_SIZE);
            }
            return ensuredOptions;
        }
        doCreate(resource, value, options) {
            const _super = Object.create(null, {
                doCreate: { get: () => super.doCreate }
            });
            return __awaiter(this, void 0, void 0, function* () {
                // check for encoding
                const { encoding, addBOM } = yield this.encoding.getWriteEncoding(resource);
                // return to parent when encoding is standard
                if (encoding === encoding_1.UTF8 && !addBOM) {
                    return _super.doCreate.call(this, resource, value, options);
                }
                // otherwise create with encoding
                return this.fileService.createFile(resource, this.getEncodedReadable(value || '', encoding, addBOM), options);
            });
        }
        write(resource, value, options) {
            const _super = Object.create(null, {
                write: { get: () => super.write }
            });
            return __awaiter(this, void 0, void 0, function* () {
                // check for overwriteReadonly property (only supported for local file://)
                try {
                    if (options && options.overwriteReadonly && resource.scheme === network_1.Schemas.file && (yield pfs_1.exists(resource.fsPath))) {
                        const fileStat = yield pfs_1.stat(resource.fsPath);
                        // try to change mode to writeable
                        yield pfs_1.chmod(resource.fsPath, fileStat.mode | 128);
                    }
                }
                catch (error) {
                    // ignore and simply retry the operation
                }
                // check for writeElevated property (only supported for local file://)
                if (options && options.writeElevated && resource.scheme === network_1.Schemas.file) {
                    return this.writeElevated(resource, value, options);
                }
                try {
                    // check for encoding
                    const { encoding, addBOM } = yield this.encoding.getWriteEncoding(resource, options);
                    // return to parent when encoding is standard
                    if (encoding === encoding_1.UTF8 && !addBOM) {
                        return yield _super.write.call(this, resource, value, options);
                    }
                    // otherwise save with encoding
                    else {
                        return yield this.fileService.writeFile(resource, this.getEncodedReadable(value, encoding, addBOM), options);
                    }
                }
                catch (error) {
                    // In case of permission denied, we need to check for readonly
                    if (error.fileOperationResult === 6 /* FILE_PERMISSION_DENIED */) {
                        let isReadonly = false;
                        try {
                            const fileStat = yield pfs_1.stat(resource.fsPath);
                            if (!(fileStat.mode & 128)) {
                                isReadonly = true;
                            }
                        }
                        catch (error) {
                            // ignore - rethrow original error
                        }
                        if (isReadonly) {
                            throw new files_1.FileOperationError(nls_1.localize('fileReadOnlyError', "File is Read Only"), 5 /* FILE_READ_ONLY */, options);
                        }
                    }
                    throw error;
                }
            });
        }
        getEncodedReadable(value, encoding, addBOM) {
            const readable = this.snapshotToNodeReadable(typeof value === 'string' ? textfiles_1.stringToSnapshot(value) : value);
            const encoder = encoding_1.encodeStream(encoding, { addBOM });
            const encodedReadable = readable.pipe(encoder);
            return stream_2.nodeStreamToVSBufferReadable(encodedReadable, addBOM && encoding_1.isUTFEncoding(encoding) ? { encoding } : undefined);
        }
        snapshotToNodeReadable(snapshot) {
            return new stream_1.Readable({
                read: function () {
                    try {
                        let chunk = null;
                        let canPush = true;
                        // Push all chunks as long as we can push and as long as
                        // the underlying snapshot returns strings to us
                        while (canPush && typeof (chunk = snapshot.read()) === 'string') {
                            canPush = this.push(chunk);
                        }
                        // Signal EOS by pushing NULL
                        if (typeof chunk !== 'string') {
                            this.push(null);
                        }
                    }
                    catch (error) {
                        this.emit('error', error);
                    }
                },
                encoding: encoding_1.UTF8 // very important, so that strings are passed around and not buffers!
            });
        }
        writeElevated(resource, value, options) {
            return __awaiter(this, void 0, void 0, function* () {
                // write into a tmp file first
                const tmpPath = path_1.join(os_1.tmpdir(), `code-elevated-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6)}`);
                const { encoding, addBOM } = yield this.encoding.getWriteEncoding(resource, options);
                yield this.write(uri_1.URI.file(tmpPath), value, { encoding: encoding === encoding_1.UTF8 && addBOM ? encoding_1.UTF8_with_bom : encoding });
                // sudo prompt copy
                yield this.sudoPromptCopy(tmpPath, resource.fsPath, options);
                // clean up
                yield pfs_1.rimraf(tmpPath);
                return this.fileService.resolve(resource, { resolveMetadata: true });
            });
        }
        sudoPromptCopy(source, target, options) {
            return __awaiter(this, void 0, void 0, function* () {
                // load sudo-prompt module lazy
                const sudoPrompt = yield new Promise((resolve_1, reject_1) => { require(['sudo-prompt'], resolve_1, reject_1); });
                return new Promise((resolve, reject) => {
                    const promptOptions = {
                        name: this.environmentService.appNameLong.replace('-', ''),
                        icns: (platform_1.isMacintosh && this.environmentService.isBuilt) ? path_1.join(path_1.dirname(this.environmentService.appRoot), `${product_1.default.nameShort}.icns`) : undefined
                    };
                    const sudoCommand = [`"${this.environmentService.cliPath}"`];
                    if (options && options.overwriteReadonly) {
                        sudoCommand.push('--file-chmod');
                    }
                    sudoCommand.push('--file-write', `"${source}"`, `"${target}"`);
                    sudoPrompt.exec(sudoCommand.join(' '), promptOptions, (error, stdout, stderr) => {
                        if (error || stderr) {
                            reject(error || stderr);
                        }
                        else {
                            resolve(undefined);
                        }
                    });
                });
            });
        }
    }
    exports.NodeTextFileService = NodeTextFileService;
    let EncodingOracle = class EncodingOracle extends lifecycle_1.Disposable {
        constructor(textResourceConfigurationService, environmentService, contextService, fileService) {
            super();
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.fileService = fileService;
            this.encodingOverrides = this.getDefaultEncodingOverrides();
            this.registerListeners();
        }
        registerListeners() {
            // Workspace Folder Change
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.encodingOverrides = this.getDefaultEncodingOverrides()));
        }
        getDefaultEncodingOverrides() {
            const defaultEncodingOverrides = [];
            // Global settings
            defaultEncodingOverrides.push({ parent: this.environmentService.userRoamingDataHome, encoding: encoding_1.UTF8 });
            // Workspace files
            defaultEncodingOverrides.push({ extension: workspaces_1.WORKSPACE_EXTENSION, encoding: encoding_1.UTF8 });
            // Folder Settings
            this.contextService.getWorkspace().folders.forEach(folder => {
                defaultEncodingOverrides.push({ parent: resources_1.joinPath(folder.uri, '.vscode'), encoding: encoding_1.UTF8 });
            });
            return defaultEncodingOverrides;
        }
        getWriteEncoding(resource, options) {
            return __awaiter(this, void 0, void 0, function* () {
                const { encoding, hasBOM } = this.getPreferredWriteEncoding(resource, options ? options.encoding : undefined);
                // Some encodings come with a BOM automatically
                if (hasBOM) {
                    return { encoding, addBOM: true };
                }
                // Ensure that we preserve an existing BOM if found for UTF8
                // unless we are instructed to overwrite the encoding
                const overwriteEncoding = options && options.overwriteEncoding;
                if (!overwriteEncoding && encoding === encoding_1.UTF8) {
                    try {
                        const buffer = (yield this.fileService.readFile(resource, { length: encoding_1.UTF8_BOM.length })).value;
                        if (encoding_1.detectEncodingByBOMFromBuffer(buffer, buffer.byteLength) === encoding_1.UTF8) {
                            return { encoding, addBOM: true };
                        }
                    }
                    catch (error) {
                        // ignore - file might not exist
                    }
                }
                return { encoding, addBOM: false };
            });
        }
        getPreferredWriteEncoding(resource, preferredEncoding) {
            const resourceEncoding = this.getEncodingForResource(resource, preferredEncoding);
            return {
                encoding: resourceEncoding,
                hasBOM: resourceEncoding === encoding_1.UTF16be || resourceEncoding === encoding_1.UTF16le || resourceEncoding === encoding_1.UTF8_with_bom // enforce BOM for certain encodings
            };
        }
        getReadEncoding(resource, options, detectedEncoding) {
            let preferredEncoding;
            // Encoding passed in as option
            if (options && options.encoding) {
                if (detectedEncoding === encoding_1.UTF8 && options.encoding === encoding_1.UTF8) {
                    preferredEncoding = encoding_1.UTF8_with_bom; // indicate the file has BOM if we are to resolve with UTF 8
                }
                else {
                    preferredEncoding = options.encoding; // give passed in encoding highest priority
                }
            }
            // Encoding detected
            else if (detectedEncoding) {
                if (detectedEncoding === encoding_1.UTF8) {
                    preferredEncoding = encoding_1.UTF8_with_bom; // if we detected UTF-8, it can only be because of a BOM
                }
                else {
                    preferredEncoding = detectedEncoding;
                }
            }
            // Encoding configured
            else if (this.textResourceConfigurationService.getValue(resource, 'files.encoding') === encoding_1.UTF8_with_bom) {
                preferredEncoding = encoding_1.UTF8; // if we did not detect UTF 8 BOM before, this can only be UTF 8 then
            }
            return this.getEncodingForResource(resource, preferredEncoding);
        }
        getEncodingForResource(resource, preferredEncoding) {
            let fileEncoding;
            const override = this.getEncodingOverride(resource);
            if (override) {
                fileEncoding = override; // encoding override always wins
            }
            else if (preferredEncoding) {
                fileEncoding = preferredEncoding; // preferred encoding comes second
            }
            else {
                fileEncoding = this.textResourceConfigurationService.getValue(resource, 'files.encoding'); // and last we check for settings
            }
            if (!fileEncoding || !encoding_1.encodingExists(fileEncoding)) {
                fileEncoding = encoding_1.UTF8; // the default is UTF 8
            }
            return fileEncoding;
        }
        getEncodingOverride(resource) {
            if (this.encodingOverrides && this.encodingOverrides.length) {
                for (const override of this.encodingOverrides) {
                    // check if the resource is child of encoding override path
                    if (override.parent && resources_1.isEqualOrParent(resource, override.parent)) {
                        return override.encoding;
                    }
                    // check if the resource extension is equal to encoding override
                    if (override.extension && resources_1.extname(resource) === `.${override.extension}`) {
                        return override.encoding;
                    }
                }
            }
            return undefined;
        }
    };
    EncodingOracle = __decorate([
        __param(0, resourceConfiguration_1.ITextResourceConfigurationService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, files_1.IFileService)
    ], EncodingOracle);
    exports.EncodingOracle = EncodingOracle;
    extensions_1.registerSingleton(textfiles_1.ITextFileService, NodeTextFileService);
});
//# sourceMappingURL=textFileService.js.map