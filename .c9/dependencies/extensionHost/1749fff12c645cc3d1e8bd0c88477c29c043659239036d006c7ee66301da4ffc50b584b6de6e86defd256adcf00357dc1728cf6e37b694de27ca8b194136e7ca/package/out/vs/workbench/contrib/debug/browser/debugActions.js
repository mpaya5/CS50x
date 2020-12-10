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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/platform/keybinding/common/keybinding", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/services/editor/common/editorService", "vs/platform/quickOpen/common/quickOpen", "vs/platform/notification/common/notification", "vs/workbench/services/history/common/history", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/debug/common/debugUtils"], function (require, exports, nls, actions_1, lifecycle, keybinding_1, workspace_1, debug_1, debugModel_1, editorService_1, quickOpen_1, notification_1, history_1, clipboardService_1, debugUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let AbstractDebugAction = class AbstractDebugAction extends actions_1.Action {
        constructor(id, label, cssClass, debugService, keybindingService, weight) {
            super(id, label, cssClass, false);
            this.debugService = debugService;
            this.keybindingService = keybindingService;
            this.weight = weight;
            this.toDispose = [];
            this.toDispose.push(this.debugService.onDidChangeState(state => this.updateEnablement(state)));
            this.updateLabel(label);
            this.updateEnablement();
        }
        run(e) {
            throw new Error('implement me');
        }
        get tooltip() {
            const keybinding = this.keybindingService.lookupKeybinding(this.id);
            const keybindingLabel = keybinding && keybinding.getLabel();
            return keybindingLabel ? `${this.label} (${keybindingLabel})` : this.label;
        }
        updateLabel(newLabel) {
            this.label = newLabel;
        }
        updateEnablement(state = this.debugService.state) {
            this.enabled = this.isEnabled(state);
        }
        isEnabled(state) {
            return true;
        }
        dispose() {
            super.dispose();
            this.toDispose = lifecycle.dispose(this.toDispose);
        }
    };
    AbstractDebugAction = __decorate([
        __param(3, debug_1.IDebugService),
        __param(4, keybinding_1.IKeybindingService)
    ], AbstractDebugAction);
    exports.AbstractDebugAction = AbstractDebugAction;
    let ConfigureAction = class ConfigureAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService, notificationService, contextService) {
            super(id, label, 'debug-action configure', debugService, keybindingService);
            this.notificationService = notificationService;
            this.contextService = contextService;
            this.toDispose.push(debugService.getConfigurationManager().onDidSelectConfiguration(() => this.updateClass()));
            this.updateClass();
        }
        get tooltip() {
            if (this.debugService.getConfigurationManager().selectedConfiguration.name) {
                return ConfigureAction.LABEL;
            }
            return nls.localize('launchJsonNeedsConfigurtion', "Configure or Fix 'launch.json'");
        }
        updateClass() {
            const configurationManager = this.debugService.getConfigurationManager();
            const configurationCount = configurationManager.getLaunches().map(l => l.getConfigurationNames().length).reduce((sum, current) => sum + current);
            this.class = configurationCount > 0 ? 'debug-action configure' : 'debug-action configure notification';
        }
        run(event) {
            if (this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                this.notificationService.info(nls.localize('noFolderDebugConfig', "Please first open a folder in order to do advanced debug configuration."));
                return Promise.resolve();
            }
            const sideBySide = !!(event && (event.ctrlKey || event.metaKey));
            const configurationManager = this.debugService.getConfigurationManager();
            if (!configurationManager.selectedConfiguration.launch) {
                configurationManager.selectConfiguration(configurationManager.getLaunches()[0]);
            }
            return configurationManager.selectedConfiguration.launch.openConfigFile(sideBySide, false);
        }
    };
    ConfigureAction.ID = 'workbench.action.debug.configure';
    ConfigureAction.LABEL = nls.localize('openLaunchJson', "Open {0}", 'launch.json');
    ConfigureAction = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, notification_1.INotificationService),
        __param(5, workspace_1.IWorkspaceContextService)
    ], ConfigureAction);
    exports.ConfigureAction = ConfigureAction;
    let StartAction = class StartAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService, contextService, historyService) {
            super(id, label, 'debug-action start', debugService, keybindingService);
            this.contextService = contextService;
            this.historyService = historyService;
            this.toDispose.push(this.debugService.getConfigurationManager().onDidSelectConfiguration(() => this.updateEnablement()));
            this.toDispose.push(this.debugService.onDidNewSession(() => this.updateEnablement()));
            this.toDispose.push(this.debugService.onDidEndSession(() => this.updateEnablement()));
            this.toDispose.push(this.contextService.onDidChangeWorkbenchState(() => this.updateEnablement()));
        }
        run() {
            return debugUtils_1.startDebugging(this.debugService, this.historyService, this.isNoDebug());
        }
        isNoDebug() {
            return false;
        }
        static isEnabled(debugService) {
            const sessions = debugService.getModel().getSessions();
            if (debugService.state === 1 /* Initializing */) {
                return false;
            }
            if ((sessions.length > 0) && debugService.getConfigurationManager().getLaunches().every(l => l.getConfigurationNames().length === 0)) {
                // There is already a debug session running and we do not have any launch configuration selected
                return false;
            }
            return true;
        }
        // Disabled if the launch drop down shows the launch config that is already running.
        isEnabled() {
            return StartAction.isEnabled(this.debugService);
        }
    };
    StartAction.ID = 'workbench.action.debug.start';
    StartAction.LABEL = nls.localize('startDebug', "Start Debugging");
    StartAction = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, history_1.IHistoryService)
    ], StartAction);
    exports.StartAction = StartAction;
    class RunAction extends StartAction {
        isNoDebug() {
            return true;
        }
    }
    RunAction.ID = 'workbench.action.debug.run';
    RunAction.LABEL = nls.localize('startWithoutDebugging', "Start Without Debugging");
    exports.RunAction = RunAction;
    let SelectAndStartAction = class SelectAndStartAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService, quickOpenService) {
            super(id, label, '', debugService, keybindingService);
            this.quickOpenService = quickOpenService;
        }
        run() {
            return this.quickOpenService.show('debug ');
        }
    };
    SelectAndStartAction.ID = 'workbench.action.debug.selectandstart';
    SelectAndStartAction.LABEL = nls.localize('selectAndStartDebugging', "Select and Start Debugging");
    SelectAndStartAction = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, quickOpen_1.IQuickOpenService)
    ], SelectAndStartAction);
    exports.SelectAndStartAction = SelectAndStartAction;
    let RemoveBreakpointAction = class RemoveBreakpointAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action remove', debugService, keybindingService);
        }
        run(breakpoint) {
            return breakpoint instanceof debugModel_1.Breakpoint ? this.debugService.removeBreakpoints(breakpoint.getId())
                : breakpoint instanceof debugModel_1.FunctionBreakpoint ? this.debugService.removeFunctionBreakpoints(breakpoint.getId()) : this.debugService.removeDataBreakpoints(breakpoint.getId());
        }
    };
    RemoveBreakpointAction.ID = 'workbench.debug.viewlet.action.removeBreakpoint';
    RemoveBreakpointAction.LABEL = nls.localize('removeBreakpoint', "Remove Breakpoint");
    RemoveBreakpointAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], RemoveBreakpointAction);
    exports.RemoveBreakpointAction = RemoveBreakpointAction;
    let RemoveAllBreakpointsAction = class RemoveAllBreakpointsAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action remove-all', debugService, keybindingService);
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(() => this.updateEnablement()));
        }
        run() {
            return Promise.all([this.debugService.removeBreakpoints(), this.debugService.removeFunctionBreakpoints(), this.debugService.removeDataBreakpoints()]);
        }
        isEnabled(state) {
            const model = this.debugService.getModel();
            return super.isEnabled(state) && (model.getBreakpoints().length > 0 || model.getFunctionBreakpoints().length > 0 || model.getDataBreakpoints().length > 0);
        }
    };
    RemoveAllBreakpointsAction.ID = 'workbench.debug.viewlet.action.removeAllBreakpoints';
    RemoveAllBreakpointsAction.LABEL = nls.localize('removeAllBreakpoints', "Remove All Breakpoints");
    RemoveAllBreakpointsAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], RemoveAllBreakpointsAction);
    exports.RemoveAllBreakpointsAction = RemoveAllBreakpointsAction;
    let EnableAllBreakpointsAction = class EnableAllBreakpointsAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action enable-all-breakpoints', debugService, keybindingService);
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(() => this.updateEnablement()));
        }
        run() {
            return this.debugService.enableOrDisableBreakpoints(true);
        }
        isEnabled(state) {
            const model = this.debugService.getModel();
            return super.isEnabled(state) && model.getBreakpoints().concat(model.getFunctionBreakpoints()).concat(model.getExceptionBreakpoints()).some(bp => !bp.enabled);
        }
    };
    EnableAllBreakpointsAction.ID = 'workbench.debug.viewlet.action.enableAllBreakpoints';
    EnableAllBreakpointsAction.LABEL = nls.localize('enableAllBreakpoints', "Enable All Breakpoints");
    EnableAllBreakpointsAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], EnableAllBreakpointsAction);
    exports.EnableAllBreakpointsAction = EnableAllBreakpointsAction;
    let DisableAllBreakpointsAction = class DisableAllBreakpointsAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action disable-all-breakpoints', debugService, keybindingService);
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(() => this.updateEnablement()));
        }
        run() {
            return this.debugService.enableOrDisableBreakpoints(false);
        }
        isEnabled(state) {
            const model = this.debugService.getModel();
            return super.isEnabled(state) && model.getBreakpoints().concat(model.getFunctionBreakpoints()).concat(model.getExceptionBreakpoints()).some(bp => bp.enabled);
        }
    };
    DisableAllBreakpointsAction.ID = 'workbench.debug.viewlet.action.disableAllBreakpoints';
    DisableAllBreakpointsAction.LABEL = nls.localize('disableAllBreakpoints', "Disable All Breakpoints");
    DisableAllBreakpointsAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], DisableAllBreakpointsAction);
    exports.DisableAllBreakpointsAction = DisableAllBreakpointsAction;
    let ToggleBreakpointsActivatedAction = class ToggleBreakpointsActivatedAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action breakpoints-activate', debugService, keybindingService);
            this.updateLabel(this.debugService.getModel().areBreakpointsActivated() ? ToggleBreakpointsActivatedAction.DEACTIVATE_LABEL : ToggleBreakpointsActivatedAction.ACTIVATE_LABEL);
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(() => {
                this.updateLabel(this.debugService.getModel().areBreakpointsActivated() ? ToggleBreakpointsActivatedAction.DEACTIVATE_LABEL : ToggleBreakpointsActivatedAction.ACTIVATE_LABEL);
                this.updateEnablement();
            }));
        }
        run() {
            return this.debugService.setBreakpointsActivated(!this.debugService.getModel().areBreakpointsActivated());
        }
        isEnabled(state) {
            return !!(this.debugService.getModel().getFunctionBreakpoints().length || this.debugService.getModel().getBreakpoints().length || this.debugService.getModel().getDataBreakpoints().length);
        }
    };
    ToggleBreakpointsActivatedAction.ID = 'workbench.debug.viewlet.action.toggleBreakpointsActivatedAction';
    ToggleBreakpointsActivatedAction.ACTIVATE_LABEL = nls.localize('activateBreakpoints', "Activate Breakpoints");
    ToggleBreakpointsActivatedAction.DEACTIVATE_LABEL = nls.localize('deactivateBreakpoints', "Deactivate Breakpoints");
    ToggleBreakpointsActivatedAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], ToggleBreakpointsActivatedAction);
    exports.ToggleBreakpointsActivatedAction = ToggleBreakpointsActivatedAction;
    let ReapplyBreakpointsAction = class ReapplyBreakpointsAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, '', debugService, keybindingService);
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(() => this.updateEnablement()));
        }
        run() {
            return this.debugService.setBreakpointsActivated(true);
        }
        isEnabled(state) {
            const model = this.debugService.getModel();
            return super.isEnabled(state) && (state === 3 /* Running */ || state === 2 /* Stopped */) &&
                ((model.getFunctionBreakpoints().length + model.getBreakpoints().length + model.getExceptionBreakpoints().length + model.getDataBreakpoints().length) > 0);
        }
    };
    ReapplyBreakpointsAction.ID = 'workbench.debug.viewlet.action.reapplyBreakpointsAction';
    ReapplyBreakpointsAction.LABEL = nls.localize('reapplyAllBreakpoints', "Reapply All Breakpoints");
    ReapplyBreakpointsAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], ReapplyBreakpointsAction);
    exports.ReapplyBreakpointsAction = ReapplyBreakpointsAction;
    let AddFunctionBreakpointAction = class AddFunctionBreakpointAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action add-function-breakpoint', debugService, keybindingService);
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(() => this.updateEnablement()));
        }
        run() {
            this.debugService.addFunctionBreakpoint();
            return Promise.resolve();
        }
        isEnabled(state) {
            return !this.debugService.getViewModel().getSelectedFunctionBreakpoint()
                && this.debugService.getModel().getFunctionBreakpoints().every(fbp => !!fbp.name);
        }
    };
    AddFunctionBreakpointAction.ID = 'workbench.debug.viewlet.action.addFunctionBreakpointAction';
    AddFunctionBreakpointAction.LABEL = nls.localize('addFunctionBreakpoint', "Add Function Breakpoint");
    AddFunctionBreakpointAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], AddFunctionBreakpointAction);
    exports.AddFunctionBreakpointAction = AddFunctionBreakpointAction;
    let AddWatchExpressionAction = class AddWatchExpressionAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action add-watch-expression', debugService, keybindingService);
            this.toDispose.push(this.debugService.getModel().onDidChangeWatchExpressions(() => this.updateEnablement()));
            this.toDispose.push(this.debugService.getViewModel().onDidSelectExpression(() => this.updateEnablement()));
        }
        run() {
            this.debugService.addWatchExpression();
            return Promise.resolve(undefined);
        }
        isEnabled(state) {
            const focusedExpression = this.debugService.getViewModel().getSelectedExpression();
            return super.isEnabled(state) && this.debugService.getModel().getWatchExpressions().every(we => !!we.name && we !== focusedExpression);
        }
    };
    AddWatchExpressionAction.ID = 'workbench.debug.viewlet.action.addWatchExpression';
    AddWatchExpressionAction.LABEL = nls.localize('addWatchExpression', "Add Expression");
    AddWatchExpressionAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], AddWatchExpressionAction);
    exports.AddWatchExpressionAction = AddWatchExpressionAction;
    let RemoveAllWatchExpressionsAction = class RemoveAllWatchExpressionsAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action remove-all', debugService, keybindingService);
            this.toDispose.push(this.debugService.getModel().onDidChangeWatchExpressions(() => this.updateEnablement()));
        }
        run() {
            this.debugService.removeWatchExpressions();
            return Promise.resolve();
        }
        isEnabled(state) {
            return super.isEnabled(state) && this.debugService.getModel().getWatchExpressions().length > 0;
        }
    };
    RemoveAllWatchExpressionsAction.ID = 'workbench.debug.viewlet.action.removeAllWatchExpressions';
    RemoveAllWatchExpressionsAction.LABEL = nls.localize('removeAllWatchExpressions', "Remove All Expressions");
    RemoveAllWatchExpressionsAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], RemoveAllWatchExpressionsAction);
    exports.RemoveAllWatchExpressionsAction = RemoveAllWatchExpressionsAction;
    let FocusSessionAction = class FocusSessionAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService, editorService) {
            super(id, label, '', debugService, keybindingService, 100);
            this.editorService = editorService;
        }
        run(session) {
            this.debugService.focusStackFrame(undefined, undefined, session, true);
            const stackFrame = this.debugService.getViewModel().focusedStackFrame;
            if (stackFrame) {
                return stackFrame.openInEditor(this.editorService, true);
            }
            return Promise.resolve(undefined);
        }
    };
    FocusSessionAction.ID = 'workbench.action.debug.focusProcess';
    FocusSessionAction.LABEL = nls.localize('focusSession', "Focus Session");
    FocusSessionAction = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, editorService_1.IEditorService)
    ], FocusSessionAction);
    exports.FocusSessionAction = FocusSessionAction;
    let CopyValueAction = class CopyValueAction extends actions_1.Action {
        constructor(id, label, value, context, debugService, clipboardService) {
            super(id, label, 'debug-action copy-value');
            this.value = value;
            this.context = context;
            this.debugService = debugService;
            this.clipboardService = clipboardService;
            this._enabled = typeof this.value === 'string' || (this.value instanceof debugModel_1.Variable && !!this.value.evaluateName);
        }
        run() {
            const stackFrame = this.debugService.getViewModel().focusedStackFrame;
            const session = this.debugService.getViewModel().focusedSession;
            if (this.value instanceof debugModel_1.Variable && stackFrame && session && this.value.evaluateName) {
                return session.evaluate(this.value.evaluateName, stackFrame.frameId, this.context).then(result => {
                    return this.clipboardService.writeText(result.body.result);
                }, err => this.clipboardService.writeText(this.value.value));
            }
            return this.clipboardService.writeText(this.value);
        }
    };
    CopyValueAction.ID = 'workbench.debug.viewlet.action.copyValue';
    CopyValueAction.LABEL = nls.localize('copyValue', "Copy Value");
    CopyValueAction = __decorate([
        __param(4, debug_1.IDebugService),
        __param(5, clipboardService_1.IClipboardService)
    ], CopyValueAction);
    exports.CopyValueAction = CopyValueAction;
});
//# sourceMappingURL=debugActions.js.map