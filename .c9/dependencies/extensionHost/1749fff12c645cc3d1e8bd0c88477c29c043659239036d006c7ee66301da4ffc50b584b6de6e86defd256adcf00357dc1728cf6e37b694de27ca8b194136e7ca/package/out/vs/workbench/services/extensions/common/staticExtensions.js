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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/extensions/common/extensions", "vs/base/common/uri", "vs/platform/instantiation/common/extensions", "vs/workbench/services/environment/common/environmentService"], function (require, exports, instantiation_1, extensions_1, uri_1, extensions_2, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IStaticExtensionsService = instantiation_1.createDecorator('IStaticExtensionsService');
    let StaticExtensionsService = class StaticExtensionsService {
        constructor(environmentService) {
            this._descriptions = [];
            const staticExtensions = environmentService.options && Array.isArray(environmentService.options.staticExtensions) ? environmentService.options.staticExtensions : [];
            this._descriptions = staticExtensions.map(data => (Object.assign({ identifier: new extensions_1.ExtensionIdentifier(`${data.packageJSON.publisher}.${data.packageJSON.name}`), extensionLocation: uri_1.URI.revive(data.extensionLocation) }, data.packageJSON)));
        }
        getExtensions() {
            return __awaiter(this, void 0, void 0, function* () {
                return this._descriptions;
            });
        }
    };
    StaticExtensionsService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService)
    ], StaticExtensionsService);
    exports.StaticExtensionsService = StaticExtensionsService;
    extensions_2.registerSingleton(exports.IStaticExtensionsService, StaticExtensionsService, true);
});
//# sourceMappingURL=staticExtensions.js.map