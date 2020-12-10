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
define(["require", "exports", "assert", "fs", "vs/base/node/encoding", "stream", "vs/base/common/amd"], function (require, exports, assert, fs, encoding, stream_1, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function detectEncodingByBOM(file) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { buffer, bytesRead } = yield readExactlyByFile(file, 3);
                return encoding.detectEncodingByBOMFromBuffer(buffer, bytesRead);
            }
            catch (error) {
                return null; // ignore errors (like file not found)
            }
        });
    }
    exports.detectEncodingByBOM = detectEncodingByBOM;
    function readExactlyByFile(file, totalBytes) {
        return new Promise((resolve, reject) => {
            fs.open(file, 'r', null, (err, fd) => {
                if (err) {
                    return reject(err);
                }
                function end(err, resultBuffer, bytesRead) {
                    fs.close(fd, closeError => {
                        if (closeError) {
                            return reject(closeError);
                        }
                        if (err && err.code === 'EISDIR') {
                            return reject(err); // we want to bubble this error up (file is actually a folder)
                        }
                        return resolve({ buffer: resultBuffer, bytesRead });
                    });
                }
                const buffer = Buffer.allocUnsafe(totalBytes);
                let offset = 0;
                function readChunk() {
                    fs.read(fd, buffer, offset, totalBytes - offset, null, (err, bytesRead) => {
                        if (err) {
                            return end(err, null, 0);
                        }
                        if (bytesRead === 0) {
                            return end(null, buffer, offset);
                        }
                        offset += bytesRead;
                        if (offset === totalBytes) {
                            return end(null, buffer, offset);
                        }
                        return readChunk();
                    });
                }
                readChunk();
            });
        });
    }
    suite('Encoding', () => {
        test('detectBOM does not return error for non existing file', () => __awaiter(this, void 0, void 0, function* () {
            const file = amd_1.getPathFromAmdModule(require, './fixtures/not-exist.css');
            const detectedEncoding = yield detectEncodingByBOM(file);
            assert.equal(detectedEncoding, null);
        }));
        test('detectBOM UTF-8', () => __awaiter(this, void 0, void 0, function* () {
            const file = amd_1.getPathFromAmdModule(require, './fixtures/some_utf8.css');
            const detectedEncoding = yield detectEncodingByBOM(file);
            assert.equal(detectedEncoding, 'utf8');
        }));
        test('detectBOM UTF-16 LE', () => __awaiter(this, void 0, void 0, function* () {
            const file = amd_1.getPathFromAmdModule(require, './fixtures/some_utf16le.css');
            const detectedEncoding = yield detectEncodingByBOM(file);
            assert.equal(detectedEncoding, 'utf16le');
        }));
        test('detectBOM UTF-16 BE', () => __awaiter(this, void 0, void 0, function* () {
            const file = amd_1.getPathFromAmdModule(require, './fixtures/some_utf16be.css');
            const detectedEncoding = yield detectEncodingByBOM(file);
            assert.equal(detectedEncoding, 'utf16be');
        }));
        test('detectBOM ANSI', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const file = amd_1.getPathFromAmdModule(require, './fixtures/some_ansi.css');
                const detectedEncoding = yield detectEncodingByBOM(file);
                assert.equal(detectedEncoding, null);
            });
        });
        test('detectBOM ANSI', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const file = amd_1.getPathFromAmdModule(require, './fixtures/empty.txt');
                const detectedEncoding = yield detectEncodingByBOM(file);
                assert.equal(detectedEncoding, null);
            });
        });
        test('resolve terminal encoding (detect)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const enc = yield encoding.resolveTerminalEncoding();
                assert.ok(encoding.encodingExists(enc));
            });
        });
        test('resolve terminal encoding (environment)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                process.env['VSCODE_CLI_ENCODING'] = 'utf16le';
                const enc = yield encoding.resolveTerminalEncoding();
                assert.ok(encoding.encodingExists(enc));
                assert.equal(enc, 'utf16le');
            });
        });
        test('detectEncodingFromBuffer (JSON saved as PNG)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const file = amd_1.getPathFromAmdModule(require, './fixtures/some.json.png');
                const buffer = yield readExactlyByFile(file, 512);
                const mimes = encoding.detectEncodingFromBuffer(buffer);
                assert.equal(mimes.seemsBinary, false);
            });
        });
        test('detectEncodingFromBuffer (PNG saved as TXT)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const file = amd_1.getPathFromAmdModule(require, './fixtures/some.png.txt');
                const buffer = yield readExactlyByFile(file, 512);
                const mimes = encoding.detectEncodingFromBuffer(buffer);
                assert.equal(mimes.seemsBinary, true);
            });
        });
        test('detectEncodingFromBuffer (XML saved as PNG)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const file = amd_1.getPathFromAmdModule(require, './fixtures/some.xml.png');
                const buffer = yield readExactlyByFile(file, 512);
                const mimes = encoding.detectEncodingFromBuffer(buffer);
                assert.equal(mimes.seemsBinary, false);
            });
        });
        test('detectEncodingFromBuffer (QWOFF saved as TXT)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const file = amd_1.getPathFromAmdModule(require, './fixtures/some.qwoff.txt');
                const buffer = yield readExactlyByFile(file, 512);
                const mimes = encoding.detectEncodingFromBuffer(buffer);
                assert.equal(mimes.seemsBinary, true);
            });
        });
        test('detectEncodingFromBuffer (CSS saved as QWOFF)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const file = amd_1.getPathFromAmdModule(require, './fixtures/some.css.qwoff');
                const buffer = yield readExactlyByFile(file, 512);
                const mimes = encoding.detectEncodingFromBuffer(buffer);
                assert.equal(mimes.seemsBinary, false);
            });
        });
        test('detectEncodingFromBuffer (PDF)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const file = amd_1.getPathFromAmdModule(require, './fixtures/some.pdf');
                const buffer = yield readExactlyByFile(file, 512);
                const mimes = encoding.detectEncodingFromBuffer(buffer);
                assert.equal(mimes.seemsBinary, true);
            });
        });
        test('detectEncodingFromBuffer (guess UTF-16 LE from content without BOM)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const file = amd_1.getPathFromAmdModule(require, './fixtures/utf16_le_nobom.txt');
                const buffer = yield readExactlyByFile(file, 512);
                const mimes = encoding.detectEncodingFromBuffer(buffer);
                assert.equal(mimes.encoding, encoding.UTF16le);
                assert.equal(mimes.seemsBinary, false);
            });
        });
        test('detectEncodingFromBuffer (guess UTF-16 BE from content without BOM)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const file = amd_1.getPathFromAmdModule(require, './fixtures/utf16_be_nobom.txt');
                const buffer = yield readExactlyByFile(file, 512);
                const mimes = encoding.detectEncodingFromBuffer(buffer);
                assert.equal(mimes.encoding, encoding.UTF16be);
                assert.equal(mimes.seemsBinary, false);
            });
        });
        test('autoGuessEncoding (ShiftJIS)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const file = amd_1.getPathFromAmdModule(require, './fixtures/some.shiftjis.txt');
                const buffer = yield readExactlyByFile(file, 512 * 8);
                const mimes = yield encoding.detectEncodingFromBuffer(buffer, true);
                assert.equal(mimes.encoding, 'shiftjis');
            });
        });
        test('autoGuessEncoding (CP1252)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const file = amd_1.getPathFromAmdModule(require, './fixtures/some.cp1252.txt');
                const buffer = yield readExactlyByFile(file, 512 * 8);
                const mimes = yield encoding.detectEncodingFromBuffer(buffer, true);
                assert.equal(mimes.encoding, 'windows1252');
            });
        });
        function readAndDecodeFromDisk(path, fileEncoding) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    fs.readFile(path, (err, data) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(encoding.decode(data, fileEncoding));
                        }
                    });
                });
            });
        }
        function readAllAsString(stream) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    let all = '';
                    stream.on('data', chunk => {
                        all += chunk;
                        assert.equal(typeof chunk, 'string');
                    });
                    stream.on('end', () => {
                        resolve(all);
                    });
                    stream.on('error', reject);
                });
            });
        }
        test('toDecodeStream - some stream', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let source = new stream_1.Readable({
                    read(size) {
                        this.push(Buffer.from([65, 66, 67]));
                        this.push(Buffer.from([65, 66, 67]));
                        this.push(Buffer.from([65, 66, 67]));
                        this.push(null);
                    }
                });
                let { detected, stream } = yield encoding.toDecodeStream(source, { minBytesRequiredForDetection: 4, guessEncoding: false, overwriteEncoding: detected => detected || encoding.UTF8 });
                assert.ok(detected);
                assert.ok(stream);
                const content = yield readAllAsString(stream);
                assert.equal(content, 'ABCABCABC');
            });
        });
        test('toDecodeStream - some stream, expect too much data', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let source = new stream_1.Readable({
                    read(size) {
                        this.push(Buffer.from([65, 66, 67]));
                        this.push(Buffer.from([65, 66, 67]));
                        this.push(Buffer.from([65, 66, 67]));
                        this.push(null);
                    }
                });
                let { detected, stream } = yield encoding.toDecodeStream(source, { minBytesRequiredForDetection: 64, guessEncoding: false, overwriteEncoding: detected => detected || encoding.UTF8 });
                assert.ok(detected);
                assert.ok(stream);
                const content = yield readAllAsString(stream);
                assert.equal(content, 'ABCABCABC');
            });
        });
        test('toDecodeStream - some stream, no data', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let source = new stream_1.Readable({
                    read(size) {
                        this.push(null); // empty
                    }
                });
                let { detected, stream } = yield encoding.toDecodeStream(source, { minBytesRequiredForDetection: 512, guessEncoding: false, overwriteEncoding: detected => detected || encoding.UTF8 });
                assert.ok(detected);
                assert.ok(stream);
                const content = yield readAllAsString(stream);
                assert.equal(content, '');
            });
        });
        test('toDecodeStream - encoding, utf16be', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let path = amd_1.getPathFromAmdModule(require, './fixtures/some_utf16be.css');
                let source = fs.createReadStream(path);
                let { detected, stream } = yield encoding.toDecodeStream(source, { minBytesRequiredForDetection: 64, guessEncoding: false, overwriteEncoding: detected => detected || encoding.UTF8 });
                assert.equal(detected.encoding, 'utf16be');
                assert.equal(detected.seemsBinary, false);
                let expected = yield readAndDecodeFromDisk(path, detected.encoding);
                let actual = yield readAllAsString(stream);
                assert.equal(actual, expected);
            });
        });
        test('toDecodeStream - empty file', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let path = amd_1.getPathFromAmdModule(require, './fixtures/empty.txt');
                let source = fs.createReadStream(path);
                let { detected, stream } = yield encoding.toDecodeStream(source, { guessEncoding: false, overwriteEncoding: detected => detected || encoding.UTF8 });
                let expected = yield readAndDecodeFromDisk(path, detected.encoding);
                let actual = yield readAllAsString(stream);
                assert.equal(actual, expected);
            });
        });
    });
});
//# sourceMappingURL=encoding.test.js.map