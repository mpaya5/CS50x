/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/fastDomNode", "vs/base/common/platform", "vs/editor/browser/viewParts/lines/rangeUtil", "vs/editor/common/view/renderingContext", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/common/viewLayout/viewLineRenderer", "vs/platform/theme/common/themeService"], function (require, exports, browser, fastDomNode_1, platform, rangeUtil_1, renderingContext_1, lineDecorations_1, viewLineRenderer_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const canUseFastRenderedViewLine = (function () {
        if (platform.isNative) {
            // In VSCode we know very well when the zoom level changes
            return true;
        }
        if (platform.isLinux || browser.isFirefox || browser.isSafari) {
            // On Linux, it appears that zooming affects char widths (in pixels), which is unexpected.
            // --
            // Even though we read character widths correctly, having read them at a specific zoom level
            // does not mean they are the same at the current zoom level.
            // --
            // This could be improved if we ever figure out how to get an event when browsers zoom,
            // but until then we have to stick with reading client rects.
            // --
            // The same has been observed with Firefox on Windows7
            // --
            // The same has been oversved with Safari
            return false;
        }
        return true;
    })();
    const alwaysRenderInlineSelection = (browser.isEdgeOrIE);
    class DomReadingContext {
        get clientRectDeltaLeft() {
            if (!this._clientRectDeltaLeftRead) {
                this._clientRectDeltaLeftRead = true;
                this._clientRectDeltaLeft = this._domNode.getBoundingClientRect().left;
            }
            return this._clientRectDeltaLeft;
        }
        constructor(domNode, endNode) {
            this._domNode = domNode;
            this._clientRectDeltaLeft = 0;
            this._clientRectDeltaLeftRead = false;
            this.endNode = endNode;
        }
    }
    exports.DomReadingContext = DomReadingContext;
    class ViewLineOptions {
        constructor(config, themeType) {
            this.themeType = themeType;
            this.renderWhitespace = config.editor.viewInfo.renderWhitespace;
            this.renderControlCharacters = config.editor.viewInfo.renderControlCharacters;
            this.spaceWidth = config.editor.fontInfo.spaceWidth;
            this.useMonospaceOptimizations = (config.editor.fontInfo.isMonospace
                && !config.editor.viewInfo.disableMonospaceOptimizations);
            this.canUseHalfwidthRightwardsArrow = config.editor.fontInfo.canUseHalfwidthRightwardsArrow;
            this.lineHeight = config.editor.lineHeight;
            this.stopRenderingLineAfter = config.editor.viewInfo.stopRenderingLineAfter;
            this.fontLigatures = config.editor.viewInfo.fontLigatures;
        }
        equals(other) {
            return (this.themeType === other.themeType
                && this.renderWhitespace === other.renderWhitespace
                && this.renderControlCharacters === other.renderControlCharacters
                && this.spaceWidth === other.spaceWidth
                && this.useMonospaceOptimizations === other.useMonospaceOptimizations
                && this.canUseHalfwidthRightwardsArrow === other.canUseHalfwidthRightwardsArrow
                && this.lineHeight === other.lineHeight
                && this.stopRenderingLineAfter === other.stopRenderingLineAfter
                && this.fontLigatures === other.fontLigatures);
        }
    }
    exports.ViewLineOptions = ViewLineOptions;
    class ViewLine {
        constructor(options) {
            this._options = options;
            this._isMaybeInvalid = true;
            this._renderedViewLine = null;
        }
        // --- begin IVisibleLineData
        getDomNode() {
            if (this._renderedViewLine && this._renderedViewLine.domNode) {
                return this._renderedViewLine.domNode.domNode;
            }
            return null;
        }
        setDomNode(domNode) {
            if (this._renderedViewLine) {
                this._renderedViewLine.domNode = fastDomNode_1.createFastDomNode(domNode);
            }
            else {
                throw new Error('I have no rendered view line to set the dom node to...');
            }
        }
        onContentChanged() {
            this._isMaybeInvalid = true;
        }
        onTokensChanged() {
            this._isMaybeInvalid = true;
        }
        onDecorationsChanged() {
            this._isMaybeInvalid = true;
        }
        onOptionsChanged(newOptions) {
            this._isMaybeInvalid = true;
            this._options = newOptions;
        }
        onSelectionChanged() {
            if (alwaysRenderInlineSelection || this._options.themeType === themeService_1.HIGH_CONTRAST || this._options.renderWhitespace === 'selection') {
                this._isMaybeInvalid = true;
                return true;
            }
            return false;
        }
        renderLine(lineNumber, deltaTop, viewportData, sb) {
            if (this._isMaybeInvalid === false) {
                // it appears that nothing relevant has changed
                return false;
            }
            this._isMaybeInvalid = false;
            const lineData = viewportData.getViewLineRenderingData(lineNumber);
            const options = this._options;
            const actualInlineDecorations = lineDecorations_1.LineDecoration.filter(lineData.inlineDecorations, lineNumber, lineData.minColumn, lineData.maxColumn);
            // Only send selection information when needed for rendering whitespace
            let selectionsOnLine = null;
            if (alwaysRenderInlineSelection || options.themeType === themeService_1.HIGH_CONTRAST || this._options.renderWhitespace === 'selection') {
                const selections = viewportData.selections;
                for (const selection of selections) {
                    if (selection.endLineNumber < lineNumber || selection.startLineNumber > lineNumber) {
                        // Selection does not intersect line
                        continue;
                    }
                    const startColumn = (selection.startLineNumber === lineNumber ? selection.startColumn : lineData.minColumn);
                    const endColumn = (selection.endLineNumber === lineNumber ? selection.endColumn : lineData.maxColumn);
                    if (startColumn < endColumn) {
                        if (this._options.renderWhitespace !== 'selection') {
                            actualInlineDecorations.push(new lineDecorations_1.LineDecoration(startColumn, endColumn, 'inline-selected-text', 0 /* Regular */));
                        }
                        else {
                            if (!selectionsOnLine) {
                                selectionsOnLine = [];
                            }
                            selectionsOnLine.push(new viewLineRenderer_1.LineRange(startColumn - 1, endColumn - 1));
                        }
                    }
                }
            }
            const renderLineInput = new viewLineRenderer_1.RenderLineInput(options.useMonospaceOptimizations, options.canUseHalfwidthRightwardsArrow, lineData.content, lineData.continuesWithWrappedLine, lineData.isBasicASCII, lineData.containsRTL, lineData.minColumn - 1, lineData.tokens, actualInlineDecorations, lineData.tabSize, options.spaceWidth, options.stopRenderingLineAfter, options.renderWhitespace, options.renderControlCharacters, options.fontLigatures, selectionsOnLine);
            if (this._renderedViewLine && this._renderedViewLine.input.equals(renderLineInput)) {
                // no need to do anything, we have the same render input
                return false;
            }
            sb.appendASCIIString('<div style="top:');
            sb.appendASCIIString(String(deltaTop));
            sb.appendASCIIString('px;height:');
            sb.appendASCIIString(String(this._options.lineHeight));
            sb.appendASCIIString('px;" class="');
            sb.appendASCIIString(ViewLine.CLASS_NAME);
            sb.appendASCIIString('">');
            const output = viewLineRenderer_1.renderViewLine(renderLineInput, sb);
            sb.appendASCIIString('</div>');
            let renderedViewLine = null;
            if (canUseFastRenderedViewLine && lineData.isBasicASCII && options.useMonospaceOptimizations && output.containsForeignElements === 0 /* None */) {
                if (lineData.content.length < 300 && renderLineInput.lineTokens.getCount() < 100) {
                    // Browser rounding errors have been observed in Chrome and IE, so using the fast
                    // view line only for short lines. Please test before removing the length check...
                    // ---
                    // Another rounding error has been observed on Linux in VSCode, where <span> width
                    // rounding errors add up to an observable large number...
                    // ---
                    // Also see another example of rounding errors on Windows in
                    // https://github.com/Microsoft/vscode/issues/33178
                    renderedViewLine = new FastRenderedViewLine(this._renderedViewLine ? this._renderedViewLine.domNode : null, renderLineInput, output.characterMapping);
                }
            }
            if (!renderedViewLine) {
                renderedViewLine = createRenderedLine(this._renderedViewLine ? this._renderedViewLine.domNode : null, renderLineInput, output.characterMapping, output.containsRTL, output.containsForeignElements);
            }
            this._renderedViewLine = renderedViewLine;
            return true;
        }
        layoutLine(lineNumber, deltaTop) {
            if (this._renderedViewLine && this._renderedViewLine.domNode) {
                this._renderedViewLine.domNode.setTop(deltaTop);
                this._renderedViewLine.domNode.setHeight(this._options.lineHeight);
            }
        }
        // --- end IVisibleLineData
        getWidth() {
            if (!this._renderedViewLine) {
                return 0;
            }
            return this._renderedViewLine.getWidth();
        }
        getWidthIsFast() {
            if (!this._renderedViewLine) {
                return true;
            }
            return this._renderedViewLine.getWidthIsFast();
        }
        getVisibleRangesForRange(startColumn, endColumn, context) {
            if (!this._renderedViewLine) {
                return null;
            }
            startColumn = startColumn | 0; // @perf
            endColumn = endColumn | 0; // @perf
            startColumn = Math.min(this._renderedViewLine.input.lineContent.length + 1, Math.max(1, startColumn));
            endColumn = Math.min(this._renderedViewLine.input.lineContent.length + 1, Math.max(1, endColumn));
            const stopRenderingLineAfter = this._renderedViewLine.input.stopRenderingLineAfter | 0; // @perf
            if (stopRenderingLineAfter !== -1 && startColumn > stopRenderingLineAfter && endColumn > stopRenderingLineAfter) {
                // This range is obviously not visible
                return null;
            }
            if (stopRenderingLineAfter !== -1 && startColumn > stopRenderingLineAfter) {
                startColumn = stopRenderingLineAfter;
            }
            if (stopRenderingLineAfter !== -1 && endColumn > stopRenderingLineAfter) {
                endColumn = stopRenderingLineAfter;
            }
            return this._renderedViewLine.getVisibleRangesForRange(startColumn, endColumn, context);
        }
        getColumnOfNodeOffset(lineNumber, spanNode, offset) {
            if (!this._renderedViewLine) {
                return 1;
            }
            return this._renderedViewLine.getColumnOfNodeOffset(lineNumber, spanNode, offset);
        }
    }
    ViewLine.CLASS_NAME = 'view-line';
    exports.ViewLine = ViewLine;
    /**
     * A rendered line which is guaranteed to contain only regular ASCII and is rendered with a monospace font.
     */
    class FastRenderedViewLine {
        constructor(domNode, renderLineInput, characterMapping) {
            this.domNode = domNode;
            this.input = renderLineInput;
            this._characterMapping = characterMapping;
            this._charWidth = renderLineInput.spaceWidth;
        }
        getWidth() {
            return this._getCharPosition(this._characterMapping.length);
        }
        getWidthIsFast() {
            return true;
        }
        getVisibleRangesForRange(startColumn, endColumn, context) {
            const startPosition = this._getCharPosition(startColumn);
            const endPosition = this._getCharPosition(endColumn);
            return [new renderingContext_1.HorizontalRange(startPosition, endPosition - startPosition)];
        }
        _getCharPosition(column) {
            const charOffset = this._characterMapping.getAbsoluteOffsets();
            if (charOffset.length === 0) {
                // No characters on this line
                return 0;
            }
            return Math.round(this._charWidth * charOffset[column - 1]);
        }
        getColumnOfNodeOffset(lineNumber, spanNode, offset) {
            const spanNodeTextContentLength = spanNode.textContent.length;
            let spanIndex = -1;
            while (spanNode) {
                spanNode = spanNode.previousSibling;
                spanIndex++;
            }
            const charOffset = this._characterMapping.partDataToCharOffset(spanIndex, spanNodeTextContentLength, offset);
            return charOffset + 1;
        }
    }
    /**
     * Every time we render a line, we save what we have rendered in an instance of this class.
     */
    class RenderedViewLine {
        constructor(domNode, renderLineInput, characterMapping, containsRTL, containsForeignElements) {
            this.domNode = domNode;
            this.input = renderLineInput;
            this._characterMapping = characterMapping;
            this._isWhitespaceOnly = /^\s*$/.test(renderLineInput.lineContent);
            this._containsForeignElements = containsForeignElements;
            this._cachedWidth = -1;
            this._pixelOffsetCache = null;
            if (!containsRTL || this._characterMapping.length === 0 /* the line is empty */) {
                this._pixelOffsetCache = new Int32Array(Math.max(2, this._characterMapping.length + 1));
                for (let column = 0, len = this._characterMapping.length; column <= len; column++) {
                    this._pixelOffsetCache[column] = -1;
                }
            }
        }
        // --- Reading from the DOM methods
        _getReadingTarget() {
            return this.domNode.domNode.firstChild;
        }
        /**
         * Width of the line in pixels
         */
        getWidth() {
            if (this._cachedWidth === -1) {
                this._cachedWidth = this._getReadingTarget().offsetWidth;
            }
            return this._cachedWidth;
        }
        getWidthIsFast() {
            if (this._cachedWidth === -1) {
                return false;
            }
            return true;
        }
        /**
         * Visible ranges for a model range
         */
        getVisibleRangesForRange(startColumn, endColumn, context) {
            if (this._pixelOffsetCache !== null) {
                // the text is LTR
                const startOffset = this._readPixelOffset(startColumn, context);
                if (startOffset === -1) {
                    return null;
                }
                const endOffset = this._readPixelOffset(endColumn, context);
                if (endOffset === -1) {
                    return null;
                }
                return [new renderingContext_1.HorizontalRange(startOffset, endOffset - startOffset)];
            }
            return this._readVisibleRangesForRange(startColumn, endColumn, context);
        }
        _readVisibleRangesForRange(startColumn, endColumn, context) {
            if (startColumn === endColumn) {
                const pixelOffset = this._readPixelOffset(startColumn, context);
                if (pixelOffset === -1) {
                    return null;
                }
                else {
                    return [new renderingContext_1.HorizontalRange(pixelOffset, 0)];
                }
            }
            else {
                return this._readRawVisibleRangesForRange(startColumn, endColumn, context);
            }
        }
        _readPixelOffset(column, context) {
            if (this._characterMapping.length === 0) {
                // This line has no content
                if (this._containsForeignElements === 0 /* None */) {
                    // We can assume the line is really empty
                    return 0;
                }
                if (this._containsForeignElements === 2 /* After */) {
                    // We have foreign elements after the (empty) line
                    return 0;
                }
                if (this._containsForeignElements === 1 /* Before */) {
                    // We have foreign element before the (empty) line
                    return this.getWidth();
                }
            }
            if (this._pixelOffsetCache !== null) {
                // the text is LTR
                const cachedPixelOffset = this._pixelOffsetCache[column];
                if (cachedPixelOffset !== -1) {
                    return cachedPixelOffset;
                }
                const result = this._actualReadPixelOffset(column, context);
                this._pixelOffsetCache[column] = result;
                return result;
            }
            return this._actualReadPixelOffset(column, context);
        }
        _actualReadPixelOffset(column, context) {
            if (this._characterMapping.length === 0) {
                // This line has no content
                const r = rangeUtil_1.RangeUtil.readHorizontalRanges(this._getReadingTarget(), 0, 0, 0, 0, context.clientRectDeltaLeft, context.endNode);
                if (!r || r.length === 0) {
                    return -1;
                }
                return r[0].left;
            }
            if (column === this._characterMapping.length && this._isWhitespaceOnly && this._containsForeignElements === 0 /* None */) {
                // This branch helps in the case of whitespace only lines which have a width set
                return this.getWidth();
            }
            const partData = this._characterMapping.charOffsetToPartData(column - 1);
            const partIndex = viewLineRenderer_1.CharacterMapping.getPartIndex(partData);
            const charOffsetInPart = viewLineRenderer_1.CharacterMapping.getCharIndex(partData);
            const r = rangeUtil_1.RangeUtil.readHorizontalRanges(this._getReadingTarget(), partIndex, charOffsetInPart, partIndex, charOffsetInPart, context.clientRectDeltaLeft, context.endNode);
            if (!r || r.length === 0) {
                return -1;
            }
            return r[0].left;
        }
        _readRawVisibleRangesForRange(startColumn, endColumn, context) {
            if (startColumn === 1 && endColumn === this._characterMapping.length) {
                // This branch helps IE with bidi text & gives a performance boost to other browsers when reading visible ranges for an entire line
                return [new renderingContext_1.HorizontalRange(0, this.getWidth())];
            }
            const startPartData = this._characterMapping.charOffsetToPartData(startColumn - 1);
            const startPartIndex = viewLineRenderer_1.CharacterMapping.getPartIndex(startPartData);
            const startCharOffsetInPart = viewLineRenderer_1.CharacterMapping.getCharIndex(startPartData);
            const endPartData = this._characterMapping.charOffsetToPartData(endColumn - 1);
            const endPartIndex = viewLineRenderer_1.CharacterMapping.getPartIndex(endPartData);
            const endCharOffsetInPart = viewLineRenderer_1.CharacterMapping.getCharIndex(endPartData);
            return rangeUtil_1.RangeUtil.readHorizontalRanges(this._getReadingTarget(), startPartIndex, startCharOffsetInPart, endPartIndex, endCharOffsetInPart, context.clientRectDeltaLeft, context.endNode);
        }
        /**
         * Returns the column for the text found at a specific offset inside a rendered dom node
         */
        getColumnOfNodeOffset(lineNumber, spanNode, offset) {
            const spanNodeTextContentLength = spanNode.textContent.length;
            let spanIndex = -1;
            while (spanNode) {
                spanNode = spanNode.previousSibling;
                spanIndex++;
            }
            const charOffset = this._characterMapping.partDataToCharOffset(spanIndex, spanNodeTextContentLength, offset);
            return charOffset + 1;
        }
    }
    class WebKitRenderedViewLine extends RenderedViewLine {
        _readVisibleRangesForRange(startColumn, endColumn, context) {
            const output = super._readVisibleRangesForRange(startColumn, endColumn, context);
            if (!output || output.length === 0 || startColumn === endColumn || (startColumn === 1 && endColumn === this._characterMapping.length)) {
                return output;
            }
            // WebKit is buggy and returns an expanded range (to contain words in some cases)
            // The last client rect is enlarged (I think)
            if (!this.input.containsRTL) {
                // This is an attempt to patch things up
                // Find position of last column
                const endPixelOffset = this._readPixelOffset(endColumn, context);
                if (endPixelOffset !== -1) {
                    const lastRange = output[output.length - 1];
                    if (lastRange.left < endPixelOffset) {
                        // Trim down the width of the last visible range to not go after the last column's position
                        lastRange.width = endPixelOffset - lastRange.left;
                    }
                }
            }
            return output;
        }
    }
    const createRenderedLine = (function () {
        if (browser.isWebKit) {
            return createWebKitRenderedLine;
        }
        return createNormalRenderedLine;
    })();
    function createWebKitRenderedLine(domNode, renderLineInput, characterMapping, containsRTL, containsForeignElements) {
        return new WebKitRenderedViewLine(domNode, renderLineInput, characterMapping, containsRTL, containsForeignElements);
    }
    function createNormalRenderedLine(domNode, renderLineInput, characterMapping, containsRTL, containsForeignElements) {
        return new RenderedViewLine(domNode, renderLineInput, characterMapping, containsRTL, containsForeignElements);
    }
});
//# sourceMappingURL=viewLine.js.map