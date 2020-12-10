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
define(["require", "exports", "vs/base/node/pfs", "child_process", "vs/nls", "net", "vs/base/common/path", "vs/base/common/strings", "vs/base/common/objects", "vs/base/common/platform", "vs/platform/extensionManagement/common/extensionManagement", "../common/abstractDebugAdapter"], function (require, exports, pfs_1, cp, nls, net, path, strings, objects, platform, extensionManagement_1, abstractDebugAdapter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * An implementation that communicates via two streams with the debug adapter.
     */
    class StreamDebugAdapter extends abstractDebugAdapter_1.AbstractDebugAdapter {
        constructor() {
            super();
            this.rawData = Buffer.allocUnsafe(0);
            this.contentLength = -1;
        }
        connect(readable, writable) {
            this.outputStream = writable;
            this.rawData = Buffer.allocUnsafe(0);
            this.contentLength = -1;
            readable.on('data', (data) => this.handleData(data));
        }
        sendMessage(message) {
            if (this.outputStream) {
                const json = JSON.stringify(message);
                this.outputStream.write(`Content-Length: ${Buffer.byteLength(json, 'utf8')}${StreamDebugAdapter.TWO_CRLF}${json}`, 'utf8');
            }
        }
        handleData(data) {
            this.rawData = Buffer.concat([this.rawData, data]);
            while (true) {
                if (this.contentLength >= 0) {
                    if (this.rawData.length >= this.contentLength) {
                        const message = this.rawData.toString('utf8', 0, this.contentLength);
                        this.rawData = this.rawData.slice(this.contentLength);
                        this.contentLength = -1;
                        if (message.length > 0) {
                            try {
                                this.acceptMessage(JSON.parse(message));
                            }
                            catch (e) {
                                this._onError.fire(new Error((e.message || e) + '\n' + message));
                            }
                        }
                        continue; // there may be more complete messages to process
                    }
                }
                else {
                    const idx = this.rawData.indexOf(StreamDebugAdapter.TWO_CRLF);
                    if (idx !== -1) {
                        const header = this.rawData.toString('utf8', 0, idx);
                        const lines = header.split(StreamDebugAdapter.HEADER_LINESEPARATOR);
                        for (const h of lines) {
                            const kvPair = h.split(StreamDebugAdapter.HEADER_FIELDSEPARATOR);
                            if (kvPair[0] === 'Content-Length') {
                                this.contentLength = Number(kvPair[1]);
                            }
                        }
                        this.rawData = this.rawData.slice(idx + StreamDebugAdapter.TWO_CRLF.length);
                        continue;
                    }
                }
                break;
            }
        }
    }
    StreamDebugAdapter.TWO_CRLF = '\r\n\r\n';
    StreamDebugAdapter.HEADER_LINESEPARATOR = /\r?\n/; // allow for non-RFC 2822 conforming line separators
    StreamDebugAdapter.HEADER_FIELDSEPARATOR = /: */;
    exports.StreamDebugAdapter = StreamDebugAdapter;
    /**
     * An implementation that connects to a debug adapter via a socket.
    */
    class SocketDebugAdapter extends StreamDebugAdapter {
        constructor(adapterServer) {
            super();
            this.adapterServer = adapterServer;
        }
        startSession() {
            return new Promise((resolve, reject) => {
                let connected = false;
                this.socket = net.createConnection(this.adapterServer.port, this.adapterServer.host || '127.0.0.1', () => {
                    this.connect(this.socket, this.socket);
                    resolve();
                    connected = true;
                });
                this.socket.on('close', () => {
                    if (connected) {
                        this._onError.fire(new Error('connection closed'));
                    }
                    else {
                        reject(new Error('connection closed'));
                    }
                });
                this.socket.on('error', error => {
                    if (connected) {
                        this._onError.fire(error);
                    }
                    else {
                        reject(error);
                    }
                });
            });
        }
        stopSession() {
            // Cancel all sent promises on disconnect so debug trees are not left in a broken state #3666.
            this.cancelPending();
            if (this.socket) {
                this.socket.end();
                this.socket = undefined;
            }
            return Promise.resolve(undefined);
        }
    }
    exports.SocketDebugAdapter = SocketDebugAdapter;
    /**
     * An implementation that launches the debug adapter as a separate process and communicates via stdin/stdout.
    */
    class ExecutableDebugAdapter extends StreamDebugAdapter {
        constructor(adapterExecutable, debugType, outputService) {
            super();
            this.adapterExecutable = adapterExecutable;
            this.debugType = debugType;
            this.outputService = outputService;
        }
        startSession() {
            return __awaiter(this, void 0, void 0, function* () {
                const command = this.adapterExecutable.command;
                const args = this.adapterExecutable.args;
                const options = this.adapterExecutable.options || {};
                try {
                    // verify executables asynchronously
                    if (command) {
                        if (path.isAbsolute(command)) {
                            const commandExists = yield pfs_1.exists(command);
                            if (!commandExists) {
                                throw new Error(nls.localize('debugAdapterBinNotFound', "Debug adapter executable '{0}' does not exist.", command));
                            }
                        }
                        else {
                            // relative path
                            if (command.indexOf('/') < 0 && command.indexOf('\\') < 0) {
                                // no separators: command looks like a runtime name like 'node' or 'mono'
                                // TODO: check that the runtime is available on PATH
                            }
                        }
                    }
                    else {
                        throw new Error(nls.localize({ key: 'debugAdapterCannotDetermineExecutable', comment: ['Adapter executable file not found'] }, "Cannot determine executable for debug adapter '{0}'.", this.debugType));
                    }
                    let env = objects.mixin({}, process.env);
                    if (options.env) {
                        env = objects.mixin(env, options.env);
                    }
                    delete env.VSCODE_PREVENT_FOREIGN_INSPECT;
                    if (command === 'node') {
                        if (Array.isArray(args) && args.length > 0) {
                            const isElectron = !!process.env['ELECTRON_RUN_AS_NODE'] || !!process.versions['electron'];
                            const forkOptions = {
                                env: env,
                                execArgv: isElectron ? ['-e', 'delete process.env.ELECTRON_RUN_AS_NODE;require(process.argv[1])'] : [],
                                silent: true
                            };
                            if (options.cwd) {
                                forkOptions.cwd = options.cwd;
                            }
                            const child = cp.fork(args[0], args.slice(1), forkOptions);
                            if (!child.pid) {
                                throw new Error(nls.localize('unableToLaunchDebugAdapter', "Unable to launch debug adapter from '{0}'.", args[0]));
                            }
                            this.serverProcess = child;
                        }
                        else {
                            throw new Error(nls.localize('unableToLaunchDebugAdapterNoArgs', "Unable to launch debug adapter."));
                        }
                    }
                    else {
                        const spawnOptions = {
                            env: env
                        };
                        if (options.cwd) {
                            spawnOptions.cwd = options.cwd;
                        }
                        this.serverProcess = cp.spawn(command, args, spawnOptions);
                    }
                    this.serverProcess.on('error', err => {
                        this._onError.fire(err);
                    });
                    this.serverProcess.on('exit', (code, signal) => {
                        this._onExit.fire(code);
                    });
                    this.serverProcess.stdout.on('close', () => {
                        this._onError.fire(new Error('read error'));
                    });
                    this.serverProcess.stdout.on('error', error => {
                        this._onError.fire(error);
                    });
                    this.serverProcess.stdin.on('error', error => {
                        this._onError.fire(error);
                    });
                    const outputService = this.outputService;
                    if (outputService) {
                        const sanitize = (s) => s.toString().replace(/\r?\n$/mg, '');
                        // this.serverProcess.stdout.on('data', (data: string) => {
                        // 	console.log('%c' + sanitize(data), 'background: #ddd; font-style: italic;');
                        // });
                        this.serverProcess.stderr.on('data', (data) => {
                            const channel = outputService.getChannel(extensionManagement_1.ExtensionsChannelId);
                            if (channel) {
                                channel.append(sanitize(data));
                            }
                        });
                    }
                    // finally connect to the DA
                    this.connect(this.serverProcess.stdout, this.serverProcess.stdin);
                }
                catch (err) {
                    this._onError.fire(err);
                }
            });
        }
        stopSession() {
            // Cancel all sent promises on disconnect so debug trees are not left in a broken state #3666.
            this.cancelPending();
            if (!this.serverProcess) {
                return Promise.resolve(undefined);
            }
            // when killing a process in windows its child
            // processes are *not* killed but become root
            // processes. Therefore we use TASKKILL.EXE
            if (platform.isWindows) {
                return new Promise((c, e) => {
                    const killer = cp.exec(`taskkill /F /T /PID ${this.serverProcess.pid}`, function (err, stdout, stderr) {
                        if (err) {
                            return e(err);
                        }
                    });
                    killer.on('exit', c);
                    killer.on('error', e);
                });
            }
            else {
                this.serverProcess.kill('SIGTERM');
                return Promise.resolve(undefined);
            }
        }
        static extract(platformContribution, extensionFolderPath) {
            if (!platformContribution) {
                return undefined;
            }
            const result = Object.create(null);
            if (platformContribution.runtime) {
                if (platformContribution.runtime.indexOf('./') === 0) { // TODO
                    result.runtime = path.join(extensionFolderPath, platformContribution.runtime);
                }
                else {
                    result.runtime = platformContribution.runtime;
                }
            }
            if (platformContribution.runtimeArgs) {
                result.runtimeArgs = platformContribution.runtimeArgs;
            }
            if (platformContribution.program) {
                if (!path.isAbsolute(platformContribution.program)) {
                    result.program = path.join(extensionFolderPath, platformContribution.program);
                }
                else {
                    result.program = platformContribution.program;
                }
            }
            if (platformContribution.args) {
                result.args = platformContribution.args;
            }
            const contribution = platformContribution;
            if (contribution.win) {
                result.win = ExecutableDebugAdapter.extract(contribution.win, extensionFolderPath);
            }
            if (contribution.winx86) {
                result.winx86 = ExecutableDebugAdapter.extract(contribution.winx86, extensionFolderPath);
            }
            if (contribution.windows) {
                result.windows = ExecutableDebugAdapter.extract(contribution.windows, extensionFolderPath);
            }
            if (contribution.osx) {
                result.osx = ExecutableDebugAdapter.extract(contribution.osx, extensionFolderPath);
            }
            if (contribution.linux) {
                result.linux = ExecutableDebugAdapter.extract(contribution.linux, extensionFolderPath);
            }
            return result;
        }
        static platformAdapterExecutable(extensionDescriptions, debugType) {
            let result = Object.create(null);
            debugType = debugType.toLowerCase();
            // merge all contributions into one
            for (const ed of extensionDescriptions) {
                if (ed.contributes) {
                    const debuggers = ed.contributes['debuggers'];
                    if (debuggers && debuggers.length > 0) {
                        debuggers.filter(dbg => typeof dbg.type === 'string' && strings.equalsIgnoreCase(dbg.type, debugType)).forEach(dbg => {
                            // extract relevant attributes and make them absolute where needed
                            const extractedDbg = ExecutableDebugAdapter.extract(dbg, ed.extensionLocation.fsPath);
                            // merge
                            result = objects.mixin(result, extractedDbg, ed.isBuiltin);
                        });
                    }
                }
            }
            // select the right platform
            let platformInfo;
            if (platform.isWindows && !process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432')) {
                platformInfo = result.winx86 || result.win || result.windows;
            }
            else if (platform.isWindows) {
                platformInfo = result.win || result.windows;
            }
            else if (platform.isMacintosh) {
                platformInfo = result.osx;
            }
            else if (platform.isLinux) {
                platformInfo = result.linux;
            }
            platformInfo = platformInfo || result;
            // these are the relevant attributes
            let program = platformInfo.program || result.program;
            const args = platformInfo.args || result.args;
            let runtime = platformInfo.runtime || result.runtime;
            const runtimeArgs = platformInfo.runtimeArgs || result.runtimeArgs;
            if (runtime) {
                return {
                    type: 'executable',
                    command: runtime,
                    args: (runtimeArgs || []).concat(typeof program === 'string' ? [program] : []).concat(args || [])
                };
            }
            else if (program) {
                return {
                    type: 'executable',
                    command: program,
                    args: args || []
                };
            }
            // nothing found
            return undefined;
        }
    }
    exports.ExecutableDebugAdapter = ExecutableDebugAdapter;
});
//# sourceMappingURL=debugAdapter.js.map