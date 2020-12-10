/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/view/dynamicViewOverlay", "vs/css!./glyphMargin"], function (require, exports, dynamicViewOverlay_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DecorationToRender {
        constructor(startLineNumber, endLineNumber, className) {
            this.startLineNumber = +startLineNumber;
            this.endLineNumber = +endLineNumber;
            this.className = String(className);
        }
    }
    exports.DecorationToRender = DecorationToRender;
    class DedupOverlay extends dynamicViewOverlay_1.DynamicViewOverlay {
        _render(visibleStartLineNumber, visibleEndLineNumber, decorations) {
            const output = [];
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineIndex = lineNumber - visibleStartLineNumber;
                output[lineIndex] = [];
            }
            if (decorations.length === 0) {
                return output;
            }
            decorations.sort((a, b) => {
                if (a.className === b.className) {
                    if (a.startLineNumber === b.startLineNumber) {
                        return a.endLineNumber - b.endLineNumber;
                    }
                    return a.startLineNumber - b.startLineNumber;
                }
                return (a.className < b.className ? -1 : 1);
            });
            let prevClassName = null;
            let prevEndLineIndex = 0;
            for (let i = 0, len = decorations.length; i < len; i++) {
                const d = decorations[i];
                const className = d.className;
                let startLineIndex = Math.max(d.startLineNumber, visibleStartLineNumber) - visibleStartLineNumber;
                const endLineIndex = Math.min(d.endLineNumber, visibleEndLineNumber) - visibleStartLineNumber;
                if (prevClassName === className) {
                    startLineIndex = Math.max(prevEndLineIndex + 1, startLineIndex);
                    prevEndLineIndex = Math.max(prevEndLineIndex, endLineIndex);
                }
                else {
                    prevClassName = className;
                    prevEndLineIndex = endLineIndex;
                }
                for (let i = startLineIndex; i <= prevEndLineIndex; i++) {
                    output[i].push(prevClassName);
                }
            }
            return output;
        }
    }
    exports.DedupOverlay = DedupOverlay;
    class GlyphMarginOverlay extends DedupOverlay {
        constructor(context) {
            super();
            this._context = context;
            this._lineHeight = this._context.configuration.editor.lineHeight;
            this._glyphMargin = this._context.configuration.editor.viewInfo.glyphMargin;
            this._glyphMarginLeft = this._context.configuration.editor.layoutInfo.glyphMarginLeft;
            this._glyphMarginWidth = this._context.configuration.editor.layoutInfo.glyphMarginWidth;
            this._renderResult = null;
            this._context.addEventHandler(this);
        }
        dispose() {
            this._context.removeEventHandler(this);
            this._renderResult = null;
            super.dispose();
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            if (e.lineHeight) {
                this._lineHeight = this._context.configuration.editor.lineHeight;
            }
            if (e.viewInfo) {
                this._glyphMargin = this._context.configuration.editor.viewInfo.glyphMargin;
            }
            if (e.layoutInfo) {
                this._glyphMarginLeft = this._context.configuration.editor.layoutInfo.glyphMarginLeft;
                this._glyphMarginWidth = this._context.configuration.editor.layoutInfo.glyphMarginWidth;
            }
            return true;
        }
        onDecorationsChanged(e) {
            return true;
        }
        onFlushed(e) {
            return true;
        }
        onLinesChanged(e) {
            return true;
        }
        onLinesDeleted(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        onScrollChanged(e) {
            return e.scrollTopChanged;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        _getDecorations(ctx) {
            const decorations = ctx.getDecorationsInViewport();
            let r = [], rLen = 0;
            for (let i = 0, len = decorations.length; i < len; i++) {
                const d = decorations[i];
                const glyphMarginClassName = d.options.glyphMarginClassName;
                if (glyphMarginClassName) {
                    r[rLen++] = new DecorationToRender(d.range.startLineNumber, d.range.endLineNumber, glyphMarginClassName);
                }
            }
            return r;
        }
        prepareRender(ctx) {
            if (!this._glyphMargin) {
                this._renderResult = null;
                return;
            }
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            const toRender = this._render(visibleStartLineNumber, visibleEndLineNumber, this._getDecorations(ctx));
            const lineHeight = this._lineHeight.toString();
            const left = this._glyphMarginLeft.toString();
            const width = this._glyphMarginWidth.toString();
            const common = '" style="left:' + left + 'px;width:' + width + 'px' + ';height:' + lineHeight + 'px;"></div>';
            const output = [];
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineIndex = lineNumber - visibleStartLineNumber;
                const classNames = toRender[lineIndex];
                if (classNames.length === 0) {
                    output[lineIndex] = '';
                }
                else {
                    output[lineIndex] = ('<div class="cgmr '
                        + classNames.join(' ')
                        + common);
                }
            }
            this._renderResult = output;
        }
        render(startLineNumber, lineNumber) {
            if (!this._renderResult) {
                return '';
            }
            const lineIndex = lineNumber - startLineNumber;
            if (lineIndex < 0 || lineIndex >= this._renderResult.length) {
                return '';
            }
            return this._renderResult[lineIndex];
        }
    }
    exports.GlyphMarginOverlay = GlyphMarginOverlay;
});
//# sourceMappingURL=glyphMargin.js.map