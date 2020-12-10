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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/async", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/json", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/common/extensionsFileTemplate", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/viewlet", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/contrib/extensions/common/extensionQuery", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/platform/windows/common/windows", "vs/workbench/services/extensions/common/extensions", "vs/base/common/uri", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/base/common/color", "vs/workbench/services/configuration/common/jsonEditing", "vs/editor/common/services/resolverService", "vs/base/common/paging", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/workbench/browser/actions/workspaceCommands", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/base/common/labels", "vs/platform/environment/common/environment", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/contrib/extensions/common/extensionsInput", "vs/platform/quickinput/common/quickInput", "vs/base/common/cancellation", "vs/workbench/services/layout/browser/layoutService", "vs/base/browser/ui/aria/aria", "vs/base/common/arrays", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/label/common/label", "vs/workbench/services/extensions/common/extensionsUtil", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/textfile/common/textfiles", "vs/platform/product/common/product", "vs/platform/clipboard/common/clipboardService", "vs/platform/dialogs/common/dialogs", "vs/platform/progress/common/progress", "vs/css!./media/extensionActions"], function (require, exports, nls_1, actions_1, async_1, DOM, event_1, json, actionbar_1, contextView_1, lifecycle_1, extensions_1, extensionsFileTemplate_1, extensionManagement_1, extensionManagement_2, extensionManagementUtil_1, extensions_2, instantiation_1, viewlet_1, viewlet_2, extensionQuery_1, files_1, workspace_1, windows_1, extensions_3, uri_1, commands_1, configuration_1, themeService_1, colorRegistry_1, color_1, jsonEditing_1, resolverService_1, paging_1, contextkey_1, actions_2, workspaceCommands_1, notification_1, opener_1, labels_1, environment_1, editorService_1, editorGroupsService_1, extensionsInput_1, quickInput_1, cancellation_1, layoutService_1, aria_1, arrays_1, workbenchThemeService_1, label_1, extensionsUtil_1, preferences_1, textfiles_1, product_1, clipboardService_1, dialogs_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function toExtensionDescription(local) {
        return Object.assign({ identifier: new extensions_2.ExtensionIdentifier(local.identifier.id), isBuiltin: local.type === 0 /* System */, isUnderDevelopment: false, extensionLocation: local.location }, local.manifest, { uuid: local.identifier.uuid });
    }
    exports.toExtensionDescription = toExtensionDescription;
    const promptDownloadManually = (extension, message, error, instantiationService, notificationService, openerService, productService) => {
        if (!extension || error.name === extensionManagement_1.INSTALL_ERROR_INCOMPATIBLE || error.name === extensionManagement_1.INSTALL_ERROR_MALICIOUS || !productService.extensionsGallery) {
            return Promise.reject(error);
        }
        else {
            const downloadUrl = `${productService.extensionsGallery.serviceUrl}/publishers/${extension.publisher}/vsextensions/${extension.name}/${extension.version}/vspackage`;
            notificationService.prompt(notification_1.Severity.Error, message, [{
                    label: nls_1.localize('download', "Download Manually"),
                    run: () => openerService.open(uri_1.URI.parse(downloadUrl)).then(() => {
                        notificationService.prompt(notification_1.Severity.Info, nls_1.localize('install vsix', 'Once downloaded, please manually install the downloaded VSIX of \'{0}\'.', extension.identifier.id), [{
                                label: InstallVSIXAction.LABEL,
                                run: () => {
                                    const action = instantiationService.createInstance(InstallVSIXAction, InstallVSIXAction.ID, InstallVSIXAction.LABEL);
                                    action.run();
                                    action.dispose();
                                }
                            }]);
                    })
                }]);
            return Promise.resolve();
        }
    };
    function getRelativeDateLabel(date) {
        const delta = new Date().getTime() - date.getTime();
        const year = 365 * 24 * 60 * 60 * 1000;
        if (delta > year) {
            const noOfYears = Math.floor(delta / year);
            return noOfYears > 1 ? nls_1.localize('noOfYearsAgo', "{0} years ago", noOfYears) : nls_1.localize('one year ago', "1 year ago");
        }
        const month = 30 * 24 * 60 * 60 * 1000;
        if (delta > month) {
            const noOfMonths = Math.floor(delta / month);
            return noOfMonths > 1 ? nls_1.localize('noOfMonthsAgo', "{0} months ago", noOfMonths) : nls_1.localize('one month ago', "1 month ago");
        }
        const day = 24 * 60 * 60 * 1000;
        if (delta > day) {
            const noOfDays = Math.floor(delta / day);
            return noOfDays > 1 ? nls_1.localize('noOfDaysAgo', "{0} days ago", noOfDays) : nls_1.localize('one day ago', "1 day ago");
        }
        const hour = 60 * 60 * 1000;
        if (delta > hour) {
            const noOfHours = Math.floor(delta / day);
            return noOfHours > 1 ? nls_1.localize('noOfHoursAgo', "{0} hours ago", noOfHours) : nls_1.localize('one hour ago', "1 hour ago");
        }
        if (delta > 0) {
            return nls_1.localize('just now', "Just now");
        }
        return '';
    }
    class ExtensionAction extends actions_1.Action {
        get extension() { return this._extension; }
        set extension(extension) { this._extension = extension; this.update(); }
    }
    exports.ExtensionAction = ExtensionAction;
    let InstallAction = class InstallAction extends ExtensionAction {
        constructor(extensionsWorkbenchService, instantiationService, notificationService, openerService, runtimeExtensionService, workbenchThemeService, configurationService, productService, labelService, extensionManagementServerService) {
            super(`extensions.install`, InstallAction.INSTALL_LABEL, InstallAction.Class, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.runtimeExtensionService = runtimeExtensionService;
            this.workbenchThemeService = workbenchThemeService;
            this.configurationService = configurationService;
            this.productService = productService;
            this.labelService = labelService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.update();
            this._register(this.labelService.onDidChangeFormatters(() => this.updateLabel(), this));
        }
        set manifest(manifest) {
            this._manifest = manifest;
            this.updateLabel();
        }
        update() {
            this.enabled = false;
            this.class = InstallAction.Class;
            this.label = InstallAction.INSTALL_LABEL;
            if (this.extension && this.extension.type === 1 /* User */) {
                if (this.extension.state === 3 /* Uninstalled */ && this.extensionsWorkbenchService.canInstall(this.extension)) {
                    this.enabled = true;
                    this.updateLabel();
                    return;
                }
                if (this.extension.state === 0 /* Installing */) {
                    this.enabled = false;
                    this.updateLabel();
                    this.class = this.extension.state === 0 /* Installing */ ? InstallAction.InstallingClass : InstallAction.Class;
                    return;
                }
            }
        }
        updateLabel() {
            if (this.extension.state === 0 /* Installing */) {
                this.label = InstallAction.INSTALLING_LABEL;
                this.tooltip = InstallAction.INSTALLING_LABEL;
            }
            else {
                if (this._manifest && this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) {
                    if (extensionsUtil_1.isUIExtension(this._manifest, this.productService, this.configurationService)) {
                        this.label = `${InstallAction.INSTALL_LABEL} ${nls_1.localize('locally', "Locally")}`;
                        this.tooltip = `${InstallAction.INSTALL_LABEL} ${nls_1.localize('locally', "Locally")}`;
                    }
                    else {
                        const host = this.extensionManagementServerService.remoteExtensionManagementServer.label;
                        this.label = `${InstallAction.INSTALL_LABEL} on ${host}`;
                        this.tooltip = `${InstallAction.INSTALL_LABEL} on ${host}`;
                    }
                }
                else {
                    this.label = InstallAction.INSTALL_LABEL;
                    this.tooltip = InstallAction.INSTALL_LABEL;
                }
            }
        }
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                this.extensionsWorkbenchService.open(this.extension);
                aria_1.alert(nls_1.localize('installExtensionStart', "Installing extension {0} started. An editor is now open with more details on this extension", this.extension.displayName));
                const extension = yield this.install(this.extension);
                aria_1.alert(nls_1.localize('installExtensionComplete', "Installing extension {0} is completed. Please reload Visual Studio Code to enable it.", this.extension.displayName));
                if (extension && extension.local) {
                    const runningExtension = yield this.getRunningExtension(extension.local);
                    if (runningExtension) {
                        const colorThemes = yield this.workbenchThemeService.getColorThemes();
                        const fileIconThemes = yield this.workbenchThemeService.getFileIconThemes();
                        if (SetColorThemeAction.getColorThemes(colorThemes, this.extension).length) {
                            const action = this.instantiationService.createInstance(SetColorThemeAction, colorThemes);
                            action.extension = extension;
                            return action.run({ showCurrentTheme: true, ignoreFocusLost: true });
                        }
                        if (SetFileIconThemeAction.getFileIconThemes(fileIconThemes, this.extension).length) {
                            const action = this.instantiationService.createInstance(SetFileIconThemeAction, fileIconThemes);
                            action.extension = extension;
                            return action.run({ showCurrentTheme: true, ignoreFocusLost: true });
                        }
                    }
                }
            });
        }
        install(extension) {
            return this.extensionsWorkbenchService.install(extension)
                .then(null, err => {
                if (!extension.gallery) {
                    return this.notificationService.error(err);
                }
                console.error(err);
                return promptDownloadManually(extension.gallery, nls_1.localize('failedToInstall', "Failed to install \'{0}\'.", extension.identifier.id), err, this.instantiationService, this.notificationService, this.openerService, this.productService);
            });
        }
        getRunningExtension(extension) {
            return __awaiter(this, void 0, void 0, function* () {
                const runningExtension = yield this.runtimeExtensionService.getExtension(extension.identifier.id);
                if (runningExtension) {
                    return runningExtension;
                }
                if (this.runtimeExtensionService.canAddExtension(toExtensionDescription(extension))) {
                    return new Promise((c, e) => {
                        const disposable = this.runtimeExtensionService.onDidChangeExtensions(() => __awaiter(this, void 0, void 0, function* () {
                            const runningExtension = yield this.runtimeExtensionService.getExtension(extension.identifier.id);
                            if (runningExtension) {
                                disposable.dispose();
                                c(runningExtension);
                            }
                        }));
                    });
                }
                return null;
            });
        }
    };
    InstallAction.INSTALL_LABEL = nls_1.localize('install', "Install");
    InstallAction.INSTALLING_LABEL = nls_1.localize('installing', "Installing");
    InstallAction.Class = 'extension-action prominent install';
    InstallAction.InstallingClass = 'extension-action install installing';
    InstallAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notification_1.INotificationService),
        __param(3, opener_1.IOpenerService),
        __param(4, extensions_3.IExtensionService),
        __param(5, workbenchThemeService_1.IWorkbenchThemeService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, product_1.IProductService),
        __param(8, label_1.ILabelService),
        __param(9, extensionManagement_2.IExtensionManagementServerService)
    ], InstallAction);
    exports.InstallAction = InstallAction;
    let InstallInOtherServerAction = class InstallInOtherServerAction extends ExtensionAction {
        constructor(id, server, extensionsWorkbenchService) {
            super(id, InstallInOtherServerAction.INSTALL_LABEL, InstallInOtherServerAction.Class, false);
            this.server = server;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.updateWhenCounterExtensionChanges = true;
            this.update();
        }
        update() {
            this.enabled = false;
            this.class = InstallInOtherServerAction.Class;
            if (this.extension && this.extension.local && this.server && this.extension.state === 1 /* Installed */ && this.extension.type === 1 /* User */
                // disabled by extension kind or it is a language pack extension
                && (this.extension.enablementState === 0 /* DisabledByExtensionKind */ || extensions_2.isLanguagePackExtension(this.extension.local.manifest))) {
                const extensionInOtherServer = this.extensionsWorkbenchService.installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, this.extension.identifier) && e.server === this.server)[0];
                if (extensionInOtherServer) {
                    // Getting installed in other server
                    if (extensionInOtherServer.state === 0 /* Installing */ && !extensionInOtherServer.local) {
                        this.enabled = true;
                        this.label = InstallInOtherServerAction.INSTALLING_LABEL;
                        this.class = InstallInOtherServerAction.InstallingClass;
                    }
                }
                else {
                    // Not installed in other server
                    this.enabled = true;
                    this.label = this.getInstallLabel();
                }
            }
        }
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.server) {
                    this.extensionsWorkbenchService.open(this.extension);
                    aria_1.alert(nls_1.localize('installExtensionStart', "Installing extension {0} started. An editor is now open with more details on this extension", this.extension.displayName));
                    if (this.extension.gallery) {
                        yield this.server.extensionManagementService.installFromGallery(this.extension.gallery);
                    }
                    else {
                        const vsix = yield this.extension.server.extensionManagementService.zip(this.extension.local);
                        yield this.server.extensionManagementService.install(vsix);
                    }
                }
            });
        }
    };
    InstallInOtherServerAction.INSTALL_LABEL = nls_1.localize('install', "Install");
    InstallInOtherServerAction.INSTALLING_LABEL = nls_1.localize('installing', "Installing");
    InstallInOtherServerAction.Class = 'extension-action prominent install';
    InstallInOtherServerAction.InstallingClass = 'extension-action install installing';
    InstallInOtherServerAction = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService)
    ], InstallInOtherServerAction);
    exports.InstallInOtherServerAction = InstallInOtherServerAction;
    let RemoteInstallAction = class RemoteInstallAction extends InstallInOtherServerAction {
        constructor(extensionsWorkbenchService, extensionManagementServerService) {
            super(`extensions.remoteinstall`, extensionManagementServerService.remoteExtensionManagementServer, extensionsWorkbenchService);
            this.extensionManagementServerService = extensionManagementServerService;
        }
        getInstallLabel() {
            return this.extensionManagementServerService.remoteExtensionManagementServer ? nls_1.localize('Install on Server', "Install in {0}", this.extensionManagementServerService.remoteExtensionManagementServer.label) : InstallInOtherServerAction.INSTALL_LABEL;
        }
    };
    RemoteInstallAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IExtensionManagementServerService)
    ], RemoteInstallAction);
    exports.RemoteInstallAction = RemoteInstallAction;
    let LocalInstallAction = class LocalInstallAction extends InstallInOtherServerAction {
        constructor(extensionsWorkbenchService, extensionManagementServerService) {
            super(`extensions.localinstall`, extensionManagementServerService.localExtensionManagementServer, extensionsWorkbenchService);
        }
        getInstallLabel() {
            return nls_1.localize('install locally', "Install Locally");
        }
    };
    LocalInstallAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IExtensionManagementServerService)
    ], LocalInstallAction);
    exports.LocalInstallAction = LocalInstallAction;
    let UninstallAction = class UninstallAction extends ExtensionAction {
        constructor(extensionsWorkbenchService) {
            super('extensions.uninstall', UninstallAction.UninstallLabel, UninstallAction.UninstallClass, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.update();
        }
        update() {
            if (!this.extension) {
                this.enabled = false;
                return;
            }
            const state = this.extension.state;
            if (state === 2 /* Uninstalling */) {
                this.label = UninstallAction.UninstallingLabel;
                this.class = UninstallAction.UnInstallingClass;
                this.enabled = false;
                return;
            }
            this.label = UninstallAction.UninstallLabel;
            this.class = UninstallAction.UninstallClass;
            this.tooltip = UninstallAction.UninstallLabel;
            if (state !== 1 /* Installed */) {
                this.enabled = false;
                return;
            }
            if (this.extension.type !== 1 /* User */) {
                this.enabled = false;
                return;
            }
            this.enabled = true;
        }
        run() {
            aria_1.alert(nls_1.localize('uninstallExtensionStart', "Uninstalling extension {0} started.", this.extension.displayName));
            return this.extensionsWorkbenchService.uninstall(this.extension).then(() => {
                aria_1.alert(nls_1.localize('uninstallExtensionComplete', "Please reload Visual Studio Code to complete the uninstallation of the extension {0}.", this.extension.displayName));
            });
        }
    };
    UninstallAction.UninstallLabel = nls_1.localize('uninstallAction', "Uninstall");
    UninstallAction.UninstallingLabel = nls_1.localize('Uninstalling', "Uninstalling");
    UninstallAction.UninstallClass = 'extension-action uninstall';
    UninstallAction.UnInstallingClass = 'extension-action uninstall uninstalling';
    UninstallAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService)
    ], UninstallAction);
    exports.UninstallAction = UninstallAction;
    let CombinedInstallAction = class CombinedInstallAction extends ExtensionAction {
        constructor(instantiationService) {
            super('extensions.combinedInstall', '', '', false);
            this.installAction = this._register(instantiationService.createInstance(InstallAction));
            this.uninstallAction = this._register(instantiationService.createInstance(UninstallAction));
            this.update();
        }
        set manifest(manifiest) { this.installAction.manifest = manifiest; this.update(); }
        update() {
            this.installAction.extension = this.extension;
            this.uninstallAction.extension = this.extension;
            this.installAction.update();
            this.uninstallAction.update();
            if (!this.extension || this.extension.type === 0 /* System */) {
                this.enabled = false;
                this.class = CombinedInstallAction.NoExtensionClass;
            }
            else if (this.extension.state === 0 /* Installing */) {
                this.enabled = false;
                this.label = this.installAction.label;
                this.class = this.installAction.class;
                this.tooltip = this.installAction.tooltip;
            }
            else if (this.extension.state === 2 /* Uninstalling */) {
                this.enabled = false;
                this.label = this.uninstallAction.label;
                this.class = this.uninstallAction.class;
                this.tooltip = this.uninstallAction.tooltip;
            }
            else if (this.installAction.enabled) {
                this.enabled = true;
                this.label = this.installAction.label;
                this.class = this.installAction.class;
                this.tooltip = this.installAction.tooltip;
            }
            else if (this.uninstallAction.enabled) {
                this.enabled = true;
                this.label = this.uninstallAction.label;
                this.class = this.uninstallAction.class;
                this.tooltip = this.uninstallAction.tooltip;
            }
            else {
                this.enabled = false;
                this.label = this.installAction.label;
                this.class = this.installAction.class;
                this.tooltip = this.installAction.tooltip;
            }
        }
        run() {
            if (this.installAction.enabled) {
                return this.installAction.run();
            }
            else if (this.uninstallAction.enabled) {
                return this.uninstallAction.run();
            }
            return Promise.resolve();
        }
    };
    CombinedInstallAction.NoExtensionClass = 'extension-action prominent install no-extension';
    CombinedInstallAction = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], CombinedInstallAction);
    exports.CombinedInstallAction = CombinedInstallAction;
    let UpdateAction = class UpdateAction extends ExtensionAction {
        constructor(extensionsWorkbenchService, instantiationService, notificationService, openerService, productService) {
            super(`extensions.update`, '', UpdateAction.DisabledClass, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.productService = productService;
            this.update();
        }
        update() {
            if (!this.extension) {
                this.enabled = false;
                this.class = UpdateAction.DisabledClass;
                this.label = this.getUpdateLabel();
                return;
            }
            if (this.extension.type !== 1 /* User */) {
                this.enabled = false;
                this.class = UpdateAction.DisabledClass;
                this.label = this.getUpdateLabel();
                return;
            }
            const canInstall = this.extensionsWorkbenchService.canInstall(this.extension);
            const isInstalled = this.extension.state === 1 /* Installed */;
            this.enabled = canInstall && isInstalled && this.extension.outdated;
            this.class = this.enabled ? UpdateAction.EnabledClass : UpdateAction.DisabledClass;
            this.label = this.extension.outdated ? this.getUpdateLabel(this.extension.latestVersion) : this.getUpdateLabel();
        }
        run() {
            aria_1.alert(nls_1.localize('updateExtensionStart', "Updating extension {0} to version {1} started.", this.extension.displayName, this.extension.latestVersion));
            return this.install(this.extension);
        }
        install(extension) {
            return this.extensionsWorkbenchService.install(extension).then(() => {
                aria_1.alert(nls_1.localize('updateExtensionComplete', "Updating extension {0} to version {1} completed.", this.extension.displayName, this.extension.latestVersion));
            }, err => {
                if (!extension.gallery) {
                    return this.notificationService.error(err);
                }
                console.error(err);
                return promptDownloadManually(extension.gallery, nls_1.localize('failedToUpdate', "Failed to update \'{0}\'.", extension.identifier.id), err, this.instantiationService, this.notificationService, this.openerService, this.productService);
            });
        }
        getUpdateLabel(version) {
            return version ? nls_1.localize('updateTo', "Update to {0}", version) : nls_1.localize('updateAction', "Update");
        }
    };
    UpdateAction.EnabledClass = 'extension-action prominent update';
    UpdateAction.DisabledClass = `${UpdateAction.EnabledClass} disabled`;
    UpdateAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notification_1.INotificationService),
        __param(3, opener_1.IOpenerService),
        __param(4, product_1.IProductService)
    ], UpdateAction);
    exports.UpdateAction = UpdateAction;
    class ExtensionActionViewItem extends actionbar_1.ActionViewItem {
        constructor(context, action, options = {}) {
            super(context, action, options);
        }
        updateEnabled() {
            super.updateEnabled();
            if (this.options.tabOnlyOnFocus && this.getAction().enabled && !this._hasFocus) {
                DOM.removeTabIndexAndUpdateFocus(this.label);
            }
        }
        setFocus(value) {
            if (!this.options.tabOnlyOnFocus || this._hasFocus === value) {
                return;
            }
            this._hasFocus = value;
            if (this.getAction().enabled) {
                if (this._hasFocus) {
                    this.label.tabIndex = 0;
                }
                else {
                    DOM.removeTabIndexAndUpdateFocus(this.label);
                }
            }
        }
    }
    exports.ExtensionActionViewItem = ExtensionActionViewItem;
    let ExtensionDropDownAction = class ExtensionDropDownAction extends ExtensionAction {
        constructor(id, label, cssClass, enabled, tabOnlyOnFocus, instantiationService) {
            super(id, label, cssClass, enabled);
            this.tabOnlyOnFocus = tabOnlyOnFocus;
            this.instantiationService = instantiationService;
        }
        createActionViewItem() {
            this._actionViewItem = this.instantiationService.createInstance(DropDownMenuActionViewItem, this, this.tabOnlyOnFocus);
            return this._actionViewItem;
        }
        run({ actionGroups, disposeActionsOnHide }) {
            if (this._actionViewItem) {
                this._actionViewItem.showMenu(actionGroups, disposeActionsOnHide);
            }
            return Promise.resolve();
        }
    };
    ExtensionDropDownAction = __decorate([
        __param(5, instantiation_1.IInstantiationService)
    ], ExtensionDropDownAction);
    exports.ExtensionDropDownAction = ExtensionDropDownAction;
    let DropDownMenuActionViewItem = class DropDownMenuActionViewItem extends ExtensionActionViewItem {
        constructor(action, tabOnlyOnFocus, contextMenuService) {
            super(null, action, { icon: true, label: true, tabOnlyOnFocus });
            this.contextMenuService = contextMenuService;
        }
        showMenu(menuActionGroups, disposeActionsOnHide) {
            if (this.element) {
                const actions = this.getActions(menuActionGroups);
                let elementPosition = DOM.getDomNodePagePosition(this.element);
                const anchor = { x: elementPosition.left, y: elementPosition.top + elementPosition.height + 10 };
                this.contextMenuService.showContextMenu({
                    getAnchor: () => anchor,
                    getActions: () => actions,
                    actionRunner: this.actionRunner,
                    onHide: () => { if (disposeActionsOnHide) {
                        lifecycle_1.dispose(actions);
                    } }
                });
            }
        }
        getActions(menuActionGroups) {
            let actions = [];
            for (const menuActions of menuActionGroups) {
                actions = [...actions, ...menuActions, new actionbar_1.Separator()];
            }
            return actions.length ? actions.slice(0, actions.length - 1) : actions;
        }
    };
    DropDownMenuActionViewItem = __decorate([
        __param(2, contextView_1.IContextMenuService)
    ], DropDownMenuActionViewItem);
    exports.DropDownMenuActionViewItem = DropDownMenuActionViewItem;
    let ManageExtensionAction = class ManageExtensionAction extends ExtensionDropDownAction {
        constructor(instantiationService, extensionService, workbenchThemeService) {
            super(ManageExtensionAction.ID, '', '', true, true, instantiationService);
            this.extensionService = extensionService;
            this.workbenchThemeService = workbenchThemeService;
            this.tooltip = nls_1.localize('manage', "Manage");
            this.update();
        }
        getActionGroups(runningExtensions, colorThemes, fileIconThemes) {
            const groups = [];
            if (this.extension) {
                const extensionColorThemes = SetColorThemeAction.getColorThemes(colorThemes, this.extension);
                const extensionFileIconThemes = SetFileIconThemeAction.getFileIconThemes(fileIconThemes, this.extension);
                if (extensionColorThemes.length || extensionFileIconThemes.length) {
                    const themesGroup = [];
                    if (extensionColorThemes.length) {
                        themesGroup.push(this.instantiationService.createInstance(SetColorThemeAction, colorThemes));
                    }
                    if (extensionFileIconThemes.length) {
                        themesGroup.push(this.instantiationService.createInstance(SetFileIconThemeAction, fileIconThemes));
                    }
                    groups.push(themesGroup);
                }
            }
            groups.push([
                this.instantiationService.createInstance(EnableGloballyAction),
                this.instantiationService.createInstance(EnableForWorkspaceAction)
            ]);
            groups.push([
                this.instantiationService.createInstance(DisableGloballyAction, runningExtensions),
                this.instantiationService.createInstance(DisableForWorkspaceAction, runningExtensions)
            ]);
            groups.push([this.instantiationService.createInstance(UninstallAction)]);
            groups.push([this.instantiationService.createInstance(InstallAnotherVersionAction)]);
            const extensionActions = [this.instantiationService.createInstance(ExtensionInfoAction)];
            if (this.extension.local && this.extension.local.manifest.contributes && this.extension.local.manifest.contributes.configuration) {
                extensionActions.push(this.instantiationService.createInstance(ExtensionSettingsAction));
            }
            groups.push(extensionActions);
            groups.forEach(group => group.forEach(extensionAction => extensionAction.extension = this.extension));
            return groups;
        }
        run() {
            const _super = Object.create(null, {
                run: { get: () => super.run }
            });
            return __awaiter(this, void 0, void 0, function* () {
                const runtimeExtensions = yield this.extensionService.getExtensions();
                const colorThemes = yield this.workbenchThemeService.getColorThemes();
                const fileIconThemes = yield this.workbenchThemeService.getFileIconThemes();
                return _super.run.call(this, { actionGroups: this.getActionGroups(runtimeExtensions, colorThemes, fileIconThemes), disposeActionsOnHide: true });
            });
        }
        update() {
            this.class = ManageExtensionAction.HideManageExtensionClass;
            this.enabled = false;
            if (this.extension) {
                const state = this.extension.state;
                this.enabled = state === 1 /* Installed */;
                this.class = this.enabled || state === 2 /* Uninstalling */ ? ManageExtensionAction.Class : ManageExtensionAction.HideManageExtensionClass;
                this.tooltip = state === 2 /* Uninstalling */ ? nls_1.localize('ManageExtensionAction.uninstallingTooltip', "Uninstalling") : '';
            }
        }
    };
    ManageExtensionAction.ID = 'extensions.manage';
    ManageExtensionAction.Class = 'extension-action manage';
    ManageExtensionAction.HideManageExtensionClass = `${ManageExtensionAction.Class} hide`;
    ManageExtensionAction = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, extensions_3.IExtensionService),
        __param(2, workbenchThemeService_1.IWorkbenchThemeService)
    ], ManageExtensionAction);
    exports.ManageExtensionAction = ManageExtensionAction;
    let InstallAnotherVersionAction = class InstallAnotherVersionAction extends ExtensionAction {
        constructor(extensionsWorkbenchService, extensionGalleryService, quickInputService, instantiationService, notificationService, openerService, productService) {
            super(InstallAnotherVersionAction.ID, InstallAnotherVersionAction.LABEL);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionGalleryService = extensionGalleryService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.productService = productService;
            this.update();
        }
        update() {
            this.enabled = this.extension && !!this.extension.gallery;
        }
        run() {
            if (!this.enabled) {
                return Promise.resolve();
            }
            return this.quickInputService.pick(this.getVersionEntries(), { placeHolder: nls_1.localize('selectVersion', "Select Version to Install"), matchOnDetail: true })
                .then(pick => {
                if (pick) {
                    if (this.extension.version === pick.id) {
                        return Promise.resolve();
                    }
                    const promise = pick.latest ? this.extensionsWorkbenchService.install(this.extension) : this.extensionsWorkbenchService.installVersion(this.extension, pick.id);
                    return promise
                        .then(null, err => {
                        if (!this.extension.gallery) {
                            return this.notificationService.error(err);
                        }
                        console.error(err);
                        return promptDownloadManually(this.extension.gallery, nls_1.localize('failedToInstall', "Failed to install \'{0}\'.", this.extension.identifier.id), err, this.instantiationService, this.notificationService, this.openerService, this.productService);
                    });
                }
                return null;
            });
        }
        getVersionEntries() {
            return this.extensionGalleryService.getAllVersions(this.extension.gallery, true)
                .then(allVersions => allVersions.map((v, i) => ({ id: v.version, label: v.version, description: `${getRelativeDateLabel(new Date(Date.parse(v.date)))}${v.version === this.extension.version ? ` (${nls_1.localize('current', "Current")})` : ''}`, latest: i === 0 })));
        }
    };
    InstallAnotherVersionAction.ID = 'workbench.extensions.action.install.anotherVersion';
    InstallAnotherVersionAction.LABEL = nls_1.localize('install another version', "Install Another Version...");
    InstallAnotherVersionAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, notification_1.INotificationService),
        __param(5, opener_1.IOpenerService),
        __param(6, product_1.IProductService)
    ], InstallAnotherVersionAction);
    exports.InstallAnotherVersionAction = InstallAnotherVersionAction;
    let ExtensionInfoAction = class ExtensionInfoAction extends ExtensionAction {
        constructor(clipboardService) {
            super(ExtensionInfoAction.ID, ExtensionInfoAction.LABEL);
            this.clipboardService = clipboardService;
            this.update();
        }
        update() {
            this.enabled = !!this.extension;
        }
        run() {
            const name = nls_1.localize('extensionInfoName', 'Name: {0}', this.extension.displayName);
            const id = nls_1.localize('extensionInfoId', 'Id: {0}', this.extension.identifier.id);
            const description = nls_1.localize('extensionInfoDescription', 'Description: {0}', this.extension.description);
            const verision = nls_1.localize('extensionInfoVersion', 'Version: {0}', this.extension.version);
            const publisher = nls_1.localize('extensionInfoPublisher', 'Publisher: {0}', this.extension.publisherDisplayName);
            const link = this.extension.url ? nls_1.localize('extensionInfoVSMarketplaceLink', 'VS Marketplace Link: {0}', this.extension.url.toString()) : null;
            const clipboardStr = `${name}\n${id}\n${description}\n${verision}\n${publisher}${link ? '\n' + link : ''}`;
            return this.clipboardService.writeText(clipboardStr);
        }
    };
    ExtensionInfoAction.ID = 'extensions.extensionInfo';
    ExtensionInfoAction.LABEL = nls_1.localize('extensionInfoAction', "Copy Extension Information");
    ExtensionInfoAction = __decorate([
        __param(0, clipboardService_1.IClipboardService)
    ], ExtensionInfoAction);
    exports.ExtensionInfoAction = ExtensionInfoAction;
    let ExtensionSettingsAction = class ExtensionSettingsAction extends ExtensionAction {
        constructor(preferencesService) {
            super(ExtensionSettingsAction.ID, ExtensionSettingsAction.LABEL);
            this.preferencesService = preferencesService;
            this.update();
        }
        update() {
            this.enabled = !!this.extension;
        }
        run() {
            this.preferencesService.openSettings(false, `@ext:${this.extension.identifier.id}`);
            return Promise.resolve();
        }
    };
    ExtensionSettingsAction.ID = 'extensions.extensionSettings';
    ExtensionSettingsAction.LABEL = nls_1.localize('extensionSettingsAction', "Configure Extension Settings");
    ExtensionSettingsAction = __decorate([
        __param(0, preferences_1.IPreferencesService)
    ], ExtensionSettingsAction);
    exports.ExtensionSettingsAction = ExtensionSettingsAction;
    let EnableForWorkspaceAction = class EnableForWorkspaceAction extends ExtensionAction {
        constructor(extensionsWorkbenchService, extensionEnablementService) {
            super(EnableForWorkspaceAction.ID, EnableForWorkspaceAction.LABEL);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.update();
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local) {
                this.enabled = this.extension.state === 1 /* Installed */
                    && !this.extensionEnablementService.isEnabled(this.extension.local)
                    && this.extensionEnablementService.canChangeEnablement(this.extension.local);
            }
        }
        run() {
            return this.extensionsWorkbenchService.setEnablement(this.extension, 5 /* EnabledWorkspace */);
        }
    };
    EnableForWorkspaceAction.ID = 'extensions.enableForWorkspace';
    EnableForWorkspaceAction.LABEL = nls_1.localize('enableForWorkspaceAction', "Enable (Workspace)");
    EnableForWorkspaceAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IExtensionEnablementService)
    ], EnableForWorkspaceAction);
    exports.EnableForWorkspaceAction = EnableForWorkspaceAction;
    let EnableGloballyAction = class EnableGloballyAction extends ExtensionAction {
        constructor(extensionsWorkbenchService, extensionEnablementService) {
            super(EnableGloballyAction.ID, EnableGloballyAction.LABEL);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.update();
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local) {
                this.enabled = this.extension.state === 1 /* Installed */
                    && this.extension.enablementState === 2 /* DisabledGlobally */
                    && this.extensionEnablementService.canChangeEnablement(this.extension.local);
            }
        }
        run() {
            return this.extensionsWorkbenchService.setEnablement(this.extension, 4 /* EnabledGlobally */);
        }
    };
    EnableGloballyAction.ID = 'extensions.enableGlobally';
    EnableGloballyAction.LABEL = nls_1.localize('enableGloballyAction', "Enable");
    EnableGloballyAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IExtensionEnablementService)
    ], EnableGloballyAction);
    exports.EnableGloballyAction = EnableGloballyAction;
    let DisableForWorkspaceAction = class DisableForWorkspaceAction extends ExtensionAction {
        constructor(runningExtensions, workspaceContextService, extensionsWorkbenchService, extensionEnablementService) {
            super(DisableForWorkspaceAction.ID, DisableForWorkspaceAction.LABEL);
            this.runningExtensions = runningExtensions;
            this.workspaceContextService = workspaceContextService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.update();
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local && this.runningExtensions.some(e => extensionManagementUtil_1.areSameExtensions({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier) && this.workspaceContextService.getWorkbenchState() !== 1 /* EMPTY */)) {
                this.enabled = this.extension.state === 1 /* Installed */
                    && (this.extension.enablementState === 4 /* EnabledGlobally */ || this.extension.enablementState === 5 /* EnabledWorkspace */)
                    && this.extensionEnablementService.canChangeEnablement(this.extension.local);
            }
        }
        run() {
            return this.extensionsWorkbenchService.setEnablement(this.extension, 3 /* DisabledWorkspace */);
        }
    };
    DisableForWorkspaceAction.ID = 'extensions.disableForWorkspace';
    DisableForWorkspaceAction.LABEL = nls_1.localize('disableForWorkspaceAction', "Disable (Workspace)");
    DisableForWorkspaceAction = __decorate([
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, extensionManagement_2.IExtensionEnablementService)
    ], DisableForWorkspaceAction);
    exports.DisableForWorkspaceAction = DisableForWorkspaceAction;
    let DisableGloballyAction = class DisableGloballyAction extends ExtensionAction {
        constructor(runningExtensions, extensionsWorkbenchService, extensionEnablementService) {
            super(DisableGloballyAction.ID, DisableGloballyAction.LABEL);
            this.runningExtensions = runningExtensions;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.update();
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local && this.runningExtensions.some(e => extensionManagementUtil_1.areSameExtensions({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier))) {
                this.enabled = this.extension.state === 1 /* Installed */
                    && (this.extension.enablementState === 4 /* EnabledGlobally */ || this.extension.enablementState === 5 /* EnabledWorkspace */)
                    && this.extensionEnablementService.canChangeEnablement(this.extension.local);
            }
        }
        run() {
            return this.extensionsWorkbenchService.setEnablement(this.extension, 2 /* DisabledGlobally */);
        }
    };
    DisableGloballyAction.ID = 'extensions.disableGlobally';
    DisableGloballyAction.LABEL = nls_1.localize('disableGloballyAction', "Disable");
    DisableGloballyAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, extensionManagement_2.IExtensionEnablementService)
    ], DisableGloballyAction);
    exports.DisableGloballyAction = DisableGloballyAction;
    let ExtensionEditorDropDownAction = class ExtensionEditorDropDownAction extends ExtensionDropDownAction {
        constructor(id, initialLabel, actions, instantiationService) {
            super(id, initialLabel, ExtensionEditorDropDownAction.DisabledClass, false, false, instantiationService);
            this.initialLabel = initialLabel;
            this.actions = actions;
            this.update();
        }
        update() {
            this.actions.forEach(a => a.extension = this.extension);
            this.actions.forEach(a => a.update());
            const enabledActions = this.actions.filter(a => a.enabled);
            this.enabled = enabledActions.length > 0;
            if (this.enabled) {
                if (enabledActions.length === 1) {
                    this.label = enabledActions[0].label;
                    this.class = ExtensionEditorDropDownAction.EnabledClass;
                }
                else {
                    this.label = this.initialLabel;
                    this.class = ExtensionEditorDropDownAction.EnabledDropDownClass;
                }
            }
            else {
                this.class = ExtensionEditorDropDownAction.DisabledClass;
            }
        }
        run() {
            const enabledActions = this.actions.filter(a => a.enabled);
            if (enabledActions.length === 1) {
                enabledActions[0].run();
            }
            else {
                return super.run({ actionGroups: [this.actions], disposeActionsOnHide: false });
            }
            return Promise.resolve();
        }
    };
    ExtensionEditorDropDownAction.EnabledClass = 'extension-action extension-editor-dropdown-action';
    ExtensionEditorDropDownAction.EnabledDropDownClass = 'extension-action extension-editor-dropdown-action dropdown enable';
    ExtensionEditorDropDownAction.DisabledClass = `${ExtensionEditorDropDownAction.EnabledClass} disabled`;
    ExtensionEditorDropDownAction = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], ExtensionEditorDropDownAction);
    exports.ExtensionEditorDropDownAction = ExtensionEditorDropDownAction;
    let EnableDropDownAction = class EnableDropDownAction extends ExtensionEditorDropDownAction {
        constructor(instantiationService) {
            super('extensions.enable', nls_1.localize('enableAction', "Enable"), [
                instantiationService.createInstance(EnableGloballyAction),
                instantiationService.createInstance(EnableForWorkspaceAction)
            ], instantiationService);
        }
    };
    EnableDropDownAction = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], EnableDropDownAction);
    exports.EnableDropDownAction = EnableDropDownAction;
    let DisableDropDownAction = class DisableDropDownAction extends ExtensionEditorDropDownAction {
        constructor(runningExtensions, instantiationService) {
            super('extensions.disable', nls_1.localize('disableAction', "Disable"), [
                instantiationService.createInstance(DisableGloballyAction, runningExtensions),
                instantiationService.createInstance(DisableForWorkspaceAction, runningExtensions)
            ], instantiationService);
        }
    };
    DisableDropDownAction = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], DisableDropDownAction);
    exports.DisableDropDownAction = DisableDropDownAction;
    let CheckForUpdatesAction = class CheckForUpdatesAction extends actions_1.Action {
        constructor(id = CheckForUpdatesAction.ID, label = CheckForUpdatesAction.LABEL, extensionsWorkbenchService, extensionEnablementService, viewletService, notificationService) {
            super(id, label, '', true);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.viewletService = viewletService;
            this.notificationService = notificationService;
        }
        checkUpdatesAndNotify() {
            const outdated = this.extensionsWorkbenchService.outdated;
            if (!outdated.length) {
                this.notificationService.info(nls_1.localize('noUpdatesAvailable', "All extensions are up to date."));
                return;
            }
            let msgAvailableExtensions = outdated.length === 1 ? nls_1.localize('singleUpdateAvailable', "An extension update is available.") : nls_1.localize('updatesAvailable', "{0} extension updates are available.", outdated.length);
            const disabledExtensionsCount = outdated.filter(ext => ext.local && !this.extensionEnablementService.isEnabled(ext.local)).length;
            if (disabledExtensionsCount) {
                if (outdated.length === 1) {
                    msgAvailableExtensions = nls_1.localize('singleDisabledUpdateAvailable', "An update to an extension which is disabled is available.");
                }
                else if (disabledExtensionsCount === 1) {
                    msgAvailableExtensions = nls_1.localize('updatesAvailableOneDisabled', "{0} extension updates are available. One of them is for a disabled extension.", outdated.length);
                }
                else if (disabledExtensionsCount === outdated.length) {
                    msgAvailableExtensions = nls_1.localize('updatesAvailableAllDisabled', "{0} extension updates are available. All of them are for disabled extensions.", outdated.length);
                }
                else {
                    msgAvailableExtensions = nls_1.localize('updatesAvailableIncludingDisabled', "{0} extension updates are available. {1} of them are for disabled extensions.", outdated.length, disabledExtensionsCount);
                }
            }
            this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                .then(viewlet => viewlet)
                .then(viewlet => viewlet.search(''));
            this.notificationService.info(msgAvailableExtensions);
        }
        run() {
            return this.extensionsWorkbenchService.checkForUpdates().then(() => this.checkUpdatesAndNotify());
        }
    };
    CheckForUpdatesAction.ID = 'workbench.extensions.action.checkForUpdates';
    CheckForUpdatesAction.LABEL = nls_1.localize('checkForUpdates', "Check for Extension Updates");
    CheckForUpdatesAction = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, extensionManagement_2.IExtensionEnablementService),
        __param(4, viewlet_2.IViewletService),
        __param(5, notification_1.INotificationService)
    ], CheckForUpdatesAction);
    exports.CheckForUpdatesAction = CheckForUpdatesAction;
    let ToggleAutoUpdateAction = class ToggleAutoUpdateAction extends actions_1.Action {
        constructor(id, label, autoUpdateValue, configurationService) {
            super(id, label, '', true);
            this.autoUpdateValue = autoUpdateValue;
            this.configurationService = configurationService;
            this.updateEnablement();
            configurationService.onDidChangeConfiguration(() => this.updateEnablement());
        }
        updateEnablement() {
            this.enabled = this.configurationService.getValue(extensions_1.AutoUpdateConfigurationKey) !== this.autoUpdateValue;
        }
        run() {
            return this.configurationService.updateValue(extensions_1.AutoUpdateConfigurationKey, this.autoUpdateValue);
        }
    };
    ToggleAutoUpdateAction = __decorate([
        __param(3, configuration_1.IConfigurationService)
    ], ToggleAutoUpdateAction);
    exports.ToggleAutoUpdateAction = ToggleAutoUpdateAction;
    let EnableAutoUpdateAction = class EnableAutoUpdateAction extends ToggleAutoUpdateAction {
        constructor(id = EnableAutoUpdateAction.ID, label = EnableAutoUpdateAction.LABEL, configurationService) {
            super(id, label, true, configurationService);
        }
    };
    EnableAutoUpdateAction.ID = 'workbench.extensions.action.enableAutoUpdate';
    EnableAutoUpdateAction.LABEL = nls_1.localize('enableAutoUpdate', "Enable Auto Updating Extensions");
    EnableAutoUpdateAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], EnableAutoUpdateAction);
    exports.EnableAutoUpdateAction = EnableAutoUpdateAction;
    let DisableAutoUpdateAction = class DisableAutoUpdateAction extends ToggleAutoUpdateAction {
        constructor(id = EnableAutoUpdateAction.ID, label = EnableAutoUpdateAction.LABEL, configurationService) {
            super(id, label, false, configurationService);
        }
    };
    DisableAutoUpdateAction.ID = 'workbench.extensions.action.disableAutoUpdate';
    DisableAutoUpdateAction.LABEL = nls_1.localize('disableAutoUpdate', "Disable Auto Updating Extensions");
    DisableAutoUpdateAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], DisableAutoUpdateAction);
    exports.DisableAutoUpdateAction = DisableAutoUpdateAction;
    let UpdateAllAction = class UpdateAllAction extends actions_1.Action {
        constructor(id = UpdateAllAction.ID, label = UpdateAllAction.LABEL, extensionsWorkbenchService, notificationService, instantiationService, openerService, productService) {
            super(id, label, '', false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.notificationService = notificationService;
            this.instantiationService = instantiationService;
            this.openerService = openerService;
            this.productService = productService;
            this._register(this.extensionsWorkbenchService.onChange(() => this.update()));
            this.update();
        }
        update() {
            this.enabled = this.extensionsWorkbenchService.outdated.length > 0;
        }
        run() {
            return Promise.all(this.extensionsWorkbenchService.outdated.map(e => this.install(e)));
        }
        install(extension) {
            return this.extensionsWorkbenchService.install(extension).then(undefined, err => {
                if (!extension.gallery) {
                    return this.notificationService.error(err);
                }
                console.error(err);
                return promptDownloadManually(extension.gallery, nls_1.localize('failedToUpdate', "Failed to update \'{0}\'.", extension.identifier.id), err, this.instantiationService, this.notificationService, this.openerService, this.productService);
            });
        }
    };
    UpdateAllAction.ID = 'workbench.extensions.action.updateAllExtensions';
    UpdateAllAction.LABEL = nls_1.localize('updateAll', "Update All Extensions");
    UpdateAllAction = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, notification_1.INotificationService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, opener_1.IOpenerService),
        __param(6, product_1.IProductService)
    ], UpdateAllAction);
    exports.UpdateAllAction = UpdateAllAction;
    let ReloadAction = class ReloadAction extends ExtensionAction {
        constructor(extensionsWorkbenchService, windowService, extensionService, extensionEnablementService, extensionManagementServerService) {
            super('extensions.reload', nls_1.localize('reloadAction', "Reload"), ReloadAction.DisabledClass, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.windowService = windowService;
            this.extensionService = extensionService;
            this.extensionEnablementService = extensionEnablementService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.updateWhenCounterExtensionChanges = true;
            this._runningExtensions = null;
            this._register(this.extensionService.onDidChangeExtensions(this.updateRunningExtensions, this));
            this.updateRunningExtensions();
        }
        updateRunningExtensions() {
            this.extensionService.getExtensions().then(runningExtensions => { this._runningExtensions = runningExtensions; this.update(); });
        }
        update() {
            this.enabled = false;
            this.tooltip = '';
            if (!this.extension || !this._runningExtensions) {
                return;
            }
            const state = this.extension.state;
            if (state === 0 /* Installing */ || state === 2 /* Uninstalling */) {
                return;
            }
            if (this.extension.local && this.extension.local.manifest && this.extension.local.manifest.contributes && this.extension.local.manifest.contributes.localizations && this.extension.local.manifest.contributes.localizations.length > 0) {
                return;
            }
            this.computeReloadState();
            this.class = this.enabled ? ReloadAction.EnabledClass : ReloadAction.DisabledClass;
        }
        computeReloadState() {
            if (!this._runningExtensions) {
                return;
            }
            const isUninstalled = this.extension.state === 3 /* Uninstalled */;
            const runningExtension = this._runningExtensions.filter(e => extensionManagementUtil_1.areSameExtensions({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier))[0];
            const isSameExtensionRunning = runningExtension && this.extension.server === this.extensionManagementServerService.getExtensionManagementServer(runningExtension.extensionLocation);
            if (isUninstalled) {
                if (isSameExtensionRunning && !this.extensionService.canRemoveExtension(runningExtension)) {
                    this.enabled = true;
                    this.label = nls_1.localize('reloadRequired', "Reload Required");
                    this.tooltip = nls_1.localize('postUninstallTooltip', "Please reload Visual Studio Code to complete the uninstallation of this extension.");
                    aria_1.alert(nls_1.localize('uninstallExtensionComplete', "Please reload Visual Studio Code to complete the uninstallation of the extension {0}.", this.extension.displayName));
                }
                return;
            }
            if (this.extension.local) {
                const isEnabled = this.extensionEnablementService.isEnabled(this.extension.local);
                // Extension is runningÎ
                if (runningExtension) {
                    if (isEnabled) {
                        if (!this.extensionService.canAddExtension(toExtensionDescription(this.extension.local))) {
                            if (isSameExtensionRunning) {
                                if (this.extension.version !== runningExtension.version) {
                                    this.enabled = true;
                                    this.label = nls_1.localize('reloadRequired', "Reload Required");
                                    this.tooltip = nls_1.localize('postUpdateTooltip', "Please reload Visual Studio Code to enable the updated extension.");
                                }
                            }
                            else {
                                this.enabled = true;
                                this.label = nls_1.localize('reloadRequired', "Reload Required");
                                this.tooltip = nls_1.localize('postEnableTooltip', "Please reload Visual Studio Code to enable this extension.");
                            }
                        }
                    }
                    else {
                        if (isSameExtensionRunning) {
                            this.enabled = true;
                            this.label = nls_1.localize('reloadRequired', "Reload Required");
                            this.tooltip = nls_1.localize('postDisableTooltip', "Please reload Visual Studio Code to disable this extension.");
                        }
                    }
                    return;
                }
                // Extension is not running
                else {
                    if (isEnabled && !this.extensionService.canAddExtension(toExtensionDescription(this.extension.local))) {
                        this.enabled = true;
                        this.label = nls_1.localize('reloadRequired', "Reload Required");
                        this.tooltip = nls_1.localize('postEnableTooltip', "Please reload Visual Studio Code to enable this extension.");
                        return;
                    }
                    const otherServer = this.extension.server ? this.extension.server === this.extensionManagementServerService.localExtensionManagementServer ? this.extensionManagementServerService.remoteExtensionManagementServer : this.extensionManagementServerService.localExtensionManagementServer : null;
                    if (otherServer && this.extension.enablementState === 0 /* DisabledByExtensionKind */) {
                        const extensionInOtherServer = this.extensionsWorkbenchService.local.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, this.extension.identifier) && e.server === otherServer)[0];
                        // Same extension in other server exists and
                        if (extensionInOtherServer && extensionInOtherServer.local && this.extensionEnablementService.isEnabled(extensionInOtherServer.local)) {
                            this.enabled = true;
                            this.label = nls_1.localize('reloadRequired', "Reload Required");
                            this.tooltip = nls_1.localize('postEnableTooltip', "Please reload Visual Studio Code to enable this extension.");
                            aria_1.alert(nls_1.localize('installExtensionComplete', "Installing extension {0} is completed. Please reload Visual Studio Code to enable it.", this.extension.displayName));
                            return;
                        }
                    }
                }
            }
        }
        run() {
            return Promise.resolve(this.windowService.reloadWindow());
        }
    };
    ReloadAction.EnabledClass = 'extension-action reload';
    ReloadAction.DisabledClass = `${ReloadAction.EnabledClass} disabled`;
    ReloadAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, windows_1.IWindowService),
        __param(2, extensions_3.IExtensionService),
        __param(3, extensionManagement_2.IExtensionEnablementService),
        __param(4, extensionManagement_2.IExtensionManagementServerService)
    ], ReloadAction);
    exports.ReloadAction = ReloadAction;
    let SetColorThemeAction = class SetColorThemeAction extends ExtensionAction {
        constructor(colorThemes, extensionService, workbenchThemeService, quickInputService, configurationService) {
            super(`extensions.colorTheme`, nls_1.localize('color theme', "Set Color Theme"), SetColorThemeAction.DisabledClass, false);
            this.colorThemes = colorThemes;
            this.workbenchThemeService = workbenchThemeService;
            this.quickInputService = quickInputService;
            this.configurationService = configurationService;
            this._register(event_1.Event.any(extensionService.onDidChangeExtensions, workbenchThemeService.onDidColorThemeChange)(() => this.update(), this));
            this.update();
        }
        static getColorThemes(colorThemes, extension) {
            return colorThemes.filter(c => c.extensionData && extensions_2.ExtensionIdentifier.equals(c.extensionData.extensionId, extension.identifier.id));
        }
        update() {
            this.enabled = false;
            if (this.extension) {
                const isInstalled = this.extension.state === 1 /* Installed */;
                if (isInstalled) {
                    const extensionThemes = SetColorThemeAction.getColorThemes(this.colorThemes, this.extension);
                    this.enabled = extensionThemes.length > 0;
                }
            }
            this.class = this.enabled ? SetColorThemeAction.EnabledClass : SetColorThemeAction.DisabledClass;
        }
        run({ showCurrentTheme, ignoreFocusLost } = { showCurrentTheme: false, ignoreFocusLost: false }) {
            return __awaiter(this, void 0, void 0, function* () {
                this.update();
                if (!this.enabled) {
                    return;
                }
                let extensionThemes = SetColorThemeAction.getColorThemes(this.colorThemes, this.extension);
                const currentTheme = this.colorThemes.filter(t => t.settingsId === this.configurationService.getValue(workbenchThemeService_1.COLOR_THEME_SETTING))[0];
                showCurrentTheme = showCurrentTheme || extensionThemes.some(t => t.id === currentTheme.id);
                if (showCurrentTheme) {
                    extensionThemes = extensionThemes.filter(t => t.id !== currentTheme.id);
                }
                const delayer = new async_1.Delayer(100);
                const picks = [];
                picks.push(...extensionThemes.map(theme => ({ label: theme.label, id: theme.id })));
                if (showCurrentTheme) {
                    picks.push({ type: 'separator', label: nls_1.localize('current', "Current") });
                    picks.push({ label: currentTheme.label, id: currentTheme.id });
                }
                const pickedTheme = yield this.quickInputService.pick(picks, {
                    placeHolder: nls_1.localize('select color theme', "Select Color Theme"),
                    onDidFocus: item => delayer.trigger(() => this.workbenchThemeService.setColorTheme(item.id, undefined)),
                    ignoreFocusLost
                });
                let confValue = this.configurationService.inspect(workbenchThemeService_1.COLOR_THEME_SETTING);
                const target = typeof confValue.workspace !== 'undefined' ? 4 /* WORKSPACE */ : 1 /* USER */;
                return this.workbenchThemeService.setColorTheme(pickedTheme ? pickedTheme.id : currentTheme.id, target);
            });
        }
    };
    SetColorThemeAction.EnabledClass = 'extension-action theme';
    SetColorThemeAction.DisabledClass = `${SetColorThemeAction.EnabledClass} disabled`;
    SetColorThemeAction = __decorate([
        __param(1, extensions_3.IExtensionService),
        __param(2, workbenchThemeService_1.IWorkbenchThemeService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, configuration_1.IConfigurationService)
    ], SetColorThemeAction);
    exports.SetColorThemeAction = SetColorThemeAction;
    let SetFileIconThemeAction = class SetFileIconThemeAction extends ExtensionAction {
        constructor(fileIconThemes, extensionService, workbenchThemeService, quickInputService, configurationService) {
            super(`extensions.fileIconTheme`, nls_1.localize('file icon theme', "Set File Icon Theme"), SetFileIconThemeAction.DisabledClass, false);
            this.fileIconThemes = fileIconThemes;
            this.workbenchThemeService = workbenchThemeService;
            this.quickInputService = quickInputService;
            this.configurationService = configurationService;
            this._register(event_1.Event.any(extensionService.onDidChangeExtensions, workbenchThemeService.onDidFileIconThemeChange)(() => this.update(), this));
            this.update();
        }
        static getFileIconThemes(fileIconThemes, extension) {
            return fileIconThemes.filter(c => c.extensionData && extensions_2.ExtensionIdentifier.equals(c.extensionData.extensionId, extension.identifier.id));
        }
        update() {
            this.enabled = false;
            if (this.extension) {
                const isInstalled = this.extension.state === 1 /* Installed */;
                if (isInstalled) {
                    const extensionThemes = SetFileIconThemeAction.getFileIconThemes(this.fileIconThemes, this.extension);
                    this.enabled = extensionThemes.length > 0;
                }
            }
            this.class = this.enabled ? SetFileIconThemeAction.EnabledClass : SetFileIconThemeAction.DisabledClass;
        }
        run({ showCurrentTheme, ignoreFocusLost } = { showCurrentTheme: false, ignoreFocusLost: false }) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.update();
                if (!this.enabled) {
                    return;
                }
                let extensionThemes = SetFileIconThemeAction.getFileIconThemes(this.fileIconThemes, this.extension);
                const currentTheme = this.fileIconThemes.filter(t => t.settingsId === this.configurationService.getValue(workbenchThemeService_1.ICON_THEME_SETTING))[0] || this.workbenchThemeService.getFileIconTheme();
                showCurrentTheme = showCurrentTheme || extensionThemes.some(t => t.id === currentTheme.id);
                if (showCurrentTheme) {
                    extensionThemes = extensionThemes.filter(t => t.id !== currentTheme.id);
                }
                const delayer = new async_1.Delayer(100);
                const picks = [];
                picks.push(...extensionThemes.map(theme => ({ label: theme.label, id: theme.id })));
                if (showCurrentTheme && currentTheme.label) {
                    picks.push({ type: 'separator', label: nls_1.localize('current', "Current") });
                    picks.push({ label: currentTheme.label, id: currentTheme.id });
                }
                const pickedTheme = yield this.quickInputService.pick(picks, {
                    placeHolder: nls_1.localize('select file icon theme', "Select File Icon Theme"),
                    onDidFocus: item => delayer.trigger(() => this.workbenchThemeService.setFileIconTheme(item.id, undefined)),
                    ignoreFocusLost
                });
                let confValue = this.configurationService.inspect(workbenchThemeService_1.ICON_THEME_SETTING);
                const target = typeof confValue.workspace !== 'undefined' ? 4 /* WORKSPACE */ : 1 /* USER */;
                return this.workbenchThemeService.setFileIconTheme(pickedTheme ? pickedTheme.id : currentTheme.id, target);
            });
        }
    };
    SetFileIconThemeAction.EnabledClass = 'extension-action theme';
    SetFileIconThemeAction.DisabledClass = `${SetFileIconThemeAction.EnabledClass} disabled`;
    SetFileIconThemeAction = __decorate([
        __param(1, extensions_3.IExtensionService),
        __param(2, workbenchThemeService_1.IWorkbenchThemeService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, configuration_1.IConfigurationService)
    ], SetFileIconThemeAction);
    exports.SetFileIconThemeAction = SetFileIconThemeAction;
    let OpenExtensionsViewletAction = class OpenExtensionsViewletAction extends viewlet_1.ShowViewletAction {
        constructor(id, label, viewletService, editorGroupService, layoutService) {
            super(id, label, extensions_1.VIEWLET_ID, viewletService, editorGroupService, layoutService);
        }
    };
    OpenExtensionsViewletAction.ID = extensions_1.VIEWLET_ID;
    OpenExtensionsViewletAction.LABEL = nls_1.localize('toggleExtensionsViewlet', "Show Extensions");
    OpenExtensionsViewletAction = __decorate([
        __param(2, viewlet_2.IViewletService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, layoutService_1.IWorkbenchLayoutService)
    ], OpenExtensionsViewletAction);
    exports.OpenExtensionsViewletAction = OpenExtensionsViewletAction;
    class InstallExtensionsAction extends OpenExtensionsViewletAction {
    }
    InstallExtensionsAction.ID = 'workbench.extensions.action.installExtensions';
    InstallExtensionsAction.LABEL = nls_1.localize('installExtensions', "Install Extensions");
    exports.InstallExtensionsAction = InstallExtensionsAction;
    let ShowEnabledExtensionsAction = class ShowEnabledExtensionsAction extends actions_1.Action {
        constructor(id, label, viewletService) {
            super(id, label, undefined, true);
            this.viewletService = viewletService;
        }
        run() {
            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                .then(viewlet => viewlet)
                .then(viewlet => {
                viewlet.search('@enabled ');
                viewlet.focus();
            });
        }
    };
    ShowEnabledExtensionsAction.ID = 'workbench.extensions.action.showEnabledExtensions';
    ShowEnabledExtensionsAction.LABEL = nls_1.localize('showEnabledExtensions', "Show Enabled Extensions");
    ShowEnabledExtensionsAction = __decorate([
        __param(2, viewlet_2.IViewletService)
    ], ShowEnabledExtensionsAction);
    exports.ShowEnabledExtensionsAction = ShowEnabledExtensionsAction;
    let ShowInstalledExtensionsAction = class ShowInstalledExtensionsAction extends actions_1.Action {
        constructor(id, label, viewletService) {
            super(id, label, undefined, true);
            this.viewletService = viewletService;
        }
        run() {
            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                .then(viewlet => viewlet)
                .then(viewlet => {
                viewlet.search('@installed ');
                viewlet.focus();
            });
        }
    };
    ShowInstalledExtensionsAction.ID = 'workbench.extensions.action.showInstalledExtensions';
    ShowInstalledExtensionsAction.LABEL = nls_1.localize('showInstalledExtensions', "Show Installed Extensions");
    ShowInstalledExtensionsAction = __decorate([
        __param(2, viewlet_2.IViewletService)
    ], ShowInstalledExtensionsAction);
    exports.ShowInstalledExtensionsAction = ShowInstalledExtensionsAction;
    let ShowDisabledExtensionsAction = class ShowDisabledExtensionsAction extends actions_1.Action {
        constructor(id, label, viewletService) {
            super(id, label, 'null', true);
            this.viewletService = viewletService;
        }
        run() {
            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                .then(viewlet => viewlet)
                .then(viewlet => {
                viewlet.search('@disabled ');
                viewlet.focus();
            });
        }
    };
    ShowDisabledExtensionsAction.ID = 'workbench.extensions.action.showDisabledExtensions';
    ShowDisabledExtensionsAction.LABEL = nls_1.localize('showDisabledExtensions', "Show Disabled Extensions");
    ShowDisabledExtensionsAction = __decorate([
        __param(2, viewlet_2.IViewletService)
    ], ShowDisabledExtensionsAction);
    exports.ShowDisabledExtensionsAction = ShowDisabledExtensionsAction;
    let ClearExtensionsInputAction = class ClearExtensionsInputAction extends actions_1.Action {
        constructor(id, label, onSearchChange, value, viewletService) {
            super(id, label, 'clear-extensions', true);
            this.viewletService = viewletService;
            this.onSearchChange(value);
            this._register(onSearchChange(this.onSearchChange, this));
        }
        onSearchChange(value) {
            this.enabled = !!value;
        }
        run() {
            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                .then(viewlet => viewlet)
                .then(viewlet => {
                viewlet.search('');
                viewlet.focus();
            });
        }
    };
    ClearExtensionsInputAction.ID = 'workbench.extensions.action.clearExtensionsInput';
    ClearExtensionsInputAction.LABEL = nls_1.localize('clearExtensionsInput', "Clear Extensions Input");
    ClearExtensionsInputAction = __decorate([
        __param(4, viewlet_2.IViewletService)
    ], ClearExtensionsInputAction);
    exports.ClearExtensionsInputAction = ClearExtensionsInputAction;
    let ShowBuiltInExtensionsAction = class ShowBuiltInExtensionsAction extends actions_1.Action {
        constructor(id, label, viewletService) {
            super(id, label, undefined, true);
            this.viewletService = viewletService;
        }
        run() {
            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                .then(viewlet => viewlet)
                .then(viewlet => {
                viewlet.search('@builtin ');
                viewlet.focus();
            });
        }
    };
    ShowBuiltInExtensionsAction.ID = 'workbench.extensions.action.listBuiltInExtensions';
    ShowBuiltInExtensionsAction.LABEL = nls_1.localize('showBuiltInExtensions', "Show Built-in Extensions");
    ShowBuiltInExtensionsAction = __decorate([
        __param(2, viewlet_2.IViewletService)
    ], ShowBuiltInExtensionsAction);
    exports.ShowBuiltInExtensionsAction = ShowBuiltInExtensionsAction;
    let ShowOutdatedExtensionsAction = class ShowOutdatedExtensionsAction extends actions_1.Action {
        constructor(id, label, viewletService) {
            super(id, label, undefined, true);
            this.viewletService = viewletService;
        }
        run() {
            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                .then(viewlet => viewlet)
                .then(viewlet => {
                viewlet.search('@outdated ');
                viewlet.focus();
            });
        }
    };
    ShowOutdatedExtensionsAction.ID = 'workbench.extensions.action.listOutdatedExtensions';
    ShowOutdatedExtensionsAction.LABEL = nls_1.localize('showOutdatedExtensions', "Show Outdated Extensions");
    ShowOutdatedExtensionsAction = __decorate([
        __param(2, viewlet_2.IViewletService)
    ], ShowOutdatedExtensionsAction);
    exports.ShowOutdatedExtensionsAction = ShowOutdatedExtensionsAction;
    let ShowPopularExtensionsAction = class ShowPopularExtensionsAction extends actions_1.Action {
        constructor(id, label, viewletService) {
            super(id, label, undefined, true);
            this.viewletService = viewletService;
        }
        run() {
            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                .then(viewlet => viewlet)
                .then(viewlet => {
                viewlet.search('@sort:installs ');
                viewlet.focus();
            });
        }
    };
    ShowPopularExtensionsAction.ID = 'workbench.extensions.action.showPopularExtensions';
    ShowPopularExtensionsAction.LABEL = nls_1.localize('showPopularExtensions', "Show Popular Extensions");
    ShowPopularExtensionsAction = __decorate([
        __param(2, viewlet_2.IViewletService)
    ], ShowPopularExtensionsAction);
    exports.ShowPopularExtensionsAction = ShowPopularExtensionsAction;
    let ShowRecommendedExtensionsAction = class ShowRecommendedExtensionsAction extends actions_1.Action {
        constructor(id, label, viewletService) {
            super(id, label, undefined, true);
            this.viewletService = viewletService;
        }
        run() {
            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                .then(viewlet => viewlet)
                .then(viewlet => {
                viewlet.search('@recommended ');
                viewlet.focus();
            });
        }
    };
    ShowRecommendedExtensionsAction.ID = 'workbench.extensions.action.showRecommendedExtensions';
    ShowRecommendedExtensionsAction.LABEL = nls_1.localize('showRecommendedExtensions', "Show Recommended Extensions");
    ShowRecommendedExtensionsAction = __decorate([
        __param(2, viewlet_2.IViewletService)
    ], ShowRecommendedExtensionsAction);
    exports.ShowRecommendedExtensionsAction = ShowRecommendedExtensionsAction;
    let InstallWorkspaceRecommendedExtensionsAction = class InstallWorkspaceRecommendedExtensionsAction extends actions_1.Action {
        constructor(id = InstallWorkspaceRecommendedExtensionsAction.ID, label = InstallWorkspaceRecommendedExtensionsAction.LABEL, recommendations, viewletService, notificationService, instantiationService, openerService, extensionWorkbenchService, configurationService, extensionManagementServerService, productService) {
            super(id, label, 'extension-action');
            this.viewletService = viewletService;
            this.notificationService = notificationService;
            this.instantiationService = instantiationService;
            this.openerService = openerService;
            this.extensionWorkbenchService = extensionWorkbenchService;
            this.configurationService = configurationService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.productService = productService;
            this._recommendations = [];
            this.recommendations = recommendations;
        }
        get recommendations() { return this._recommendations; }
        set recommendations(recommendations) { this._recommendations = recommendations; this.enabled = this._recommendations.length > 0; }
        run() {
            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                .then(viewlet => viewlet)
                .then(viewlet => {
                viewlet.search('@recommended ');
                viewlet.focus();
                const names = this.recommendations.map(({ extensionId }) => extensionId);
                return this.extensionWorkbenchService.queryGallery({ names, source: 'install-all-workspace-recommendations' }, cancellation_1.CancellationToken.None).then(pager => {
                    let installPromises = [];
                    let model = new paging_1.PagedModel(pager);
                    for (let i = 0; i < pager.total; i++) {
                        installPromises.push(model.resolve(i, cancellation_1.CancellationToken.None).then(e => this.installExtension(e)));
                    }
                    return Promise.all(installPromises);
                });
            });
        }
        installExtension(extension) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    if (extension.local && extension.gallery) {
                        if (extensionsUtil_1.isUIExtension(extension.local.manifest, this.productService, this.configurationService)) {
                            if (this.extensionManagementServerService.localExtensionManagementServer) {
                                yield this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.installFromGallery(extension.gallery);
                                return;
                            }
                        }
                        else if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                            yield this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.installFromGallery(extension.gallery);
                            return;
                        }
                    }
                    yield this.extensionWorkbenchService.install(extension);
                }
                catch (err) {
                    console.error(err);
                    return promptDownloadManually(extension.gallery, nls_1.localize('failedToInstall', "Failed to install \'{0}\'.", extension.identifier.id), err, this.instantiationService, this.notificationService, this.openerService, this.productService);
                }
            });
        }
    };
    InstallWorkspaceRecommendedExtensionsAction.ID = 'workbench.extensions.action.installWorkspaceRecommendedExtensions';
    InstallWorkspaceRecommendedExtensionsAction.LABEL = nls_1.localize('installWorkspaceRecommendedExtensions', "Install All Workspace Recommended Extensions");
    InstallWorkspaceRecommendedExtensionsAction = __decorate([
        __param(3, viewlet_2.IViewletService),
        __param(4, notification_1.INotificationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, opener_1.IOpenerService),
        __param(7, extensions_1.IExtensionsWorkbenchService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, extensionManagement_2.IExtensionManagementServerService),
        __param(10, product_1.IProductService)
    ], InstallWorkspaceRecommendedExtensionsAction);
    exports.InstallWorkspaceRecommendedExtensionsAction = InstallWorkspaceRecommendedExtensionsAction;
    let InstallRecommendedExtensionAction = class InstallRecommendedExtensionAction extends actions_1.Action {
        constructor(extensionId, viewletService, notificationService, instantiationService, openerService, extensionWorkbenchService, productService) {
            super(InstallRecommendedExtensionAction.ID, InstallRecommendedExtensionAction.LABEL, undefined, false);
            this.viewletService = viewletService;
            this.notificationService = notificationService;
            this.instantiationService = instantiationService;
            this.openerService = openerService;
            this.extensionWorkbenchService = extensionWorkbenchService;
            this.productService = productService;
            this.extensionId = extensionId;
        }
        run() {
            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                .then(viewlet => viewlet)
                .then(viewlet => {
                viewlet.search(`@id:${this.extensionId}`);
                viewlet.focus();
                return this.extensionWorkbenchService.queryGallery({ names: [this.extensionId], source: 'install-recommendation', pageSize: 1 }, cancellation_1.CancellationToken.None)
                    .then(pager => {
                    if (pager && pager.firstPage && pager.firstPage.length) {
                        const extension = pager.firstPage[0];
                        return this.extensionWorkbenchService.install(extension)
                            .then(() => null, err => {
                            console.error(err);
                            return promptDownloadManually(extension.gallery, nls_1.localize('failedToInstall', "Failed to install \'{0}\'.", extension.identifier.id), err, this.instantiationService, this.notificationService, this.openerService, this.productService);
                        });
                    }
                    return null;
                });
            });
        }
    };
    InstallRecommendedExtensionAction.ID = 'workbench.extensions.action.installRecommendedExtension';
    InstallRecommendedExtensionAction.LABEL = nls_1.localize('installRecommendedExtension', "Install Recommended Extension");
    InstallRecommendedExtensionAction = __decorate([
        __param(1, viewlet_2.IViewletService),
        __param(2, notification_1.INotificationService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, opener_1.IOpenerService),
        __param(5, extensions_1.IExtensionsWorkbenchService),
        __param(6, product_1.IProductService)
    ], InstallRecommendedExtensionAction);
    exports.InstallRecommendedExtensionAction = InstallRecommendedExtensionAction;
    let IgnoreExtensionRecommendationAction = class IgnoreExtensionRecommendationAction extends actions_1.Action {
        constructor(extensionsTipsService) {
            super(IgnoreExtensionRecommendationAction.ID, 'Ignore Recommendation');
            this.extensionsTipsService = extensionsTipsService;
            this.class = IgnoreExtensionRecommendationAction.Class;
            this.tooltip = nls_1.localize('ignoreExtensionRecommendation', "Do not recommend this extension again");
            this.enabled = true;
        }
        run() {
            this.extensionsTipsService.toggleIgnoredRecommendation(this.extension.identifier.id, true);
            return Promise.resolve();
        }
    };
    IgnoreExtensionRecommendationAction.ID = 'extensions.ignore';
    IgnoreExtensionRecommendationAction.Class = 'extension-action ignore';
    IgnoreExtensionRecommendationAction = __decorate([
        __param(0, extensionManagement_2.IExtensionTipsService)
    ], IgnoreExtensionRecommendationAction);
    exports.IgnoreExtensionRecommendationAction = IgnoreExtensionRecommendationAction;
    let UndoIgnoreExtensionRecommendationAction = class UndoIgnoreExtensionRecommendationAction extends actions_1.Action {
        constructor(extensionsTipsService) {
            super(UndoIgnoreExtensionRecommendationAction.ID, 'Undo');
            this.extensionsTipsService = extensionsTipsService;
            this.class = UndoIgnoreExtensionRecommendationAction.Class;
            this.tooltip = nls_1.localize('undo', "Undo");
            this.enabled = true;
        }
        run() {
            this.extensionsTipsService.toggleIgnoredRecommendation(this.extension.identifier.id, false);
            return Promise.resolve();
        }
    };
    UndoIgnoreExtensionRecommendationAction.ID = 'extensions.ignore';
    UndoIgnoreExtensionRecommendationAction.Class = 'extension-action undo-ignore';
    UndoIgnoreExtensionRecommendationAction = __decorate([
        __param(0, extensionManagement_2.IExtensionTipsService)
    ], UndoIgnoreExtensionRecommendationAction);
    exports.UndoIgnoreExtensionRecommendationAction = UndoIgnoreExtensionRecommendationAction;
    let ShowRecommendedKeymapExtensionsAction = class ShowRecommendedKeymapExtensionsAction extends actions_1.Action {
        constructor(id, label, viewletService) {
            super(id, label, undefined, true);
            this.viewletService = viewletService;
        }
        run() {
            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                .then(viewlet => viewlet)
                .then(viewlet => {
                viewlet.search('@recommended:keymaps ');
                viewlet.focus();
            });
        }
    };
    ShowRecommendedKeymapExtensionsAction.ID = 'workbench.extensions.action.showRecommendedKeymapExtensions';
    ShowRecommendedKeymapExtensionsAction.SHORT_LABEL = nls_1.localize('showRecommendedKeymapExtensionsShort', "Keymaps");
    ShowRecommendedKeymapExtensionsAction = __decorate([
        __param(2, viewlet_2.IViewletService)
    ], ShowRecommendedKeymapExtensionsAction);
    exports.ShowRecommendedKeymapExtensionsAction = ShowRecommendedKeymapExtensionsAction;
    let ShowLanguageExtensionsAction = class ShowLanguageExtensionsAction extends actions_1.Action {
        constructor(id, label, viewletService) {
            super(id, label, undefined, true);
            this.viewletService = viewletService;
        }
        run() {
            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                .then(viewlet => viewlet)
                .then(viewlet => {
                viewlet.search('@category:"programming languages" @sort:installs ');
                viewlet.focus();
            });
        }
    };
    ShowLanguageExtensionsAction.ID = 'workbench.extensions.action.showLanguageExtensions';
    ShowLanguageExtensionsAction.SHORT_LABEL = nls_1.localize('showLanguageExtensionsShort', "Language Extensions");
    ShowLanguageExtensionsAction = __decorate([
        __param(2, viewlet_2.IViewletService)
    ], ShowLanguageExtensionsAction);
    exports.ShowLanguageExtensionsAction = ShowLanguageExtensionsAction;
    let ShowAzureExtensionsAction = class ShowAzureExtensionsAction extends actions_1.Action {
        constructor(id, label, viewletService) {
            super(id, label, undefined, true);
            this.viewletService = viewletService;
        }
        run() {
            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                .then(viewlet => viewlet)
                .then(viewlet => {
                viewlet.search('@sort:installs azure ');
                viewlet.focus();
            });
        }
    };
    ShowAzureExtensionsAction.ID = 'workbench.extensions.action.showAzureExtensions';
    ShowAzureExtensionsAction.SHORT_LABEL = nls_1.localize('showAzureExtensionsShort', "Azure Extensions");
    ShowAzureExtensionsAction = __decorate([
        __param(2, viewlet_2.IViewletService)
    ], ShowAzureExtensionsAction);
    exports.ShowAzureExtensionsAction = ShowAzureExtensionsAction;
    let ChangeSortAction = class ChangeSortAction extends actions_1.Action {
        constructor(id, label, onSearchChange, sortBy, viewletService) {
            super(id, label, undefined, true);
            this.sortBy = sortBy;
            this.viewletService = viewletService;
            if (sortBy === undefined) {
                throw new Error('bad arguments');
            }
            this.query = extensionQuery_1.Query.parse('');
            this.enabled = false;
            this._register(onSearchChange(this.onSearchChange, this));
        }
        onSearchChange(value) {
            const query = extensionQuery_1.Query.parse(value);
            this.query = new extensionQuery_1.Query(query.value, this.sortBy || query.sortBy, query.groupBy);
            this.enabled = !!value && this.query.isValid() && !this.query.equals(query);
        }
        run() {
            return this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                .then(viewlet => viewlet)
                .then(viewlet => {
                viewlet.search(this.query.toString());
                viewlet.focus();
            });
        }
    };
    ChangeSortAction = __decorate([
        __param(4, viewlet_2.IViewletService)
    ], ChangeSortAction);
    exports.ChangeSortAction = ChangeSortAction;
    let ConfigureRecommendedExtensionsCommandsContributor = class ConfigureRecommendedExtensionsCommandsContributor extends lifecycle_1.Disposable {
        constructor(contextKeyService, workspaceContextService, editorService) {
            super();
            this.workspaceContextKey = new contextkey_1.RawContextKey('workspaceRecommendations', true);
            this.workspaceFolderContextKey = new contextkey_1.RawContextKey('workspaceFolderRecommendations', true);
            this.addToWorkspaceRecommendationsContextKey = new contextkey_1.RawContextKey('addToWorkspaceRecommendations', false);
            this.addToWorkspaceFolderRecommendationsContextKey = new contextkey_1.RawContextKey('addToWorkspaceFolderRecommendations', false);
            const boundWorkspaceContextKey = this.workspaceContextKey.bindTo(contextKeyService);
            boundWorkspaceContextKey.set(workspaceContextService.getWorkbenchState() === 3 /* WORKSPACE */);
            this._register(workspaceContextService.onDidChangeWorkbenchState(() => boundWorkspaceContextKey.set(workspaceContextService.getWorkbenchState() === 3 /* WORKSPACE */)));
            const boundWorkspaceFolderContextKey = this.workspaceFolderContextKey.bindTo(contextKeyService);
            boundWorkspaceFolderContextKey.set(workspaceContextService.getWorkspace().folders.length > 0);
            this._register(workspaceContextService.onDidChangeWorkspaceFolders(() => boundWorkspaceFolderContextKey.set(workspaceContextService.getWorkspace().folders.length > 0)));
            const boundAddToWorkspaceRecommendationsContextKey = this.addToWorkspaceRecommendationsContextKey.bindTo(contextKeyService);
            boundAddToWorkspaceRecommendationsContextKey.set(editorService.activeEditor instanceof extensionsInput_1.ExtensionsInput && workspaceContextService.getWorkbenchState() === 3 /* WORKSPACE */);
            this._register(editorService.onDidActiveEditorChange(() => boundAddToWorkspaceRecommendationsContextKey.set(editorService.activeEditor instanceof extensionsInput_1.ExtensionsInput && workspaceContextService.getWorkbenchState() === 3 /* WORKSPACE */)));
            this._register(workspaceContextService.onDidChangeWorkbenchState(() => boundAddToWorkspaceRecommendationsContextKey.set(editorService.activeEditor instanceof extensionsInput_1.ExtensionsInput && workspaceContextService.getWorkbenchState() === 3 /* WORKSPACE */)));
            const boundAddToWorkspaceFolderRecommendationsContextKey = this.addToWorkspaceFolderRecommendationsContextKey.bindTo(contextKeyService);
            boundAddToWorkspaceFolderRecommendationsContextKey.set(editorService.activeEditor instanceof extensionsInput_1.ExtensionsInput);
            this._register(editorService.onDidActiveEditorChange(() => boundAddToWorkspaceFolderRecommendationsContextKey.set(editorService.activeEditor instanceof extensionsInput_1.ExtensionsInput)));
            this.registerCommands();
        }
        registerCommands() {
            commands_1.CommandsRegistry.registerCommand(ConfigureWorkspaceRecommendedExtensionsAction.ID, serviceAccessor => {
                serviceAccessor.get(instantiation_1.IInstantiationService).createInstance(ConfigureWorkspaceRecommendedExtensionsAction, ConfigureWorkspaceRecommendedExtensionsAction.ID, ConfigureWorkspaceRecommendedExtensionsAction.LABEL).run();
            });
            actions_2.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
                command: {
                    id: ConfigureWorkspaceRecommendedExtensionsAction.ID,
                    title: { value: `${extensionManagement_1.ExtensionsLabel}: ${ConfigureWorkspaceRecommendedExtensionsAction.LABEL}`, original: 'Extensions: Configure Recommended Extensions (Workspace)' },
                    category: nls_1.localize('extensions', "Extensions")
                },
                when: this.workspaceContextKey
            });
            commands_1.CommandsRegistry.registerCommand(ConfigureWorkspaceFolderRecommendedExtensionsAction.ID, serviceAccessor => {
                serviceAccessor.get(instantiation_1.IInstantiationService).createInstance(ConfigureWorkspaceFolderRecommendedExtensionsAction, ConfigureWorkspaceFolderRecommendedExtensionsAction.ID, ConfigureWorkspaceFolderRecommendedExtensionsAction.LABEL).run();
            });
            actions_2.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
                command: {
                    id: ConfigureWorkspaceFolderRecommendedExtensionsAction.ID,
                    title: { value: `${extensionManagement_1.ExtensionsLabel}: ${ConfigureWorkspaceFolderRecommendedExtensionsAction.LABEL}`, original: 'Extensions: Configure Recommended Extensions (Workspace Folder)' },
                    category: nls_1.localize('extensions', "Extensions")
                },
                when: this.workspaceFolderContextKey
            });
            commands_1.CommandsRegistry.registerCommand(AddToWorkspaceRecommendationsAction.ADD_ID, serviceAccessor => {
                serviceAccessor.get(instantiation_1.IInstantiationService)
                    .createInstance(AddToWorkspaceRecommendationsAction, AddToWorkspaceRecommendationsAction.ADD_ID, AddToWorkspaceRecommendationsAction.ADD_LABEL)
                    .run(AddToWorkspaceRecommendationsAction.ADD);
            });
            actions_2.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
                command: {
                    id: AddToWorkspaceRecommendationsAction.ADD_ID,
                    title: { value: `${extensionManagement_1.ExtensionsLabel}: ${AddToWorkspaceRecommendationsAction.ADD_LABEL}`, original: 'Extensions: Add to Recommended Extensions (Workspace)' },
                    category: nls_1.localize('extensions', "Extensions")
                },
                when: this.addToWorkspaceRecommendationsContextKey
            });
            commands_1.CommandsRegistry.registerCommand(AddToWorkspaceFolderRecommendationsAction.ADD_ID, serviceAccessor => {
                serviceAccessor.get(instantiation_1.IInstantiationService)
                    .createInstance(AddToWorkspaceFolderRecommendationsAction, AddToWorkspaceFolderRecommendationsAction.ADD_ID, AddToWorkspaceFolderRecommendationsAction.ADD_LABEL)
                    .run(AddToWorkspaceRecommendationsAction.ADD);
            });
            actions_2.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
                command: {
                    id: AddToWorkspaceFolderRecommendationsAction.ADD_ID,
                    title: { value: `${extensionManagement_1.ExtensionsLabel}: ${AddToWorkspaceFolderRecommendationsAction.ADD_LABEL}`, original: 'Extensions: Add to Recommended Extensions (Workspace Folder)' },
                    category: nls_1.localize('extensions', "Extensions")
                },
                when: this.addToWorkspaceFolderRecommendationsContextKey
            });
            commands_1.CommandsRegistry.registerCommand(AddToWorkspaceRecommendationsAction.IGNORE_ID, serviceAccessor => {
                serviceAccessor.get(instantiation_1.IInstantiationService)
                    .createInstance(AddToWorkspaceRecommendationsAction, AddToWorkspaceRecommendationsAction.IGNORE_ID, AddToWorkspaceRecommendationsAction.IGNORE_LABEL)
                    .run(AddToWorkspaceRecommendationsAction.IGNORE);
            });
            actions_2.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
                command: {
                    id: AddToWorkspaceRecommendationsAction.IGNORE_ID,
                    title: { value: `${extensionManagement_1.ExtensionsLabel}: ${AddToWorkspaceRecommendationsAction.IGNORE_LABEL}`, original: 'Extensions: Ignore Recommended Extension (Workspace)' },
                    category: nls_1.localize('extensions', "Extensions")
                },
                when: this.addToWorkspaceRecommendationsContextKey
            });
            commands_1.CommandsRegistry.registerCommand(AddToWorkspaceFolderRecommendationsAction.IGNORE_ID, serviceAccessor => {
                serviceAccessor.get(instantiation_1.IInstantiationService)
                    .createInstance(AddToWorkspaceFolderRecommendationsAction, AddToWorkspaceFolderRecommendationsAction.IGNORE_ID, AddToWorkspaceFolderRecommendationsAction.IGNORE_LABEL)
                    .run(AddToWorkspaceRecommendationsAction.IGNORE);
            });
            actions_2.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
                command: {
                    id: AddToWorkspaceFolderRecommendationsAction.IGNORE_ID,
                    title: { value: `${extensionManagement_1.ExtensionsLabel}: ${AddToWorkspaceFolderRecommendationsAction.IGNORE_LABEL}`, original: 'Extensions: Ignore Recommended Extension (Workspace Folder)' },
                    category: nls_1.localize('extensions', "Extensions")
                },
                when: this.addToWorkspaceFolderRecommendationsContextKey
            });
        }
    };
    ConfigureRecommendedExtensionsCommandsContributor = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, editorService_1.IEditorService)
    ], ConfigureRecommendedExtensionsCommandsContributor);
    exports.ConfigureRecommendedExtensionsCommandsContributor = ConfigureRecommendedExtensionsCommandsContributor;
    let AbstractConfigureRecommendedExtensionsAction = class AbstractConfigureRecommendedExtensionsAction extends actions_1.Action {
        constructor(id, label, contextService, fileService, textFileService, editorService, jsonEditingService, textModelResolverService) {
            super(id, label);
            this.contextService = contextService;
            this.fileService = fileService;
            this.textFileService = textFileService;
            this.editorService = editorService;
            this.jsonEditingService = jsonEditingService;
            this.textModelResolverService = textModelResolverService;
        }
        openExtensionsFile(extensionsFileResource) {
            return this.getOrCreateExtensionsFile(extensionsFileResource)
                .then(({ created, content }) => this.getSelectionPosition(content, extensionsFileResource, ['recommendations'])
                .then(selection => this.editorService.openEditor({
                resource: extensionsFileResource,
                options: {
                    pinned: created,
                    selection
                }
            })), error => Promise.reject(new Error(nls_1.localize('OpenExtensionsFile.failed', "Unable to create 'extensions.json' file inside the '.vscode' folder ({0}).", error))));
        }
        openWorkspaceConfigurationFile(workspaceConfigurationFile) {
            return this.getOrUpdateWorkspaceConfigurationFile(workspaceConfigurationFile)
                .then(content => this.getSelectionPosition(content.value.toString(), content.resource, ['extensions', 'recommendations']))
                .then(selection => this.editorService.openEditor({
                resource: workspaceConfigurationFile,
                options: {
                    selection,
                    forceReload: true // because content has changed
                }
            }));
        }
        addExtensionToWorkspaceConfig(workspaceConfigurationFile, extensionId, shouldRecommend) {
            return this.getOrUpdateWorkspaceConfigurationFile(workspaceConfigurationFile)
                .then(content => {
                const extensionIdLowerCase = extensionId.toLowerCase();
                const workspaceExtensionsConfigContent = (json.parse(content.value.toString()) || {})['extensions'] || {};
                let insertInto = shouldRecommend ? workspaceExtensionsConfigContent.recommendations || [] : workspaceExtensionsConfigContent.unwantedRecommendations || [];
                let removeFrom = shouldRecommend ? workspaceExtensionsConfigContent.unwantedRecommendations || [] : workspaceExtensionsConfigContent.recommendations || [];
                if (insertInto.some(e => e.toLowerCase() === extensionIdLowerCase)) {
                    return Promise.resolve(null);
                }
                insertInto.push(extensionId);
                removeFrom = removeFrom.filter(x => x.toLowerCase() !== extensionIdLowerCase);
                return this.jsonEditingService.write(workspaceConfigurationFile, {
                    key: 'extensions',
                    value: {
                        recommendations: shouldRecommend ? insertInto : removeFrom,
                        unwantedRecommendations: shouldRecommend ? removeFrom : insertInto
                    }
                }, true);
            });
        }
        addExtensionToWorkspaceFolderConfig(extensionsFileResource, extensionId, shouldRecommend) {
            return this.getOrCreateExtensionsFile(extensionsFileResource)
                .then(({ content }) => {
                const extensionIdLowerCase = extensionId.toLowerCase();
                const extensionsConfigContent = json.parse(content) || {};
                let insertInto = shouldRecommend ? extensionsConfigContent.recommendations || [] : extensionsConfigContent.unwantedRecommendations || [];
                let removeFrom = shouldRecommend ? extensionsConfigContent.unwantedRecommendations || [] : extensionsConfigContent.recommendations || [];
                if (insertInto.some(e => e.toLowerCase() === extensionIdLowerCase)) {
                    return Promise.resolve(null);
                }
                insertInto.push(extensionId);
                let removeFromPromise = Promise.resolve();
                if (removeFrom.some(e => e.toLowerCase() === extensionIdLowerCase)) {
                    removeFrom = removeFrom.filter(x => x.toLowerCase() !== extensionIdLowerCase);
                    removeFromPromise = this.jsonEditingService.write(extensionsFileResource, {
                        key: shouldRecommend ? 'unwantedRecommendations' : 'recommendations',
                        value: removeFrom
                    }, true);
                }
                return removeFromPromise.then(() => this.jsonEditingService.write(extensionsFileResource, {
                    key: shouldRecommend ? 'recommendations' : 'unwantedRecommendations',
                    value: insertInto
                }, true));
            });
        }
        getWorkspaceExtensionsConfigContent(extensionsFileResource) {
            return Promise.resolve(this.fileService.readFile(extensionsFileResource))
                .then(content => {
                return (json.parse(content.value.toString()) || {})['extensions'] || {};
            }, err => ({ recommendations: [], unwantedRecommendations: [] }));
        }
        getWorkspaceFolderExtensionsConfigContent(extensionsFileResource) {
            return Promise.resolve(this.fileService.readFile(extensionsFileResource))
                .then(content => {
                return json.parse(content.value.toString());
            }, err => ({ recommendations: [], unwantedRecommendations: [] }));
        }
        getOrUpdateWorkspaceConfigurationFile(workspaceConfigurationFile) {
            return Promise.resolve(this.fileService.readFile(workspaceConfigurationFile))
                .then(content => {
                const workspaceRecommendations = json.parse(content.value.toString())['extensions'];
                if (!workspaceRecommendations || !workspaceRecommendations.recommendations) {
                    return this.jsonEditingService.write(workspaceConfigurationFile, { key: 'extensions', value: { recommendations: [] } }, true)
                        .then(() => this.fileService.readFile(workspaceConfigurationFile));
                }
                return content;
            });
        }
        getSelectionPosition(content, resource, path) {
            const tree = json.parseTree(content);
            const node = json.findNodeAtLocation(tree, path);
            if (node && node.parent && node.parent.children) {
                const recommendationsValueNode = node.parent.children[1];
                const lastExtensionNode = recommendationsValueNode.children && recommendationsValueNode.children.length ? recommendationsValueNode.children[recommendationsValueNode.children.length - 1] : null;
                const offset = lastExtensionNode ? lastExtensionNode.offset + lastExtensionNode.length : recommendationsValueNode.offset + 1;
                return Promise.resolve(this.textModelResolverService.createModelReference(resource))
                    .then(reference => {
                    const position = reference.object.textEditorModel.getPositionAt(offset);
                    reference.dispose();
                    return {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column,
                    };
                });
            }
            return Promise.resolve(undefined);
        }
        getOrCreateExtensionsFile(extensionsFileResource) {
            return Promise.resolve(this.fileService.readFile(extensionsFileResource)).then(content => {
                return { created: false, extensionsFileResource, content: content.value.toString() };
            }, err => {
                return this.textFileService.write(extensionsFileResource, extensionsFileTemplate_1.ExtensionsConfigurationInitialContent).then(() => {
                    return { created: true, extensionsFileResource, content: extensionsFileTemplate_1.ExtensionsConfigurationInitialContent };
                });
            });
        }
    };
    AbstractConfigureRecommendedExtensionsAction = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, files_1.IFileService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, editorService_1.IEditorService),
        __param(6, jsonEditing_1.IJSONEditingService),
        __param(7, resolverService_1.ITextModelService)
    ], AbstractConfigureRecommendedExtensionsAction);
    exports.AbstractConfigureRecommendedExtensionsAction = AbstractConfigureRecommendedExtensionsAction;
    let ConfigureWorkspaceRecommendedExtensionsAction = class ConfigureWorkspaceRecommendedExtensionsAction extends AbstractConfigureRecommendedExtensionsAction {
        constructor(id, label, fileService, textFileService, contextService, editorService, jsonEditingService, textModelResolverService) {
            super(id, label, contextService, fileService, textFileService, editorService, jsonEditingService, textModelResolverService);
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.update(), this));
            this.update();
        }
        update() {
            this.enabled = this.contextService.getWorkbenchState() !== 1 /* EMPTY */;
        }
        run() {
            switch (this.contextService.getWorkbenchState()) {
                case 2 /* FOLDER */:
                    return this.openExtensionsFile(this.contextService.getWorkspace().folders[0].toResource(extensions_1.EXTENSIONS_CONFIG));
                case 3 /* WORKSPACE */:
                    return this.openWorkspaceConfigurationFile(this.contextService.getWorkspace().configuration);
            }
            return Promise.resolve();
        }
    };
    ConfigureWorkspaceRecommendedExtensionsAction.ID = 'workbench.extensions.action.configureWorkspaceRecommendedExtensions';
    ConfigureWorkspaceRecommendedExtensionsAction.LABEL = nls_1.localize('configureWorkspaceRecommendedExtensions', "Configure Recommended Extensions (Workspace)");
    ConfigureWorkspaceRecommendedExtensionsAction = __decorate([
        __param(2, files_1.IFileService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, editorService_1.IEditorService),
        __param(6, jsonEditing_1.IJSONEditingService),
        __param(7, resolverService_1.ITextModelService)
    ], ConfigureWorkspaceRecommendedExtensionsAction);
    exports.ConfigureWorkspaceRecommendedExtensionsAction = ConfigureWorkspaceRecommendedExtensionsAction;
    let ConfigureWorkspaceFolderRecommendedExtensionsAction = class ConfigureWorkspaceFolderRecommendedExtensionsAction extends AbstractConfigureRecommendedExtensionsAction {
        constructor(id, label, fileService, textFileService, contextService, editorService, jsonEditingService, textModelResolverService, commandService) {
            super(id, label, contextService, fileService, textFileService, editorService, jsonEditingService, textModelResolverService);
            this.commandService = commandService;
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.update(), this));
            this.update();
        }
        update() {
            this.enabled = this.contextService.getWorkspace().folders.length > 0;
        }
        run() {
            const folderCount = this.contextService.getWorkspace().folders.length;
            const pickFolderPromise = folderCount === 1 ? Promise.resolve(this.contextService.getWorkspace().folders[0]) : this.commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID);
            return Promise.resolve(pickFolderPromise)
                .then(workspaceFolder => {
                if (workspaceFolder) {
                    return this.openExtensionsFile(workspaceFolder.toResource(extensions_1.EXTENSIONS_CONFIG));
                }
                return null;
            });
        }
    };
    ConfigureWorkspaceFolderRecommendedExtensionsAction.ID = 'workbench.extensions.action.configureWorkspaceFolderRecommendedExtensions';
    ConfigureWorkspaceFolderRecommendedExtensionsAction.LABEL = nls_1.localize('configureWorkspaceFolderRecommendedExtensions', "Configure Recommended Extensions (Workspace Folder)");
    ConfigureWorkspaceFolderRecommendedExtensionsAction = __decorate([
        __param(2, files_1.IFileService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, editorService_1.IEditorService),
        __param(6, jsonEditing_1.IJSONEditingService),
        __param(7, resolverService_1.ITextModelService),
        __param(8, commands_1.ICommandService)
    ], ConfigureWorkspaceFolderRecommendedExtensionsAction);
    exports.ConfigureWorkspaceFolderRecommendedExtensionsAction = ConfigureWorkspaceFolderRecommendedExtensionsAction;
    let AddToWorkspaceFolderRecommendationsAction = class AddToWorkspaceFolderRecommendationsAction extends AbstractConfigureRecommendedExtensionsAction {
        constructor(id, label, fileService, textFileService, contextService, editorService, jsonEditingService, textModelResolverService, commandService, notificationService) {
            super(id, label, contextService, fileService, textFileService, editorService, jsonEditingService, textModelResolverService);
            this.commandService = commandService;
            this.notificationService = notificationService;
        }
        run(shouldRecommend) {
            if (!(this.editorService.activeEditor instanceof extensionsInput_1.ExtensionsInput) || !this.editorService.activeEditor.extension) {
                return Promise.resolve();
            }
            const folders = this.contextService.getWorkspace().folders;
            if (!folders || !folders.length) {
                this.notificationService.info(nls_1.localize('AddToWorkspaceFolderRecommendations.noWorkspace', 'There are no workspace folders open to add recommendations.'));
                return Promise.resolve();
            }
            const extensionId = this.editorService.activeEditor.extension.identifier;
            const pickFolderPromise = folders.length === 1
                ? Promise.resolve(folders[0])
                : this.commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID);
            return Promise.resolve(pickFolderPromise)
                .then(workspaceFolder => {
                if (!workspaceFolder) {
                    return Promise.resolve();
                }
                const configurationFile = workspaceFolder.toResource(extensions_1.EXTENSIONS_CONFIG);
                return this.getWorkspaceFolderExtensionsConfigContent(configurationFile).then(content => {
                    const extensionIdLowerCase = extensionId.id.toLowerCase();
                    if (shouldRecommend) {
                        if ((content.recommendations || []).some(e => e.toLowerCase() === extensionIdLowerCase)) {
                            this.notificationService.info(nls_1.localize('AddToWorkspaceFolderRecommendations.alreadyExists', 'This extension is already present in this workspace folder\'s recommendations.'));
                            return Promise.resolve();
                        }
                        return this.addExtensionToWorkspaceFolderConfig(configurationFile, extensionId.id, shouldRecommend).then(() => {
                            this.notificationService.prompt(notification_1.Severity.Info, nls_1.localize('AddToWorkspaceFolderRecommendations.success', 'The extension was successfully added to this workspace folder\'s recommendations.'), [{
                                    label: nls_1.localize('viewChanges', "View Changes"),
                                    run: () => this.openExtensionsFile(configurationFile)
                                }]);
                        }, err => {
                            this.notificationService.error(nls_1.localize('AddToWorkspaceFolderRecommendations.failure', 'Failed to write to extensions.json. {0}', err));
                        });
                    }
                    else {
                        if ((content.unwantedRecommendations || []).some(e => e.toLowerCase() === extensionIdLowerCase)) {
                            this.notificationService.info(nls_1.localize('AddToWorkspaceFolderIgnoredRecommendations.alreadyExists', 'This extension is already present in this workspace folder\'s unwanted recommendations.'));
                            return Promise.resolve();
                        }
                        return this.addExtensionToWorkspaceFolderConfig(configurationFile, extensionId.id, shouldRecommend).then(() => {
                            this.notificationService.prompt(notification_1.Severity.Info, nls_1.localize('AddToWorkspaceFolderIgnoredRecommendations.success', 'The extension was successfully added to this workspace folder\'s unwanted recommendations.'), [{
                                    label: nls_1.localize('viewChanges', "View Changes"),
                                    run: () => this.openExtensionsFile(configurationFile)
                                }]);
                        }, err => {
                            this.notificationService.error(nls_1.localize('AddToWorkspaceFolderRecommendations.failure', 'Failed to write to extensions.json. {0}', err));
                        });
                    }
                });
            });
        }
    };
    AddToWorkspaceFolderRecommendationsAction.ADD = true;
    AddToWorkspaceFolderRecommendationsAction.IGNORE = false;
    AddToWorkspaceFolderRecommendationsAction.ADD_ID = 'workbench.extensions.action.addToWorkspaceFolderRecommendations';
    AddToWorkspaceFolderRecommendationsAction.ADD_LABEL = nls_1.localize('addToWorkspaceFolderRecommendations', "Add to Recommended Extensions (Workspace Folder)");
    AddToWorkspaceFolderRecommendationsAction.IGNORE_ID = 'workbench.extensions.action.addToWorkspaceFolderIgnoredRecommendations';
    AddToWorkspaceFolderRecommendationsAction.IGNORE_LABEL = nls_1.localize('addToWorkspaceFolderIgnoredRecommendations', "Ignore Recommended Extension (Workspace Folder)");
    AddToWorkspaceFolderRecommendationsAction = __decorate([
        __param(2, files_1.IFileService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, editorService_1.IEditorService),
        __param(6, jsonEditing_1.IJSONEditingService),
        __param(7, resolverService_1.ITextModelService),
        __param(8, commands_1.ICommandService),
        __param(9, notification_1.INotificationService)
    ], AddToWorkspaceFolderRecommendationsAction);
    exports.AddToWorkspaceFolderRecommendationsAction = AddToWorkspaceFolderRecommendationsAction;
    let AddToWorkspaceRecommendationsAction = class AddToWorkspaceRecommendationsAction extends AbstractConfigureRecommendedExtensionsAction {
        constructor(id, label, fileService, textFileService, contextService, editorService, jsonEditingService, textModelResolverService, notificationService) {
            super(id, label, contextService, fileService, textFileService, editorService, jsonEditingService, textModelResolverService);
            this.notificationService = notificationService;
        }
        run(shouldRecommend) {
            const workspaceConfig = this.contextService.getWorkspace().configuration;
            if (!(this.editorService.activeEditor instanceof extensionsInput_1.ExtensionsInput) || !this.editorService.activeEditor.extension || !workspaceConfig) {
                return Promise.resolve();
            }
            const extensionId = this.editorService.activeEditor.extension.identifier;
            return this.getWorkspaceExtensionsConfigContent(workspaceConfig).then(content => {
                const extensionIdLowerCase = extensionId.id.toLowerCase();
                if (shouldRecommend) {
                    if ((content.recommendations || []).some(e => e.toLowerCase() === extensionIdLowerCase)) {
                        this.notificationService.info(nls_1.localize('AddToWorkspaceRecommendations.alreadyExists', 'This extension is already present in workspace recommendations.'));
                        return Promise.resolve();
                    }
                    return this.addExtensionToWorkspaceConfig(workspaceConfig, extensionId.id, shouldRecommend).then(() => {
                        this.notificationService.prompt(notification_1.Severity.Info, nls_1.localize('AddToWorkspaceRecommendations.success', 'The extension was successfully added to this workspace\'s recommendations.'), [{
                                label: nls_1.localize('viewChanges', "View Changes"),
                                run: () => this.openWorkspaceConfigurationFile(workspaceConfig)
                            }]);
                    }, err => {
                        this.notificationService.error(nls_1.localize('AddToWorkspaceRecommendations.failure', 'Failed to write. {0}', err));
                    });
                }
                else {
                    if ((content.unwantedRecommendations || []).some(e => e.toLowerCase() === extensionIdLowerCase)) {
                        this.notificationService.info(nls_1.localize('AddToWorkspaceUnwantedRecommendations.alreadyExists', 'This extension is already present in workspace unwanted recommendations.'));
                        return Promise.resolve();
                    }
                    return this.addExtensionToWorkspaceConfig(workspaceConfig, extensionId.id, shouldRecommend).then(() => {
                        this.notificationService.prompt(notification_1.Severity.Info, nls_1.localize('AddToWorkspaceUnwantedRecommendations.success', 'The extension was successfully added to this workspace\'s unwanted recommendations.'), [{
                                label: nls_1.localize('viewChanges', "View Changes"),
                                run: () => this.openWorkspaceConfigurationFile(workspaceConfig)
                            }]);
                    }, err => {
                        this.notificationService.error(nls_1.localize('AddToWorkspaceRecommendations.failure', 'Failed to write. {0}', err));
                    });
                }
            });
        }
    };
    AddToWorkspaceRecommendationsAction.ADD = true;
    AddToWorkspaceRecommendationsAction.IGNORE = false;
    AddToWorkspaceRecommendationsAction.ADD_ID = 'workbench.extensions.action.addToWorkspaceRecommendations';
    AddToWorkspaceRecommendationsAction.ADD_LABEL = nls_1.localize('addToWorkspaceRecommendations', "Add to Recommended Extensions (Workspace)");
    AddToWorkspaceRecommendationsAction.IGNORE_ID = 'workbench.extensions.action.addToWorkspaceIgnoredRecommendations';
    AddToWorkspaceRecommendationsAction.IGNORE_LABEL = nls_1.localize('addToWorkspaceIgnoredRecommendations', "Ignore Recommended Extension (Workspace)");
    AddToWorkspaceRecommendationsAction = __decorate([
        __param(2, files_1.IFileService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, editorService_1.IEditorService),
        __param(6, jsonEditing_1.IJSONEditingService),
        __param(7, resolverService_1.ITextModelService),
        __param(8, notification_1.INotificationService)
    ], AddToWorkspaceRecommendationsAction);
    exports.AddToWorkspaceRecommendationsAction = AddToWorkspaceRecommendationsAction;
    let StatusLabelAction = class StatusLabelAction extends actions_1.Action {
        constructor(extensionService, extensionManagementServerService) {
            super('extensions.action.statusLabel', '', StatusLabelAction.DISABLED_CLASS, false);
            this.extensionService = extensionService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.initialStatus = null;
            this.status = null;
            this.enablementState = null;
        }
        get extension() { return this._extension; }
        set extension(extension) {
            if (!(this._extension && extension && extensionManagementUtil_1.areSameExtensions(this._extension.identifier, extension.identifier))) {
                // Different extension. Reset
                this.initialStatus = null;
                this.status = null;
                this.enablementState = null;
            }
            this._extension = extension;
            this.update();
        }
        update() {
            this.computeLabel()
                .then(label => {
                this.label = label || '';
                this.class = label ? StatusLabelAction.ENABLED_CLASS : StatusLabelAction.DISABLED_CLASS;
            });
        }
        computeLabel() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this.extension) {
                    return null;
                }
                const currentStatus = this.status;
                const currentEnablementState = this.enablementState;
                this.status = this.extension.state;
                if (this.initialStatus === null) {
                    this.initialStatus = this.status;
                }
                this.enablementState = this.extension.enablementState;
                const runningExtensions = yield this.extensionService.getExtensions();
                const canAddExtension = () => {
                    const runningExtension = runningExtensions.filter(e => extensionManagementUtil_1.areSameExtensions({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier))[0];
                    if (this.extension.local) {
                        if (runningExtension && this.extension.version === runningExtension.version) {
                            return true;
                        }
                        return this.extensionService.canAddExtension(toExtensionDescription(this.extension.local));
                    }
                    return false;
                };
                const canRemoveExtension = () => {
                    if (this.extension.local) {
                        if (runningExtensions.every(e => !(extensionManagementUtil_1.areSameExtensions({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier) && this.extension.server === this.extensionManagementServerService.getExtensionManagementServer(e.extensionLocation)))) {
                            return true;
                        }
                        return this.extensionService.canRemoveExtension(toExtensionDescription(this.extension.local));
                    }
                    return false;
                };
                if (currentStatus !== null) {
                    if (currentStatus === 0 /* Installing */ && this.status === 1 /* Installed */) {
                        return canAddExtension() ? this.initialStatus === 1 /* Installed */ ? nls_1.localize('updated', "Updated") : nls_1.localize('installed', "Installed") : null;
                    }
                    if (currentStatus === 2 /* Uninstalling */ && this.status === 3 /* Uninstalled */) {
                        this.initialStatus = this.status;
                        return canRemoveExtension() ? nls_1.localize('uninstalled', "Uninstalled") : null;
                    }
                }
                if (currentEnablementState !== null) {
                    const currentlyEnabled = currentEnablementState === 4 /* EnabledGlobally */ || currentEnablementState === 5 /* EnabledWorkspace */;
                    const enabled = this.enablementState === 4 /* EnabledGlobally */ || this.enablementState === 5 /* EnabledWorkspace */;
                    if (!currentlyEnabled && enabled) {
                        return canAddExtension() ? nls_1.localize('enabled', "Enabled") : null;
                    }
                    if (currentlyEnabled && !enabled) {
                        return canRemoveExtension() ? nls_1.localize('disabled', "Disabled") : null;
                    }
                }
                return null;
            });
        }
        run() {
            return Promise.resolve();
        }
    };
    StatusLabelAction.ENABLED_CLASS = 'extension-status-label';
    StatusLabelAction.DISABLED_CLASS = `${StatusLabelAction.ENABLED_CLASS} hide`;
    StatusLabelAction = __decorate([
        __param(0, extensions_3.IExtensionService),
        __param(1, extensionManagement_2.IExtensionManagementServerService)
    ], StatusLabelAction);
    exports.StatusLabelAction = StatusLabelAction;
    class MaliciousStatusLabelAction extends ExtensionAction {
        constructor(long) {
            const tooltip = nls_1.localize('malicious tooltip', "This extension was reported to be problematic.");
            const label = long ? tooltip : nls_1.localize('malicious', "Malicious");
            super('extensions.install', label, '', false);
            this.tooltip = nls_1.localize('malicious tooltip', "This extension was reported to be problematic.");
        }
        update() {
            if (this.extension && this.extension.isMalicious) {
                this.class = `${MaliciousStatusLabelAction.Class} malicious`;
            }
            else {
                this.class = `${MaliciousStatusLabelAction.Class} not-malicious`;
            }
        }
        run() {
            return Promise.resolve();
        }
    }
    MaliciousStatusLabelAction.Class = 'malicious-status';
    exports.MaliciousStatusLabelAction = MaliciousStatusLabelAction;
    let ExtensionToolTipAction = class ExtensionToolTipAction extends ExtensionAction {
        constructor(warningAction, reloadAction, extensionEnablementService, extensionService, extensionManagementServerService) {
            super('extensions.tooltip', warningAction.tooltip, `${ExtensionToolTipAction.Class} hide`, false);
            this.warningAction = warningAction;
            this.reloadAction = reloadAction;
            this.extensionEnablementService = extensionEnablementService;
            this.extensionService = extensionService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.updateWhenCounterExtensionChanges = true;
            this._runningExtensions = null;
            this._register(warningAction.onDidChange(() => this.update(), this));
            this._register(this.extensionService.onDidChangeExtensions(this.updateRunningExtensions, this));
            this.updateRunningExtensions();
        }
        updateRunningExtensions() {
            this.extensionService.getExtensions().then(runningExtensions => { this._runningExtensions = runningExtensions; this.update(); });
        }
        update() {
            this.label = this.getTooltip();
            this.class = ExtensionToolTipAction.Class;
            if (!this.label) {
                this.class = `${ExtensionToolTipAction.Class} hide`;
            }
        }
        getTooltip() {
            if (!this.extension) {
                return '';
            }
            if (this.reloadAction.enabled) {
                return this.reloadAction.tooltip;
            }
            if (this.warningAction.tooltip) {
                return this.warningAction.tooltip;
            }
            if (this.extension && this.extension.local && this.extension.state === 1 /* Installed */ && this._runningExtensions) {
                const isRunning = this._runningExtensions.some(e => extensionManagementUtil_1.areSameExtensions({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier));
                const isEnabled = this.extensionEnablementService.isEnabled(this.extension.local);
                if (isEnabled && isRunning) {
                    if (this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) {
                        if (this.extension.server === this.extensionManagementServerService.remoteExtensionManagementServer) {
                            return nls_1.localize('extension enabled on remote', "Extension is enabled on '{0}'", this.extension.server.label);
                        }
                    }
                    if (this.extension.enablementState === 4 /* EnabledGlobally */) {
                        return nls_1.localize('globally enabled', "This extension is enabled globally.");
                    }
                    if (this.extension.enablementState === 5 /* EnabledWorkspace */) {
                        return nls_1.localize('workspace enabled', "This extension is enabled for this workspace by the user.");
                    }
                }
                if (!isEnabled && !isRunning) {
                    if (this.extension.enablementState === 2 /* DisabledGlobally */) {
                        return nls_1.localize('globally disabled', "This extension is disabled globally by the user.");
                    }
                    if (this.extension.enablementState === 3 /* DisabledWorkspace */) {
                        return nls_1.localize('workspace disabled', "This extension is disabled for this workspace by the user.");
                    }
                }
            }
            return '';
        }
        run() {
            return Promise.resolve(null);
        }
    };
    ExtensionToolTipAction.Class = 'disable-status';
    ExtensionToolTipAction = __decorate([
        __param(2, extensionManagement_2.IExtensionEnablementService),
        __param(3, extensions_3.IExtensionService),
        __param(4, extensionManagement_2.IExtensionManagementServerService)
    ], ExtensionToolTipAction);
    exports.ExtensionToolTipAction = ExtensionToolTipAction;
    let SystemDisabledWarningAction = class SystemDisabledWarningAction extends ExtensionAction {
        constructor(extensionManagementServerService, configurationService, productService, labelService, extensionsWorkbenchService, extensionService) {
            super('extensions.install', '', `${SystemDisabledWarningAction.CLASS} hide`, false);
            this.extensionManagementServerService = extensionManagementServerService;
            this.configurationService = configurationService;
            this.productService = productService;
            this.labelService = labelService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionService = extensionService;
            this.updateWhenCounterExtensionChanges = true;
            this._runningExtensions = null;
            this._register(this.labelService.onDidChangeFormatters(() => this.update(), this));
            this._register(this.extensionService.onDidChangeExtensions(this.updateRunningExtensions, this));
            this.updateRunningExtensions();
            this.update();
        }
        updateRunningExtensions() {
            this.extensionService.getExtensions().then(runningExtensions => { this._runningExtensions = runningExtensions; this.update(); });
        }
        update() {
            this.class = `${SystemDisabledWarningAction.CLASS} hide`;
            this.tooltip = '';
            if (!this.extension ||
                !this.extension.local ||
                !this.extension.server ||
                !this._runningExtensions ||
                !(this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) ||
                this.extension.state !== 1 /* Installed */) {
                return;
            }
            if (extensions_2.isLanguagePackExtension(this.extension.local.manifest)) {
                if (!this.extensionsWorkbenchService.installed.some(e => extensionManagementUtil_1.areSameExtensions(e.identifier, this.extension.identifier) && e.server !== this.extension.server)) {
                    this.class = `${SystemDisabledWarningAction.INFO_CLASS}`;
                    this.tooltip = this.extension.server === this.extensionManagementServerService.localExtensionManagementServer
                        ? nls_1.localize('Install language pack also in remote server', "Install the language pack extension on '{0}' to enable it also there.", this.extensionManagementServerService.remoteExtensionManagementServer.label)
                        : nls_1.localize('Install language pack also locally', "Install the language pack extension locally to enable it also there.");
                }
                return;
            }
            const runningExtension = this._runningExtensions.filter(e => extensionManagementUtil_1.areSameExtensions({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier))[0];
            const runningExtensionServer = runningExtension ? this.extensionManagementServerService.getExtensionManagementServer(runningExtension.extensionLocation) : null;
            const localExtension = this.extensionsWorkbenchService.local.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, this.extension.identifier))[0];
            const localExtensionServer = localExtension ? localExtension.server : null;
            if (this.extension.server === this.extensionManagementServerService.localExtensionManagementServer && !extensionsUtil_1.isUIExtension(this.extension.local.manifest, this.productService, this.configurationService)) {
                if (runningExtensionServer === this.extensionManagementServerService.remoteExtensionManagementServer) {
                    this.class = `${SystemDisabledWarningAction.INFO_CLASS}`;
                    this.tooltip = nls_1.localize('disabled locally', "Extension is enabled on '{0}' and disabled locally.", this.extensionManagementServerService.remoteExtensionManagementServer.label);
                    return;
                }
                if (localExtensionServer !== this.extensionManagementServerService.remoteExtensionManagementServer) {
                    this.class = `${SystemDisabledWarningAction.WARNING_CLASS}`;
                    this.tooltip = nls_1.localize('Install in remote server', "Install the extension on '{0}' to enable.", this.extensionManagementServerService.remoteExtensionManagementServer.label);
                    return;
                }
            }
            if (this.extension.server === this.extensionManagementServerService.remoteExtensionManagementServer && extensionsUtil_1.isUIExtension(this.extension.local.manifest, this.productService, this.configurationService)) {
                if (runningExtensionServer === this.extensionManagementServerService.localExtensionManagementServer) {
                    this.class = `${SystemDisabledWarningAction.INFO_CLASS}`;
                    this.tooltip = nls_1.localize('disabled remotely', "Extension is enabled locally and disabled on '{0}'.", this.extensionManagementServerService.remoteExtensionManagementServer.label);
                    return;
                }
                if (localExtensionServer !== this.extensionManagementServerService.localExtensionManagementServer) {
                    this.class = `${SystemDisabledWarningAction.WARNING_CLASS}`;
                    this.tooltip = nls_1.localize('Install in local server', "Install the extension locally to enable.");
                    return;
                }
            }
        }
        run() {
            return Promise.resolve(null);
        }
    };
    SystemDisabledWarningAction.CLASS = 'system-disable';
    SystemDisabledWarningAction.WARNING_CLASS = `${SystemDisabledWarningAction.CLASS} warning`;
    SystemDisabledWarningAction.INFO_CLASS = `${SystemDisabledWarningAction.CLASS} info`;
    SystemDisabledWarningAction = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, product_1.IProductService),
        __param(3, label_1.ILabelService),
        __param(4, extensions_1.IExtensionsWorkbenchService),
        __param(5, extensions_3.IExtensionService)
    ], SystemDisabledWarningAction);
    exports.SystemDisabledWarningAction = SystemDisabledWarningAction;
    let DisableAllAction = class DisableAllAction extends actions_1.Action {
        constructor(id = DisableAllAction.ID, label = DisableAllAction.LABEL, extensionsWorkbenchService, extensionEnablementService) {
            super(id, label);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.update();
            this._register(this.extensionsWorkbenchService.onChange(() => this.update()));
        }
        update() {
            this.enabled = this.extensionsWorkbenchService.local.some(e => e.type === 1 /* User */ && !!e.local && this.extensionEnablementService.isEnabled(e.local) && this.extensionEnablementService.canChangeEnablement(e.local));
        }
        run() {
            return this.extensionsWorkbenchService.setEnablement(this.extensionsWorkbenchService.local.filter(e => e.type === 1 /* User */), 2 /* DisabledGlobally */);
        }
    };
    DisableAllAction.ID = 'workbench.extensions.action.disableAll';
    DisableAllAction.LABEL = nls_1.localize('disableAll', "Disable All Installed Extensions");
    DisableAllAction = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, extensionManagement_2.IExtensionEnablementService)
    ], DisableAllAction);
    exports.DisableAllAction = DisableAllAction;
    let DisableAllWorkpsaceAction = class DisableAllWorkpsaceAction extends actions_1.Action {
        constructor(id = DisableAllWorkpsaceAction.ID, label = DisableAllWorkpsaceAction.LABEL, workspaceContextService, extensionsWorkbenchService, extensionEnablementService) {
            super(id, label);
            this.workspaceContextService = workspaceContextService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.update();
            this._register(this.workspaceContextService.onDidChangeWorkbenchState(() => this.update(), this));
            this._register(this.extensionsWorkbenchService.onChange(() => this.update(), this));
        }
        update() {
            this.enabled = this.workspaceContextService.getWorkbenchState() !== 1 /* EMPTY */ && this.extensionsWorkbenchService.local.some(e => e.type === 1 /* User */ && !!e.local && this.extensionEnablementService.isEnabled(e.local) && this.extensionEnablementService.canChangeEnablement(e.local));
        }
        run() {
            return this.extensionsWorkbenchService.setEnablement(this.extensionsWorkbenchService.local.filter(e => e.type === 1 /* User */), 3 /* DisabledWorkspace */);
        }
    };
    DisableAllWorkpsaceAction.ID = 'workbench.extensions.action.disableAllWorkspace';
    DisableAllWorkpsaceAction.LABEL = nls_1.localize('disableAllWorkspace', "Disable All Installed Extensions for this Workspace");
    DisableAllWorkpsaceAction = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, extensions_1.IExtensionsWorkbenchService),
        __param(4, extensionManagement_2.IExtensionEnablementService)
    ], DisableAllWorkpsaceAction);
    exports.DisableAllWorkpsaceAction = DisableAllWorkpsaceAction;
    let EnableAllAction = class EnableAllAction extends actions_1.Action {
        constructor(id = EnableAllAction.ID, label = EnableAllAction.LABEL, extensionsWorkbenchService, extensionEnablementService) {
            super(id, label);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.update();
            this._register(this.extensionsWorkbenchService.onChange(() => this.update()));
        }
        update() {
            this.enabled = this.extensionsWorkbenchService.local.some(e => !!e.local && this.extensionEnablementService.canChangeEnablement(e.local) && !this.extensionEnablementService.isEnabled(e.local));
        }
        run() {
            return this.extensionsWorkbenchService.setEnablement(this.extensionsWorkbenchService.local, 4 /* EnabledGlobally */);
        }
    };
    EnableAllAction.ID = 'workbench.extensions.action.enableAll';
    EnableAllAction.LABEL = nls_1.localize('enableAll', "Enable All Extensions");
    EnableAllAction = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, extensionManagement_2.IExtensionEnablementService)
    ], EnableAllAction);
    exports.EnableAllAction = EnableAllAction;
    let EnableAllWorkpsaceAction = class EnableAllWorkpsaceAction extends actions_1.Action {
        constructor(id = EnableAllWorkpsaceAction.ID, label = EnableAllWorkpsaceAction.LABEL, workspaceContextService, extensionsWorkbenchService, extensionEnablementService) {
            super(id, label);
            this.workspaceContextService = workspaceContextService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.update();
            this._register(this.extensionsWorkbenchService.onChange(() => this.update(), this));
            this._register(this.workspaceContextService.onDidChangeWorkbenchState(() => this.update(), this));
        }
        update() {
            this.enabled = this.workspaceContextService.getWorkbenchState() !== 1 /* EMPTY */ && this.extensionsWorkbenchService.local.some(e => !!e.local && this.extensionEnablementService.canChangeEnablement(e.local) && !this.extensionEnablementService.isEnabled(e.local));
        }
        run() {
            return this.extensionsWorkbenchService.setEnablement(this.extensionsWorkbenchService.local, 5 /* EnabledWorkspace */);
        }
    };
    EnableAllWorkpsaceAction.ID = 'workbench.extensions.action.enableAllWorkspace';
    EnableAllWorkpsaceAction.LABEL = nls_1.localize('enableAllWorkspace', "Enable All Extensions for this Workspace");
    EnableAllWorkpsaceAction = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, extensions_1.IExtensionsWorkbenchService),
        __param(4, extensionManagement_2.IExtensionEnablementService)
    ], EnableAllWorkpsaceAction);
    exports.EnableAllWorkpsaceAction = EnableAllWorkpsaceAction;
    let OpenExtensionsFolderAction = class OpenExtensionsFolderAction extends actions_1.Action {
        constructor(id, label, windowsService, fileService, environmentService) {
            super(id, label, undefined, true);
            this.windowsService = windowsService;
            this.fileService = fileService;
            this.environmentService = environmentService;
        }
        run() {
            if (this.environmentService.extensionsPath) {
                const extensionsHome = uri_1.URI.file(this.environmentService.extensionsPath);
                return Promise.resolve(this.fileService.resolve(extensionsHome)).then(file => {
                    let itemToShow;
                    if (file.children && file.children.length > 0) {
                        itemToShow = file.children[0].resource;
                    }
                    else {
                        itemToShow = extensionsHome;
                    }
                    return this.windowsService.showItemInFolder(itemToShow);
                });
            }
            return Promise.resolve();
        }
    };
    OpenExtensionsFolderAction.ID = 'workbench.extensions.action.openExtensionsFolder';
    OpenExtensionsFolderAction.LABEL = nls_1.localize('openExtensionsFolder', "Open Extensions Folder");
    OpenExtensionsFolderAction = __decorate([
        __param(2, windows_1.IWindowsService),
        __param(3, files_1.IFileService),
        __param(4, environment_1.IEnvironmentService)
    ], OpenExtensionsFolderAction);
    exports.OpenExtensionsFolderAction = OpenExtensionsFolderAction;
    let InstallVSIXAction = class InstallVSIXAction extends actions_1.Action {
        constructor(id = InstallVSIXAction.ID, label = InstallVSIXAction.LABEL, extensionsWorkbenchService, notificationService, windowService, fileDialogService, extensionService, instantiationService) {
            super(id, label, 'extension-action install-vsix', true);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.notificationService = notificationService;
            this.windowService = windowService;
            this.fileDialogService = fileDialogService;
            this.extensionService = extensionService;
            this.instantiationService = instantiationService;
        }
        run() {
            return Promise.resolve(this.fileDialogService.showOpenDialog({
                title: nls_1.localize('installFromVSIX', "Install from VSIX"),
                filters: [{ name: 'VSIX Extensions', extensions: ['vsix'] }],
                canSelectFiles: true,
                openLabel: labels_1.mnemonicButtonLabel(nls_1.localize({ key: 'installButton', comment: ['&& denotes a mnemonic'] }, "&&Install"))
            })).then(result => {
                if (!result) {
                    return Promise.resolve();
                }
                return Promise.all(result.map(vsix => this.extensionsWorkbenchService.install(vsix)))
                    .then(extensions => {
                    for (const extension of extensions) {
                        const requireReload = !(extension.local && this.extensionService.canAddExtension(toExtensionDescription(extension.local)));
                        const message = requireReload ? nls_1.localize('InstallVSIXAction.successReload', "Please reload Visual Studio Code to complete installing the extension {0}.", extension.displayName || extension.name)
                            : nls_1.localize('InstallVSIXAction.success', "Completed installing the extension {0}.", extension.displayName || extension.name);
                        const actions = requireReload ? [{
                                label: nls_1.localize('InstallVSIXAction.reloadNow', "Reload Now"),
                                run: () => this.windowService.reloadWindow()
                            }] : [];
                        this.notificationService.prompt(notification_1.Severity.Info, message, actions, { sticky: true });
                    }
                    return this.instantiationService.createInstance(ShowInstalledExtensionsAction, ShowInstalledExtensionsAction.ID, ShowInstalledExtensionsAction.LABEL).run();
                });
            });
        }
    };
    InstallVSIXAction.ID = 'workbench.extensions.action.installVSIX';
    InstallVSIXAction.LABEL = nls_1.localize('installVSIX', "Install from VSIX...");
    InstallVSIXAction = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, notification_1.INotificationService),
        __param(4, windows_1.IWindowService),
        __param(5, dialogs_1.IFileDialogService),
        __param(6, extensions_3.IExtensionService),
        __param(7, instantiation_1.IInstantiationService)
    ], InstallVSIXAction);
    exports.InstallVSIXAction = InstallVSIXAction;
    let ReinstallAction = class ReinstallAction extends actions_1.Action {
        constructor(id = ReinstallAction.ID, label = ReinstallAction.LABEL, extensionsWorkbenchService, quickInputService, notificationService, windowService, instantiationService, extensionService) {
            super(id, label);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.windowService = windowService;
            this.instantiationService = instantiationService;
            this.extensionService = extensionService;
        }
        get enabled() {
            return this.extensionsWorkbenchService.local.filter(l => l.type === 1 /* User */ && l.local).length > 0;
        }
        run() {
            return this.quickInputService.pick(this.getEntries(), { placeHolder: nls_1.localize('selectExtensionToReinstall', "Select Extension to Reinstall") })
                .then(pick => pick && this.reinstallExtension(pick.extension));
        }
        getEntries() {
            return this.extensionsWorkbenchService.queryLocal()
                .then(local => {
                const entries = local
                    .filter(extension => extension.type === 1 /* User */)
                    .map(extension => {
                    return {
                        id: extension.identifier.id,
                        label: extension.displayName,
                        description: extension.identifier.id,
                        extension,
                    };
                });
                return entries;
            });
        }
        reinstallExtension(extension) {
            return this.instantiationService.createInstance(ShowInstalledExtensionsAction, ShowInstalledExtensionsAction.ID, ShowInstalledExtensionsAction.LABEL).run()
                .then(() => {
                return this.extensionsWorkbenchService.reinstall(extension)
                    .then(extension => {
                    const requireReload = !(extension.local && this.extensionService.canAddExtension(toExtensionDescription(extension.local)));
                    const message = requireReload ? nls_1.localize('ReinstallAction.successReload', "Please reload Visual Studio Code to complete reinstalling the extension {0}.", extension.identifier.id)
                        : nls_1.localize('ReinstallAction.success', "Reinstalling the extension {0} is completed.", extension.identifier.id);
                    const actions = requireReload ? [{
                            label: nls_1.localize('InstallVSIXAction.reloadNow', "Reload Now"),
                            run: () => this.windowService.reloadWindow()
                        }] : [];
                    this.notificationService.prompt(notification_1.Severity.Info, message, actions, { sticky: true });
                }, error => this.notificationService.error(error));
            });
        }
    };
    ReinstallAction.ID = 'workbench.extensions.action.reinstall';
    ReinstallAction.LABEL = nls_1.localize('reinstall', "Reinstall Extension...");
    ReinstallAction = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, notification_1.INotificationService),
        __param(5, windows_1.IWindowService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, extensions_3.IExtensionService)
    ], ReinstallAction);
    exports.ReinstallAction = ReinstallAction;
    let InstallSpecificVersionOfExtensionAction = class InstallSpecificVersionOfExtensionAction extends actions_1.Action {
        constructor(id = InstallSpecificVersionOfExtensionAction.ID, label = InstallSpecificVersionOfExtensionAction.LABEL, extensionsWorkbenchService, extensionGalleryService, quickInputService, notificationService, windowService, instantiationService, extensionService, extensionEnablementService) {
            super(id, label);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionGalleryService = extensionGalleryService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.windowService = windowService;
            this.instantiationService = instantiationService;
            this.extensionService = extensionService;
            this.extensionEnablementService = extensionEnablementService;
        }
        get enabled() {
            return this.extensionsWorkbenchService.local.some(l => this.isEnabled(l));
        }
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                const extensionPick = yield this.quickInputService.pick(this.getExtensionEntries(), { placeHolder: nls_1.localize('selectExtension', "Select Extension"), matchOnDetail: true });
                if (extensionPick && extensionPick.extension) {
                    const versionPick = yield this.quickInputService.pick(extensionPick.versions.map(v => ({ id: v.version, label: v.version, description: `${getRelativeDateLabel(new Date(Date.parse(v.date)))}${v.version === extensionPick.extension.version ? ` (${nls_1.localize('current', "Current")})` : ''}` })), { placeHolder: nls_1.localize('selectVersion', "Select Version to Install"), matchOnDetail: true });
                    if (versionPick) {
                        if (extensionPick.extension.version !== versionPick.id) {
                            yield this.install(extensionPick.extension, versionPick.id);
                        }
                    }
                }
            });
        }
        isEnabled(extension) {
            return !!extension.gallery && !!extension.local && this.extensionEnablementService.isEnabled(extension.local);
        }
        getExtensionEntries() {
            return __awaiter(this, void 0, void 0, function* () {
                const installed = yield this.extensionsWorkbenchService.queryLocal();
                const versionsPromises = [];
                for (const extension of installed) {
                    if (this.isEnabled(extension)) {
                        versionsPromises.push(this.extensionGalleryService.getAllVersions(extension.gallery, true)
                            .then(versions => (versions.length ? { extension, versions } : null)));
                    }
                }
                const extensions = yield Promise.all(versionsPromises);
                return arrays_1.coalesce(extensions)
                    .sort((e1, e2) => e1.extension.displayName.localeCompare(e2.extension.displayName))
                    .map(({ extension, versions }) => {
                    return {
                        id: extension.identifier.id,
                        label: extension.displayName || extension.identifier.id,
                        description: extension.identifier.id,
                        extension,
                        versions
                    };
                });
            });
        }
        install(extension, version) {
            return this.instantiationService.createInstance(ShowInstalledExtensionsAction, ShowInstalledExtensionsAction.ID, ShowInstalledExtensionsAction.LABEL).run()
                .then(() => {
                return this.extensionsWorkbenchService.installVersion(extension, version)
                    .then(extension => {
                    const requireReload = !(extension.local && this.extensionService.canAddExtension(toExtensionDescription(extension.local)));
                    const message = requireReload ? nls_1.localize('InstallAnotherVersionExtensionAction.successReload', "Please reload Visual Studio Code to complete installing the extension {0}.", extension.identifier.id)
                        : nls_1.localize('InstallAnotherVersionExtensionAction.success', "Installing the extension {0} is completed.", extension.identifier.id);
                    const actions = requireReload ? [{
                            label: nls_1.localize('InstallAnotherVersionExtensionAction.reloadNow', "Reload Now"),
                            run: () => this.windowService.reloadWindow()
                        }] : [];
                    this.notificationService.prompt(notification_1.Severity.Info, message, actions, { sticky: true });
                }, error => this.notificationService.error(error));
            });
        }
    };
    InstallSpecificVersionOfExtensionAction.ID = 'workbench.extensions.action.install.specificVersion';
    InstallSpecificVersionOfExtensionAction.LABEL = nls_1.localize('install previous version', "Install Specific Version of Extension...");
    InstallSpecificVersionOfExtensionAction = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, extensionManagement_1.IExtensionGalleryService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, notification_1.INotificationService),
        __param(6, windows_1.IWindowService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, extensions_3.IExtensionService),
        __param(9, extensionManagement_2.IExtensionEnablementService)
    ], InstallSpecificVersionOfExtensionAction);
    exports.InstallSpecificVersionOfExtensionAction = InstallSpecificVersionOfExtensionAction;
    let InstallLocalExtensionsInRemoteAction = class InstallLocalExtensionsInRemoteAction extends actions_1.Action {
        constructor(extensionsWorkbenchService, extensionManagementServerService, extensionGalleryService, quickInputService, notificationService, windowService, progressService, instantiationService) {
            super('workbench.extensions.actions.installLocalExtensionsInRemote');
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionGalleryService = extensionGalleryService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.windowService = windowService;
            this.progressService = progressService;
            this.instantiationService = instantiationService;
            this.extensions = undefined;
            this.update();
            this.extensionsWorkbenchService.queryLocal().then(() => this.updateExtensions());
            this._register(this.extensionsWorkbenchService.onChange(() => {
                if (this.extensions) {
                    this.updateExtensions();
                }
            }));
        }
        get label() {
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                return nls_1.localize('select and install local extensions', "Install Local Extensions in '{0}'...", this.extensionManagementServerService.remoteExtensionManagementServer.label);
            }
            return '';
        }
        updateExtensions() {
            this.extensions = this.extensionsWorkbenchService.local;
            this.update();
        }
        update() {
            this.enabled = !!this.extensions && this.getExtensionsToInstall(this.extensions).length > 0;
            this.tooltip = this.label;
        }
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                return this.selectAndInstallLocalExtensions();
            });
        }
        queryExtensionsToInstall() {
            return __awaiter(this, void 0, void 0, function* () {
                const local = yield this.extensionsWorkbenchService.queryLocal();
                return this.getExtensionsToInstall(local);
            });
        }
        getExtensionsToInstall(local) {
            return local.filter(extension => {
                const action = this.instantiationService.createInstance(RemoteInstallAction);
                action.extension = extension;
                return action.enabled;
            });
        }
        selectAndInstallLocalExtensions() {
            return __awaiter(this, void 0, void 0, function* () {
                const quickPick = this.quickInputService.createQuickPick();
                quickPick.busy = true;
                const disposable = quickPick.onDidAccept(() => {
                    disposable.dispose();
                    quickPick.hide();
                    quickPick.dispose();
                    this.onDidAccept(quickPick.selectedItems);
                });
                quickPick.show();
                const localExtensionsToInstall = yield this.queryExtensionsToInstall();
                quickPick.busy = false;
                if (localExtensionsToInstall.length) {
                    quickPick.title = nls_1.localize('install local extensions title', "Install Local Extensions in '{0}'", this.extensionManagementServerService.remoteExtensionManagementServer.label);
                    quickPick.placeholder = nls_1.localize('select extensions to install', "Select extensions to install");
                    quickPick.canSelectMany = true;
                    localExtensionsToInstall.sort((e1, e2) => e1.displayName.localeCompare(e2.displayName));
                    quickPick.items = localExtensionsToInstall.map(extension => ({ extension, label: extension.displayName, description: extension.version }));
                }
                else {
                    quickPick.hide();
                    quickPick.dispose();
                    this.notificationService.notify({
                        severity: notification_1.Severity.Info,
                        message: nls_1.localize('no local extensions', "There are no extensions to install.")
                    });
                }
            });
        }
        onDidAccept(selectedItems) {
            if (selectedItems.length) {
                const localExtensionsToInstall = selectedItems.filter(r => !!r.extension).map(r => r.extension);
                if (localExtensionsToInstall.length) {
                    this.progressService.withProgress({
                        location: 15 /* Notification */,
                        title: nls_1.localize('installing extensions', "Installing Extensions...")
                    }, () => this.installLocalExtensions(localExtensionsToInstall));
                }
            }
        }
        installLocalExtensions(localExtensionsToInstall) {
            return __awaiter(this, void 0, void 0, function* () {
                const galleryExtensions = [];
                const vsixs = [];
                yield Promise.all(localExtensionsToInstall.map((extension) => __awaiter(this, void 0, void 0, function* () {
                    if (this.extensionGalleryService.isEnabled()) {
                        const gallery = yield this.extensionGalleryService.getCompatibleExtension(extension.identifier, extension.version);
                        if (gallery) {
                            galleryExtensions.push(gallery);
                            return;
                        }
                    }
                    const vsix = yield this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.zip(extension.local);
                    vsixs.push(vsix);
                })));
                yield Promise.all(galleryExtensions.map(gallery => this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.installFromGallery(gallery)));
                yield Promise.all(vsixs.map(vsix => this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.install(vsix)));
                this.notificationService.notify({
                    severity: notification_1.Severity.Info,
                    message: nls_1.localize('finished installing', "Successfully installed extensions in {0}. Please reload the window to enable them.", this.extensionManagementServerService.remoteExtensionManagementServer.label),
                    actions: {
                        primary: [new actions_1.Action('realod', nls_1.localize('reload', "Reload Window"), '', true, () => this.windowService.reloadWindow())]
                    }
                });
            });
        }
    };
    InstallLocalExtensionsInRemoteAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IExtensionManagementServerService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, notification_1.INotificationService),
        __param(5, windows_1.IWindowService),
        __param(6, progress_1.IProgressService),
        __param(7, instantiation_1.IInstantiationService)
    ], InstallLocalExtensionsInRemoteAction);
    exports.InstallLocalExtensionsInRemoteAction = InstallLocalExtensionsInRemoteAction;
    commands_1.CommandsRegistry.registerCommand('workbench.extensions.action.showExtensionsForLanguage', function (accessor, fileExtension) {
        const viewletService = accessor.get(viewlet_2.IViewletService);
        return viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
            .then(viewlet => viewlet)
            .then(viewlet => {
            viewlet.search(`ext:${fileExtension.replace(/^\./, '')}`);
            viewlet.focus();
        });
    });
    commands_1.CommandsRegistry.registerCommand('workbench.extensions.action.showExtensionsWithIds', function (accessor, extensionIds) {
        const viewletService = accessor.get(viewlet_2.IViewletService);
        return viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
            .then(viewlet => viewlet)
            .then(viewlet => {
            const query = extensionIds
                .map(id => `@id:${id}`)
                .join(' ');
            viewlet.search(query);
            viewlet.focus();
        });
    });
    exports.extensionButtonProminentBackground = colorRegistry_1.registerColor('extensionButton.prominentBackground', {
        dark: '#327e36',
        light: '#327e36',
        hc: null
    }, nls_1.localize('extensionButtonProminentBackground', "Button background color for actions extension that stand out (e.g. install button)."));
    exports.extensionButtonProminentForeground = colorRegistry_1.registerColor('extensionButton.prominentForeground', {
        dark: color_1.Color.white,
        light: color_1.Color.white,
        hc: null
    }, nls_1.localize('extensionButtonProminentForeground', "Button foreground color for actions extension that stand out (e.g. install button)."));
    exports.extensionButtonProminentHoverBackground = colorRegistry_1.registerColor('extensionButton.prominentHoverBackground', {
        dark: '#28632b',
        light: '#28632b',
        hc: null
    }, nls_1.localize('extensionButtonProminentHoverBackground', "Button background hover color for actions extension that stand out (e.g. install button)."));
    themeService_1.registerThemingParticipant((theme, collector) => {
        const foregroundColor = theme.getColor(colorRegistry_1.foreground);
        if (foregroundColor) {
            collector.addRule(`.extension .monaco-action-bar .action-item .action-label.extension-action.built-in-status { border-color: ${foregroundColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item .action-label.extension-action.built-in-status { border-color: ${foregroundColor}; }`);
        }
        const buttonBackgroundColor = theme.getColor(colorRegistry_1.buttonBackground);
        if (buttonBackgroundColor) {
            collector.addRule(`.extension .monaco-action-bar .action-item .action-label.extension-action { background-color: ${buttonBackgroundColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item .action-label.extension-action { background-color: ${buttonBackgroundColor}; }`);
        }
        const buttonForegroundColor = theme.getColor(colorRegistry_1.buttonForeground);
        if (buttonForegroundColor) {
            collector.addRule(`.extension .monaco-action-bar .action-item .action-label.extension-action { color: ${buttonForegroundColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item .action-label.extension-action { color: ${buttonForegroundColor}; }`);
        }
        const buttonHoverBackgroundColor = theme.getColor(colorRegistry_1.buttonHoverBackground);
        if (buttonHoverBackgroundColor) {
            collector.addRule(`.extension .monaco-action-bar .action-item:hover .action-label.extension-action { background-color: ${buttonHoverBackgroundColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item:hover .action-label.extension-action { background-color: ${buttonHoverBackgroundColor}; }`);
        }
        const contrastBorderColor = theme.getColor(colorRegistry_1.contrastBorder);
        if (contrastBorderColor) {
            collector.addRule(`.extension .monaco-action-bar .action-item .action-label.extension-action { border: 1px solid ${contrastBorderColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item .action-label.extension-action { border: 1px solid ${contrastBorderColor}; }`);
        }
        const extensionButtonProminentBackgroundColor = theme.getColor(exports.extensionButtonProminentBackground);
        if (exports.extensionButtonProminentBackground) {
            collector.addRule(`.extension .monaco-action-bar .action-item .action-label.extension-action.prominent { background-color: ${extensionButtonProminentBackgroundColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item .action-label.extension-action.prominent { background-color: ${extensionButtonProminentBackgroundColor}; }`);
        }
        const extensionButtonProminentForegroundColor = theme.getColor(exports.extensionButtonProminentForeground);
        if (exports.extensionButtonProminentForeground) {
            collector.addRule(`.extension .monaco-action-bar .action-item .action-label.extension-action.prominent { color: ${extensionButtonProminentForegroundColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item .action-label.extension-action.prominent { color: ${extensionButtonProminentForegroundColor}; }`);
        }
        const extensionButtonProminentHoverBackgroundColor = theme.getColor(exports.extensionButtonProminentHoverBackground);
        if (exports.extensionButtonProminentHoverBackground) {
            collector.addRule(`.extension .monaco-action-bar .action-item:hover .action-label.extension-action.prominent { background-color: ${extensionButtonProminentHoverBackgroundColor}; }`);
            collector.addRule(`.extension-editor .monaco-action-bar .action-item:hover .action-label.extension-action.prominent { background-color: ${extensionButtonProminentHoverBackgroundColor}; }`);
        }
    });
});
//# sourceMappingURL=extensionsActions.js.map