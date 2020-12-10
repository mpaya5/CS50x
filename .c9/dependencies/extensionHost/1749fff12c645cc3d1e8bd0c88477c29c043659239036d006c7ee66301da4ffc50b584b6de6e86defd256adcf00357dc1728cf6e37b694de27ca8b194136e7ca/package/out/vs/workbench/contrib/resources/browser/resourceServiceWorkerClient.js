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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/log/common/log", "vs/base/common/lifecycle"], function (require, exports, platform_1, contributions_1, log_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ResourceServiceWorker = class ResourceServiceWorker {
        constructor(_logService) {
            this._logService = _logService;
            this._disposables = new lifecycle_1.DisposableStore();
            navigator.serviceWorker.register(ResourceServiceWorker._url, { scope: '/' }).then(reg => {
                this._logService.trace('SW#reg', reg);
                return reg.update();
            }).then(() => {
                this._logService.info('SW#ready');
            }).catch(err => {
                this._logService.error('SW#init', err);
            });
            const handler = (e) => this._handleMessage(e);
            navigator.serviceWorker.addEventListener('message', handler);
            this._disposables.add(lifecycle_1.toDisposable(() => navigator.serviceWorker.removeEventListener('message', handler)));
        }
        dispose() {
            this._disposables.dispose();
        }
        _handleMessage(event) {
            this._logService.trace('SW', event.data);
        }
    };
    ResourceServiceWorker._url = require.toUrl('./resourceServiceWorkerMain.js');
    ResourceServiceWorker = __decorate([
        __param(0, log_1.ILogService)
    ], ResourceServiceWorker);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ResourceServiceWorker, 2 /* Ready */);
});
//# sourceMappingURL=resourceServiceWorkerClient.js.map