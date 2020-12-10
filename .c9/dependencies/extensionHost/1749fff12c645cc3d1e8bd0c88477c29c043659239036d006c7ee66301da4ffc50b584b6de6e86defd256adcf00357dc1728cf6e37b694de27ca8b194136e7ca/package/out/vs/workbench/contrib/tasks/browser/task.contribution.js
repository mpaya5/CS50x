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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/tasks/browser/taskQuickOpen", "vs/base/common/lifecycle", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/workbench/contrib/tasks/common/problemMatcher", "vs/platform/progress/common/progress", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/statusbar/common/statusbar", "vs/workbench/browser/quickopen", "vs/workbench/contrib/output/common/output", "vs/workbench/browser/actions", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/common/taskService", "../browser/quickOpen", "vs/workbench/common/contributions", "vs/workbench/common/actions", "vs/workbench/contrib/tasks/browser/runAutomaticTasks", "../common/jsonSchema_v1", "../common/jsonSchema_v2", "vs/workbench/contrib/tasks/browser/abstractTaskService", "vs/css!../common/media/task.contribution"], function (require, exports, nls, taskQuickOpen_1, lifecycle_1, platform_1, actions_1, problemMatcher_1, progress_1, jsonContributionRegistry, statusbar_1, quickopen_1, output_1, actions_2, tasks_1, taskService_1, quickOpen_1, contributions_1, actions_3, runAutomaticTasks_1, jsonSchema_v1_1, jsonSchema_v2_1, abstractTaskService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let tasksCategory = nls.localize('tasksCategory', "Tasks");
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(runAutomaticTasks_1.RunAutomaticTasks, 4 /* Eventually */);
    const actionRegistry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(runAutomaticTasks_1.ManageAutomaticTaskRunning, runAutomaticTasks_1.ManageAutomaticTaskRunning.ID, runAutomaticTasks_1.ManageAutomaticTaskRunning.LABEL), 'Tasks: Manage Automatic Tasks in Folder', tasksCategory);
    let TaskStatusBarContributions = class TaskStatusBarContributions extends lifecycle_1.Disposable {
        constructor(taskService, statusbarService, progressService) {
            super();
            this.taskService = taskService;
            this.statusbarService = statusbarService;
            this.progressService = progressService;
            this.activeTasksCount = 0;
            this.registerListeners();
        }
        registerListeners() {
            let promise = undefined;
            let resolver;
            this.taskService.onDidStateChange(event => {
                if (event.kind === "changed" /* Changed */) {
                    this.updateRunningTasksStatus();
                }
                if (!this.ignoreEventForUpdateRunningTasksCount(event)) {
                    switch (event.kind) {
                        case "active" /* Active */:
                            this.activeTasksCount++;
                            if (this.activeTasksCount === 1) {
                                if (!promise) {
                                    promise = new Promise((resolve) => {
                                        resolver = resolve;
                                    });
                                }
                            }
                            break;
                        case "inactive" /* Inactive */:
                            // Since the exiting of the sub process is communicated async we can't order inactive and terminate events.
                            // So try to treat them accordingly.
                            if (this.activeTasksCount > 0) {
                                this.activeTasksCount--;
                                if (this.activeTasksCount === 0) {
                                    if (promise && resolver) {
                                        resolver();
                                    }
                                }
                            }
                            break;
                        case "terminated" /* Terminated */:
                            if (this.activeTasksCount !== 0) {
                                this.activeTasksCount = 0;
                                if (promise && resolver) {
                                    resolver();
                                }
                            }
                            break;
                    }
                }
                if (promise && (event.kind === "active" /* Active */) && (this.activeTasksCount === 1)) {
                    this.progressService.withProgress({ location: 10 /* Window */ }, progress => {
                        progress.report({ message: nls.localize('building', 'Building...') });
                        return promise;
                    }).then(() => {
                        promise = undefined;
                    });
                }
            });
        }
        updateRunningTasksStatus() {
            return __awaiter(this, void 0, void 0, function* () {
                const tasks = yield this.taskService.getActiveTasks();
                if (tasks.length === 0) {
                    if (this.runningTasksStatusItem) {
                        this.runningTasksStatusItem.dispose();
                        this.runningTasksStatusItem = undefined;
                    }
                }
                else {
                    const itemProps = {
                        text: `$(tools) ${tasks.length}`,
                        tooltip: nls.localize('runningTasks', "Show Running Tasks"),
                        command: 'workbench.action.tasks.showTasks',
                    };
                    if (!this.runningTasksStatusItem) {
                        this.runningTasksStatusItem = this.statusbarService.addEntry(itemProps, 'status.runningTasks', nls.localize('status.runningTasks', "Running Tasks"), 0 /* LEFT */, 49 /* Medium Priority, next to Markers */);
                    }
                    else {
                        this.runningTasksStatusItem.update(itemProps);
                    }
                }
            });
        }
        ignoreEventForUpdateRunningTasksCount(event) {
            if (!this.taskService.inTerminal()) {
                return false;
            }
            if (event.group !== tasks_1.TaskGroup.Build) {
                return true;
            }
            if (!event.__task) {
                return false;
            }
            return event.__task.configurationProperties.problemMatchers === undefined || event.__task.configurationProperties.problemMatchers.length === 0;
        }
    };
    TaskStatusBarContributions = __decorate([
        __param(0, taskService_1.ITaskService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, progress_1.IProgressService)
    ], TaskStatusBarContributions);
    exports.TaskStatusBarContributions = TaskStatusBarContributions;
    workbenchRegistry.registerWorkbenchContribution(TaskStatusBarContributions, 3 /* Restored */);
    actions_1.MenuRegistry.appendMenuItem(25 /* MenubarTerminalMenu */, {
        group: '2_run',
        command: {
            id: 'workbench.action.tasks.runTask',
            title: nls.localize({ key: 'miRunTask', comment: ['&& denotes a mnemonic'] }, "&&Run Task...")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(25 /* MenubarTerminalMenu */, {
        group: '2_run',
        command: {
            id: 'workbench.action.tasks.build',
            title: nls.localize({ key: 'miBuildTask', comment: ['&& denotes a mnemonic'] }, "Run &&Build Task...")
        },
        order: 2
    });
    // Manage Tasks
    actions_1.MenuRegistry.appendMenuItem(25 /* MenubarTerminalMenu */, {
        group: '3_manage',
        command: {
            precondition: tasks_1.TASK_RUNNING_STATE,
            id: 'workbench.action.tasks.showTasks',
            title: nls.localize({ key: 'miRunningTask', comment: ['&& denotes a mnemonic'] }, "Show Runnin&&g Tasks...")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(25 /* MenubarTerminalMenu */, {
        group: '3_manage',
        command: {
            precondition: tasks_1.TASK_RUNNING_STATE,
            id: 'workbench.action.tasks.restartTask',
            title: nls.localize({ key: 'miRestartTask', comment: ['&& denotes a mnemonic'] }, "R&&estart Running Task...")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(25 /* MenubarTerminalMenu */, {
        group: '3_manage',
        command: {
            precondition: tasks_1.TASK_RUNNING_STATE,
            id: 'workbench.action.tasks.terminate',
            title: nls.localize({ key: 'miTerminateTask', comment: ['&& denotes a mnemonic'] }, "&&Terminate Task...")
        },
        order: 3
    });
    // Configure Tasks
    actions_1.MenuRegistry.appendMenuItem(25 /* MenubarTerminalMenu */, {
        group: '4_configure',
        command: {
            id: 'workbench.action.tasks.configureTaskRunner',
            title: nls.localize({ key: 'miConfigureTask', comment: ['&& denotes a mnemonic'] }, "&&Configure Tasks...")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(25 /* MenubarTerminalMenu */, {
        group: '4_configure',
        command: {
            id: 'workbench.action.tasks.configureDefaultBuildTask',
            title: nls.localize({ key: 'miConfigureBuildTask', comment: ['&& denotes a mnemonic'] }, "Configure De&&fault Build Task...")
        },
        order: 2
    });
    actions_1.MenuRegistry.addCommand({ id: abstractTaskService_1.ConfigureTaskAction.ID, title: { value: abstractTaskService_1.ConfigureTaskAction.TEXT, original: 'Configure Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_1.MenuRegistry.addCommand({ id: 'workbench.action.tasks.showLog', title: { value: nls.localize('ShowLogAction.label', "Show Task Log"), original: 'Show Task Log' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_1.MenuRegistry.addCommand({ id: 'workbench.action.tasks.runTask', title: { value: nls.localize('RunTaskAction.label', "Run Task"), original: 'Run Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_1.MenuRegistry.addCommand({ id: 'workbench.action.tasks.reRunTask', title: { value: nls.localize('ReRunTaskAction.label', "Rerun Last Task"), original: 'Rerun Last Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_1.MenuRegistry.addCommand({ id: 'workbench.action.tasks.restartTask', title: { value: nls.localize('RestartTaskAction.label', "Restart Running Task"), original: 'Restart Running Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_1.MenuRegistry.addCommand({ id: 'workbench.action.tasks.showTasks', title: { value: nls.localize('ShowTasksAction.label', "Show Running Tasks"), original: 'Show Running Tasks' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_1.MenuRegistry.addCommand({ id: 'workbench.action.tasks.terminate', title: { value: nls.localize('TerminateAction.label', "Terminate Task"), original: 'Terminate Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_1.MenuRegistry.addCommand({ id: 'workbench.action.tasks.build', title: { value: nls.localize('BuildAction.label', "Run Build Task"), original: 'Run Build Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_1.MenuRegistry.addCommand({ id: 'workbench.action.tasks.test', title: { value: nls.localize('TestAction.label', "Run Test Task"), original: 'Run Test Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_1.MenuRegistry.addCommand({ id: 'workbench.action.tasks.configureDefaultBuildTask', title: { value: nls.localize('ConfigureDefaultBuildTask.label', "Configure Default Build Task"), original: 'Configure Default Build Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    actions_1.MenuRegistry.addCommand({ id: 'workbench.action.tasks.configureDefaultTestTask', title: { value: nls.localize('ConfigureDefaultTestTask.label', "Configure Default Test Task"), original: 'Configure Default Test Task' }, category: { value: tasksCategory, original: 'Tasks' } });
    // MenuRegistry.addCommand( { id: 'workbench.action.tasks.rebuild', title: nls.localize('RebuildAction.label', 'Run Rebuild Task'), category: tasksCategory });
    // MenuRegistry.addCommand( { id: 'workbench.action.tasks.clean', title: nls.localize('CleanAction.label', 'Run Clean Task'), category: tasksCategory });
    // Tasks Output channel. Register it before using it in Task Service.
    let outputChannelRegistry = platform_1.Registry.as(output_1.Extensions.OutputChannels);
    outputChannelRegistry.registerChannel({ id: abstractTaskService_1.AbstractTaskService.OutputChannelId, label: abstractTaskService_1.AbstractTaskService.OutputChannelLabel, log: false });
    // Register Quick Open
    const quickOpenRegistry = (platform_1.Registry.as(quickopen_1.Extensions.Quickopen));
    const tasksPickerContextKey = 'inTasksPicker';
    quickOpenRegistry.registerQuickOpenHandler(new quickopen_1.QuickOpenHandlerDescriptor(taskQuickOpen_1.QuickOpenHandler, taskQuickOpen_1.QuickOpenHandler.ID, 'task ', tasksPickerContextKey, nls.localize('quickOpen.task', "Run Task")));
    const actionBarRegistry = platform_1.Registry.as(actions_2.Extensions.Actionbar);
    actionBarRegistry.registerActionBarContributor(actions_2.Scope.VIEWER, quickOpen_1.QuickOpenActionContributor);
    // tasks.json validation
    let schemaId = 'vscode://schemas/tasks';
    let schema = {
        id: schemaId,
        description: 'Task definition file',
        type: 'object',
        allowsTrailingCommas: true,
        allowComments: true,
        default: {
            version: '2.0.0',
            tasks: [
                {
                    label: 'My Task',
                    command: 'echo hello',
                    type: 'shell',
                    args: [],
                    problemMatcher: ['$tsc'],
                    presentation: {
                        reveal: 'always'
                    },
                    group: 'build'
                }
            ]
        }
    };
    schema.definitions = Object.assign({}, jsonSchema_v1_1.default.definitions, jsonSchema_v2_1.default.definitions);
    schema.oneOf = [...(jsonSchema_v2_1.default.oneOf || []), ...(jsonSchema_v1_1.default.oneOf || [])];
    let jsonRegistry = platform_1.Registry.as(jsonContributionRegistry.Extensions.JSONContribution);
    jsonRegistry.registerSchema(schemaId, schema);
    problemMatcher_1.ProblemMatcherRegistry.onMatcherChanged(() => {
        jsonSchema_v2_1.updateProblemMatchers();
        jsonRegistry.notifySchemaChanged(schemaId);
    });
});
//# sourceMappingURL=task.contribution.js.map