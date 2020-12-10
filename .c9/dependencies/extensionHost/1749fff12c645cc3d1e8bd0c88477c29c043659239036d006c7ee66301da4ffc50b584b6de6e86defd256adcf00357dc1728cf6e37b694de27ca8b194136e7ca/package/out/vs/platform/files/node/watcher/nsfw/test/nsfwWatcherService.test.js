/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/platform/files/node/watcher/nsfw/nsfwWatcherService"], function (require, exports, assert, platform, nsfwWatcherService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestNsfwWatcherService extends nsfwWatcherService_1.NsfwWatcherService {
        normalizeRoots(roots) {
            // Work with strings as paths to simplify testing
            const requests = roots.map(r => {
                return { path: r, excludes: [] };
            });
            return this._normalizeRoots(requests).map(r => r.path);
        }
    }
    suite('NSFW Watcher Service', () => {
        suite('_normalizeRoots', () => {
            test('should not impacts roots that don\'t overlap', () => {
                const service = new TestNsfwWatcherService();
                if (platform.isWindows) {
                    assert.deepEqual(service.normalizeRoots(['C:\\a']), ['C:\\a']);
                    assert.deepEqual(service.normalizeRoots(['C:\\a', 'C:\\b']), ['C:\\a', 'C:\\b']);
                    assert.deepEqual(service.normalizeRoots(['C:\\a', 'C:\\b', 'C:\\c\\d\\e']), ['C:\\a', 'C:\\b', 'C:\\c\\d\\e']);
                }
                else {
                    assert.deepEqual(service.normalizeRoots(['/a']), ['/a']);
                    assert.deepEqual(service.normalizeRoots(['/a', '/b']), ['/a', '/b']);
                    assert.deepEqual(service.normalizeRoots(['/a', '/b', '/c/d/e']), ['/a', '/b', '/c/d/e']);
                }
            });
            test('should remove sub-folders of other roots', () => {
                const service = new TestNsfwWatcherService();
                if (platform.isWindows) {
                    assert.deepEqual(service.normalizeRoots(['C:\\a', 'C:\\a\\b']), ['C:\\a']);
                    assert.deepEqual(service.normalizeRoots(['C:\\a', 'C:\\b', 'C:\\a\\b']), ['C:\\a', 'C:\\b']);
                    assert.deepEqual(service.normalizeRoots(['C:\\b\\a', 'C:\\a', 'C:\\b', 'C:\\a\\b']), ['C:\\a', 'C:\\b']);
                    assert.deepEqual(service.normalizeRoots(['C:\\a', 'C:\\a\\b', 'C:\\a\\c\\d']), ['C:\\a']);
                }
                else {
                    assert.deepEqual(service.normalizeRoots(['/a', '/a/b']), ['/a']);
                    assert.deepEqual(service.normalizeRoots(['/a', '/b', '/a/b']), ['/a', '/b']);
                    assert.deepEqual(service.normalizeRoots(['/b/a', '/a', '/b', '/a/b']), ['/a', '/b']);
                    assert.deepEqual(service.normalizeRoots(['/a', '/a/b', '/a/c/d']), ['/a']);
                }
            });
        });
    });
});
//# sourceMappingURL=nsfwWatcherService.test.js.map