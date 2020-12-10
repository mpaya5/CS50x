/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/common/strings", "vs/editor/browser/config/configuration", "vs/editor/common/config/editorOptions", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, dom, fastDomNode_1, strings, configuration_1, editorOptions_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ViewCursorRenderData {
        constructor(top, left, width, height, textContent, textContentClassName) {
            this.top = top;
            this.left = left;
            this.width = width;
            this.height = height;
            this.textContent = textContent;
            this.textContentClassName = textContentClassName;
        }
    }
    class ViewCursor {
        constructor(context) {
            this._context = context;
            this._cursorStyle = this._context.configuration.editor.viewInfo.cursorStyle;
            this._lineHeight = this._context.configuration.editor.lineHeight;
            this._typicalHalfwidthCharacterWidth = this._context.configuration.editor.fontInfo.typicalHalfwidthCharacterWidth;
            this._lineCursorWidth = Math.min(this._context.configuration.editor.viewInfo.cursorWidth, this._typicalHalfwidthCharacterWidth);
            this._isVisible = true;
            // Create the dom node
            this._domNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._domNode.setClassName('cursor');
            this._domNode.setHeight(this._lineHeight);
            this._domNode.setTop(0);
            this._domNode.setLeft(0);
            configuration_1.Configuration.applyFontInfo(this._domNode, this._context.configuration.editor.fontInfo);
            this._domNode.setDisplay('none');
            this._position = new position_1.Position(1, 1);
            this._lastRenderedContent = '';
            this._renderData = null;
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return this._position;
        }
        show() {
            if (!this._isVisible) {
                this._domNode.setVisibility('inherit');
                this._isVisible = true;
            }
        }
        hide() {
            if (this._isVisible) {
                this._domNode.setVisibility('hidden');
                this._isVisible = false;
            }
        }
        onConfigurationChanged(e) {
            if (e.lineHeight) {
                this._lineHeight = this._context.configuration.editor.lineHeight;
            }
            if (e.fontInfo) {
                configuration_1.Configuration.applyFontInfo(this._domNode, this._context.configuration.editor.fontInfo);
                this._typicalHalfwidthCharacterWidth = this._context.configuration.editor.fontInfo.typicalHalfwidthCharacterWidth;
            }
            if (e.viewInfo) {
                this._cursorStyle = this._context.configuration.editor.viewInfo.cursorStyle;
                this._lineCursorWidth = Math.min(this._context.configuration.editor.viewInfo.cursorWidth, this._typicalHalfwidthCharacterWidth);
            }
            return true;
        }
        onCursorPositionChanged(position) {
            this._position = position;
            return true;
        }
        _prepareRender(ctx) {
            let textContent = '';
            let textContentClassName = '';
            if (this._cursorStyle === editorOptions_1.TextEditorCursorStyle.Line || this._cursorStyle === editorOptions_1.TextEditorCursorStyle.LineThin) {
                const visibleRange = ctx.visibleRangeForPosition(this._position);
                if (!visibleRange) {
                    // Outside viewport
                    return null;
                }
                let width;
                if (this._cursorStyle === editorOptions_1.TextEditorCursorStyle.Line) {
                    width = dom.computeScreenAwareSize(this._lineCursorWidth > 0 ? this._lineCursorWidth : 2);
                    if (width > 2) {
                        const lineContent = this._context.model.getLineContent(this._position.lineNumber);
                        textContent = lineContent.charAt(this._position.column - 1);
                    }
                }
                else {
                    width = dom.computeScreenAwareSize(1);
                }
                let left = visibleRange.left;
                if (width >= 2 && left >= 1) {
                    // try to center cursor
                    left -= 1;
                }
                const top = ctx.getVerticalOffsetForLineNumber(this._position.lineNumber) - ctx.bigNumbersDelta;
                return new ViewCursorRenderData(top, left, width, this._lineHeight, textContent, textContentClassName);
            }
            const visibleRangeForCharacter = ctx.linesVisibleRangesForRange(new range_1.Range(this._position.lineNumber, this._position.column, this._position.lineNumber, this._position.column + 1), false);
            if (!visibleRangeForCharacter || visibleRangeForCharacter.length === 0 || visibleRangeForCharacter[0].ranges.length === 0) {
                // Outside viewport
                return null;
            }
            const range = visibleRangeForCharacter[0].ranges[0];
            const width = range.width < 1 ? this._typicalHalfwidthCharacterWidth : range.width;
            if (this._cursorStyle === editorOptions_1.TextEditorCursorStyle.Block) {
                const lineData = this._context.model.getViewLineData(this._position.lineNumber);
                textContent = lineData.content.charAt(this._position.column - 1);
                if (strings.isHighSurrogate(lineData.content.charCodeAt(this._position.column - 1))) {
                    textContent += lineData.content.charAt(this._position.column);
                }
                const tokenIndex = lineData.tokens.findTokenIndexAtOffset(this._position.column - 1);
                textContentClassName = lineData.tokens.getClassName(tokenIndex);
            }
            let top = ctx.getVerticalOffsetForLineNumber(this._position.lineNumber) - ctx.bigNumbersDelta;
            let height = this._lineHeight;
            // Underline might interfere with clicking
            if (this._cursorStyle === editorOptions_1.TextEditorCursorStyle.Underline || this._cursorStyle === editorOptions_1.TextEditorCursorStyle.UnderlineThin) {
                top += this._lineHeight - 2;
                height = 2;
            }
            return new ViewCursorRenderData(top, range.left, width, height, textContent, textContentClassName);
        }
        prepareRender(ctx) {
            this._renderData = this._prepareRender(ctx);
        }
        render(ctx) {
            if (!this._renderData) {
                this._domNode.setDisplay('none');
                return null;
            }
            if (this._lastRenderedContent !== this._renderData.textContent) {
                this._lastRenderedContent = this._renderData.textContent;
                this._domNode.domNode.textContent = this._lastRenderedContent;
            }
            this._domNode.setClassName('cursor ' + this._renderData.textContentClassName);
            this._domNode.setDisplay('block');
            this._domNode.setTop(this._renderData.top);
            this._domNode.setLeft(this._renderData.left);
            this._domNode.setWidth(this._renderData.width);
            this._domNode.setLineHeight(this._renderData.height);
            this._domNode.setHeight(this._renderData.height);
            return {
                domNode: this._domNode.domNode,
                position: this._position,
                contentLeft: this._renderData.left,
                height: this._renderData.height,
                width: 2
            };
        }
    }
    exports.ViewCursor = ViewCursor;
});
//# sourceMappingURL=viewCursor.js.map