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
define(["require", "exports", "vs/editor/contrib/referenceSearch/peekViewWidget", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/workbench/contrib/callHierarchy/browser/callHierarchyTree", "vs/nls", "vs/editor/common/core/range", "vs/base/browser/ui/splitview/splitview", "vs/base/browser/dom", "vs/base/common/event", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/widget/embeddedCodeEditorWidget", "vs/editor/common/services/resolverService", "vs/base/common/lifecycle", "vs/editor/common/model", "vs/platform/theme/common/themeService", "vs/editor/contrib/referenceSearch/referencesWidget", "vs/base/common/arrays", "vs/base/common/actions", "vs/platform/label/common/label", "vs/platform/storage/common/storage", "vs/base/common/color", "vs/base/browser/ui/tree/tree", "vs/css!./media/callHierarchy"], function (require, exports, peekViewWidget_1, instantiation_1, listService_1, callHTree, nls_1, range_1, splitview_1, dom_1, event_1, editorService_1, embeddedCodeEditorWidget_1, resolverService_1, lifecycle_1, model_1, themeService_1, referencesWidget, arrays_1, actions_1, label_1, storage_1, color_1, tree_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var State;
    (function (State) {
        State["Loading"] = "loading";
        State["Message"] = "message";
        State["Data"] = "data";
    })(State || (State = {}));
    class ChangeHierarchyDirectionAction extends actions_1.Action {
        constructor(direction, updateDirection) {
            super('', undefined, '', true, () => {
                if (direction === 2 /* CallsTo */) {
                    direction = 1 /* CallsFrom */;
                }
                else {
                    direction = 2 /* CallsTo */;
                }
                updateDirection(direction);
                update();
                return Promise.resolve();
            });
            const update = () => {
                if (direction === 1 /* CallsFrom */) {
                    this.label = nls_1.localize('toggle.from', "Showing Calls");
                    this.class = 'calls-from';
                }
                else {
                    this.label = nls_1.localize('toggle.to', "Showing Callers");
                    this.class = 'calls-to';
                }
            };
            update();
        }
    }
    class LayoutInfo {
        constructor(ratio, height) {
            this.ratio = ratio;
            this.height = height;
        }
        static store(info, storageService) {
            storageService.store('callHierarchyPeekLayout', JSON.stringify(info), 0 /* GLOBAL */);
        }
        static retrieve(storageService) {
            const value = storageService.get('callHierarchyPeekLayout', 0 /* GLOBAL */, '{}');
            const defaultInfo = { ratio: 0.7, height: 17 };
            try {
                return Object.assign({}, defaultInfo, JSON.parse(value));
            }
            catch (_a) {
                return defaultInfo;
            }
        }
    }
    let CallHierarchyTreePeekWidget = class CallHierarchyTreePeekWidget extends peekViewWidget_1.PeekViewWidget {
        constructor(editor, _where, _provider, _direction, themeService, _peekViewService, _editorService, _textModelService, _labelService, _storageService, _instantiationService) {
            super(editor, { showFrame: true, showArrow: true, isResizeable: true, isAccessible: true });
            this._where = _where;
            this._provider = _provider;
            this._direction = _direction;
            this._peekViewService = _peekViewService;
            this._editorService = _editorService;
            this._textModelService = _textModelService;
            this._labelService = _labelService;
            this._storageService = _storageService;
            this._instantiationService = _instantiationService;
            this._treeViewStates = new Map();
            this.create();
            this._peekViewService.addExclusiveWidget(editor, this);
            this._applyTheme(themeService.getTheme());
            this._disposables.add(themeService.onThemeChange(this._applyTheme, this));
        }
        dispose() {
            LayoutInfo.store(this._layoutInfo, this._storageService);
            this._splitView.dispose();
            this._tree.dispose();
            this._editor.dispose();
            super.dispose();
        }
        _applyTheme(theme) {
            const borderColor = theme.getColor(referencesWidget.peekViewBorder) || color_1.Color.transparent;
            this.style({
                arrowColor: borderColor,
                frameColor: borderColor,
                headerBackgroundColor: theme.getColor(referencesWidget.peekViewTitleBackground) || color_1.Color.transparent,
                primaryHeadingColor: theme.getColor(referencesWidget.peekViewTitleForeground),
                secondaryHeadingColor: theme.getColor(referencesWidget.peekViewTitleInfoForeground)
            });
        }
        _getActionBarOptions() {
            return {
                orientation: 1 /* HORIZONTAL_REVERSE */
            };
        }
        _fillBody(parent) {
            this._layoutInfo = LayoutInfo.retrieve(this._storageService);
            this._dim = { height: 0, width: 0 };
            this._parent = parent;
            dom_1.addClass(parent, 'call-hierarchy');
            const message = document.createElement('div');
            dom_1.addClass(message, 'message');
            parent.appendChild(message);
            this._message = message;
            this._message.tabIndex = 0;
            const container = document.createElement('div');
            dom_1.addClass(container, 'results');
            parent.appendChild(container);
            this._splitView = new splitview_1.SplitView(container, { orientation: 1 /* HORIZONTAL */ });
            // editor stuff
            const editorContainer = document.createElement('div');
            dom_1.addClass(editorContainer, 'editor');
            container.appendChild(editorContainer);
            let editorOptions = {
                scrollBeyondLastLine: false,
                scrollbar: {
                    verticalScrollbarSize: 14,
                    horizontal: 'auto',
                    useShadows: true,
                    verticalHasArrows: false,
                    horizontalHasArrows: false
                },
                overviewRulerLanes: 2,
                fixedOverflowWidgets: true,
                minimap: {
                    enabled: false
                }
            };
            this._editor = this._instantiationService.createInstance(embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget, editorContainer, editorOptions, this.editor);
            // tree stuff
            const treeContainer = document.createElement('div');
            dom_1.addClass(treeContainer, 'tree');
            container.appendChild(treeContainer);
            const options = {
                identityProvider: new callHTree.IdentityProvider(),
                ariaLabel: nls_1.localize('tree.aria', "Call Hierarchy"),
                expandOnlyOnTwistieClick: true,
            };
            this._tree = this._instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, treeContainer, new callHTree.VirtualDelegate(), [this._instantiationService.createInstance(callHTree.CallRenderer)], new callHTree.SingleDirectionDataSource(this._provider, () => this._direction), options);
            // split stuff
            this._splitView.addView({
                onDidChange: event_1.Event.None,
                element: editorContainer,
                minimumSize: 200,
                maximumSize: Number.MAX_VALUE,
                layout: (width) => {
                    this._editor.layout({ height: this._dim.height, width });
                }
            }, splitview_1.Sizing.Distribute);
            this._splitView.addView({
                onDidChange: event_1.Event.None,
                element: treeContainer,
                minimumSize: 100,
                maximumSize: Number.MAX_VALUE,
                layout: (width) => {
                    this._tree.layout(this._dim.height, width);
                }
            }, splitview_1.Sizing.Distribute);
            this._disposables.add(this._splitView.onDidSashChange(() => {
                if (this._dim.width) {
                    this._layoutInfo.ratio = this._splitView.getViewSize(0) / this._dim.width;
                }
            }));
            // session state
            let localDispose = [];
            this._disposables.add({ dispose() { lifecycle_1.dispose(localDispose); } });
            // update editor
            this._disposables.add(this._tree.onDidChangeFocus(e => {
                const [element] = e.elements;
                if (element && arrays_1.isNonEmptyArray(element.locations)) {
                    localDispose = lifecycle_1.dispose(localDispose);
                    const options = {
                        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
                        className: 'call-decoration',
                        overviewRuler: {
                            color: themeService_1.themeColorFromId(referencesWidget.peekViewEditorMatchHighlight),
                            position: model_1.OverviewRulerLane.Center
                        },
                    };
                    let decorations = [];
                    let fullRange;
                    for (const { range } of element.locations) {
                        decorations.push({ range, options });
                        fullRange = !fullRange ? range : range_1.Range.plusRange(range, fullRange);
                    }
                    this._textModelService.createModelReference(element.item.uri).then(value => {
                        this._editor.setModel(value.object.textEditorModel);
                        this._editor.revealRangeInCenter(fullRange, 0 /* Smooth */);
                        this._editor.revealLine(element.item.range.startLineNumber, 0 /* Smooth */);
                        const ids = this._editor.deltaDecorations([], decorations);
                        localDispose.push({ dispose: () => this._editor.deltaDecorations(ids, []) });
                        localDispose.push(value);
                    });
                    let node = element;
                    let names = [element.item.name];
                    while (true) {
                        let parent = this._tree.getParentElement(node);
                        if (!(parent instanceof callHTree.Call)) {
                            break;
                        }
                        if (this._direction === 2 /* CallsTo */) {
                            names.push(parent.item.name);
                        }
                        else {
                            names.unshift(parent.item.name);
                        }
                        node = parent;
                    }
                    this.setMetaTitle(nls_1.localize('meta', " – {0}", names.join(' → ')));
                }
            }));
            this._disposables.add(this._editor.onMouseDown(e => {
                const { event, target } = e;
                if (event.detail !== 2) {
                    return;
                }
                const [focus] = this._tree.getFocus();
                if (!focus) {
                    return;
                }
                this.dispose();
                this._editorService.openEditor({
                    resource: focus.item.uri,
                    options: { selection: target.range }
                });
            }));
            this._disposables.add(this._tree.onMouseDblClick(e => {
                if (e.target === tree_1.TreeMouseEventTarget.Twistie) {
                    return;
                }
                if (e.element && arrays_1.isNonEmptyArray(e.element.locations)) {
                    this.dispose();
                    this._editorService.openEditor({
                        resource: e.element.item.uri,
                        options: { selection: e.element.locations[0].range }
                    });
                }
            }));
            this._disposables.add(this._tree.onDidChangeSelection(e => {
                const [element] = e.elements;
                // don't close on click
                if (element && arrays_1.isNonEmptyArray(element.locations) && e.browserEvent instanceof KeyboardEvent) {
                    this.dispose();
                    this._editorService.openEditor({
                        resource: element.item.uri,
                        options: { selection: element.locations[0].range }
                    });
                }
            }));
        }
        showLoading() {
            this._parent.dataset['state'] = "loading" /* Loading */;
            this.setTitle(nls_1.localize('title.loading', "Loading..."));
            this._show();
        }
        showMessage(message) {
            this._parent.dataset['state'] = "message" /* Message */;
            this.setTitle('');
            this.setMetaTitle('');
            this._message.innerText = message;
            this._show();
            this._message.focus();
        }
        showItem(item) {
            return __awaiter(this, void 0, void 0, function* () {
                this._show();
                const viewState = this._treeViewStates.get(this._direction);
                yield this._tree.setInput(item, viewState);
                const [root] = this._tree.getNode(item).children;
                yield this._tree.expand(root.element);
                const firstChild = this._tree.getFirstElementChild(root.element);
                if (!(firstChild instanceof callHTree.Call)) {
                    //
                    this.showMessage(this._direction === 1 /* CallsFrom */
                        ? nls_1.localize('empt.callsFrom', "No calls from '{0}'", item.name)
                        : nls_1.localize('empt.callsTo', "No calls to '{0}'", item.name));
                }
                else {
                    this._parent.dataset['state'] = "data" /* Data */;
                    this._tree.domFocus();
                    if (!viewState) {
                        this._tree.setFocus([firstChild]);
                    }
                    this.setTitle(item.name, item.detail || this._labelService.getUriLabel(item.uri, { relative: true }));
                }
                if (!this._changeDirectionAction) {
                    const changeDirection = (newDirection) => {
                        if (this._direction !== newDirection) {
                            this._treeViewStates.set(this._direction, this._tree.getViewState());
                            this._direction = newDirection;
                            this.showItem(item);
                        }
                    };
                    this._changeDirectionAction = new ChangeHierarchyDirectionAction(this._direction, changeDirection);
                    this._disposables.add(this._changeDirectionAction);
                    this._actionbarWidget.push(this._changeDirectionAction, { icon: true, label: false });
                }
            });
        }
        _show() {
            if (!this._isShowing) {
                this.editor.revealLineInCenterIfOutsideViewport(this._where.lineNumber, 0 /* Smooth */);
                super.show(range_1.Range.fromPositions(this._where), this._layoutInfo.height);
            }
        }
        _onWidth(width) {
            if (this._dim) {
                this._doLayoutBody(this._dim.height, width);
            }
        }
        _doLayoutBody(height, width) {
            super._doLayoutBody(height, width);
            this._dim = { height, width };
            this._layoutInfo.height = this._viewZone ? this._viewZone.heightInLines : this._layoutInfo.height;
            this._splitView.layout(width);
            this._splitView.resizeView(0, width * this._layoutInfo.ratio);
        }
    };
    CallHierarchyTreePeekWidget = __decorate([
        __param(4, themeService_1.IThemeService),
        __param(5, peekViewWidget_1.IPeekViewService),
        __param(6, editorService_1.IEditorService),
        __param(7, resolverService_1.ITextModelService),
        __param(8, label_1.ILabelService),
        __param(9, storage_1.IStorageService),
        __param(10, instantiation_1.IInstantiationService)
    ], CallHierarchyTreePeekWidget);
    exports.CallHierarchyTreePeekWidget = CallHierarchyTreePeekWidget;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const referenceHighlightColor = theme.getColor(referencesWidget.peekViewEditorMatchHighlight);
        if (referenceHighlightColor) {
            collector.addRule(`.monaco-editor .call-hierarchy .call-decoration { background-color: ${referenceHighlightColor}; }`);
        }
        const referenceHighlightBorder = theme.getColor(referencesWidget.peekViewEditorMatchHighlightBorder);
        if (referenceHighlightBorder) {
            collector.addRule(`.monaco-editor .call-hierarchy .call-decoration { border: 2px solid ${referenceHighlightBorder}; box-sizing: border-box; }`);
        }
        const resultsBackground = theme.getColor(referencesWidget.peekViewResultsBackground);
        if (resultsBackground) {
            collector.addRule(`.monaco-editor .call-hierarchy .tree { background-color: ${resultsBackground}; }`);
        }
        const resultsMatchForeground = theme.getColor(referencesWidget.peekViewResultsFileForeground);
        if (resultsMatchForeground) {
            collector.addRule(`.monaco-editor .call-hierarchy .tree { color: ${resultsMatchForeground}; }`);
        }
        const resultsSelectedBackground = theme.getColor(referencesWidget.peekViewResultsSelectionBackground);
        if (resultsSelectedBackground) {
            collector.addRule(`.monaco-editor .call-hierarchy .tree .monaco-list:focus .monaco-list-rows > .monaco-list-row.selected:not(.highlighted) { background-color: ${resultsSelectedBackground}; }`);
        }
        const resultsSelectedForeground = theme.getColor(referencesWidget.peekViewResultsSelectionForeground);
        if (resultsSelectedForeground) {
            collector.addRule(`.monaco-editor .call-hierarchy .tree .monaco-list:focus .monaco-list-rows > .monaco-list-row.selected:not(.highlighted) { color: ${resultsSelectedForeground} !important; }`);
        }
        const editorBackground = theme.getColor(referencesWidget.peekViewEditorBackground);
        if (editorBackground) {
            collector.addRule(`.monaco-editor .call-hierarchy .editor .monaco-editor .monaco-editor-background,` +
                `.monaco-editor .call-hierarchy .editor .monaco-editor .inputarea.ime-input {` +
                `	background-color: ${editorBackground};` +
                `}`);
        }
        const editorGutterBackground = theme.getColor(referencesWidget.peekViewEditorGutterBackground);
        if (editorGutterBackground) {
            collector.addRule(`.monaco-editor .call-hierarchy .editor .monaco-editor .margin {` +
                `	background-color: ${editorGutterBackground};` +
                `}`);
        }
    });
});
//# sourceMappingURL=callHierarchyPeek.js.map