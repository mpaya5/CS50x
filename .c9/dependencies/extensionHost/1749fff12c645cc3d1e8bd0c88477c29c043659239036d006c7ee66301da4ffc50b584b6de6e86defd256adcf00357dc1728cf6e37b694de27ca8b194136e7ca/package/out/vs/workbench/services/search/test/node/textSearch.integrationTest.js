/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/path", "vs/base/common/amd", "vs/base/common/cancellation", "vs/base/common/uri", "vs/workbench/services/search/common/search", "vs/workbench/services/search/node/textSearchAdapter"], function (require, exports, assert, path, amd_1, cancellation_1, uri_1, search_1, textSearchAdapter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const TEST_FIXTURES = path.normalize(amd_1.getPathFromAmdModule(require, './fixtures'));
    const EXAMPLES_FIXTURES = path.join(TEST_FIXTURES, 'examples');
    const MORE_FIXTURES = path.join(TEST_FIXTURES, 'more');
    const TEST_ROOT_FOLDER = { folder: uri_1.URI.file(TEST_FIXTURES) };
    const ROOT_FOLDER_QUERY = [
        TEST_ROOT_FOLDER
    ];
    const MULTIROOT_QUERIES = [
        { folder: uri_1.URI.file(EXAMPLES_FIXTURES) },
        { folder: uri_1.URI.file(MORE_FIXTURES) }
    ];
    function doSearchTest(query, expectedResultCount) {
        const engine = new textSearchAdapter_1.TextSearchEngineAdapter(query);
        let c = 0;
        const results = [];
        return engine.search(new cancellation_1.CancellationTokenSource().token, _results => {
            if (_results) {
                c += _results.reduce((acc, cur) => acc + cur.numMatches, 0);
                results.push(..._results);
            }
        }, () => { }).then(() => {
            if (typeof expectedResultCount === 'function') {
                assert(expectedResultCount(c));
            }
            else {
                assert.equal(c, expectedResultCount, `rg ${c} !== ${expectedResultCount}`);
            }
            return results;
        });
    }
    suite('Search-integration', function () {
        this.timeout(1000 * 60); // increase timeout for this suite
        test('Text: GameOfLife', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'GameOfLife' },
            };
            return doSearchTest(config, 4);
        });
        test('Text: GameOfLife (RegExp)', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'Game.?fL\\w?fe', isRegExp: true }
            };
            return doSearchTest(config, 4);
        });
        test('Text: GameOfLife (PCRE2 RegExp)', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                usePCRE2: true,
                contentPattern: { pattern: 'Life(?!P)', isRegExp: true }
            };
            return doSearchTest(config, 8);
        });
        test('Text: GameOfLife (RegExp to EOL)', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'GameOfLife.*', isRegExp: true }
            };
            return doSearchTest(config, 4);
        });
        test('Text: GameOfLife (Word Match, Case Sensitive)', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'GameOfLife', isWordMatch: true, isCaseSensitive: true }
            };
            return doSearchTest(config, 4);
        });
        test('Text: GameOfLife (Word Match, Spaces)', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: ' GameOfLife ', isWordMatch: true }
            };
            return doSearchTest(config, 1);
        });
        test('Text: GameOfLife (Word Match, Punctuation and Spaces)', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: ', as =', isWordMatch: true }
            };
            return doSearchTest(config, 1);
        });
        test('Text: Helvetica (UTF 16)', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'Helvetica' }
            };
            return doSearchTest(config, 3);
        });
        test('Text: e', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'e' }
            };
            return doSearchTest(config, 788);
        });
        test('Text: e (with excludes)', () => {
            const config = {
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'e' },
                excludePattern: { '**/examples': true }
            };
            return doSearchTest(config, 394);
        });
        test('Text: e (with includes)', () => {
            const config = {
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'e' },
                includePattern: { '**/examples/**': true }
            };
            return doSearchTest(config, 394);
        });
        // TODO
        // test('Text: e (with absolute path excludes)', () => {
        // 	const config: any = {
        // 		folderQueries: ROOT_FOLDER_QUERY,
        // 		contentPattern: { pattern: 'e' },
        // 		excludePattern: makeExpression(path.join(TEST_FIXTURES, '**/examples'))
        // 	};
        // 	return doSearchTest(config, 394);
        // });
        // test('Text: e (with mixed absolute/relative path excludes)', () => {
        // 	const config: any = {
        // 		folderQueries: ROOT_FOLDER_QUERY,
        // 		contentPattern: { pattern: 'e' },
        // 		excludePattern: makeExpression(path.join(TEST_FIXTURES, '**/examples'), '*.css')
        // 	};
        // 	return doSearchTest(config, 310);
        // });
        test('Text: sibling exclude', () => {
            const config = {
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'm' },
                includePattern: makeExpression('**/site*'),
                excludePattern: { '*.css': { when: '$(basename).less' } }
            };
            return doSearchTest(config, 1);
        });
        test('Text: e (with includes and exclude)', () => {
            const config = {
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'e' },
                includePattern: { '**/examples/**': true },
                excludePattern: { '**/examples/small.js': true }
            };
            return doSearchTest(config, 371);
        });
        test('Text: a (capped)', () => {
            const maxResults = 520;
            const config = {
                type: 2 /* Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'a' },
                maxResults
            };
            return doSearchTest(config, maxResults);
        });
        test('Text: a (no results)', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'ahsogehtdas' }
            };
            return doSearchTest(config, 0);
        });
        test('Text: -size', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: '-size' }
            };
            return doSearchTest(config, 9);
        });
        test('Multiroot: Conway', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: MULTIROOT_QUERIES,
                contentPattern: { pattern: 'conway' }
            };
            return doSearchTest(config, 8);
        });
        test('Multiroot: e with partial global exclude', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: MULTIROOT_QUERIES,
                contentPattern: { pattern: 'e' },
                excludePattern: makeExpression('**/*.txt')
            };
            return doSearchTest(config, 394);
        });
        test('Multiroot: e with global excludes', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: MULTIROOT_QUERIES,
                contentPattern: { pattern: 'e' },
                excludePattern: makeExpression('**/*.txt', '**/*.js')
            };
            return doSearchTest(config, 0);
        });
        test('Multiroot: e with folder exclude', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: [
                    { folder: uri_1.URI.file(EXAMPLES_FIXTURES), excludePattern: makeExpression('**/e*.js') },
                    { folder: uri_1.URI.file(MORE_FIXTURES) }
                ],
                contentPattern: { pattern: 'e' }
            };
            return doSearchTest(config, 298);
        });
        test('Text: 语', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: '语' }
            };
            return doSearchTest(config, 1).then(results => {
                const matchRange = results[0].results[0].ranges;
                assert.deepEqual(matchRange, [{
                        startLineNumber: 0,
                        startColumn: 1,
                        endLineNumber: 0,
                        endColumn: 2
                    }]);
            });
        });
        test('Multiple matches on line: h\\d,', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'h\\d,', isRegExp: true }
            };
            return doSearchTest(config, 15).then(results => {
                assert.equal(results.length, 3);
                assert.equal(results[0].results.length, 1);
                const match = results[0].results[0];
                assert.equal(match.ranges.length, 5);
            });
        });
        test('Search with context matches', () => {
            const config = {
                type: 2 /* Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'compiler.typeCheck();' },
                beforeContext: 1,
                afterContext: 2
            };
            return doSearchTest(config, 4).then(results => {
                assert.equal(results.length, 4);
                assert.equal(results[0].results[0].lineNumber, 25);
                assert.equal(results[0].results[0].text, '        compiler.addUnit(prog,"input.ts");');
                // assert.equal((<ITextSearchMatch>results[1].results[0]).preview.text, '        compiler.typeCheck();\n'); // See https://github.com/BurntSushi/ripgrep/issues/1095
                assert.equal(results[2].results[0].lineNumber, 27);
                assert.equal(results[2].results[0].text, '        compiler.emit();');
                assert.equal(results[3].results[0].lineNumber, 28);
                assert.equal(results[3].results[0].text, '');
            });
        });
        suite('error messages', () => {
            test('invalid encoding', () => {
                const config = {
                    type: 2 /* Text */,
                    folderQueries: [
                        Object.assign({}, TEST_ROOT_FOLDER, { fileEncoding: 'invalidEncoding' })
                    ],
                    contentPattern: { pattern: 'test' },
                };
                return doSearchTest(config, 0).then(() => {
                    throw new Error('expected fail');
                }, err => {
                    const searchError = search_1.deserializeSearchError(err.message);
                    assert.equal(searchError.message, 'Unknown encoding: invalidEncoding');
                    assert.equal(searchError.code, search_1.SearchErrorCode.unknownEncoding);
                });
            });
            test('invalid regex', () => {
                const config = {
                    type: 2 /* Text */,
                    folderQueries: ROOT_FOLDER_QUERY,
                    contentPattern: { pattern: ')', isRegExp: true },
                };
                return doSearchTest(config, 0).then(() => {
                    throw new Error('expected fail');
                }, err => {
                    const searchError = search_1.deserializeSearchError(err.message);
                    assert.equal(searchError.message, 'Regex parse error');
                    assert.equal(searchError.code, search_1.SearchErrorCode.regexParseError);
                });
            });
            test('invalid glob', () => {
                const config = {
                    type: 2 /* Text */,
                    folderQueries: ROOT_FOLDER_QUERY,
                    contentPattern: { pattern: 'foo' },
                    includePattern: {
                        '{{}': true
                    }
                };
                return doSearchTest(config, 0).then(() => {
                    throw new Error('expected fail');
                }, err => {
                    const searchError = search_1.deserializeSearchError(err.message);
                    assert.equal(searchError.message, 'Error parsing glob \'/{{}\': nested alternate groups are not allowed');
                    assert.equal(searchError.code, search_1.SearchErrorCode.globParseError);
                });
            });
        });
    });
    function makeExpression(...patterns) {
        return patterns.reduce((glob, pattern) => {
            // glob.ts needs forward slashes
            pattern = pattern.replace(/\\/g, '/');
            glob[pattern] = true;
            return glob;
        }, Object.create(null));
    }
});
//# sourceMappingURL=textSearch.integrationTest.js.map