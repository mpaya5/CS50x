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
define(["require", "exports", "vs/platform/telemetry/node/commonProperties", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, commonProperties_1, telemetry_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function resolveWorkbenchCommonProperties(storageService, commit, version, machineId, msftInternalDomains, installSourcePath, remoteAuthority) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield commonProperties_1.resolveCommonProperties(commit, version, machineId, msftInternalDomains, installSourcePath);
            const instanceId = storageService.get(telemetry_1.instanceStorageKey, 0 /* GLOBAL */);
            const firstSessionDate = storageService.get(telemetry_1.firstSessionDateStorageKey, 0 /* GLOBAL */);
            const lastSessionDate = storageService.get(telemetry_1.lastSessionDateStorageKey, 0 /* GLOBAL */);
            // __GDPR__COMMON__ "common.version.shell" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
            result['common.version.shell'] = process.versions && process.versions['electron'];
            // __GDPR__COMMON__ "common.version.renderer" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
            result['common.version.renderer'] = process.versions && process.versions['chrome'];
            // __GDPR__COMMON__ "common.firstSessionDate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.firstSessionDate'] = firstSessionDate;
            // __GDPR__COMMON__ "common.lastSessionDate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.lastSessionDate'] = lastSessionDate || '';
            // __GDPR__COMMON__ "common.isNewSession" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.isNewSession'] = !lastSessionDate ? '1' : '0';
            // __GDPR__COMMON__ "common.instanceId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.instanceId'] = instanceId;
            // __GDPR__COMMON__ "common.remoteAuthority" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
            result['common.remoteAuthority'] = telemetryUtils_1.cleanRemoteAuthority(remoteAuthority);
            return result;
        });
    }
    exports.resolveWorkbenchCommonProperties = resolveWorkbenchCommonProperties;
});
//# sourceMappingURL=workbenchCommonProperties.js.map