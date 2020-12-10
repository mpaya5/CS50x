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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/callHierarchy/common/callHierarchy", "vs/base/common/cancellation", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/callHierarchy/browser/callHierarchyPeek", "vs/base/common/event", "vs/editor/browser/editorExtensions", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle", "vs/editor/common/editorContextKeys", "vs/editor/contrib/referenceSearch/peekViewWidget"], function (require, exports, nls_1, callHierarchy_1, cancellation_1, instantiation_1, callHierarchyPeek_1, event_1, editorExtensions_1, contextkey_1, lifecycle_1, editorContextKeys_1, peekViewWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _ctxHasCompletionItemProvider = new contextkey_1.RawContextKey('editorHasCallHierarchyProvider', false);
    const _ctxCallHierarchyVisible = new contextkey_1.RawContextKey('callHierarchyVisible', false);
    let CallHierarchyController = class CallHierarchyController extends lifecycle_1.Disposable {
        constructor(_editor, _contextKeyService, _instantiationService) {
            super();
            this._editor = _editor;
            this._contextKeyService = _contextKeyService;
            this._instantiationService = _instantiationService;
            this._sessionDispose = [];
            this._ctxIsVisible = _ctxCallHierarchyVisible.bindTo(this._contextKeyService);
            this._ctxHasProvider = _ctxHasCompletionItemProvider.bindTo(this._contextKeyService);
            this._register(event_1.Event.any(_editor.onDidChangeModel, _editor.onDidChangeModelLanguage, callHierarchy_1.CallHierarchyProviderRegistry.onDidChange)(() => {
                this._ctxHasProvider.set(_editor.hasModel() && callHierarchy_1.CallHierarchyProviderRegistry.has(_editor.getModel()));
            }));
            this._register({ dispose: () => lifecycle_1.dispose(this._sessionDispose) });
        }
        static get(editor) {
            return editor.getContribution(CallHierarchyController.Id);
        }
        dispose() {
            this._ctxHasProvider.reset();
            this._ctxIsVisible.reset();
            super.dispose();
        }
        getId() {
            return CallHierarchyController.Id;
        }
        startCallHierarchy() {
            return __awaiter(this, void 0, void 0, function* () {
                this._sessionDispose = lifecycle_1.dispose(this._sessionDispose);
                if (!this._editor.hasModel()) {
                    return;
                }
                const model = this._editor.getModel();
                const position = this._editor.getPosition();
                const [provider] = callHierarchy_1.CallHierarchyProviderRegistry.ordered(model);
                if (!provider) {
                    return;
                }
                event_1.Event.any(this._editor.onDidChangeModel, this._editor.onDidChangeModelLanguage)(this.endCallHierarchy, this, this._sessionDispose);
                const widget = this._instantiationService.createInstance(callHierarchyPeek_1.CallHierarchyTreePeekWidget, this._editor, position, provider, 2 /* CallsTo */);
                widget.showLoading();
                this._ctxIsVisible.set(true);
                const cancel = new cancellation_1.CancellationTokenSource();
                this._sessionDispose.push(widget.onDidClose(() => this.endCallHierarchy()));
                this._sessionDispose.push({ dispose() { cancel.cancel(); } });
                this._sessionDispose.push(widget);
                Promise.resolve(provider.provideCallHierarchyItem(model, position, cancel.token)).then(item => {
                    if (cancel.token.isCancellationRequested) {
                        return;
                    }
                    if (!item) {
                        widget.showMessage(nls_1.localize('no.item', "No results"));
                        return;
                    }
                    widget.showItem(item);
                });
            });
        }
        endCallHierarchy() {
            this._sessionDispose = lifecycle_1.dispose(this._sessionDispose);
            this._ctxIsVisible.set(false);
            this._editor.focus();
        }
    };
    CallHierarchyController.Id = 'callHierarchy';
    CallHierarchyController = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, instantiation_1.IInstantiationService)
    ], CallHierarchyController);
    editorExtensions_1.registerEditorContribution(CallHierarchyController);
    editorExtensions_1.registerEditorAction(class extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.showCallHierarchy',
                label: nls_1.localize('title', "Peek Call Hierarchy"),
                alias: 'Peek Call Hierarchy',
                menuOpts: {
                    group: 'navigation',
                    order: 1.48
                },
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    weight: 200 /* WorkbenchContrib */,
                    primary: 1024 /* Shift */ + 512 /* Alt */ + 38 /* KEY_H */
                },
                precondition: contextkey_1.ContextKeyExpr.and(_ctxHasCompletionItemProvider, peekViewWidget_1.PeekContext.notInPeekEditor)
            });
        }
        run(_accessor, editor, args) {
            return __awaiter(this, void 0, void 0, function* () {
                return CallHierarchyController.get(editor).startCallHierarchy();
            });
        }
    });
    editorExtensions_1.registerEditorCommand(new class extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: 'editor.closeCallHierarchy',
                kbOpts: {
                    weight: 200 /* WorkbenchContrib */ + 10,
                    primary: 9 /* Escape */
                },
                precondition: contextkey_1.ContextKeyExpr.and(_ctxCallHierarchyVisible, contextkey_1.ContextKeyExpr.not('config.editor.stablePeek'))
            });
        }
        runEditorCommand(_accessor, editor) {
            return CallHierarchyController.get(editor).endCallHierarchy();
        }
    });
});
//# sourceMappingURL=callHierarchy.contribution.js.map