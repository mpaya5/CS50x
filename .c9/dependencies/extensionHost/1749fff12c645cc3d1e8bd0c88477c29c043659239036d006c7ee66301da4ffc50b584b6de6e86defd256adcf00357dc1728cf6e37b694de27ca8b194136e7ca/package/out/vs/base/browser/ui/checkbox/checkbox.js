/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/widget", "vs/base/common/color", "vs/base/common/event", "vs/base/common/objects", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/lifecycle", "vs/css!./checkbox"], function (require, exports, DOM, widget_1, color_1, event_1, objects, actionbar_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const defaultOpts = {
        inputActiveOptionBorder: color_1.Color.fromHex('#007ACC00'),
        inputActiveOptionBackground: color_1.Color.fromHex('#0E639C50')
    };
    class CheckboxActionViewItem extends actionbar_1.BaseActionViewItem {
        constructor() {
            super(...arguments);
            this.disposables = new lifecycle_1.DisposableStore();
        }
        render(container) {
            this.element = container;
            this.disposables.clear();
            this.checkbox = new Checkbox({
                actionClassName: this._action.class,
                isChecked: this._action.checked,
                title: this._action.label
            });
            this.disposables.add(this.checkbox);
            this.disposables.add(this.checkbox.onChange(() => this._action.checked = this.checkbox.checked, this));
            this.element.appendChild(this.checkbox.domNode);
        }
        updateEnabled() {
            if (this.checkbox) {
                if (this.isEnabled()) {
                    this.checkbox.enable();
                }
                else {
                    this.checkbox.disable();
                }
            }
        }
        updateChecked() {
            if (this.checkbox) {
                this.checkbox.checked = this._action.checked;
            }
        }
        dispose() {
            this.disposables.dispose();
            super.dispose();
        }
    }
    exports.CheckboxActionViewItem = CheckboxActionViewItem;
    class Checkbox extends widget_1.Widget {
        constructor(opts) {
            super();
            this._onChange = this._register(new event_1.Emitter());
            this.onChange = this._onChange.event;
            this._onKeyDown = this._register(new event_1.Emitter());
            this.onKeyDown = this._onKeyDown.event;
            this._opts = objects.deepClone(opts);
            objects.mixin(this._opts, defaultOpts, false);
            this._checked = this._opts.isChecked;
            this.domNode = document.createElement('div');
            this.domNode.title = this._opts.title;
            this.domNode.className = 'monaco-custom-checkbox ' + (this._opts.actionClassName || '') + ' ' + (this._checked ? 'checked' : 'unchecked');
            this.domNode.tabIndex = 0;
            this.domNode.setAttribute('role', 'checkbox');
            this.domNode.setAttribute('aria-checked', String(this._checked));
            this.domNode.setAttribute('aria-label', this._opts.title);
            this.applyStyles();
            this.onclick(this.domNode, (ev) => {
                this.checked = !this._checked;
                this._onChange.fire(false);
                ev.preventDefault();
            });
            this.onkeydown(this.domNode, (keyboardEvent) => {
                if (keyboardEvent.keyCode === 10 /* Space */ || keyboardEvent.keyCode === 3 /* Enter */) {
                    this.checked = !this._checked;
                    this._onChange.fire(true);
                    keyboardEvent.preventDefault();
                    return;
                }
                this._onKeyDown.fire(keyboardEvent);
            });
        }
        get enabled() {
            return this.domNode.getAttribute('aria-disabled') !== 'true';
        }
        focus() {
            this.domNode.focus();
        }
        get checked() {
            return this._checked;
        }
        set checked(newIsChecked) {
            this._checked = newIsChecked;
            this.domNode.setAttribute('aria-checked', String(this._checked));
            if (this._checked) {
                this.domNode.classList.add('checked');
            }
            else {
                this.domNode.classList.remove('checked');
            }
            this.applyStyles();
        }
        width() {
            return 2 /*marginleft*/ + 2 /*border*/ + 2 /*padding*/ + 16 /* icon width */;
        }
        style(styles) {
            if (styles.inputActiveOptionBorder) {
                this._opts.inputActiveOptionBorder = styles.inputActiveOptionBorder;
            }
            if (styles.inputActiveOptionBackground) {
                this._opts.inputActiveOptionBackground = styles.inputActiveOptionBackground;
            }
            this.applyStyles();
        }
        applyStyles() {
            if (this.domNode) {
                this.domNode.style.borderColor = this._checked && this._opts.inputActiveOptionBorder ? this._opts.inputActiveOptionBorder.toString() : 'transparent';
                this.domNode.style.backgroundColor = this._checked && this._opts.inputActiveOptionBackground ? this._opts.inputActiveOptionBackground.toString() : 'transparent';
            }
        }
        enable() {
            this.domNode.tabIndex = 0;
            this.domNode.setAttribute('aria-disabled', String(false));
        }
        disable() {
            DOM.removeTabIndexAndUpdateFocus(this.domNode);
            this.domNode.setAttribute('aria-disabled', String(true));
        }
    }
    exports.Checkbox = Checkbox;
    class SimpleCheckbox extends widget_1.Widget {
        constructor(title, isChecked) {
            super();
            this.title = title;
            this.isChecked = isChecked;
            this.checkbox = new Checkbox({ title: this.title, isChecked: this.isChecked, actionClassName: 'monaco-simple-checkbox' });
            this.domNode = this.checkbox.domNode;
            this.styles = {};
            this.checkbox.onChange(() => {
                this.applyStyles();
            });
        }
        get checked() {
            return this.checkbox.checked;
        }
        set checked(newIsChecked) {
            this.checkbox.checked = newIsChecked;
            this.applyStyles();
        }
        style(styles) {
            this.styles = styles;
            this.applyStyles();
        }
        applyStyles() {
            this.domNode.style.color = this.styles.checkboxForeground ? this.styles.checkboxForeground.toString() : null;
            this.domNode.style.backgroundColor = this.styles.checkboxBackground ? this.styles.checkboxBackground.toString() : null;
            this.domNode.style.borderColor = this.styles.checkboxBorder ? this.styles.checkboxBorder.toString() : null;
        }
    }
    exports.SimpleCheckbox = SimpleCheckbox;
});
//# sourceMappingURL=checkbox.js.map