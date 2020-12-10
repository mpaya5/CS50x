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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/editor/common/services/modelService", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/platform/product/node/package", "vs/platform/product/node/product", "vs/platform/notification/common/notification", "vs/workbench/services/textfile/common/textfiles", "vs/platform/opener/common/opener", "vs/base/common/uri"], function (require, exports, nls, platform_1, modelService_1, contributions_1, platform_2, telemetry_1, storage_1, package_1, product_1, notification_1, textfiles_1, opener_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LanguageSurvey {
        constructor(data, storageService, notificationService, telemetryService, modelService, textFileService, openerService) {
            const SESSION_COUNT_KEY = `${data.surveyId}.sessionCount`;
            const LAST_SESSION_DATE_KEY = `${data.surveyId}.lastSessionDate`;
            const SKIP_VERSION_KEY = `${data.surveyId}.skipVersion`;
            const IS_CANDIDATE_KEY = `${data.surveyId}.isCandidate`;
            const EDITED_LANGUAGE_COUNT_KEY = `${data.surveyId}.editedCount`;
            const EDITED_LANGUAGE_DATE_KEY = `${data.surveyId}.editedDate`;
            const skipVersion = storageService.get(SKIP_VERSION_KEY, 0 /* GLOBAL */, '');
            if (skipVersion) {
                return;
            }
            const date = new Date().toDateString();
            if (storageService.getNumber(EDITED_LANGUAGE_COUNT_KEY, 0 /* GLOBAL */, 0) < data.editCount) {
                textFileService.models.onModelsSaved(e => {
                    e.forEach(event => {
                        if (event.kind === 3 /* SAVED */) {
                            const model = modelService.getModel(event.resource);
                            if (model && model.getModeId() === data.languageId && date !== storageService.get(EDITED_LANGUAGE_DATE_KEY, 0 /* GLOBAL */)) {
                                const editedCount = storageService.getNumber(EDITED_LANGUAGE_COUNT_KEY, 0 /* GLOBAL */, 0) + 1;
                                storageService.store(EDITED_LANGUAGE_COUNT_KEY, editedCount, 0 /* GLOBAL */);
                                storageService.store(EDITED_LANGUAGE_DATE_KEY, date, 0 /* GLOBAL */);
                            }
                        }
                    });
                });
            }
            const lastSessionDate = storageService.get(LAST_SESSION_DATE_KEY, 0 /* GLOBAL */, new Date(0).toDateString());
            if (date === lastSessionDate) {
                return;
            }
            const sessionCount = storageService.getNumber(SESSION_COUNT_KEY, 0 /* GLOBAL */, 0) + 1;
            storageService.store(LAST_SESSION_DATE_KEY, date, 0 /* GLOBAL */);
            storageService.store(SESSION_COUNT_KEY, sessionCount, 0 /* GLOBAL */);
            if (sessionCount < 9) {
                return;
            }
            if (storageService.getNumber(EDITED_LANGUAGE_COUNT_KEY, 0 /* GLOBAL */, 0) < data.editCount) {
                return;
            }
            const isCandidate = storageService.getBoolean(IS_CANDIDATE_KEY, 0 /* GLOBAL */, false)
                || Math.random() < data.userProbability;
            storageService.store(IS_CANDIDATE_KEY, isCandidate, 0 /* GLOBAL */);
            if (!isCandidate) {
                storageService.store(SKIP_VERSION_KEY, package_1.default.version, 0 /* GLOBAL */);
                return;
            }
            // __GDPR__TODO__ Need to move away from dynamic event names as those cannot be registered statically
            telemetryService.publicLog(`${data.surveyId}.survey/userAsked`);
            notificationService.prompt(notification_1.Severity.Info, nls.localize('helpUs', "Help us improve our support for {0}", data.languageId), [{
                    label: nls.localize('takeShortSurvey', "Take Short Survey"),
                    run: () => {
                        telemetryService.publicLog(`${data.surveyId}.survey/takeShortSurvey`);
                        telemetryService.getTelemetryInfo().then(info => {
                            openerService.open(uri_1.URI.parse(`${data.surveyUrl}?o=${encodeURIComponent(process.platform)}&v=${encodeURIComponent(package_1.default.version)}&m=${encodeURIComponent(info.machineId)}`));
                            storageService.store(IS_CANDIDATE_KEY, false, 0 /* GLOBAL */);
                            storageService.store(SKIP_VERSION_KEY, package_1.default.version, 0 /* GLOBAL */);
                        });
                    }
                }, {
                    label: nls.localize('remindLater', "Remind Me later"),
                    run: () => {
                        telemetryService.publicLog(`${data.surveyId}.survey/remindMeLater`);
                        storageService.store(SESSION_COUNT_KEY, sessionCount - 3, 0 /* GLOBAL */);
                    }
                }, {
                    label: nls.localize('neverAgain', "Don't Show Again"),
                    isSecondary: true,
                    run: () => {
                        telemetryService.publicLog(`${data.surveyId}.survey/dontShowAgain`);
                        storageService.store(IS_CANDIDATE_KEY, false, 0 /* GLOBAL */);
                        storageService.store(SKIP_VERSION_KEY, package_1.default.version, 0 /* GLOBAL */);
                    }
                }], { sticky: true });
        }
    }
    let LanguageSurveysContribution = class LanguageSurveysContribution {
        constructor(storageService, notificationService, telemetryService, modelService, textFileService, openerService) {
            product_1.default.surveys
                .filter(surveyData => surveyData.surveyId && surveyData.editCount && surveyData.languageId && surveyData.surveyUrl && surveyData.userProbability)
                .map(surveyData => new LanguageSurvey(surveyData, storageService, notificationService, telemetryService, modelService, textFileService, openerService));
        }
    };
    LanguageSurveysContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, notification_1.INotificationService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, modelService_1.IModelService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, opener_1.IOpenerService)
    ], LanguageSurveysContribution);
    if (platform_1.language === 'en' && product_1.default.surveys && product_1.default.surveys.length) {
        const workbenchRegistry = platform_2.Registry.as(contributions_1.Extensions.Workbench);
        workbenchRegistry.registerWorkbenchContribution(LanguageSurveysContribution, 3 /* Restored */);
    }
});
//# sourceMappingURL=languageSurveys.contribution.js.map