/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/editor/browser/view/viewPart", "vs/platform/theme/common/themeService"], function (require, exports, dom, fastDomNode_1, scrollableElement_1, viewPart_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EditorScrollbar extends viewPart_1.ViewPart {
        constructor(context, linesContent, viewDomNode, overflowGuardDomNode) {
            super(context);
            const editor = this._context.configuration.editor;
            const configScrollbarOpts = editor.viewInfo.scrollbar;
            const scrollbarOptions = {
                listenOnDomNode: viewDomNode.domNode,
                className: 'editor-scrollable' + ' ' + themeService_1.getThemeTypeSelector(context.theme.type),
                useShadows: false,
                lazyRender: true,
                vertical: configScrollbarOpts.vertical,
                horizontal: configScrollbarOpts.horizontal,
                verticalHasArrows: configScrollbarOpts.verticalHasArrows,
                horizontalHasArrows: configScrollbarOpts.horizontalHasArrows,
                verticalScrollbarSize: configScrollbarOpts.verticalScrollbarSize,
                verticalSliderSize: configScrollbarOpts.verticalSliderSize,
                horizontalScrollbarSize: configScrollbarOpts.horizontalScrollbarSize,
                horizontalSliderSize: configScrollbarOpts.horizontalSliderSize,
                handleMouseWheel: configScrollbarOpts.handleMouseWheel,
                arrowSize: configScrollbarOpts.arrowSize,
                mouseWheelScrollSensitivity: configScrollbarOpts.mouseWheelScrollSensitivity,
                fastScrollSensitivity: configScrollbarOpts.fastScrollSensitivity,
            };
            this.scrollbar = this._register(new scrollableElement_1.SmoothScrollableElement(linesContent.domNode, scrollbarOptions, this._context.viewLayout.scrollable));
            viewPart_1.PartFingerprints.write(this.scrollbar.getDomNode(), 5 /* ScrollableElement */);
            this.scrollbarDomNode = fastDomNode_1.createFastDomNode(this.scrollbar.getDomNode());
            this.scrollbarDomNode.setPosition('absolute');
            this._setLayout();
            // When having a zone widget that calls .focus() on one of its dom elements,
            // the browser will try desperately to reveal that dom node, unexpectedly
            // changing the .scrollTop of this.linesContent
            const onBrowserDesperateReveal = (domNode, lookAtScrollTop, lookAtScrollLeft) => {
                const newScrollPosition = {};
                if (lookAtScrollTop) {
                    const deltaTop = domNode.scrollTop;
                    if (deltaTop) {
                        newScrollPosition.scrollTop = this._context.viewLayout.getCurrentScrollTop() + deltaTop;
                        domNode.scrollTop = 0;
                    }
                }
                if (lookAtScrollLeft) {
                    const deltaLeft = domNode.scrollLeft;
                    if (deltaLeft) {
                        newScrollPosition.scrollLeft = this._context.viewLayout.getCurrentScrollLeft() + deltaLeft;
                        domNode.scrollLeft = 0;
                    }
                }
                this._context.viewLayout.setScrollPositionNow(newScrollPosition);
            };
            // I've seen this happen both on the view dom node & on the lines content dom node.
            this._register(dom.addDisposableListener(viewDomNode.domNode, 'scroll', (e) => onBrowserDesperateReveal(viewDomNode.domNode, true, true)));
            this._register(dom.addDisposableListener(linesContent.domNode, 'scroll', (e) => onBrowserDesperateReveal(linesContent.domNode, true, false)));
            this._register(dom.addDisposableListener(overflowGuardDomNode.domNode, 'scroll', (e) => onBrowserDesperateReveal(overflowGuardDomNode.domNode, true, false)));
            this._register(dom.addDisposableListener(this.scrollbarDomNode.domNode, 'scroll', (e) => onBrowserDesperateReveal(this.scrollbarDomNode.domNode, true, false)));
        }
        dispose() {
            super.dispose();
        }
        _setLayout() {
            const layoutInfo = this._context.configuration.editor.layoutInfo;
            this.scrollbarDomNode.setLeft(layoutInfo.contentLeft);
            const side = this._context.configuration.editor.viewInfo.minimap.side;
            if (side === 'right') {
                this.scrollbarDomNode.setWidth(layoutInfo.contentWidth + layoutInfo.minimapWidth);
            }
            else {
                this.scrollbarDomNode.setWidth(layoutInfo.contentWidth);
            }
            this.scrollbarDomNode.setHeight(layoutInfo.contentHeight);
        }
        getOverviewRulerLayoutInfo() {
            return this.scrollbar.getOverviewRulerLayoutInfo();
        }
        getDomNode() {
            return this.scrollbarDomNode;
        }
        delegateVerticalScrollbarMouseDown(browserEvent) {
            this.scrollbar.delegateVerticalScrollbarMouseDown(browserEvent);
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            if (e.viewInfo) {
                const editor = this._context.configuration.editor;
                const newOpts = {
                    handleMouseWheel: editor.viewInfo.scrollbar.handleMouseWheel,
                    mouseWheelScrollSensitivity: editor.viewInfo.scrollbar.mouseWheelScrollSensitivity,
                    fastScrollSensitivity: editor.viewInfo.scrollbar.fastScrollSensitivity
                };
                this.scrollbar.updateOptions(newOpts);
            }
            if (e.layoutInfo) {
                this._setLayout();
            }
            return true;
        }
        onScrollChanged(e) {
            return true;
        }
        onThemeChanged(e) {
            this.scrollbar.updateClassName('editor-scrollable' + ' ' + themeService_1.getThemeTypeSelector(this._context.theme.type));
            return true;
        }
        // --- end event handlers
        prepareRender(ctx) {
            // Nothing to do
        }
        render(ctx) {
            this.scrollbar.renderNow();
        }
    }
    exports.EditorScrollbar = EditorScrollbar;
});
//# sourceMappingURL=editorScrollbar.js.map