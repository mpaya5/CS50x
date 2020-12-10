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
define(["require", "exports", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/extensions/common/extensions", "vs/platform/commands/common/commands", "vs/platform/actions/common/actions", "vs/nls", "vs/base/common/map", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/notification/common/notification", "vs/base/common/actions", "vs/platform/windows/common/windows", "vs/base/common/lifecycle", "vs/base/common/cancellation"], function (require, exports, extensions_1, extensions_2, commands_1, actions_1, nls_1, map_1, extensionManagementUtil_1, notification_1, actions_2, windows_1, lifecycle_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtensionDependencyChecker = class ExtensionDependencyChecker extends lifecycle_1.Disposable {
        constructor(extensionService, extensionsWorkbenchService, notificationService, windowService) {
            super();
            this.extensionService = extensionService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.notificationService = notificationService;
            this.windowService = windowService;
            commands_1.CommandsRegistry.registerCommand('workbench.extensions.installMissingDepenencies', () => this.installMissingDependencies());
            actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
                command: {
                    id: 'workbench.extensions.installMissingDepenencies',
                    category: nls_1.localize('extensions', "Extensions"),
                    title: nls_1.localize('auto install missing deps', "Install Missing Dependencies")
                }
            });
        }
        getUninstalledMissingDependencies() {
            return __awaiter(this, void 0, void 0, function* () {
                const allMissingDependencies = yield this.getAllMissingDependencies();
                const localExtensions = yield this.extensionsWorkbenchService.queryLocal();
                return allMissingDependencies.filter(id => localExtensions.every(l => !extensionManagementUtil_1.areSameExtensions(l.identifier, { id })));
            });
        }
        getAllMissingDependencies() {
            return __awaiter(this, void 0, void 0, function* () {
                const runningExtensions = yield this.extensionService.getExtensions();
                const runningExtensionsIds = runningExtensions.reduce((result, r) => { result.add(r.identifier.value.toLowerCase()); return result; }, new Set());
                const missingDependencies = new Set();
                for (const extension of runningExtensions) {
                    if (extension.extensionDependencies) {
                        extension.extensionDependencies.forEach(dep => {
                            if (!runningExtensionsIds.has(dep.toLowerCase())) {
                                missingDependencies.add(dep);
                            }
                        });
                    }
                }
                return map_1.values(missingDependencies);
            });
        }
        installMissingDependencies() {
            return __awaiter(this, void 0, void 0, function* () {
                const missingDependencies = yield this.getUninstalledMissingDependencies();
                if (missingDependencies.length) {
                    const extensions = (yield this.extensionsWorkbenchService.queryGallery({ names: missingDependencies, pageSize: missingDependencies.length }, cancellation_1.CancellationToken.None)).firstPage;
                    if (extensions.length) {
                        yield Promise.all(extensions.map(extension => this.extensionsWorkbenchService.install(extension)));
                        this.notificationService.notify({
                            severity: notification_1.Severity.Info,
                            message: nls_1.localize('finished installing missing deps', "Finished installing missing dependencies. Please reload the window now."),
                            actions: {
                                primary: [new actions_2.Action('realod', nls_1.localize('reload', "Reload Window"), '', true, () => this.windowService.reloadWindow())]
                            }
                        });
                    }
                }
                else {
                    this.notificationService.info(nls_1.localize('no missing deps', "There are no missing dependencies to install."));
                }
            });
        }
    };
    ExtensionDependencyChecker = __decorate([
        __param(0, extensions_2.IExtensionService),
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, notification_1.INotificationService),
        __param(3, windows_1.IWindowService)
    ], ExtensionDependencyChecker);
    exports.ExtensionDependencyChecker = ExtensionDependencyChecker;
});
//# sourceMappingURL=extensionsDependencyChecker.js.map