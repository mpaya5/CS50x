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
define(["require", "exports", "net", "fs", "vs/base/parts/ipc/common/ipc.net", "vs/base/parts/ipc/node/ipc.net", "vs/platform/product/node/product", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/workbench/services/extensions/common/extensionHostMain", "vs/base/node/pfs", "vs/base/node/extpath", "vs/base/common/lifecycle", "vs/workbench/api/node/extHost.services"], function (require, exports, net_1, fs_1, ipc_net_1, ipc_net_2, product_1, extensionHostProtocol_1, extensionHostMain_1, pfs_1, extpath_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const disposables = new lifecycle_1.DisposableStore();
    const nativeExit = process.exit.bind(process);
    const exit = (code) => {
        disposables.dispose();
        nativeExit(code);
    };
    // This calls exit directly in case the initialization is not finished and we need to exit
    // Otherwise, if initialization completed we go to extensionHostMain.terminate()
    let onTerminate = exit;
    // Prevent process.exit calls
    function patchProcess(allowExit) {
        process.exit = function (code) {
            if (allowExit) {
                exit(code);
            }
            else {
                const err = new Error("An extension called process.exit() and this was prevented.");
                console.warn(err.stack);
            }
        };
    }
    // Console logs are sent to main process (vfs worker)
    function handleExceptions() {
        // Print a console message when rejection isn't handled within N seconds. For details:
        // see https://nodejs.org/api/process.html#process_event_unhandledrejection
        // and https://nodejs.org/api/process.html#process_event_rejectionhandled
        const unhandledPromises = new Map();
        process.on("unhandledRejection", (reason, promise) => {
            unhandledPromises.set(promise, reason);
            setTimeout(() => {
                const reason = unhandledPromises.get(promise);
                if (!reason)
                    return;
                promise.catch(e => {
                    unhandledPromises.delete(promise);
                    console.error(`Rejected promise not handled within 1 second: ${e}, reason: ${reason}, stack: ${e &&
                        e.stack}`);
                });
            }, 1000);
        });
        process.on("rejectionHandled", (promise) => {
            unhandledPromises.delete(promise);
        });
        // Print a console message when an exception isn't handled.
        process.on("uncaughtException", (err) => {
            console.error(err);
        });
    }
    function createSocketServer(socketName) {
        return new Promise((resolve, reject) => {
            const server = net_1.createServer();
            disposables.add({
                dispose: () => {
                    if (!fs_1.existsSync(socketName))
                        return;
                    fs_1.unlinkSync(socketName);
                }
            });
            server.on("error", reject);
            server.listen(socketName, () => {
                server.removeListener("error", reject);
                resolve(server);
            });
        });
    }
    function awaitSocketConnection(socketServer) {
        let result = undefined;
        return new Promise((resolve, reject) => {
            // Wait for the client to connect to our named pipe
            // and wrap the socket in the message passing protocol
            let handle = setTimeout(() => {
                socketServer.close();
                reject("timeout");
            }, 60 * 1000);
            socketServer.on("connection", (socket) => {
                clearTimeout(handle);
                if (result === undefined) {
                    result = new ipc_net_1.PersistentProtocol(new ipc_net_2.NodeSocket(socket));
                    resolve(result);
                }
                else {
                    result.beginAcceptReconnection(new ipc_net_2.NodeSocket(socket), null);
                    // vscode-source/merged/src/vs/platform/remote/common/remoteAgentConnection.ts waits for the first message after beginning to accept reconnection before ending to accept reconnection. I'm not sure why that is.
                    result.endAcceptReconnection();
                }
            });
        });
    }
    function handleSpecialMessages(persistentProtocol) {
        return new (class {
            constructor() {
                this.terminating = false;
                this._onMessage = new ipc_net_1.BufferedEmitter();
                this.onMessage = this._onMessage.event;
                persistentProtocol.onMessage(msg => {
                    if (extensionHostProtocol_1.isMessageOfType(msg, 2 /* Terminate */)) {
                        this.terminate();
                    }
                    else {
                        this._onMessage.fire(msg);
                    }
                });
            }
            send(msg) {
                if (!this.terminating) {
                    persistentProtocol.send(msg);
                }
            }
            terminate() {
                if (this.terminating)
                    return;
                this.terminating = true;
                onTerminate();
            }
        })();
    }
    function connectToRenderer(protocol) {
        return new Promise(resolve => {
            // Listen init data message
            const first = protocol.onMessage(rawMessage => {
                first.dispose();
                const initData = JSON.parse(rawMessage.toString());
                const rendererCommit = initData.commit;
                const myCommit = product_1.default.commit;
                if (rendererCommit && myCommit) {
                    // Running in the built version where commits are defined
                    if (rendererCommit !== myCommit) {
                        exit(55);
                    }
                }
                // Tell the outside that we are initialized
                protocol.send(extensionHostProtocol_1.createMessageOfType(0 /* Initialized */));
                resolve(initData);
            });
            // Tell the outside that we are ready to receive messages
            protocol.send(extensionHostProtocol_1.createMessageOfType(1 /* Ready */));
        });
    }
    const DEFAULT_KILL_TIMEOUT = 1000 * 60 * 5;
    function prepareToDie(protocol, killTimeoutMs) {
        let timeoutId;
        // Happens after 20s of inactivity (keep-alive messages are sent every 5s)
        protocol.onSocketTimeout(() => {
            clearTimeout(timeoutId);
            // Wait 3 days before killing itself
            timeoutId = setTimeout(onTerminate, killTimeoutMs);
        });
        protocol.onMessage(() => clearTimeout(timeoutId));
    }
    function startExtensionHostProcess() {
        return __awaiter(this, void 0, void 0, function* () {
            handleExceptions();
            const socketName = process.env.VSCODE_IPC_HOOK_EXTHOST;
            const socketServer = yield createSocketServer(socketName);
            const persistentProtocol = yield awaitSocketConnection(socketServer);
            disposables.add(persistentProtocol);
            disposables.add(persistentProtocol.getSocket());
            const killTimeout = parseInt(process.env.VSCODE_EXTHOST_KILL_TIMEOUT || "", 10) ||
                DEFAULT_KILL_TIMEOUT;
            prepareToDie(persistentProtocol, killTimeout);
            const protocol = handleSpecialMessages(persistentProtocol);
            const initData = yield connectToRenderer(protocol);
            patchProcess(!!initData.environment.extensionTestsLocationURI);
            const hostUtils = new (class NodeHost {
                // Called by extensionHostMain.terminate
                exit(code) {
                    exit(code);
                }
                exists(path) {
                    return pfs_1.exists(path);
                }
                realpath(path) {
                    return extpath_1.realpath(path);
                }
            })();
            const extensionHostMain = new extensionHostMain_1.ExtensionHostMain(protocol, initData, hostUtils, null);
            // Rewrite onTerminate-function to be a proper shutdown
            onTerminate = () => extensionHostMain.terminate();
            process.once("SIGINT", () => protocol.terminate());
        });
    }
    exports.startExtensionHostProcess = startExtensionHostProcess;
});
//# sourceMappingURL=extensionHostProcessSetup.js.map