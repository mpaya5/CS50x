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
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/platform/product/node/package", "vs/platform/product/node/product", "vs/base/common/uri", "vs/workbench/services/activity/common/activity", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/activity", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/platform/update/common/update", "semver-umd", "vs/platform/environment/common/environment", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/environment/common/environmentService", "./releaseNotesEditor", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkeys", "vs/workbench/contrib/update/common/update", "vs/platform/windows/common/windows"], function (require, exports, nls, severity_1, actions_1, lifecycle_1, package_1, product_1, uri_1, activity_1, instantiation_1, activity_2, opener_1, storage_1, update_1, semver, environment_1, notification_1, dialogs_1, environmentService_1, releaseNotesEditor_1, platform_1, configuration_1, contextkey_1, actions_2, commands_1, contextkeys_1, update_2, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const CONTEXT_UPDATE_STATE = new contextkey_1.RawContextKey('updateState', "uninitialized" /* Uninitialized */);
    let releaseNotesManager = undefined;
    function showReleaseNotes(instantiationService, version) {
        if (!releaseNotesManager) {
            releaseNotesManager = instantiationService.createInstance(releaseNotesEditor_1.ReleaseNotesManager);
        }
        return instantiationService.invokeFunction(accessor => releaseNotesManager.show(accessor, version));
    }
    let OpenLatestReleaseNotesInBrowserAction = class OpenLatestReleaseNotesInBrowserAction extends actions_1.Action {
        constructor(openerService) {
            super('update.openLatestReleaseNotes', nls.localize('releaseNotes', "Release Notes"), undefined, true);
            this.openerService = openerService;
        }
        run() {
            if (product_1.default.releaseNotesUrl) {
                const uri = uri_1.URI.parse(product_1.default.releaseNotesUrl);
                return this.openerService.open(uri);
            }
            return Promise.resolve(false);
        }
    };
    OpenLatestReleaseNotesInBrowserAction = __decorate([
        __param(0, opener_1.IOpenerService)
    ], OpenLatestReleaseNotesInBrowserAction);
    exports.OpenLatestReleaseNotesInBrowserAction = OpenLatestReleaseNotesInBrowserAction;
    let AbstractShowReleaseNotesAction = class AbstractShowReleaseNotesAction extends actions_1.Action {
        constructor(id, label, version, instantiationService) {
            super(id, label, undefined, true);
            this.version = version;
            this.instantiationService = instantiationService;
        }
        run() {
            if (!this.enabled) {
                return Promise.resolve(false);
            }
            this.enabled = false;
            return showReleaseNotes(this.instantiationService, this.version)
                .then(undefined, () => {
                const action = this.instantiationService.createInstance(OpenLatestReleaseNotesInBrowserAction);
                return action.run().then(() => false);
            });
        }
    };
    AbstractShowReleaseNotesAction = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], AbstractShowReleaseNotesAction);
    exports.AbstractShowReleaseNotesAction = AbstractShowReleaseNotesAction;
    let ShowReleaseNotesAction = class ShowReleaseNotesAction extends AbstractShowReleaseNotesAction {
        constructor(version, instantiationService) {
            super('update.showReleaseNotes', nls.localize('releaseNotes', "Release Notes"), version, instantiationService);
        }
    };
    ShowReleaseNotesAction = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ShowReleaseNotesAction);
    exports.ShowReleaseNotesAction = ShowReleaseNotesAction;
    let ShowCurrentReleaseNotesAction = class ShowCurrentReleaseNotesAction extends AbstractShowReleaseNotesAction {
        constructor(id = ShowCurrentReleaseNotesAction.ID, label = ShowCurrentReleaseNotesAction.LABEL, instantiationService) {
            super(id, label, package_1.default.version, instantiationService);
        }
    };
    ShowCurrentReleaseNotesAction.ID = update_2.ShowCurrentReleaseNotesActionId;
    ShowCurrentReleaseNotesAction.LABEL = nls.localize('showReleaseNotes', "Show Release Notes");
    ShowCurrentReleaseNotesAction = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], ShowCurrentReleaseNotesAction);
    exports.ShowCurrentReleaseNotesAction = ShowCurrentReleaseNotesAction;
    let ProductContribution = class ProductContribution {
        constructor(storageService, instantiationService, notificationService, environmentService, openerService, configurationService, windowService, windowsService) {
            windowsService.getActiveWindowId().then((windowId) => __awaiter(this, void 0, void 0, function* () {
                if (windowId !== windowService.windowId) {
                    return;
                }
                const lastVersion = storageService.get(ProductContribution.KEY, 0 /* GLOBAL */, '');
                const shouldShowReleaseNotes = configurationService.getValue('update.showReleaseNotes');
                // was there an update? if so, open release notes
                if (shouldShowReleaseNotes && !environmentService.skipReleaseNotes && product_1.default.releaseNotesUrl && lastVersion && package_1.default.version !== lastVersion) {
                    showReleaseNotes(instantiationService, package_1.default.version)
                        .then(undefined, () => {
                        notificationService.prompt(severity_1.default.Info, nls.localize('read the release notes', "Welcome to {0} v{1}! Would you like to read the Release Notes?", product_1.default.nameLong, package_1.default.version), [{
                                label: nls.localize('releaseNotes', "Release Notes"),
                                run: () => {
                                    const uri = uri_1.URI.parse(product_1.default.releaseNotesUrl);
                                    openerService.open(uri);
                                }
                            }], { sticky: true });
                    });
                }
                // should we show the new license?
                if (product_1.default.licenseUrl && lastVersion && semver.satisfies(lastVersion, '<1.0.0') && semver.satisfies(package_1.default.version, '>=1.0.0')) {
                    notificationService.info(nls.localize('licenseChanged', "Our license terms have changed, please click [here]({0}) to go through them.", product_1.default.licenseUrl));
                }
                storageService.store(ProductContribution.KEY, package_1.default.version, 0 /* GLOBAL */);
            }));
        }
    };
    ProductContribution.KEY = 'releaseNotes/lastVersion';
    ProductContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notification_1.INotificationService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, opener_1.IOpenerService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, windows_1.IWindowService),
        __param(7, windows_1.IWindowsService)
    ], ProductContribution);
    exports.ProductContribution = ProductContribution;
    let Win3264BitContribution = class Win3264BitContribution {
        constructor(storageService, notificationService, environmentService) {
            if (environmentService.disableUpdates) {
                return;
            }
            const url = product_1.default.quality === 'insider'
                ? Win3264BitContribution.INSIDER_URL
                : Win3264BitContribution.URL;
            notificationService.prompt(severity_1.default.Info, nls.localize('64bitisavailable', "{0} for 64-bit Windows is now available! Click [here]({1}) to learn more.", product_1.default.nameShort, url), [], {
                sticky: true,
                neverShowAgain: { id: 'neverShowAgain:update/win32-64bits', isSecondary: true }
            });
        }
    };
    Win3264BitContribution.URL = 'https://code.visualstudio.com/updates/v1_15#_windows-64-bit';
    Win3264BitContribution.INSIDER_URL = 'https://github.com/Microsoft/vscode-docs/blob/vnext/release-notes/v1_15.md#windows-64-bit';
    Win3264BitContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, notification_1.INotificationService),
        __param(2, environment_1.IEnvironmentService)
    ], Win3264BitContribution);
    exports.Win3264BitContribution = Win3264BitContribution;
    let UpdateContribution = class UpdateContribution extends lifecycle_1.Disposable {
        constructor(storageService, instantiationService, notificationService, dialogService, updateService, activityService, environmentService, contextKeyService) {
            super();
            this.storageService = storageService;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.updateService = updateService;
            this.activityService = activityService;
            this.environmentService = environmentService;
            this.contextKeyService = contextKeyService;
            this.badgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.state = updateService.state;
            this.updateStateContextKey = CONTEXT_UPDATE_STATE.bindTo(this.contextKeyService);
            this._register(updateService.onStateChange(this.onUpdateStateChange, this));
            this.onUpdateStateChange(this.updateService.state);
            /*
            The `update/lastKnownVersion` and `update/updateNotificationTime` storage keys are used in
            combination to figure out when to show a message to the user that he should update.
    
            This message should appear if the user has received an update notification but hasn't
            updated since 5 days.
            */
            const currentVersion = product_1.default.commit;
            const lastKnownVersion = this.storageService.get('update/lastKnownVersion', 0 /* GLOBAL */);
            // if current version != stored version, clear both fields
            if (currentVersion !== lastKnownVersion) {
                this.storageService.remove('update/lastKnownVersion', 0 /* GLOBAL */);
                this.storageService.remove('update/updateNotificationTime', 0 /* GLOBAL */);
            }
            this.registerGlobalActivityActions();
        }
        onUpdateStateChange(state) {
            this.updateStateContextKey.set(state.type);
            switch (state.type) {
                case "idle" /* Idle */:
                    if (state.error) {
                        this.onError(state.error);
                    }
                    else if (this.state.type === "checking for updates" /* CheckingForUpdates */ && this.state.context && this.state.context.windowId === this.environmentService.configuration.windowId) {
                        this.onUpdateNotAvailable();
                    }
                    break;
                case "available for download" /* AvailableForDownload */:
                    this.onUpdateAvailable(state.update);
                    break;
                case "downloaded" /* Downloaded */:
                    this.onUpdateDownloaded(state.update);
                    break;
                case "updating" /* Updating */:
                    this.onUpdateUpdating(state.update);
                    break;
                case "ready" /* Ready */:
                    this.onUpdateReady(state.update);
                    break;
            }
            let badge = undefined;
            let clazz;
            if (state.type === "available for download" /* AvailableForDownload */ || state.type === "downloaded" /* Downloaded */ || state.type === "ready" /* Ready */) {
                badge = new activity_1.NumberBadge(1, () => nls.localize('updateIsReady', "New {0} update available.", product_1.default.nameShort));
            }
            else if (state.type === "checking for updates" /* CheckingForUpdates */ || state.type === "downloading" /* Downloading */ || state.type === "updating" /* Updating */) {
                badge = new activity_1.ProgressBadge(() => nls.localize('updateIsReady', "New {0} update available.", product_1.default.nameShort));
                clazz = 'progress-badge';
            }
            this.badgeDisposable.clear();
            if (badge) {
                this.badgeDisposable.value = this.activityService.showActivity(activity_2.GLOBAL_ACTIVITY_ID, badge, clazz);
            }
            this.state = state;
        }
        onError(error) {
            error = error.replace(/See https:\/\/github\.com\/Squirrel\/Squirrel\.Mac\/issues\/182 for more information/, 'See [this link](https://github.com/Microsoft/vscode/issues/7426#issuecomment-425093469) for more information');
            this.notificationService.notify({
                severity: notification_1.Severity.Error,
                message: error,
                source: nls.localize('update service', "Update Service"),
            });
        }
        onUpdateNotAvailable() {
            this.dialogService.show(severity_1.default.Info, nls.localize('noUpdatesAvailable', "There are currently no updates available."), [nls.localize('ok', "OK")]);
        }
        // linux
        onUpdateAvailable(update) {
            if (!this.shouldShowNotification()) {
                return;
            }
            this.notificationService.prompt(severity_1.default.Info, nls.localize('thereIsUpdateAvailable', "There is an available update."), [{
                    label: nls.localize('download update', "Download Update"),
                    run: () => this.updateService.downloadUpdate()
                }, {
                    label: nls.localize('later', "Later"),
                    run: () => { }
                }, {
                    label: nls.localize('releaseNotes', "Release Notes"),
                    run: () => {
                        const action = this.instantiationService.createInstance(ShowReleaseNotesAction, update.productVersion);
                        action.run();
                        action.dispose();
                    }
                }], { sticky: true });
        }
        // windows fast updates (target === system)
        onUpdateDownloaded(update) {
            if (!this.shouldShowNotification()) {
                return;
            }
            this.notificationService.prompt(severity_1.default.Info, nls.localize('updateAvailable', "There's an update available: {0} {1}", product_1.default.nameLong, update.productVersion), [{
                    label: nls.localize('installUpdate', "Install Update"),
                    run: () => this.updateService.applyUpdate()
                }, {
                    label: nls.localize('later', "Later"),
                    run: () => { }
                }, {
                    label: nls.localize('releaseNotes', "Release Notes"),
                    run: () => {
                        const action = this.instantiationService.createInstance(ShowReleaseNotesAction, update.productVersion);
                        action.run();
                        action.dispose();
                    }
                }], { sticky: true });
        }
        // windows fast updates
        onUpdateUpdating(update) {
            if (platform_1.isWindows && product_1.default.target === 'user') {
                return;
            }
            // windows fast updates (target === system)
            this.notificationService.prompt(severity_1.default.Info, nls.localize('updateInstalling', "{0} {1} is being installed in the background; we'll let you know when it's done.", product_1.default.nameLong, update.productVersion), [], {
                neverShowAgain: { id: 'neverShowAgain:update/win32-fast-updates', isSecondary: true }
            });
        }
        // windows and mac
        onUpdateReady(update) {
            if (!(platform_1.isWindows && product_1.default.target !== 'user') && !this.shouldShowNotification()) {
                return;
            }
            const actions = [{
                    label: nls.localize('updateNow', "Update Now"),
                    run: () => this.updateService.quitAndInstall()
                }, {
                    label: nls.localize('later', "Later"),
                    run: () => { }
                }];
            // TODO@joao check why snap updates send `update` as falsy
            if (update.productVersion) {
                actions.push({
                    label: nls.localize('releaseNotes', "Release Notes"),
                    run: () => {
                        const action = this.instantiationService.createInstance(ShowReleaseNotesAction, update.productVersion);
                        action.run();
                        action.dispose();
                    }
                });
            }
            // windows user fast updates and mac
            this.notificationService.prompt(severity_1.default.Info, nls.localize('updateAvailableAfterRestart', "Restart {0} to apply the latest update.", product_1.default.nameLong), actions, { sticky: true });
        }
        shouldShowNotification() {
            const currentVersion = product_1.default.commit;
            const currentMillis = new Date().getTime();
            const lastKnownVersion = this.storageService.get('update/lastKnownVersion', 0 /* GLOBAL */);
            // if version != stored version, save version and date
            if (currentVersion !== lastKnownVersion) {
                this.storageService.store('update/lastKnownVersion', currentVersion, 0 /* GLOBAL */);
                this.storageService.store('update/updateNotificationTime', currentMillis, 0 /* GLOBAL */);
            }
            const updateNotificationMillis = this.storageService.getNumber('update/updateNotificationTime', 0 /* GLOBAL */, currentMillis);
            const diffDays = (currentMillis - updateNotificationMillis) / (1000 * 60 * 60 * 24);
            return diffDays > 5;
        }
        registerGlobalActivityActions() {
            commands_1.CommandsRegistry.registerCommand('update.check', () => this.updateService.checkForUpdates({ windowId: this.environmentService.configuration.windowId }));
            actions_2.MenuRegistry.appendMenuItem(43 /* GlobalActivity */, {
                group: '5_update',
                command: {
                    id: 'update.check',
                    title: nls.localize('checkForUpdates', "Check for Updates...")
                },
                when: CONTEXT_UPDATE_STATE.isEqualTo("idle" /* Idle */)
            });
            commands_1.CommandsRegistry.registerCommand('update.checking', () => { });
            actions_2.MenuRegistry.appendMenuItem(43 /* GlobalActivity */, {
                group: '5_update',
                command: {
                    id: 'update.checking',
                    title: nls.localize('checkingForUpdates', "Checking for Updates..."),
                    precondition: contextkeys_1.FalseContext
                },
                when: CONTEXT_UPDATE_STATE.isEqualTo("checking for updates" /* CheckingForUpdates */)
            });
            commands_1.CommandsRegistry.registerCommand('update.downloadNow', () => this.updateService.downloadUpdate());
            actions_2.MenuRegistry.appendMenuItem(43 /* GlobalActivity */, {
                group: '5_update',
                command: {
                    id: 'update.downloadNow',
                    title: nls.localize('download update', "Download Update")
                },
                when: CONTEXT_UPDATE_STATE.isEqualTo("available for download" /* AvailableForDownload */)
            });
            commands_1.CommandsRegistry.registerCommand('update.downloading', () => { });
            actions_2.MenuRegistry.appendMenuItem(43 /* GlobalActivity */, {
                group: '5_update',
                command: {
                    id: 'update.downloading',
                    title: nls.localize('DownloadingUpdate', "Downloading Update..."),
                    precondition: contextkeys_1.FalseContext
                },
                when: CONTEXT_UPDATE_STATE.isEqualTo("downloading" /* Downloading */)
            });
            commands_1.CommandsRegistry.registerCommand('update.install', () => this.updateService.applyUpdate());
            actions_2.MenuRegistry.appendMenuItem(43 /* GlobalActivity */, {
                group: '5_update',
                command: {
                    id: 'update.install',
                    title: nls.localize('installUpdate...', "Install Update...")
                },
                when: CONTEXT_UPDATE_STATE.isEqualTo("downloaded" /* Downloaded */)
            });
            commands_1.CommandsRegistry.registerCommand('update.updating', () => { });
            actions_2.MenuRegistry.appendMenuItem(43 /* GlobalActivity */, {
                group: '5_update',
                command: {
                    id: 'update.updating',
                    title: nls.localize('installingUpdate', "Installing Update..."),
                    precondition: contextkeys_1.FalseContext
                },
                when: CONTEXT_UPDATE_STATE.isEqualTo("updating" /* Updating */)
            });
            commands_1.CommandsRegistry.registerCommand('update.restart', () => this.updateService.quitAndInstall());
            actions_2.MenuRegistry.appendMenuItem(43 /* GlobalActivity */, {
                group: '5_update',
                command: {
                    id: 'update.restart',
                    title: nls.localize('restartToUpdate', "Restart to Update")
                },
                when: CONTEXT_UPDATE_STATE.isEqualTo("ready" /* Ready */)
            });
        }
    };
    UpdateContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notification_1.INotificationService),
        __param(3, dialogs_1.IDialogService),
        __param(4, update_1.IUpdateService),
        __param(5, activity_1.IActivityService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService),
        __param(7, contextkey_1.IContextKeyService)
    ], UpdateContribution);
    exports.UpdateContribution = UpdateContribution;
});
//# sourceMappingURL=update.js.map