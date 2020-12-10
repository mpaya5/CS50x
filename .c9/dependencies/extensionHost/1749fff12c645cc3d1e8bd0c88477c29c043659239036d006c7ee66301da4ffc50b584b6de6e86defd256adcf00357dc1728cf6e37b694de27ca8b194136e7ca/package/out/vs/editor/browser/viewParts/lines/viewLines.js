/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/editor/browser/config/configuration", "vs/editor/browser/view/viewLayer", "vs/editor/browser/view/viewPart", "vs/editor/browser/viewParts/lines/viewLine", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/view/renderingContext", "vs/css!./viewLines"], function (require, exports, async_1, configuration_1, viewLayer_1, viewPart_1, viewLine_1, position_1, range_1, renderingContext_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LastRenderedData {
        constructor() {
            this._currentVisibleRange = new range_1.Range(1, 1, 1, 1);
        }
        getCurrentVisibleRange() {
            return this._currentVisibleRange;
        }
        setCurrentVisibleRange(currentVisibleRange) {
            this._currentVisibleRange = currentVisibleRange;
        }
    }
    class HorizontalRevealRequest {
        constructor(lineNumber, startColumn, endColumn, startScrollTop, stopScrollTop, scrollType) {
            this.lineNumber = lineNumber;
            this.startColumn = startColumn;
            this.endColumn = endColumn;
            this.startScrollTop = startScrollTop;
            this.stopScrollTop = stopScrollTop;
            this.scrollType = scrollType;
        }
    }
    class ViewLines extends viewPart_1.ViewPart {
        constructor(context, linesContent) {
            super(context);
            this._linesContent = linesContent;
            this._textRangeRestingSpot = document.createElement('div');
            this._visibleLines = new viewLayer_1.VisibleLinesCollection(this);
            this.domNode = this._visibleLines.domNode;
            const conf = this._context.configuration;
            this._lineHeight = conf.editor.lineHeight;
            this._typicalHalfwidthCharacterWidth = conf.editor.fontInfo.typicalHalfwidthCharacterWidth;
            this._isViewportWrapping = conf.editor.wrappingInfo.isViewportWrapping;
            this._revealHorizontalRightPadding = conf.editor.viewInfo.revealHorizontalRightPadding;
            this._scrollOff = conf.editor.viewInfo.cursorSurroundingLines;
            this._canUseLayerHinting = conf.editor.canUseLayerHinting;
            this._viewLineOptions = new viewLine_1.ViewLineOptions(conf, this._context.theme.type);
            viewPart_1.PartFingerprints.write(this.domNode, 7 /* ViewLines */);
            this.domNode.setClassName('view-lines');
            configuration_1.Configuration.applyFontInfo(this.domNode, conf.editor.fontInfo);
            // --- width & height
            this._maxLineWidth = 0;
            this._asyncUpdateLineWidths = new async_1.RunOnceScheduler(() => {
                this._updateLineWidthsSlow();
            }, 200);
            this._lastRenderedData = new LastRenderedData();
            this._horizontalRevealRequest = null;
        }
        dispose() {
            this._asyncUpdateLineWidths.dispose();
            super.dispose();
        }
        getDomNode() {
            return this.domNode;
        }
        // ---- begin IVisibleLinesHost
        createVisibleLine() {
            return new viewLine_1.ViewLine(this._viewLineOptions);
        }
        // ---- end IVisibleLinesHost
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            this._visibleLines.onConfigurationChanged(e);
            if (e.wrappingInfo) {
                this._maxLineWidth = 0;
            }
            const conf = this._context.configuration;
            if (e.lineHeight) {
                this._lineHeight = conf.editor.lineHeight;
            }
            if (e.fontInfo) {
                this._typicalHalfwidthCharacterWidth = conf.editor.fontInfo.typicalHalfwidthCharacterWidth;
            }
            if (e.wrappingInfo) {
                this._isViewportWrapping = conf.editor.wrappingInfo.isViewportWrapping;
            }
            if (e.viewInfo) {
                this._revealHorizontalRightPadding = conf.editor.viewInfo.revealHorizontalRightPadding;
                this._scrollOff = conf.editor.viewInfo.cursorSurroundingLines;
            }
            if (e.canUseLayerHinting) {
                this._canUseLayerHinting = conf.editor.canUseLayerHinting;
            }
            if (e.fontInfo) {
                configuration_1.Configuration.applyFontInfo(this.domNode, conf.editor.fontInfo);
            }
            this._onOptionsMaybeChanged();
            if (e.layoutInfo) {
                this._maxLineWidth = 0;
            }
            return true;
        }
        _onOptionsMaybeChanged() {
            const conf = this._context.configuration;
            const newViewLineOptions = new viewLine_1.ViewLineOptions(conf, this._context.theme.type);
            if (!this._viewLineOptions.equals(newViewLineOptions)) {
                this._viewLineOptions = newViewLineOptions;
                const startLineNumber = this._visibleLines.getStartLineNumber();
                const endLineNumber = this._visibleLines.getEndLineNumber();
                for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                    const line = this._visibleLines.getVisibleLine(lineNumber);
                    line.onOptionsChanged(this._viewLineOptions);
                }
                return true;
            }
            return false;
        }
        onCursorStateChanged(e) {
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            let r = false;
            for (let lineNumber = rendStartLineNumber; lineNumber <= rendEndLineNumber; lineNumber++) {
                r = this._visibleLines.getVisibleLine(lineNumber).onSelectionChanged() || r;
            }
            return r;
        }
        onDecorationsChanged(e) {
            if (true /*e.inlineDecorationsChanged*/) {
                const rendStartLineNumber = this._visibleLines.getStartLineNumber();
                const rendEndLineNumber = this._visibleLines.getEndLineNumber();
                for (let lineNumber = rendStartLineNumber; lineNumber <= rendEndLineNumber; lineNumber++) {
                    this._visibleLines.getVisibleLine(lineNumber).onDecorationsChanged();
                }
            }
            return true;
        }
        onFlushed(e) {
            const shouldRender = this._visibleLines.onFlushed(e);
            this._maxLineWidth = 0;
            return shouldRender;
        }
        onLinesChanged(e) {
            return this._visibleLines.onLinesChanged(e);
        }
        onLinesDeleted(e) {
            return this._visibleLines.onLinesDeleted(e);
        }
        onLinesInserted(e) {
            return this._visibleLines.onLinesInserted(e);
        }
        onRevealRangeRequest(e) {
            // Using the future viewport here in order to handle multiple
            // incoming reveal range requests that might all desire to be animated
            const desiredScrollTop = this._computeScrollTopToRevealRange(this._context.viewLayout.getFutureViewport(), e.range, e.verticalType);
            // validate the new desired scroll top
            let newScrollPosition = this._context.viewLayout.validateScrollPosition({ scrollTop: desiredScrollTop });
            if (e.revealHorizontal) {
                if (e.range.startLineNumber !== e.range.endLineNumber) {
                    // Two or more lines? => scroll to base (That's how you see most of the two lines)
                    newScrollPosition = {
                        scrollTop: newScrollPosition.scrollTop,
                        scrollLeft: 0
                    };
                }
                else {
                    // We don't necessarily know the horizontal offset of this range since the line might not be in the view...
                    this._horizontalRevealRequest = new HorizontalRevealRequest(e.range.startLineNumber, e.range.startColumn, e.range.endColumn, this._context.viewLayout.getCurrentScrollTop(), newScrollPosition.scrollTop, e.scrollType);
                }
            }
            else {
                this._horizontalRevealRequest = null;
            }
            const scrollTopDelta = Math.abs(this._context.viewLayout.getCurrentScrollTop() - newScrollPosition.scrollTop);
            if (e.scrollType === 0 /* Smooth */ && scrollTopDelta > this._lineHeight) {
                this._context.viewLayout.setScrollPositionSmooth(newScrollPosition);
            }
            else {
                this._context.viewLayout.setScrollPositionNow(newScrollPosition);
            }
            return true;
        }
        onScrollChanged(e) {
            if (this._horizontalRevealRequest && e.scrollLeftChanged) {
                // cancel any outstanding horizontal reveal request if someone else scrolls horizontally.
                this._horizontalRevealRequest = null;
            }
            if (this._horizontalRevealRequest && e.scrollTopChanged) {
                const min = Math.min(this._horizontalRevealRequest.startScrollTop, this._horizontalRevealRequest.stopScrollTop);
                const max = Math.max(this._horizontalRevealRequest.startScrollTop, this._horizontalRevealRequest.stopScrollTop);
                if (e.scrollTop < min || e.scrollTop > max) {
                    // cancel any outstanding horizontal reveal request if someone else scrolls vertically.
                    this._horizontalRevealRequest = null;
                }
            }
            this.domNode.setWidth(e.scrollWidth);
            return this._visibleLines.onScrollChanged(e) || true;
        }
        onTokensChanged(e) {
            return this._visibleLines.onTokensChanged(e);
        }
        onZonesChanged(e) {
            this._context.viewLayout.onMaxLineWidthChanged(this._maxLineWidth);
            return this._visibleLines.onZonesChanged(e);
        }
        onThemeChanged(e) {
            return this._onOptionsMaybeChanged();
        }
        // ---- end view event handlers
        // ----------- HELPERS FOR OTHERS
        getPositionFromDOMInfo(spanNode, offset) {
            const viewLineDomNode = this._getViewLineDomNode(spanNode);
            if (viewLineDomNode === null) {
                // Couldn't find view line node
                return null;
            }
            const lineNumber = this._getLineNumberFor(viewLineDomNode);
            if (lineNumber === -1) {
                // Couldn't find view line node
                return null;
            }
            if (lineNumber < 1 || lineNumber > this._context.model.getLineCount()) {
                // lineNumber is outside range
                return null;
            }
            if (this._context.model.getLineMaxColumn(lineNumber) === 1) {
                // Line is empty
                return new position_1.Position(lineNumber, 1);
            }
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            if (lineNumber < rendStartLineNumber || lineNumber > rendEndLineNumber) {
                // Couldn't find line
                return null;
            }
            let column = this._visibleLines.getVisibleLine(lineNumber).getColumnOfNodeOffset(lineNumber, spanNode, offset);
            const minColumn = this._context.model.getLineMinColumn(lineNumber);
            if (column < minColumn) {
                column = minColumn;
            }
            return new position_1.Position(lineNumber, column);
        }
        _getViewLineDomNode(node) {
            while (node && node.nodeType === 1) {
                if (node.className === viewLine_1.ViewLine.CLASS_NAME) {
                    return node;
                }
                node = node.parentElement;
            }
            return null;
        }
        /**
         * @returns the line number of this view line dom node.
         */
        _getLineNumberFor(domNode) {
            const startLineNumber = this._visibleLines.getStartLineNumber();
            const endLineNumber = this._visibleLines.getEndLineNumber();
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const line = this._visibleLines.getVisibleLine(lineNumber);
                if (domNode === line.getDomNode()) {
                    return lineNumber;
                }
            }
            return -1;
        }
        getLineWidth(lineNumber) {
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            if (lineNumber < rendStartLineNumber || lineNumber > rendEndLineNumber) {
                // Couldn't find line
                return -1;
            }
            return this._visibleLines.getVisibleLine(lineNumber).getWidth();
        }
        linesVisibleRangesForRange(_range, includeNewLines) {
            if (this.shouldRender()) {
                // Cannot read from the DOM because it is dirty
                // i.e. the model & the dom are out of sync, so I'd be reading something stale
                return null;
            }
            const originalEndLineNumber = _range.endLineNumber;
            const range = range_1.Range.intersectRanges(_range, this._lastRenderedData.getCurrentVisibleRange());
            if (!range) {
                return null;
            }
            let visibleRanges = [], visibleRangesLen = 0;
            const domReadingContext = new viewLine_1.DomReadingContext(this.domNode.domNode, this._textRangeRestingSpot);
            let nextLineModelLineNumber = 0;
            if (includeNewLines) {
                nextLineModelLineNumber = this._context.model.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(range.startLineNumber, 1)).lineNumber;
            }
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            for (let lineNumber = range.startLineNumber; lineNumber <= range.endLineNumber; lineNumber++) {
                if (lineNumber < rendStartLineNumber || lineNumber > rendEndLineNumber) {
                    continue;
                }
                const startColumn = lineNumber === range.startLineNumber ? range.startColumn : 1;
                const endColumn = lineNumber === range.endLineNumber ? range.endColumn : this._context.model.getLineMaxColumn(lineNumber);
                const visibleRangesForLine = this._visibleLines.getVisibleLine(lineNumber).getVisibleRangesForRange(startColumn, endColumn, domReadingContext);
                if (!visibleRangesForLine || visibleRangesForLine.length === 0) {
                    continue;
                }
                if (includeNewLines && lineNumber < originalEndLineNumber) {
                    const currentLineModelLineNumber = nextLineModelLineNumber;
                    nextLineModelLineNumber = this._context.model.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(lineNumber + 1, 1)).lineNumber;
                    if (currentLineModelLineNumber !== nextLineModelLineNumber) {
                        visibleRangesForLine[visibleRangesForLine.length - 1].width += this._typicalHalfwidthCharacterWidth;
                    }
                }
                visibleRanges[visibleRangesLen++] = new renderingContext_1.LineVisibleRanges(lineNumber, visibleRangesForLine);
            }
            if (visibleRangesLen === 0) {
                return null;
            }
            return visibleRanges;
        }
        visibleRangesForRange2(_range) {
            if (this.shouldRender()) {
                // Cannot read from the DOM because it is dirty
                // i.e. the model & the dom are out of sync, so I'd be reading something stale
                return null;
            }
            const range = range_1.Range.intersectRanges(_range, this._lastRenderedData.getCurrentVisibleRange());
            if (!range) {
                return null;
            }
            let result = [];
            const domReadingContext = new viewLine_1.DomReadingContext(this.domNode.domNode, this._textRangeRestingSpot);
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            for (let lineNumber = range.startLineNumber; lineNumber <= range.endLineNumber; lineNumber++) {
                if (lineNumber < rendStartLineNumber || lineNumber > rendEndLineNumber) {
                    continue;
                }
                const startColumn = lineNumber === range.startLineNumber ? range.startColumn : 1;
                const endColumn = lineNumber === range.endLineNumber ? range.endColumn : this._context.model.getLineMaxColumn(lineNumber);
                const visibleRangesForLine = this._visibleLines.getVisibleLine(lineNumber).getVisibleRangesForRange(startColumn, endColumn, domReadingContext);
                if (!visibleRangesForLine || visibleRangesForLine.length === 0) {
                    continue;
                }
                result = result.concat(visibleRangesForLine);
            }
            if (result.length === 0) {
                return null;
            }
            return result;
        }
        visibleRangeForPosition(position) {
            const visibleRanges = this.visibleRangesForRange2(new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column));
            if (!visibleRanges) {
                return null;
            }
            return visibleRanges[0];
        }
        // --- implementation
        updateLineWidths() {
            this._updateLineWidths(false);
        }
        /**
         * Updates the max line width if it is fast to compute.
         * Returns true if all lines were taken into account.
         * Returns false if some lines need to be reevaluated (in a slow fashion).
         */
        _updateLineWidthsFast() {
            return this._updateLineWidths(true);
        }
        _updateLineWidthsSlow() {
            this._updateLineWidths(false);
        }
        _updateLineWidths(fast) {
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            let localMaxLineWidth = 1;
            let allWidthsComputed = true;
            for (let lineNumber = rendStartLineNumber; lineNumber <= rendEndLineNumber; lineNumber++) {
                const visibleLine = this._visibleLines.getVisibleLine(lineNumber);
                if (fast && !visibleLine.getWidthIsFast()) {
                    // Cannot compute width in a fast way for this line
                    allWidthsComputed = false;
                    continue;
                }
                localMaxLineWidth = Math.max(localMaxLineWidth, visibleLine.getWidth());
            }
            if (allWidthsComputed && rendStartLineNumber === 1 && rendEndLineNumber === this._context.model.getLineCount()) {
                // we know the max line width for all the lines
                this._maxLineWidth = 0;
            }
            this._ensureMaxLineWidth(localMaxLineWidth);
            return allWidthsComputed;
        }
        prepareRender() {
            throw new Error('Not supported');
        }
        render() {
            throw new Error('Not supported');
        }
        renderText(viewportData) {
            // (1) render lines - ensures lines are in the DOM
            this._visibleLines.renderLines(viewportData);
            this._lastRenderedData.setCurrentVisibleRange(viewportData.visibleRange);
            this.domNode.setWidth(this._context.viewLayout.getScrollWidth());
            this.domNode.setHeight(Math.min(this._context.viewLayout.getScrollHeight(), 1000000));
            // (2) compute horizontal scroll position:
            //  - this must happen after the lines are in the DOM since it might need a line that rendered just now
            //  - it might change `scrollWidth` and `scrollLeft`
            if (this._horizontalRevealRequest) {
                const revealLineNumber = this._horizontalRevealRequest.lineNumber;
                const revealStartColumn = this._horizontalRevealRequest.startColumn;
                const revealEndColumn = this._horizontalRevealRequest.endColumn;
                const scrollType = this._horizontalRevealRequest.scrollType;
                // Check that we have the line that contains the horizontal range in the viewport
                if (viewportData.startLineNumber <= revealLineNumber && revealLineNumber <= viewportData.endLineNumber) {
                    this._horizontalRevealRequest = null;
                    // allow `visibleRangesForRange2` to work
                    this.onDidRender();
                    // compute new scroll position
                    const newScrollLeft = this._computeScrollLeftToRevealRange(revealLineNumber, revealStartColumn, revealEndColumn);
                    const isViewportWrapping = this._isViewportWrapping;
                    if (!isViewportWrapping) {
                        // ensure `scrollWidth` is large enough
                        this._ensureMaxLineWidth(newScrollLeft.maxHorizontalOffset);
                    }
                    // set `scrollLeft`
                    if (scrollType === 0 /* Smooth */) {
                        this._context.viewLayout.setScrollPositionSmooth({
                            scrollLeft: newScrollLeft.scrollLeft
                        });
                    }
                    else {
                        this._context.viewLayout.setScrollPositionNow({
                            scrollLeft: newScrollLeft.scrollLeft
                        });
                    }
                }
            }
            // Update max line width (not so important, it is just so the horizontal scrollbar doesn't get too small)
            if (!this._updateLineWidthsFast()) {
                // Computing the width of some lines would be slow => delay it
                this._asyncUpdateLineWidths.schedule();
            }
            // (3) handle scrolling
            this._linesContent.setLayerHinting(this._canUseLayerHinting);
            const adjustedScrollTop = this._context.viewLayout.getCurrentScrollTop() - viewportData.bigNumbersDelta;
            this._linesContent.setTop(-adjustedScrollTop);
            this._linesContent.setLeft(-this._context.viewLayout.getCurrentScrollLeft());
        }
        // --- width
        _ensureMaxLineWidth(lineWidth) {
            const iLineWidth = Math.ceil(lineWidth);
            if (this._maxLineWidth < iLineWidth) {
                this._maxLineWidth = iLineWidth;
                this._context.viewLayout.onMaxLineWidthChanged(this._maxLineWidth);
            }
        }
        _computeScrollTopToRevealRange(viewport, range, verticalType) {
            const viewportStartY = viewport.top;
            const viewportHeight = viewport.height;
            const viewportEndY = viewportStartY + viewportHeight;
            let boxStartY;
            let boxEndY;
            // Have a box that includes one extra line height (for the horizontal scrollbar)
            boxStartY = this._context.viewLayout.getVerticalOffsetForLineNumber(range.startLineNumber);
            boxEndY = this._context.viewLayout.getVerticalOffsetForLineNumber(range.endLineNumber) + this._lineHeight;
            const context = Math.min((viewportHeight / this._lineHeight) / 2, this._scrollOff);
            boxStartY -= context * this._lineHeight;
            boxEndY += Math.max(0, (context - 1)) * this._lineHeight;
            if (verticalType === 0 /* Simple */ || verticalType === 4 /* Bottom */) {
                // Reveal one line more when the last line would be covered by the scrollbar - arrow down case or revealing a line explicitly at bottom
                boxEndY += this._lineHeight;
            }
            let newScrollTop;
            if (verticalType === 1 /* Center */ || verticalType === 2 /* CenterIfOutsideViewport */) {
                if (verticalType === 2 /* CenterIfOutsideViewport */ && viewportStartY <= boxStartY && boxEndY <= viewportEndY) {
                    // Box is already in the viewport... do nothing
                    newScrollTop = viewportStartY;
                }
                else {
                    // Box is outside the viewport... center it
                    const boxMiddleY = (boxStartY + boxEndY) / 2;
                    newScrollTop = Math.max(0, boxMiddleY - viewportHeight / 2);
                }
            }
            else {
                newScrollTop = this._computeMinimumScrolling(viewportStartY, viewportEndY, boxStartY, boxEndY, verticalType === 3 /* Top */, verticalType === 4 /* Bottom */);
            }
            return newScrollTop;
        }
        _computeScrollLeftToRevealRange(lineNumber, startColumn, endColumn) {
            let maxHorizontalOffset = 0;
            const viewport = this._context.viewLayout.getCurrentViewport();
            const viewportStartX = viewport.left;
            const viewportEndX = viewportStartX + viewport.width;
            const visibleRanges = this.visibleRangesForRange2(new range_1.Range(lineNumber, startColumn, lineNumber, endColumn));
            let boxStartX = Number.MAX_VALUE;
            let boxEndX = 0;
            if (!visibleRanges) {
                // Unknown
                return {
                    scrollLeft: viewportStartX,
                    maxHorizontalOffset: maxHorizontalOffset
                };
            }
            for (const visibleRange of visibleRanges) {
                if (visibleRange.left < boxStartX) {
                    boxStartX = visibleRange.left;
                }
                if (visibleRange.left + visibleRange.width > boxEndX) {
                    boxEndX = visibleRange.left + visibleRange.width;
                }
            }
            maxHorizontalOffset = boxEndX;
            boxStartX = Math.max(0, boxStartX - ViewLines.HORIZONTAL_EXTRA_PX);
            boxEndX += this._revealHorizontalRightPadding;
            const newScrollLeft = this._computeMinimumScrolling(viewportStartX, viewportEndX, boxStartX, boxEndX);
            return {
                scrollLeft: newScrollLeft,
                maxHorizontalOffset: maxHorizontalOffset
            };
        }
        _computeMinimumScrolling(viewportStart, viewportEnd, boxStart, boxEnd, revealAtStart, revealAtEnd) {
            viewportStart = viewportStart | 0;
            viewportEnd = viewportEnd | 0;
            boxStart = boxStart | 0;
            boxEnd = boxEnd | 0;
            revealAtStart = !!revealAtStart;
            revealAtEnd = !!revealAtEnd;
            const viewportLength = viewportEnd - viewportStart;
            const boxLength = boxEnd - boxStart;
            if (boxLength < viewportLength) {
                // The box would fit in the viewport
                if (revealAtStart) {
                    return boxStart;
                }
                if (revealAtEnd) {
                    return Math.max(0, boxEnd - viewportLength);
                }
                if (boxStart < viewportStart) {
                    // The box is above the viewport
                    return boxStart;
                }
                else if (boxEnd > viewportEnd) {
                    // The box is below the viewport
                    return Math.max(0, boxEnd - viewportLength);
                }
            }
            else {
                // The box would not fit in the viewport
                // Reveal the beginning of the box
                return boxStart;
            }
            return viewportStart;
        }
    }
    /**
     * Adds this amount of pixels to the right of lines (no-one wants to type near the edge of the viewport)
     */
    ViewLines.HORIZONTAL_EXTRA_PX = 30;
    exports.ViewLines = ViewLines;
});
//# sourceMappingURL=viewLines.js.map