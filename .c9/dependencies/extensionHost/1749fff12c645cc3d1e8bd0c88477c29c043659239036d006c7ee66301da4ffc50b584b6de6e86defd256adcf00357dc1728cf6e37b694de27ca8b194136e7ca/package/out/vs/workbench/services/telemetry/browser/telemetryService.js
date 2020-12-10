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
define(["require", "exports", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetryService", "vs/platform/instantiation/common/extensions", "vs/platform/storage/common/storage", "vs/platform/telemetry/browser/workbenchCommonProperties", "vs/platform/product/common/product", "@microsoft/applicationinsights-web"], function (require, exports, telemetry_1, telemetryUtils_1, configuration_1, lifecycle_1, environmentService_1, log_1, telemetryService_1, extensions_1, storage_1, workbenchCommonProperties_1, product_1, applicationinsights_web_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WebTelemetryAppender {
        constructor(aiKey, _logService) {
            this._logService = _logService;
            const initConfig = {
                config: {
                    instrumentationKey: aiKey,
                    endpointUrl: 'https://vortex.data.microsoft.com/collect/v1',
                    emitLineDelimitedJson: true,
                    autoTrackPageVisitTime: false,
                    disableExceptionTracking: true,
                    disableAjaxTracking: true
                }
            };
            this._aiClient = new applicationinsights_web_1.ApplicationInsights(initConfig);
            this._aiClient.loadAppInsights();
        }
        log(eventName, data) {
            if (!this._aiClient) {
                return;
            }
            data = telemetryUtils_1.validateTelemetryData(data);
            this._logService.trace(`telemetry/${eventName}`, data);
            this._aiClient.trackEvent({
                name: 'monacoworkbench/' + eventName,
                properties: data.properties,
                measurements: data.measurements
            });
        }
        flush() {
            if (this._aiClient) {
                return new Promise(resolve => {
                    this._aiClient.flush();
                    this._aiClient = undefined;
                    resolve(undefined);
                });
            }
            return Promise.resolve();
        }
    }
    exports.WebTelemetryAppender = WebTelemetryAppender;
    let TelemetryService = class TelemetryService extends lifecycle_1.Disposable {
        constructor(environmentService, logService, configurationService, storageService, productService) {
            super();
            const aiKey = productService.aiConfig && productService.aiConfig.asimovKey;
            if (!environmentService.isExtensionDevelopment && !environmentService.args['disable-telemetry'] && !!productService.enableTelemetry && !!aiKey) {
                const config = {
                    appender: telemetryUtils_1.combinedAppender(new WebTelemetryAppender(aiKey, logService), new telemetryUtils_1.LogAppender(logService)),
                    commonProperties: workbenchCommonProperties_1.resolveWorkbenchCommonProperties(storageService, productService.commit, productService.version, environmentService.configuration.machineId, environmentService.configuration.remoteAuthority),
                    piiPaths: [environmentService.appRoot]
                };
                this.impl = this._register(new telemetryService_1.TelemetryService(config, configurationService));
            }
            else {
                this.impl = telemetryUtils_1.NullTelemetryService;
            }
        }
        setEnabled(value) {
            return this.impl.setEnabled(value);
        }
        get isOptedIn() {
            return this.impl.isOptedIn;
        }
        publicLog(eventName, data, anonymizeFilePaths) {
            return this.impl.publicLog(eventName, data, anonymizeFilePaths);
        }
        publicLog2(eventName, data, anonymizeFilePaths) {
            return this.publicLog(eventName, data, anonymizeFilePaths);
        }
        getTelemetryInfo() {
            return this.impl.getTelemetryInfo();
        }
    };
    TelemetryService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, log_1.ILogService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, storage_1.IStorageService),
        __param(4, product_1.IProductService)
    ], TelemetryService);
    exports.TelemetryService = TelemetryService;
    extensions_1.registerSingleton(telemetry_1.ITelemetryService, TelemetryService);
});
//# sourceMappingURL=telemetryService.js.map