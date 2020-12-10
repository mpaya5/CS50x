/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "../common/extHostCustomers", "vs/platform/url/common/url", "vs/workbench/services/extensions/common/inactiveExtensionUrlHandler", "vs/platform/extensions/common/extensions"], function (require, exports, extHost_protocol_1, extHostCustomers_1, url_1, inactiveExtensionUrlHandler_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtensionUrlHandler {
        constructor(proxy, handle, extensionId) {
            this.proxy = proxy;
            this.handle = handle;
            this.extensionId = extensionId;
        }
        handleURL(uri) {
            if (!extensions_1.ExtensionIdentifier.equals(this.extensionId, uri.authority)) {
                return Promise.resolve(false);
            }
            return Promise.resolve(this.proxy.$handleExternalUri(this.handle, uri)).then(() => true);
        }
    }
    let MainThreadUrls = class MainThreadUrls {
        constructor(context, urlService, inactiveExtensionUrlHandler) {
            this.urlService = urlService;
            this.inactiveExtensionUrlHandler = inactiveExtensionUrlHandler;
            this.handlers = new Map();
            this.proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostUrls);
        }
        $registerUriHandler(handle, extensionId) {
            const handler = new ExtensionUrlHandler(this.proxy, handle, extensionId);
            const disposable = this.urlService.registerHandler(handler);
            this.handlers.set(handle, { extensionId, disposable });
            this.inactiveExtensionUrlHandler.registerExtensionHandler(extensionId, handler);
            return Promise.resolve(undefined);
        }
        $unregisterUriHandler(handle) {
            const tuple = this.handlers.get(handle);
            if (!tuple) {
                return Promise.resolve(undefined);
            }
            const { extensionId, disposable } = tuple;
            this.inactiveExtensionUrlHandler.unregisterExtensionHandler(extensionId);
            this.handlers.delete(handle);
            disposable.dispose();
            return Promise.resolve(undefined);
        }
        $createAppUri(extensionId, options) {
            return __awaiter(this, void 0, void 0, function* () {
                const payload = options && options.payload ? options.payload : Object.create(null);
                // we define the authority to be the extension ID to ensure
                // that the Uri gets routed back to the extension properly.
                payload.authority = extensionId.value;
                return this.urlService.create(payload);
            });
        }
        dispose() {
            this.handlers.forEach(({ disposable }) => disposable.dispose());
            this.handlers.clear();
        }
    };
    MainThreadUrls = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadUrls),
        __param(1, url_1.IURLService),
        __param(2, inactiveExtensionUrlHandler_1.IExtensionUrlHandler)
    ], MainThreadUrls);
    exports.MainThreadUrls = MainThreadUrls;
});
//# sourceMappingURL=mainThreadUrls.js.map