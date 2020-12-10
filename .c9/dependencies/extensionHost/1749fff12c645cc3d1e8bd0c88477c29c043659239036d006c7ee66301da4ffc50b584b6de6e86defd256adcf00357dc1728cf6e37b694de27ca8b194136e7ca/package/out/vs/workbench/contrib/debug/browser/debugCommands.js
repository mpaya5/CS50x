/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/nls", "vs/base/browser/ui/list/listWidget", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/viewlet/browser/viewlet", "vs/editor/browser/editorBrowser", "vs/platform/actions/common/actions", "vs/workbench/services/editor/common/editorService", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/debug/browser/breakpointsView", "vs/platform/notification/common/notification", "vs/platform/contextkey/common/contextkeys", "vs/workbench/common/panel", "vs/platform/commands/common/commands", "vs/base/common/errors", "vs/editor/common/services/resourceConfiguration", "vs/platform/clipboard/common/clipboardService", "vs/workbench/services/history/common/history", "vs/workbench/contrib/debug/common/debugUtils", "vs/workbench/services/panel/common/panelService", "vs/platform/configuration/common/configuration", "vs/platform/quickinput/common/quickInput"], function (require, exports, nls, listWidget_1, keybindingsRegistry_1, listService_1, workspace_1, debug_1, debugModel_1, extensions_1, viewlet_1, editorBrowser_1, actions_1, editorService_1, editorContextKeys_1, contextkey_1, breakpointsView_1, notification_1, contextkeys_1, panel_1, commands_1, errors_1, resourceConfiguration_1, clipboardService_1, history_1, debugUtils_1, panelService_1, configuration_1, quickInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ADD_CONFIGURATION_ID = 'debug.addConfiguration';
    exports.TOGGLE_INLINE_BREAKPOINT_ID = 'editor.debug.action.toggleInlineBreakpoint';
    exports.COPY_STACK_TRACE_ID = 'debug.copyStackTrace';
    exports.REVERSE_CONTINUE_ID = 'workbench.action.debug.reverseContinue';
    exports.STEP_BACK_ID = 'workbench.action.debug.stepBack';
    exports.RESTART_SESSION_ID = 'workbench.action.debug.restart';
    exports.TERMINATE_THREAD_ID = 'workbench.action.debug.terminateThread';
    exports.STEP_OVER_ID = 'workbench.action.debug.stepOver';
    exports.STEP_INTO_ID = 'workbench.action.debug.stepInto';
    exports.STEP_OUT_ID = 'workbench.action.debug.stepOut';
    exports.PAUSE_ID = 'workbench.action.debug.pause';
    exports.DISCONNECT_ID = 'workbench.action.debug.disconnect';
    exports.STOP_ID = 'workbench.action.debug.stop';
    exports.RESTART_FRAME_ID = 'workbench.action.debug.restartFrame';
    exports.CONTINUE_ID = 'workbench.action.debug.continue';
    exports.FOCUS_REPL_ID = 'workbench.debug.action.focusRepl';
    exports.JUMP_TO_CURSOR_ID = 'debug.jumpToCursor';
    function getThreadAndRun(accessor, thread, run) {
        const debugService = accessor.get(debug_1.IDebugService);
        if (!(thread instanceof debugModel_1.Thread)) {
            thread = debugService.getViewModel().focusedThread;
            if (!thread) {
                const focusedSession = debugService.getViewModel().focusedSession;
                const threads = focusedSession ? focusedSession.getAllThreads() : undefined;
                thread = threads && threads.length ? threads[0] : undefined;
            }
        }
        if (thread) {
            run(thread).then(undefined, errors_1.onUnexpectedError);
        }
    }
    function registerCommands() {
        commands_1.CommandsRegistry.registerCommand({
            id: exports.COPY_STACK_TRACE_ID,
            handler: (accessor, _, frame) => __awaiter(this, void 0, void 0, function* () {
                const textResourcePropertiesService = accessor.get(resourceConfiguration_1.ITextResourcePropertiesService);
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                const eol = textResourcePropertiesService.getEOL(frame.source.uri);
                yield clipboardService.writeText(frame.thread.getCallStack().map(sf => sf.toString()).join(eol));
            })
        });
        commands_1.CommandsRegistry.registerCommand({
            id: exports.REVERSE_CONTINUE_ID,
            handler: (accessor, _, thread) => {
                getThreadAndRun(accessor, thread, thread => thread.reverseContinue());
            }
        });
        commands_1.CommandsRegistry.registerCommand({
            id: exports.STEP_BACK_ID,
            handler: (accessor, _, thread) => {
                getThreadAndRun(accessor, thread, thread => thread.stepBack());
            }
        });
        commands_1.CommandsRegistry.registerCommand({
            id: exports.TERMINATE_THREAD_ID,
            handler: (accessor, _, thread) => {
                getThreadAndRun(accessor, thread, thread => thread.terminate());
            }
        });
        commands_1.CommandsRegistry.registerCommand({
            id: exports.JUMP_TO_CURSOR_ID,
            handler: (accessor) => __awaiter(this, void 0, void 0, function* () {
                const debugService = accessor.get(debug_1.IDebugService);
                const stackFrame = debugService.getViewModel().focusedStackFrame;
                const editorService = accessor.get(editorService_1.IEditorService);
                const activeEditor = editorService.activeTextEditorWidget;
                const notificationService = accessor.get(notification_1.INotificationService);
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                if (stackFrame && editorBrowser_1.isCodeEditor(activeEditor) && activeEditor.hasModel()) {
                    const position = activeEditor.getPosition();
                    const resource = activeEditor.getModel().uri;
                    const source = stackFrame.thread.session.getSourceForUri(resource);
                    if (source) {
                        const response = yield stackFrame.thread.session.gotoTargets(source.raw, position.lineNumber, position.column);
                        const targets = response.body.targets;
                        if (targets.length) {
                            let id = targets[0].id;
                            if (targets.length > 1) {
                                const picks = targets.map(t => ({ label: t.label, _id: t.id }));
                                const pick = yield quickInputService.pick(picks, { placeHolder: nls.localize('chooseLocation', "Choose the specific location") });
                                if (!pick) {
                                    return;
                                }
                                id = pick._id;
                            }
                            return yield stackFrame.thread.session.goto(stackFrame.thread.threadId, id).catch(e => notificationService.warn(e));
                        }
                    }
                }
                return notificationService.warn(nls.localize('noExecutableCode', "No executable code is associated at the current cursor position."));
            })
        });
        actions_1.MenuRegistry.appendMenuItem(7 /* EditorContext */, {
            command: {
                id: exports.JUMP_TO_CURSOR_ID,
                title: nls.localize('jumpToCursor', "Jump to Cursor"),
                category: { value: nls.localize('debug', "Debug"), original: 'Debug' }
            },
            when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_JUMP_TO_CURSOR_SUPPORTED, editorContextKeys_1.EditorContextKeys.editorTextFocus),
            group: 'debug',
            order: 3
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.RESTART_SESSION_ID,
            weight: 200 /* WorkbenchContrib */,
            primary: 1024 /* Shift */ | 2048 /* CtrlCmd */ | 63 /* F5 */,
            when: debug_1.CONTEXT_IN_DEBUG_MODE,
            handler: (accessor, _, session) => {
                const debugService = accessor.get(debug_1.IDebugService);
                if (!session || !session.getId) {
                    session = debugService.getViewModel().focusedSession;
                }
                if (!session) {
                    const historyService = accessor.get(history_1.IHistoryService);
                    debugUtils_1.startDebugging(debugService, historyService, false);
                }
                else {
                    session.removeReplExpressions();
                    debugService.restartSession(session).then(undefined, errors_1.onUnexpectedError);
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.STEP_OVER_ID,
            weight: 200 /* WorkbenchContrib */,
            primary: 68 /* F10 */,
            when: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'),
            handler: (accessor, _, thread) => {
                getThreadAndRun(accessor, thread, thread => thread.next());
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.STEP_INTO_ID,
            weight: 200 /* WorkbenchContrib */ + 10,
            primary: 69 /* F11 */,
            when: debug_1.CONTEXT_IN_DEBUG_MODE,
            handler: (accessor, _, thread) => {
                getThreadAndRun(accessor, thread, thread => thread.stepIn());
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.STEP_OUT_ID,
            weight: 200 /* WorkbenchContrib */,
            primary: 1024 /* Shift */ | 69 /* F11 */,
            when: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'),
            handler: (accessor, _, thread) => {
                getThreadAndRun(accessor, thread, thread => thread.stepOut());
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.PAUSE_ID,
            weight: 200 /* WorkbenchContrib */,
            primary: 64 /* F6 */,
            when: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('running'),
            handler: (accessor, _, thread) => {
                const debugService = accessor.get(debug_1.IDebugService);
                if (!(thread instanceof debugModel_1.Thread)) {
                    thread = debugService.getViewModel().focusedThread;
                    if (!thread) {
                        const session = debugService.getViewModel().focusedSession;
                        const threads = session && session.getAllThreads();
                        thread = threads && threads.length ? threads[0] : undefined;
                    }
                }
                if (thread) {
                    thread.pause().then(undefined, errors_1.onUnexpectedError);
                }
            }
        });
        commands_1.CommandsRegistry.registerCommand({
            id: exports.DISCONNECT_ID,
            handler: (accessor) => {
                const debugService = accessor.get(debug_1.IDebugService);
                const session = debugService.getViewModel().focusedSession;
                debugService.stopSession(session).then(undefined, errors_1.onUnexpectedError);
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.STOP_ID,
            weight: 200 /* WorkbenchContrib */,
            primary: 1024 /* Shift */ | 63 /* F5 */,
            when: debug_1.CONTEXT_IN_DEBUG_MODE,
            handler: (accessor, _, session) => {
                const debugService = accessor.get(debug_1.IDebugService);
                if (!session || !session.getId) {
                    session = debugService.getViewModel().focusedSession;
                    const configurationService = accessor.get(configuration_1.IConfigurationService);
                    const showSubSessions = configurationService.getValue('debug').showSubSessionsInToolBar;
                    // Stop should be sent to the root parent session
                    while (!showSubSessions && session && session.parentSession) {
                        session = session.parentSession;
                    }
                }
                debugService.stopSession(session).then(undefined, errors_1.onUnexpectedError);
            }
        });
        commands_1.CommandsRegistry.registerCommand({
            id: exports.RESTART_FRAME_ID,
            handler: (accessor, _, frame) => {
                const debugService = accessor.get(debug_1.IDebugService);
                if (!frame) {
                    frame = debugService.getViewModel().focusedStackFrame;
                }
                return frame.restart();
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CONTINUE_ID,
            weight: 200 /* WorkbenchContrib */,
            primary: 63 /* F5 */,
            when: debug_1.CONTEXT_IN_DEBUG_MODE,
            handler: (accessor, _, thread) => {
                getThreadAndRun(accessor, thread, thread => thread.continue());
            }
        });
        commands_1.CommandsRegistry.registerCommand({
            id: exports.FOCUS_REPL_ID,
            handler: (accessor) => {
                const panelService = accessor.get(panelService_1.IPanelService);
                panelService.openPanel(debug_1.REPL_ID, true);
            }
        });
        commands_1.CommandsRegistry.registerCommand({
            id: 'debug.startFromConfig',
            handler: (accessor, config) => {
                const debugService = accessor.get(debug_1.IDebugService);
                debugService.startDebugging(undefined, config).then(undefined, errors_1.onUnexpectedError);
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.toggleBreakpoint',
            weight: 200 /* WorkbenchContrib */ + 5,
            when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_BREAKPOINTS_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
            primary: 10 /* Space */,
            handler: (accessor) => {
                const listService = accessor.get(listService_1.IListService);
                const debugService = accessor.get(debug_1.IDebugService);
                const list = listService.lastFocusedList;
                if (list instanceof listWidget_1.List) {
                    const focused = list.getFocusedElements();
                    if (focused && focused.length) {
                        debugService.enableOrDisableBreakpoints(!focused[0].enabled, focused[0]);
                    }
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.enableOrDisableBreakpoint',
            weight: 200 /* WorkbenchContrib */,
            primary: undefined,
            when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            handler: (accessor) => {
                const debugService = accessor.get(debug_1.IDebugService);
                const editorService = accessor.get(editorService_1.IEditorService);
                const widget = editorService.activeTextEditorWidget;
                if (editorBrowser_1.isCodeEditor(widget)) {
                    const model = widget.getModel();
                    if (model) {
                        const position = widget.getPosition();
                        if (position) {
                            const bps = debugService.getModel().getBreakpoints({ uri: model.uri, lineNumber: position.lineNumber });
                            if (bps.length) {
                                debugService.enableOrDisableBreakpoints(!bps[0].enabled, bps[0]);
                            }
                        }
                    }
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.renameWatchExpression',
            weight: 200 /* WorkbenchContrib */ + 5,
            when: debug_1.CONTEXT_WATCH_EXPRESSIONS_FOCUSED,
            primary: 60 /* F2 */,
            mac: { primary: 3 /* Enter */ },
            handler: (accessor) => {
                const listService = accessor.get(listService_1.IListService);
                const debugService = accessor.get(debug_1.IDebugService);
                const focused = listService.lastFocusedList;
                if (focused) {
                    const elements = focused.getFocus();
                    if (Array.isArray(elements) && elements[0] instanceof debugModel_1.Expression) {
                        debugService.getViewModel().setSelectedExpression(elements[0]);
                    }
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.setVariable',
            weight: 200 /* WorkbenchContrib */ + 5,
            when: debug_1.CONTEXT_VARIABLES_FOCUSED,
            primary: 60 /* F2 */,
            mac: { primary: 3 /* Enter */ },
            handler: (accessor) => {
                const listService = accessor.get(listService_1.IListService);
                const debugService = accessor.get(debug_1.IDebugService);
                const focused = listService.lastFocusedList;
                if (focused) {
                    const elements = focused.getFocus();
                    if (Array.isArray(elements) && elements[0] instanceof debugModel_1.Variable) {
                        debugService.getViewModel().setSelectedExpression(elements[0]);
                    }
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.removeWatchExpression',
            weight: 200 /* WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_WATCH_EXPRESSIONS_FOCUSED, debug_1.CONTEXT_EXPRESSION_SELECTED.toNegated()),
            primary: 20 /* Delete */,
            mac: { primary: 2048 /* CtrlCmd */ | 1 /* Backspace */ },
            handler: (accessor) => {
                const listService = accessor.get(listService_1.IListService);
                const debugService = accessor.get(debug_1.IDebugService);
                const focused = listService.lastFocusedList;
                if (focused) {
                    const elements = focused.getFocus();
                    if (Array.isArray(elements) && elements[0] instanceof debugModel_1.Expression) {
                        debugService.removeWatchExpressions(elements[0].getId());
                    }
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.removeBreakpoint',
            weight: 200 /* WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_BREAKPOINTS_FOCUSED, debug_1.CONTEXT_BREAKPOINT_SELECTED.toNegated()),
            primary: 20 /* Delete */,
            mac: { primary: 2048 /* CtrlCmd */ | 1 /* Backspace */ },
            handler: (accessor) => {
                const listService = accessor.get(listService_1.IListService);
                const debugService = accessor.get(debug_1.IDebugService);
                const list = listService.lastFocusedList;
                if (list instanceof listWidget_1.List) {
                    const focused = list.getFocusedElements();
                    const element = focused.length ? focused[0] : undefined;
                    if (element instanceof debugModel_1.Breakpoint) {
                        debugService.removeBreakpoints(element.getId());
                    }
                    else if (element instanceof debugModel_1.FunctionBreakpoint) {
                        debugService.removeFunctionBreakpoints(element.getId());
                    }
                    else if (element instanceof debugModel_1.DataBreakpoint) {
                        debugService.removeDataBreakpoints(element.getId());
                    }
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.installAdditionalDebuggers',
            weight: 200 /* WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: (accessor) => {
                const viewletService = accessor.get(viewlet_1.IViewletService);
                return viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                    .then(viewlet => viewlet)
                    .then(viewlet => {
                    viewlet.search('tag:debuggers @sort:installs');
                    viewlet.focus();
                });
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.ADD_CONFIGURATION_ID,
            weight: 200 /* WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: (accessor, launchUri) => {
                const manager = accessor.get(debug_1.IDebugService).getConfigurationManager();
                if (accessor.get(workspace_1.IWorkspaceContextService).getWorkbenchState() === 1 /* EMPTY */) {
                    accessor.get(notification_1.INotificationService).info(nls.localize('noFolderDebugConfig', "Please first open a folder in order to do advanced debug configuration."));
                    return undefined;
                }
                const launch = manager.getLaunches().filter(l => l.uri.toString() === launchUri).pop() || manager.selectedConfiguration.launch;
                return launch.openConfigFile(false, false).then(({ editor, created }) => {
                    if (editor && !created) {
                        const codeEditor = editor.getControl();
                        if (codeEditor) {
                            return codeEditor.getContribution(debug_1.EDITOR_CONTRIBUTION_ID).addLaunchConfiguration();
                        }
                    }
                    return undefined;
                });
            }
        });
        const inlineBreakpointHandler = (accessor) => {
            const debugService = accessor.get(debug_1.IDebugService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const widget = editorService.activeTextEditorWidget;
            if (editorBrowser_1.isCodeEditor(widget)) {
                const position = widget.getPosition();
                if (position && widget.hasModel() && debugService.getConfigurationManager().canSetBreakpointsIn(widget.getModel())) {
                    const modelUri = widget.getModel().uri;
                    const breakpointAlreadySet = debugService.getModel().getBreakpoints({ lineNumber: position.lineNumber, uri: modelUri })
                        .some(bp => (bp.sessionAgnosticData.column === position.column || (!bp.column && position.column <= 1)));
                    if (!breakpointAlreadySet) {
                        debugService.addBreakpoints(modelUri, [{ lineNumber: position.lineNumber, column: position.column > 1 ? position.column : undefined }], 'debugCommands.inlineBreakpointCommand');
                    }
                }
            }
        };
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            weight: 200 /* WorkbenchContrib */,
            primary: 1024 /* Shift */ | 67 /* F9 */,
            when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            id: exports.TOGGLE_INLINE_BREAKPOINT_ID,
            handler: inlineBreakpointHandler
        });
        actions_1.MenuRegistry.appendMenuItem(7 /* EditorContext */, {
            command: {
                id: exports.TOGGLE_INLINE_BREAKPOINT_ID,
                title: nls.localize('addInlineBreakpoint', "Add Inline Breakpoint"),
                category: { value: nls.localize('debug', "Debug"), original: 'Debug' }
            },
            when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, panel_1.PanelFocusContext.toNegated(), editorContextKeys_1.EditorContextKeys.editorTextFocus),
            group: 'debug',
            order: 1
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'debug.openBreakpointToSide',
            weight: 200 /* WorkbenchContrib */,
            when: debug_1.CONTEXT_BREAKPOINTS_FOCUSED,
            primary: 2048 /* CtrlCmd */ | 3 /* Enter */,
            secondary: [512 /* Alt */ | 3 /* Enter */],
            handler: (accessor) => {
                const listService = accessor.get(listService_1.IListService);
                const list = listService.lastFocusedList;
                if (list instanceof listWidget_1.List) {
                    const focus = list.getFocusedElements();
                    if (focus.length && focus[0] instanceof debugModel_1.Breakpoint) {
                        return breakpointsView_1.openBreakpointSource(focus[0], true, false, accessor.get(debug_1.IDebugService), accessor.get(editorService_1.IEditorService));
                    }
                }
                return undefined;
            }
        });
    }
    exports.registerCommands = registerCommands;
});
//# sourceMappingURL=debugCommands.js.map