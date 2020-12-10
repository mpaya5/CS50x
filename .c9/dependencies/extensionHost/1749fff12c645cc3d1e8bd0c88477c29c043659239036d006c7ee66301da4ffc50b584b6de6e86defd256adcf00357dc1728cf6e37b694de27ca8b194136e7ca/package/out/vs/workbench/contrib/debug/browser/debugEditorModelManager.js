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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/workbench/contrib/debug/common/debug", "vs/editor/common/services/modelService", "vs/base/common/htmlContent", "vs/workbench/contrib/debug/browser/breakpointsView", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/nls", "vs/base/common/errors"], function (require, exports, lifecycle, range_1, debug_1, modelService_1, htmlContent_1, breakpointsView_1, themeService_1, colorRegistry_1, nls_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DebugEditorModelManager = class DebugEditorModelManager {
        constructor(modelService, debugService) {
            this.modelService = modelService;
            this.debugService = debugService;
            this.ignoreDecorationsChangedEvent = false;
            this.modelDataMap = new Map();
            this.toDispose = [];
            this.registerListeners();
        }
        dispose() {
            this.modelDataMap.forEach(modelData => {
                lifecycle.dispose(modelData.toDispose);
                modelData.model.deltaDecorations(modelData.breakpointDecorations.map(bpd => bpd.decorationId), []);
                modelData.model.deltaDecorations(modelData.currentStackDecorations, []);
            });
            this.toDispose = lifecycle.dispose(this.toDispose);
            this.modelDataMap.clear();
        }
        registerListeners() {
            this.toDispose.push(this.modelService.onModelAdded(this.onModelAdded, this));
            this.modelService.getModels().forEach(model => this.onModelAdded(model));
            this.toDispose.push(this.modelService.onModelRemoved(this.onModelRemoved, this));
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(() => this.onBreakpointsChange()));
            this.toDispose.push(this.debugService.getViewModel().onDidFocusStackFrame(() => this.onFocusStackFrame()));
            this.toDispose.push(this.debugService.onDidChangeState(state => {
                if (state === 0 /* Inactive */) {
                    this.modelDataMap.forEach(modelData => {
                        modelData.topStackFrameRange = undefined;
                    });
                }
            }));
        }
        onModelAdded(model) {
            const modelUriStr = model.uri.toString();
            const breakpoints = this.debugService.getModel().getBreakpoints({ uri: model.uri });
            const currentStackDecorations = model.deltaDecorations([], this.createCallStackDecorations(modelUriStr));
            const desiredDecorations = this.createBreakpointDecorations(model, breakpoints);
            const breakpointDecorationIds = model.deltaDecorations([], desiredDecorations);
            const toDispose = [model.onDidChangeDecorations((e) => this.onModelDecorationsChanged(modelUriStr))];
            this.modelDataMap.set(modelUriStr, {
                model: model,
                toDispose: toDispose,
                breakpointDecorations: breakpointDecorationIds.map((decorationId, index) => ({ decorationId, modelId: breakpoints[index].getId(), range: desiredDecorations[index].range })),
                currentStackDecorations: currentStackDecorations,
                topStackFrameRange: undefined
            });
        }
        onModelRemoved(model) {
            const modelUriStr = model.uri.toString();
            const data = this.modelDataMap.get(modelUriStr);
            if (data) {
                lifecycle.dispose(data.toDispose);
                this.modelDataMap.delete(modelUriStr);
            }
        }
        // call stack management. Represent data coming from the debug service.
        onFocusStackFrame() {
            this.modelDataMap.forEach((modelData, uri) => {
                modelData.currentStackDecorations = modelData.model.deltaDecorations(modelData.currentStackDecorations, this.createCallStackDecorations(uri));
            });
        }
        createCallStackDecorations(modelUriStr) {
            const result = [];
            const stackFrame = this.debugService.getViewModel().focusedStackFrame;
            if (!stackFrame || stackFrame.source.uri.toString() !== modelUriStr) {
                return result;
            }
            // only show decorations for the currently focused thread.
            const columnUntilEOLRange = new range_1.Range(stackFrame.range.startLineNumber, stackFrame.range.startColumn, stackFrame.range.startLineNumber, 1073741824 /* MAX_SAFE_SMALL_INTEGER */);
            const range = new range_1.Range(stackFrame.range.startLineNumber, stackFrame.range.startColumn, stackFrame.range.startLineNumber, stackFrame.range.startColumn + 1);
            // compute how to decorate the editor. Different decorations are used if this is a top stack frame, focused stack frame,
            // an exception or a stack frame that did not change the line number (we only decorate the columns, not the whole line).
            const callStack = stackFrame.thread.getCallStack();
            if (callStack && callStack.length && stackFrame === callStack[0]) {
                result.push({
                    options: DebugEditorModelManager.TOP_STACK_FRAME_MARGIN,
                    range
                });
                result.push({
                    options: DebugEditorModelManager.TOP_STACK_FRAME_DECORATION,
                    range: columnUntilEOLRange
                });
                const modelData = this.modelDataMap.get(modelUriStr);
                if (modelData) {
                    if (modelData.topStackFrameRange && modelData.topStackFrameRange.startLineNumber === stackFrame.range.startLineNumber && modelData.topStackFrameRange.startColumn !== stackFrame.range.startColumn) {
                        result.push({
                            options: DebugEditorModelManager.TOP_STACK_FRAME_INLINE_DECORATION,
                            range: columnUntilEOLRange
                        });
                    }
                    modelData.topStackFrameRange = columnUntilEOLRange;
                }
            }
            else {
                result.push({
                    options: DebugEditorModelManager.FOCUSED_STACK_FRAME_MARGIN,
                    range
                });
                result.push({
                    options: DebugEditorModelManager.FOCUSED_STACK_FRAME_DECORATION,
                    range: columnUntilEOLRange
                });
            }
            return result;
        }
        // breakpoints management. Represent data coming from the debug service and also send data back.
        onModelDecorationsChanged(modelUrlStr) {
            const modelData = this.modelDataMap.get(modelUrlStr);
            if (!modelData || modelData.breakpointDecorations.length === 0 || this.ignoreDecorationsChangedEvent) {
                // I have no decorations
                return;
            }
            let somethingChanged = false;
            modelData.breakpointDecorations.forEach(breakpointDecoration => {
                if (somethingChanged) {
                    return;
                }
                const newBreakpointRange = modelData.model.getDecorationRange(breakpointDecoration.decorationId);
                if (newBreakpointRange && (!breakpointDecoration.range.equalsRange(newBreakpointRange))) {
                    somethingChanged = true;
                }
            });
            if (!somethingChanged) {
                // nothing to do, my decorations did not change.
                return;
            }
            const data = new Map();
            const breakpoints = this.debugService.getModel().getBreakpoints();
            const modelUri = modelData.model.uri;
            for (let i = 0, len = modelData.breakpointDecorations.length; i < len; i++) {
                const breakpointDecoration = modelData.breakpointDecorations[i];
                const decorationRange = modelData.model.getDecorationRange(breakpointDecoration.decorationId);
                // check if the line got deleted.
                if (decorationRange) {
                    const breakpoint = breakpoints.filter(bp => bp.getId() === breakpointDecoration.modelId).pop();
                    // since we know it is collapsed, it cannot grow to multiple lines
                    if (breakpoint) {
                        data.set(breakpoint.getId(), {
                            lineNumber: decorationRange.startLineNumber,
                            column: breakpoint.column ? decorationRange.startColumn : undefined,
                        });
                    }
                }
            }
            this.debugService.updateBreakpoints(modelUri, data, true).then(undefined, errors_1.onUnexpectedError);
        }
        onBreakpointsChange() {
            const breakpointsMap = new Map();
            this.debugService.getModel().getBreakpoints().forEach(bp => {
                const uriStr = bp.uri.toString();
                const breakpoints = breakpointsMap.get(uriStr);
                if (breakpoints) {
                    breakpoints.push(bp);
                }
                else {
                    breakpointsMap.set(uriStr, [bp]);
                }
            });
            breakpointsMap.forEach((bps, uri) => {
                const data = this.modelDataMap.get(uri);
                if (data) {
                    this.updateBreakpoints(data, breakpointsMap.get(uri));
                }
            });
            this.modelDataMap.forEach((modelData, uri) => {
                if (!breakpointsMap.has(uri)) {
                    this.updateBreakpoints(modelData, []);
                }
            });
        }
        updateBreakpoints(modelData, newBreakpoints) {
            const desiredDecorations = this.createBreakpointDecorations(modelData.model, newBreakpoints);
            try {
                this.ignoreDecorationsChangedEvent = true;
                const breakpointDecorationIds = modelData.model.deltaDecorations(modelData.breakpointDecorations.map(bpd => bpd.decorationId), desiredDecorations);
                modelData.breakpointDecorations = breakpointDecorationIds.map((decorationId, index) => ({
                    decorationId,
                    modelId: newBreakpoints[index].getId(),
                    range: desiredDecorations[index].range
                }));
            }
            finally {
                this.ignoreDecorationsChangedEvent = false;
            }
        }
        createBreakpointDecorations(model, breakpoints) {
            const result = [];
            breakpoints.forEach((breakpoint) => {
                if (breakpoint.lineNumber <= model.getLineCount()) {
                    const column = model.getLineFirstNonWhitespaceColumn(breakpoint.lineNumber);
                    const range = model.validateRange(breakpoint.column ? new range_1.Range(breakpoint.lineNumber, breakpoint.column, breakpoint.lineNumber, breakpoint.column + 1)
                        : new range_1.Range(breakpoint.lineNumber, column, breakpoint.lineNumber, column + 1) // Decoration has to have a width #20688
                    );
                    result.push({
                        options: this.getBreakpointDecorationOptions(breakpoint),
                        range
                    });
                }
            });
            return result;
        }
        getBreakpointDecorationOptions(breakpoint) {
            const { className, message } = breakpointsView_1.getBreakpointMessageAndClassName(this.debugService, breakpoint);
            let glyphMarginHoverMessage;
            if (message) {
                if (breakpoint.condition || breakpoint.hitCondition) {
                    const modelData = this.modelDataMap.get(breakpoint.uri.toString());
                    const modeId = modelData ? modelData.model.getLanguageIdentifier().language : '';
                    glyphMarginHoverMessage = new htmlContent_1.MarkdownString().appendCodeblock(modeId, message);
                }
                else {
                    glyphMarginHoverMessage = new htmlContent_1.MarkdownString().appendText(message);
                }
            }
            return {
                glyphMarginClassName: className,
                glyphMarginHoverMessage,
                stickiness: DebugEditorModelManager.STICKINESS,
                beforeContentClassName: breakpoint.column ? `debug-breakpoint-column ${className}-column` : undefined
            };
        }
    };
    DebugEditorModelManager.ID = 'breakpointManager';
    DebugEditorModelManager.STICKINESS = 1 /* NeverGrowsWhenTypingAtEdges */;
    // editor decorations
    // we need a separate decoration for glyph margin, since we do not want it on each line of a multi line statement.
    DebugEditorModelManager.TOP_STACK_FRAME_MARGIN = {
        glyphMarginClassName: 'debug-top-stack-frame',
        stickiness: DebugEditorModelManager.STICKINESS
    };
    DebugEditorModelManager.FOCUSED_STACK_FRAME_MARGIN = {
        glyphMarginClassName: 'debug-focused-stack-frame',
        stickiness: DebugEditorModelManager.STICKINESS
    };
    DebugEditorModelManager.TOP_STACK_FRAME_DECORATION = {
        isWholeLine: true,
        inlineClassName: 'debug-remove-token-colors',
        className: 'debug-top-stack-frame-line',
        stickiness: DebugEditorModelManager.STICKINESS
    };
    DebugEditorModelManager.TOP_STACK_FRAME_INLINE_DECORATION = {
        beforeContentClassName: 'debug-top-stack-frame-column'
    };
    DebugEditorModelManager.FOCUSED_STACK_FRAME_DECORATION = {
        isWholeLine: true,
        inlineClassName: 'debug-remove-token-colors',
        className: 'debug-focused-stack-frame-line',
        stickiness: DebugEditorModelManager.STICKINESS
    };
    DebugEditorModelManager = __decorate([
        __param(0, modelService_1.IModelService),
        __param(1, debug_1.IDebugService)
    ], DebugEditorModelManager);
    exports.DebugEditorModelManager = DebugEditorModelManager;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const topStackFrame = theme.getColor(topStackFrameColor);
        if (topStackFrame) {
            collector.addRule(`.monaco-editor .view-overlays .debug-top-stack-frame-line { background: ${topStackFrame}; }`);
            collector.addRule(`.monaco-editor .view-overlays .debug-top-stack-frame-line { background: ${topStackFrame}; }`);
        }
        const focusedStackFrame = theme.getColor(focusedStackFrameColor);
        if (focusedStackFrame) {
            collector.addRule(`.monaco-editor .view-overlays .debug-focused-stack-frame-line { background: ${focusedStackFrame}; }`);
        }
    });
    const topStackFrameColor = colorRegistry_1.registerColor('editor.stackFrameHighlightBackground', { dark: '#ffff0033', light: '#ffff6673', hc: '#fff600' }, nls_1.localize('topStackFrameLineHighlight', 'Background color for the highlight of line at the top stack frame position.'));
    const focusedStackFrameColor = colorRegistry_1.registerColor('editor.focusedStackFrameHighlightBackground', { dark: '#7abd7a4d', light: '#cee7ce73', hc: '#cee7ce' }, nls_1.localize('focusedStackFrameLineHighlight', 'Background color for the highlight of line at focused stack frame position.'));
});
//# sourceMappingURL=debugEditorModelManager.js.map