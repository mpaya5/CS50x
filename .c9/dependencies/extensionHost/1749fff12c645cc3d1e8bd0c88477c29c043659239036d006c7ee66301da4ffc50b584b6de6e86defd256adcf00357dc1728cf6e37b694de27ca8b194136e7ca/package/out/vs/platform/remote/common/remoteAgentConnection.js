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
define(["require", "exports", "vs/base/parts/ipc/common/ipc.net", "vs/base/common/uuid", "vs/base/common/lifecycle", "vs/base/common/buffer", "vs/base/common/event", "vs/platform/remote/common/remoteAuthorityResolver", "vs/base/common/errors", "vs/base/common/async"], function (require, exports, ipc_net_1, uuid_1, lifecycle_1, buffer_1, event_1, remoteAuthorityResolver_1, errors_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ConnectionType;
    (function (ConnectionType) {
        ConnectionType[ConnectionType["Management"] = 1] = "Management";
        ConnectionType[ConnectionType["ExtensionHost"] = 2] = "ExtensionHost";
        ConnectionType[ConnectionType["Tunnel"] = 3] = "Tunnel";
    })(ConnectionType = exports.ConnectionType || (exports.ConnectionType = {}));
    function connectionTypeToString(connectionType) {
        switch (connectionType) {
            case 1 /* Management */:
                return 'Management';
            case 2 /* ExtensionHost */:
                return 'ExtensionHost';
            case 3 /* Tunnel */:
                return 'Tunnel';
        }
    }
    function connectToRemoteExtensionHostAgent(options, connectionType, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const logPrefix = connectLogPrefix(options, connectionType);
            const { protocol, ownsProtocol } = yield new Promise((c, e) => {
                options.logService.trace(`${logPrefix} 1/6. invoking socketFactory.connect().`);
                options.socketFactory.connect(options.host, options.port, `reconnectionToken=${options.reconnectionToken}&reconnection=${options.reconnectionProtocol ? 'true' : 'false'}`, (err, socket) => {
                    if (err) {
                        options.logService.error(`${logPrefix} socketFactory.connect() failed. Error:`);
                        options.logService.error(err);
                        e(err);
                        return;
                    }
                    options.logService.trace(`${logPrefix} 2/6. socketFactory.connect() was successful.`);
                    if (options.reconnectionProtocol) {
                        options.reconnectionProtocol.beginAcceptReconnection(socket, null);
                        c({ protocol: options.reconnectionProtocol, ownsProtocol: false });
                    }
                    else {
                        c({ protocol: new ipc_net_1.PersistentProtocol(socket, null), ownsProtocol: true });
                    }
                });
            });
            return new Promise((c, e) => {
                const errorTimeoutToken = setTimeout(() => {
                    const error = new Error('handshake timeout');
                    error.code = 'ETIMEDOUT';
                    error.syscall = 'connect';
                    options.logService.error(`${logPrefix} the handshake took longer than 10 seconds. Error:`);
                    options.logService.error(error);
                    if (ownsProtocol) {
                        safeDisposeProtocolAndSocket(protocol);
                    }
                    e(error);
                }, 10000);
                const messageRegistration = protocol.onControlMessage((raw) => __awaiter(this, void 0, void 0, function* () {
                    const msg = JSON.parse(raw.toString());
                    // Stop listening for further events
                    messageRegistration.dispose();
                    const error = getErrorFromMessage(msg);
                    if (error) {
                        options.logService.error(`${logPrefix} received error control message when negotiating connection. Error:`);
                        options.logService.error(error);
                        if (ownsProtocol) {
                            safeDisposeProtocolAndSocket(protocol);
                        }
                        return e(error);
                    }
                    if (msg.type === 'sign') {
                        options.logService.trace(`${logPrefix} 4/6. received SignRequest control message.`);
                        const signed = yield options.signService.sign(msg.data);
                        const connTypeRequest = {
                            type: 'connectionType',
                            commit: options.commit,
                            signedData: signed,
                            desiredConnectionType: connectionType
                        };
                        if (args) {
                            connTypeRequest.args = args;
                        }
                        options.logService.trace(`${logPrefix} 5/6. sending ConnectionTypeRequest control message.`);
                        protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(connTypeRequest)));
                        clearTimeout(errorTimeoutToken);
                        c({ protocol, ownsProtocol });
                    }
                    else {
                        const error = new Error('handshake error');
                        options.logService.error(`${logPrefix} received unexpected control message. Error:`);
                        options.logService.error(error);
                        if (ownsProtocol) {
                            safeDisposeProtocolAndSocket(protocol);
                        }
                        e(error);
                    }
                }));
                options.logService.trace(`${logPrefix} 3/6. sending AuthRequest control message.`);
                // TODO@vs-remote: use real nonce here
                const authRequest = {
                    type: 'auth',
                    auth: '00000000000000000000'
                };
                protocol.sendControl(buffer_1.VSBuffer.fromString(JSON.stringify(authRequest)));
            });
        });
    }
    function connectToRemoteExtensionHostAgentAndReadOneMessage(options, connectionType, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const logPrefix = connectLogPrefix(options, connectionType);
            const { protocol, ownsProtocol } = yield connectToRemoteExtensionHostAgent(options, connectionType, args);
            return new Promise((c, e) => {
                const registration = protocol.onControlMessage(raw => {
                    registration.dispose();
                    const msg = JSON.parse(raw.toString());
                    const error = getErrorFromMessage(msg);
                    if (error) {
                        options.logService.error(`${logPrefix} received error control message when negotiating connection. Error:`);
                        options.logService.error(error);
                        if (ownsProtocol) {
                            safeDisposeProtocolAndSocket(protocol);
                        }
                        return e(error);
                    }
                    if (options.reconnectionProtocol) {
                        options.reconnectionProtocol.endAcceptReconnection();
                    }
                    options.logService.trace(`${logPrefix} 6/6. handshake finished, connection is up and running after ${logElapsed(startTime)}!`);
                    c({ protocol, firstMessage: msg });
                });
            });
        });
    }
    function doConnectRemoteAgentManagement(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { protocol } = yield connectToRemoteExtensionHostAgentAndReadOneMessage(options, 1 /* Management */, undefined);
            return { protocol };
        });
    }
    function doConnectRemoteAgentExtensionHost(options, startArguments) {
        return __awaiter(this, void 0, void 0, function* () {
            const { protocol, firstMessage } = yield connectToRemoteExtensionHostAgentAndReadOneMessage(options, 2 /* ExtensionHost */, startArguments);
            const debugPort = firstMessage && firstMessage.debugPort;
            return { protocol, debugPort };
        });
    }
    function doConnectRemoteAgentTunnel(options, startParams) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const logPrefix = connectLogPrefix(options, 3 /* Tunnel */);
            const { protocol } = yield connectToRemoteExtensionHostAgent(options, 3 /* Tunnel */, startParams);
            options.logService.trace(`${logPrefix} 6/6. handshake finished, connection is up and running after ${logElapsed(startTime)}!`);
            return protocol;
        });
    }
    function resolveConnectionOptions(options, reconnectionToken, reconnectionProtocol) {
        return __awaiter(this, void 0, void 0, function* () {
            const { host, port } = yield options.addressProvider.getAddress();
            return {
                commit: options.commit,
                host: host,
                port: port,
                reconnectionToken: reconnectionToken,
                reconnectionProtocol: reconnectionProtocol,
                socketFactory: options.socketFactory,
                signService: options.signService,
                logService: options.logService
            };
        });
    }
    function connectRemoteAgentManagement(options, remoteAuthority, clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const reconnectionToken = uuid_1.generateUuid();
                const simpleOptions = yield resolveConnectionOptions(options, reconnectionToken, null);
                const { protocol } = yield connectWithTimeLimit(simpleOptions.logService, doConnectRemoteAgentManagement(simpleOptions), 30 * 1000 /*30s*/);
                return new ManagementPersistentConnection(options, remoteAuthority, clientId, reconnectionToken, protocol);
            }
            catch (err) {
                options.logService.error(`[remote-connection] An error occurred in the very first connect attempt, it will be treated as a permanent error! Error:`);
                options.logService.error(err);
                PersistentConnection.triggerPermanentFailure();
                throw err;
            }
        });
    }
    exports.connectRemoteAgentManagement = connectRemoteAgentManagement;
    function connectRemoteAgentExtensionHost(options, startArguments) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const reconnectionToken = uuid_1.generateUuid();
                const simpleOptions = yield resolveConnectionOptions(options, reconnectionToken, null);
                const { protocol, debugPort } = yield connectWithTimeLimit(simpleOptions.logService, doConnectRemoteAgentExtensionHost(simpleOptions, startArguments), 30 * 1000 /*30s*/);
                return new ExtensionHostPersistentConnection(options, startArguments, reconnectionToken, protocol, debugPort);
            }
            catch (err) {
                options.logService.error(`[remote-connection] An error occurred in the very first connect attempt, it will be treated as a permanent error! Error:`);
                options.logService.error(err);
                PersistentConnection.triggerPermanentFailure();
                throw err;
            }
        });
    }
    exports.connectRemoteAgentExtensionHost = connectRemoteAgentExtensionHost;
    function connectRemoteAgentTunnel(options, tunnelRemotePort) {
        return __awaiter(this, void 0, void 0, function* () {
            const simpleOptions = yield resolveConnectionOptions(options, uuid_1.generateUuid(), null);
            const protocol = yield connectWithTimeLimit(simpleOptions.logService, doConnectRemoteAgentTunnel(simpleOptions, { port: tunnelRemotePort }), 30 * 1000 /*30s*/);
            return protocol;
        });
    }
    exports.connectRemoteAgentTunnel = connectRemoteAgentTunnel;
    function sleep(seconds) {
        return async_1.createCancelablePromise(token => {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(resolve, seconds * 1000);
                token.onCancellationRequested(() => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        });
    }
    var PersistentConnectionEventType;
    (function (PersistentConnectionEventType) {
        PersistentConnectionEventType[PersistentConnectionEventType["ConnectionLost"] = 0] = "ConnectionLost";
        PersistentConnectionEventType[PersistentConnectionEventType["ReconnectionWait"] = 1] = "ReconnectionWait";
        PersistentConnectionEventType[PersistentConnectionEventType["ReconnectionRunning"] = 2] = "ReconnectionRunning";
        PersistentConnectionEventType[PersistentConnectionEventType["ReconnectionPermanentFailure"] = 3] = "ReconnectionPermanentFailure";
        PersistentConnectionEventType[PersistentConnectionEventType["ConnectionGain"] = 4] = "ConnectionGain";
    })(PersistentConnectionEventType = exports.PersistentConnectionEventType || (exports.PersistentConnectionEventType = {}));
    class ConnectionLostEvent {
        constructor() {
            this.type = 0 /* ConnectionLost */;
        }
    }
    exports.ConnectionLostEvent = ConnectionLostEvent;
    class ReconnectionWaitEvent {
        constructor(durationSeconds, cancellableTimer) {
            this.durationSeconds = durationSeconds;
            this.cancellableTimer = cancellableTimer;
            this.type = 1 /* ReconnectionWait */;
        }
        skipWait() {
            this.cancellableTimer.cancel();
        }
    }
    exports.ReconnectionWaitEvent = ReconnectionWaitEvent;
    class ReconnectionRunningEvent {
        constructor() {
            this.type = 2 /* ReconnectionRunning */;
        }
    }
    exports.ReconnectionRunningEvent = ReconnectionRunningEvent;
    class ConnectionGainEvent {
        constructor() {
            this.type = 4 /* ConnectionGain */;
        }
    }
    exports.ConnectionGainEvent = ConnectionGainEvent;
    class ReconnectionPermanentFailureEvent {
        constructor() {
            this.type = 3 /* ReconnectionPermanentFailure */;
        }
    }
    exports.ReconnectionPermanentFailureEvent = ReconnectionPermanentFailureEvent;
    class PersistentConnection extends lifecycle_1.Disposable {
        constructor(_connectionType, options, reconnectionToken, protocol) {
            super();
            this._connectionType = _connectionType;
            this._onDidStateChange = this._register(new event_1.Emitter());
            this.onDidStateChange = this._onDidStateChange.event;
            this._options = options;
            this.reconnectionToken = reconnectionToken;
            this.protocol = protocol;
            this._isReconnecting = false;
            this._onDidStateChange.fire(new ConnectionGainEvent());
            this._register(protocol.onSocketClose(() => this._beginReconnecting()));
            this._register(protocol.onSocketTimeout(() => this._beginReconnecting()));
            PersistentConnection._instances.push(this);
            if (PersistentConnection._permanentFailure) {
                this._gotoPermanentFailure();
            }
        }
        static triggerPermanentFailure() {
            this._permanentFailure = true;
            this._instances.forEach(instance => instance._gotoPermanentFailure());
        }
        _beginReconnecting() {
            return __awaiter(this, void 0, void 0, function* () {
                // Only have one reconnection loop active at a time.
                if (this._isReconnecting) {
                    return;
                }
                try {
                    this._isReconnecting = true;
                    yield this._runReconnectingLoop();
                }
                finally {
                    this._isReconnecting = false;
                }
            });
        }
        _runReconnectingLoop() {
            return __awaiter(this, void 0, void 0, function* () {
                if (PersistentConnection._permanentFailure) {
                    // no more attempts!
                    return;
                }
                const logPrefix = commonLogPrefix(this._connectionType, this.reconnectionToken, true);
                this._options.logService.info(`${logPrefix} starting reconnecting loop. You can get more information with the trace log level.`);
                this._onDidStateChange.fire(new ConnectionLostEvent());
                const TIMES = [5, 5, 10, 10, 10, 10, 10, 30];
                const disconnectStartTime = Date.now();
                let attempt = -1;
                do {
                    attempt++;
                    const waitTime = (attempt < TIMES.length ? TIMES[attempt] : TIMES[TIMES.length - 1]);
                    try {
                        const sleepPromise = sleep(waitTime);
                        this._onDidStateChange.fire(new ReconnectionWaitEvent(waitTime, sleepPromise));
                        this._options.logService.info(`${logPrefix} waiting for ${waitTime} seconds before reconnecting...`);
                        try {
                            yield sleepPromise;
                        }
                        catch (_a) { } // User canceled timer
                        if (PersistentConnection._permanentFailure) {
                            this._options.logService.error(`${logPrefix} permanent failure occurred while running the reconnecting loop.`);
                            break;
                        }
                        // connection was lost, let's try to re-establish it
                        this._onDidStateChange.fire(new ReconnectionRunningEvent());
                        this._options.logService.info(`${logPrefix} resolving connection...`);
                        const simpleOptions = yield resolveConnectionOptions(this._options, this.reconnectionToken, this.protocol);
                        this._options.logService.info(`${logPrefix} connecting to ${simpleOptions.host}:${simpleOptions.port}...`);
                        yield connectWithTimeLimit(simpleOptions.logService, this._reconnect(simpleOptions), 30 * 1000 /*30s*/);
                        this._options.logService.info(`${logPrefix} reconnected!`);
                        this._onDidStateChange.fire(new ConnectionGainEvent());
                        break;
                    }
                    catch (err) {
                        if (err.code === 'VSCODE_CONNECTION_ERROR') {
                            this._options.logService.error(`${logPrefix} A permanent error occurred in the reconnecting loop! Will give up now! Error:`);
                            this._options.logService.error(err);
                            PersistentConnection.triggerPermanentFailure();
                            break;
                        }
                        if (Date.now() - disconnectStartTime > 10800000 /* ReconnectionGraceTime */) {
                            this._options.logService.error(`${logPrefix} An error occurred while reconnecting, but it will be treated as a permanent error because the reconnection grace time has expired! Will give up now! Error:`);
                            this._options.logService.error(err);
                            PersistentConnection.triggerPermanentFailure();
                            break;
                        }
                        if (remoteAuthorityResolver_1.RemoteAuthorityResolverError.isTemporarilyNotAvailable(err)) {
                            this._options.logService.info(`${logPrefix} A temporarily not available error occured while trying to reconnect, will try again...`);
                            this._options.logService.trace(err);
                            // try again!
                            continue;
                        }
                        if ((err.code === 'ETIMEDOUT' || err.code === 'ENETUNREACH' || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') && err.syscall === 'connect') {
                            this._options.logService.info(`${logPrefix} A network error occured while trying to reconnect, will try again...`);
                            this._options.logService.trace(err);
                            // try again!
                            continue;
                        }
                        if (errors_1.isPromiseCanceledError(err)) {
                            this._options.logService.info(`${logPrefix} A promise cancelation error occured while trying to reconnect, will try again...`);
                            this._options.logService.trace(err);
                            // try again!
                            continue;
                        }
                        this._options.logService.error(`${logPrefix} An unknown error occured while trying to reconnect, since this is an unknown case, it will be treated as a permanent error! Will give up now! Error:`);
                        this._options.logService.error(err);
                        PersistentConnection.triggerPermanentFailure();
                        break;
                    }
                } while (!PersistentConnection._permanentFailure);
            });
        }
        _gotoPermanentFailure() {
            this._onDidStateChange.fire(new ReconnectionPermanentFailureEvent());
            safeDisposeProtocolAndSocket(this.protocol);
        }
    }
    PersistentConnection._permanentFailure = false;
    PersistentConnection._instances = [];
    class ManagementPersistentConnection extends PersistentConnection {
        constructor(options, remoteAuthority, clientId, reconnectionToken, protocol) {
            super(1 /* Management */, options, reconnectionToken, protocol);
            this.client = this._register(new ipc_net_1.Client(protocol, {
                remoteAuthority: remoteAuthority,
                clientId: clientId
            }));
        }
        _reconnect(options) {
            return __awaiter(this, void 0, void 0, function* () {
                yield doConnectRemoteAgentManagement(options);
            });
        }
    }
    exports.ManagementPersistentConnection = ManagementPersistentConnection;
    class ExtensionHostPersistentConnection extends PersistentConnection {
        constructor(options, startArguments, reconnectionToken, protocol, debugPort) {
            super(2 /* ExtensionHost */, options, reconnectionToken, protocol);
            this._startArguments = startArguments;
            this.debugPort = debugPort;
        }
        _reconnect(options) {
            return __awaiter(this, void 0, void 0, function* () {
                yield doConnectRemoteAgentExtensionHost(options, this._startArguments);
            });
        }
    }
    exports.ExtensionHostPersistentConnection = ExtensionHostPersistentConnection;
    function connectWithTimeLimit(logService, p, timeLimit) {
        return new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                const err = new Error('Time limit reached');
                err.code = 'ETIMEDOUT';
                err.syscall = 'connect';
                logService.error(`[remote-connection] The time limit has been reached for a connection. Error:`);
                logService.error(err);
                reject(err);
            }, timeLimit);
            p.then((value) => {
                clearTimeout(timeout);
                resolve(value);
            }, (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }
    function safeDisposeProtocolAndSocket(protocol) {
        try {
            protocol.acceptDisconnect();
            const socket = protocol.getSocket();
            protocol.dispose();
            socket.dispose();
        }
        catch (err) {
            errors_1.onUnexpectedError(err);
        }
    }
    function getErrorFromMessage(msg) {
        if (msg && msg.type === 'error') {
            const error = new Error(`Connection error: ${msg.reason}`);
            error.code = 'VSCODE_CONNECTION_ERROR';
            return error;
        }
        return null;
    }
    function stringRightPad(str, len) {
        while (str.length < len) {
            str += ' ';
        }
        return str;
    }
    function commonLogPrefix(connectionType, reconnectionToken, isReconnect) {
        return `[remote-connection][${stringRightPad(connectionTypeToString(connectionType), 13)}][${reconnectionToken.substr(0, 5)}…][${isReconnect ? 'reconnect' : 'initial'}]`;
    }
    function connectLogPrefix(options, connectionType) {
        return `${commonLogPrefix(connectionType, options.reconnectionToken, !!options.reconnectionProtocol)}[${options.host}:${options.port}]`;
    }
    function logElapsed(startTime) {
        return `${Date.now() - startTime} ms`;
    }
});
//# sourceMappingURL=remoteAgentConnection.js.map