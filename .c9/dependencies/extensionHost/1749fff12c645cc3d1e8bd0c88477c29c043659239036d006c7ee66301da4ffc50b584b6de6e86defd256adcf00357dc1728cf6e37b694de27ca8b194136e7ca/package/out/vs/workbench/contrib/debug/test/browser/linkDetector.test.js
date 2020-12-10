/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/test/workbenchTestServices", "vs/workbench/contrib/debug/browser/linkDetector", "vs/base/common/platform"], function (require, exports, assert, workbenchTestServices_1, linkDetector_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Debug - Link Detector', () => {
        let linkDetector;
        /**
         * Instantiate a {@link LinkDetector} for use by the functions being tested.
         */
        setup(() => {
            const instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            linkDetector = instantiationService.createInstance(linkDetector_1.LinkDetector);
        });
        /**
         * Assert that a given Element is an anchor element with an onClick event.
         *
         * @param element The Element to verify.
         */
        function assertElementIsLink(element) {
            assert(element instanceof HTMLAnchorElement);
            assert.notEqual(null, element.onclick);
        }
        test('noLinks', () => {
            const input = 'I am a string';
            const expectedOutput = '<span>I am a string</span>';
            const output = linkDetector.handleLinks(input);
            assert.equal(0, output.children.length);
            assert.equal('SPAN', output.tagName);
            assert.equal(expectedOutput, output.outerHTML);
        });
        test('trailingNewline', () => {
            const input = 'I am a string\n';
            const expectedOutput = '<span>I am a string\n</span>';
            const output = linkDetector.handleLinks(input);
            assert.equal(0, output.children.length);
            assert.equal('SPAN', output.tagName);
            assert.equal(expectedOutput, output.outerHTML);
        });
        test('singleLineLink', () => {
            const input = platform_1.isWindows ? 'C:/foo/bar.js:12:34' : '/Users/foo/bar.js:12:34';
            const expectedOutput = /^<span><a title=".*">.*\/foo\/bar.js:12:34<\/a><\/span>$/;
            const output = linkDetector.handleLinks(input);
            assert.equal(1, output.children.length);
            assert.equal('SPAN', output.tagName);
            assert.equal('A', output.firstElementChild.tagName);
            assert(expectedOutput.test(output.outerHTML));
            assertElementIsLink(output.firstElementChild);
            assert.equal(platform_1.isWindows ? 'C:/foo/bar.js:12:34' : '/Users/foo/bar.js:12:34', output.firstElementChild.textContent);
        });
        test('relativeLink', () => {
            const input = '\./foo/bar.js';
            const expectedOutput = '<span>\./foo/bar.js</span>';
            const output = linkDetector.handleLinks(input);
            assert.equal(0, output.children.length);
            assert.equal('SPAN', output.tagName);
            assert.equal(expectedOutput, output.outerHTML);
        });
        test('singleLineLinkAndText', function () {
            const input = platform_1.isWindows ? 'The link: C:/foo/bar.js:12:34' : 'The link: /Users/foo/bar.js:12:34';
            const expectedOutput = /^<span><span>The link: <\/span><a title=".*">.*\/foo\/bar.js:12:34<\/a><\/span>$/;
            const output = linkDetector.handleLinks(input);
            assert.equal(2, output.children.length);
            assert.equal('SPAN', output.tagName);
            assert.equal('SPAN', output.children[0].tagName);
            assert.equal('A', output.children[1].tagName);
            assert(expectedOutput.test(output.outerHTML));
            assertElementIsLink(output.children[1]);
            assert.equal(platform_1.isWindows ? 'C:/foo/bar.js:12:34' : '/Users/foo/bar.js:12:34', output.children[1].textContent);
        });
        test('singleLineMultipleLinks', () => {
            const input = platform_1.isWindows ? 'Here is a link C:/foo/bar.js:12:34 and here is another D:/boo/far.js:56:78' :
                'Here is a link /Users/foo/bar.js:12:34 and here is another /Users/boo/far.js:56:78';
            const expectedOutput = /^<span><span>Here is a link <\/span><a title=".*">.*\/foo\/bar.js:12:34<\/a><span> and here is another <\/span><a title=".*">.*\/boo\/far.js:56:78<\/a><\/span>$/;
            const output = linkDetector.handleLinks(input);
            assert.equal(4, output.children.length);
            assert.equal('SPAN', output.tagName);
            assert.equal('SPAN', output.children[0].tagName);
            assert.equal('A', output.children[1].tagName);
            assert.equal('SPAN', output.children[2].tagName);
            assert.equal('A', output.children[3].tagName);
            assert(expectedOutput.test(output.outerHTML));
            assertElementIsLink(output.children[1]);
            assertElementIsLink(output.children[3]);
            assert.equal(platform_1.isWindows ? 'C:/foo/bar.js:12:34' : '/Users/foo/bar.js:12:34', output.children[1].textContent);
            assert.equal(platform_1.isWindows ? 'D:/boo/far.js:56:78' : '/Users/boo/far.js:56:78', output.children[3].textContent);
        });
        test('multilineNoLinks', () => {
            const input = 'Line one\nLine two\nLine three';
            const expectedOutput = /^<span><span>Line one\n<\/span><span>Line two\n<\/span><span>Line three<\/span><\/span>$/;
            const output = linkDetector.handleLinks(input);
            assert.equal(3, output.children.length);
            assert.equal('SPAN', output.tagName);
            assert.equal('SPAN', output.children[0].tagName);
            assert.equal('SPAN', output.children[1].tagName);
            assert.equal('SPAN', output.children[2].tagName);
            assert(expectedOutput.test(output.outerHTML));
        });
        test('multilineTrailingNewline', () => {
            const input = 'I am a string\nAnd I am another\n';
            const expectedOutput = '<span><span>I am a string\n<\/span><span>And I am another\n<\/span><\/span>';
            const output = linkDetector.handleLinks(input);
            assert.equal(2, output.children.length);
            assert.equal('SPAN', output.tagName);
            assert.equal('SPAN', output.children[0].tagName);
            assert.equal('SPAN', output.children[1].tagName);
            assert.equal(expectedOutput, output.outerHTML);
        });
        test('multilineWithLinks', () => {
            const input = platform_1.isWindows ? 'I have a link for you\nHere it is: C:/foo/bar.js:12:34\nCool, huh?' :
                'I have a link for you\nHere it is: /Users/foo/bar.js:12:34\nCool, huh?';
            const expectedOutput = /^<span><span>I have a link for you\n<\/span><span><span>Here it is: <\/span><a title=".*">.*\/foo\/bar.js:12:34<\/a><span>\n<\/span><\/span><span>Cool, huh\?<\/span><\/span>$/;
            const output = linkDetector.handleLinks(input);
            assert.equal(3, output.children.length);
            assert.equal('SPAN', output.tagName);
            assert.equal('SPAN', output.children[0].tagName);
            assert.equal('SPAN', output.children[1].tagName);
            assert.equal('SPAN', output.children[2].tagName);
            assert.equal('SPAN', output.children[1].children[0].tagName);
            assert.equal('A', output.children[1].children[1].tagName);
            assert.equal('SPAN', output.children[1].children[2].tagName);
            assert(expectedOutput.test(output.outerHTML));
            assertElementIsLink(output.children[1].children[1]);
            assert.equal(platform_1.isWindows ? 'C:/foo/bar.js:12:34' : '/Users/foo/bar.js:12:34', output.children[1].children[1].textContent);
        });
    });
});
//# sourceMappingURL=linkDetector.test.js.map