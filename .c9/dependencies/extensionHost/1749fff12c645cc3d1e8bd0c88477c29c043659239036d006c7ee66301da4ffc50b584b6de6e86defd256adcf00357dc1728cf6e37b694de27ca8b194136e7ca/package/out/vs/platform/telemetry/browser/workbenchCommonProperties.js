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
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uuid", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, Platform, uuid, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.instanceStorageKey = 'telemetry.instanceId';
    exports.currentSessionDateStorageKey = 'telemetry.currentSessionDate';
    exports.firstSessionDateStorageKey = 'telemetry.firstSessionDate';
    exports.lastSessionDateStorageKey = 'telemetry.lastSessionDate';
    function resolveWorkbenchCommonProperties(storageService, commit, version, machineId, remoteAuthority) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = Object.create(null);
            const firstSessionDate = storageService.get(exports.firstSessionDateStorageKey, 0 /* GLOBAL */);
            const lastSessionDate = storageService.get(exports.lastSessionDateStorageKey, 0 /* GLOBAL */);
            /**
             * Note: In the web, session date information is fetched from browser storage, so these dates are tied to a specific
             * browser and not the machine overall.
             */
            // __GDPR__COMMON__ "common.firstSessionDate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.firstSessionDate'] = firstSessionDate;
            // __GDPR__COMMON__ "common.lastSessionDate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.lastSessionDate'] = lastSessionDate || '';
            // __GDPR__COMMON__ "common.isNewSession" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.isNewSession'] = !lastSessionDate ? '1' : '0';
            // __GDPR__COMMON__ "common.remoteAuthority" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
            result['common.remoteAuthority'] = telemetryUtils_1.cleanRemoteAuthority(remoteAuthority);
            // __GDPR__COMMON__ "common.machineId" : { "endPoint": "MacAddressHash", "classification": "EndUserPseudonymizedInformation", "purpose": "FeatureInsight" }
            result['common.machineId'] = machineId;
            // __GDPR__COMMON__ "sessionID" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['sessionID'] = uuid.generateUuid() + Date.now();
            // __GDPR__COMMON__ "commitHash" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
            result['commitHash'] = commit;
            // __GDPR__COMMON__ "version" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['version'] = version;
            // __GDPR__COMMON__ "common.platform" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.platform'] = Platform.PlatformToString(Platform.platform);
            // __GDPR__COMMON__ "common.product" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
            result['common.product'] = 'web';
            // __GDPR__COMMON__ "common.userAgent" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.userAgent'] = Platform.userAgent;
            // dynamic properties which value differs on each call
            let seq = 0;
            const startTime = Date.now();
            Object.defineProperties(result, {
                // __GDPR__COMMON__ "timestamp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                'timestamp': {
                    get: () => new Date(),
                    enumerable: true
                },
                // __GDPR__COMMON__ "common.timesincesessionstart" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                'common.timesincesessionstart': {
                    get: () => Date.now() - startTime,
                    enumerable: true
                },
                // __GDPR__COMMON__ "common.sequence" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                'common.sequence': {
                    get: () => seq++,
                    enumerable: true
                }
            });
            return result;
        });
    }
    exports.resolveWorkbenchCommonProperties = resolveWorkbenchCommonProperties;
});
//# sourceMappingURL=workbenchCommonProperties.js.map