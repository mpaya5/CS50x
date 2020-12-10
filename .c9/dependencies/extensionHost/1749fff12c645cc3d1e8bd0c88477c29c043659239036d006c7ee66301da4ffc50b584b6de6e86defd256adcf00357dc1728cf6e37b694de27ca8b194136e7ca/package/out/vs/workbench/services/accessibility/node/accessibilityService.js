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
define(["require", "exports", "vs/platform/accessibility/common/accessibility", "vs/base/common/platform", "vs/workbench/services/environment/common/environmentService", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/accessibility/common/abstractAccessibilityService", "vs/platform/instantiation/common/extensions"], function (require, exports, accessibility_1, platform_1, environmentService_1, contextkey_1, configuration_1, abstractAccessibilityService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let AccessibilityService = class AccessibilityService extends abstractAccessibilityService_1.AbstractAccessibilityService {
        constructor(environmentService, contextKeyService, configurationService) {
            super(contextKeyService, configurationService);
            this.environmentService = environmentService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this._accessibilitySupport = 0 /* Unknown */;
        }
        alwaysUnderlineAccessKeys() {
            if (!platform_1.isWindows) {
                return Promise.resolve(false);
            }
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                const Registry = yield new Promise((resolve_1, reject_1) => { require(['vscode-windows-registry'], resolve_1, reject_1); });
                let value;
                try {
                    value = Registry.GetStringRegKey('HKEY_CURRENT_USER', 'Control Panel\\Accessibility\\Keyboard Preference', 'On');
                }
                catch (_a) {
                    resolve(false);
                }
                resolve(value === '1');
            }));
        }
        setAccessibilitySupport(accessibilitySupport) {
            if (this._accessibilitySupport === accessibilitySupport) {
                return;
            }
            this._accessibilitySupport = accessibilitySupport;
            this._onDidChangeAccessibilitySupport.fire();
        }
        getAccessibilitySupport() {
            if (this._accessibilitySupport === 0 /* Unknown */) {
                const config = this.environmentService.configuration;
                this._accessibilitySupport = (config && config.accessibilitySupport) ? 2 /* Enabled */ : 1 /* Disabled */;
            }
            return this._accessibilitySupport;
        }
    };
    AccessibilityService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, configuration_1.IConfigurationService)
    ], AccessibilityService);
    exports.AccessibilityService = AccessibilityService;
    extensions_1.registerSingleton(accessibility_1.IAccessibilityService, AccessibilityService, true);
});
//# sourceMappingURL=accessibilityService.js.map