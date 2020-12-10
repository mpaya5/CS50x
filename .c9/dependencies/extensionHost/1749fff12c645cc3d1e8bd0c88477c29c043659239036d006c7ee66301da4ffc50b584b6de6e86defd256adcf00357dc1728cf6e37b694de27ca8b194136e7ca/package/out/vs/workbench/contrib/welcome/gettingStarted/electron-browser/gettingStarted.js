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
define(["require", "exports", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/environment/common/environmentService", "vs/base/common/platform", "vs/platform/product/node/product", "vs/platform/opener/common/opener", "vs/base/common/uri"], function (require, exports, storage_1, telemetry_1, environmentService_1, platform, product_1, opener_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let GettingStarted = class GettingStarted {
        constructor(storageService, environmentService, telemetryService, openerService) {
            this.storageService = storageService;
            this.telemetryService = telemetryService;
            this.openerService = openerService;
            this.appName = product_1.default.nameLong;
            if (!product_1.default.welcomePage) {
                return;
            }
            if (environmentService.skipGettingStarted) {
                return;
            }
            if (environmentService.isExtensionDevelopment) {
                return;
            }
            this.welcomePageURL = product_1.default.welcomePage;
            this.handleWelcome();
        }
        getUrl(telemetryInfo) {
            return `${this.welcomePageURL}&&from=${this.appName}&&id=${telemetryInfo.machineId}`;
        }
        openExternal(url) {
            // Don't open the welcome page as the root user on Linux, this is due to a bug with xdg-open
            // which recommends against running itself as root.
            if (platform.isLinux && platform.isRootUser()) {
                return;
            }
            this.openerService.open(uri_1.URI.parse(url));
        }
        handleWelcome() {
            //make sure the user is online, otherwise refer to the next run to show the welcome page
            if (!navigator.onLine) {
                return;
            }
            let firstStartup = !this.storageService.get(GettingStarted.hideWelcomeSettingskey, 0 /* GLOBAL */);
            if (firstStartup && this.welcomePageURL) {
                this.telemetryService.getTelemetryInfo().then(info => {
                    let url = this.getUrl(info);
                    this.openExternal(url);
                    this.storageService.store(GettingStarted.hideWelcomeSettingskey, true, 0 /* GLOBAL */);
                });
            }
        }
    };
    GettingStarted.hideWelcomeSettingskey = 'workbench.hide.welcome';
    GettingStarted = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, opener_1.IOpenerService)
    ], GettingStarted);
    exports.GettingStarted = GettingStarted;
});
//# sourceMappingURL=gettingStarted.js.map