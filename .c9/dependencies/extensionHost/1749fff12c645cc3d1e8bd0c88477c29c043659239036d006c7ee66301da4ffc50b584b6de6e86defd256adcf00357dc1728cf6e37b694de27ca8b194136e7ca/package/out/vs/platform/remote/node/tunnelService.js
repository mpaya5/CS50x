/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/remote/common/tunnel", "vs/platform/instantiation/common/extensions"], function (require, exports, tunnel_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TunnelService {
        constructor() {
        }
        openTunnel(remotePort) {
            return undefined;
        }
    }
    exports.TunnelService = TunnelService;
    extensions_1.registerSingleton(tunnel_1.ITunnelService, TunnelService);
});
//# sourceMappingURL=tunnelService.js.map