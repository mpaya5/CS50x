/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/core/range", "vs/editor/contrib/smartSelect/bracketSelections"], function (require, exports, arrays_1, range_1, bracketSelections_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WordDistance {
        static create(service, editor) {
            if (!editor.getConfiguration().contribInfo.suggest.localityBonus) {
                return Promise.resolve(WordDistance.None);
            }
            if (!editor.hasModel()) {
                return Promise.resolve(WordDistance.None);
            }
            const model = editor.getModel();
            const position = editor.getPosition();
            if (!service.canComputeWordRanges(model.uri)) {
                return Promise.resolve(WordDistance.None);
            }
            return new bracketSelections_1.BracketSelectionRangeProvider().provideSelectionRanges(model, [position]).then(ranges => {
                if (!ranges || ranges.length === 0 || ranges[0].length === 0) {
                    return WordDistance.None;
                }
                return service.computeWordRanges(model.uri, ranges[0][0].range).then(wordRanges => {
                    return new class extends WordDistance {
                        distance(anchor, suggestion) {
                            if (!wordRanges || !position.equals(editor.getPosition())) {
                                return 0;
                            }
                            if (suggestion.kind === 17 /* Keyword */) {
                                return 2 << 20;
                            }
                            let word = suggestion.label;
                            let wordLines = wordRanges[word];
                            if (arrays_1.isFalsyOrEmpty(wordLines)) {
                                return 2 << 20;
                            }
                            let idx = arrays_1.binarySearch(wordLines, range_1.Range.fromPositions(anchor), range_1.Range.compareRangesUsingStarts);
                            let bestWordRange = idx >= 0 ? wordLines[idx] : wordLines[Math.max(0, ~idx - 1)];
                            let blockDistance = ranges.length;
                            for (const range of ranges[0]) {
                                if (!range_1.Range.containsRange(range.range, bestWordRange)) {
                                    break;
                                }
                                blockDistance -= 1;
                            }
                            return blockDistance;
                        }
                    };
                });
            });
        }
    }
    WordDistance.None = new class extends WordDistance {
        distance() { return 0; }
    };
    exports.WordDistance = WordDistance;
});
//# sourceMappingURL=wordDistance.js.map