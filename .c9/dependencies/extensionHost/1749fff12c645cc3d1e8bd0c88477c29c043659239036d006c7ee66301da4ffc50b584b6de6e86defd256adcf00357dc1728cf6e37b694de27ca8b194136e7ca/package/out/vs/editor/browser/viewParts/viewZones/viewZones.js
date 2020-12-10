/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/base/common/errors", "vs/editor/browser/view/viewPart", "vs/editor/common/core/position"], function (require, exports, fastDomNode_1, errors_1, viewPart_1, position_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ViewZones extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this._lineHeight = this._context.configuration.editor.lineHeight;
            this._contentWidth = this._context.configuration.editor.layoutInfo.contentWidth;
            this._contentLeft = this._context.configuration.editor.layoutInfo.contentLeft;
            this.domNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this.domNode.setClassName('view-zones');
            this.domNode.setPosition('absolute');
            this.domNode.setAttribute('role', 'presentation');
            this.domNode.setAttribute('aria-hidden', 'true');
            this.marginDomNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this.marginDomNode.setClassName('margin-view-zones');
            this.marginDomNode.setPosition('absolute');
            this.marginDomNode.setAttribute('role', 'presentation');
            this.marginDomNode.setAttribute('aria-hidden', 'true');
            this._zones = {};
        }
        dispose() {
            super.dispose();
            this._zones = {};
        }
        // ---- begin view event handlers
        _recomputeWhitespacesProps() {
            let hadAChange = false;
            const keys = Object.keys(this._zones);
            for (let i = 0, len = keys.length; i < len; i++) {
                const id = keys[i];
                const zone = this._zones[id];
                const props = this._computeWhitespaceProps(zone.delegate);
                if (this._context.viewLayout.changeWhitespace(id, props.afterViewLineNumber, props.heightInPx)) {
                    this._safeCallOnComputedHeight(zone.delegate, props.heightInPx);
                    hadAChange = true;
                }
            }
            return hadAChange;
        }
        onConfigurationChanged(e) {
            if (e.lineHeight) {
                this._lineHeight = this._context.configuration.editor.lineHeight;
                return this._recomputeWhitespacesProps();
            }
            if (e.layoutInfo) {
                this._contentWidth = this._context.configuration.editor.layoutInfo.contentWidth;
                this._contentLeft = this._context.configuration.editor.layoutInfo.contentLeft;
            }
            return true;
        }
        onLineMappingChanged(e) {
            const hadAChange = this._recomputeWhitespacesProps();
            if (hadAChange) {
                this._context.viewLayout.onHeightMaybeChanged();
            }
            return hadAChange;
        }
        onLinesDeleted(e) {
            return true;
        }
        onScrollChanged(e) {
            return e.scrollTopChanged || e.scrollWidthChanged;
        }
        onZonesChanged(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        // ---- end view event handlers
        _getZoneOrdinal(zone) {
            if (typeof zone.afterColumn !== 'undefined') {
                return zone.afterColumn;
            }
            return 10000;
        }
        _computeWhitespaceProps(zone) {
            if (zone.afterLineNumber === 0) {
                return {
                    afterViewLineNumber: 0,
                    heightInPx: this._heightInPixels(zone),
                    minWidthInPx: this._minWidthInPixels(zone)
                };
            }
            let zoneAfterModelPosition;
            if (typeof zone.afterColumn !== 'undefined') {
                zoneAfterModelPosition = this._context.model.validateModelPosition({
                    lineNumber: zone.afterLineNumber,
                    column: zone.afterColumn
                });
            }
            else {
                const validAfterLineNumber = this._context.model.validateModelPosition({
                    lineNumber: zone.afterLineNumber,
                    column: 1
                }).lineNumber;
                zoneAfterModelPosition = new position_1.Position(validAfterLineNumber, this._context.model.getModelLineMaxColumn(validAfterLineNumber));
            }
            let zoneBeforeModelPosition;
            if (zoneAfterModelPosition.column === this._context.model.getModelLineMaxColumn(zoneAfterModelPosition.lineNumber)) {
                zoneBeforeModelPosition = this._context.model.validateModelPosition({
                    lineNumber: zoneAfterModelPosition.lineNumber + 1,
                    column: 1
                });
            }
            else {
                zoneBeforeModelPosition = this._context.model.validateModelPosition({
                    lineNumber: zoneAfterModelPosition.lineNumber,
                    column: zoneAfterModelPosition.column + 1
                });
            }
            const viewPosition = this._context.model.coordinatesConverter.convertModelPositionToViewPosition(zoneAfterModelPosition);
            const isVisible = this._context.model.coordinatesConverter.modelPositionIsVisible(zoneBeforeModelPosition);
            return {
                afterViewLineNumber: viewPosition.lineNumber,
                heightInPx: (isVisible ? this._heightInPixels(zone) : 0),
                minWidthInPx: this._minWidthInPixels(zone)
            };
        }
        addZone(zone) {
            const props = this._computeWhitespaceProps(zone);
            const whitespaceId = this._context.viewLayout.addWhitespace(props.afterViewLineNumber, this._getZoneOrdinal(zone), props.heightInPx, props.minWidthInPx);
            const myZone = {
                whitespaceId: whitespaceId,
                delegate: zone,
                isVisible: false,
                domNode: fastDomNode_1.createFastDomNode(zone.domNode),
                marginDomNode: zone.marginDomNode ? fastDomNode_1.createFastDomNode(zone.marginDomNode) : null
            };
            this._safeCallOnComputedHeight(myZone.delegate, props.heightInPx);
            myZone.domNode.setPosition('absolute');
            myZone.domNode.domNode.style.width = '100%';
            myZone.domNode.setDisplay('none');
            myZone.domNode.setAttribute('monaco-view-zone', myZone.whitespaceId);
            this.domNode.appendChild(myZone.domNode);
            if (myZone.marginDomNode) {
                myZone.marginDomNode.setPosition('absolute');
                myZone.marginDomNode.domNode.style.width = '100%';
                myZone.marginDomNode.setDisplay('none');
                myZone.marginDomNode.setAttribute('monaco-view-zone', myZone.whitespaceId);
                this.marginDomNode.appendChild(myZone.marginDomNode);
            }
            this._zones[myZone.whitespaceId] = myZone;
            this.setShouldRender();
            return myZone.whitespaceId;
        }
        removeZone(id) {
            if (this._zones.hasOwnProperty(id)) {
                const zone = this._zones[id];
                delete this._zones[id];
                this._context.viewLayout.removeWhitespace(zone.whitespaceId);
                zone.domNode.removeAttribute('monaco-visible-view-zone');
                zone.domNode.removeAttribute('monaco-view-zone');
                zone.domNode.domNode.parentNode.removeChild(zone.domNode.domNode);
                if (zone.marginDomNode) {
                    zone.marginDomNode.removeAttribute('monaco-visible-view-zone');
                    zone.marginDomNode.removeAttribute('monaco-view-zone');
                    zone.marginDomNode.domNode.parentNode.removeChild(zone.marginDomNode.domNode);
                }
                this.setShouldRender();
                return true;
            }
            return false;
        }
        layoutZone(id) {
            let changed = false;
            if (this._zones.hasOwnProperty(id)) {
                const zone = this._zones[id];
                const props = this._computeWhitespaceProps(zone.delegate);
                // const newOrdinal = this._getZoneOrdinal(zone.delegate);
                changed = this._context.viewLayout.changeWhitespace(zone.whitespaceId, props.afterViewLineNumber, props.heightInPx) || changed;
                // TODO@Alex: change `newOrdinal` too
                if (changed) {
                    this._safeCallOnComputedHeight(zone.delegate, props.heightInPx);
                    this.setShouldRender();
                }
            }
            return changed;
        }
        shouldSuppressMouseDownOnViewZone(id) {
            if (this._zones.hasOwnProperty(id)) {
                const zone = this._zones[id];
                return Boolean(zone.delegate.suppressMouseDown);
            }
            return false;
        }
        _heightInPixels(zone) {
            if (typeof zone.heightInPx === 'number') {
                return zone.heightInPx;
            }
            if (typeof zone.heightInLines === 'number') {
                return this._lineHeight * zone.heightInLines;
            }
            return this._lineHeight;
        }
        _minWidthInPixels(zone) {
            if (typeof zone.minWidthInPx === 'number') {
                return zone.minWidthInPx;
            }
            return 0;
        }
        _safeCallOnComputedHeight(zone, height) {
            if (typeof zone.onComputedHeight === 'function') {
                try {
                    zone.onComputedHeight(height);
                }
                catch (e) {
                    errors_1.onUnexpectedError(e);
                }
            }
        }
        _safeCallOnDomNodeTop(zone, top) {
            if (typeof zone.onDomNodeTop === 'function') {
                try {
                    zone.onDomNodeTop(top);
                }
                catch (e) {
                    errors_1.onUnexpectedError(e);
                }
            }
        }
        prepareRender(ctx) {
            // Nothing to read
        }
        render(ctx) {
            const visibleWhitespaces = ctx.viewportData.whitespaceViewportData;
            const visibleZones = {};
            let hasVisibleZone = false;
            for (let i = 0, len = visibleWhitespaces.length; i < len; i++) {
                visibleZones[visibleWhitespaces[i].id] = visibleWhitespaces[i];
                hasVisibleZone = true;
            }
            const keys = Object.keys(this._zones);
            for (let i = 0, len = keys.length; i < len; i++) {
                const id = keys[i];
                const zone = this._zones[id];
                let newTop = 0;
                let newHeight = 0;
                let newDisplay = 'none';
                if (visibleZones.hasOwnProperty(id)) {
                    newTop = visibleZones[id].verticalOffset - ctx.bigNumbersDelta;
                    newHeight = visibleZones[id].height;
                    newDisplay = 'block';
                    // zone is visible
                    if (!zone.isVisible) {
                        zone.domNode.setAttribute('monaco-visible-view-zone', 'true');
                        zone.isVisible = true;
                    }
                    this._safeCallOnDomNodeTop(zone.delegate, ctx.getScrolledTopFromAbsoluteTop(visibleZones[id].verticalOffset));
                }
                else {
                    if (zone.isVisible) {
                        zone.domNode.removeAttribute('monaco-visible-view-zone');
                        zone.isVisible = false;
                    }
                    this._safeCallOnDomNodeTop(zone.delegate, ctx.getScrolledTopFromAbsoluteTop(-1000000));
                }
                zone.domNode.setTop(newTop);
                zone.domNode.setHeight(newHeight);
                zone.domNode.setDisplay(newDisplay);
                if (zone.marginDomNode) {
                    zone.marginDomNode.setTop(newTop);
                    zone.marginDomNode.setHeight(newHeight);
                    zone.marginDomNode.setDisplay(newDisplay);
                }
            }
            if (hasVisibleZone) {
                this.domNode.setWidth(Math.max(ctx.scrollWidth, this._contentWidth));
                this.marginDomNode.setWidth(this._contentLeft);
            }
        }
    }
    exports.ViewZones = ViewZones;
});
//# sourceMappingURL=viewZones.js.map