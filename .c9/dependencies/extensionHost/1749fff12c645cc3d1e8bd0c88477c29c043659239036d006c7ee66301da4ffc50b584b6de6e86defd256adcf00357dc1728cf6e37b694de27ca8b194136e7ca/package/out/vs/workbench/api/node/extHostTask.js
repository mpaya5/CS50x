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
define(["require", "exports", "vs/base/common/path", "vs/base/common/uri", "vs/base/common/objects", "vs/base/common/async", "vs/base/common/event", "vs/base/node/processes", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/api/node/extHostDebugService", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostConfiguration", "vs/base/common/cancellation", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostInitDataService", "vs/base/common/network"], function (require, exports, path, uri_1, Objects, async_1, event_1, processes_1, extHost_protocol_1, types, extHostWorkspace_1, extHostDebugService_1, extHostDocumentsAndEditors_1, extHostConfiguration_1, cancellation_1, extHostTerminalService_1, extHostRpcService_1, extHostInitDataService_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TaskDefinitionDTO;
    (function (TaskDefinitionDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskDefinitionDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskDefinitionDTO.to = to;
    })(TaskDefinitionDTO || (TaskDefinitionDTO = {}));
    var TaskPresentationOptionsDTO;
    (function (TaskPresentationOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskPresentationOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskPresentationOptionsDTO.to = to;
    })(TaskPresentationOptionsDTO || (TaskPresentationOptionsDTO = {}));
    var ProcessExecutionOptionsDTO;
    (function (ProcessExecutionOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ProcessExecutionOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ProcessExecutionOptionsDTO.to = to;
    })(ProcessExecutionOptionsDTO || (ProcessExecutionOptionsDTO = {}));
    var ProcessExecutionDTO;
    (function (ProcessExecutionDTO) {
        function is(value) {
            if (value) {
                const candidate = value;
                return candidate && !!candidate.process;
            }
            else {
                return false;
            }
        }
        ProcessExecutionDTO.is = is;
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            const result = {
                process: value.process,
                args: value.args
            };
            if (value.options) {
                result.options = ProcessExecutionOptionsDTO.from(value.options);
            }
            return result;
        }
        ProcessExecutionDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return new types.ProcessExecution(value.process, value.args, value.options);
        }
        ProcessExecutionDTO.to = to;
    })(ProcessExecutionDTO || (ProcessExecutionDTO = {}));
    var ShellExecutionOptionsDTO;
    (function (ShellExecutionOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ShellExecutionOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ShellExecutionOptionsDTO.to = to;
    })(ShellExecutionOptionsDTO || (ShellExecutionOptionsDTO = {}));
    var ShellExecutionDTO;
    (function (ShellExecutionDTO) {
        function is(value) {
            if (value) {
                const candidate = value;
                return candidate && (!!candidate.commandLine || !!candidate.command);
            }
            else {
                return false;
            }
        }
        ShellExecutionDTO.is = is;
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            const result = {};
            if (value.commandLine !== undefined) {
                result.commandLine = value.commandLine;
            }
            else {
                result.command = value.command;
                result.args = value.args;
            }
            if (value.options) {
                result.options = ShellExecutionOptionsDTO.from(value.options);
            }
            return result;
        }
        ShellExecutionDTO.from = from;
        function to(value) {
            if (value === undefined || value === null || (value.command === undefined && value.commandLine === undefined)) {
                return undefined;
            }
            if (value.commandLine) {
                return new types.ShellExecution(value.commandLine, value.options);
            }
            else {
                return new types.ShellExecution(value.command, value.args ? value.args : [], value.options);
            }
        }
        ShellExecutionDTO.to = to;
    })(ShellExecutionDTO || (ShellExecutionDTO = {}));
    var CustomExecution2DTO;
    (function (CustomExecution2DTO) {
        function is(value) {
            if (value) {
                let candidate = value;
                return candidate && candidate.customExecution === 'customExecution2';
            }
            else {
                return false;
            }
        }
        CustomExecution2DTO.is = is;
        function from(value) {
            return {
                customExecution: 'customExecution2'
            };
        }
        CustomExecution2DTO.from = from;
    })(CustomExecution2DTO || (CustomExecution2DTO = {}));
    var TaskHandleDTO;
    (function (TaskHandleDTO) {
        function from(value) {
            let folder;
            if (value.scope !== undefined && typeof value.scope !== 'number') {
                folder = value.scope.uri;
            }
            return {
                id: value._id,
                workspaceFolder: folder
            };
        }
        TaskHandleDTO.from = from;
    })(TaskHandleDTO || (TaskHandleDTO = {}));
    var TaskDTO;
    (function (TaskDTO) {
        function fromMany(tasks, extension) {
            if (tasks === undefined || tasks === null) {
                return [];
            }
            const result = [];
            for (let task of tasks) {
                const converted = from(task, extension);
                if (converted) {
                    result.push(converted);
                }
            }
            return result;
        }
        TaskDTO.fromMany = fromMany;
        function from(value, extension) {
            if (value === undefined || value === null) {
                return undefined;
            }
            let execution;
            if (value.execution instanceof types.ProcessExecution) {
                execution = ProcessExecutionDTO.from(value.execution);
            }
            else if (value.execution instanceof types.ShellExecution) {
                execution = ShellExecutionDTO.from(value.execution);
            }
            else if (value.execution2 && value.execution2 instanceof types.CustomExecution2) {
                execution = CustomExecution2DTO.from(value.execution2);
            }
            const definition = TaskDefinitionDTO.from(value.definition);
            let scope;
            if (value.scope) {
                if (typeof value.scope === 'number') {
                    scope = value.scope;
                }
                else {
                    scope = value.scope.uri;
                }
            }
            else {
                // To continue to support the deprecated task constructor that doesn't take a scope, we must add a scope here:
                scope = types.TaskScope.Workspace;
            }
            if (!definition || !scope) {
                return undefined;
            }
            const group = value.group ? value.group.id : undefined;
            const result = {
                _id: value._id,
                definition,
                name: value.name,
                source: {
                    extensionId: extension.identifier.value,
                    label: value.source,
                    scope: scope
                },
                execution: execution,
                isBackground: value.isBackground,
                group: group,
                presentationOptions: TaskPresentationOptionsDTO.from(value.presentationOptions),
                problemMatchers: value.problemMatchers,
                hasDefinedMatchers: value.hasDefinedMatchers,
                runOptions: value.runOptions ? value.runOptions : { reevaluateOnRerun: true },
            };
            return result;
        }
        TaskDTO.from = from;
        function to(value, workspace) {
            return __awaiter(this, void 0, void 0, function* () {
                if (value === undefined || value === null) {
                    return undefined;
                }
                let execution;
                if (ProcessExecutionDTO.is(value.execution)) {
                    execution = ProcessExecutionDTO.to(value.execution);
                }
                else if (ShellExecutionDTO.is(value.execution)) {
                    execution = ShellExecutionDTO.to(value.execution);
                }
                const definition = TaskDefinitionDTO.to(value.definition);
                let scope;
                if (value.source) {
                    if (value.source.scope !== undefined) {
                        if (typeof value.source.scope === 'number') {
                            scope = value.source.scope;
                        }
                        else {
                            scope = yield workspace.resolveWorkspaceFolder(uri_1.URI.revive(value.source.scope));
                        }
                    }
                    else {
                        scope = types.TaskScope.Workspace;
                    }
                }
                if (!definition || !scope) {
                    return undefined;
                }
                const result = new types.Task(definition, scope, value.name, value.source.label, execution, value.problemMatchers);
                if (value.isBackground !== undefined) {
                    result.isBackground = value.isBackground;
                }
                if (value.group !== undefined) {
                    result.group = types.TaskGroup.from(value.group);
                }
                if (value.presentationOptions) {
                    result.presentationOptions = TaskPresentationOptionsDTO.to(value.presentationOptions);
                }
                if (value._id) {
                    result._id = value._id;
                }
                return result;
            });
        }
        TaskDTO.to = to;
    })(TaskDTO || (TaskDTO = {}));
    var TaskFilterDTO;
    (function (TaskFilterDTO) {
        function from(value) {
            return value;
        }
        TaskFilterDTO.from = from;
        function to(value) {
            if (!value) {
                return undefined;
            }
            return Objects.assign(Object.create(null), value);
        }
        TaskFilterDTO.to = to;
    })(TaskFilterDTO || (TaskFilterDTO = {}));
    class TaskExecutionImpl {
        constructor(_tasks, _id, _task) {
            this._tasks = _tasks;
            this._id = _id;
            this._task = _task;
        }
        get task() {
            return this._task;
        }
        terminate() {
            this._tasks.terminateTask(this);
        }
        fireDidStartProcess(value) {
        }
        fireDidEndProcess(value) {
        }
    }
    var TaskExecutionDTO;
    (function (TaskExecutionDTO) {
        function to(value, tasks, workspaceProvider) {
            return __awaiter(this, void 0, void 0, function* () {
                const task = yield TaskDTO.to(value.task, workspaceProvider);
                if (!task) {
                    throw new Error('Unexpected: Task cannot be created.');
                }
                return new TaskExecutionImpl(tasks, value.id, task);
            });
        }
        TaskExecutionDTO.to = to;
        function from(value) {
            return {
                id: value._id,
                task: undefined
            };
        }
        TaskExecutionDTO.from = from;
    })(TaskExecutionDTO || (TaskExecutionDTO = {}));
    let ExtHostTask = class ExtHostTask {
        constructor(extHostRpc, initData, workspaceService, editorService, configurationService, extHostTerminalService) {
            this._onDidExecuteTask = new event_1.Emitter();
            this._onDidTerminateTask = new event_1.Emitter();
            this._onDidTaskProcessStarted = new event_1.Emitter();
            this._onDidTaskProcessEnded = new event_1.Emitter();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTask);
            this._workspaceProvider = workspaceService;
            this._editorService = editorService;
            this._configurationService = configurationService;
            this._terminalService = extHostTerminalService;
            this._handleCounter = 0;
            this._handlers = new Map();
            this._taskExecutions = new Map();
            this._providedCustomExecutions2 = new Map();
            this._activeCustomExecutions2 = new Map();
            if (initData.remote.isRemote && initData.remote.authority) {
                this.registerTaskSystem(network_1.Schemas.vscodeRemote, {
                    scheme: network_1.Schemas.vscodeRemote,
                    authority: initData.remote.authority,
                    platform: process.platform
                });
            }
        }
        registerTaskProvider(extension, type, provider) {
            if (!provider) {
                return new types.Disposable(() => { });
            }
            const handle = this.nextHandle();
            this._handlers.set(handle, { type, provider, extension });
            this._proxy.$registerTaskProvider(handle, type);
            return new types.Disposable(() => {
                this._handlers.delete(handle);
                this._proxy.$unregisterTaskProvider(handle);
            });
        }
        registerTaskSystem(scheme, info) {
            this._proxy.$registerTaskSystem(scheme, info);
        }
        fetchTasks(filter) {
            return this._proxy.$fetchTasks(TaskFilterDTO.from(filter)).then((values) => __awaiter(this, void 0, void 0, function* () {
                const result = [];
                for (let value of values) {
                    const task = yield TaskDTO.to(value, this._workspaceProvider);
                    if (task) {
                        result.push(task);
                    }
                }
                return result;
            }));
        }
        executeTask(extension, task) {
            return __awaiter(this, void 0, void 0, function* () {
                const tTask = task;
                // We have a preserved ID. So the task didn't change.
                if (tTask._id !== undefined) {
                    return this._proxy.$executeTask(TaskHandleDTO.from(tTask)).then(value => this.getTaskExecution(value, task));
                }
                else {
                    const dto = TaskDTO.from(task, extension);
                    if (dto === undefined) {
                        return Promise.reject(new Error('Task is not valid'));
                    }
                    // If this task is a custom execution, then we need to save it away
                    // in the provided custom execution map that is cleaned up after the
                    // task is executed.
                    if (CustomExecution2DTO.is(dto.execution)) {
                        yield this.addCustomExecution2(dto, task);
                    }
                    return this._proxy.$executeTask(dto).then(value => this.getTaskExecution(value, task));
                }
            });
        }
        get taskExecutions() {
            const result = [];
            this._taskExecutions.forEach(value => result.push(value));
            return result;
        }
        terminateTask(execution) {
            if (!(execution instanceof TaskExecutionImpl)) {
                throw new Error('No valid task execution provided');
            }
            return this._proxy.$terminateTask(execution._id);
        }
        get onDidStartTask() {
            return this._onDidExecuteTask.event;
        }
        $onDidStartTask(execution, terminalId) {
            return __awaiter(this, void 0, void 0, function* () {
                const execution2 = this._providedCustomExecutions2.get(execution.id);
                if (execution2) {
                    if (this._activeCustomExecutions2.get(execution.id) !== undefined) {
                        throw new Error('We should not be trying to start the same custom task executions twice.');
                    }
                    // Clone the custom execution to keep the original untouched. This is important for multiple runs of the same task.
                    this._activeCustomExecutions2.set(execution.id, execution2);
                    this._terminalService.attachPtyToTerminal(terminalId, yield execution2.callback());
                }
                this._onDidExecuteTask.fire({
                    execution: yield this.getTaskExecution(execution)
                });
            });
        }
        get onDidEndTask() {
            return this._onDidTerminateTask.event;
        }
        $OnDidEndTask(execution) {
            return __awaiter(this, void 0, void 0, function* () {
                const _execution = yield this.getTaskExecution(execution);
                this._taskExecutions.delete(execution.id);
                this.customExecutionComplete(execution);
                this._onDidTerminateTask.fire({
                    execution: _execution
                });
            });
        }
        get onDidStartTaskProcess() {
            return this._onDidTaskProcessStarted.event;
        }
        $onDidStartTaskProcess(value) {
            return __awaiter(this, void 0, void 0, function* () {
                const execution = yield this.getTaskExecution(value.id);
                if (execution) {
                    this._onDidTaskProcessStarted.fire({
                        execution: execution,
                        processId: value.processId
                    });
                }
            });
        }
        get onDidEndTaskProcess() {
            return this._onDidTaskProcessEnded.event;
        }
        $onDidEndTaskProcess(value) {
            return __awaiter(this, void 0, void 0, function* () {
                const execution = yield this.getTaskExecution(value.id);
                if (execution) {
                    this._onDidTaskProcessEnded.fire({
                        execution: execution,
                        exitCode: value.exitCode
                    });
                }
            });
        }
        $provideTasks(handle, validTypes) {
            const handler = this._handlers.get(handle);
            if (!handler) {
                return Promise.reject(new Error('no handler found'));
            }
            // Set up a list of task ID promises that we can wait on
            // before returning the provided tasks. The ensures that
            // our task IDs are calculated for any custom execution tasks.
            // Knowing this ID ahead of time is needed because when a task
            // start event is fired this is when the custom execution is called.
            // The task start event is also the first time we see the ID from the main
            // thread, which is too late for us because we need to save an map
            // from an ID to the custom execution function. (Kind of a cart before the horse problem).
            const taskIdPromises = [];
            const fetchPromise = async_1.asPromise(() => handler.provider.provideTasks(cancellation_1.CancellationToken.None)).then(value => {
                const taskDTOs = [];
                if (value) {
                    for (let task of value) {
                        if (!task.definition || !validTypes[task.definition.type]) {
                            console.warn(`The task [${task.source}, ${task.name}] uses an undefined task type. The task will be ignored in the future.`);
                        }
                        const taskDTO = TaskDTO.from(task, handler.extension);
                        if (taskDTO) {
                            taskDTOs.push(taskDTO);
                            if (CustomExecution2DTO.is(taskDTO.execution)) {
                                // The ID is calculated on the main thread task side, so, let's call into it here.
                                // We need the task id's pre-computed for custom task executions because when OnDidStartTask
                                // is invoked, we have to be able to map it back to our data.
                                taskIdPromises.push(this.addCustomExecution2(taskDTO, task));
                            }
                        }
                    }
                }
                return {
                    tasks: taskDTOs,
                    extension: handler.extension
                };
            });
            return new Promise((resolve) => {
                fetchPromise.then((result) => {
                    Promise.all(taskIdPromises).then(() => {
                        resolve(result);
                    });
                });
            });
        }
        $resolveTask(handle, taskDTO) {
            return __awaiter(this, void 0, void 0, function* () {
                const handler = this._handlers.get(handle);
                if (!handler) {
                    return Promise.reject(new Error('no handler found'));
                }
                if (taskDTO.definition.type !== handler.type) {
                    throw new Error(`Unexpected: Task of type [${taskDTO.definition.type}] cannot be resolved by provider of type [${handler.type}].`);
                }
                const task = yield TaskDTO.to(taskDTO, this._workspaceProvider);
                if (!task) {
                    throw new Error('Unexpected: Task cannot be resolved.');
                }
                const resolvedTask = yield handler.provider.resolveTask(task, cancellation_1.CancellationToken.None);
                if (!resolvedTask) {
                    return;
                }
                const resolvedTaskDTO = TaskDTO.from(resolvedTask, handler.extension);
                if (!resolvedTaskDTO) {
                    throw new Error('Unexpected: Task cannot be resolved.');
                }
                if (resolvedTask.definition !== task.definition) {
                    throw new Error('Unexpected: The resolved task definition must be the same object as the original task definition. The task definition cannot be changed.');
                }
                if (CustomExecution2DTO.is(resolvedTaskDTO.execution)) {
                    yield this.addCustomExecution2(resolvedTaskDTO, resolvedTask);
                }
                return resolvedTaskDTO;
            });
        }
        $resolveVariables(uriComponents, toResolve) {
            return __awaiter(this, void 0, void 0, function* () {
                const configProvider = yield this._configurationService.getConfigProvider();
                const uri = uri_1.URI.revive(uriComponents);
                const result = {
                    process: undefined,
                    variables: Object.create(null)
                };
                const workspaceFolder = yield this._workspaceProvider.resolveWorkspaceFolder(uri);
                const workspaceFolders = yield this._workspaceProvider.getWorkspaceFolders2();
                if (!workspaceFolders || !workspaceFolder) {
                    throw new Error('Unexpected: Tasks can only be run in a workspace folder');
                }
                const resolver = new extHostDebugService_1.ExtHostVariableResolverService(workspaceFolders, this._editorService, configProvider);
                const ws = {
                    uri: workspaceFolder.uri,
                    name: workspaceFolder.name,
                    index: workspaceFolder.index,
                    toResource: () => {
                        throw new Error('Not implemented');
                    }
                };
                for (let variable of toResolve.variables) {
                    result.variables[variable] = resolver.resolve(ws, variable);
                }
                if (toResolve.process !== undefined) {
                    let paths = undefined;
                    if (toResolve.process.path !== undefined) {
                        paths = toResolve.process.path.split(path.delimiter);
                        for (let i = 0; i < paths.length; i++) {
                            paths[i] = resolver.resolve(ws, paths[i]);
                        }
                    }
                    result.process = yield processes_1.win32.findExecutable(resolver.resolve(ws, toResolve.process.name), toResolve.process.cwd !== undefined ? resolver.resolve(ws, toResolve.process.cwd) : undefined, paths);
                }
                return result;
            });
        }
        nextHandle() {
            return this._handleCounter++;
        }
        addCustomExecution2(taskDTO, task) {
            return __awaiter(this, void 0, void 0, function* () {
                const taskId = yield this._proxy.$createTaskId(taskDTO);
                this._providedCustomExecutions2.set(taskId, task.execution2);
            });
        }
        getTaskExecution(execution, task) {
            return __awaiter(this, void 0, void 0, function* () {
                if (typeof execution === 'string') {
                    const taskExecution = this._taskExecutions.get(execution);
                    if (!taskExecution) {
                        throw new Error('Unexpected: The specified task is missing an execution');
                    }
                    return taskExecution;
                }
                let result = this._taskExecutions.get(execution.id);
                if (result) {
                    return result;
                }
                const taskToCreate = task ? task : yield TaskDTO.to(execution.task, this._workspaceProvider);
                if (!taskToCreate) {
                    throw new Error('Unexpected: Task does not exist.');
                }
                const createdResult = new TaskExecutionImpl(this, execution.id, taskToCreate);
                this._taskExecutions.set(execution.id, createdResult);
                return createdResult;
            });
        }
        customExecutionComplete(execution) {
            const extensionCallback2 = this._activeCustomExecutions2.get(execution.id);
            if (extensionCallback2) {
                this._activeCustomExecutions2.delete(execution.id);
            }
            const lastCustomExecution = this._providedCustomExecutions2.get(execution.id);
            // Technically we don't really need to do this, however, if an extension
            // is executing a task through "executeTask" over and over again
            // with different properties in the task definition, then this list
            // could grow indefinitely, something we don't want.
            this._providedCustomExecutions2.clear();
            // We do still need to hang on to the last custom execution so that the
            // Rerun Task command doesn't choke when it tries to rerun a custom execution
            if (lastCustomExecution) {
                this._providedCustomExecutions2.set(execution.id, lastCustomExecution);
            }
        }
    };
    ExtHostTask = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, extHostWorkspace_1.IExtHostWorkspace),
        __param(3, extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors),
        __param(4, extHostConfiguration_1.IExtHostConfiguration),
        __param(5, extHostTerminalService_1.IExtHostTerminalService)
    ], ExtHostTask);
    exports.ExtHostTask = ExtHostTask;
});
//# sourceMappingURL=extHostTask.js.map