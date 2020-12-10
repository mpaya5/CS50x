var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "assert", "vs/editor/common/model/textModel", "vs/editor/contrib/folding/syntaxRangeProvider", "vs/base/common/cancellation"], function (require, exports, assert, textModel_1, syntaxRangeProvider_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestFoldingRangeProvider {
        constructor(model, ranges) {
            this.model = model;
            this.ranges = ranges;
        }
        provideFoldingRanges(model, context, token) {
            if (model === this.model) {
                return this.ranges;
            }
            return null;
        }
    }
    suite('Syntax folding', () => {
        function r(start, end) {
            return { start, end };
        }
        test('Limit by nesting level', () => __awaiter(this, void 0, void 0, function* () {
            let lines = [
                /* 1*/ '{',
                /* 2*/ '  A',
                /* 3*/ '  {',
                /* 4*/ '    {',
                /* 5*/ '      B',
                /* 6*/ '    }',
                /* 7*/ '    {',
                /* 8*/ '      A',
                /* 9*/ '      {',
                /* 10*/ '         A',
                /* 11*/ '      }',
                /* 12*/ '      {',
                /* 13*/ '        {',
                /* 14*/ '          {',
                /* 15*/ '             A',
                /* 16*/ '          }',
                /* 17*/ '        }',
                /* 18*/ '      }',
                /* 19*/ '    }',
                /* 20*/ '  }',
                /* 21*/ '}',
                /* 22*/ '{',
                /* 23*/ '  A',
                /* 24*/ '}',
            ];
            let r1 = r(1, 20); //0
            let r2 = r(3, 19); //1
            let r3 = r(4, 5); //2
            let r4 = r(7, 18); //2
            let r5 = r(9, 10); //3
            let r6 = r(12, 17); //4
            let r7 = r(13, 16); //5
            let r8 = r(14, 15); //6
            let r9 = r(22, 23); //0
            let model = textModel_1.TextModel.createFromString(lines.join('\n'));
            let ranges = [r1, r2, r3, r4, r5, r6, r7, r8, r9];
            let providers = [new TestFoldingRangeProvider(model, ranges)];
            function assertLimit(maxEntries, expectedRanges, message) {
                return __awaiter(this, void 0, void 0, function* () {
                    let indentRanges = yield new syntaxRangeProvider_1.SyntaxRangeProvider(model, providers, maxEntries).compute(cancellation_1.CancellationToken.None);
                    let actual = [];
                    if (indentRanges) {
                        for (let i = 0; i < indentRanges.length; i++) {
                            actual.push({ start: indentRanges.getStartLineNumber(i), end: indentRanges.getEndLineNumber(i) });
                        }
                    }
                    assert.deepEqual(actual, expectedRanges, message);
                });
            }
            yield assertLimit(1000, [r1, r2, r3, r4, r5, r6, r7, r8, r9], '1000');
            yield assertLimit(9, [r1, r2, r3, r4, r5, r6, r7, r8, r9], '9');
            yield assertLimit(8, [r1, r2, r3, r4, r5, r6, r7, r9], '8');
            yield assertLimit(7, [r1, r2, r3, r4, r5, r6, r9], '7');
            yield assertLimit(6, [r1, r2, r3, r4, r5, r9], '6');
            yield assertLimit(5, [r1, r2, r3, r4, r9], '5');
            yield assertLimit(4, [r1, r2, r3, r9], '4');
            yield assertLimit(3, [r1, r2, r9], '3');
            yield assertLimit(2, [r1, r9], '2');
            yield assertLimit(1, [r1], '1');
            yield assertLimit(0, [], '0');
        }));
    });
});
//# sourceMappingURL=syntaxFold.test.js.map