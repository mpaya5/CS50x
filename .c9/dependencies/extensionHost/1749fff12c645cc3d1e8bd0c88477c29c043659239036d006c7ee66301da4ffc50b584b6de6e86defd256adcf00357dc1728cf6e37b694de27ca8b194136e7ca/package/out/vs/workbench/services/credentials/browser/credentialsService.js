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
define(["require", "exports", "vs/workbench/services/credentials/common/credentials", "vs/platform/instantiation/common/extensions", "vs/workbench/services/environment/common/environmentService"], function (require, exports, credentials_1, extensions_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BrowserCredentialsService = class BrowserCredentialsService {
        constructor(environmentService) {
            if (environmentService.options && environmentService.options.credentialsProvider) {
                this.credentialsProvider = environmentService.options.credentialsProvider;
            }
            else {
                this.credentialsProvider = new LocalStorageCredentialsProvider();
            }
        }
        getPassword(service, account) {
            return this.credentialsProvider.getPassword(service, account);
        }
        setPassword(service, account, password) {
            return this.credentialsProvider.setPassword(service, account, password);
        }
        deletePassword(service, account) {
            return this.credentialsProvider.deletePassword(service, account);
        }
        findPassword(service) {
            return this.credentialsProvider.findPassword(service);
        }
        findCredentials(service) {
            return this.credentialsProvider.findCredentials(service);
        }
    };
    BrowserCredentialsService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService)
    ], BrowserCredentialsService);
    exports.BrowserCredentialsService = BrowserCredentialsService;
    class LocalStorageCredentialsProvider {
        get credentials() {
            if (!this._credentials) {
                try {
                    const serializedCredentials = window.localStorage.getItem(LocalStorageCredentialsProvider.CREDENTIALS_OPENED_KEY);
                    if (serializedCredentials) {
                        this._credentials = JSON.parse(serializedCredentials);
                    }
                }
                catch (error) {
                    // ignore
                }
                if (!Array.isArray(this._credentials)) {
                    this._credentials = [];
                }
            }
            return this._credentials;
        }
        save() {
            window.localStorage.setItem(LocalStorageCredentialsProvider.CREDENTIALS_OPENED_KEY, JSON.stringify(this.credentials));
        }
        getPassword(service, account) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.doGetPassword(service, account);
            });
        }
        doGetPassword(service, account) {
            return __awaiter(this, void 0, void 0, function* () {
                for (const credential of this.credentials) {
                    if (credential.service === service) {
                        if (typeof account !== 'string' || account === credential.account) {
                            return credential.password;
                        }
                    }
                }
                return null;
            });
        }
        setPassword(service, account, password) {
            return __awaiter(this, void 0, void 0, function* () {
                this.deletePassword(service, account);
                this.credentials.push({ service, account, password });
                this.save();
            });
        }
        deletePassword(service, account) {
            return __awaiter(this, void 0, void 0, function* () {
                let found = false;
                this._credentials = this.credentials.filter(credential => {
                    if (credential.service === service && credential.account === account) {
                        found = true;
                        return false;
                    }
                    return true;
                });
                if (found) {
                    this.save();
                }
                return found;
            });
        }
        findPassword(service) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.doGetPassword(service);
            });
        }
        findCredentials(service) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.credentials
                    .filter(credential => credential.service === service)
                    .map(({ account, password }) => ({ account, password }));
            });
        }
    }
    LocalStorageCredentialsProvider.CREDENTIALS_OPENED_KEY = 'credentials.provider';
    extensions_1.registerSingleton(credentials_1.ICredentialsService, BrowserCredentialsService, true);
});
//# sourceMappingURL=credentialsService.js.map