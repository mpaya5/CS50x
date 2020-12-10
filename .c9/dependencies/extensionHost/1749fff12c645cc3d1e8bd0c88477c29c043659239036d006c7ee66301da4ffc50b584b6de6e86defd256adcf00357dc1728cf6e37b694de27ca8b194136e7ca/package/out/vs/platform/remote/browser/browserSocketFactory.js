/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, buffer_1, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BrowserWebSocket {
        constructor(socket) {
            this._onData = new event_1.Emitter();
            this.onData = this._onData.event;
            this._socket = socket;
            this._fileReader = new FileReader();
            this._queue = [];
            this._isReading = false;
            this._fileReader.onload = (event) => {
                this._isReading = false;
                const buff = event.target.result;
                this._onData.fire(buff);
                if (this._queue.length > 0) {
                    enqueue(this._queue.shift());
                }
            };
            const enqueue = (blob) => {
                if (this._isReading) {
                    this._queue.push(blob);
                    return;
                }
                this._isReading = true;
                this._fileReader.readAsArrayBuffer(blob);
            };
            this._socketMessageListener = (ev) => {
                enqueue(ev.data);
            };
            this._socket.addEventListener('message', this._socketMessageListener);
            this.onOpen = event_1.Event.fromDOMEventEmitter(this._socket, 'open');
            this.onClose = event_1.Event.fromDOMEventEmitter(this._socket, 'close');
            this.onError = event_1.Event.fromDOMEventEmitter(this._socket, 'error');
        }
        send(data) {
            this._socket.send(data);
        }
        close() {
            this._socket.close();
            this._socket.removeEventListener('message', this._socketMessageListener);
        }
    }
    exports.defaultWebSocketFactory = new class {
        create(url) {
            return new BrowserWebSocket(new WebSocket(url));
        }
    };
    class BrowserSocket {
        constructor(socket) {
            this.socket = socket;
        }
        dispose() {
            this.socket.close();
        }
        onData(listener) {
            return this.socket.onData((data) => listener(buffer_1.VSBuffer.wrap(new Uint8Array(data))));
        }
        onClose(listener) {
            return this.socket.onClose(listener);
        }
        onEnd(listener) {
            return lifecycle_1.Disposable.None;
        }
        write(buffer) {
            this.socket.send(buffer.buffer);
        }
        end() {
            this.socket.close();
        }
    }
    class BrowserSocketFactory {
        constructor(webSocketFactory) {
            this._webSocketFactory = webSocketFactory || exports.defaultWebSocketFactory;
        }
        connect(host, port, query, callback) {
            const socket = this._webSocketFactory.create(`ws://${host}:${port}/?${query}&skipWebSocketFrames=false`);
            const errorListener = socket.onError((err) => callback(err, undefined));
            socket.onOpen(() => {
                errorListener.dispose();
                callback(undefined, new BrowserSocket(socket));
            });
        }
    }
    exports.BrowserSocketFactory = BrowserSocketFactory;
});
//# sourceMappingURL=browserSocketFactory.js.map