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
define(["require", "exports", "vs/workbench/api/common/extHostCustomers", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/credentials/common/credentials"], function (require, exports, extHostCustomers_1, extHost_protocol_1, credentials_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MainThreadKeytar = class MainThreadKeytar {
        constructor(_extHostContext, _credentialsService) {
            this._credentialsService = _credentialsService;
        }
        $getPassword(service, account) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._credentialsService.getPassword(service, account);
            });
        }
        $setPassword(service, account, password) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._credentialsService.setPassword(service, account, password);
            });
        }
        $deletePassword(service, account) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._credentialsService.deletePassword(service, account);
            });
        }
        $findPassword(service) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._credentialsService.findPassword(service);
            });
        }
        $findCredentials(service) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._credentialsService.findCredentials(service);
            });
        }
        dispose() {
            //
        }
    };
    MainThreadKeytar = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadKeytar),
        __param(1, credentials_1.ICredentialsService)
    ], MainThreadKeytar);
    exports.MainThreadKeytar = MainThreadKeytar;
});
//# sourceMappingURL=mainThreadKeytar.js.map