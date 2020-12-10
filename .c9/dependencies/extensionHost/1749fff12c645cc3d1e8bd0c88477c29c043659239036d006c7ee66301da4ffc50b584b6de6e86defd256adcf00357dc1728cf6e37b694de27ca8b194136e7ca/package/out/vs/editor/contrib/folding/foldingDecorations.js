/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/model/textModel"], function (require, exports, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FoldingDecorationProvider {
        constructor(editor) {
            this.editor = editor;
            this.autoHideFoldingControls = true;
        }
        getDecorationOption(isCollapsed) {
            if (isCollapsed) {
                return FoldingDecorationProvider.COLLAPSED_VISUAL_DECORATION;
            }
            else if (this.autoHideFoldingControls) {
                return FoldingDecorationProvider.EXPANDED_AUTO_HIDE_VISUAL_DECORATION;
            }
            else {
                return FoldingDecorationProvider.EXPANDED_VISUAL_DECORATION;
            }
        }
        deltaDecorations(oldDecorations, newDecorations) {
            return this.editor.deltaDecorations(oldDecorations, newDecorations);
        }
        changeDecorations(callback) {
            return this.editor.changeDecorations(callback);
        }
    }
    FoldingDecorationProvider.COLLAPSED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        afterContentClassName: 'inline-folded',
        linesDecorationsClassName: 'folding collapsed'
    });
    FoldingDecorationProvider.EXPANDED_AUTO_HIDE_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        linesDecorationsClassName: 'folding'
    });
    FoldingDecorationProvider.EXPANDED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        linesDecorationsClassName: 'folding alwaysShowFoldIcons'
    });
    exports.FoldingDecorationProvider = FoldingDecorationProvider;
});
//# sourceMappingURL=foldingDecorations.js.map