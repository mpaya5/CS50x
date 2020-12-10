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
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/platform/product/node/product", "vs/base/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/opener/common/opener", "vs/base/common/uri"], function (require, exports, actions_1, nls, product_1, platform_1, telemetry_1, opener_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let KeybindingsReferenceAction = class KeybindingsReferenceAction extends actions_1.Action {
        constructor(id, label, openerService) {
            super(id, label);
            this.openerService = openerService;
        }
        run() {
            this.openerService.open(uri_1.URI.parse(KeybindingsReferenceAction.URL));
            return Promise.resolve();
        }
    };
    KeybindingsReferenceAction.ID = 'workbench.action.keybindingsReference';
    KeybindingsReferenceAction.LABEL = nls.localize('keybindingsReference', "Keyboard Shortcuts Reference");
    KeybindingsReferenceAction.URL = platform_1.isLinux ? product_1.default.keyboardShortcutsUrlLinux : platform_1.isMacintosh ? product_1.default.keyboardShortcutsUrlMac : product_1.default.keyboardShortcutsUrlWin;
    KeybindingsReferenceAction.AVAILABLE = !!KeybindingsReferenceAction.URL;
    KeybindingsReferenceAction = __decorate([
        __param(2, opener_1.IOpenerService)
    ], KeybindingsReferenceAction);
    exports.KeybindingsReferenceAction = KeybindingsReferenceAction;
    let OpenDocumentationUrlAction = class OpenDocumentationUrlAction extends actions_1.Action {
        constructor(id, label, openerService) {
            super(id, label);
            this.openerService = openerService;
        }
        run() {
            this.openerService.open(uri_1.URI.parse(OpenDocumentationUrlAction.URL));
            return Promise.resolve();
        }
    };
    OpenDocumentationUrlAction.ID = 'workbench.action.openDocumentationUrl';
    OpenDocumentationUrlAction.LABEL = nls.localize('openDocumentationUrl', "Documentation");
    OpenDocumentationUrlAction.URL = product_1.default.documentationUrl;
    OpenDocumentationUrlAction.AVAILABLE = !!OpenDocumentationUrlAction.URL;
    OpenDocumentationUrlAction = __decorate([
        __param(2, opener_1.IOpenerService)
    ], OpenDocumentationUrlAction);
    exports.OpenDocumentationUrlAction = OpenDocumentationUrlAction;
    let OpenIntroductoryVideosUrlAction = class OpenIntroductoryVideosUrlAction extends actions_1.Action {
        constructor(id, label, openerService) {
            super(id, label);
            this.openerService = openerService;
        }
        run() {
            this.openerService.open(uri_1.URI.parse(OpenIntroductoryVideosUrlAction.URL));
            return Promise.resolve();
        }
    };
    OpenIntroductoryVideosUrlAction.ID = 'workbench.action.openIntroductoryVideosUrl';
    OpenIntroductoryVideosUrlAction.LABEL = nls.localize('openIntroductoryVideosUrl', "Introductory Videos");
    OpenIntroductoryVideosUrlAction.URL = product_1.default.introductoryVideosUrl;
    OpenIntroductoryVideosUrlAction.AVAILABLE = !!OpenIntroductoryVideosUrlAction.URL;
    OpenIntroductoryVideosUrlAction = __decorate([
        __param(2, opener_1.IOpenerService)
    ], OpenIntroductoryVideosUrlAction);
    exports.OpenIntroductoryVideosUrlAction = OpenIntroductoryVideosUrlAction;
    let OpenTipsAndTricksUrlAction = class OpenTipsAndTricksUrlAction extends actions_1.Action {
        constructor(id, label, openerService) {
            super(id, label);
            this.openerService = openerService;
        }
        run() {
            this.openerService.open(uri_1.URI.parse(OpenTipsAndTricksUrlAction.URL));
            return Promise.resolve();
        }
    };
    OpenTipsAndTricksUrlAction.ID = 'workbench.action.openTipsAndTricksUrl';
    OpenTipsAndTricksUrlAction.LABEL = nls.localize('openTipsAndTricksUrl', "Tips and Tricks");
    OpenTipsAndTricksUrlAction.URL = product_1.default.tipsAndTricksUrl;
    OpenTipsAndTricksUrlAction.AVAILABLE = !!OpenTipsAndTricksUrlAction.URL;
    OpenTipsAndTricksUrlAction = __decorate([
        __param(2, opener_1.IOpenerService)
    ], OpenTipsAndTricksUrlAction);
    exports.OpenTipsAndTricksUrlAction = OpenTipsAndTricksUrlAction;
    let OpenNewsletterSignupUrlAction = class OpenNewsletterSignupUrlAction extends actions_1.Action {
        constructor(id, label, openerService, telemetryService) {
            super(id, label);
            this.openerService = openerService;
            this.telemetryService = telemetryService;
        }
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                const info = yield this.telemetryService.getTelemetryInfo();
                this.openerService.open(uri_1.URI.parse(`${OpenNewsletterSignupUrlAction.URL}?machineId=${encodeURIComponent(info.machineId)}`));
            });
        }
    };
    OpenNewsletterSignupUrlAction.ID = 'workbench.action.openNewsletterSignupUrl';
    OpenNewsletterSignupUrlAction.LABEL = nls.localize('newsletterSignup', "Signup for the VS Code Newsletter");
    OpenNewsletterSignupUrlAction.URL = product_1.default.newsletterSignupUrl;
    OpenNewsletterSignupUrlAction.AVAILABLE = !!OpenNewsletterSignupUrlAction.URL;
    OpenNewsletterSignupUrlAction = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, telemetry_1.ITelemetryService)
    ], OpenNewsletterSignupUrlAction);
    exports.OpenNewsletterSignupUrlAction = OpenNewsletterSignupUrlAction;
    let OpenTwitterUrlAction = class OpenTwitterUrlAction extends actions_1.Action {
        constructor(id, label, openerService) {
            super(id, label);
            this.openerService = openerService;
        }
        run() {
            if (product_1.default.twitterUrl) {
                this.openerService.open(uri_1.URI.parse(product_1.default.twitterUrl));
            }
            return Promise.resolve();
        }
    };
    OpenTwitterUrlAction.ID = 'workbench.action.openTwitterUrl';
    OpenTwitterUrlAction.LABEL = nls.localize('openTwitterUrl', "Join Us on Twitter", product_1.default.applicationName);
    OpenTwitterUrlAction = __decorate([
        __param(2, opener_1.IOpenerService)
    ], OpenTwitterUrlAction);
    exports.OpenTwitterUrlAction = OpenTwitterUrlAction;
    let OpenRequestFeatureUrlAction = class OpenRequestFeatureUrlAction extends actions_1.Action {
        constructor(id, label, openerService) {
            super(id, label);
            this.openerService = openerService;
        }
        run() {
            if (product_1.default.requestFeatureUrl) {
                this.openerService.open(uri_1.URI.parse(product_1.default.requestFeatureUrl));
            }
            return Promise.resolve();
        }
    };
    OpenRequestFeatureUrlAction.ID = 'workbench.action.openRequestFeatureUrl';
    OpenRequestFeatureUrlAction.LABEL = nls.localize('openUserVoiceUrl', "Search Feature Requests");
    OpenRequestFeatureUrlAction = __decorate([
        __param(2, opener_1.IOpenerService)
    ], OpenRequestFeatureUrlAction);
    exports.OpenRequestFeatureUrlAction = OpenRequestFeatureUrlAction;
    let OpenLicenseUrlAction = class OpenLicenseUrlAction extends actions_1.Action {
        constructor(id, label, openerService) {
            super(id, label);
            this.openerService = openerService;
        }
        run() {
            if (product_1.default.licenseUrl) {
                if (platform_1.language) {
                    const queryArgChar = product_1.default.licenseUrl.indexOf('?') > 0 ? '&' : '?';
                    this.openerService.open(uri_1.URI.parse(`${product_1.default.licenseUrl}${queryArgChar}lang=${platform_1.language}`));
                }
                else {
                    this.openerService.open(uri_1.URI.parse(product_1.default.licenseUrl));
                }
            }
            return Promise.resolve();
        }
    };
    OpenLicenseUrlAction.ID = 'workbench.action.openLicenseUrl';
    OpenLicenseUrlAction.LABEL = nls.localize('openLicenseUrl', "View License");
    OpenLicenseUrlAction = __decorate([
        __param(2, opener_1.IOpenerService)
    ], OpenLicenseUrlAction);
    exports.OpenLicenseUrlAction = OpenLicenseUrlAction;
    let OpenPrivacyStatementUrlAction = class OpenPrivacyStatementUrlAction extends actions_1.Action {
        constructor(id, label, openerService) {
            super(id, label);
            this.openerService = openerService;
        }
        run() {
            if (product_1.default.privacyStatementUrl) {
                if (platform_1.language) {
                    const queryArgChar = product_1.default.privacyStatementUrl.indexOf('?') > 0 ? '&' : '?';
                    this.openerService.open(uri_1.URI.parse(`${product_1.default.privacyStatementUrl}${queryArgChar}lang=${platform_1.language}`));
                }
                else {
                    this.openerService.open(uri_1.URI.parse(product_1.default.privacyStatementUrl));
                }
            }
            return Promise.resolve();
        }
    };
    OpenPrivacyStatementUrlAction.ID = 'workbench.action.openPrivacyStatementUrl';
    OpenPrivacyStatementUrlAction.LABEL = nls.localize('openPrivacyStatement', "Privacy Statement");
    OpenPrivacyStatementUrlAction = __decorate([
        __param(2, opener_1.IOpenerService)
    ], OpenPrivacyStatementUrlAction);
    exports.OpenPrivacyStatementUrlAction = OpenPrivacyStatementUrlAction;
});
//# sourceMappingURL=helpActions.js.map