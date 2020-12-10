/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/editor/browser/config/configuration", "vs/editor/browser/view/viewLayer", "vs/editor/browser/view/viewPart"], function (require, exports, fastDomNode_1, configuration_1, viewLayer_1, viewPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ViewOverlays extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this._visibleLines = new viewLayer_1.VisibleLinesCollection(this);
            this.domNode = this._visibleLines.domNode;
            this._dynamicOverlays = [];
            this._isFocused = false;
            this.domNode.setClassName('view-overlays');
        }
        shouldRender() {
            if (super.shouldRender()) {
                return true;
            }
            for (let i = 0, len = this._dynamicOverlays.length; i < len; i++) {
                const dynamicOverlay = this._dynamicOverlays[i];
                if (dynamicOverlay.shouldRender()) {
                    return true;
                }
            }
            return false;
        }
        dispose() {
            super.dispose();
            for (let i = 0, len = this._dynamicOverlays.length; i < len; i++) {
                const dynamicOverlay = this._dynamicOverlays[i];
                dynamicOverlay.dispose();
            }
            this._dynamicOverlays = [];
        }
        getDomNode() {
            return this.domNode;
        }
        // ---- begin IVisibleLinesHost
        createVisibleLine() {
            return new ViewOverlayLine(this._context.configuration, this._dynamicOverlays);
        }
        // ---- end IVisibleLinesHost
        addDynamicOverlay(overlay) {
            this._dynamicOverlays.push(overlay);
        }
        // ----- event handlers
        onConfigurationChanged(e) {
            this._visibleLines.onConfigurationChanged(e);
            const startLineNumber = this._visibleLines.getStartLineNumber();
            const endLineNumber = this._visibleLines.getEndLineNumber();
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const line = this._visibleLines.getVisibleLine(lineNumber);
                line.onConfigurationChanged(e);
            }
            return true;
        }
        onFlushed(e) {
            return this._visibleLines.onFlushed(e);
        }
        onFocusChanged(e) {
            this._isFocused = e.isFocused;
            return true;
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
        onScrollChanged(e) {
            return this._visibleLines.onScrollChanged(e) || true;
        }
        onTokensChanged(e) {
            return this._visibleLines.onTokensChanged(e);
        }
        onZonesChanged(e) {
            return this._visibleLines.onZonesChanged(e);
        }
        // ----- end event handlers
        prepareRender(ctx) {
            const toRender = this._dynamicOverlays.filter(overlay => overlay.shouldRender());
            for (let i = 0, len = toRender.length; i < len; i++) {
                const dynamicOverlay = toRender[i];
                dynamicOverlay.prepareRender(ctx);
                dynamicOverlay.onDidRender();
            }
        }
        render(ctx) {
            // Overwriting to bypass `shouldRender` flag
            this._viewOverlaysRender(ctx);
            this.domNode.toggleClassName('focused', this._isFocused);
        }
        _viewOverlaysRender(ctx) {
            this._visibleLines.renderLines(ctx.viewportData);
        }
    }
    exports.ViewOverlays = ViewOverlays;
    class ViewOverlayLine {
        constructor(configuration, dynamicOverlays) {
            this._configuration = configuration;
            this._lineHeight = this._configuration.editor.lineHeight;
            this._dynamicOverlays = dynamicOverlays;
            this._domNode = null;
            this._renderedContent = null;
        }
        getDomNode() {
            if (!this._domNode) {
                return null;
            }
            return this._domNode.domNode;
        }
        setDomNode(domNode) {
            this._domNode = fastDomNode_1.createFastDomNode(domNode);
        }
        onContentChanged() {
            // Nothing
        }
        onTokensChanged() {
            // Nothing
        }
        onConfigurationChanged(e) {
            if (e.lineHeight) {
                this._lineHeight = this._configuration.editor.lineHeight;
            }
        }
        renderLine(lineNumber, deltaTop, viewportData, sb) {
            let result = '';
            for (let i = 0, len = this._dynamicOverlays.length; i < len; i++) {
                const dynamicOverlay = this._dynamicOverlays[i];
                result += dynamicOverlay.render(viewportData.startLineNumber, lineNumber);
            }
            if (this._renderedContent === result) {
                // No rendering needed
                return false;
            }
            this._renderedContent = result;
            sb.appendASCIIString('<div style="position:absolute;top:');
            sb.appendASCIIString(String(deltaTop));
            sb.appendASCIIString('px;width:100%;height:');
            sb.appendASCIIString(String(this._lineHeight));
            sb.appendASCIIString('px;">');
            sb.appendASCIIString(result);
            sb.appendASCIIString('</div>');
            return true;
        }
        layoutLine(lineNumber, deltaTop) {
            if (this._domNode) {
                this._domNode.setTop(deltaTop);
                this._domNode.setHeight(this._lineHeight);
            }
        }
    }
    exports.ViewOverlayLine = ViewOverlayLine;
    class ContentViewOverlays extends ViewOverlays {
        constructor(context) {
            super(context);
            this._contentWidth = this._context.configuration.editor.layoutInfo.contentWidth;
            this.domNode.setHeight(0);
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            if (e.layoutInfo) {
                this._contentWidth = this._context.configuration.editor.layoutInfo.contentWidth;
            }
            return super.onConfigurationChanged(e);
        }
        onScrollChanged(e) {
            return super.onScrollChanged(e) || e.scrollWidthChanged;
        }
        // --- end event handlers
        _viewOverlaysRender(ctx) {
            super._viewOverlaysRender(ctx);
            this.domNode.setWidth(Math.max(ctx.scrollWidth, this._contentWidth));
        }
    }
    exports.ContentViewOverlays = ContentViewOverlays;
    class MarginViewOverlays extends ViewOverlays {
        constructor(context) {
            super(context);
            this._contentLeft = this._context.configuration.editor.layoutInfo.contentLeft;
            this.domNode.setClassName('margin-view-overlays');
            this.domNode.setWidth(1);
            configuration_1.Configuration.applyFontInfo(this.domNode, this._context.configuration.editor.fontInfo);
        }
        onConfigurationChanged(e) {
            let shouldRender = false;
            if (e.fontInfo) {
                configuration_1.Configuration.applyFontInfo(this.domNode, this._context.configuration.editor.fontInfo);
                shouldRender = true;
            }
            if (e.layoutInfo) {
                this._contentLeft = this._context.configuration.editor.layoutInfo.contentLeft;
                shouldRender = true;
            }
            return super.onConfigurationChanged(e) || shouldRender;
        }
        onScrollChanged(e) {
            return super.onScrollChanged(e) || e.scrollHeightChanged;
        }
        _viewOverlaysRender(ctx) {
            super._viewOverlaysRender(ctx);
            const height = Math.min(ctx.scrollHeight, 1000000);
            this.domNode.setHeight(height);
            this.domNode.setWidth(this._contentLeft);
        }
    }
    exports.MarginViewOverlays = MarginViewOverlays;
});
//# sourceMappingURL=viewOverlays.js.map