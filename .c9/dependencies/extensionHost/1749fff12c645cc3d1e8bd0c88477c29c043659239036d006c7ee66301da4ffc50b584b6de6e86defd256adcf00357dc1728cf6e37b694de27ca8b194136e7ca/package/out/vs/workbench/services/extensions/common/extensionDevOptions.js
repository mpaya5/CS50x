/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network"], function (require, exports, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function parseExtensionDevOptions(environmentService) {
        // handle extension host lifecycle a bit special when we know we are developing an extension that runs inside
        let isExtensionDevHost = environmentService.isExtensionDevelopment;
        let debugOk = true;
        let extDevLocs = environmentService.extensionDevelopmentLocationURI;
        if (extDevLocs) {
            for (let x of extDevLocs) {
                if (x.scheme !== network_1.Schemas.file) {
                    debugOk = false;
                }
            }
        }
        let isExtensionDevDebug = debugOk && typeof environmentService.debugExtensionHost.port === 'number';
        let isExtensionDevDebugBrk = debugOk && !!environmentService.debugExtensionHost.break;
        let isExtensionDevTestFromCli = isExtensionDevHost && !!environmentService.extensionTestsLocationURI && !environmentService.debugExtensionHost.break;
        return {
            isExtensionDevHost,
            isExtensionDevDebug,
            isExtensionDevDebugBrk,
            isExtensionDevTestFromCli,
        };
    }
    exports.parseExtensionDevOptions = parseExtensionDevOptions;
});
//# sourceMappingURL=extensionDevOptions.js.map