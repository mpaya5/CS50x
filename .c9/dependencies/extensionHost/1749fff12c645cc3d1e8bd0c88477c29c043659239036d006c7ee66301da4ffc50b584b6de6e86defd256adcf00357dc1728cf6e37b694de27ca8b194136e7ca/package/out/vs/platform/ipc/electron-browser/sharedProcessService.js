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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/parts/ipc/node/ipc.net", "vs/platform/windows/common/windows", "vs/platform/environment/common/environment", "vs/base/parts/ipc/common/ipc"], function (require, exports, instantiation_1, ipc_net_1, windows_1, environment_1, ipc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ISharedProcessService = instantiation_1.createDecorator('sharedProcessService');
    let SharedProcessService = class SharedProcessService {
        constructor(windowsService, windowService, environmentService) {
            this.withSharedProcessConnection = windowsService.whenSharedProcessReady()
                .then(() => ipc_net_1.connect(environmentService.sharedIPCHandle, `window:${windowService.windowId}`));
        }
        getChannel(channelName) {
            return ipc_1.getDelayedChannel(this.withSharedProcessConnection.then(connection => connection.getChannel(channelName)));
        }
        registerChannel(channelName, channel) {
            this.withSharedProcessConnection.then(connection => connection.registerChannel(channelName, channel));
        }
    };
    SharedProcessService = __decorate([
        __param(0, windows_1.IWindowsService),
        __param(1, windows_1.IWindowService),
        __param(2, environment_1.IEnvironmentService)
    ], SharedProcessService);
    exports.SharedProcessService = SharedProcessService;
});
//# sourceMappingURL=sharedProcessService.js.map