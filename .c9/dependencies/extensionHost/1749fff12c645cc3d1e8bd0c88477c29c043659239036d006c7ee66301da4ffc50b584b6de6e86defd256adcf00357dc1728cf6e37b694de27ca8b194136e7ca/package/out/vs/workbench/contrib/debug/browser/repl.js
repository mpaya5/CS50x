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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/errors", "vs/base/common/actions", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/common/severity", "vs/editor/contrib/suggest/suggestController", "vs/editor/browser/editorExtensions", "vs/editor/common/services/modelService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/contextkey/common/contextkey", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/browser/panel", "vs/platform/theme/common/themeService", "vs/base/common/decorators", "vs/base/common/lifecycle", "vs/editor/common/editorContextKeys", "vs/editor/browser/widget/codeEditorWidget", "vs/workbench/contrib/debug/common/debug", "vs/base/common/history", "vs/platform/browser/contextScopedHistoryWidget", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/platform/theme/common/colorRegistry", "vs/editor/browser/services/codeEditorService", "vs/workbench/contrib/debug/browser/debugActionViewItems", "vs/editor/common/modes", "vs/base/common/arrays", "vs/workbench/services/panel/common/panelService", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/workbench/contrib/debug/browser/debugANSIHandling", "vs/platform/label/common/label", "vs/workbench/contrib/debug/browser/linkDetector", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/contextview/browser/contextView", "vs/base/common/strings", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/editor/common/services/resourceConfiguration", "vs/base/common/async", "vs/base/common/filters", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/debug/browser/variablesView", "vs/css!vs/workbench/contrib/debug/browser/media/repl"], function (require, exports, nls, uri_1, errors, actions_1, dom, aria, severity_1, suggestController_1, editorExtensions_1, modelService_1, serviceCollection_1, contextkey_1, telemetry_1, instantiation_1, storage_1, panel_1, themeService_1, decorators_1, lifecycle_1, editorContextKeys_1, codeEditorWidget_1, debug_1, history_1, contextScopedHistoryWidget_1, simpleEditorOptions_1, colorRegistry_1, codeEditorService_1, debugActionViewItems_1, modes_1, arrays_1, panelService_1, debugModel_1, editorService_1, baseDebugView_1, debugANSIHandling_1, label_1, linkDetector_1, actionbar_1, contextView_1, strings_1, listService_1, configuration_1, resourceConfiguration_1, async_1, filters_1, highlightedLabel_1, clipboardService_1, variablesView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    const HISTORY_STORAGE_KEY = 'debug.repl.history';
    const IPrivateReplService = instantiation_1.createDecorator('privateReplService');
    const DECORATION_KEY = 'replinputdecoration';
    function revealLastElement(tree) {
        tree.scrollTop = tree.scrollHeight - tree.renderHeight;
    }
    const sessionsToIgnore = new Set();
    let Repl = class Repl extends panel_1.Panel {
        constructor(debugService, telemetryService, instantiationService, storageService, themeService, modelService, contextKeyService, codeEditorService, contextMenuService, configurationService, textResourcePropertiesService, clipboardService) {
            super(debug_1.REPL_ID, telemetryService, themeService, storageService);
            this.debugService = debugService;
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.themeService = themeService;
            this.modelService = modelService;
            this.contextKeyService = contextKeyService;
            this.contextMenuService = contextMenuService;
            this.configurationService = configurationService;
            this.textResourcePropertiesService = textResourcePropertiesService;
            this.clipboardService = clipboardService;
            this.replInputHeight = Repl.REPL_INPUT_INITIAL_HEIGHT;
            this.history = new history_1.HistoryNavigator(JSON.parse(this.storageService.get(HISTORY_STORAGE_KEY, 1 /* WORKSPACE */, '[]')), 50);
            codeEditorService.registerDecorationType(DECORATION_KEY, {});
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.debugService.getViewModel().onDidFocusSession(session => {
                if (session) {
                    sessionsToIgnore.delete(session);
                    if (this.completionItemProvider) {
                        this.completionItemProvider.dispose();
                    }
                    if (session.capabilities.supportsCompletionsRequest) {
                        this.completionItemProvider = modes_1.CompletionProviderRegistry.register({ scheme: debug_1.DEBUG_SCHEME, pattern: '**/replinput', hasAccessToAllModels: true }, {
                            triggerCharacters: session.capabilities.completionTriggerCharacters || ['.'],
                            provideCompletionItems: (_, position, _context, token) => __awaiter(this, void 0, void 0, function* () {
                                // Disable history navigation because up and down are used to navigate through the suggest widget
                                this.historyNavigationEnablement.set(false);
                                const model = this.replInput.getModel();
                                if (model) {
                                    const word = model.getWordAtPosition(position);
                                    const overwriteBefore = word ? word.word.length : 0;
                                    const text = model.getLineContent(position.lineNumber);
                                    const focusedStackFrame = this.debugService.getViewModel().focusedStackFrame;
                                    const frameId = focusedStackFrame ? focusedStackFrame.frameId : undefined;
                                    const suggestions = yield session.completions(frameId, text, position, overwriteBefore);
                                    return { suggestions };
                                }
                                return Promise.resolve({ suggestions: [] });
                            })
                        });
                    }
                }
                this.selectSession();
            }));
            this._register(this.debugService.onWillNewSession(newSession => {
                // Need to listen to output events for sessions which are not yet fully initialised
                const input = this.tree.getInput();
                if (!input || input.state === 0 /* Inactive */) {
                    this.selectSession(newSession);
                }
                this.updateTitleArea();
            }));
            this._register(this.themeService.onThemeChange(() => {
                this.refreshReplElements(false);
                if (this.isVisible()) {
                    this.updateInputDecoration();
                }
            }));
            this._register(this.onDidChangeVisibility(visible => {
                if (!visible) {
                    lifecycle_1.dispose(this.model);
                }
                else {
                    this.model = this.modelService.createModel('', null, uri_1.URI.parse(`${debug_1.DEBUG_SCHEME}:replinput`), true);
                    this.replInput.setModel(this.model);
                    this.updateInputDecoration();
                    this.refreshReplElements(true);
                }
            }));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('debug.console.lineHeight') || e.affectsConfiguration('debug.console.fontSize') || e.affectsConfiguration('debug.console.fontFamily')) {
                    this.onDidFontChange();
                }
            }));
        }
        get isReadonly() {
            // Do not allow to edit inactive sessions
            const session = this.tree.getInput();
            if (session && session.state !== 0 /* Inactive */) {
                return false;
            }
            return true;
        }
        showPreviousValue() {
            this.navigateHistory(true);
        }
        showNextValue() {
            this.navigateHistory(false);
        }
        focusRepl() {
            this.tree.domFocus();
        }
        onDidFontChange() {
            if (this.styleElement) {
                const debugConsole = this.configurationService.getValue('debug').console;
                const fontSize = debugConsole.fontSize;
                const fontFamily = debugConsole.fontFamily === 'default' ? 'var(--monaco-monospace-font)' : debugConsole.fontFamily;
                const lineHeight = debugConsole.lineHeight ? `${debugConsole.lineHeight}px` : '1.4em';
                // Set the font size, font family, line height and align the twistie to be centered
                this.styleElement.innerHTML = `
				.repl .repl-tree .expression {
					font-size: ${fontSize}px;
					font-family: ${fontFamily};
				}

				.repl .repl-tree .expression {
					line-height: ${lineHeight};
				}

				.repl .repl-tree .monaco-tl-twistie {
					background-position-y: calc(100% - ${fontSize * 1.4 / 2 - 8}px);
				}
			`;
                this.tree.rerender();
            }
        }
        navigateHistory(previous) {
            const historyInput = previous ? this.history.previous() : this.history.next();
            if (historyInput) {
                this.replInput.setValue(historyInput);
                aria.status(historyInput);
                // always leave cursor at the end.
                this.replInput.setPosition({ lineNumber: 1, column: historyInput.length + 1 });
                this.historyNavigationEnablement.set(true);
            }
        }
        selectSession(session) {
            const treeInput = this.tree.getInput();
            if (!session) {
                const focusedSession = this.debugService.getViewModel().focusedSession;
                // If there is a focusedSession focus on that one, otherwise just show any other not ignored session
                if (focusedSession) {
                    session = focusedSession;
                }
                else if (!treeInput || sessionsToIgnore.has(treeInput)) {
                    session = arrays_1.first(this.debugService.getModel().getSessions(true), s => !sessionsToIgnore.has(s)) || undefined;
                }
            }
            if (session) {
                if (this.replElementsChangeListener) {
                    this.replElementsChangeListener.dispose();
                }
                this.replElementsChangeListener = session.onDidChangeReplElements(() => {
                    this.refreshReplElements(session.getReplElements().length === 0);
                });
                if (this.tree && treeInput !== session) {
                    this.tree.setInput(session).then(() => revealLastElement(this.tree)).then(undefined, errors.onUnexpectedError);
                }
            }
            this.replInput.updateOptions({ readOnly: this.isReadonly });
            this.updateInputDecoration();
        }
        clearRepl() {
            const session = this.tree.getInput();
            if (session) {
                session.removeReplExpressions();
                if (session.state === 0 /* Inactive */) {
                    // Ignore inactive sessions which got cleared - so they are not shown any more
                    sessionsToIgnore.add(session);
                    this.selectSession();
                    this.updateTitleArea();
                }
            }
            this.replInput.focus();
        }
        acceptReplInput() {
            const session = this.tree.getInput();
            if (session) {
                session.addReplExpression(this.debugService.getViewModel().focusedStackFrame, this.replInput.getValue());
                revealLastElement(this.tree);
                this.history.add(this.replInput.getValue());
                this.replInput.setValue('');
                const shouldRelayout = this.replInputHeight > Repl.REPL_INPUT_INITIAL_HEIGHT;
                this.replInputHeight = Repl.REPL_INPUT_INITIAL_HEIGHT;
                if (shouldRelayout) {
                    // Trigger a layout to shrink a potential multi line input
                    this.layout(this.dimension);
                }
            }
        }
        getVisibleContent() {
            let text = '';
            const lineDelimiter = this.textResourcePropertiesService.getEOL(this.model.uri);
            const traverseAndAppend = (node) => {
                node.children.forEach(child => {
                    text += child.element.toString().trimRight() + lineDelimiter;
                    if (!child.collapsed && child.children.length) {
                        traverseAndAppend(child);
                    }
                });
            };
            traverseAndAppend(this.tree.getNode());
            return strings_1.removeAnsiEscapeCodes(text);
        }
        layout(dimension) {
            this.dimension = dimension;
            if (this.tree) {
                const lastElementVisible = this.tree.scrollTop + this.tree.renderHeight >= this.tree.scrollHeight;
                const treeHeight = dimension.height - this.replInputHeight;
                this.tree.getHTMLElement().style.height = `${treeHeight}px`;
                this.tree.layout(treeHeight, dimension.width);
                if (lastElementVisible) {
                    revealLastElement(this.tree);
                }
            }
            this.replInputContainer.style.height = `${this.replInputHeight}px`;
            this.replInput.layout({ width: dimension.width - 20, height: this.replInputHeight });
        }
        focus() {
            this.replInput.focus();
        }
        getActionViewItem(action) {
            if (action.id === SelectReplAction.ID) {
                return this.instantiationService.createInstance(SelectReplActionViewItem, this.selectReplAction);
            }
            return undefined;
        }
        getActions() {
            const result = [];
            if (this.debugService.getModel().getSessions(true).filter(s => !sessionsToIgnore.has(s)).length > 1) {
                result.push(this.selectReplAction);
            }
            result.push(this.clearReplAction);
            result.forEach(a => this._register(a));
            return result;
        }
        // --- Cached locals
        get selectReplAction() {
            return this.scopedInstantiationService.createInstance(SelectReplAction, SelectReplAction.ID, SelectReplAction.LABEL);
        }
        get clearReplAction() {
            return this.scopedInstantiationService.createInstance(ClearReplAction, ClearReplAction.ID, ClearReplAction.LABEL);
        }
        get refreshScheduler() {
            return new async_1.RunOnceScheduler(() => {
                if (!this.tree.getInput()) {
                    return;
                }
                const lastElementVisible = this.tree.scrollTop + this.tree.renderHeight >= this.tree.scrollHeight;
                this.tree.updateChildren().then(() => {
                    if (lastElementVisible) {
                        // Only scroll if we were scrolled all the way down before tree refreshed #10486
                        revealLastElement(this.tree);
                    }
                }, errors.onUnexpectedError);
            }, Repl.REFRESH_DELAY);
        }
        // --- Creation
        create(parent) {
            super.create(parent);
            this.container = dom.append(parent, $('.repl'));
            const treeContainer = dom.append(this.container, $('.repl-tree'));
            this.createReplInput(this.container);
            this.replDelegate = new ReplDelegate(this.configurationService);
            const wordWrap = this.configurationService.getValue('debug').console.wordWrap;
            dom.toggleClass(treeContainer, 'word-wrap', wordWrap);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, treeContainer, this.replDelegate, [
                this.instantiationService.createInstance(variablesView_1.VariablesRenderer),
                this.instantiationService.createInstance(ReplSimpleElementsRenderer),
                new ReplExpressionsRenderer(),
                new ReplRawObjectsRenderer()
            ], 
            // https://github.com/microsoft/TypeScript/issues/32526
            new ReplDataSource(), {
                ariaLabel: nls.localize('replAriaLabel', "Read Eval Print Loop Panel"),
                accessibilityProvider: new ReplAccessibilityProvider(),
                identityProvider: { getId: (element) => element.getId() },
                mouseSupport: false,
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => e },
                horizontalScrolling: !wordWrap,
                setRowLineHeight: false,
                supportDynamicHeights: wordWrap
            });
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            let lastSelectedString;
            this._register(this.tree.onMouseClick(() => {
                const selection = window.getSelection();
                if (!selection || selection.type !== 'Range' || lastSelectedString === selection.toString()) {
                    // only focus the input if the user is not currently selecting.
                    this.replInput.focus();
                }
                lastSelectedString = selection ? selection.toString() : '';
            }));
            // Make sure to select the session if debugging is already active
            this.selectSession();
            this.styleElement = dom.createStyleSheet(this.container);
            this.onDidFontChange();
        }
        createReplInput(container) {
            this.replInputContainer = dom.append(container, $('.repl-input-wrapper'));
            const { scopedContextKeyService, historyNavigationEnablement } = contextScopedHistoryWidget_1.createAndBindHistoryNavigationWidgetScopedContextKeyService(this.contextKeyService, { target: this.replInputContainer, historyNavigator: this });
            this.historyNavigationEnablement = historyNavigationEnablement;
            this._register(scopedContextKeyService);
            debug_1.CONTEXT_IN_DEBUG_REPL.bindTo(scopedContextKeyService).set(true);
            this.scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService], [IPrivateReplService, this]));
            const options = simpleEditorOptions_1.getSimpleEditorOptions();
            options.readOnly = true;
            options.ariaLabel = nls.localize('debugConsole', "Debug Console");
            this.replInput = this.scopedInstantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this.replInputContainer, options, simpleEditorOptions_1.getSimpleCodeEditorWidgetOptions());
            this._register(this.replInput.onDidScrollChange(e => {
                if (!e.scrollHeightChanged) {
                    return;
                }
                this.replInputHeight = Math.max(Repl.REPL_INPUT_INITIAL_HEIGHT, Math.min(Repl.REPL_INPUT_MAX_HEIGHT, e.scrollHeight, this.dimension.height));
                this.layout(this.dimension);
            }));
            this._register(this.replInput.onDidChangeModelContent(() => {
                const model = this.replInput.getModel();
                this.historyNavigationEnablement.set(!!model && model.getValue() === '');
            }));
            // We add the input decoration only when the focus is in the input #61126
            this._register(this.replInput.onDidFocusEditorText(() => this.updateInputDecoration()));
            this._register(this.replInput.onDidBlurEditorText(() => this.updateInputDecoration()));
            this._register(dom.addStandardDisposableListener(this.replInputContainer, dom.EventType.FOCUS, () => dom.addClass(this.replInputContainer, 'synthetic-focus')));
            this._register(dom.addStandardDisposableListener(this.replInputContainer, dom.EventType.BLUR, () => dom.removeClass(this.replInputContainer, 'synthetic-focus')));
        }
        onContextMenu(e) {
            const actions = [];
            actions.push(new actions_1.Action('debug.replCopy', nls.localize('copy', "Copy"), undefined, true, () => __awaiter(this, void 0, void 0, function* () {
                const nativeSelection = window.getSelection();
                if (nativeSelection) {
                    yield this.clipboardService.writeText(nativeSelection.toString());
                }
                return Promise.resolve();
            })));
            actions.push(new actions_1.Action('workbench.debug.action.copyAll', nls.localize('copyAll', "Copy All"), undefined, true, () => __awaiter(this, void 0, void 0, function* () {
                yield this.clipboardService.writeText(this.getVisibleContent());
                return Promise.resolve();
            })));
            actions.push(new actions_1.Action('debug.collapseRepl', nls.localize('collapse', "Collapse All"), undefined, true, () => {
                this.tree.collapseAll();
                this.replInput.focus();
                return Promise.resolve();
            }));
            actions.push(new actionbar_1.Separator());
            actions.push(this.clearReplAction);
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => e.element
            });
        }
        // --- Update
        refreshReplElements(noDelay) {
            if (this.tree && this.isVisible()) {
                if (this.refreshScheduler.isScheduled()) {
                    return;
                }
                this.refreshScheduler.schedule(noDelay ? 0 : undefined);
            }
        }
        updateInputDecoration() {
            if (!this.replInput) {
                return;
            }
            const decorations = [];
            if (this.isReadonly && this.replInput.hasTextFocus() && !this.replInput.getValue()) {
                const transparentForeground = colorRegistry_1.transparent(colorRegistry_1.editorForeground, 0.4)(this.themeService.getTheme());
                decorations.push({
                    range: {
                        startLineNumber: 0,
                        endLineNumber: 0,
                        startColumn: 0,
                        endColumn: 1
                    },
                    renderOptions: {
                        after: {
                            contentText: nls.localize('startDebugFirst', "Please start a debug session to evaluate expressions"),
                            color: transparentForeground ? transparentForeground.toString() : undefined
                        }
                    }
                });
            }
            this.replInput.setDecorations(DECORATION_KEY, decorations);
        }
        saveState() {
            const replHistory = this.history.getHistory();
            if (replHistory.length) {
                this.storageService.store(HISTORY_STORAGE_KEY, JSON.stringify(replHistory), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(HISTORY_STORAGE_KEY, 1 /* WORKSPACE */);
            }
            super.saveState();
        }
        dispose() {
            this.replInput.dispose();
            if (this.replElementsChangeListener) {
                this.replElementsChangeListener.dispose();
            }
            this.refreshScheduler.dispose();
            super.dispose();
        }
    };
    Repl.REFRESH_DELAY = 100; // delay in ms to refresh the repl for new elements to show
    Repl.REPL_INPUT_INITIAL_HEIGHT = 19;
    Repl.REPL_INPUT_MAX_HEIGHT = 170;
    __decorate([
        decorators_1.memoize
    ], Repl.prototype, "selectReplAction", null);
    __decorate([
        decorators_1.memoize
    ], Repl.prototype, "clearReplAction", null);
    __decorate([
        decorators_1.memoize
    ], Repl.prototype, "refreshScheduler", null);
    Repl = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, storage_1.IStorageService),
        __param(4, themeService_1.IThemeService),
        __param(5, modelService_1.IModelService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, codeEditorService_1.ICodeEditorService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, resourceConfiguration_1.ITextResourcePropertiesService),
        __param(11, clipboardService_1.IClipboardService)
    ], Repl);
    exports.Repl = Repl;
    class ReplExpressionsRenderer {
        get templateId() {
            return ReplExpressionsRenderer.ID;
        }
        renderTemplate(container) {
            dom.addClass(container, 'input-output-pair');
            const input = dom.append(container, $('.input.expression'));
            const label = new highlightedLabel_1.HighlightedLabel(input, false);
            const output = dom.append(container, $('.output.expression'));
            const value = dom.append(output, $('span.value'));
            const annotation = dom.append(output, $('span'));
            return { input, label, output, value, annotation };
        }
        renderElement(element, index, templateData) {
            const expression = element.element;
            templateData.label.set(expression.name, filters_1.createMatches(element.filterData));
            baseDebugView_1.renderExpressionValue(expression, templateData.value, {
                preserveWhitespace: !expression.hasChildren,
                showHover: false,
                colorize: true
            });
            if (expression.hasChildren) {
                templateData.annotation.className = 'annotation octicon octicon-info';
                templateData.annotation.title = nls.localize('stateCapture', "Object state is captured from first evaluation");
            }
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    ReplExpressionsRenderer.ID = 'expressionRepl';
    let ReplSimpleElementsRenderer = class ReplSimpleElementsRenderer {
        constructor(editorService, labelService, instantiationService, themeService) {
            this.editorService = editorService;
            this.labelService = labelService;
            this.instantiationService = instantiationService;
            this.themeService = themeService;
        }
        get templateId() {
            return ReplSimpleElementsRenderer.ID;
        }
        get linkDetector() {
            return this.instantiationService.createInstance(linkDetector_1.LinkDetector);
        }
        renderTemplate(container) {
            const data = Object.create(null);
            dom.addClass(container, 'output');
            const expression = dom.append(container, $('.output.expression.value-and-source'));
            data.container = container;
            data.value = dom.append(expression, $('span.value'));
            data.source = dom.append(expression, $('.source'));
            data.toDispose = [];
            data.toDispose.push(dom.addDisposableListener(data.source, 'click', e => {
                e.preventDefault();
                e.stopPropagation();
                const source = data.getReplElementSource();
                if (source) {
                    source.source.openInEditor(this.editorService, {
                        startLineNumber: source.lineNumber,
                        startColumn: source.column,
                        endLineNumber: source.lineNumber,
                        endColumn: source.column
                    });
                }
            }));
            return data;
        }
        renderElement({ element }, index, templateData) {
            // value
            dom.clearNode(templateData.value);
            // Reset classes to clear ansi decorations since templates are reused
            templateData.value.className = 'value';
            const result = debugANSIHandling_1.handleANSIOutput(element.value, this.linkDetector, this.themeService);
            templateData.value.appendChild(result);
            dom.addClass(templateData.value, (element.severity === severity_1.default.Warning) ? 'warn' : (element.severity === severity_1.default.Error) ? 'error' : (element.severity === severity_1.default.Ignore) ? 'ignore' : 'info');
            templateData.source.textContent = element.sourceData ? `${element.sourceData.source.name}:${element.sourceData.lineNumber}` : '';
            templateData.source.title = element.sourceData ? this.labelService.getUriLabel(element.sourceData.source.uri) : '';
            templateData.getReplElementSource = () => element.sourceData;
        }
        disposeTemplate(templateData) {
            lifecycle_1.dispose(templateData.toDispose);
        }
    };
    ReplSimpleElementsRenderer.ID = 'simpleReplElement';
    __decorate([
        decorators_1.memoize
    ], ReplSimpleElementsRenderer.prototype, "linkDetector", null);
    ReplSimpleElementsRenderer = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, label_1.ILabelService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, themeService_1.IThemeService)
    ], ReplSimpleElementsRenderer);
    class ReplRawObjectsRenderer {
        get templateId() {
            return ReplRawObjectsRenderer.ID;
        }
        renderTemplate(container) {
            dom.addClass(container, 'output');
            const expression = dom.append(container, $('.output.expression'));
            const name = dom.append(expression, $('span.name'));
            const label = new highlightedLabel_1.HighlightedLabel(name, false);
            const value = dom.append(expression, $('span.value'));
            const annotation = dom.append(expression, $('span'));
            return { container, expression, name, label, value, annotation };
        }
        renderElement(node, index, templateData) {
            // key
            const element = node.element;
            templateData.label.set(element.name ? `${element.name}:` : '', filters_1.createMatches(node.filterData));
            if (element.name) {
                templateData.name.textContent = `${element.name}:`;
            }
            else {
                templateData.name.textContent = '';
            }
            // value
            baseDebugView_1.renderExpressionValue(element.value, templateData.value, {
                preserveWhitespace: true,
                showHover: false
            });
            // annotation if any
            if (element.annotation) {
                templateData.annotation.className = 'annotation octicon octicon-info';
                templateData.annotation.title = element.annotation;
            }
            else {
                templateData.annotation.className = '';
                templateData.annotation.title = '';
            }
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    ReplRawObjectsRenderer.ID = 'rawObject';
    class ReplDelegate {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        getHeight(element) {
            const countNumberOfLines = (str) => Math.max(1, (str && str.match(/\r\n|\n/g) || []).length);
            // Give approximate heights. Repl has dynamic height so the tree will measure the actual height on its own.
            const config = this.configurationService.getValue('debug');
            const fontSize = config.console.fontSize;
            const rowHeight = Math.ceil(1.4 * fontSize);
            const wordWrap = config.console.wordWrap;
            if (!wordWrap) {
                return element instanceof debugModel_1.Expression ? 2 * rowHeight : rowHeight;
            }
            // In order to keep scroll position we need to give a good approximation to the tree
            // For every 150 characters increase the number of lines needed
            if (element instanceof debugModel_1.Expression) {
                let { name, value } = element;
                let nameRows = countNumberOfLines(name) + Math.floor(name.length / 150);
                if (element.hasChildren) {
                    return (nameRows + 1) * rowHeight;
                }
                let valueRows = value ? (countNumberOfLines(value) + Math.floor(value.length / 150)) : 0;
                return rowHeight * (nameRows + valueRows);
            }
            if (element instanceof debugModel_1.SimpleReplElement) {
                let value = element.value;
                let valueRows = countNumberOfLines(value) + Math.floor(value.length / 150);
                return valueRows * rowHeight;
            }
            return rowHeight;
        }
        getTemplateId(element) {
            if (element instanceof debugModel_1.Variable && element.name) {
                return variablesView_1.VariablesRenderer.ID;
            }
            if (element instanceof debugModel_1.Expression) {
                return ReplExpressionsRenderer.ID;
            }
            if (element instanceof debugModel_1.SimpleReplElement || (element instanceof debugModel_1.Variable && !element.name)) {
                // Variable with no name is a top level variable which should be rendered like a repl element #17404
                return ReplSimpleElementsRenderer.ID;
            }
            return ReplRawObjectsRenderer.ID;
        }
        hasDynamicHeight(element) {
            // Empty elements should not have dynamic height since they will be invisible
            return element.toString().length > 0;
        }
    }
    function isDebugSession(obj) {
        return typeof obj.getReplElements === 'function';
    }
    class ReplDataSource {
        hasChildren(element) {
            if (isDebugSession(element)) {
                return true;
            }
            return !!element.hasChildren;
        }
        getChildren(element) {
            if (isDebugSession(element)) {
                return Promise.resolve(element.getReplElements());
            }
            if (element instanceof debugModel_1.RawObjectReplElement) {
                return element.getChildren();
            }
            return element.getChildren();
        }
    }
    class ReplAccessibilityProvider {
        getAriaLabel(element) {
            if (element instanceof debugModel_1.Variable) {
                return nls.localize('replVariableAriaLabel', "Variable {0} has value {1}, read eval print loop, debug", element.name, element.value);
            }
            if (element instanceof debugModel_1.Expression) {
                return nls.localize('replExpressionAriaLabel', "Expression {0} has value {1}, read eval print loop, debug", element.name, element.value);
            }
            if (element instanceof debugModel_1.SimpleReplElement) {
                return nls.localize('replValueOutputAriaLabel', "{0}, read eval print loop, debug", element.value);
            }
            if (element instanceof debugModel_1.RawObjectReplElement) {
                return nls.localize('replRawObjectAriaLabel', "Repl variable {0} has value {1}, read eval print loop, debug", element.name, element.value);
            }
            return '';
        }
    }
    // Repl actions and commands
    class AcceptReplInputAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'repl.action.acceptInput',
                label: nls.localize({ key: 'actions.repl.acceptInput', comment: ['Apply input from the debug console input box'] }, "REPL Accept Input"),
                alias: 'REPL Accept Input',
                precondition: debug_1.CONTEXT_IN_DEBUG_REPL,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 3 /* Enter */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            suggestController_1.SuggestController.get(editor).acceptSelectedSuggestion();
            accessor.get(IPrivateReplService).acceptReplInput();
        }
    }
    class FilterReplAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'repl.action.filter',
                label: nls.localize('repl.action.filter', "REPL Focus Content to Filter"),
                alias: 'REPL Filter',
                precondition: debug_1.CONTEXT_IN_DEBUG_REPL,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* CtrlCmd */ | 36 /* KEY_F */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            suggestController_1.SuggestController.get(editor).acceptSelectedSuggestion();
            accessor.get(IPrivateReplService).focusRepl();
        }
    }
    class ReplCopyAllAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'repl.action.copyAll',
                label: nls.localize('actions.repl.copyAll', "Debug: Console Copy All"),
                alias: 'Debug Console Copy All',
                precondition: debug_1.CONTEXT_IN_DEBUG_REPL,
            });
        }
        run(accessor, editor) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            return clipboardService.writeText(accessor.get(IPrivateReplService).getVisibleContent());
        }
    }
    editorExtensions_1.registerEditorAction(AcceptReplInputAction);
    editorExtensions_1.registerEditorAction(ReplCopyAllAction);
    editorExtensions_1.registerEditorAction(FilterReplAction);
    class SelectReplActionViewItem extends debugActionViewItems_1.FocusSessionActionViewItem {
        getActionContext(_, index) {
            return this.debugService.getModel().getSessions(true)[index];
        }
        getSessions() {
            return this.debugService.getModel().getSessions(true).filter(s => !sessionsToIgnore.has(s));
        }
    }
    let SelectReplAction = class SelectReplAction extends actions_1.Action {
        constructor(id, label, debugService, replService) {
            super(id, label);
            this.debugService = debugService;
            this.replService = replService;
        }
        run(session) {
            // If session is already the focused session we need to manualy update the tree since view model will not send a focused change event
            if (session && session.state !== 0 /* Inactive */ && session !== this.debugService.getViewModel().focusedSession) {
                this.debugService.focusStackFrame(undefined, undefined, session, true);
            }
            else {
                this.replService.selectSession(session);
            }
            return Promise.resolve(undefined);
        }
    };
    SelectReplAction.ID = 'workbench.action.debug.selectRepl';
    SelectReplAction.LABEL = nls.localize('selectRepl', "Select Debug Console");
    SelectReplAction = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, IPrivateReplService)
    ], SelectReplAction);
    let ClearReplAction = class ClearReplAction extends actions_1.Action {
        constructor(id, label, panelService) {
            super(id, label, 'debug-action clear-repl');
            this.panelService = panelService;
        }
        run() {
            const repl = this.panelService.openPanel(debug_1.REPL_ID);
            repl.clearRepl();
            aria.status(nls.localize('debugConsoleCleared', "Debug console was cleared"));
            return Promise.resolve(undefined);
        }
    };
    ClearReplAction.ID = 'workbench.debug.panel.action.clearReplAction';
    ClearReplAction.LABEL = nls.localize('clearRepl', "Clear Console");
    ClearReplAction = __decorate([
        __param(2, panelService_1.IPanelService)
    ], ClearReplAction);
    exports.ClearReplAction = ClearReplAction;
});
//# sourceMappingURL=repl.js.map