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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/globalMouseMoveMonitor", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/model/textModel", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/css!./lightBulbWidget"], function (require, exports, dom, globalMouseMoveMonitor_1, event_1, lifecycle_1, textModel_1, nls, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LightBulbState;
    (function (LightBulbState) {
        let Type;
        (function (Type) {
            Type[Type["Hidden"] = 0] = "Hidden";
            Type[Type["Showing"] = 1] = "Showing";
        })(Type = LightBulbState.Type || (LightBulbState.Type = {}));
        LightBulbState.Hidden = new class {
            constructor() {
                this.type = 0 /* Hidden */;
            }
        };
        class Showing {
            constructor(actions, editorPosition, widgetPosition) {
                this.actions = actions;
                this.editorPosition = editorPosition;
                this.widgetPosition = widgetPosition;
                this.type = 1 /* Showing */;
            }
        }
        LightBulbState.Showing = Showing;
    })(LightBulbState || (LightBulbState = {}));
    let LightBulbWidget = class LightBulbWidget extends lifecycle_1.Disposable {
        constructor(_editor, _quickFixActionId, _keybindingService) {
            super();
            this._editor = _editor;
            this._quickFixActionId = _quickFixActionId;
            this._keybindingService = _keybindingService;
            this._onClick = this._register(new event_1.Emitter());
            this.onClick = this._onClick.event;
            this._state = LightBulbState.Hidden;
            this._domNode = document.createElement('div');
            this._domNode.className = 'lightbulb-glyph';
            this._editor.addContentWidget(this);
            this._register(this._editor.onDidChangeModelContent(_ => {
                // cancel when the line in question has been removed
                const editorModel = this._editor.getModel();
                if (this._state.type !== 1 /* Showing */ || !editorModel || this._state.editorPosition.lineNumber >= editorModel.getLineCount()) {
                    this.hide();
                }
            }));
            this._register(dom.addStandardDisposableListener(this._domNode, 'mousedown', e => {
                if (this._state.type !== 1 /* Showing */) {
                    return;
                }
                // Make sure that focus / cursor location is not lost when clicking widget icon
                this._editor.focus();
                e.preventDefault();
                // a bit of extra work to make sure the menu
                // doesn't cover the line-text
                const { top, height } = dom.getDomNodePagePosition(this._domNode);
                const { lineHeight } = this._editor.getConfiguration();
                let pad = Math.floor(lineHeight / 3);
                if (this._state.widgetPosition.position !== null && this._state.widgetPosition.position.lineNumber < this._state.editorPosition.lineNumber) {
                    pad += lineHeight;
                }
                this._onClick.fire({
                    x: e.posx,
                    y: top + height + pad,
                    actions: this._state.actions
                });
            }));
            this._register(dom.addDisposableListener(this._domNode, 'mouseenter', (e) => {
                if ((e.buttons & 1) !== 1) {
                    return;
                }
                // mouse enters lightbulb while the primary/left button
                // is being pressed -> hide the lightbulb and block future
                // showings until mouse is released
                this.hide();
                const monitor = new globalMouseMoveMonitor_1.GlobalMouseMoveMonitor();
                monitor.startMonitoring(globalMouseMoveMonitor_1.standardMouseMoveMerger, () => { }, () => {
                    monitor.dispose();
                });
            }));
            this._register(this._editor.onDidChangeConfiguration(e => {
                // hide when told to do so
                if (e.contribInfo && !this._editor.getConfiguration().contribInfo.lightbulbEnabled) {
                    this.hide();
                }
            }));
            this._updateLightBulbTitle();
            this._register(this._keybindingService.onDidUpdateKeybindings(this._updateLightBulbTitle, this));
        }
        dispose() {
            super.dispose();
            this._editor.removeContentWidget(this);
        }
        getId() {
            return 'LightBulbWidget';
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return this._state.type === 1 /* Showing */ ? this._state.widgetPosition : null;
        }
        update(actions, atPosition) {
            if (actions.actions.length <= 0) {
                return this.hide();
            }
            const config = this._editor.getConfiguration();
            if (!config.contribInfo.lightbulbEnabled) {
                return this.hide();
            }
            const { lineNumber, column } = atPosition;
            const model = this._editor.getModel();
            if (!model) {
                return this.hide();
            }
            const tabSize = model.getOptions().tabSize;
            const lineContent = model.getLineContent(lineNumber);
            const indent = textModel_1.TextModel.computeIndentLevel(lineContent, tabSize);
            const lineHasSpace = config.fontInfo.spaceWidth * indent > 22;
            const isFolded = (lineNumber) => {
                return lineNumber > 2 && this._editor.getTopForLineNumber(lineNumber) === this._editor.getTopForLineNumber(lineNumber - 1);
            };
            let effectiveLineNumber = lineNumber;
            if (!lineHasSpace) {
                if (lineNumber > 1 && !isFolded(lineNumber - 1)) {
                    effectiveLineNumber -= 1;
                }
                else if (!isFolded(lineNumber + 1)) {
                    effectiveLineNumber += 1;
                }
                else if (column * config.fontInfo.spaceWidth < 22) {
                    // cannot show lightbulb above/below and showing
                    // it inline would overlay the cursor...
                    return this.hide();
                }
            }
            this._state = new LightBulbState.Showing(actions, atPosition, {
                position: { lineNumber: effectiveLineNumber, column: 1 },
                preference: LightBulbWidget._posPref
            });
            dom.toggleClass(this._domNode, 'autofixable', actions.hasAutoFix);
            this._editor.layoutContentWidget(this);
        }
        set title(value) {
            this._domNode.title = value;
        }
        hide() {
            this._state = LightBulbState.Hidden;
            this._editor.layoutContentWidget(this);
        }
        _updateLightBulbTitle() {
            const kb = this._keybindingService.lookupKeybinding(this._quickFixActionId);
            let title;
            if (kb) {
                title = nls.localize('quickFixWithKb', "Show Fixes ({0})", kb.getLabel());
            }
            else {
                title = nls.localize('quickFix', "Show Fixes");
            }
            this.title = title;
        }
    };
    LightBulbWidget._posPref = [0 /* EXACT */];
    LightBulbWidget = __decorate([
        __param(2, keybinding_1.IKeybindingService)
    ], LightBulbWidget);
    exports.LightBulbWidget = LightBulbWidget;
});
//# sourceMappingURL=lightBulbWidget.js.map