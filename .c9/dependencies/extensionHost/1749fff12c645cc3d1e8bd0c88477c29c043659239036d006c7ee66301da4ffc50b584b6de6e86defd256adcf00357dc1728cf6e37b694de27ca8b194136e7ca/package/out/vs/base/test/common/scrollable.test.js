/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/scrollable"], function (require, exports, assert, scrollable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestSmoothScrollingOperation extends scrollable_1.SmoothScrollingOperation {
        constructor(from, to, viewportSize, startTime, duration) {
            duration = duration + 10;
            startTime = startTime - 10;
            super({ scrollLeft: 0, scrollTop: from, width: 0, height: viewportSize }, { scrollLeft: 0, scrollTop: to, width: 0, height: viewportSize }, startTime, duration);
        }
        testTick(now) {
            return this._tick(now);
        }
    }
    suite('SmoothScrollingOperation', () => {
        const VIEWPORT_HEIGHT = 800;
        const ANIMATION_DURATION = 125;
        const LINE_HEIGHT = 20;
        function extractLines(scrollable, now) {
            let scrollTop = scrollable.testTick(now).scrollTop;
            let scrollBottom = scrollTop + VIEWPORT_HEIGHT;
            const startLineNumber = Math.floor(scrollTop / LINE_HEIGHT);
            const endLineNumber = Math.ceil(scrollBottom / LINE_HEIGHT);
            return [startLineNumber, endLineNumber];
        }
        function simulateSmoothScroll(from, to) {
            const scrollable = new TestSmoothScrollingOperation(from, to, VIEWPORT_HEIGHT, 0, ANIMATION_DURATION);
            let result = [], resultLen = 0;
            result[resultLen++] = extractLines(scrollable, 0);
            result[resultLen++] = extractLines(scrollable, 25);
            result[resultLen++] = extractLines(scrollable, 50);
            result[resultLen++] = extractLines(scrollable, 75);
            result[resultLen++] = extractLines(scrollable, 100);
            result[resultLen++] = extractLines(scrollable, 125);
            return result;
        }
        function assertSmoothScroll(from, to, expected) {
            const actual = simulateSmoothScroll(from, to);
            assert.deepEqual(actual, expected);
        }
        test('scroll 25 lines (40 fit)', () => {
            assertSmoothScroll(0, 500, [
                [5, 46],
                [14, 55],
                [20, 61],
                [23, 64],
                [24, 65],
                [25, 65],
            ]);
        });
        test('scroll 75 lines (40 fit)', () => {
            assertSmoothScroll(0, 1500, [
                [15, 56],
                [44, 85],
                [62, 103],
                [71, 112],
                [74, 115],
                [75, 115],
            ]);
        });
        test('scroll 100 lines (40 fit)', () => {
            assertSmoothScroll(0, 2000, [
                [20, 61],
                [59, 100],
                [82, 123],
                [94, 135],
                [99, 140],
                [100, 140],
            ]);
        });
        test('scroll 125 lines (40 fit)', () => {
            assertSmoothScroll(0, 2500, [
                [16, 57],
                [29, 70],
                [107, 148],
                [119, 160],
                [124, 165],
                [125, 165],
            ]);
        });
        test('scroll 500 lines (40 fit)', () => {
            assertSmoothScroll(0, 10000, [
                [16, 57],
                [29, 70],
                [482, 523],
                [494, 535],
                [499, 540],
                [500, 540],
            ]);
        });
    });
});
//# sourceMappingURL=scrollable.test.js.map