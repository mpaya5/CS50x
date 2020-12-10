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
define(["require", "exports", "assert", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/node/extHostSearch", "vs/workbench/api/common/extHostTypes", "vs/workbench/services/search/common/search", "vs/workbench/test/electron-browser/api/testRPCProtocol", "vs/platform/log/common/log", "vs/workbench/api/common/extHostUriTransformerService", "vs/workbench/test/electron-browser/api/mock"], function (require, exports, assert, arrays_1, cancellation_1, errors_1, lifecycle_1, resources_1, uri_1, extHost_protocol_1, extHostSearch_1, extHostTypes_1, search_1, testRPCProtocol_1, log_1, extHostUriTransformerService_1, mock_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let rpcProtocol;
    let extHostSearch;
    const disposables = new lifecycle_1.DisposableStore();
    let mockMainThreadSearch;
    class MockMainThreadSearch {
        constructor() {
            this.results = [];
        }
        $registerFileSearchProvider(handle, scheme) {
            this.lastHandle = handle;
        }
        $registerTextSearchProvider(handle, scheme) {
            this.lastHandle = handle;
        }
        $unregisterProvider(handle) {
        }
        $handleFileMatch(handle, session, data) {
            this.results.push(...data);
        }
        $handleTextMatch(handle, session, data) {
            this.results.push(...data);
        }
        $handleTelemetry(eventName, data) {
        }
        dispose() {
        }
    }
    let mockPFS;
    function extensionResultIsMatch(data) {
        return !!data.preview;
    }
    exports.extensionResultIsMatch = extensionResultIsMatch;
    suite('ExtHostSearch', () => {
        function registerTestTextSearchProvider(provider, scheme = 'file') {
            return __awaiter(this, void 0, void 0, function* () {
                disposables.add(extHostSearch.registerTextSearchProvider(scheme, provider));
                yield rpcProtocol.sync();
            });
        }
        function registerTestFileSearchProvider(provider, scheme = 'file') {
            return __awaiter(this, void 0, void 0, function* () {
                disposables.add(extHostSearch.registerFileSearchProvider(scheme, provider));
                yield rpcProtocol.sync();
            });
        }
        function runFileSearch(query, cancel = false) {
            return __awaiter(this, void 0, void 0, function* () {
                let stats;
                try {
                    const cancellation = new cancellation_1.CancellationTokenSource();
                    const p = extHostSearch.$provideFileSearchResults(mockMainThreadSearch.lastHandle, 0, query, cancellation.token);
                    if (cancel) {
                        yield new Promise(resolve => process.nextTick(resolve));
                        cancellation.cancel();
                    }
                    stats = yield p;
                }
                catch (err) {
                    if (!errors_1.isPromiseCanceledError(err)) {
                        yield rpcProtocol.sync();
                        throw err;
                    }
                }
                yield rpcProtocol.sync();
                return {
                    results: mockMainThreadSearch.results.map(r => uri_1.URI.revive(r)),
                    stats: stats
                };
            });
        }
        function runTextSearch(query, cancel = false) {
            return __awaiter(this, void 0, void 0, function* () {
                let stats;
                try {
                    const cancellation = new cancellation_1.CancellationTokenSource();
                    const p = extHostSearch.$provideTextSearchResults(mockMainThreadSearch.lastHandle, 0, query, cancellation.token);
                    if (cancel) {
                        yield new Promise(resolve => process.nextTick(resolve));
                        cancellation.cancel();
                    }
                    stats = yield p;
                }
                catch (err) {
                    if (!errors_1.isPromiseCanceledError(err)) {
                        yield rpcProtocol.sync();
                        throw err;
                    }
                }
                yield rpcProtocol.sync();
                const results = mockMainThreadSearch.results.map(r => (Object.assign({}, r, {
                    resource: uri_1.URI.revive(r.resource)
                })));
                return { results, stats: stats };
            });
        }
        setup(() => {
            rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            mockMainThreadSearch = new MockMainThreadSearch();
            const logService = new log_1.NullLogService();
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadSearch, mockMainThreadSearch);
            mockPFS = {};
            extHostSearch = new class extends extHostSearch_1.ExtHostSearch {
                constructor() {
                    super(rpcProtocol, new class extends mock_1.mock() {
                        constructor() {
                            super(...arguments);
                            this.remote = { isRemote: false, authority: undefined };
                        }
                    }, new extHostUriTransformerService_1.URITransformerService(null), logService);
                    this._pfs = mockPFS;
                }
            };
        });
        teardown(() => {
            disposables.clear();
            return rpcProtocol.sync();
        });
        const rootFolderA = uri_1.URI.file('/foo/bar1');
        const rootFolderB = uri_1.URI.file('/foo/bar2');
        const fancyScheme = 'fancy';
        const fancySchemeFolderA = uri_1.URI.from({ scheme: fancyScheme, path: '/project/folder1' });
        suite('File:', () => {
            function getSimpleQuery(filePattern = '') {
                return {
                    type: 1 /* File */,
                    filePattern,
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
            }
            function compareURIs(actual, expected) {
                const sortAndStringify = (arr) => arr.sort().map(u => u.toString());
                assert.deepEqual(sortAndStringify(actual), sortAndStringify(expected));
            }
            test('no results', () => __awaiter(this, void 0, void 0, function* () {
                yield registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return Promise.resolve(null);
                    }
                });
                const { results, stats } = yield runFileSearch(getSimpleQuery());
                assert(!stats.limitHit);
                assert(!results.length);
            }));
            test('simple results', () => __awaiter(this, void 0, void 0, function* () {
                const reportedResults = [
                    resources_1.joinPath(rootFolderA, 'file1.ts'),
                    resources_1.joinPath(rootFolderA, 'file2.ts'),
                    resources_1.joinPath(rootFolderA, 'subfolder/file3.ts')
                ];
                yield registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return Promise.resolve(reportedResults);
                    }
                });
                const { results, stats } = yield runFileSearch(getSimpleQuery());
                assert(!stats.limitHit);
                assert.equal(results.length, 3);
                compareURIs(results, reportedResults);
            }));
            test('Search canceled', () => __awaiter(this, void 0, void 0, function* () {
                let cancelRequested = false;
                yield registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return new Promise((resolve, reject) => {
                            token.onCancellationRequested(() => {
                                cancelRequested = true;
                                resolve([resources_1.joinPath(options.folder, 'file1.ts')]); // or reject or nothing?
                            });
                        });
                    }
                });
                const { results } = yield runFileSearch(getSimpleQuery(), true);
                assert(cancelRequested);
                assert(!results.length);
            }));
            test('provider returns null', () => __awaiter(this, void 0, void 0, function* () {
                yield registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return null;
                    }
                });
                try {
                    yield runFileSearch(getSimpleQuery());
                    assert(false, 'Expected to fail');
                }
                catch (_a) {
                    // Expected to throw
                }
            }));
            test('all provider calls get global include/excludes', () => __awaiter(this, void 0, void 0, function* () {
                yield registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        assert(options.excludes.length === 2 && options.includes.length === 2, 'Missing global include/excludes');
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 1 /* File */,
                    filePattern: '',
                    includePattern: {
                        'foo': true,
                        'bar': true
                    },
                    excludePattern: {
                        'something': true,
                        'else': true
                    },
                    folderQueries: [
                        { folder: rootFolderA },
                        { folder: rootFolderB }
                    ]
                };
                yield runFileSearch(query);
            }));
            test('global/local include/excludes combined', () => __awaiter(this, void 0, void 0, function* () {
                yield registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        if (options.folder.toString() === rootFolderA.toString()) {
                            assert.deepEqual(options.includes.sort(), ['*.ts', 'foo']);
                            assert.deepEqual(options.excludes.sort(), ['*.js', 'bar']);
                        }
                        else {
                            assert.deepEqual(options.includes.sort(), ['*.ts']);
                            assert.deepEqual(options.excludes.sort(), ['*.js']);
                        }
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 1 /* File */,
                    filePattern: '',
                    includePattern: {
                        '*.ts': true
                    },
                    excludePattern: {
                        '*.js': true
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            includePattern: {
                                'foo': true
                            },
                            excludePattern: {
                                'bar': true
                            }
                        },
                        { folder: rootFolderB }
                    ]
                };
                yield runFileSearch(query);
            }));
            test('include/excludes resolved correctly', () => __awaiter(this, void 0, void 0, function* () {
                yield registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        assert.deepEqual(options.includes.sort(), ['*.jsx', '*.ts']);
                        assert.deepEqual(options.excludes.sort(), []);
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 1 /* File */,
                    filePattern: '',
                    includePattern: {
                        '*.ts': true,
                        '*.jsx': false
                    },
                    excludePattern: {
                        '*.js': true,
                        '*.tsx': false
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            includePattern: {
                                '*.jsx': true
                            },
                            excludePattern: {
                                '*.js': false
                            }
                        }
                    ]
                };
                yield runFileSearch(query);
            }));
            test('basic sibling exclude clause', () => __awaiter(this, void 0, void 0, function* () {
                const reportedResults = [
                    'file1.ts',
                    'file1.js',
                ];
                yield registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return Promise.resolve(reportedResults
                            .map(relativePath => resources_1.joinPath(options.folder, relativePath)));
                    }
                });
                const query = {
                    type: 1 /* File */,
                    filePattern: '',
                    excludePattern: {
                        '*.js': {
                            when: '$(basename).ts'
                        }
                    },
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results } = yield runFileSearch(query);
                compareURIs(results, [
                    resources_1.joinPath(rootFolderA, 'file1.ts')
                ]);
            }));
            test('multiroot sibling exclude clause', () => __awaiter(this, void 0, void 0, function* () {
                yield registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        let reportedResults;
                        if (options.folder.fsPath === rootFolderA.fsPath) {
                            reportedResults = [
                                'folder/fileA.scss',
                                'folder/fileA.css',
                                'folder/file2.css'
                            ].map(relativePath => resources_1.joinPath(rootFolderA, relativePath));
                        }
                        else {
                            reportedResults = [
                                'fileB.ts',
                                'fileB.js',
                                'file3.js'
                            ].map(relativePath => resources_1.joinPath(rootFolderB, relativePath));
                        }
                        return Promise.resolve(reportedResults);
                    }
                });
                const query = {
                    type: 1 /* File */,
                    filePattern: '',
                    excludePattern: {
                        '*.js': {
                            when: '$(basename).ts'
                        },
                        '*.css': true
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            excludePattern: {
                                'folder/*.css': {
                                    when: '$(basename).scss'
                                }
                            }
                        },
                        {
                            folder: rootFolderB,
                            excludePattern: {
                                '*.js': false
                            }
                        }
                    ]
                };
                const { results } = yield runFileSearch(query);
                compareURIs(results, [
                    resources_1.joinPath(rootFolderA, 'folder/fileA.scss'),
                    resources_1.joinPath(rootFolderA, 'folder/file2.css'),
                    resources_1.joinPath(rootFolderB, 'fileB.ts'),
                    resources_1.joinPath(rootFolderB, 'fileB.js'),
                    resources_1.joinPath(rootFolderB, 'file3.js'),
                ]);
            }));
            test.skip('max results = 1', () => __awaiter(this, void 0, void 0, function* () {
                const reportedResults = [
                    resources_1.joinPath(rootFolderA, 'file1.ts'),
                    resources_1.joinPath(rootFolderA, 'file2.ts'),
                    resources_1.joinPath(rootFolderA, 'file3.ts'),
                ];
                let wasCanceled = false;
                yield registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        token.onCancellationRequested(() => wasCanceled = true);
                        return Promise.resolve(reportedResults);
                    }
                });
                const query = {
                    type: 1 /* File */,
                    filePattern: '',
                    maxResults: 1,
                    folderQueries: [
                        {
                            folder: rootFolderA
                        }
                    ]
                };
                const { results, stats } = yield runFileSearch(query);
                assert(stats.limitHit, 'Expected to return limitHit');
                assert.equal(results.length, 1);
                compareURIs(results, reportedResults.slice(0, 1));
                assert(wasCanceled, 'Expected to be canceled when hitting limit');
            }));
            test.skip('max results = 2', () => __awaiter(this, void 0, void 0, function* () {
                const reportedResults = [
                    resources_1.joinPath(rootFolderA, 'file1.ts'),
                    resources_1.joinPath(rootFolderA, 'file2.ts'),
                    resources_1.joinPath(rootFolderA, 'file3.ts'),
                ];
                let wasCanceled = false;
                yield registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        token.onCancellationRequested(() => wasCanceled = true);
                        return Promise.resolve(reportedResults);
                    }
                });
                const query = {
                    type: 1 /* File */,
                    filePattern: '',
                    maxResults: 2,
                    folderQueries: [
                        {
                            folder: rootFolderA
                        }
                    ]
                };
                const { results, stats } = yield runFileSearch(query);
                assert(stats.limitHit, 'Expected to return limitHit');
                assert.equal(results.length, 2);
                compareURIs(results, reportedResults.slice(0, 2));
                assert(wasCanceled, 'Expected to be canceled when hitting limit');
            }));
            test.skip('provider returns maxResults exactly', () => __awaiter(this, void 0, void 0, function* () {
                const reportedResults = [
                    resources_1.joinPath(rootFolderA, 'file1.ts'),
                    resources_1.joinPath(rootFolderA, 'file2.ts'),
                ];
                let wasCanceled = false;
                yield registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        token.onCancellationRequested(() => wasCanceled = true);
                        return Promise.resolve(reportedResults);
                    }
                });
                const query = {
                    type: 1 /* File */,
                    filePattern: '',
                    maxResults: 2,
                    folderQueries: [
                        {
                            folder: rootFolderA
                        }
                    ]
                };
                const { results, stats } = yield runFileSearch(query);
                assert(!stats.limitHit, 'Expected not to return limitHit');
                assert.equal(results.length, 2);
                compareURIs(results, reportedResults);
                assert(!wasCanceled, 'Expected not to be canceled when just reaching limit');
            }));
            test('multiroot max results', () => __awaiter(this, void 0, void 0, function* () {
                let cancels = 0;
                yield registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return __awaiter(this, void 0, void 0, function* () {
                            token.onCancellationRequested(() => cancels++);
                            // Provice results async so it has a chance to invoke every provider
                            yield new Promise(r => process.nextTick(r));
                            return [
                                'file1.ts',
                                'file2.ts',
                                'file3.ts',
                            ].map(relativePath => resources_1.joinPath(options.folder, relativePath));
                        });
                    }
                });
                const query = {
                    type: 1 /* File */,
                    filePattern: '',
                    maxResults: 2,
                    folderQueries: [
                        {
                            folder: rootFolderA
                        },
                        {
                            folder: rootFolderB
                        }
                    ]
                };
                const { results } = yield runFileSearch(query);
                assert.equal(results.length, 2); // Don't care which 2 we got
                assert.equal(cancels, 2, 'Expected all invocations to be canceled when hitting limit');
            }));
            test('works with non-file schemes', () => __awaiter(this, void 0, void 0, function* () {
                const reportedResults = [
                    resources_1.joinPath(fancySchemeFolderA, 'file1.ts'),
                    resources_1.joinPath(fancySchemeFolderA, 'file2.ts'),
                    resources_1.joinPath(fancySchemeFolderA, 'subfolder/file3.ts'),
                ];
                yield registerTestFileSearchProvider({
                    provideFileSearchResults(query, options, token) {
                        return Promise.resolve(reportedResults);
                    }
                }, fancyScheme);
                const query = {
                    type: 1 /* File */,
                    filePattern: '',
                    folderQueries: [
                        {
                            folder: fancySchemeFolderA
                        }
                    ]
                };
                const { results } = yield runFileSearch(query);
                compareURIs(results, reportedResults);
            }));
        });
        suite('Text:', () => {
            function makePreview(text) {
                return {
                    matches: [new extHostTypes_1.Range(0, 0, 0, text.length)],
                    text
                };
            }
            function makeTextResult(baseFolder, relativePath) {
                return {
                    preview: makePreview('foo'),
                    ranges: [new extHostTypes_1.Range(0, 0, 0, 3)],
                    uri: resources_1.joinPath(baseFolder, relativePath)
                };
            }
            function getSimpleQuery(queryText) {
                return {
                    type: 2 /* Text */,
                    contentPattern: getPattern(queryText),
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
            }
            function getPattern(queryText) {
                return {
                    pattern: queryText
                };
            }
            function assertResults(actual, expected) {
                const actualTextSearchResults = [];
                for (let fileMatch of actual) {
                    // Make relative
                    for (let lineResult of fileMatch.results) {
                        if (search_1.resultIsMatch(lineResult)) {
                            actualTextSearchResults.push({
                                preview: {
                                    text: lineResult.preview.text,
                                    matches: arrays_1.mapArrayOrNot(lineResult.preview.matches, m => new extHostTypes_1.Range(m.startLineNumber, m.startColumn, m.endLineNumber, m.endColumn))
                                },
                                ranges: arrays_1.mapArrayOrNot(lineResult.ranges, r => new extHostTypes_1.Range(r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn)),
                                uri: fileMatch.resource
                            });
                        }
                        else {
                            actualTextSearchResults.push({
                                text: lineResult.text,
                                lineNumber: lineResult.lineNumber,
                                uri: fileMatch.resource
                            });
                        }
                    }
                }
                const rangeToString = (r) => `(${r.start.line}, ${r.start.character}), (${r.end.line}, ${r.end.character})`;
                const makeComparable = (results) => results
                    .sort((a, b) => {
                    const compareKeyA = a.uri.toString() + ': ' + (extensionResultIsMatch(a) ? a.preview.text : a.text);
                    const compareKeyB = b.uri.toString() + ': ' + (extensionResultIsMatch(b) ? b.preview.text : b.text);
                    return compareKeyB.localeCompare(compareKeyA);
                })
                    .map(r => extensionResultIsMatch(r) ? {
                    uri: r.uri.toString(),
                    range: arrays_1.mapArrayOrNot(r.ranges, rangeToString),
                    preview: {
                        text: r.preview.text,
                        match: null // Don't care about this right now
                    }
                } : {
                    uri: r.uri.toString(),
                    text: r.text,
                    lineNumber: r.lineNumber
                });
                return assert.deepEqual(makeComparable(actualTextSearchResults), makeComparable(expected));
            }
            test('no results', () => __awaiter(this, void 0, void 0, function* () {
                yield registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        return Promise.resolve(null);
                    }
                });
                const { results, stats } = yield runTextSearch(getSimpleQuery('foo'));
                assert(!stats.limitHit);
                assert(!results.length);
            }));
            test('basic results', () => __awaiter(this, void 0, void 0, function* () {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.ts'),
                    makeTextResult(rootFolderA, 'file2.ts')
                ];
                yield registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const { results, stats } = yield runTextSearch(getSimpleQuery('foo'));
                assert(!stats.limitHit);
                assertResults(results, providedResults);
            }));
            test('all provider calls get global include/excludes', () => __awaiter(this, void 0, void 0, function* () {
                yield registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        assert.equal(options.includes.length, 1);
                        assert.equal(options.excludes.length, 1);
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* Text */,
                    contentPattern: getPattern('foo'),
                    includePattern: {
                        '*.ts': true
                    },
                    excludePattern: {
                        '*.js': true
                    },
                    folderQueries: [
                        { folder: rootFolderA },
                        { folder: rootFolderB }
                    ]
                };
                yield runTextSearch(query);
            }));
            test('global/local include/excludes combined', () => __awaiter(this, void 0, void 0, function* () {
                yield registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        if (options.folder.toString() === rootFolderA.toString()) {
                            assert.deepEqual(options.includes.sort(), ['*.ts', 'foo']);
                            assert.deepEqual(options.excludes.sort(), ['*.js', 'bar']);
                        }
                        else {
                            assert.deepEqual(options.includes.sort(), ['*.ts']);
                            assert.deepEqual(options.excludes.sort(), ['*.js']);
                        }
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* Text */,
                    contentPattern: getPattern('foo'),
                    includePattern: {
                        '*.ts': true
                    },
                    excludePattern: {
                        '*.js': true
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            includePattern: {
                                'foo': true
                            },
                            excludePattern: {
                                'bar': true
                            }
                        },
                        { folder: rootFolderB }
                    ]
                };
                yield runTextSearch(query);
            }));
            test('include/excludes resolved correctly', () => __awaiter(this, void 0, void 0, function* () {
                yield registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        assert.deepEqual(options.includes.sort(), ['*.jsx', '*.ts']);
                        assert.deepEqual(options.excludes.sort(), []);
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* Text */,
                    contentPattern: getPattern('foo'),
                    includePattern: {
                        '*.ts': true,
                        '*.jsx': false
                    },
                    excludePattern: {
                        '*.js': true,
                        '*.tsx': false
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            includePattern: {
                                '*.jsx': true
                            },
                            excludePattern: {
                                '*.js': false
                            }
                        }
                    ]
                };
                yield runTextSearch(query);
            }));
            test('provider fail', () => __awaiter(this, void 0, void 0, function* () {
                yield registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        throw new Error('Provider fail');
                    }
                });
                try {
                    yield runTextSearch(getSimpleQuery('foo'));
                    assert(false, 'Expected to fail');
                }
                catch (_a) {
                    // expected to fail
                }
            }));
            test('basic sibling clause', () => __awaiter(this, void 0, void 0, function* () {
                mockPFS.readdir = (_path) => {
                    if (_path === rootFolderA.fsPath) {
                        return Promise.resolve([
                            'file1.js',
                            'file1.ts'
                        ]);
                    }
                    else {
                        return Promise.reject(new Error('Wrong path'));
                    }
                };
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.js'),
                    makeTextResult(rootFolderA, 'file1.ts')
                ];
                yield registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* Text */,
                    contentPattern: getPattern('foo'),
                    excludePattern: {
                        '*.js': {
                            when: '$(basename).ts'
                        }
                    },
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results } = yield runTextSearch(query);
                assertResults(results, providedResults.slice(1));
            }));
            test('multiroot sibling clause', () => __awaiter(this, void 0, void 0, function* () {
                mockPFS.readdir = (_path) => {
                    if (_path === resources_1.joinPath(rootFolderA, 'folder').fsPath) {
                        return Promise.resolve([
                            'fileA.scss',
                            'fileA.css',
                            'file2.css'
                        ]);
                    }
                    else if (_path === rootFolderB.fsPath) {
                        return Promise.resolve([
                            'fileB.ts',
                            'fileB.js',
                            'file3.js'
                        ]);
                    }
                    else {
                        return Promise.reject(new Error('Wrong path'));
                    }
                };
                yield registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        let reportedResults;
                        if (options.folder.fsPath === rootFolderA.fsPath) {
                            reportedResults = [
                                makeTextResult(rootFolderA, 'folder/fileA.scss'),
                                makeTextResult(rootFolderA, 'folder/fileA.css'),
                                makeTextResult(rootFolderA, 'folder/file2.css')
                            ];
                        }
                        else {
                            reportedResults = [
                                makeTextResult(rootFolderB, 'fileB.ts'),
                                makeTextResult(rootFolderB, 'fileB.js'),
                                makeTextResult(rootFolderB, 'file3.js')
                            ];
                        }
                        reportedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* Text */,
                    contentPattern: getPattern('foo'),
                    excludePattern: {
                        '*.js': {
                            when: '$(basename).ts'
                        },
                        '*.css': true
                    },
                    folderQueries: [
                        {
                            folder: rootFolderA,
                            excludePattern: {
                                'folder/*.css': {
                                    when: '$(basename).scss'
                                }
                            }
                        },
                        {
                            folder: rootFolderB,
                            excludePattern: {
                                '*.js': false
                            }
                        }
                    ]
                };
                const { results } = yield runTextSearch(query);
                assertResults(results, [
                    makeTextResult(rootFolderA, 'folder/fileA.scss'),
                    makeTextResult(rootFolderA, 'folder/file2.css'),
                    makeTextResult(rootFolderB, 'fileB.ts'),
                    makeTextResult(rootFolderB, 'fileB.js'),
                    makeTextResult(rootFolderB, 'file3.js')
                ]);
            }));
            test('include pattern applied', () => __awaiter(this, void 0, void 0, function* () {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.js'),
                    makeTextResult(rootFolderA, 'file1.ts')
                ];
                yield registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* Text */,
                    contentPattern: getPattern('foo'),
                    includePattern: {
                        '*.ts': true
                    },
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results } = yield runTextSearch(query);
                assertResults(results, providedResults.slice(1));
            }));
            test('max results = 1', () => __awaiter(this, void 0, void 0, function* () {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.ts'),
                    makeTextResult(rootFolderA, 'file2.ts')
                ];
                let wasCanceled = false;
                yield registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        token.onCancellationRequested(() => wasCanceled = true);
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* Text */,
                    contentPattern: getPattern('foo'),
                    maxResults: 1,
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results, stats } = yield runTextSearch(query);
                assert(stats.limitHit, 'Expected to return limitHit');
                assertResults(results, providedResults.slice(0, 1));
                assert(wasCanceled, 'Expected to be canceled');
            }));
            test('max results = 2', () => __awaiter(this, void 0, void 0, function* () {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.ts'),
                    makeTextResult(rootFolderA, 'file2.ts'),
                    makeTextResult(rootFolderA, 'file3.ts')
                ];
                let wasCanceled = false;
                yield registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        token.onCancellationRequested(() => wasCanceled = true);
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* Text */,
                    contentPattern: getPattern('foo'),
                    maxResults: 2,
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results, stats } = yield runTextSearch(query);
                assert(stats.limitHit, 'Expected to return limitHit');
                assertResults(results, providedResults.slice(0, 2));
                assert(wasCanceled, 'Expected to be canceled');
            }));
            test('provider returns maxResults exactly', () => __awaiter(this, void 0, void 0, function* () {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.ts'),
                    makeTextResult(rootFolderA, 'file2.ts')
                ];
                let wasCanceled = false;
                yield registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        token.onCancellationRequested(() => wasCanceled = true);
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                });
                const query = {
                    type: 2 /* Text */,
                    contentPattern: getPattern('foo'),
                    maxResults: 2,
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results, stats } = yield runTextSearch(query);
                assert(!stats.limitHit, 'Expected not to return limitHit');
                assertResults(results, providedResults);
                assert(!wasCanceled, 'Expected not to be canceled');
            }));
            test('provider returns early with limitHit', () => __awaiter(this, void 0, void 0, function* () {
                const providedResults = [
                    makeTextResult(rootFolderA, 'file1.ts'),
                    makeTextResult(rootFolderA, 'file2.ts'),
                    makeTextResult(rootFolderA, 'file3.ts')
                ];
                yield registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve({ limitHit: true });
                    }
                });
                const query = {
                    type: 2 /* Text */,
                    contentPattern: getPattern('foo'),
                    maxResults: 1000,
                    folderQueries: [
                        { folder: rootFolderA }
                    ]
                };
                const { results, stats } = yield runTextSearch(query);
                assert(stats.limitHit, 'Expected to return limitHit');
                assertResults(results, providedResults);
            }));
            test('multiroot max results', () => __awaiter(this, void 0, void 0, function* () {
                let cancels = 0;
                yield registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        return __awaiter(this, void 0, void 0, function* () {
                            token.onCancellationRequested(() => cancels++);
                            yield new Promise(r => process.nextTick(r));
                            [
                                'file1.ts',
                                'file2.ts',
                                'file3.ts',
                            ].forEach(f => progress.report(makeTextResult(options.folder, f)));
                            return null;
                        });
                    }
                });
                const query = {
                    type: 2 /* Text */,
                    contentPattern: getPattern('foo'),
                    maxResults: 2,
                    folderQueries: [
                        { folder: rootFolderA },
                        { folder: rootFolderB }
                    ]
                };
                const { results } = yield runTextSearch(query);
                assert.equal(results.length, 2);
                assert.equal(cancels, 2);
            }));
            test('works with non-file schemes', () => __awaiter(this, void 0, void 0, function* () {
                const providedResults = [
                    makeTextResult(fancySchemeFolderA, 'file1.ts'),
                    makeTextResult(fancySchemeFolderA, 'file2.ts'),
                    makeTextResult(fancySchemeFolderA, 'file3.ts')
                ];
                yield registerTestTextSearchProvider({
                    provideTextSearchResults(query, options, progress, token) {
                        providedResults.forEach(r => progress.report(r));
                        return Promise.resolve(null);
                    }
                }, fancyScheme);
                const query = {
                    type: 2 /* Text */,
                    contentPattern: getPattern('foo'),
                    folderQueries: [
                        { folder: fancySchemeFolderA }
                    ]
                };
                const { results } = yield runTextSearch(query);
                assertResults(results, providedResults);
            }));
        });
    });
});
//# sourceMappingURL=extHostSearch.test.js.map