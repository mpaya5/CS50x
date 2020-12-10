/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/editor/browser/view/viewPart", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./scrollDecoration"], function (require, exports, fastDomNode_1, viewPart_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ScrollDecorationViewPart extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this._scrollTop = 0;
            this._width = 0;
            this._updateWidth();
            this._shouldShow = false;
            this._useShadows = this._context.configuration.editor.viewInfo.scrollbar.useShadows;
            this._domNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._domNode.setAttribute('role', 'presentation');
            this._domNode.setAttribute('aria-hidden', 'true');
        }
        dispose() {
            super.dispose();
        }
        _updateShouldShow() {
            const newShouldShow = (this._useShadows && this._scrollTop > 0);
            if (this._shouldShow !== newShouldShow) {
                this._shouldShow = newShouldShow;
                return true;
            }
            return false;
        }
        getDomNode() {
            return this._domNode;
        }
        _updateWidth() {
            const layoutInfo = this._context.configuration.editor.layoutInfo;
            let newWidth = 0;
            if (layoutInfo.renderMinimap === 0 || (layoutInfo.minimapWidth > 0 && layoutInfo.minimapLeft === 0)) {
                newWidth = layoutInfo.width;
            }
            else {
                newWidth = layoutInfo.width - layoutInfo.minimapWidth - layoutInfo.verticalScrollbarWidth;
            }
            if (this._width !== newWidth) {
                this._width = newWidth;
                return true;
            }
            return false;
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            let shouldRender = false;
            if (e.viewInfo) {
                this._useShadows = this._context.configuration.editor.viewInfo.scrollbar.useShadows;
            }
            if (e.layoutInfo) {
                shouldRender = this._updateWidth();
            }
            return this._updateShouldShow() || shouldRender;
        }
        onScrollChanged(e) {
            this._scrollTop = e.scrollTop;
            return this._updateShouldShow();
        }
        // --- end event handlers
        prepareRender(ctx) {
            // Nothing to read
        }
        render(ctx) {
            this._domNode.setWidth(this._width);
            this._domNode.setClassName(this._shouldShow ? 'scroll-decoration' : '');
        }
    }
    exports.ScrollDecorationViewPart = ScrollDecorationViewPart;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const shadow = theme.getColor(colorRegistry_1.scrollbarShadow);
        if (shadow) {
            collector.addRule(`.monaco-editor .scroll-decoration { box-shadow: ${shadow} 0 6px 6px -6px inset; }`);
        }
    });
});
//# sourceMappingURL=scrollDecoration.js.map