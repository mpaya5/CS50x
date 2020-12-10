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
define(["require", "exports", "vs/platform/url/common/url", "vs/platform/ipc/electron-browser/mainProcessService", "vs/platform/url/node/urlIpc", "vs/platform/url/node/urlService", "vs/platform/opener/common/opener", "vs/platform/product/node/product", "vs/platform/instantiation/common/extensions"], function (require, exports, url_1, mainProcessService_1, urlIpc_1, urlService_1, opener_1, product_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let RelayURLService = class RelayURLService extends urlService_1.URLService {
        constructor(mainProcessService, openerService) {
            super();
            this.urlService = new urlIpc_1.URLServiceChannelClient(mainProcessService.getChannel('url'));
            mainProcessService.registerChannel('urlHandler', new urlIpc_1.URLHandlerChannel(this));
            openerService.registerOpener(this);
        }
        open(resource, options) {
            return __awaiter(this, void 0, void 0, function* () {
                if (options && options.openExternal) {
                    return false;
                }
                if (resource.scheme !== product_1.default.urlProtocol) {
                    return false;
                }
                return yield this.urlService.open(resource);
            });
        }
        handleURL(uri) {
            return super.open(uri);
        }
    };
    RelayURLService = __decorate([
        __param(0, mainProcessService_1.IMainProcessService),
        __param(1, opener_1.IOpenerService)
    ], RelayURLService);
    exports.RelayURLService = RelayURLService;
    extensions_1.registerSingleton(url_1.IURLService, RelayURLService);
});
//# sourceMappingURL=urlService.js.map