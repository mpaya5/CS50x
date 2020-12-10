/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri"], function (require, exports, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class URLServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'open': return this.service.open(uri_1.URI.revive(arg));
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.URLServiceChannel = URLServiceChannel;
    class URLServiceChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        open(url) {
            return this.channel.call('open', url.toJSON());
        }
        registerHandler(handler) {
            throw new Error('Not implemented.');
        }
        create(_options) {
            throw new Error('Method not implemented.');
        }
    }
    exports.URLServiceChannelClient = URLServiceChannelClient;
    class URLHandlerChannel {
        constructor(handler) {
            this.handler = handler;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'handleURL': return this.handler.handleURL(uri_1.URI.revive(arg));
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.URLHandlerChannel = URLHandlerChannel;
    class URLHandlerChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        handleURL(uri) {
            return this.channel.call('handleURL', uri.toJSON());
        }
    }
    exports.URLHandlerChannelClient = URLHandlerChannelClient;
});
//# sourceMappingURL=urlIpc.js.map