/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/services/modeService", "vs/editor/contrib/hover/modesContentHover", "vs/editor/contrib/hover/modesGlyphHover", "vs/platform/opener/common/opener", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/editor/common/services/markersDecorationService", "vs/platform/keybinding/common/keybinding", "vs/css!./hover"], function (require, exports, nls, keyCodes_1, lifecycle_1, editorExtensions_1, range_1, editorContextKeys_1, modeService_1, modesContentHover_1, modesGlyphHover_1, opener_1, colorRegistry_1, themeService_1, markersDecorationService_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ModesHoverController = class ModesHoverController {
        constructor(_editor, _openerService, _modeService, _markerDecorationsService, _keybindingService, _themeService) {
            this._editor = _editor;
            this._openerService = _openerService;
            this._modeService = _modeService;
            this._markerDecorationsService = _markerDecorationsService;
            this._keybindingService = _keybindingService;
            this._themeService = _themeService;
            this._toUnhook = new lifecycle_1.DisposableStore();
            this._isMouseDown = false;
            this._hoverClicked = false;
            this._contentWidget = null;
            this._glyphWidget = null;
            this._hookEvents();
            this._didChangeConfigurationHandler = this._editor.onDidChangeConfiguration((e) => {
                if (e.contribInfo) {
                    this._hideWidgets();
                    this._unhookEvents();
                    this._hookEvents();
                }
            });
        }
        get contentWidget() {
            if (!this._contentWidget) {
                this._createHoverWidgets();
            }
            return this._contentWidget;
        }
        get glyphWidget() {
            if (!this._glyphWidget) {
                this._createHoverWidgets();
            }
            return this._glyphWidget;
        }
        static get(editor) {
            return editor.getContribution(ModesHoverController.ID);
        }
        _hookEvents() {
            const hideWidgetsEventHandler = () => this._hideWidgets();
            const hoverOpts = this._editor.getConfiguration().contribInfo.hover;
            this._isHoverEnabled = hoverOpts.enabled;
            this._isHoverSticky = hoverOpts.sticky;
            if (this._isHoverEnabled) {
                this._toUnhook.add(this._editor.onMouseDown((e) => this._onEditorMouseDown(e)));
                this._toUnhook.add(this._editor.onMouseUp((e) => this._onEditorMouseUp(e)));
                this._toUnhook.add(this._editor.onMouseMove((e) => this._onEditorMouseMove(e)));
                this._toUnhook.add(this._editor.onKeyDown((e) => this._onKeyDown(e)));
                this._toUnhook.add(this._editor.onDidChangeModelDecorations(() => this._onModelDecorationsChanged()));
            }
            else {
                this._toUnhook.add(this._editor.onMouseMove(hideWidgetsEventHandler));
            }
            this._toUnhook.add(this._editor.onMouseLeave(hideWidgetsEventHandler));
            this._toUnhook.add(this._editor.onDidChangeModel(hideWidgetsEventHandler));
            this._toUnhook.add(this._editor.onDidScrollChange((e) => this._onEditorScrollChanged(e)));
        }
        _unhookEvents() {
            this._toUnhook.clear();
        }
        _onModelDecorationsChanged() {
            this.contentWidget.onModelDecorationsChanged();
            this.glyphWidget.onModelDecorationsChanged();
        }
        _onEditorScrollChanged(e) {
            if (e.scrollTopChanged || e.scrollLeftChanged) {
                this._hideWidgets();
            }
        }
        _onEditorMouseDown(mouseEvent) {
            this._isMouseDown = true;
            const targetType = mouseEvent.target.type;
            if (targetType === 9 /* CONTENT_WIDGET */ && mouseEvent.target.detail === modesContentHover_1.ModesContentHoverWidget.ID) {
                this._hoverClicked = true;
                // mouse down on top of content hover widget
                return;
            }
            if (targetType === 12 /* OVERLAY_WIDGET */ && mouseEvent.target.detail === modesGlyphHover_1.ModesGlyphHoverWidget.ID) {
                // mouse down on top of overlay hover widget
                return;
            }
            if (targetType !== 12 /* OVERLAY_WIDGET */ && mouseEvent.target.detail !== modesGlyphHover_1.ModesGlyphHoverWidget.ID) {
                this._hoverClicked = false;
            }
            this._hideWidgets();
        }
        _onEditorMouseUp(mouseEvent) {
            this._isMouseDown = false;
        }
        _onEditorMouseMove(mouseEvent) {
            // const this._editor.getConfiguration().contribInfo.hover.sticky;
            let targetType = mouseEvent.target.type;
            if (this._isMouseDown && this._hoverClicked && this.contentWidget.isColorPickerVisible()) {
                return;
            }
            if (this._isHoverSticky && targetType === 9 /* CONTENT_WIDGET */ && mouseEvent.target.detail === modesContentHover_1.ModesContentHoverWidget.ID) {
                // mouse moved on top of content hover widget
                return;
            }
            if (this._isHoverSticky && targetType === 12 /* OVERLAY_WIDGET */ && mouseEvent.target.detail === modesGlyphHover_1.ModesGlyphHoverWidget.ID) {
                // mouse moved on top of overlay hover widget
                return;
            }
            if (targetType === 7 /* CONTENT_EMPTY */) {
                const epsilon = this._editor.getConfiguration().fontInfo.typicalHalfwidthCharacterWidth / 2;
                const data = mouseEvent.target.detail;
                if (data && !data.isAfterLines && typeof data.horizontalDistanceToText === 'number' && data.horizontalDistanceToText < epsilon) {
                    // Let hover kick in even when the mouse is technically in the empty area after a line, given the distance is small enough
                    targetType = 6 /* CONTENT_TEXT */;
                }
            }
            if (targetType === 6 /* CONTENT_TEXT */) {
                this.glyphWidget.hide();
                if (this._isHoverEnabled && mouseEvent.target.range) {
                    this.contentWidget.startShowingAt(mouseEvent.target.range, 0 /* Delayed */, false);
                }
            }
            else if (targetType === 2 /* GUTTER_GLYPH_MARGIN */) {
                this.contentWidget.hide();
                if (this._isHoverEnabled && mouseEvent.target.position) {
                    this.glyphWidget.startShowingAt(mouseEvent.target.position.lineNumber);
                }
            }
            else {
                this._hideWidgets();
            }
        }
        _onKeyDown(e) {
            if (e.keyCode !== 5 /* Ctrl */ && e.keyCode !== 6 /* Alt */ && e.keyCode !== 57 /* Meta */ && e.keyCode !== 4 /* Shift */) {
                // Do not hide hover when a modifier key is pressed
                this._hideWidgets();
            }
        }
        _hideWidgets() {
            if (!this._glyphWidget || !this._contentWidget || (this._isMouseDown && this._hoverClicked && this._contentWidget.isColorPickerVisible())) {
                return;
            }
            this._glyphWidget.hide();
            this._contentWidget.hide();
        }
        _createHoverWidgets() {
            this._contentWidget = new modesContentHover_1.ModesContentHoverWidget(this._editor, this._markerDecorationsService, this._themeService, this._keybindingService, this._modeService, this._openerService);
            this._glyphWidget = new modesGlyphHover_1.ModesGlyphHoverWidget(this._editor, this._modeService, this._openerService);
        }
        showContentHover(range, mode, focus) {
            this.contentWidget.startShowingAt(range, mode, focus);
        }
        getId() {
            return ModesHoverController.ID;
        }
        dispose() {
            this._unhookEvents();
            this._toUnhook.dispose();
            this._didChangeConfigurationHandler.dispose();
            if (this._glyphWidget) {
                this._glyphWidget.dispose();
            }
            if (this._contentWidget) {
                this._contentWidget.dispose();
            }
        }
    };
    ModesHoverController.ID = 'editor.contrib.hover';
    ModesHoverController = __decorate([
        __param(1, opener_1.IOpenerService),
        __param(2, modeService_1.IModeService),
        __param(3, markersDecorationService_1.IMarkerDecorationsService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, themeService_1.IThemeService)
    ], ModesHoverController);
    exports.ModesHoverController = ModesHoverController;
    class ShowHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.showHover',
                label: nls.localize({
                    key: 'showHover',
                    comment: [
                        'Label for action that will trigger the showing of a hover in the editor.',
                        'This allows for users to show the hover without using the mouse.'
                    ]
                }, "Show Hover"),
                alias: 'Show Hover',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 39 /* KEY_I */),
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            let controller = ModesHoverController.get(editor);
            if (!controller) {
                return;
            }
            const position = editor.getPosition();
            const range = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column);
            const focus = editor.getConfiguration().accessibilitySupport === 2 /* Enabled */;
            controller.showContentHover(range, 1 /* Immediate */, focus);
        }
    }
    editorExtensions_1.registerEditorContribution(ModesHoverController);
    editorExtensions_1.registerEditorAction(ShowHoverAction);
    // theming
    themeService_1.registerThemingParticipant((theme, collector) => {
        const editorHoverHighlightColor = theme.getColor(colorRegistry_1.editorHoverHighlight);
        if (editorHoverHighlightColor) {
            collector.addRule(`.monaco-editor .hoverHighlight { background-color: ${editorHoverHighlightColor}; }`);
        }
        const hoverBackground = theme.getColor(colorRegistry_1.editorHoverBackground);
        if (hoverBackground) {
            collector.addRule(`.monaco-editor .monaco-editor-hover { background-color: ${hoverBackground}; }`);
        }
        const hoverBorder = theme.getColor(colorRegistry_1.editorHoverBorder);
        if (hoverBorder) {
            collector.addRule(`.monaco-editor .monaco-editor-hover { border: 1px solid ${hoverBorder}; }`);
            collector.addRule(`.monaco-editor .monaco-editor-hover .hover-row:not(:first-child):not(:empty) { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.monaco-editor .monaco-editor-hover hr { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.monaco-editor .monaco-editor-hover hr { border-bottom: 0px solid ${hoverBorder.transparent(0.5)}; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.monaco-editor .monaco-editor-hover a { color: ${link}; }`);
        }
        const actionsBackground = theme.getColor(colorRegistry_1.editorHoverStatusBarBackground);
        if (actionsBackground) {
            collector.addRule(`.monaco-editor .monaco-editor-hover .hover-row .actions { background-color: ${actionsBackground}; }`);
        }
        const codeBackground = theme.getColor(colorRegistry_1.textCodeBlockBackground);
        if (codeBackground) {
            collector.addRule(`.monaco-editor .monaco-editor-hover code { background-color: ${codeBackground}; }`);
        }
    });
});
//# sourceMappingURL=hover.js.map