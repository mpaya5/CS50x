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
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/async"], function (require, exports, assert, buffer_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Buffer', () => {
        test('issue #71993 - VSBuffer#toString returns numbers', () => {
            const data = new Uint8Array([1, 2, 3, 'h'.charCodeAt(0), 'i'.charCodeAt(0), 4, 5]).buffer;
            const buffer = buffer_1.VSBuffer.wrap(new Uint8Array(data, 3, 2));
            assert.deepEqual(buffer.toString(), 'hi');
        });
        test('bufferToReadable / readableToBuffer', () => {
            const content = 'Hello World';
            const readable = buffer_1.bufferToReadable(buffer_1.VSBuffer.fromString(content));
            assert.equal(buffer_1.readableToBuffer(readable).toString(), content);
        });
        test('bufferToStream / streamToBuffer', () => __awaiter(this, void 0, void 0, function* () {
            const content = 'Hello World';
            const stream = buffer_1.bufferToStream(buffer_1.VSBuffer.fromString(content));
            assert.equal((yield buffer_1.streamToBuffer(stream)).toString(), content);
        }));
        test('bufferWriteableStream - basics (no error)', () => __awaiter(this, void 0, void 0, function* () {
            const stream = buffer_1.writeableBufferStream();
            let chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            let errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            yield async_1.timeout(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            yield async_1.timeout(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            assert.equal(chunks.length, 2);
            assert.equal(chunks[0].toString(), 'Hello');
            assert.equal(chunks[1].toString(), 'World');
            assert.equal(ended, true);
            assert.equal(errors.length, 0);
        }));
        test('bufferWriteableStream - basics (error)', () => __awaiter(this, void 0, void 0, function* () {
            const stream = buffer_1.writeableBufferStream();
            let chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            let errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            yield async_1.timeout(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            yield async_1.timeout(0);
            stream.end(new Error());
            assert.equal(chunks.length, 1);
            assert.equal(chunks[0].toString(), 'Hello');
            assert.equal(ended, true);
            assert.equal(errors.length, 1);
        }));
        test('bufferWriteableStream - buffers data when no listener', () => __awaiter(this, void 0, void 0, function* () {
            const stream = buffer_1.writeableBufferStream();
            yield async_1.timeout(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            yield async_1.timeout(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            let chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            let errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            assert.equal(chunks.length, 1);
            assert.equal(chunks[0].toString(), 'HelloWorld');
            assert.equal(ended, true);
            assert.equal(errors.length, 0);
        }));
        test('bufferWriteableStream - buffers errors when no listener', () => __awaiter(this, void 0, void 0, function* () {
            const stream = buffer_1.writeableBufferStream();
            yield async_1.timeout(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            yield async_1.timeout(0);
            stream.error(new Error());
            let chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            stream.end();
            assert.equal(chunks.length, 1);
            assert.equal(chunks[0].toString(), 'Hello');
            assert.equal(ended, true);
            assert.equal(errors.length, 1);
        }));
        test('bufferWriteableStream - buffers end when no listener', () => __awaiter(this, void 0, void 0, function* () {
            const stream = buffer_1.writeableBufferStream();
            yield async_1.timeout(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            yield async_1.timeout(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            let chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            assert.equal(chunks.length, 1);
            assert.equal(chunks[0].toString(), 'HelloWorld');
            assert.equal(ended, true);
            assert.equal(errors.length, 0);
        }));
        test('bufferWriteableStream - nothing happens after end()', () => __awaiter(this, void 0, void 0, function* () {
            const stream = buffer_1.writeableBufferStream();
            let chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            yield async_1.timeout(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            yield async_1.timeout(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            let dataCalledAfterEnd = false;
            stream.on('data', data => {
                dataCalledAfterEnd = true;
            });
            let errorCalledAfterEnd = false;
            stream.on('error', error => {
                errorCalledAfterEnd = true;
            });
            let endCalledAfterEnd = false;
            stream.on('end', () => {
                endCalledAfterEnd = true;
            });
            yield async_1.timeout(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            yield async_1.timeout(0);
            stream.error(new Error());
            yield async_1.timeout(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            assert.equal(dataCalledAfterEnd, false);
            assert.equal(errorCalledAfterEnd, false);
            assert.equal(endCalledAfterEnd, false);
            assert.equal(chunks.length, 2);
            assert.equal(chunks[0].toString(), 'Hello');
            assert.equal(chunks[1].toString(), 'World');
        }));
        test('bufferWriteableStream - pause/resume (simple)', () => __awaiter(this, void 0, void 0, function* () {
            const stream = buffer_1.writeableBufferStream();
            let chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            let errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            stream.pause();
            yield async_1.timeout(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            yield async_1.timeout(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            assert.equal(chunks.length, 0);
            assert.equal(errors.length, 0);
            assert.equal(ended, false);
            stream.resume();
            assert.equal(chunks.length, 1);
            assert.equal(chunks[0].toString(), 'HelloWorld');
            assert.equal(ended, true);
            assert.equal(errors.length, 0);
        }));
        test('bufferWriteableStream - pause/resume (pause after first write)', () => __awaiter(this, void 0, void 0, function* () {
            const stream = buffer_1.writeableBufferStream();
            let chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            let errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            yield async_1.timeout(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            stream.pause();
            yield async_1.timeout(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            assert.equal(chunks.length, 1);
            assert.equal(chunks[0].toString(), 'Hello');
            assert.equal(errors.length, 0);
            assert.equal(ended, false);
            stream.resume();
            assert.equal(chunks.length, 2);
            assert.equal(chunks[0].toString(), 'Hello');
            assert.equal(chunks[1].toString(), 'World');
            assert.equal(ended, true);
            assert.equal(errors.length, 0);
        }));
        test('bufferWriteableStream - pause/resume (error)', () => __awaiter(this, void 0, void 0, function* () {
            const stream = buffer_1.writeableBufferStream();
            let chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            let errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            stream.pause();
            yield async_1.timeout(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            yield async_1.timeout(0);
            stream.end(new Error());
            assert.equal(chunks.length, 0);
            assert.equal(ended, false);
            assert.equal(errors.length, 0);
            stream.resume();
            assert.equal(chunks.length, 1);
            assert.equal(chunks[0].toString(), 'Hello');
            assert.equal(ended, true);
            assert.equal(errors.length, 1);
        }));
        test('bufferWriteableStream - destroy', () => __awaiter(this, void 0, void 0, function* () {
            const stream = buffer_1.writeableBufferStream();
            let chunks = [];
            stream.on('data', data => {
                chunks.push(data);
            });
            let ended = false;
            stream.on('end', () => {
                ended = true;
            });
            let errors = [];
            stream.on('error', error => {
                errors.push(error);
            });
            stream.destroy();
            yield async_1.timeout(0);
            stream.write(buffer_1.VSBuffer.fromString('Hello'));
            yield async_1.timeout(0);
            stream.end(buffer_1.VSBuffer.fromString('World'));
            assert.equal(chunks.length, 0);
            assert.equal(ended, false);
            assert.equal(errors.length, 0);
        }));
        test('Performance issue with VSBuffer#slice #76076', function () {
            // Buffer#slice creates a view
            {
                const buff = Buffer.from([10, 20, 30, 40]);
                const b2 = buff.slice(1, 3);
                assert.equal(buff[1], 20);
                assert.equal(b2[0], 20);
                buff[1] = 17; // modify buff AND b2
                assert.equal(buff[1], 17);
                assert.equal(b2[0], 17);
            }
            // TypedArray#slice creates a copy
            {
                const unit = new Uint8Array([10, 20, 30, 40]);
                const u2 = unit.slice(1, 3);
                assert.equal(unit[1], 20);
                assert.equal(u2[0], 20);
                unit[1] = 17; // modify unit, NOT b2
                assert.equal(unit[1], 17);
                assert.equal(u2[0], 20);
            }
            // TypedArray#subarray creates a view
            {
                const unit = new Uint8Array([10, 20, 30, 40]);
                const u2 = unit.subarray(1, 3);
                assert.equal(unit[1], 20);
                assert.equal(u2[0], 20);
                unit[1] = 17; // modify unit AND b2
                assert.equal(unit[1], 17);
                assert.equal(u2[0], 17);
            }
        });
    });
});
//# sourceMappingURL=buffer.test.js.map