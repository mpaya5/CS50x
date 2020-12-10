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
define(["require", "exports", "vs/platform/url/common/url", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/platform/url/common/urlService", "vs/base/common/event", "vs/workbench/services/environment/common/environmentService", "vs/base/common/lifecycle", "vs/platform/request/common/request", "vs/base/common/cancellation", "vs/base/common/buffer", "vs/platform/log/common/log", "vs/base/common/uuid"], function (require, exports, url_1, uri_1, instantiation_1, extensions_1, urlService_1, event_1, environmentService_1, lifecycle_1, request_1, cancellation_1, buffer_1, log_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BrowserURLService = class BrowserURLService extends urlService_1.AbstractURLService {
        constructor(environmentService, instantiationService) {
            super();
            this.provider = environmentService.options && environmentService.options.urlCallbackProvider ? environmentService.options.urlCallbackProvider : instantiationService.createInstance(SelfhostURLCallbackProvider);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.provider.onCallback(uri => this.open(uri)));
        }
        create(options) {
            return this.provider.create(options);
        }
    };
    BrowserURLService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, instantiation_1.IInstantiationService)
    ], BrowserURLService);
    exports.BrowserURLService = BrowserURLService;
    let SelfhostURLCallbackProvider = class SelfhostURLCallbackProvider extends lifecycle_1.Disposable {
        constructor(requestService, logService) {
            super();
            this.requestService = requestService;
            this.logService = logService;
            this._onCallback = this._register(new event_1.Emitter());
            this.onCallback = this._onCallback.event;
        }
        create(options) {
            const queryValues = new Map();
            const requestId = uuid_1.generateUuid();
            queryValues.set(SelfhostURLCallbackProvider.QUERY_KEYS.REQUEST_ID, requestId);
            const { scheme, authority, path, query, fragment } = options ? options : { scheme: undefined, authority: undefined, path: undefined, query: undefined, fragment: undefined };
            if (scheme) {
                queryValues.set(SelfhostURLCallbackProvider.QUERY_KEYS.SCHEME, scheme);
            }
            if (authority) {
                queryValues.set(SelfhostURLCallbackProvider.QUERY_KEYS.AUTHORITY, authority);
            }
            if (path) {
                queryValues.set(SelfhostURLCallbackProvider.QUERY_KEYS.PATH, path);
            }
            if (query) {
                queryValues.set(SelfhostURLCallbackProvider.QUERY_KEYS.QUERY, query);
            }
            if (fragment) {
                queryValues.set(SelfhostURLCallbackProvider.QUERY_KEYS.FRAGMENT, fragment);
            }
            // Start to poll on the callback being fired
            this.periodicFetchCallback(requestId, Date.now());
            return this.doCreateUri('/callback', queryValues);
        }
        periodicFetchCallback(requestId, startTime) {
            return __awaiter(this, void 0, void 0, function* () {
                // Ask server for callback results
                const queryValues = new Map();
                queryValues.set(SelfhostURLCallbackProvider.QUERY_KEYS.REQUEST_ID, requestId);
                const result = yield this.requestService.request({
                    url: this.doCreateUri('/fetch-callback', queryValues).toString(true)
                }, cancellation_1.CancellationToken.None);
                // Check for callback results
                const content = yield buffer_1.streamToBuffer(result.stream);
                if (content.byteLength > 0) {
                    try {
                        this._onCallback.fire(uri_1.URI.revive(JSON.parse(content.toString())));
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                    return; // done
                }
                // Continue fetching unless we hit the timeout
                if (Date.now() - startTime < SelfhostURLCallbackProvider.FETCH_TIMEOUT) {
                    setTimeout(() => this.periodicFetchCallback(requestId, startTime), SelfhostURLCallbackProvider.FETCH_INTERVAL);
                }
            });
        }
        doCreateUri(path, queryValues) {
            let query = undefined;
            if (queryValues) {
                let index = 0;
                queryValues.forEach((value, key) => {
                    if (!query) {
                        query = '';
                    }
                    const prefix = (index++ === 0) ? '' : '&';
                    query += `${prefix}${key}=${encodeURIComponent(value)}`;
                });
            }
            return uri_1.URI.parse(window.location.href).with({ path, query });
        }
    };
    SelfhostURLCallbackProvider.FETCH_INTERVAL = 500; // fetch every 500ms
    SelfhostURLCallbackProvider.FETCH_TIMEOUT = 5 * 60 * 1000; // ...but stop after 5min
    SelfhostURLCallbackProvider.QUERY_KEYS = {
        REQUEST_ID: 'vscode-requestId',
        SCHEME: 'vscode-scheme',
        AUTHORITY: 'vscode-authority',
        PATH: 'vscode-path',
        QUERY: 'vscode-query',
        FRAGMENT: 'vscode-fragment'
    };
    SelfhostURLCallbackProvider = __decorate([
        __param(0, request_1.IRequestService),
        __param(1, log_1.ILogService)
    ], SelfhostURLCallbackProvider);
    extensions_1.registerSingleton(url_1.IURLService, BrowserURLService, true);
});
//# sourceMappingURL=urlService.js.map