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
define(["require", "exports", "vs/base/common/uri"], function (require, exports, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DownloadServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event, arg) {
            throw new Error('Invalid listen');
        }
        call(context, command, args) {
            switch (command) {
                case 'download': return this.service.download(uri_1.URI.revive(args[0]), uri_1.URI.revive(args[1]));
            }
            throw new Error('Invalid call');
        }
    }
    exports.DownloadServiceChannel = DownloadServiceChannel;
    class DownloadServiceChannelClient {
        constructor(channel, getUriTransformer) {
            this.channel = channel;
            this.getUriTransformer = getUriTransformer;
        }
        download(from, to) {
            return __awaiter(this, void 0, void 0, function* () {
                const uriTransfomer = this.getUriTransformer();
                if (uriTransfomer) {
                    from = uriTransfomer.transformOutgoingURI(from);
                    to = uriTransfomer.transformOutgoingURI(to);
                }
                yield this.channel.call('download', [from, to]);
            });
        }
    }
    exports.DownloadServiceChannelClient = DownloadServiceChannelClient;
});
//# sourceMappingURL=downloadIpc.js.map