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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/windows/common/windows", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/contrib/webview/browser/webviewEditorInput", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/services/editor/common/editorService"], function (require, exports, DOM, event_1, lifecycle_1, contextkey_1, storage_1, telemetry_1, themeService_1, windows_1, baseEditor_1, webviewEditorInput_1, webview_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WebviewEditor = class WebviewEditor extends baseEditor_1.BaseEditor {
        constructor(telemetryService, themeService, _contextKeyService, _editorService, _windowService, storageService) {
            super(WebviewEditor.ID, telemetryService, themeService, storageService);
            this._contextKeyService = _contextKeyService;
            this._editorService = _editorService;
            this._windowService = _windowService;
            this._scopedContextKeyService = this._register(new lifecycle_1.MutableDisposable());
            this._webviewFocusTrackerDisposables = this._register(new lifecycle_1.DisposableStore());
            this._onFocusWindowHandler = this._register(new lifecycle_1.MutableDisposable());
            this._onDidFocusWebview = this._register(new event_1.Emitter());
            this._findWidgetVisible = webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE.bindTo(_contextKeyService);
        }
        get onDidFocus() { return this._onDidFocusWebview.event; }
        get isWebviewEditor() {
            return true;
        }
        createEditor(parent) {
            this._editorFrame = parent;
            this._content = document.createElement('div');
            parent.appendChild(this._content);
        }
        dispose() {
            if (this._content) {
                this._content.remove();
                this._content = undefined;
            }
            super.dispose();
        }
        showFind() {
            this.withWebview(webview => {
                webview.showFind();
                this._findWidgetVisible.set(true);
            });
        }
        hideFind() {
            this._findWidgetVisible.reset();
            this.withWebview(webview => webview.hideFind());
        }
        find(previous) {
            this.withWebview(webview => {
                webview.runFindAction(previous);
            });
        }
        reload() {
            this.withWebview(webview => webview.reload());
        }
        layout(dimension) {
            if (this.input && this.input instanceof webviewEditorInput_1.WebviewEditorInput) {
                this.synchronizeWebviewContainerDimensions(this.input.webview, dimension);
                this.input.webview.layout();
            }
        }
        focus() {
            super.focus();
            if (!this._onFocusWindowHandler.value) {
                // Make sure we restore focus when switching back to a VS Code window
                this._onFocusWindowHandler.value = this._windowService.onDidChangeFocus(focused => {
                    if (focused && this._editorService.activeControl === this) {
                        this.focus();
                    }
                });
            }
            this.withWebview(webview => webview.focus());
        }
        withWebview(f) {
            if (this.input && this.input instanceof webviewEditorInput_1.WebviewEditorInput) {
                f(this.input.webview);
            }
        }
        setEditorVisible(visible, group) {
            const webview = this.input && this.input.webview;
            if (webview) {
                if (visible) {
                    webview.claim(this);
                }
                else {
                    webview.release(this);
                }
                this.claimWebview(this.input);
            }
            super.setEditorVisible(visible, group);
        }
        clearInput() {
            if (this.input && this.input instanceof webviewEditorInput_1.WebviewEditorInput) {
                this.input.webview.release(this);
            }
            super.clearInput();
        }
        setInput(input, options, token) {
            const _super = Object.create(null, {
                setInput: { get: () => super.setInput }
            });
            return __awaiter(this, void 0, void 0, function* () {
                if (this.input && this.input instanceof webviewEditorInput_1.WebviewEditorInput) {
                    this.input.webview.release(this);
                }
                yield _super.setInput.call(this, input, options, token);
                yield input.resolve();
                if (token.isCancellationRequested) {
                    return;
                }
                if (this.group) {
                    input.updateGroup(this.group.id);
                }
                this.claimWebview(input);
            });
        }
        claimWebview(input) {
            input.webview.claim(this);
            if (input.webview.options.enableFindWidget) {
                this._scopedContextKeyService.value = this._contextKeyService.createScoped(input.webview.container);
                this._findWidgetVisible = webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE.bindTo(this._scopedContextKeyService.value);
            }
            if (this._content) {
                this._content.setAttribute('aria-flowto', input.webview.container.id);
            }
            this.synchronizeWebviewContainerDimensions(input.webview);
            this.trackFocus(input.webview);
        }
        synchronizeWebviewContainerDimensions(webview, dimension) {
            const webviewContainer = webview.container;
            if (webviewContainer && webviewContainer.parentElement && this._editorFrame) {
                const frameRect = this._editorFrame.getBoundingClientRect();
                const containerRect = webviewContainer.parentElement.getBoundingClientRect();
                webviewContainer.style.position = 'absolute';
                webviewContainer.style.top = `${frameRect.top - containerRect.top}px`;
                webviewContainer.style.left = `${frameRect.left - containerRect.left}px`;
                webviewContainer.style.width = `${dimension ? dimension.width : frameRect.width}px`;
                webviewContainer.style.height = `${dimension ? dimension.height : frameRect.height}px`;
            }
        }
        trackFocus(webview) {
            this._webviewFocusTrackerDisposables.clear();
            // Track focus in webview content
            const webviewContentFocusTracker = DOM.trackFocus(webview.container);
            this._webviewFocusTrackerDisposables.add(webviewContentFocusTracker);
            this._webviewFocusTrackerDisposables.add(webviewContentFocusTracker.onDidFocus(() => this._onDidFocusWebview.fire()));
            // Track focus in webview element
            this._webviewFocusTrackerDisposables.add(webview.onDidFocus(() => this._onDidFocusWebview.fire()));
        }
    };
    WebviewEditor.ID = 'WebviewEditor';
    WebviewEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, editorService_1.IEditorService),
        __param(4, windows_1.IWindowService),
        __param(5, storage_1.IStorageService)
    ], WebviewEditor);
    exports.WebviewEditor = WebviewEditor;
});
//# sourceMappingURL=webviewEditor.js.map