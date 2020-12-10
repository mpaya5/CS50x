/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/platform/product/node/product", "vs/platform/url/common/urlService"], function (require, exports, uri_1, product_1, urlService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class URLService extends urlService_1.AbstractURLService {
        create(options) {
            const { authority, path, query, fragment } = options ? options : { authority: undefined, path: undefined, query: undefined, fragment: undefined };
            return uri_1.URI.from({ scheme: product_1.default.urlProtocol, authority, path, query, fragment });
        }
    }
    exports.URLService = URLService;
});
//# sourceMappingURL=urlService.js.map