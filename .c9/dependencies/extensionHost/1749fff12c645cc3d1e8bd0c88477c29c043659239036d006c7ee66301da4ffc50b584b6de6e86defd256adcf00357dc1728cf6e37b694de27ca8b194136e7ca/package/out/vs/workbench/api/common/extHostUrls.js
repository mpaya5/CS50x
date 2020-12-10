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
define(["require", "exports", "./extHost.protocol", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/base/common/errors", "vs/platform/extensions/common/extensions"], function (require, exports, extHost_protocol_1, uri_1, lifecycle_1, errors_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtHostUrls {
        constructor(mainContext) {
            this.handles = new Set();
            this.handlers = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadUrls);
        }
        registerUriHandler(extensionId, handler) {
            if (this.handles.has(extensions_1.ExtensionIdentifier.toKey(extensionId))) {
                throw new Error(`Protocol handler already registered for extension ${extensionId}`);
            }
            const handle = ExtHostUrls.HandlePool++;
            this.handles.add(extensions_1.ExtensionIdentifier.toKey(extensionId));
            this.handlers.set(handle, handler);
            this._proxy.$registerUriHandler(handle, extensionId);
            return lifecycle_1.toDisposable(() => {
                this.handles.delete(extensions_1.ExtensionIdentifier.toKey(extensionId));
                this.handlers.delete(handle);
                this._proxy.$unregisterUriHandler(handle);
            });
        }
        $handleExternalUri(handle, uri) {
            const handler = this.handlers.get(handle);
            if (!handler) {
                return Promise.resolve(undefined);
            }
            try {
                handler.handleUri(uri_1.URI.revive(uri));
            }
            catch (err) {
                errors_1.onUnexpectedError(err);
            }
            return Promise.resolve(undefined);
        }
        createAppUri(extensionId, options) {
            return __awaiter(this, void 0, void 0, function* () {
                return uri_1.URI.revive(yield this._proxy.$createAppUri(extensionId, options));
            });
        }
    }
    ExtHostUrls.HandlePool = 0;
    exports.ExtHostUrls = ExtHostUrls;
});
//# sourceMappingURL=extHostUrls.js.map