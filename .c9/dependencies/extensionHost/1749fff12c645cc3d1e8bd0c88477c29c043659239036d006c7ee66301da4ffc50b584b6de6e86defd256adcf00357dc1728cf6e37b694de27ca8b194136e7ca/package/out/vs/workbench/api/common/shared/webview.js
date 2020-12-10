/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri"], function (require, exports, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function asWebviewUri(initData, uuid, resource) {
        const uri = initData.webviewResourceRoot
            .replace('{{resource}}', resource.toString().replace(/^\S+?:/, ''))
            .replace('{{uuid}}', uuid);
        return uri_1.URI.parse(uri);
    }
    exports.asWebviewUri = asWebviewUri;
});
//# sourceMappingURL=webview.js.map