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
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/network"], function (require, exports, platform, uri_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RemoteExtensionEnvironmentChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        getEnvironmentData(remoteAuthority, extensionDevelopmentPath) {
            return __awaiter(this, void 0, void 0, function* () {
                const args = {
                    language: platform.language,
                    remoteAuthority,
                    extensionDevelopmentPath
                };
                const data = yield this.channel.call('getEnvironmentData', args);
                network_1.RemoteAuthorities.setConnectionToken(remoteAuthority, data.connectionToken);
                return {
                    pid: data.pid,
                    connectionToken: data.connectionToken,
                    appRoot: uri_1.URI.revive(data.appRoot),
                    appSettingsHome: uri_1.URI.revive(data.appSettingsHome),
                    settingsPath: uri_1.URI.revive(data.settingsPath),
                    logsPath: uri_1.URI.revive(data.logsPath),
                    extensionsPath: uri_1.URI.revive(data.extensionsPath),
                    extensionHostLogsPath: uri_1.URI.revive(data.extensionHostLogsPath),
                    globalStorageHome: uri_1.URI.revive(data.globalStorageHome),
                    userHome: uri_1.URI.revive(data.userHome),
                    extensions: data.extensions.map(ext => { ext.extensionLocation = uri_1.URI.revive(ext.extensionLocation); return ext; }),
                    os: data.os
                };
            });
        }
        getDiagnosticInfo(options) {
            return this.channel.call('getDiagnosticInfo', options);
        }
        disableTelemetry() {
            return this.channel.call('disableTelemetry');
        }
    }
    exports.RemoteExtensionEnvironmentChannelClient = RemoteExtensionEnvironmentChannelClient;
});
//# sourceMappingURL=remoteAgentEnvironmentChannel.js.map