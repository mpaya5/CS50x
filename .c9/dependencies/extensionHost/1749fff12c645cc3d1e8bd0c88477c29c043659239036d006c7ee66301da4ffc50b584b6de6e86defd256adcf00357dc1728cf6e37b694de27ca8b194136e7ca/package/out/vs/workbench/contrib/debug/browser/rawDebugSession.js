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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/actions", "vs/base/common/errors", "vs/workbench/contrib/debug/common/debugUtils", "vs/base/common/errorsWithActions", "vs/base/common/uri", "vs/base/common/process"], function (require, exports, nls, event_1, objects, actions_1, errors, debugUtils_1, errorsWithActions_1, uri_1, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Encapsulates the DebugAdapter lifecycle and some idiosyncrasies of the Debug Adapter Protocol.
     */
    class RawDebugSession {
        constructor(debugAdapter, dbgr, telemetryService, customTelemetryService, windowsService, openerService) {
            this.telemetryService = telemetryService;
            this.customTelemetryService = customTelemetryService;
            this.windowsService = windowsService;
            this.openerService = openerService;
            this.allThreadsContinued = true;
            this._readyForBreakpoints = false;
            // shutdown
            this.debugAdapterStopped = false;
            this.inShutdown = false;
            this.terminated = false;
            this.firedAdapterExitEvent = false;
            // telemetry
            this.startTime = 0;
            this.didReceiveStoppedEvent = false;
            this.debugAdapter = debugAdapter;
            this._capabilities = Object.create(null);
            this._onDidInitialize = new event_1.Emitter();
            this._onDidStop = new event_1.Emitter();
            this._onDidContinued = new event_1.Emitter();
            this._onDidTerminateDebugee = new event_1.Emitter();
            this._onDidExitDebugee = new event_1.Emitter();
            this._onDidThread = new event_1.Emitter();
            this._onDidOutput = new event_1.Emitter();
            this._onDidBreakpoint = new event_1.Emitter();
            this._onDidLoadedSource = new event_1.Emitter();
            this._onDidCustomEvent = new event_1.Emitter();
            this._onDidEvent = new event_1.Emitter();
            this._onDidExitAdapter = new event_1.Emitter();
            this.debugAdapter.onError(err => {
                this.shutdown(err);
            });
            this.debugAdapter.onExit(code => {
                if (code !== 0) {
                    this.shutdown(new Error(`exit code: ${code}`));
                }
                else {
                    // normal exit
                    this.shutdown();
                }
            });
            this.debugAdapter.onEvent(event => {
                switch (event.event) {
                    case 'initialized':
                        this._readyForBreakpoints = true;
                        this._onDidInitialize.fire(event);
                        break;
                    case 'loadedSource':
                        this._onDidLoadedSource.fire(event);
                        break;
                    case 'capabilities':
                        if (event.body) {
                            const capabilities = event.body.capabilities;
                            this.mergeCapabilities(capabilities);
                        }
                        break;
                    case 'stopped':
                        this.didReceiveStoppedEvent = true; // telemetry: remember that debugger stopped successfully
                        this._onDidStop.fire(event);
                        break;
                    case 'continued':
                        this.allThreadsContinued = event.body.allThreadsContinued === false ? false : true;
                        this._onDidContinued.fire(event);
                        break;
                    case 'thread':
                        this._onDidThread.fire(event);
                        break;
                    case 'output':
                        this._onDidOutput.fire(event);
                        break;
                    case 'breakpoint':
                        this._onDidBreakpoint.fire(event);
                        break;
                    case 'terminated':
                        this._onDidTerminateDebugee.fire(event);
                        break;
                    case 'exit':
                        this._onDidExitDebugee.fire(event);
                        break;
                    default:
                        this._onDidCustomEvent.fire(event);
                        break;
                }
                this._onDidEvent.fire(event);
            });
            this.debugAdapter.onRequest(request => this.dispatchRequest(request, dbgr));
        }
        get onDidExitAdapter() {
            return this._onDidExitAdapter.event;
        }
        get capabilities() {
            return this._capabilities;
        }
        /**
         * DA is ready to accepts setBreakpoint requests.
         * Becomes true after "initialized" events has been received.
         */
        get readyForBreakpoints() {
            return this._readyForBreakpoints;
        }
        //---- DAP events
        get onDidInitialize() {
            return this._onDidInitialize.event;
        }
        get onDidStop() {
            return this._onDidStop.event;
        }
        get onDidContinued() {
            return this._onDidContinued.event;
        }
        get onDidTerminateDebugee() {
            return this._onDidTerminateDebugee.event;
        }
        get onDidExitDebugee() {
            return this._onDidExitDebugee.event;
        }
        get onDidThread() {
            return this._onDidThread.event;
        }
        get onDidOutput() {
            return this._onDidOutput.event;
        }
        get onDidBreakpoint() {
            return this._onDidBreakpoint.event;
        }
        get onDidLoadedSource() {
            return this._onDidLoadedSource.event;
        }
        get onDidCustomEvent() {
            return this._onDidCustomEvent.event;
        }
        get onDidEvent() {
            return this._onDidEvent.event;
        }
        //---- DebugAdapter lifecycle
        /**
         * Starts the underlying debug adapter and tracks the session time for telemetry.
         */
        start() {
            if (!this.debugAdapter) {
                return Promise.reject(new Error('no debug adapter'));
            }
            return this.debugAdapter.startSession().then(() => {
                this.startTime = new Date().getTime();
            }, err => {
                return Promise.reject(err);
            });
        }
        /**
         * Send client capabilities to the debug adapter and receive DA capabilities in return.
         */
        initialize(args) {
            return this.send('initialize', args).then((response) => {
                this.mergeCapabilities(response.body);
                return response;
            });
        }
        /**
         * Terminate the debuggee and shutdown the adapter
         */
        disconnect(restart = false) {
            return this.shutdown(undefined, restart);
        }
        //---- DAP requests
        launchOrAttach(config) {
            return this.send(config.request, config).then(response => {
                this.mergeCapabilities(response.body);
                return response;
            });
        }
        /**
         * Try killing the debuggee softly...
         */
        terminate(restart = false) {
            if (this.capabilities.supportsTerminateRequest) {
                if (!this.terminated) {
                    this.terminated = true;
                    return this.send('terminate', { restart });
                }
                return this.disconnect(restart);
            }
            return Promise.reject(new Error('terminated not supported'));
        }
        restart() {
            if (this.capabilities.supportsRestartRequest) {
                return this.send('restart', null);
            }
            return Promise.reject(new Error('restart not supported'));
        }
        next(args) {
            return this.send('next', args).then(response => {
                this.fireSimulatedContinuedEvent(args.threadId);
                return response;
            });
        }
        stepIn(args) {
            return this.send('stepIn', args).then(response => {
                this.fireSimulatedContinuedEvent(args.threadId);
                return response;
            });
        }
        stepOut(args) {
            return this.send('stepOut', args).then(response => {
                this.fireSimulatedContinuedEvent(args.threadId);
                return response;
            });
        }
        continue(args) {
            return this.send('continue', args).then(response => {
                if (response && response.body && response.body.allThreadsContinued !== undefined) {
                    this.allThreadsContinued = response.body.allThreadsContinued;
                }
                this.fireSimulatedContinuedEvent(args.threadId, this.allThreadsContinued);
                return response;
            });
        }
        pause(args) {
            return this.send('pause', args);
        }
        terminateThreads(args) {
            if (this.capabilities.supportsTerminateThreadsRequest) {
                return this.send('terminateThreads', args);
            }
            return Promise.reject(new Error('terminateThreads not supported'));
        }
        setVariable(args) {
            if (this.capabilities.supportsSetVariable) {
                return this.send('setVariable', args);
            }
            return Promise.reject(new Error('setVariable not supported'));
        }
        restartFrame(args, threadId) {
            if (this.capabilities.supportsRestartFrame) {
                return this.send('restartFrame', args).then(response => {
                    this.fireSimulatedContinuedEvent(threadId);
                    return response;
                });
            }
            return Promise.reject(new Error('restartFrame not supported'));
        }
        completions(args) {
            if (this.capabilities.supportsCompletionsRequest) {
                return this.send('completions', args);
            }
            return Promise.reject(new Error('completions not supported'));
        }
        setBreakpoints(args) {
            return this.send('setBreakpoints', args);
        }
        setFunctionBreakpoints(args) {
            if (this.capabilities.supportsFunctionBreakpoints) {
                return this.send('setFunctionBreakpoints', args);
            }
            return Promise.reject(new Error('setFunctionBreakpoints not supported'));
        }
        dataBreakpointInfo(args) {
            if (this.capabilities.supportsDataBreakpoints) {
                return this.send('dataBreakpointInfo', args);
            }
            return Promise.reject(new Error('dataBreakpointInfo not supported'));
        }
        setDataBreakpoints(args) {
            if (this.capabilities.supportsDataBreakpoints) {
                return this.send('setDataBreakpoints', args);
            }
            return Promise.reject(new Error('setDataBreakpoints not supported'));
        }
        setExceptionBreakpoints(args) {
            return this.send('setExceptionBreakpoints', args);
        }
        configurationDone() {
            if (this.capabilities.supportsConfigurationDoneRequest) {
                return this.send('configurationDone', null);
            }
            return Promise.reject(new Error('configurationDone not supported'));
        }
        stackTrace(args) {
            return this.send('stackTrace', args);
        }
        exceptionInfo(args) {
            if (this.capabilities.supportsExceptionInfoRequest) {
                return this.send('exceptionInfo', args);
            }
            return Promise.reject(new Error('exceptionInfo not supported'));
        }
        scopes(args) {
            return this.send('scopes', args);
        }
        variables(args) {
            return this.send('variables', args);
        }
        source(args) {
            return this.send('source', args);
        }
        loadedSources(args) {
            if (this.capabilities.supportsLoadedSourcesRequest) {
                return this.send('loadedSources', args);
            }
            return Promise.reject(new Error('loadedSources not supported'));
        }
        threads() {
            return this.send('threads', null);
        }
        evaluate(args) {
            return this.send('evaluate', args);
        }
        stepBack(args) {
            if (this.capabilities.supportsStepBack) {
                return this.send('stepBack', args).then(response => {
                    if (response.body === undefined) { // TODO@AW why this check?
                        this.fireSimulatedContinuedEvent(args.threadId);
                    }
                    return response;
                });
            }
            return Promise.reject(new Error('stepBack not supported'));
        }
        reverseContinue(args) {
            if (this.capabilities.supportsStepBack) {
                return this.send('reverseContinue', args).then(response => {
                    if (response.body === undefined) { // TODO@AW why this check?
                        this.fireSimulatedContinuedEvent(args.threadId);
                    }
                    return response;
                });
            }
            return Promise.reject(new Error('reverseContinue not supported'));
        }
        gotoTargets(args) {
            if (this.capabilities.supportsGotoTargetsRequest) {
                return this.send('gotoTargets', args);
            }
            return Promise.reject(new Error('gotoTargets is not supported'));
        }
        goto(args) {
            if (this.capabilities.supportsGotoTargetsRequest) {
                return this.send('goto', args).then(res => {
                    this.fireSimulatedContinuedEvent(args.threadId);
                    return res;
                });
            }
            return Promise.reject(new Error('goto is not supported'));
        }
        custom(request, args) {
            return this.send(request, args);
        }
        //---- private
        shutdown(error, restart = false) {
            if (!this.inShutdown) {
                this.inShutdown = true;
                if (this.debugAdapter) {
                    return this.send('disconnect', { restart }, 500).then(() => {
                        this.stopAdapter(error);
                    }, () => {
                        // ignore error
                        this.stopAdapter(error);
                    });
                }
                return this.stopAdapter(error);
            }
            return Promise.resolve(undefined);
        }
        stopAdapter(error) {
            if (this.debugAdapter) {
                const da = this.debugAdapter;
                this.debugAdapter = null;
                return da.stopSession().then(_ => {
                    this.debugAdapterStopped = true;
                    this.fireAdapterExitEvent(error);
                }, err => {
                    this.fireAdapterExitEvent(error);
                });
            }
            else {
                this.fireAdapterExitEvent(error);
            }
            return Promise.resolve(undefined);
        }
        fireAdapterExitEvent(error) {
            if (!this.firedAdapterExitEvent) {
                this.firedAdapterExitEvent = true;
                const e = {
                    emittedStopped: this.didReceiveStoppedEvent,
                    sessionLengthInSeconds: (new Date().getTime() - this.startTime) / 1000
                };
                if (error && !this.debugAdapterStopped) {
                    e.error = error;
                }
                this._onDidExitAdapter.fire(e);
            }
        }
        dispatchRequest(request, dbgr) {
            return __awaiter(this, void 0, void 0, function* () {
                const response = {
                    type: 'response',
                    seq: 0,
                    command: request.command,
                    request_seq: request.seq,
                    success: true
                };
                const safeSendResponse = (response) => this.debugAdapter && this.debugAdapter.sendResponse(response);
                switch (request.command) {
                    case 'launchVSCode':
                        this.launchVsCode(request.arguments).then(_ => {
                            response.body = {
                            //processId: pid
                            };
                            safeSendResponse(response);
                        }, err => {
                            response.success = false;
                            response.message = err.message;
                            safeSendResponse(response);
                        });
                        break;
                    case 'runInTerminal':
                        dbgr.runInTerminal(request.arguments).then(shellProcessId => {
                            const resp = response;
                            resp.body = {};
                            if (typeof shellProcessId === 'number') {
                                resp.body.shellProcessId = shellProcessId;
                            }
                            safeSendResponse(resp);
                        }, err => {
                            response.success = false;
                            response.message = err.message;
                            safeSendResponse(response);
                        });
                        break;
                    default:
                        response.success = false;
                        response.message = `unknown request '${request.command}'`;
                        safeSendResponse(response);
                        break;
                }
            });
        }
        launchVsCode(vscodeArgs) {
            let args = {
                _: []
            };
            for (let arg of vscodeArgs.args) {
                if (arg.prefix) {
                    const a2 = (arg.prefix || '') + (arg.path || '');
                    const match = /^--(.+)=(.+)$/.exec(a2);
                    if (match && match.length === 3) {
                        const key = match[1];
                        let value = match[2];
                        if ((key === 'file-uri' || key === 'folder-uri') && !debugUtils_1.isUri(arg.path)) {
                            value = uri_1.URI.file(value).toString();
                            const v = args[key];
                            if (v) {
                                if (Array.isArray(v)) {
                                    v.push(value);
                                }
                                else {
                                    args[key] = [v, value];
                                }
                            }
                            else {
                                args[key] = value;
                            }
                        }
                        else {
                            args[key] = value;
                        }
                    }
                    else {
                        const match = /^--(.+)$/.exec(a2);
                        if (match && match.length === 2) {
                            const key = match[1];
                            args[key] = true;
                        }
                        else {
                            args._.push(a2);
                        }
                    }
                }
            }
            let env = {};
            if (vscodeArgs.env) {
                // merge environment variables into a copy of the process.env
                env = objects.mixin(process_1.env, vscodeArgs.env);
                // and delete some if necessary
                Object.keys(env).filter(k => env[k] === null).forEach(key => delete env[key]);
            }
            return this.windowsService.openExtensionDevelopmentHostWindow(args, env);
        }
        send(command, args, timeout) {
            return new Promise((completeDispatch, errorDispatch) => {
                if (!this.debugAdapter) {
                    errorDispatch(new Error('no debug adapter found'));
                    return;
                }
                this.debugAdapter.sendRequest(command, args, (response) => {
                    if (response.success) {
                        completeDispatch(response);
                    }
                    else {
                        errorDispatch(response);
                    }
                }, timeout);
            }).then(response => response, err => Promise.reject(this.handleErrorResponse(err)));
        }
        handleErrorResponse(errorResponse) {
            if (errorResponse.command === 'canceled' && errorResponse.message === 'canceled') {
                return errors.canceled();
            }
            const error = errorResponse && errorResponse.body ? errorResponse.body.error : null;
            const errorMessage = errorResponse ? errorResponse.message || '' : '';
            if (error && error.sendTelemetry) {
                const telemetryMessage = error ? debugUtils_1.formatPII(error.format, true, error.variables) : errorMessage;
                this.telemetryDebugProtocolErrorResponse(telemetryMessage);
            }
            const userMessage = error ? debugUtils_1.formatPII(error.format, false, error.variables) : errorMessage;
            if (error && error.url) {
                const label = error.urlLabel ? error.urlLabel : nls.localize('moreInfo', "More Info");
                return errorsWithActions_1.createErrorWithActions(userMessage, {
                    actions: [new actions_1.Action('debug.moreInfo', label, undefined, true, () => {
                            this.openerService.open(uri_1.URI.parse(error.url));
                            return Promise.resolve(null);
                        })]
                });
            }
            return new Error(userMessage);
        }
        mergeCapabilities(capabilities) {
            if (capabilities) {
                this._capabilities = objects.mixin(this._capabilities, capabilities);
            }
        }
        fireSimulatedContinuedEvent(threadId, allThreadsContinued = false) {
            this._onDidContinued.fire({
                type: 'event',
                event: 'continued',
                body: {
                    threadId,
                    allThreadsContinued
                },
                seq: undefined
            });
        }
        telemetryDebugProtocolErrorResponse(telemetryMessage) {
            /* __GDPR__
                "debugProtocolErrorResponse" : {
                    "error" : { "classification": "CallstackOrException", "purpose": "FeatureInsight" }
                }
            */
            this.telemetryService.publicLog('debugProtocolErrorResponse', { error: telemetryMessage });
            if (this.customTelemetryService) {
                /* __GDPR__TODO__
                    The message is sent in the name of the adapter but the adapter doesn't know about it.
                    However, since adapters are an open-ended set, we can not declared the events statically either.
                */
                this.customTelemetryService.publicLog('debugProtocolErrorResponse', { error: telemetryMessage });
            }
        }
    }
    exports.RawDebugSession = RawDebugSession;
});
//# sourceMappingURL=rawDebugSession.js.map