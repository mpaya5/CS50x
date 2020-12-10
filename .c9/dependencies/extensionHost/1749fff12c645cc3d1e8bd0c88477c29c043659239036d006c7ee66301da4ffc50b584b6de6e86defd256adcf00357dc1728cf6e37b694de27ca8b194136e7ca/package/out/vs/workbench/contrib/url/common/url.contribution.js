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
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/platform/url/common/url", "vs/platform/quickinput/common/quickInput", "vs/base/common/uri", "vs/base/common/actions", "vs/platform/storage/common/storage", "vs/platform/commands/common/commands", "vs/workbench/common/contributions", "vs/platform/dialogs/common/dialogs", "vs/platform/product/common/product", "vs/platform/opener/common/opener", "vs/base/common/strings", "vs/base/common/network", "vs/base/common/severity"], function (require, exports, nls_1, actions_1, platform_1, actions_2, url_1, quickInput_1, uri_1, actions_3, storage_1, commands_1, contributions_1, dialogs_1, product_1, opener_1, strings_1, network_1, severity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let OpenUrlAction = class OpenUrlAction extends actions_3.Action {
        constructor(id, label, urlService, quickInputService) {
            super(id, label);
            this.urlService = urlService;
            this.quickInputService = quickInputService;
        }
        run() {
            return this.quickInputService.input({ prompt: 'URL to open' }).then(input => {
                const uri = uri_1.URI.parse(input);
                this.urlService.open(uri);
            });
        }
    };
    OpenUrlAction.ID = 'workbench.action.url.openUrl';
    OpenUrlAction.LABEL = nls_1.localize('openUrl', 'Open URL');
    OpenUrlAction = __decorate([
        __param(2, url_1.IURLService),
        __param(3, quickInput_1.IQuickInputService)
    ], OpenUrlAction);
    exports.OpenUrlAction = OpenUrlAction;
    platform_1.Registry.as(actions_2.Extensions.WorkbenchActions).registerWorkbenchAction(new actions_1.SyncActionDescriptor(OpenUrlAction, OpenUrlAction.ID, OpenUrlAction.LABEL), 'Open URL', nls_1.localize('developer', 'Developer'));
    const configureTrustedDomainsHandler = (quickInputService, storageService, linkProtectionTrustedDomains, domainToConfigure) => __awaiter(this, void 0, void 0, function* () {
        try {
            const trustedDomainsSrc = storageService.get('http.linkProtectionTrustedDomains', 0 /* GLOBAL */);
            if (trustedDomainsSrc) {
                linkProtectionTrustedDomains = JSON.parse(trustedDomainsSrc);
            }
        }
        catch (err) { }
        const domainQuickPickItems = linkProtectionTrustedDomains
            .filter(d => d !== '*')
            .map(d => {
            return {
                type: 'item',
                label: d,
                id: d,
                picked: true
            };
        });
        const specialQuickPickItems = [
            {
                type: 'item',
                label: nls_1.localize('openAllLinksWithoutPrompt', 'Open all links without prompt'),
                id: '*',
                picked: linkProtectionTrustedDomains.indexOf('*') !== -1
            }
        ];
        let domainToConfigureItem = undefined;
        if (domainToConfigure && linkProtectionTrustedDomains.indexOf(domainToConfigure) === -1) {
            domainToConfigureItem = {
                type: 'item',
                label: domainToConfigure,
                id: domainToConfigure,
                picked: true,
                description: nls_1.localize('trustDomainAndOpenLink', 'Trust domain and open link')
            };
            specialQuickPickItems.push(domainToConfigureItem);
        }
        const quickPickItems = domainQuickPickItems.length === 0
            ? specialQuickPickItems
            : [...specialQuickPickItems, { type: 'separator' }, ...domainQuickPickItems];
        const pickedResult = yield quickInputService.pick(quickPickItems, {
            canPickMany: true,
            activeItem: domainToConfigureItem
        });
        if (pickedResult) {
            const pickedDomains = pickedResult.map(r => r.id);
            storageService.store('http.linkProtectionTrustedDomains', JSON.stringify(pickedDomains), 0 /* GLOBAL */);
            return pickedDomains;
        }
        return [];
    });
    const configureTrustedDomainCommand = {
        id: 'workbench.action.configureLinkProtectionTrustedDomains',
        description: {
            description: nls_1.localize('configureLinkProtectionTrustedDomains', 'Configure Trusted Domains for Link Protection'),
            args: [{ name: 'domainToConfigure', schema: { type: 'string' } }]
        },
        handler: (accessor, domainToConfigure) => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const storageService = accessor.get(storage_1.IStorageService);
            const productService = accessor.get(product_1.IProductService);
            const trustedDomains = productService.linkProtectionTrustedDomains
                ? [...productService.linkProtectionTrustedDomains]
                : [];
            return configureTrustedDomainsHandler(quickInputService, storageService, trustedDomains, domainToConfigure);
        }
    };
    commands_1.CommandsRegistry.registerCommand(configureTrustedDomainCommand);
    actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
        command: {
            id: configureTrustedDomainCommand.id,
            title: configureTrustedDomainCommand.description.description
        }
    });
    let OpenerValidatorContributions = class OpenerValidatorContributions {
        constructor(_openerService, _storageService, _dialogService, _productService, _quickInputService) {
            this._openerService = _openerService;
            this._storageService = _storageService;
            this._dialogService = _dialogService;
            this._productService = _productService;
            this._quickInputService = _quickInputService;
            this._openerService.registerValidator({ shouldOpen: r => this.validateLink(r) });
        }
        validateLink(resource) {
            return __awaiter(this, void 0, void 0, function* () {
                const { scheme, authority } = resource;
                if (!strings_1.equalsIgnoreCase(scheme, network_1.Schemas.http) && !strings_1.equalsIgnoreCase(scheme, network_1.Schemas.https)) {
                    return true;
                }
                let trustedDomains = this._productService.linkProtectionTrustedDomains
                    ? [...this._productService.linkProtectionTrustedDomains]
                    : [];
                try {
                    const trustedDomainsSrc = this._storageService.get('http.linkProtectionTrustedDomains', 0 /* GLOBAL */);
                    if (trustedDomainsSrc) {
                        trustedDomains = JSON.parse(trustedDomainsSrc);
                    }
                }
                catch (err) { }
                const domainToOpen = `${scheme}://${authority}`;
                if (isURLDomainTrusted(resource, trustedDomains)) {
                    return true;
                }
                else {
                    const choice = yield this._dialogService.show(severity_1.default.Info, nls_1.localize('openExternalLinkAt', 'Do you want {0} to open the external website?\n{1}', this._productService.nameShort, resource.toString(true)), [
                        nls_1.localize('openLink', 'Open Link'),
                        nls_1.localize('cancel', 'Cancel'),
                        nls_1.localize('configureTrustedDomains', 'Configure Trusted Domains')
                    ], {
                        cancelId: 1
                    });
                    // Open Link
                    if (choice === 0) {
                        return true;
                    }
                    // Configure Trusted Domains
                    else if (choice === 2) {
                        const pickedDomains = yield configureTrustedDomainsHandler(this._quickInputService, this._storageService, trustedDomains, domainToOpen);
                        if (pickedDomains.indexOf(domainToOpen) !== -1) {
                            return true;
                        }
                        return false;
                    }
                    return false;
                }
            });
        }
    };
    OpenerValidatorContributions = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, storage_1.IStorageService),
        __param(2, dialogs_1.IDialogService),
        __param(3, product_1.IProductService),
        __param(4, quickInput_1.IQuickInputService)
    ], OpenerValidatorContributions);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(OpenerValidatorContributions, 3 /* Restored */);
    const rLocalhost = /^localhost(:\d+)?$/i;
    const r127 = /^127.0.0.1(:\d+)?$/;
    function isLocalhostAuthority(authority) {
        return rLocalhost.test(authority) || r127.test(authority);
    }
    /**
     * Check whether a domain like https://www.microsoft.com matches
     * the list of trusted domains.
     *
     * - Schemes must match
     * - There's no subdomain matching. For example https://microsoft.com doesn't match https://www.microsoft.com
     * - Star matches all. For example https://*.microsoft.com matches https://www.microsoft.com
     */
    function isURLDomainTrusted(url, trustedDomains) {
        if (isLocalhostAuthority(url.authority)) {
            return true;
        }
        const domain = `${url.scheme}://${url.authority}`;
        for (let i = 0; i < trustedDomains.length; i++) {
            if (trustedDomains[i] === '*') {
                return true;
            }
            if (trustedDomains[i] === domain) {
                return true;
            }
            if (trustedDomains[i].indexOf('*') !== -1) {
                const parsedTrustedDomain = uri_1.URI.parse(trustedDomains[i]);
                if (url.scheme === parsedTrustedDomain.scheme) {
                    const authoritySegments = url.authority.split('.');
                    const trustedDomainAuthoritySegments = parsedTrustedDomain.authority.split('.');
                    if (authoritySegments.length === trustedDomainAuthoritySegments.length) {
                        if (authoritySegments.every((val, i) => trustedDomainAuthoritySegments[i] === '*' || val === trustedDomainAuthoritySegments[i])) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    exports.isURLDomainTrusted = isURLDomainTrusted;
});
//# sourceMappingURL=url.contribution.js.map