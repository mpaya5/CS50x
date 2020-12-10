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
    //#region --- installing/activating
    self.addEventListener('install', _event => {
        console.log('SW#install');
        self.skipWaiting();
    });
    self.addEventListener('activate', event => {
        console.log('SW#activate');
        event.waitUntil((() => __awaiter(this, void 0, void 0, function* () {
            // (1) enable navigation preloads!
            // (2) delete caches with each new version
            // (3) become available to all pages
            if (self.registration.navigationPreload) {
                yield self.registration.navigationPreload.enable();
            }
            yield caches.delete(_cacheName);
            yield self.clients.claim();
        }))());
    });
    //#endregion
    //#region --- fetching/caching
    const _cacheName = 'vscode-extension-resources';
    const _resourcePrefix = '/vscode-remote-resource';
    const _pendingFetch = new Map();
    self.addEventListener('message', event => {
        const fn = _pendingFetch.get(event.data.token);
        if (fn) {
            fn(event.data.data, event.data.isExtensionResource);
            _pendingFetch.delete(event.data.token);
        }
    });
    self.addEventListener('fetch', (event) => __awaiter(this, void 0, void 0, function* () {
        const uri = uri_1.URI.parse(event.request.url);
        if (uri.path !== _resourcePrefix) {
            // not a /vscode-resources/fetch-url and therefore
            // not (yet?) interesting for us
            event.respondWith(respondWithDefault(event));
            return;
        }
        event.respondWith(respondWithResource(event, uri));
    }));
    function respondWithDefault(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
                // https://bugs.chromium.org/p/chromium/issues/detail?id=823392
                // https://stackoverflow.com/questions/48463483/what-causes-a-failed-to-execute-fetch-on-serviceworkerglobalscope-only-if#49719964
                // https://developer.mozilla.org/en-US/docs/Web/API/Request/cache
                return new Response(undefined, { status: 504, statusText: 'Gateway Timeout (dev tools: https://bugs.chromium.org/p/chromium/issues/detail?id=823392)' });
            }
            return (yield event.preloadResponse) || (yield fetch(event.request));
        });
    }
    function respondWithResource(event, uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedValue = yield caches.open(_cacheName).then(cache => cache.match(event.request));
            if (cachedValue) {
                return cachedValue;
            }
            const response = (yield event.preloadResponse) || (yield fetch(event.request));
            if (response.headers.get('X-VSCode-Extension') === 'true') {
                yield caches.open(_cacheName).then(cache => cache.put(event.request, response.clone()));
            }
            return response;
        });
    }
});
//#endregion
//# sourceMappingURL=resourceServiceWorker.js.map