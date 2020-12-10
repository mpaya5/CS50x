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
define(["require", "exports", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/product/node/product", "vs/platform/opener/common/opener", "vs/platform/notification/common/notification", "vs/base/common/uri", "vs/nls", "vs/base/common/errors", "vs/platform/windows/common/windows", "vs/workbench/contrib/experiments/common/experimentService", "vs/platform/configuration/common/configuration", "vs/base/common/platform", "vs/platform/extensionManagement/common/extensionManagement", "vs/base/common/cancellation"], function (require, exports, storage_1, telemetry_1, product_1, opener_1, notification_1, uri_1, nls_1, errors_1, windows_1, experimentService_1, configuration_1, platform_1, extensionManagement_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TelemetryOptOut = class TelemetryOptOut {
        constructor(storageService, openerService, notificationService, windowService, windowsService, telemetryService, experimentService, configurationService, galleryService) {
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.experimentService = experimentService;
            this.configurationService = configurationService;
            this.galleryService = galleryService;
            if (!product_1.default.telemetryOptOutUrl || storageService.get(TelemetryOptOut.TELEMETRY_OPT_OUT_SHOWN, 0 /* GLOBAL */)) {
                return;
            }
            const experimentId = 'telemetryOptOut';
            Promise.all([
                windowService.isFocused(),
                windowsService.getWindowCount(),
                experimentService.getExperimentById(experimentId)
            ]).then(([focused, count, experimentState]) => {
                if (!focused && count > 1) {
                    return;
                }
                storageService.store(TelemetryOptOut.TELEMETRY_OPT_OUT_SHOWN, true, 0 /* GLOBAL */);
                this.optOutUrl = product_1.default.telemetryOptOutUrl;
                this.privacyUrl = product_1.default.privacyStatementUrl || product_1.default.telemetryOptOutUrl;
                if (experimentState && experimentState.state === 2 /* Run */ && telemetryService.isOptedIn) {
                    this.runExperiment(experimentId);
                    return;
                }
                const optOutNotice = nls_1.localize('telemetryOptOut.optOutNotice', "Help improve VS Code by allowing Microsoft to collect usage data. Read our [privacy statement]({0}) and learn how to [opt out]({1}).", this.privacyUrl, this.optOutUrl);
                const optInNotice = nls_1.localize('telemetryOptOut.optInNotice', "Help improve VS Code by allowing Microsoft to collect usage data. Read our [privacy statement]({0}) and learn how to [opt in]({1}).", this.privacyUrl, this.optOutUrl);
                notificationService.prompt(notification_1.Severity.Info, telemetryService.isOptedIn ? optOutNotice : optInNotice, [{
                        label: nls_1.localize('telemetryOptOut.readMore', "Read More"),
                        run: () => openerService.open(uri_1.URI.parse(this.optOutUrl))
                    }], { sticky: true });
            })
                .then(undefined, errors_1.onUnexpectedError);
        }
        runExperiment(experimentId) {
            const promptMessageKey = 'telemetryOptOut.optOutOption';
            const yesLabelKey = 'telemetryOptOut.OptIn';
            const noLabelKey = 'telemetryOptOut.OptOut';
            let promptMessage = nls_1.localize('telemetryOptOut.optOutOption', "Please help Microsoft improve Visual Studio Code by allowing the collection of usage data. Read our [privacy statement]({0}) for more details.", this.privacyUrl);
            let yesLabel = nls_1.localize('telemetryOptOut.OptIn', "Yes, glad to help");
            let noLabel = nls_1.localize('telemetryOptOut.OptOut', "No, thanks");
            let queryPromise = Promise.resolve(undefined);
            if (platform_1.locale && platform_1.locale !== platform_1.language && platform_1.locale !== 'en' && platform_1.locale.indexOf('en-') === -1) {
                queryPromise = this.galleryService.query({ text: `tag:lp-${platform_1.locale}` }, cancellation_1.CancellationToken.None).then(tagResult => {
                    if (!tagResult || !tagResult.total) {
                        return undefined;
                    }
                    const extensionToFetchTranslationsFrom = tagResult.firstPage.filter(e => e.publisher === 'MS-CEINTL' && e.name.indexOf('vscode-language-pack') === 0)[0] || tagResult.firstPage[0];
                    if (!extensionToFetchTranslationsFrom.assets || !extensionToFetchTranslationsFrom.assets.coreTranslations.length) {
                        return undefined;
                    }
                    return this.galleryService.getCoreTranslation(extensionToFetchTranslationsFrom, platform_1.locale)
                        .then(translation => {
                        const translationsFromPack = translation && translation.contents ? translation.contents['vs/workbench/contrib/welcome/gettingStarted/electron-browser/telemetryOptOut'] : {};
                        if (!!translationsFromPack[promptMessageKey] && !!translationsFromPack[yesLabelKey] && !!translationsFromPack[noLabelKey]) {
                            promptMessage = translationsFromPack[promptMessageKey].replace('{0}', this.privacyUrl) + ' (Please help Microsoft improve Visual Studio Code by allowing the collection of usage data.)';
                            yesLabel = translationsFromPack[yesLabelKey] + ' (Yes)';
                            noLabel = translationsFromPack[noLabelKey] + ' (No)';
                        }
                        return undefined;
                    });
                });
            }
            const logTelemetry = (optout) => {
                this.telemetryService.publicLog2('experiments:optout', typeof optout === 'boolean' ? { optout } : {});
            };
            queryPromise.then(() => {
                this.notificationService.prompt(notification_1.Severity.Info, promptMessage, [
                    {
                        label: yesLabel,
                        run: () => {
                            logTelemetry(false);
                        }
                    },
                    {
                        label: noLabel,
                        run: () => {
                            logTelemetry(true);
                            this.configurationService.updateValue('telemetry.enableTelemetry', false);
                            this.configurationService.updateValue('telemetry.enableCrashReporter', false);
                        }
                    }
                ], {
                    sticky: true,
                    onCancel: logTelemetry
                });
                this.experimentService.markAsCompleted(experimentId);
            });
        }
    };
    TelemetryOptOut.TELEMETRY_OPT_OUT_SHOWN = 'workbench.telemetryOptOutShown';
    TelemetryOptOut = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, opener_1.IOpenerService),
        __param(2, notification_1.INotificationService),
        __param(3, windows_1.IWindowService),
        __param(4, windows_1.IWindowsService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, experimentService_1.IExperimentService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, extensionManagement_1.IExtensionGalleryService)
    ], TelemetryOptOut);
    exports.TelemetryOptOut = TelemetryOptOut;
});
//# sourceMappingURL=telemetryOptOut.js.map