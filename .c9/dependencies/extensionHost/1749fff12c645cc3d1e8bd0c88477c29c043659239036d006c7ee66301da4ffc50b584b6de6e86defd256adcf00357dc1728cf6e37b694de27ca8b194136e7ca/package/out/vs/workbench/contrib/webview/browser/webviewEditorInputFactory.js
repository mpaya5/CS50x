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
define(["require", "exports", "./webviewEditorInput", "./webviewEditorService", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "vs/base/common/uuid"], function (require, exports, webviewEditorInput_1, webviewEditorService_1, uri_1, extensions_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WebviewEditorInputFactory = class WebviewEditorInputFactory {
        constructor(_webviewService) {
            this._webviewService = _webviewService;
        }
        serialize(input) {
            if (!this._webviewService.shouldPersist(input)) {
                return undefined;
            }
            const data = {
                viewType: input.viewType,
                title: input.getName(),
                options: Object.assign({}, input.webview.options, input.webview.contentOptions),
                extensionLocation: input.extension ? input.extension.location : undefined,
                extensionId: input.extension && input.extension.id ? input.extension.id.value : undefined,
                state: input.webview.state,
                iconPath: input.iconPath ? { light: input.iconPath.light, dark: input.iconPath.dark, } : undefined,
                group: input.group
            };
            try {
                return JSON.stringify(data);
            }
            catch (_a) {
                return undefined;
            }
        }
        deserialize(_instantiationService, serializedEditorInput) {
            const data = JSON.parse(serializedEditorInput);
            const extensionLocation = reviveUri(data.extensionLocation);
            const extensionId = data.extensionId ? new extensions_1.ExtensionIdentifier(data.extensionId) : undefined;
            const iconPath = reviveIconPath(data.iconPath);
            const state = reviveState(data.state);
            return this._webviewService.reviveWebview(uuid_1.generateUuid(), data.viewType, data.title, iconPath, state, data.options, extensionLocation ? {
                location: extensionLocation,
                id: extensionId
            } : undefined, data.group);
        }
    };
    WebviewEditorInputFactory.ID = webviewEditorInput_1.WebviewEditorInput.typeId;
    WebviewEditorInputFactory = __decorate([
        __param(0, webviewEditorService_1.IWebviewEditorService)
    ], WebviewEditorInputFactory);
    exports.WebviewEditorInputFactory = WebviewEditorInputFactory;
    function reviveIconPath(data) {
        if (!data) {
            return undefined;
        }
        const light = reviveUri(data.light);
        const dark = reviveUri(data.dark);
        return light && dark ? { light, dark } : undefined;
    }
    function reviveUri(data) {
        if (!data) {
            return undefined;
        }
        try {
            if (typeof data === 'string') {
                return uri_1.URI.parse(data);
            }
            return uri_1.URI.from(data);
        }
        catch (_a) {
            return undefined;
        }
    }
    function reviveState(state) {
        if (!state) {
            return undefined;
        }
        if (typeof state === 'string') {
            return state;
        }
        // Likely an old style state. Unwrap to a simple state object
        // Remove after 1.37
        if ('state' in state && typeof state.state === 'string') {
            return state.state;
        }
        return undefined;
    }
});
//# sourceMappingURL=webviewEditorInputFactory.js.map