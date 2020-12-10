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
define(["require", "exports", "vs/platform/debug/common/extensionHostDebugIpc", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/extensions", "vs/platform/debug/common/extensionHostDebug", "vs/workbench/contrib/debug/common/debug", "vs/base/common/event"], function (require, exports, extensionHostDebugIpc_1, remoteAgentService_1, environment_1, extensions_1, extensionHostDebug_1, debug_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BrowserExtensionHostDebugService = class BrowserExtensionHostDebugService extends extensionHostDebugIpc_1.ExtensionHostDebugChannelClient {
        constructor(remoteAgentService, 
        // @IWindowService windowService: IWindowService, // TODO@weinand TODO@isidorn cyclic dependency?
        environmentService) {
            const connection = remoteAgentService.getConnection();
            let channel;
            if (connection) {
                channel = connection.getChannel(extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel.ChannelName);
            }
            else {
                channel = { call: () => __awaiter(this, void 0, void 0, function* () { return undefined; }), listen: () => event_1.Event.None };
                // TODO@weinand TODO@isidorn fallback?
                console.warn('Extension Host Debugging not available due to missing connection.');
            }
            super(channel);
            this._register(this.onReload(event => {
                if (environmentService.isExtensionDevelopment && environmentService.debugExtensionHost.debugId === event.sessionId) {
                    window.location.reload();
                }
            }));
            this._register(this.onClose(event => {
                if (environmentService.isExtensionDevelopment && environmentService.debugExtensionHost.debugId === event.sessionId) {
                    window.close();
                }
            }));
        }
    };
    BrowserExtensionHostDebugService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, environment_1.IEnvironmentService)
    ], BrowserExtensionHostDebugService);
    extensions_1.registerSingleton(extensionHostDebug_1.IExtensionHostDebugService, BrowserExtensionHostDebugService);
    class BrowserDebugHelperService {
        createTelemetryService(configurationService, args) {
            return undefined;
        }
    }
    extensions_1.registerSingleton(debug_1.IDebugHelperService, BrowserDebugHelperService);
});
//# sourceMappingURL=extensionHostDebugService.js.map