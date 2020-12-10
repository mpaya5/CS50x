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
define(["require", "exports", "url", "vs/base/common/types"], function (require, exports, url_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getSystemProxyURI(requestURL) {
        if (requestURL.protocol === 'http:') {
            return process.env.HTTP_PROXY || process.env.http_proxy || null;
        }
        else if (requestURL.protocol === 'https:') {
            return process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || null;
        }
        return null;
    }
    function getProxyAgent(rawRequestURL, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestURL = url_1.parse(rawRequestURL);
            const proxyURL = options.proxyUrl || getSystemProxyURI(requestURL);
            if (!proxyURL) {
                return null;
            }
            const proxyEndpoint = url_1.parse(proxyURL);
            if (!/^https?:$/.test(proxyEndpoint.protocol || '')) {
                return null;
            }
            const opts = {
                host: proxyEndpoint.hostname || '',
                port: Number(proxyEndpoint.port),
                auth: proxyEndpoint.auth,
                rejectUnauthorized: types_1.isBoolean(options.strictSSL) ? options.strictSSL : true
            };
            const Ctor = requestURL.protocol === 'http:'
                ? yield new Promise((resolve_1, reject_1) => { require(['http-proxy-agent'], resolve_1, reject_1); })
                : yield new Promise((resolve_2, reject_2) => { require(['https-proxy-agent'], resolve_2, reject_2); });
            return new Ctor(opts);
        });
    }
    exports.getProxyAgent = getProxyAgent;
});
//# sourceMappingURL=proxy.js.map