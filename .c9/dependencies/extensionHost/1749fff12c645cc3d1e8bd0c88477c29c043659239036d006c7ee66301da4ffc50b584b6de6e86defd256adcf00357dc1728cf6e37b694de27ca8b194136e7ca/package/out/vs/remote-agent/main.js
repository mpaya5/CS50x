var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "path", "fs", "os", "net", "child_process", "vs/base/parts/ipc/node/ipc.net", "vs/base/parts/ipc/common/ipc.net", "vs/base/common/event", "vs/base/common/buffer", "vs/platform/extensions/common/extensions", "vs/base/common/uri", "vs/base/common/amd", "vs/base/common/lifecycle", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/base/common/types", "vs/base/common/objects"], function (require, exports, path, fs, os_1, net_1, child_process_1, ipc_net_1, ipc_net_2, event_1, buffer_1, extensions_1, uri_1, amd_1, lifecycle_1, extensionHostProtocol_1, types, objects) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const CONNECT_TIMEOUT = 1000 * 30;
    const RECONNECT_POLL_DELAY = 50;
    function retrySeveralTimes(action, delay, retriesLeft) {
        if (retriesLeft < 2) {
            return action();
        }
        return action().catch((_) => __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve) => setTimeout(resolve, delay));
            return retrySeveralTimes(action, delay, retriesLeft - 1);
        }));
    }
    function isRunning(pid) {
        try {
            process.kill(pid, 0);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    class RemoteHost {
        constructor(extensionPaths, logsFolder, envParams) {
            this.extensionPaths = extensionPaths;
            this.logsFolder = logsFolder;
            this.envParams = envParams;
            this._terminating = false;
            this._disposables = new lifecycle_1.DisposableStore();
            this._onUnexpectedExit = new event_1.Emitter();
            this.onUnexpectedExit = this._onUnexpectedExit.event;
            this._onUnexpectedError = new event_1.Emitter();
            this.onUnexpectedError = this._onUnexpectedError.event;
            this._disposables.add(this._onUnexpectedError);
            this._disposables.add(this._onUnexpectedExit);
        }
        // The code here is similar to (and partially copy-pasted from) ExtensionHostProcessWorker
        // located in vs/workbench/services/extensions/electron-browser/extensionHost.ts
        connect(id) {
            return __awaiter(this, void 0, void 0, function* () {
                const socketName = this.generateSocketName(id);
                this._disposables.add(lifecycle_1.toDisposable(() => this.deleteSocket(socketName)));
                if (fs.existsSync(socketName)) {
                    console.log("await existing connection");
                    this._extensionHostProtocol = yield this.connectToSocket(socketName);
                }
                else {
                    console.log("start new connection");
                    this._extensionHostProtocol = yield this.startHost(socketName);
                }
                this._disposables.add(this._extensionHostProtocol);
                return this._extensionHostProtocol;
            });
        }
        startHost(socketName) {
            return __awaiter(this, void 0, void 0, function* () {
                const opts = {
                    env: objects.mixin(objects.deepClone(this.envParams), {
                        AMD_ENTRYPOINT: "vs/workbench/services/extensions/node/extensionHostProcess",
                        PIPE_LOGGING: "true",
                        VERBOSE_LOGGING: true,
                        VSCODE_EXTHOST_KILL_TIMEOUT: 1000 * 60 * 60 * 24 * 3,
                        VSCODE_IPC_HOOK_EXTHOST: socketName,
                        VSCODE_HANDLES_UNCAUGHT_ERRORS: true,
                        VSCODE_LOG_STACK: false,
                        VSCODE_LOG_LEVEL: "log",
                        // VFS worker (and this file) is started by an ssh connection from a non-interactive shell.
                        // Because of that environment variables intended for interactive shells aren't exported.
                        // Ensure that LANG exists, as it's required for sam cli.
                        LANG: this.envParams.LANG || "en_US.utf-8",
                    }),
                    detached: true,
                    // TODO: provide log file for stdout and stderr (second and third args)
                    stdio: ["inherit", "inherit", "inherit", "ipc"],
                };
                const bootFile = amd_1.getPathFromAmdModule(require, "bootstrap-fork");
                // @ts-ignore
                this._extensionHostProcess = child_process_1.fork(bootFile, ["--type=extensionHost"], opts);
                // When the extension host is started we're connected to it through an ipc channel, even though the host is a detached process.
                // After the host initializes, it will use the UNIX socket to communicate over instead of the ipc channel.
                // When we reconnect to the extension host, the UNIX socket is still used to communicate over, so it's OK that we don't have the ipc channel any longer.
                this._extensionHostProcess.on("message", (msg) => {
                    if (msg.type === "__$console") {
                        let args;
                        try {
                            args = JSON.parse(msg.arguments);
                        }
                        catch (e) {
                            args = [msg.arguments];
                        }
                        console.log(`Extension Host [${msg.severity}]:`, ...args);
                        return;
                    }
                    console.group("Extension Host Message");
                    console.log(msg);
                    console.groupEnd();
                });
                this._extensionHostProcess.unref();
                this._extensionHostProcess.on("exit", this._onExtHostProcessExit.bind(this));
                this._extensionHostProcess.on("error", this._onExtHostProcessError.bind(this));
                return retrySeveralTimes(() => this.connectToSocket(socketName), RECONNECT_POLL_DELAY, CONNECT_TIMEOUT / RECONNECT_POLL_DELAY);
            });
        }
        generateSocketName(id) {
            return path.join(os_1.tmpdir(), `extension-host-ipc-${id}.sock`);
        }
        deleteSocket(socketName) {
            if (fs.existsSync(socketName))
                fs.unlinkSync(socketName);
        }
        connectToSocket(socketName) {
            return new Promise((resolve, reject) => {
                const socket = net_1.createConnection(socketName, () => {
                    socket.removeListener('error', reject);
                    socket.on("error", this._onExtHostProcessError.bind(this));
                    resolve(new ipc_net_1.NodeSocket(socket));
                });
                socket.on("error", reject);
            });
        }
        _getHostProcessPid() {
            return __awaiter(this, void 0, void 0, function* () {
                return this._extensionHostProcess ? this._extensionHostProcess.pid : null;
            });
        }
        cleanup(sessions) {
            return __awaiter(this, void 0, void 0, function* () {
                return sessions.map((session) => {
                    try {
                        if (session.pid && isRunning(session.pid))
                            process.kill(session.pid, "SIGINT");
                        if (session.sid)
                            this.deleteSocket(this.generateSocketName(session.sid));
                        return { sid: session.sid };
                    }
                    catch (error) {
                        return { sid: session.sid, error };
                    }
                });
            });
        }
        getEnvironment() {
            return __awaiter(this, void 0, void 0, function* () {
                return {
                    pid: process.pid,
                    extensions: yield this.getExtensionPackages(),
                    os: 3 /* Linux */,
                    // TODO: figure out what exactly do we need here
                    // @ts-ignore
                    appRoot: undefined,
                    // @ts-ignore
                    appSettingsHome: undefined,
                    // @ts-ignore
                    settingsPath: undefined,
                    // @ts-ignore
                    // TODO change this to real path to global storage
                    logsPath: uri_1.URI.file(this.logsFolder),
                    // @ts-ignore
                    // TODO change this to real path to global storage
                    extensionHostLogsPath: uri_1.URI.file(this.logsFolder),
                    // @ts-ignore
                    userHome: undefined,
                };
            });
        }
        getExtensionPackages() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const packages = [];
                    for (const path of this.extensionPaths) {
                        const extensionPackage = this.getPackage(path);
                        const localizedMessages = this.getNlsMessageBundle(path);
                        if (extensionPackage) {
                            if (localizedMessages) {
                                this.replaceNLSPlaceholders(extensionPackage, localizedMessages);
                            }
                            packages.push(this.createExtensionDescription(path, extensionPackage));
                        }
                    }
                    return packages;
                }
                catch (e) {
                    if (e.code === "ENOENT") {
                        console.error("Could not find extensions directory.");
                        return [];
                    }
                    throw e;
                }
            });
        }
        replaceNLSPlaceholders(literal, messages) {
            processObject(literal);
            function processObject(literal) {
                for (let key in literal) {
                    if (literal.hasOwnProperty(key)) {
                        processEntry(literal, key);
                    }
                }
            }
            function processEntry(obj, key) {
                let value = obj[key];
                if (types.isString(value)) {
                    let length = value.length;
                    if (length > 1 && value[0] === "%" && value[length - 1] === "%") {
                        let messageKey = value.substr(1, length - 2);
                        let message = messages[messageKey];
                        if (message) {
                            obj[key] = message;
                        }
                        else {
                            console.warn("Couldn't find message for key {0}.", messageKey);
                        }
                    }
                }
                else if (types.isObject(value)) {
                    processObject(value);
                }
                else if (types.isArray(value)) {
                    for (let i = 0; i < value.length; i++) {
                        processEntry(value, i);
                    }
                }
            }
        }
        getPackage(extensionFolder) {
            try {
                return JSON.parse(fs.readFileSync(path.join(extensionFolder, "package.json"), { encoding: "utf8" }));
            }
            catch (e) {
                return null;
            }
        }
        getNlsMessageBundle(extensionPath) {
            try {
                const packagePath = this.getPackageMetadataPath(extensionPath);
                return JSON.parse(fs.readFileSync(packagePath, { encoding: "utf8" }));
            }
            catch (e) {
                return null;
            }
        }
        getPackageMetadataPath(extensionPath) {
            return path.join(extensionPath, "package.nls.json");
        }
        createExtensionDescription(extensionPath, packageData) {
            return Object.assign({}, packageData, { identifier: new extensions_1.ExtensionIdentifier(`${packageData.publisher}.${packageData.name}`), isBuiltin: false, isUnderDevelopment: false, extensionLocation: uri_1.URI.file(extensionPath) });
        }
        _onExtHostProcessExit(code, signal) {
            if (!this._terminating) {
                this._onUnexpectedExit.fire([code, signal]);
            }
            this._extensionHostProcess = null;
            this._clearResources();
        }
        _onExtHostProcessError(error) {
            this._onUnexpectedError.fire(error);
        }
        dispose() {
            if (this._terminating) {
                return;
            }
            this._terminating = true;
            this._sendTerminateSignal();
            // In case we won't receive "exit" event from the host:
            this._clearResourcesTimeoutId = setTimeout(() => this._clearResources(), 10 * 1000);
            this._disposables.add(lifecycle_1.toDisposable(() => clearTimeout(this._clearResourcesTimeoutId)));
        }
        _sendTerminateSignal() {
            if (this._extensionHostProtocol) {
                const persistentProtocol = new ipc_net_2.PersistentProtocol(this._extensionHostProtocol);
                persistentProtocol.send(extensionHostProtocol_1.createMessageOfType(2 /* Terminate */));
            }
        }
        _clearResources() {
            this._disposables.dispose();
            if (this._extensionHostProcess) {
                this._extensionHostProcess.kill();
                this._extensionHostProcess = null;
            }
        }
    }
    exports.RemoteHost = RemoteHost;
    // Export VSBuffer for use in vfs extension that consumes this module
    // (c9.extensions.remotehost/remote-host)
    exports.Buffer = buffer_1.VSBuffer;
});
//# sourceMappingURL=main.js.map