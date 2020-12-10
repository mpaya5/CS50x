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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/json", "vs/base/common/severity", "vs/base/common/actions", "vs/editor/common/model/wordHelper", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/configuration/common/configuration", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/workbench/contrib/debug/browser/debugActions", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/browser/exceptionWidget", "vs/workbench/browser/parts/editor/editorWidgets", "vs/editor/common/core/position", "vs/editor/browser/controller/coreCommands", "vs/base/common/arrays", "vs/platform/keybinding/common/keybinding", "vs/base/browser/contextmenu", "vs/base/common/decorators", "vs/platform/dialogs/common/dialogs", "vs/editor/contrib/hover/getHover", "vs/base/common/cancellation", "vs/workbench/contrib/debug/browser/breakpointWidget", "vs/workbench/contrib/debug/browser/debugHover"], function (require, exports, nls, async_1, lifecycle, env, json_1, severity_1, actions_1, wordHelper_1, editorExtensions_1, codeEditorService_1, range_1, instantiation_1, telemetry_1, configuration_1, commands_1, contextkey_1, contextView_1, debugActions_1, debug_1, exceptionWidget_1, editorWidgets_1, position_1, coreCommands_1, arrays_1, keybinding_1, contextmenu_1, decorators_1, dialogs_1, getHover_1, cancellation_1, breakpointWidget_1, debugHover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const HOVER_DELAY = 300;
    const LAUNCH_JSON_REGEX = /launch\.json$/;
    const INLINE_VALUE_DECORATION_KEY = 'inlinevaluedecoration';
    const MAX_NUM_INLINE_VALUES = 100; // JS Global scope can have 700+ entries. We want to limit ourselves for perf reasons
    const MAX_INLINE_DECORATOR_LENGTH = 150; // Max string length of each inline decorator when debugging. If exceeded ... is added
    const MAX_TOKENIZATION_LINE_LEN = 500; // If line is too long, then inline values for the line are skipped
    let DebugEditorContribution = class DebugEditorContribution {
        constructor(editor, debugService, contextMenuService, instantiationService, contextKeyService, commandService, codeEditorService, telemetryService, configurationService, keybindingService, dialogService) {
            this.editor = editor;
            this.debugService = debugService;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this.commandService = commandService;
            this.codeEditorService = codeEditorService;
            this.telemetryService = telemetryService;
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this.dialogService = dialogService;
            this.hoverRange = null;
            this.mouseDown = false;
            this.breakpointHintDecoration = [];
            this.hoverWidget = this.instantiationService.createInstance(debugHover_1.DebugHoverWidget, this.editor);
            this.toDispose = [];
            this.registerListeners();
            this.breakpointWidgetVisible = debug_1.CONTEXT_BREAKPOINT_WIDGET_VISIBLE.bindTo(contextKeyService);
            this.updateConfigurationWidgetVisibility();
            this.codeEditorService.registerDecorationType(INLINE_VALUE_DECORATION_KEY, {});
            this.toggleExceptionWidget();
        }
        getContextMenuActions(breakpoints, uri, lineNumber) {
            const actions = [];
            if (breakpoints.length === 1) {
                const breakpointType = breakpoints[0].logMessage ? nls.localize('logPoint', "Logpoint") : nls.localize('breakpoint', "Breakpoint");
                actions.push(new debugActions_1.RemoveBreakpointAction(debugActions_1.RemoveBreakpointAction.ID, nls.localize('removeBreakpoint', "Remove {0}", breakpointType), this.debugService, this.keybindingService));
                actions.push(new actions_1.Action('workbench.debug.action.editBreakpointAction', nls.localize('editBreakpoint', "Edit {0}...", breakpointType), undefined, true, () => Promise.resolve(this.editor.getContribution(debug_1.EDITOR_CONTRIBUTION_ID).showBreakpointWidget(breakpoints[0].lineNumber, breakpoints[0].column))));
                actions.push(new actions_1.Action(`workbench.debug.viewlet.action.toggleBreakpoint`, breakpoints[0].enabled ? nls.localize('disableBreakpoint', "Disable {0}", breakpointType) : nls.localize('enableBreakpoint', "Enable {0}", breakpointType), undefined, true, () => this.debugService.enableOrDisableBreakpoints(!breakpoints[0].enabled, breakpoints[0])));
            }
            else if (breakpoints.length > 1) {
                const sorted = breakpoints.slice().sort((first, second) => (first.column && second.column) ? first.column - second.column : 1);
                actions.push(new contextmenu_1.ContextSubMenu(nls.localize('removeBreakpoints', "Remove Breakpoints"), sorted.map(bp => new actions_1.Action('removeInlineBreakpoint', bp.column ? nls.localize('removeInlineBreakpointOnColumn', "Remove Inline Breakpoint on Column {0}", bp.column) : nls.localize('removeLineBreakpoint', "Remove Line Breakpoint"), undefined, true, () => this.debugService.removeBreakpoints(bp.getId())))));
                actions.push(new contextmenu_1.ContextSubMenu(nls.localize('editBreakpoints', "Edit Breakpoints"), sorted.map(bp => new actions_1.Action('editBreakpoint', bp.column ? nls.localize('editInlineBreakpointOnColumn', "Edit Inline Breakpoint on Column {0}", bp.column) : nls.localize('editLineBrekapoint', "Edit Line Breakpoint"), undefined, true, () => Promise.resolve(this.editor.getContribution(debug_1.EDITOR_CONTRIBUTION_ID).showBreakpointWidget(bp.lineNumber, bp.column))))));
                actions.push(new contextmenu_1.ContextSubMenu(nls.localize('enableDisableBreakpoints', "Enable/Disable Breakpoints"), sorted.map(bp => new actions_1.Action(bp.enabled ? 'disableColumnBreakpoint' : 'enableColumnBreakpoint', bp.enabled ? (bp.column ? nls.localize('disableInlineColumnBreakpoint', "Disable Inline Breakpoint on Column {0}", bp.column) : nls.localize('disableBreakpointOnLine', "Disable Line Breakpoint"))
                    : (bp.column ? nls.localize('enableBreakpoints', "Enable Inline Breakpoint on Column {0}", bp.column) : nls.localize('enableBreakpointOnLine', "Enable Line Breakpoint")), undefined, true, () => this.debugService.enableOrDisableBreakpoints(!bp.enabled, bp)))));
            }
            else {
                actions.push(new actions_1.Action('addBreakpoint', nls.localize('addBreakpoint', "Add Breakpoint"), undefined, true, () => this.debugService.addBreakpoints(uri, [{ lineNumber }], `debugEditorContextMenu`)));
                actions.push(new actions_1.Action('addConditionalBreakpoint', nls.localize('addConditionalBreakpoint', "Add Conditional Breakpoint..."), undefined, true, () => Promise.resolve(this.editor.getContribution(debug_1.EDITOR_CONTRIBUTION_ID).showBreakpointWidget(lineNumber, undefined))));
                actions.push(new actions_1.Action('addLogPoint', nls.localize('addLogPoint', "Add Logpoint..."), undefined, true, () => Promise.resolve(this.editor.getContribution(debug_1.EDITOR_CONTRIBUTION_ID).showBreakpointWidget(lineNumber, undefined, 2 /* LOG_MESSAGE */))));
            }
            return actions;
        }
        registerListeners() {
            this.toDispose.push(this.editor.onMouseDown((e) => {
                const data = e.target.detail;
                const model = this.editor.getModel();
                if (!e.target.position || !model || e.target.type !== 2 /* GUTTER_GLYPH_MARGIN */ || data.isAfterLines || !this.marginFreeFromNonDebugDecorations(e.target.position.lineNumber)) {
                    return;
                }
                const canSetBreakpoints = this.debugService.getConfigurationManager().canSetBreakpointsIn(model);
                const lineNumber = e.target.position.lineNumber;
                const uri = model.uri;
                if (e.event.rightButton || (env.isMacintosh && e.event.leftButton && e.event.ctrlKey)) {
                    if (!canSetBreakpoints) {
                        return;
                    }
                    const anchor = { x: e.event.posx, y: e.event.posy };
                    const breakpoints = this.debugService.getModel().getBreakpoints({ lineNumber, uri });
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => anchor,
                        getActions: () => this.getContextMenuActions(breakpoints, uri, lineNumber),
                        getActionsContext: () => breakpoints.length ? breakpoints[0] : undefined
                    });
                }
                else {
                    const breakpoints = this.debugService.getModel().getBreakpoints({ uri, lineNumber });
                    if (breakpoints.length) {
                        // Show the dialog if there is a potential condition to be accidently lost.
                        // Do not show dialog on linux due to electron issue freezing the mouse #50026
                        if (!env.isLinux && breakpoints.some(bp => !!bp.condition || !!bp.logMessage || !!bp.hitCondition)) {
                            const logPoint = breakpoints.every(bp => !!bp.logMessage);
                            const breakpointType = logPoint ? nls.localize('logPoint', "Logpoint") : nls.localize('breakpoint', "Breakpoint");
                            const disable = breakpoints.some(bp => bp.enabled);
                            const enabling = nls.localize('breakpointHasConditionDisabled', "This {0} has a {1} that will get lost on remove. Consider enabling the {0} instead.", breakpointType.toLowerCase(), logPoint ? nls.localize('message', "message") : nls.localize('condition', "condition"));
                            const disabling = nls.localize('breakpointHasConditionEnabled', "This {0} has a {1} that will get lost on remove. Consider disabling the {0} instead.", breakpointType.toLowerCase(), logPoint ? nls.localize('message', "message") : nls.localize('condition', "condition"));
                            this.dialogService.show(severity_1.default.Info, disable ? disabling : enabling, [
                                nls.localize('removeLogPoint', "Remove {0}", breakpointType),
                                nls.localize('disableLogPoint', "{0} {1}", disable ? nls.localize('disable', "Disable") : nls.localize('enable', "Enable"), breakpointType),
                                nls.localize('cancel', "Cancel")
                            ], { cancelId: 2 }).then(choice => {
                                if (choice === 0) {
                                    breakpoints.forEach(bp => this.debugService.removeBreakpoints(bp.getId()));
                                }
                                if (choice === 1) {
                                    breakpoints.forEach(bp => this.debugService.enableOrDisableBreakpoints(!disable, bp));
                                }
                            });
                        }
                        else {
                            breakpoints.forEach(bp => this.debugService.removeBreakpoints(bp.getId()));
                        }
                    }
                    else if (canSetBreakpoints) {
                        this.debugService.addBreakpoints(uri, [{ lineNumber }], `debugEditorGutter`);
                    }
                }
            }));
            this.toDispose.push(this.editor.onMouseMove((e) => {
                let showBreakpointHintAtLineNumber = -1;
                const model = this.editor.getModel();
                if (model && e.target.position && e.target.type === 2 /* GUTTER_GLYPH_MARGIN */ && this.debugService.getConfigurationManager().canSetBreakpointsIn(model) &&
                    this.marginFreeFromNonDebugDecorations(e.target.position.lineNumber)) {
                    const data = e.target.detail;
                    if (!data.isAfterLines) {
                        showBreakpointHintAtLineNumber = e.target.position.lineNumber;
                    }
                }
                this.ensureBreakpointHintDecoration(showBreakpointHintAtLineNumber);
            }));
            this.toDispose.push(this.editor.onMouseLeave((e) => {
                this.ensureBreakpointHintDecoration(-1);
            }));
            this.toDispose.push(this.debugService.getViewModel().onDidFocusStackFrame(e => this.onFocusStackFrame(e.stackFrame)));
            // hover listeners & hover widget
            this.toDispose.push(this.editor.onMouseDown((e) => this.onEditorMouseDown(e)));
            this.toDispose.push(this.editor.onMouseUp(() => this.mouseDown = false));
            this.toDispose.push(this.editor.onMouseMove((e) => this.onEditorMouseMove(e)));
            this.toDispose.push(this.editor.onMouseLeave((e) => {
                this.provideNonDebugHoverScheduler.cancel();
                const hoverDomNode = this.hoverWidget.getDomNode();
                if (!hoverDomNode) {
                    return;
                }
                const rect = hoverDomNode.getBoundingClientRect();
                // Only hide the hover widget if the editor mouse leave event is outside the hover widget #3528
                if (e.event.posx < rect.left || e.event.posx > rect.right || e.event.posy < rect.top || e.event.posy > rect.bottom) {
                    this.hideHoverWidget();
                }
            }));
            this.toDispose.push(this.editor.onKeyDown((e) => this.onKeyDown(e)));
            this.toDispose.push(this.editor.onDidChangeModelContent(() => {
                this.wordToLineNumbersMap = undefined;
                this.updateInlineValuesScheduler.schedule();
            }));
            this.toDispose.push(this.editor.onDidChangeModel(() => {
                const stackFrame = this.debugService.getViewModel().focusedStackFrame;
                const model = this.editor.getModel();
                if (model) {
                    this._applyHoverConfiguration(model, stackFrame);
                }
                this.closeBreakpointWidget();
                this.toggleExceptionWidget();
                this.hideHoverWidget();
                this.updateConfigurationWidgetVisibility();
                this.wordToLineNumbersMap = undefined;
                this.updateInlineValueDecorations(stackFrame);
            }));
            this.toDispose.push(this.editor.onDidScrollChange(() => this.hideHoverWidget));
            this.toDispose.push(this.debugService.onDidChangeState((state) => {
                if (state !== 2 /* Stopped */) {
                    this.toggleExceptionWidget();
                }
            }));
        }
        _applyHoverConfiguration(model, stackFrame) {
            if (stackFrame && model.uri.toString() === stackFrame.source.uri.toString()) {
                this.editor.updateOptions({
                    hover: {
                        enabled: false
                    }
                });
            }
            else {
                let overrides = {
                    resource: model.uri,
                    overrideIdentifier: model.getLanguageIdentifier().language
                };
                const defaultConfiguration = this.configurationService.getValue('editor.hover', overrides);
                this.editor.updateOptions({
                    hover: {
                        enabled: defaultConfiguration.enabled,
                        delay: defaultConfiguration.delay,
                        sticky: defaultConfiguration.sticky
                    }
                });
            }
        }
        getId() {
            return debug_1.EDITOR_CONTRIBUTION_ID;
        }
        showHover(range, focus) {
            const sf = this.debugService.getViewModel().focusedStackFrame;
            const model = this.editor.getModel();
            if (sf && model && sf.source.uri.toString() === model.uri.toString()) {
                return this.hoverWidget.showAt(range, focus);
            }
            return Promise.resolve();
        }
        marginFreeFromNonDebugDecorations(line) {
            const decorations = this.editor.getLineDecorations(line);
            if (decorations) {
                for (const { options } of decorations) {
                    if (options.glyphMarginClassName && options.glyphMarginClassName.indexOf('debug') === -1) {
                        return false;
                    }
                }
            }
            return true;
        }
        ensureBreakpointHintDecoration(showBreakpointHintAtLineNumber) {
            const newDecoration = [];
            if (showBreakpointHintAtLineNumber !== -1) {
                newDecoration.push({
                    options: DebugEditorContribution.BREAKPOINT_HELPER_DECORATION,
                    range: {
                        startLineNumber: showBreakpointHintAtLineNumber,
                        startColumn: 1,
                        endLineNumber: showBreakpointHintAtLineNumber,
                        endColumn: 1
                    }
                });
            }
            this.breakpointHintDecoration = this.editor.deltaDecorations(this.breakpointHintDecoration, newDecoration);
        }
        onFocusStackFrame(sf) {
            const model = this.editor.getModel();
            if (model) {
                this._applyHoverConfiguration(model, sf);
                if (sf && sf.source.uri.toString() === model.uri.toString()) {
                    this.toggleExceptionWidget();
                }
                else {
                    this.hideHoverWidget();
                }
            }
            this.updateInlineValueDecorations(sf);
        }
        get showHoverScheduler() {
            const scheduler = new async_1.RunOnceScheduler(() => {
                if (this.hoverRange) {
                    this.showHover(this.hoverRange, false);
                }
            }, HOVER_DELAY);
            this.toDispose.push(scheduler);
            return scheduler;
        }
        get hideHoverScheduler() {
            const scheduler = new async_1.RunOnceScheduler(() => {
                if (!this.hoverWidget.isHovered()) {
                    this.hoverWidget.hide();
                }
            }, 2 * HOVER_DELAY);
            this.toDispose.push(scheduler);
            return scheduler;
        }
        get provideNonDebugHoverScheduler() {
            const scheduler = new async_1.RunOnceScheduler(() => {
                if (this.editor.hasModel() && this.nonDebugHoverPosition) {
                    getHover_1.getHover(this.editor.getModel(), this.nonDebugHoverPosition, cancellation_1.CancellationToken.None);
                }
            }, HOVER_DELAY);
            this.toDispose.push(scheduler);
            return scheduler;
        }
        hideHoverWidget() {
            if (!this.hideHoverScheduler.isScheduled() && this.hoverWidget.isVisible()) {
                this.hideHoverScheduler.schedule();
            }
            this.showHoverScheduler.cancel();
            this.provideNonDebugHoverScheduler.cancel();
        }
        // hover business
        onEditorMouseDown(mouseEvent) {
            this.mouseDown = true;
            if (mouseEvent.target.type === 9 /* CONTENT_WIDGET */ && mouseEvent.target.detail === debugHover_1.DebugHoverWidget.ID) {
                return;
            }
            this.hideHoverWidget();
        }
        onEditorMouseMove(mouseEvent) {
            if (this.debugService.state !== 2 /* Stopped */) {
                return;
            }
            if (this.configurationService.getValue('debug').enableAllHovers && mouseEvent.target.position) {
                this.nonDebugHoverPosition = mouseEvent.target.position;
                this.provideNonDebugHoverScheduler.schedule();
            }
            const targetType = mouseEvent.target.type;
            const stopKey = env.isMacintosh ? 'metaKey' : 'ctrlKey';
            if (targetType === 9 /* CONTENT_WIDGET */ && mouseEvent.target.detail === debugHover_1.DebugHoverWidget.ID && !mouseEvent.event[stopKey]) {
                // mouse moved on top of debug hover widget
                return;
            }
            if (targetType === 6 /* CONTENT_TEXT */) {
                if (mouseEvent.target.range && !mouseEvent.target.range.equalsRange(this.hoverRange)) {
                    this.hoverRange = mouseEvent.target.range;
                    this.showHoverScheduler.schedule();
                }
            }
            else if (!this.mouseDown) {
                // Do not hide debug hover when the mouse is pressed because it usually leads to accidental closing #64620
                this.hideHoverWidget();
            }
        }
        onKeyDown(e) {
            const stopKey = env.isMacintosh ? 57 /* Meta */ : 5 /* Ctrl */;
            if (e.keyCode !== stopKey) {
                // do not hide hover when Ctrl/Meta is pressed
                this.hideHoverWidget();
            }
        }
        // end hover business
        // breakpoint widget
        showBreakpointWidget(lineNumber, column, context) {
            if (this.breakpointWidget) {
                this.breakpointWidget.dispose();
            }
            this.breakpointWidget = this.instantiationService.createInstance(breakpointWidget_1.BreakpointWidget, this.editor, lineNumber, context);
            this.breakpointWidget.show({ lineNumber, column: 1 }, 2);
            this.breakpointWidgetVisible.set(true);
        }
        closeBreakpointWidget() {
            if (this.breakpointWidget) {
                this.breakpointWidget.dispose();
                this.breakpointWidget = undefined;
                this.breakpointWidgetVisible.reset();
                this.editor.focus();
            }
        }
        // exception widget
        toggleExceptionWidget() {
            // Toggles exception widget based on the state of the current editor model and debug stack frame
            const model = this.editor.getModel();
            const focusedSf = this.debugService.getViewModel().focusedStackFrame;
            const callStack = focusedSf ? focusedSf.thread.getCallStack() : null;
            if (!model || !focusedSf || !callStack || callStack.length === 0) {
                this.closeExceptionWidget();
                return;
            }
            // First call stack frame that is available is the frame where exception has been thrown
            const exceptionSf = arrays_1.first(callStack, sf => !!(sf && sf.source && sf.source.available && sf.source.presentationHint !== 'deemphasize'), undefined);
            if (!exceptionSf || exceptionSf !== focusedSf) {
                this.closeExceptionWidget();
                return;
            }
            const sameUri = exceptionSf.source.uri.toString() === model.uri.toString();
            if (this.exceptionWidget && !sameUri) {
                this.closeExceptionWidget();
            }
            else if (sameUri) {
                focusedSf.thread.exceptionInfo.then(exceptionInfo => {
                    if (exceptionInfo && exceptionSf.range.startLineNumber && exceptionSf.range.startColumn) {
                        this.showExceptionWidget(exceptionInfo, exceptionSf.range.startLineNumber, exceptionSf.range.startColumn);
                    }
                });
            }
        }
        showExceptionWidget(exceptionInfo, lineNumber, column) {
            if (this.exceptionWidget) {
                this.exceptionWidget.dispose();
            }
            this.exceptionWidget = this.instantiationService.createInstance(exceptionWidget_1.ExceptionWidget, this.editor, exceptionInfo);
            this.exceptionWidget.show({ lineNumber, column }, 0);
            this.editor.revealLine(lineNumber);
        }
        closeExceptionWidget() {
            if (this.exceptionWidget) {
                this.exceptionWidget.dispose();
                this.exceptionWidget = undefined;
            }
        }
        // configuration widget
        updateConfigurationWidgetVisibility() {
            const model = this.editor.getModel();
            if (this.configurationWidget) {
                this.configurationWidget.dispose();
            }
            if (model && LAUNCH_JSON_REGEX.test(model.uri.toString()) && !this.editor.getConfiguration().readOnly) {
                this.configurationWidget = this.instantiationService.createInstance(editorWidgets_1.FloatingClickWidget, this.editor, nls.localize('addConfiguration', "Add Configuration..."), null);
                this.configurationWidget.render();
                this.toDispose.push(this.configurationWidget.onClick(() => this.addLaunchConfiguration()));
            }
        }
        addLaunchConfiguration() {
            /* __GDPR__
                "debug/addLaunchConfiguration" : {}
            */
            this.telemetryService.publicLog('debug/addLaunchConfiguration');
            let configurationsArrayPosition;
            const model = this.editor.getModel();
            if (!model) {
                return Promise.resolve();
            }
            let depthInArray = 0;
            let lastProperty;
            json_1.visit(model.getValue(), {
                onObjectProperty: (property, offset, length) => {
                    lastProperty = property;
                },
                onArrayBegin: (offset, length) => {
                    if (lastProperty === 'configurations' && depthInArray === 0) {
                        configurationsArrayPosition = model.getPositionAt(offset + 1);
                    }
                    depthInArray++;
                },
                onArrayEnd: () => {
                    depthInArray--;
                }
            });
            this.editor.focus();
            if (!configurationsArrayPosition) {
                return Promise.resolve();
            }
            const insertLine = (position) => {
                // Check if there are more characters on a line after a "configurations": [, if yes enter a newline
                if (model.getLineLastNonWhitespaceColumn(position.lineNumber) > position.column) {
                    this.editor.setPosition(position);
                    coreCommands_1.CoreEditingCommands.LineBreakInsert.runEditorCommand(null, this.editor, null);
                }
                this.editor.setPosition(position);
                return this.commandService.executeCommand('editor.action.insertLineAfter');
            };
            return insertLine(configurationsArrayPosition).then(() => this.commandService.executeCommand('editor.action.triggerSuggest'));
        }
        // Inline Decorations
        get removeInlineValuesScheduler() {
            return new async_1.RunOnceScheduler(() => this.editor.removeDecorations(INLINE_VALUE_DECORATION_KEY), 100);
        }
        get updateInlineValuesScheduler() {
            return new async_1.RunOnceScheduler(() => this.updateInlineValueDecorations(this.debugService.getViewModel().focusedStackFrame), 200);
        }
        updateInlineValueDecorations(stackFrame) {
            const model = this.editor.getModel();
            if (!this.configurationService.getValue('debug').inlineValues ||
                !model || !stackFrame || model.uri.toString() !== stackFrame.source.uri.toString()) {
                if (!this.removeInlineValuesScheduler.isScheduled()) {
                    this.removeInlineValuesScheduler.schedule();
                }
                return;
            }
            this.removeInlineValuesScheduler.cancel();
            stackFrame.getMostSpecificScopes(stackFrame.range)
                // Get all top level children in the scope chain
                .then(scopes => Promise.all(scopes.map(scope => scope.getChildren()
                .then(children => {
                let range = new range_1.Range(0, 0, stackFrame.range.startLineNumber, stackFrame.range.startColumn);
                if (scope.range) {
                    range = range.setStartPosition(scope.range.startLineNumber, scope.range.startColumn);
                }
                return this.createInlineValueDecorationsInsideRange(children, range, model);
            }))).then(decorationsPerScope => {
                const allDecorations = decorationsPerScope.reduce((previous, current) => previous.concat(current), []);
                this.editor.setDecorations(INLINE_VALUE_DECORATION_KEY, allDecorations);
            }));
        }
        createInlineValueDecorationsInsideRange(expressions, range, model) {
            const nameValueMap = new Map();
            for (let expr of expressions) {
                nameValueMap.set(expr.name, expr.value);
                // Limit the size of map. Too large can have a perf impact
                if (nameValueMap.size >= MAX_NUM_INLINE_VALUES) {
                    break;
                }
            }
            const lineToNamesMap = new Map();
            const wordToPositionsMap = this.getWordToPositionsMap();
            // Compute unique set of names on each line
            nameValueMap.forEach((value, name) => {
                const positions = wordToPositionsMap.get(name);
                if (positions) {
                    for (let position of positions) {
                        if (range.containsPosition(position)) {
                            if (!lineToNamesMap.has(position.lineNumber)) {
                                lineToNamesMap.set(position.lineNumber, []);
                            }
                            if (lineToNamesMap.get(position.lineNumber).indexOf(name) === -1) {
                                lineToNamesMap.get(position.lineNumber).push(name);
                            }
                        }
                    }
                }
            });
            const decorations = [];
            // Compute decorators for each line
            lineToNamesMap.forEach((names, line) => {
                const contentText = names.sort((first, second) => {
                    const content = model.getLineContent(line);
                    return content.indexOf(first) - content.indexOf(second);
                }).map(name => `${name} = ${nameValueMap.get(name)}`).join(', ');
                decorations.push(this.createInlineValueDecoration(line, contentText));
            });
            return decorations;
        }
        createInlineValueDecoration(lineNumber, contentText) {
            // If decoratorText is too long, trim and add ellipses. This could happen for minified files with everything on a single line
            if (contentText.length > MAX_INLINE_DECORATOR_LENGTH) {
                contentText = contentText.substr(0, MAX_INLINE_DECORATOR_LENGTH) + '...';
            }
            return {
                range: {
                    startLineNumber: lineNumber,
                    endLineNumber: lineNumber,
                    startColumn: 1073741824 /* MAX_SAFE_SMALL_INTEGER */,
                    endColumn: 1073741824 /* MAX_SAFE_SMALL_INTEGER */
                },
                renderOptions: {
                    after: {
                        contentText,
                        backgroundColor: 'rgba(255, 200, 0, 0.2)',
                        margin: '10px'
                    },
                    dark: {
                        after: {
                            color: 'rgba(255, 255, 255, 0.5)',
                        }
                    },
                    light: {
                        after: {
                            color: 'rgba(0, 0, 0, 0.5)',
                        }
                    }
                }
            };
        }
        getWordToPositionsMap() {
            if (!this.wordToLineNumbersMap) {
                this.wordToLineNumbersMap = new Map();
                const model = this.editor.getModel();
                if (!model) {
                    return this.wordToLineNumbersMap;
                }
                // For every word in every line, map its ranges for fast lookup
                for (let lineNumber = 1, len = model.getLineCount(); lineNumber <= len; ++lineNumber) {
                    const lineContent = model.getLineContent(lineNumber);
                    // If line is too long then skip the line
                    if (lineContent.length > MAX_TOKENIZATION_LINE_LEN) {
                        continue;
                    }
                    model.forceTokenization(lineNumber);
                    const lineTokens = model.getLineTokens(lineNumber);
                    for (let tokenIndex = 0, tokenCount = lineTokens.getCount(); tokenIndex < tokenCount; tokenIndex++) {
                        const tokenStartOffset = lineTokens.getStartOffset(tokenIndex);
                        const tokenEndOffset = lineTokens.getEndOffset(tokenIndex);
                        const tokenType = lineTokens.getStandardTokenType(tokenIndex);
                        const tokenStr = lineContent.substring(tokenStartOffset, tokenEndOffset);
                        // Token is a word and not a comment
                        if (tokenType === 0 /* Other */) {
                            wordHelper_1.DEFAULT_WORD_REGEXP.lastIndex = 0; // We assume tokens will usually map 1:1 to words if they match
                            const wordMatch = wordHelper_1.DEFAULT_WORD_REGEXP.exec(tokenStr);
                            if (wordMatch) {
                                const word = wordMatch[0];
                                if (!this.wordToLineNumbersMap.has(word)) {
                                    this.wordToLineNumbersMap.set(word, []);
                                }
                                this.wordToLineNumbersMap.get(word).push(new position_1.Position(lineNumber, tokenStartOffset));
                            }
                        }
                    }
                }
            }
            return this.wordToLineNumbersMap;
        }
        dispose() {
            if (this.breakpointWidget) {
                this.breakpointWidget.dispose();
            }
            if (this.hoverWidget) {
                this.hoverWidget.dispose();
            }
            if (this.configurationWidget) {
                this.configurationWidget.dispose();
            }
            this.toDispose = lifecycle.dispose(this.toDispose);
        }
    };
    DebugEditorContribution.BREAKPOINT_HELPER_DECORATION = {
        glyphMarginClassName: 'debug-breakpoint-hint',
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */
    };
    __decorate([
        decorators_1.memoize
    ], DebugEditorContribution.prototype, "showHoverScheduler", null);
    __decorate([
        decorators_1.memoize
    ], DebugEditorContribution.prototype, "hideHoverScheduler", null);
    __decorate([
        decorators_1.memoize
    ], DebugEditorContribution.prototype, "provideNonDebugHoverScheduler", null);
    __decorate([
        decorators_1.memoize
    ], DebugEditorContribution.prototype, "removeInlineValuesScheduler", null);
    __decorate([
        decorators_1.memoize
    ], DebugEditorContribution.prototype, "updateInlineValuesScheduler", null);
    DebugEditorContribution = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, commands_1.ICommandService),
        __param(6, codeEditorService_1.ICodeEditorService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, dialogs_1.IDialogService)
    ], DebugEditorContribution);
    exports.DebugEditorContribution = DebugEditorContribution;
    editorExtensions_1.registerEditorContribution(DebugEditorContribution);
});
//# sourceMappingURL=debugEditorContribution.js.map