/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/remote/common/remoteHosts"], function (require, exports, lifecycle_1, uri_1, remoteHosts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function extractLocalHostUriMetaDataForPortMapping(uri) {
        if (uri.scheme !== 'http' && uri.scheme !== 'https') {
            return undefined;
        }
        const localhostMatch = /^(localhost|127\.0\.0\.1):(\d+)$/.exec(uri.authority);
        if (!localhostMatch) {
            return undefined;
        }
        return {
            address: localhostMatch[1],
            port: +localhostMatch[2],
        };
    }
    exports.extractLocalHostUriMetaDataForPortMapping = extractLocalHostUriMetaDataForPortMapping;
    class WebviewPortMappingManager extends lifecycle_1.Disposable {
        constructor(extensionLocation, mappings, tunnelService) {
            super();
            this.extensionLocation = extensionLocation;
            this.mappings = mappings;
            this.tunnelService = tunnelService;
            this._tunnels = new Map();
        }
        getRedirect(url) {
            return __awaiter(this, void 0, void 0, function* () {
                const uri = uri_1.URI.parse(url);
                const requestLocalHostInfo = extractLocalHostUriMetaDataForPortMapping(uri);
                if (!requestLocalHostInfo) {
                    return undefined;
                }
                for (const mapping of this.mappings()) {
                    if (mapping.webviewPort === requestLocalHostInfo.port) {
                        if (this.extensionLocation && this.extensionLocation.scheme === remoteHosts_1.REMOTE_HOST_SCHEME) {
                            const tunnel = yield this.getOrCreateTunnel(mapping.extensionHostPort);
                            if (tunnel) {
                                return encodeURI(uri.with({
                                    authority: `127.0.0.1:${tunnel.tunnelLocalPort}`,
                                }).toString(true));
                            }
                        }
                        if (mapping.webviewPort !== mapping.extensionHostPort) {
                            return encodeURI(uri.with({
                                authority: `${requestLocalHostInfo.address}:${mapping.extensionHostPort}`
                            }).toString(true));
                        }
                    }
                }
                return undefined;
            });
        }
        dispose() {
            super.dispose();
            for (const tunnel of this._tunnels.values()) {
                tunnel.then(tunnel => tunnel.dispose());
            }
            this._tunnels.clear();
        }
        getOrCreateTunnel(remotePort) {
            const existing = this._tunnels.get(remotePort);
            if (existing) {
                return existing;
            }
            const tunnel = this.tunnelService.openTunnel(remotePort);
            if (tunnel) {
                this._tunnels.set(remotePort, tunnel);
            }
            return tunnel;
        }
    }
    exports.WebviewPortMappingManager = WebviewPortMappingManager;
});
//# sourceMappingURL=portMapping.js.map