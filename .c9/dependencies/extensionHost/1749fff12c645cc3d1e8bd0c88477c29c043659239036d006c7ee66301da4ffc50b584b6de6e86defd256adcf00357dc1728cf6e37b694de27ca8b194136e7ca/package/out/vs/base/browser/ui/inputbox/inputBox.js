/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/formattedTextRenderer", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/event", "vs/base/browser/ui/widget", "vs/base/common/color", "vs/base/common/objects", "vs/base/common/history", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/browser/event", "vs/css!./inputBox"], function (require, exports, nls, Bal, dom, formattedTextRenderer_1, aria, actionbar_1, event_1, widget_1, color_1, objects_1, history_1, scrollableElement_1, event_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    var MessageType;
    (function (MessageType) {
        MessageType[MessageType["INFO"] = 1] = "INFO";
        MessageType[MessageType["WARNING"] = 2] = "WARNING";
        MessageType[MessageType["ERROR"] = 3] = "ERROR";
    })(MessageType = exports.MessageType || (exports.MessageType = {}));
    const defaultOpts = {
        inputBackground: color_1.Color.fromHex('#3C3C3C'),
        inputForeground: color_1.Color.fromHex('#CCCCCC'),
        inputValidationInfoBorder: color_1.Color.fromHex('#55AAFF'),
        inputValidationInfoBackground: color_1.Color.fromHex('#063B49'),
        inputValidationWarningBorder: color_1.Color.fromHex('#B89500'),
        inputValidationWarningBackground: color_1.Color.fromHex('#352A05'),
        inputValidationErrorBorder: color_1.Color.fromHex('#BE1100'),
        inputValidationErrorBackground: color_1.Color.fromHex('#5A1D1D')
    };
    class InputBox extends widget_1.Widget {
        constructor(container, contextViewProvider, options) {
            super();
            this.state = 'idle';
            this.maxHeight = Number.POSITIVE_INFINITY;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._onDidHeightChange = this._register(new event_1.Emitter());
            this.onDidHeightChange = this._onDidHeightChange.event;
            this.contextViewProvider = contextViewProvider;
            this.options = options || Object.create(null);
            objects_1.mixin(this.options, defaultOpts, false);
            this.message = null;
            this.placeholder = this.options.placeholder || '';
            this.ariaLabel = this.options.ariaLabel || '';
            this.inputBackground = this.options.inputBackground;
            this.inputForeground = this.options.inputForeground;
            this.inputBorder = this.options.inputBorder;
            this.inputValidationInfoBorder = this.options.inputValidationInfoBorder;
            this.inputValidationInfoBackground = this.options.inputValidationInfoBackground;
            this.inputValidationInfoForeground = this.options.inputValidationInfoForeground;
            this.inputValidationWarningBorder = this.options.inputValidationWarningBorder;
            this.inputValidationWarningBackground = this.options.inputValidationWarningBackground;
            this.inputValidationWarningForeground = this.options.inputValidationWarningForeground;
            this.inputValidationErrorBorder = this.options.inputValidationErrorBorder;
            this.inputValidationErrorBackground = this.options.inputValidationErrorBackground;
            this.inputValidationErrorForeground = this.options.inputValidationErrorForeground;
            if (this.options.validationOptions) {
                this.validation = this.options.validationOptions.validation;
            }
            this.element = dom.append(container, $('.monaco-inputbox.idle'));
            let tagName = this.options.flexibleHeight ? 'textarea' : 'input';
            let wrapper = dom.append(this.element, $('.wrapper'));
            this.input = dom.append(wrapper, $(tagName + '.input'));
            this.input.setAttribute('autocorrect', 'off');
            this.input.setAttribute('autocapitalize', 'off');
            this.input.setAttribute('spellcheck', 'false');
            this.onfocus(this.input, () => dom.addClass(this.element, 'synthetic-focus'));
            this.onblur(this.input, () => dom.removeClass(this.element, 'synthetic-focus'));
            if (this.options.flexibleHeight) {
                this.maxHeight = typeof this.options.flexibleMaxHeight === 'number' ? this.options.flexibleMaxHeight : Number.POSITIVE_INFINITY;
                this.mirror = dom.append(wrapper, $('div.mirror'));
                this.mirror.innerHTML = '&nbsp;';
                this.scrollableElement = new scrollableElement_1.ScrollableElement(this.element, { vertical: 1 /* Auto */ });
                if (this.options.flexibleWidth) {
                    this.input.setAttribute('wrap', 'off');
                    this.mirror.style.whiteSpace = 'pre';
                    this.mirror.style.wordWrap = 'initial';
                }
                dom.append(container, this.scrollableElement.getDomNode());
                this._register(this.scrollableElement);
                // from ScrollableElement to DOM
                this._register(this.scrollableElement.onScroll(e => this.input.scrollTop = e.scrollTop));
                const onSelectionChange = event_1.Event.filter(event_2.domEvent(document, 'selectionchange'), () => {
                    const selection = document.getSelection();
                    return !!selection && selection.anchorNode === wrapper;
                });
                // from DOM to ScrollableElement
                this._register(onSelectionChange(this.updateScrollDimensions, this));
                this._register(this.onDidHeightChange(this.updateScrollDimensions, this));
            }
            else {
                this.input.type = this.options.type || 'text';
                this.input.setAttribute('wrap', 'off');
            }
            if (this.ariaLabel) {
                this.input.setAttribute('aria-label', this.ariaLabel);
            }
            if (this.placeholder) {
                this.setPlaceHolder(this.placeholder);
            }
            this.oninput(this.input, () => this.onValueChange());
            this.onblur(this.input, () => this.onBlur());
            this.onfocus(this.input, () => this.onFocus());
            // Add placeholder shim for IE because IE decides to hide the placeholder on focus (we dont want that!)
            if (this.placeholder && Bal.isIE) {
                this.onclick(this.input, (e) => {
                    dom.EventHelper.stop(e, true);
                    this.input.focus();
                });
            }
            setTimeout(() => {
                if (!this.input) {
                    return;
                }
                this.updateMirror();
            }, 0);
            // Support actions
            if (this.options.actions) {
                this.actionbar = this._register(new actionbar_1.ActionBar(this.element));
                this.actionbar.push(this.options.actions, { icon: true, label: false });
            }
            this.applyStyles();
        }
        onBlur() {
            this._hideMessage();
        }
        onFocus() {
            this._showMessage();
        }
        setPlaceHolder(placeHolder) {
            if (this.input) {
                this.input.setAttribute('placeholder', placeHolder);
                this.input.title = placeHolder;
            }
        }
        setAriaLabel(label) {
            this.ariaLabel = label;
            if (this.input) {
                if (label) {
                    this.input.setAttribute('aria-label', this.ariaLabel);
                }
                else {
                    this.input.removeAttribute('aria-label');
                }
            }
        }
        get mirrorElement() {
            return this.mirror;
        }
        get inputElement() {
            return this.input;
        }
        get value() {
            return this.input.value;
        }
        set value(newValue) {
            if (this.input.value !== newValue) {
                this.input.value = newValue;
                this.onValueChange();
            }
        }
        get height() {
            return typeof this.cachedHeight === 'number' ? this.cachedHeight : dom.getTotalHeight(this.element);
        }
        focus() {
            this.input.focus();
        }
        blur() {
            this.input.blur();
        }
        hasFocus() {
            return document.activeElement === this.input;
        }
        select(range = null) {
            this.input.select();
            if (range) {
                this.input.setSelectionRange(range.start, range.end);
            }
        }
        enable() {
            this.input.removeAttribute('disabled');
        }
        disable() {
            this.input.disabled = true;
            this._hideMessage();
        }
        setEnabled(enabled) {
            if (enabled) {
                this.enable();
            }
            else {
                this.disable();
            }
        }
        get width() {
            return dom.getTotalWidth(this.input);
        }
        set width(width) {
            if (this.options.flexibleHeight && this.options.flexibleWidth) {
                // textarea with horizontal scrolling
                let horizontalPadding = 0;
                if (this.mirror) {
                    const paddingLeft = parseFloat(this.mirror.style.paddingLeft || '') || 0;
                    const paddingRight = parseFloat(this.mirror.style.paddingRight || '') || 0;
                    horizontalPadding = paddingLeft + paddingRight;
                }
                this.input.style.width = (width - horizontalPadding) + 'px';
            }
            else {
                this.input.style.width = width + 'px';
            }
            if (this.mirror) {
                this.mirror.style.width = width + 'px';
            }
        }
        set paddingRight(paddingRight) {
            if (this.options.flexibleHeight && this.options.flexibleWidth) {
                this.input.style.width = `calc(100% - ${paddingRight}px)`;
            }
            else {
                this.input.style.paddingRight = paddingRight + 'px';
            }
            if (this.mirror) {
                this.mirror.style.paddingRight = paddingRight + 'px';
            }
        }
        updateScrollDimensions() {
            if (typeof this.cachedContentHeight !== 'number' || typeof this.cachedHeight !== 'number') {
                return;
            }
            const scrollHeight = this.cachedContentHeight;
            const height = this.cachedHeight;
            const scrollTop = this.input.scrollTop;
            this.scrollableElement.setScrollDimensions({ scrollHeight, height });
            this.scrollableElement.setScrollPosition({ scrollTop });
        }
        showMessage(message, force) {
            this.message = message;
            dom.removeClass(this.element, 'idle');
            dom.removeClass(this.element, 'info');
            dom.removeClass(this.element, 'warning');
            dom.removeClass(this.element, 'error');
            dom.addClass(this.element, this.classForType(message.type));
            const styles = this.stylesForType(this.message.type);
            this.element.style.border = styles.border ? `1px solid ${styles.border}` : null;
            // ARIA Support
            let alertText;
            if (message.type === 3 /* ERROR */) {
                alertText = nls.localize('alertErrorMessage', "Error: {0}", message.content);
            }
            else if (message.type === 2 /* WARNING */) {
                alertText = nls.localize('alertWarningMessage', "Warning: {0}", message.content);
            }
            else {
                alertText = nls.localize('alertInfoMessage', "Info: {0}", message.content);
            }
            aria.alert(alertText);
            if (this.hasFocus() || force) {
                this._showMessage();
            }
        }
        hideMessage() {
            this.message = null;
            dom.removeClass(this.element, 'info');
            dom.removeClass(this.element, 'warning');
            dom.removeClass(this.element, 'error');
            dom.addClass(this.element, 'idle');
            this._hideMessage();
            this.applyStyles();
        }
        isInputValid() {
            return !!this.validation && !this.validation(this.value);
        }
        validate() {
            let errorMsg = null;
            if (this.validation) {
                errorMsg = this.validation(this.value);
                if (errorMsg) {
                    this.inputElement.setAttribute('aria-invalid', 'true');
                    this.showMessage(errorMsg);
                }
                else if (this.inputElement.hasAttribute('aria-invalid')) {
                    this.inputElement.removeAttribute('aria-invalid');
                    this.hideMessage();
                }
            }
            return !errorMsg;
        }
        stylesForType(type) {
            switch (type) {
                case 1 /* INFO */: return { border: this.inputValidationInfoBorder, background: this.inputValidationInfoBackground, foreground: this.inputValidationInfoForeground };
                case 2 /* WARNING */: return { border: this.inputValidationWarningBorder, background: this.inputValidationWarningBackground, foreground: this.inputValidationWarningForeground };
                default: return { border: this.inputValidationErrorBorder, background: this.inputValidationErrorBackground, foreground: this.inputValidationErrorForeground };
            }
        }
        classForType(type) {
            switch (type) {
                case 1 /* INFO */: return 'info';
                case 2 /* WARNING */: return 'warning';
                default: return 'error';
            }
        }
        _showMessage() {
            if (!this.contextViewProvider || !this.message) {
                return;
            }
            let div;
            let layout = () => div.style.width = dom.getTotalWidth(this.element) + 'px';
            this.contextViewProvider.showContextView({
                getAnchor: () => this.element,
                anchorAlignment: 1 /* RIGHT */,
                render: (container) => {
                    if (!this.message) {
                        return null;
                    }
                    div = dom.append(container, $('.monaco-inputbox-container'));
                    layout();
                    const renderOptions = {
                        inline: true,
                        className: 'monaco-inputbox-message'
                    };
                    const spanElement = (this.message.formatContent
                        ? formattedTextRenderer_1.renderFormattedText(this.message.content, renderOptions)
                        : formattedTextRenderer_1.renderText(this.message.content, renderOptions));
                    dom.addClass(spanElement, this.classForType(this.message.type));
                    const styles = this.stylesForType(this.message.type);
                    spanElement.style.backgroundColor = styles.background ? styles.background.toString() : null;
                    spanElement.style.color = styles.foreground ? styles.foreground.toString() : null;
                    spanElement.style.border = styles.border ? `1px solid ${styles.border}` : null;
                    dom.append(div, spanElement);
                    return null;
                },
                onHide: () => {
                    this.state = 'closed';
                },
                layout: layout
            });
            this.state = 'open';
        }
        _hideMessage() {
            if (!this.contextViewProvider) {
                return;
            }
            if (this.state === 'open') {
                this.contextViewProvider.hideContextView();
            }
            this.state = 'idle';
        }
        onValueChange() {
            this._onDidChange.fire(this.value);
            this.validate();
            this.updateMirror();
            if (this.state === 'open' && this.contextViewProvider) {
                this.contextViewProvider.layout();
            }
        }
        updateMirror() {
            if (!this.mirror) {
                return;
            }
            const value = this.value || this.placeholder;
            const lastCharCode = value.charCodeAt(value.length - 1);
            const suffix = lastCharCode === 10 ? ' ' : '';
            const mirrorTextContent = value + suffix;
            if (mirrorTextContent) {
                this.mirror.textContent = value + suffix;
            }
            else {
                this.mirror.innerHTML = '&nbsp;';
            }
            this.layout();
        }
        style(styles) {
            this.inputBackground = styles.inputBackground;
            this.inputForeground = styles.inputForeground;
            this.inputBorder = styles.inputBorder;
            this.inputValidationInfoBackground = styles.inputValidationInfoBackground;
            this.inputValidationInfoForeground = styles.inputValidationInfoForeground;
            this.inputValidationInfoBorder = styles.inputValidationInfoBorder;
            this.inputValidationWarningBackground = styles.inputValidationWarningBackground;
            this.inputValidationWarningForeground = styles.inputValidationWarningForeground;
            this.inputValidationWarningBorder = styles.inputValidationWarningBorder;
            this.inputValidationErrorBackground = styles.inputValidationErrorBackground;
            this.inputValidationErrorForeground = styles.inputValidationErrorForeground;
            this.inputValidationErrorBorder = styles.inputValidationErrorBorder;
            this.applyStyles();
        }
        applyStyles() {
            if (this.element) {
                const background = this.inputBackground ? this.inputBackground.toString() : null;
                const foreground = this.inputForeground ? this.inputForeground.toString() : null;
                const border = this.inputBorder ? this.inputBorder.toString() : null;
                this.element.style.backgroundColor = background;
                this.element.style.color = foreground;
                this.input.style.backgroundColor = background;
                this.input.style.color = foreground;
                this.element.style.borderWidth = border ? '1px' : null;
                this.element.style.borderStyle = border ? 'solid' : null;
                this.element.style.borderColor = border;
            }
        }
        layout() {
            if (!this.mirror) {
                return;
            }
            const previousHeight = this.cachedContentHeight;
            this.cachedContentHeight = dom.getTotalHeight(this.mirror);
            if (previousHeight !== this.cachedContentHeight) {
                this.cachedHeight = Math.min(this.cachedContentHeight, this.maxHeight);
                this.input.style.height = this.cachedHeight + 'px';
                this._onDidHeightChange.fire(this.cachedContentHeight);
            }
        }
        dispose() {
            this._hideMessage();
            this.element = null; // StrictNullOverride: nulling out ok in dispose
            this.input = null; // StrictNullOverride: nulling out ok in dispose
            this.contextViewProvider = undefined;
            this.message = null;
            this.validation = undefined;
            this.state = null; // StrictNullOverride: nulling out ok in dispose
            this.actionbar = undefined;
            super.dispose();
        }
    }
    exports.InputBox = InputBox;
    class HistoryInputBox extends InputBox {
        constructor(container, contextViewProvider, options) {
            super(container, contextViewProvider, options);
            this.history = new history_1.HistoryNavigator(options.history, 100);
        }
        addToHistory() {
            if (this.value && this.value !== this.getCurrentValue()) {
                this.history.add(this.value);
            }
        }
        getHistory() {
            return this.history.getHistory();
        }
        showNextValue() {
            if (!this.history.has(this.value)) {
                this.addToHistory();
            }
            let next = this.getNextValue();
            if (next) {
                next = next === this.value ? this.getNextValue() : next;
            }
            if (next) {
                this.value = next;
                aria.status(this.value);
            }
        }
        showPreviousValue() {
            if (!this.history.has(this.value)) {
                this.addToHistory();
            }
            let previous = this.getPreviousValue();
            if (previous) {
                previous = previous === this.value ? this.getPreviousValue() : previous;
            }
            if (previous) {
                this.value = previous;
                aria.status(this.value);
            }
        }
        clearHistory() {
            this.history.clear();
        }
        getCurrentValue() {
            let currentValue = this.history.current();
            if (!currentValue) {
                currentValue = this.history.last();
                this.history.next();
            }
            return currentValue;
        }
        getPreviousValue() {
            return this.history.previous() || this.history.first();
        }
        getNextValue() {
            return this.history.next() || this.history.last();
        }
    }
    exports.HistoryInputBox = HistoryInputBox;
});
//# sourceMappingURL=inputBox.js.map