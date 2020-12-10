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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/buffer"], function (require, exports, cancellation_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RequestChannel {
        constructor(service) {
            this.service = service;
        }
        listen(context, event) {
            throw new Error('Invalid listen');
        }
        call(context, command, args) {
            switch (command) {
                case 'request': return this.service.request(args[0], cancellation_1.CancellationToken.None)
                    .then(({ res, stream }) => __awaiter(this, void 0, void 0, function* () {
                    const buffer = yield buffer_1.streamToBuffer(stream);
                    return [{ statusCode: res.statusCode, headers: res.headers }, buffer];
                }));
            }
            throw new Error('Invalid call');
        }
    }
    exports.RequestChannel = RequestChannel;
    class RequestChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        request(options, token) {
            return __awaiter(this, void 0, void 0, function* () {
                const [res, buffer] = yield this.channel.call('request', [options]);
                return { res, stream: buffer_1.bufferToStream(buffer) };
            });
        }
    }
    exports.RequestChannelClient = RequestChannelClient;
});
//# sourceMappingURL=requestIpc.js.map