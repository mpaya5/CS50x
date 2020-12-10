/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/strings", "vs/editor/common/model/textModel"], function (require, exports, assert, strings, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function testTextBufferFactory(text, eol, mightContainNonBasicASCII, mightContainRTL) {
        const textBuffer = textModel_1.createTextBufferFactory(text).create(1 /* LF */);
        assert.equal(textBuffer.mightContainNonBasicASCII(), mightContainNonBasicASCII);
        assert.equal(textBuffer.mightContainRTL(), mightContainRTL);
        assert.equal(textBuffer.getEOL(), eol);
    }
    exports.testTextBufferFactory = testTextBufferFactory;
    suite('ModelBuilder', () => {
        test('t1', () => {
            testTextBufferFactory('', '\n', false, false);
        });
        test('t2', () => {
            testTextBufferFactory('Hello world', '\n', false, false);
        });
        test('t3', () => {
            testTextBufferFactory('Hello world\nHow are you?', '\n', false, false);
        });
        test('t4', () => {
            testTextBufferFactory('Hello world\nHow are you?\nIs everything good today?\nDo you enjoy the weather?', '\n', false, false);
        });
        test('carriage return detection (1 \\r\\n 2 \\n)', () => {
            testTextBufferFactory('Hello world\r\nHow are you?\nIs everything good today?\nDo you enjoy the weather?', '\n', false, false);
        });
        test('carriage return detection (2 \\r\\n 1 \\n)', () => {
            testTextBufferFactory('Hello world\r\nHow are you?\r\nIs everything good today?\nDo you enjoy the weather?', '\r\n', false, false);
        });
        test('carriage return detection (3 \\r\\n 0 \\n)', () => {
            testTextBufferFactory('Hello world\r\nHow are you?\r\nIs everything good today?\r\nDo you enjoy the weather?', '\r\n', false, false);
        });
        test('BOM handling', () => {
            testTextBufferFactory(strings.UTF8_BOM_CHARACTER + 'Hello world!', '\n', false, false);
        });
        test('BOM handling', () => {
            testTextBufferFactory(strings.UTF8_BOM_CHARACTER + 'Hello world!', '\n', false, false);
        });
        test('RTL handling 2', () => {
            testTextBufferFactory('Hello world!זוהי עובדה מבוססת שדעתו', '\n', true, true);
        });
        test('RTL handling 3', () => {
            testTextBufferFactory('Hello world!זוהי \nעובדה מבוססת שדעתו', '\n', true, true);
        });
        test('ASCII handling 1', () => {
            testTextBufferFactory('Hello world!!\nHow do you do?', '\n', false, false);
        });
        test('ASCII handling 2', () => {
            testTextBufferFactory('Hello world!!\nHow do you do?Züricha📚📚b', '\n', true, false);
        });
    });
});
//# sourceMappingURL=linesTextBufferBuilder.test.js.map