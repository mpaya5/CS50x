/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/token", "vs/editor/common/model/textModel", "vs/editor/common/modes", "vs/editor/common/modes/languageConfigurationRegistry", "vs/editor/common/modes/nullMode", "vs/editor/test/common/core/viewLineToken"], function (require, exports, assert, position_1, range_1, token_1, textModel_1, modes_1, languageConfigurationRegistry_1, nullMode_1, viewLineToken_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TextModelWithTokens', () => {
        function testBrackets(contents, brackets) {
            function toRelaxedFoundBracket(a) {
                if (!a) {
                    return null;
                }
                return {
                    range: a.range.toString(),
                    open: a.open,
                    close: a.close,
                    isOpen: a.isOpen
                };
            }
            let charIsBracket = {};
            let charIsOpenBracket = {};
            let openForChar = {};
            let closeForChar = {};
            brackets.forEach((b) => {
                charIsBracket[b[0]] = true;
                charIsBracket[b[1]] = true;
                charIsOpenBracket[b[0]] = true;
                charIsOpenBracket[b[1]] = false;
                openForChar[b[0]] = b[0];
                closeForChar[b[0]] = b[1];
                openForChar[b[1]] = b[0];
                closeForChar[b[1]] = b[1];
            });
            let expectedBrackets = [];
            for (let lineIndex = 0; lineIndex < contents.length; lineIndex++) {
                let lineText = contents[lineIndex];
                for (let charIndex = 0; charIndex < lineText.length; charIndex++) {
                    let ch = lineText.charAt(charIndex);
                    if (charIsBracket[ch]) {
                        expectedBrackets.push({
                            open: openForChar[ch],
                            close: closeForChar[ch],
                            isOpen: charIsOpenBracket[ch],
                            range: new range_1.Range(lineIndex + 1, charIndex + 1, lineIndex + 1, charIndex + 2)
                        });
                    }
                }
            }
            const languageIdentifier = new modes_1.LanguageIdentifier('testMode', 1 /* PlainText */);
            let registration = languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(languageIdentifier, {
                brackets: brackets
            });
            let model = new textModel_1.TextModel(contents.join('\n'), textModel_1.TextModel.DEFAULT_CREATION_OPTIONS, languageIdentifier);
            // findPrevBracket
            {
                let expectedBracketIndex = expectedBrackets.length - 1;
                let currentExpectedBracket = expectedBracketIndex >= 0 ? expectedBrackets[expectedBracketIndex] : null;
                for (let lineNumber = contents.length; lineNumber >= 1; lineNumber--) {
                    let lineText = contents[lineNumber - 1];
                    for (let column = lineText.length + 1; column >= 1; column--) {
                        if (currentExpectedBracket) {
                            if (lineNumber === currentExpectedBracket.range.startLineNumber && column < currentExpectedBracket.range.endColumn) {
                                expectedBracketIndex--;
                                currentExpectedBracket = expectedBracketIndex >= 0 ? expectedBrackets[expectedBracketIndex] : null;
                            }
                        }
                        let actual = model.findPrevBracket({
                            lineNumber: lineNumber,
                            column: column
                        });
                        assert.deepEqual(toRelaxedFoundBracket(actual), toRelaxedFoundBracket(currentExpectedBracket), 'findPrevBracket of ' + lineNumber + ', ' + column);
                    }
                }
            }
            // findNextBracket
            {
                let expectedBracketIndex = 0;
                let currentExpectedBracket = expectedBracketIndex < expectedBrackets.length ? expectedBrackets[expectedBracketIndex] : null;
                for (let lineNumber = 1; lineNumber <= contents.length; lineNumber++) {
                    let lineText = contents[lineNumber - 1];
                    for (let column = 1; column <= lineText.length + 1; column++) {
                        if (currentExpectedBracket) {
                            if (lineNumber === currentExpectedBracket.range.startLineNumber && column > currentExpectedBracket.range.startColumn) {
                                expectedBracketIndex++;
                                currentExpectedBracket = expectedBracketIndex < expectedBrackets.length ? expectedBrackets[expectedBracketIndex] : null;
                            }
                        }
                        let actual = model.findNextBracket({
                            lineNumber: lineNumber,
                            column: column
                        });
                        assert.deepEqual(toRelaxedFoundBracket(actual), toRelaxedFoundBracket(currentExpectedBracket), 'findNextBracket of ' + lineNumber + ', ' + column);
                    }
                }
            }
            model.dispose();
            registration.dispose();
        }
        test('brackets', () => {
            testBrackets([
                'if (a == 3) { return (7 * (a + 5)); }'
            ], [
                ['{', '}'],
                ['[', ']'],
                ['(', ')']
            ]);
        });
    });
    suite('TextModelWithTokens - bracket matching', () => {
        function isNotABracket(model, lineNumber, column) {
            let match = model.matchBracket(new position_1.Position(lineNumber, column));
            assert.equal(match, null, 'is not matching brackets at ' + lineNumber + ', ' + column);
        }
        function isBracket2(model, testPosition, expected) {
            let actual = model.matchBracket(testPosition);
            assert.deepEqual(actual, expected, 'matches brackets at ' + testPosition);
        }
        const languageIdentifier = new modes_1.LanguageIdentifier('bracketMode1', 1 /* PlainText */);
        let registration;
        setup(() => {
            registration = languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(languageIdentifier, {
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')'],
                ]
            });
        });
        teardown(() => {
            registration.dispose();
        });
        test('bracket matching 1', () => {
            let text = ')]}{[(' + '\n' +
                ')]}{[(';
            let model = textModel_1.TextModel.createFromString(text, undefined, languageIdentifier);
            isNotABracket(model, 1, 1);
            isNotABracket(model, 1, 2);
            isNotABracket(model, 1, 3);
            isBracket2(model, new position_1.Position(1, 4), [new range_1.Range(1, 4, 1, 5), new range_1.Range(2, 3, 2, 4)]);
            isBracket2(model, new position_1.Position(1, 5), [new range_1.Range(1, 5, 1, 6), new range_1.Range(2, 2, 2, 3)]);
            isBracket2(model, new position_1.Position(1, 6), [new range_1.Range(1, 6, 1, 7), new range_1.Range(2, 1, 2, 2)]);
            isBracket2(model, new position_1.Position(1, 7), [new range_1.Range(1, 6, 1, 7), new range_1.Range(2, 1, 2, 2)]);
            isBracket2(model, new position_1.Position(2, 1), [new range_1.Range(2, 1, 2, 2), new range_1.Range(1, 6, 1, 7)]);
            isBracket2(model, new position_1.Position(2, 2), [new range_1.Range(2, 2, 2, 3), new range_1.Range(1, 5, 1, 6)]);
            isBracket2(model, new position_1.Position(2, 3), [new range_1.Range(2, 3, 2, 4), new range_1.Range(1, 4, 1, 5)]);
            isBracket2(model, new position_1.Position(2, 4), [new range_1.Range(2, 3, 2, 4), new range_1.Range(1, 4, 1, 5)]);
            isNotABracket(model, 2, 5);
            isNotABracket(model, 2, 6);
            isNotABracket(model, 2, 7);
            model.dispose();
        });
        test('bracket matching 2', () => {
            let text = 'var bar = {' + '\n' +
                'foo: {' + '\n' +
                '}, bar: {hallo: [{' + '\n' +
                '}, {' + '\n' +
                '}]}}';
            let model = textModel_1.TextModel.createFromString(text, undefined, languageIdentifier);
            let brackets = [
                [new position_1.Position(1, 11), new range_1.Range(1, 11, 1, 12), new range_1.Range(5, 4, 5, 5)],
                [new position_1.Position(1, 12), new range_1.Range(1, 11, 1, 12), new range_1.Range(5, 4, 5, 5)],
                [new position_1.Position(2, 6), new range_1.Range(2, 6, 2, 7), new range_1.Range(3, 1, 3, 2)],
                [new position_1.Position(2, 7), new range_1.Range(2, 6, 2, 7), new range_1.Range(3, 1, 3, 2)],
                [new position_1.Position(3, 1), new range_1.Range(3, 1, 3, 2), new range_1.Range(2, 6, 2, 7)],
                [new position_1.Position(3, 2), new range_1.Range(3, 1, 3, 2), new range_1.Range(2, 6, 2, 7)],
                [new position_1.Position(3, 9), new range_1.Range(3, 9, 3, 10), new range_1.Range(5, 3, 5, 4)],
                [new position_1.Position(3, 10), new range_1.Range(3, 9, 3, 10), new range_1.Range(5, 3, 5, 4)],
                [new position_1.Position(3, 17), new range_1.Range(3, 17, 3, 18), new range_1.Range(5, 2, 5, 3)],
                [new position_1.Position(3, 18), new range_1.Range(3, 18, 3, 19), new range_1.Range(4, 1, 4, 2)],
                [new position_1.Position(3, 19), new range_1.Range(3, 18, 3, 19), new range_1.Range(4, 1, 4, 2)],
                [new position_1.Position(4, 1), new range_1.Range(4, 1, 4, 2), new range_1.Range(3, 18, 3, 19)],
                [new position_1.Position(4, 2), new range_1.Range(4, 1, 4, 2), new range_1.Range(3, 18, 3, 19)],
                [new position_1.Position(4, 4), new range_1.Range(4, 4, 4, 5), new range_1.Range(5, 1, 5, 2)],
                [new position_1.Position(4, 5), new range_1.Range(4, 4, 4, 5), new range_1.Range(5, 1, 5, 2)],
                [new position_1.Position(5, 1), new range_1.Range(5, 1, 5, 2), new range_1.Range(4, 4, 4, 5)],
                [new position_1.Position(5, 2), new range_1.Range(5, 2, 5, 3), new range_1.Range(3, 17, 3, 18)],
                [new position_1.Position(5, 3), new range_1.Range(5, 3, 5, 4), new range_1.Range(3, 9, 3, 10)],
                [new position_1.Position(5, 4), new range_1.Range(5, 4, 5, 5), new range_1.Range(1, 11, 1, 12)],
                [new position_1.Position(5, 5), new range_1.Range(5, 4, 5, 5), new range_1.Range(1, 11, 1, 12)],
            ];
            let isABracket = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} };
            for (let i = 0, len = brackets.length; i < len; i++) {
                let [testPos, b1, b2] = brackets[i];
                isBracket2(model, testPos, [b1, b2]);
                isABracket[testPos.lineNumber][testPos.column] = true;
            }
            for (let i = 1, len = model.getLineCount(); i <= len; i++) {
                let line = model.getLineContent(i);
                for (let j = 1, lenJ = line.length + 1; j <= lenJ; j++) {
                    if (!isABracket[i].hasOwnProperty(j)) {
                        isNotABracket(model, i, j);
                    }
                }
            }
            model.dispose();
        });
    });
    suite('TextModelWithTokens regression tests', () => {
        test('Microsoft/monaco-editor#122: Unhandled Exception: TypeError: Unable to get property \'replace\' of undefined or null reference', () => {
            function assertViewLineTokens(model, lineNumber, forceTokenization, expected) {
                if (forceTokenization) {
                    model.forceTokenization(lineNumber);
                }
                let _actual = model.getLineTokens(lineNumber).inflate();
                let actual = [];
                for (let i = 0, len = _actual.getCount(); i < len; i++) {
                    actual[i] = {
                        endIndex: _actual.getEndOffset(i),
                        foreground: _actual.getForeground(i)
                    };
                }
                let decode = (token) => {
                    return {
                        endIndex: token.endIndex,
                        foreground: token.getForeground()
                    };
                };
                assert.deepEqual(actual, expected.map(decode));
            }
            let _tokenId = 10;
            const LANG_ID1 = 'indicisiveMode1';
            const LANG_ID2 = 'indicisiveMode2';
            const languageIdentifier1 = new modes_1.LanguageIdentifier(LANG_ID1, 3);
            const languageIdentifier2 = new modes_1.LanguageIdentifier(LANG_ID2, 4);
            const tokenizationSupport = {
                getInitialState: () => nullMode_1.NULL_STATE,
                tokenize: undefined,
                tokenize2: (line, state) => {
                    let myId = ++_tokenId;
                    let tokens = new Uint32Array(2);
                    tokens[0] = 0;
                    tokens[1] = (myId << 14 /* FOREGROUND_OFFSET */) >>> 0;
                    return new token_1.TokenizationResult2(tokens, state);
                }
            };
            let registration1 = modes_1.TokenizationRegistry.register(LANG_ID1, tokenizationSupport);
            let registration2 = modes_1.TokenizationRegistry.register(LANG_ID2, tokenizationSupport);
            let model = textModel_1.TextModel.createFromString('A model with\ntwo lines');
            assertViewLineTokens(model, 1, true, [createViewLineToken(12, 1)]);
            assertViewLineTokens(model, 2, true, [createViewLineToken(9, 1)]);
            model.setMode(languageIdentifier1);
            assertViewLineTokens(model, 1, true, [createViewLineToken(12, 11)]);
            assertViewLineTokens(model, 2, true, [createViewLineToken(9, 12)]);
            model.setMode(languageIdentifier2);
            assertViewLineTokens(model, 1, false, [createViewLineToken(12, 1)]);
            assertViewLineTokens(model, 2, false, [createViewLineToken(9, 1)]);
            model.dispose();
            registration1.dispose();
            registration2.dispose();
            function createViewLineToken(endIndex, foreground) {
                let metadata = ((foreground << 14 /* FOREGROUND_OFFSET */)) >>> 0;
                return new viewLineToken_1.ViewLineToken(endIndex, metadata);
            }
        });
        test('Microsoft/monaco-editor#133: Error: Cannot read property \'modeId\' of undefined', () => {
            const languageIdentifier = new modes_1.LanguageIdentifier('testMode', 1 /* PlainText */);
            let registration = languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(languageIdentifier, {
                brackets: [
                    ['module', 'end module'],
                    ['sub', 'end sub']
                ]
            });
            let model = textModel_1.TextModel.createFromString([
                'Imports System',
                'Imports System.Collections.Generic',
                '',
                'Module m1',
                '',
                '\tSub Main()',
                '\tEnd Sub',
                '',
                'End Module',
            ].join('\n'), undefined, languageIdentifier);
            let actual = model.matchBracket(new position_1.Position(4, 1));
            assert.deepEqual(actual, [new range_1.Range(4, 1, 4, 7), new range_1.Range(9, 1, 9, 11)]);
            model.dispose();
            registration.dispose();
        });
        test('issue #11856: Bracket matching does not work as expected if the opening brace symbol is contained in the closing brace symbol', () => {
            const languageIdentifier = new modes_1.LanguageIdentifier('testMode', 1 /* PlainText */);
            let registration = languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(languageIdentifier, {
                brackets: [
                    ['sequence', 'endsequence'],
                    ['feature', 'endfeature']
                ]
            });
            let model = textModel_1.TextModel.createFromString([
                'sequence "outer"',
                '     sequence "inner"',
                '     endsequence',
                'endsequence',
            ].join('\n'), undefined, languageIdentifier);
            let actual = model.matchBracket(new position_1.Position(3, 9));
            assert.deepEqual(actual, [new range_1.Range(3, 6, 3, 17), new range_1.Range(2, 6, 2, 14)]);
            model.dispose();
            registration.dispose();
        });
        test('issue #63822: Wrong embedded language detected for empty lines', () => {
            const outerMode = new modes_1.LanguageIdentifier('outerMode', 3);
            const innerMode = new modes_1.LanguageIdentifier('innerMode', 4);
            const tokenizationSupport = {
                getInitialState: () => nullMode_1.NULL_STATE,
                tokenize: undefined,
                tokenize2: (line, state) => {
                    let tokens = new Uint32Array(2);
                    tokens[0] = 0;
                    tokens[1] = (innerMode.id << 0 /* LANGUAGEID_OFFSET */) >>> 0;
                    return new token_1.TokenizationResult2(tokens, state);
                }
            };
            let registration = modes_1.TokenizationRegistry.register(outerMode.language, tokenizationSupport);
            let model = textModel_1.TextModel.createFromString('A model with one line', undefined, outerMode);
            model.forceTokenization(1);
            assert.equal(model.getLanguageIdAtPosition(1, 1), innerMode.id);
            model.dispose();
            registration.dispose();
        });
    });
    suite('TextModel.getLineIndentGuide', () => {
        function assertIndentGuides(lines) {
            let text = lines.map(l => l[1]).join('\n');
            let model = textModel_1.TextModel.createFromString(text);
            let actualIndents = model.getLinesIndentGuides(1, model.getLineCount());
            let actual = [];
            for (let line = 1; line <= model.getLineCount(); line++) {
                actual[line - 1] = [actualIndents[line - 1], model.getLineContent(line)];
            }
            assert.deepEqual(actual, lines);
            // Also test getActiveIndentGuide
            for (let lineNumber = 1; lineNumber <= model.getLineCount(); lineNumber++) {
                let startLineNumber = lineNumber;
                let endLineNumber = lineNumber;
                let indent = actualIndents[lineNumber - 1];
                if (indent !== 0) {
                    for (let i = lineNumber - 1; i >= 1; i--) {
                        const currIndent = actualIndents[i - 1];
                        if (currIndent >= indent) {
                            startLineNumber = i;
                        }
                        else {
                            break;
                        }
                    }
                    for (let i = lineNumber + 1; i <= model.getLineCount(); i++) {
                        const currIndent = actualIndents[i - 1];
                        if (currIndent >= indent) {
                            endLineNumber = i;
                        }
                        else {
                            break;
                        }
                    }
                }
                const expected = { startLineNumber, endLineNumber, indent };
                const actual = model.getActiveIndentGuide(lineNumber, 1, model.getLineCount());
                assert.deepEqual(actual, expected, `line number ${lineNumber}`);
            }
            model.dispose();
        }
        test('getLineIndentGuide one level', () => {
            assertIndentGuides([
                [0, 'A'],
                [1, '  A'],
                [1, '  A'],
                [1, '  A'],
            ]);
        });
        test('getLineIndentGuide two levels', () => {
            assertIndentGuides([
                [0, 'A'],
                [1, '  A'],
                [1, '  A'],
                [1, '    A'],
                [1, '    A'],
            ]);
        });
        test('getLineIndentGuide three levels', () => {
            assertIndentGuides([
                [0, 'A'],
                [1, '  A'],
                [1, '    A'],
                [2, '      A'],
                [0, 'A'],
            ]);
        });
        test('getLineIndentGuide decreasing indent', () => {
            assertIndentGuides([
                [1, '    A'],
                [1, '  A'],
                [0, 'A'],
            ]);
        });
        test('getLineIndentGuide Java', () => {
            assertIndentGuides([
                /* 1*/ [0, 'class A {'],
                /* 2*/ [1, '  void foo() {'],
                /* 3*/ [1, '    console.log(1);'],
                /* 4*/ [1, '    console.log(2);'],
                /* 5*/ [1, '  }'],
                /* 6*/ [1, ''],
                /* 7*/ [1, '  void bar() {'],
                /* 8*/ [1, '    console.log(3);'],
                /* 9*/ [1, '  }'],
                /*10*/ [0, '}'],
                /*11*/ [0, 'interface B {'],
                /*12*/ [1, '  void bar();'],
                /*13*/ [0, '}'],
            ]);
        });
        test('getLineIndentGuide Javadoc', () => {
            assertIndentGuides([
                [0, '/**'],
                [1, ' * Comment'],
                [1, ' */'],
                [0, 'class A {'],
                [1, '  void foo() {'],
                [1, '  }'],
                [0, '}'],
            ]);
        });
        test('getLineIndentGuide Whitespace', () => {
            assertIndentGuides([
                [0, 'class A {'],
                [1, ''],
                [1, '  void foo() {'],
                [1, '     '],
                [2, '     return 1;'],
                [1, '  }'],
                [1, '      '],
                [0, '}'],
            ]);
        });
        test('getLineIndentGuide Tabs', () => {
            assertIndentGuides([
                [0, 'class A {'],
                [1, '\t\t'],
                [1, '\tvoid foo() {'],
                [2, '\t \t//hello'],
                [2, '\t    return 2;'],
                [1, '  \t}'],
                [1, '      '],
                [0, '}'],
            ]);
        });
        test('getLineIndentGuide checker.ts', () => {
            assertIndentGuides([
                /* 1*/ [0, '/// <reference path="binder.ts"/>'],
                /* 2*/ [0, ''],
                /* 3*/ [0, '/* @internal */'],
                /* 4*/ [0, 'namespace ts {'],
                /* 5*/ [1, '    let nextSymbolId = 1;'],
                /* 6*/ [1, '    let nextNodeId = 1;'],
                /* 7*/ [1, '    let nextMergeId = 1;'],
                /* 8*/ [1, '    let nextFlowId = 1;'],
                /* 9*/ [1, ''],
                /*10*/ [1, '    export function getNodeId(node: Node): number {'],
                /*11*/ [2, '        if (!node.id) {'],
                /*12*/ [3, '            node.id = nextNodeId;'],
                /*13*/ [3, '            nextNodeId++;'],
                /*14*/ [2, '        }'],
                /*15*/ [2, '        return node.id;'],
                /*16*/ [1, '    }'],
                /*17*/ [0, '}'],
            ]);
        });
        test('issue #8425 - Missing indentation lines for first level indentation', () => {
            assertIndentGuides([
                [1, '\tindent1'],
                [2, '\t\tindent2'],
                [2, '\t\tindent2'],
                [1, '\tindent1'],
            ]);
        });
        test('issue #8952 - Indentation guide lines going through text on .yml file', () => {
            assertIndentGuides([
                [0, 'properties:'],
                [1, '    emailAddress:'],
                [2, '        - bla'],
                [2, '        - length:'],
                [3, '            max: 255'],
                [0, 'getters:'],
            ]);
        });
        test('issue #11892 - Indent guides look funny', () => {
            assertIndentGuides([
                [0, 'function test(base) {'],
                [1, '\tswitch (base) {'],
                [2, '\t\tcase 1:'],
                [3, '\t\t\treturn 1;'],
                [2, '\t\tcase 2:'],
                [3, '\t\t\treturn 2;'],
                [1, '\t}'],
                [0, '}'],
            ]);
        });
        test('issue #12398 - Problem in indent guidelines', () => {
            assertIndentGuides([
                [2, '\t\t.bla'],
                [3, '\t\t\tlabel(for)'],
                [0, 'include script'],
            ]);
        });
        test('issue #49173', () => {
            let model = textModel_1.TextModel.createFromString([
                'class A {',
                '	public m1(): void {',
                '	}',
                '	public m2(): void {',
                '	}',
                '	public m3(): void {',
                '	}',
                '	public m4(): void {',
                '	}',
                '	public m5(): void {',
                '	}',
                '}',
            ].join('\n'));
            const actual = model.getActiveIndentGuide(2, 4, 9);
            assert.deepEqual(actual, { startLineNumber: 2, endLineNumber: 9, indent: 1 });
            model.dispose();
        });
    });
});
//# sourceMappingURL=textModelWithTokens.test.js.map