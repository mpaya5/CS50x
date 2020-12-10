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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/url/common/url", "vs/platform/windows/common/windows", "vs/workbench/services/extensions/common/extensions", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/common/contributions"], function (require, exports, nls_1, actions_1, lifecycle_1, uri_1, configuration_1, dialogs_1, extensionManagement_1, extensionManagement_2, extensionManagementUtil_1, instantiation_1, notification_1, storage_1, url_1, windows_1, extensions_1, extensions_2, extensions_3, platform_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const FIVE_MINUTES = 5 * 60 * 1000;
    const THIRTY_SECONDS = 30 * 1000;
    const URL_TO_HANDLE = 'extensionUrlHandler.urlToHandle';
    const CONFIRMED_EXTENSIONS_CONFIGURATION_KEY = 'extensions.confirmedUriHandlerExtensionIds';
    const CONFIRMED_EXTENSIONS_STORAGE_KEY = 'extensionUrlHandler.confirmedExtensions';
    function isExtensionId(value) {
        return /^[a-z0-9][a-z0-9\-]*\.[a-z0-9][a-z0-9\-]*$/i.test(value);
    }
    exports.IExtensionUrlHandler = instantiation_1.createDecorator('inactiveExtensionUrlHandler');
    /**
     * This class handles URLs which are directed towards inactive extensions.
     * If a URL is directed towards an inactive extension, it buffers it,
     * activates the extension and re-opens the URL once the extension registers
     * a URL handler. If the extension never registers a URL handler, the urls
     * will eventually be garbage collected.
     *
     * It also makes sure the user confirms opening URLs directed towards extensions.
     */
    let ExtensionUrlHandler = class ExtensionUrlHandler {
        constructor(urlService, extensionService, dialogService, notificationService, extensionManagementService, extensionEnablementService, windowService, galleryService, storageService, configurationService) {
            this.extensionService = extensionService;
            this.dialogService = dialogService;
            this.notificationService = notificationService;
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this.windowService = windowService;
            this.galleryService = galleryService;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.extensionHandlers = new Map();
            this.uriBuffer = new Map();
            const interval = setInterval(() => this.garbageCollect(), THIRTY_SECONDS);
            const urlToHandleValue = this.storageService.get(URL_TO_HANDLE, 1 /* WORKSPACE */);
            if (urlToHandleValue) {
                this.storageService.remove(URL_TO_HANDLE, 1 /* WORKSPACE */);
                this.handleURL(uri_1.URI.revive(JSON.parse(urlToHandleValue)), true);
            }
            this.disposable = lifecycle_1.combinedDisposable(urlService.registerHandler(this), lifecycle_1.toDisposable(() => clearInterval(interval)));
            const cache = ExtensionUrlBootstrapHandler.cache;
            setTimeout(() => cache.forEach(uri => this.handleURL(uri)));
        }
        handleURL(uri, confirmed) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!isExtensionId(uri.authority)) {
                    return false;
                }
                const extensionId = uri.authority;
                const wasHandlerAvailable = this.extensionHandlers.has(extensions_2.ExtensionIdentifier.toKey(extensionId));
                const extension = yield this.extensionService.getExtension(extensionId);
                if (!extension) {
                    yield this.handleUnhandledURL(uri, { id: extensionId });
                    return true;
                }
                if (!confirmed) {
                    const confirmedExtensionIds = this.getConfirmedExtensionIds();
                    confirmed = confirmedExtensionIds.has(extensions_2.ExtensionIdentifier.toKey(extensionId));
                }
                if (!confirmed) {
                    let uriString = uri.toString();
                    if (uriString.length > 40) {
                        uriString = `${uriString.substring(0, 30)}...${uriString.substring(uriString.length - 5)}`;
                    }
                    const result = yield this.dialogService.confirm({
                        message: nls_1.localize('confirmUrl', "Allow an extension to open this URL?", extensionId),
                        checkbox: {
                            label: nls_1.localize('rememberConfirmUrl', "Don't ask again for this extension."),
                        },
                        detail: `${extension.displayName || extension.name} (${extensionId}) wants to open a URL:\n\n${uriString}`,
                        primaryButton: nls_1.localize('open', "&&Open"),
                        type: 'question'
                    });
                    if (!result.confirmed) {
                        return true;
                    }
                    if (result.checkboxChecked) {
                        this.addConfirmedExtensionIdToStorage(extensionId);
                    }
                }
                const handler = this.extensionHandlers.get(extensions_2.ExtensionIdentifier.toKey(extensionId));
                if (handler) {
                    if (!wasHandlerAvailable) {
                        // forward it directly
                        return yield handler.handleURL(uri);
                    }
                    // let the ExtensionUrlHandler instance handle this
                    return false;
                }
                // collect URI for eventual extension activation
                const timestamp = new Date().getTime();
                let uris = this.uriBuffer.get(extensions_2.ExtensionIdentifier.toKey(extensionId));
                if (!uris) {
                    uris = [];
                    this.uriBuffer.set(extensions_2.ExtensionIdentifier.toKey(extensionId), uris);
                }
                uris.push({ timestamp, uri });
                // activate the extension
                yield this.extensionService.activateByEvent(`onUri:${extensions_2.ExtensionIdentifier.toKey(extensionId)}`);
                return true;
            });
        }
        registerExtensionHandler(extensionId, handler) {
            this.extensionHandlers.set(extensions_2.ExtensionIdentifier.toKey(extensionId), handler);
            const uris = this.uriBuffer.get(extensions_2.ExtensionIdentifier.toKey(extensionId)) || [];
            for (const { uri } of uris) {
                handler.handleURL(uri);
            }
            this.uriBuffer.delete(extensions_2.ExtensionIdentifier.toKey(extensionId));
        }
        unregisterExtensionHandler(extensionId) {
            this.extensionHandlers.delete(extensions_2.ExtensionIdentifier.toKey(extensionId));
        }
        handleUnhandledURL(uri, extensionIdentifier) {
            return __awaiter(this, void 0, void 0, function* () {
                const installedExtensions = yield this.extensionManagementService.getInstalled();
                const extension = installedExtensions.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, extensionIdentifier))[0];
                // Extension is installed
                if (extension) {
                    const enabled = this.extensionEnablementService.isEnabled(extension);
                    // Extension is not running. Reload the window to handle.
                    if (enabled) {
                        const result = yield this.dialogService.confirm({
                            message: nls_1.localize('reloadAndHandle', "Extension '{0}' is not loaded. Would you like to reload the window to load the extension and open the URL?", extension.manifest.displayName || extension.manifest.name),
                            detail: `${extension.manifest.displayName || extension.manifest.name} (${extensionIdentifier.id}) wants to open a URL:\n\n${uri.toString()}`,
                            primaryButton: nls_1.localize('reloadAndOpen', "&&Reload Window and Open"),
                            type: 'question'
                        });
                        if (!result.confirmed) {
                            return;
                        }
                        yield this.reloadAndHandle(uri);
                    }
                    // Extension is disabled. Enable the extension and reload the window to handle.
                    else {
                        const result = yield this.dialogService.confirm({
                            message: nls_1.localize('enableAndHandle', "Extension '{0}' is disabled. Would you like to enable the extension and reload the window to open the URL?", extension.manifest.displayName || extension.manifest.name),
                            detail: `${extension.manifest.displayName || extension.manifest.name} (${extensionIdentifier.id}) wants to open a URL:\n\n${uri.toString()}`,
                            primaryButton: nls_1.localize('enableAndReload', "&&Enable and Open"),
                            type: 'question'
                        });
                        if (!result.confirmed) {
                            return;
                        }
                        yield this.extensionEnablementService.setEnablement([extension], 4 /* EnabledGlobally */);
                        yield this.reloadAndHandle(uri);
                    }
                }
                // Extension is not installed
                else {
                    const galleryExtension = yield this.galleryService.getCompatibleExtension(extensionIdentifier);
                    if (!galleryExtension) {
                        return;
                    }
                    // Install the Extension and reload the window to handle.
                    const result = yield this.dialogService.confirm({
                        message: nls_1.localize('installAndHandle', "Extension '{0}' is not installed. Would you like to install the extension and reload the window to open this URL?", galleryExtension.displayName || galleryExtension.name),
                        detail: `${galleryExtension.displayName || galleryExtension.name} (${extensionIdentifier.id}) wants to open a URL:\n\n${uri.toString()}`,
                        primaryButton: nls_1.localize('install', "&&Install"),
                        type: 'question'
                    });
                    if (!result.confirmed) {
                        return;
                    }
                    let notificationHandle = this.notificationService.notify({ severity: notification_1.Severity.Info, message: nls_1.localize('Installing', "Installing Extension '{0}'...", galleryExtension.displayName || galleryExtension.name) });
                    notificationHandle.progress.infinite();
                    notificationHandle.onDidClose(() => notificationHandle = null);
                    try {
                        yield this.extensionManagementService.installFromGallery(galleryExtension);
                        const reloadMessage = nls_1.localize('reload', "Would you like to reload the window and open the URL '{0}'?", uri.toString());
                        const reloadActionLabel = nls_1.localize('Reload', "Reload Window and Open");
                        if (notificationHandle) {
                            notificationHandle.progress.done();
                            notificationHandle.updateMessage(reloadMessage);
                            notificationHandle.updateActions({
                                primary: [new actions_1.Action('reloadWindow', reloadActionLabel, undefined, true, () => this.reloadAndHandle(uri))]
                            });
                        }
                        else {
                            this.notificationService.prompt(notification_1.Severity.Info, reloadMessage, [{ label: reloadActionLabel, run: () => this.reloadAndHandle(uri) }], { sticky: true });
                        }
                    }
                    catch (e) {
                        if (notificationHandle) {
                            notificationHandle.progress.done();
                            notificationHandle.updateSeverity(notification_1.Severity.Error);
                            notificationHandle.updateMessage(e);
                        }
                        else {
                            this.notificationService.error(e);
                        }
                    }
                }
            });
        }
        reloadAndHandle(url) {
            return __awaiter(this, void 0, void 0, function* () {
                this.storageService.store(URL_TO_HANDLE, JSON.stringify(url.toJSON()), 1 /* WORKSPACE */);
                yield this.windowService.reloadWindow();
            });
        }
        // forget about all uris buffered more than 5 minutes ago
        garbageCollect() {
            const now = new Date().getTime();
            const uriBuffer = new Map();
            this.uriBuffer.forEach((uris, extensionId) => {
                uris = uris.filter(({ timestamp }) => now - timestamp < FIVE_MINUTES);
                if (uris.length > 0) {
                    uriBuffer.set(extensionId, uris);
                }
            });
            this.uriBuffer = uriBuffer;
        }
        getConfirmedExtensionIds() {
            const ids = [
                ...this.getConfirmedExtensionIdsFromStorage(),
                ...this.getConfirmedExtensionIdsFromConfiguration(),
            ].map(extensionId => extensions_2.ExtensionIdentifier.toKey(extensionId));
            return new Set(ids);
        }
        getConfirmedExtensionIdsFromConfiguration() {
            const confirmedExtensionIds = this.configurationService.getValue(CONFIRMED_EXTENSIONS_CONFIGURATION_KEY);
            if (!Array.isArray(confirmedExtensionIds)) {
                return [];
            }
            return confirmedExtensionIds;
        }
        getConfirmedExtensionIdsFromStorage() {
            const confirmedExtensionIdsJson = this.storageService.get(CONFIRMED_EXTENSIONS_STORAGE_KEY, 0 /* GLOBAL */, '[]');
            try {
                return JSON.parse(confirmedExtensionIdsJson);
            }
            catch (err) {
                return [];
            }
        }
        addConfirmedExtensionIdToStorage(extensionId) {
            const existingConfirmedExtensionIds = this.getConfirmedExtensionIdsFromStorage();
            this.storageService.store(CONFIRMED_EXTENSIONS_STORAGE_KEY, JSON.stringify([
                ...existingConfirmedExtensionIds,
                extensions_2.ExtensionIdentifier.toKey(extensionId),
            ]), 0 /* GLOBAL */);
        }
        dispose() {
            this.disposable.dispose();
            this.extensionHandlers.clear();
            this.uriBuffer.clear();
        }
    };
    ExtensionUrlHandler = __decorate([
        __param(0, url_1.IURLService),
        __param(1, extensions_1.IExtensionService),
        __param(2, dialogs_1.IDialogService),
        __param(3, notification_1.INotificationService),
        __param(4, extensionManagement_1.IExtensionManagementService),
        __param(5, extensionManagement_2.IExtensionEnablementService),
        __param(6, windows_1.IWindowService),
        __param(7, extensionManagement_1.IExtensionGalleryService),
        __param(8, storage_1.IStorageService),
        __param(9, configuration_1.IConfigurationService)
    ], ExtensionUrlHandler);
    extensions_3.registerSingleton(exports.IExtensionUrlHandler, ExtensionUrlHandler);
    /**
     * This class handles URLs before `ExtensionUrlHandler` is instantiated.
     * More info: https://github.com/microsoft/vscode/issues/73101
     */
    let ExtensionUrlBootstrapHandler = class ExtensionUrlBootstrapHandler {
        constructor(urlService) {
            ExtensionUrlBootstrapHandler.disposable = urlService.registerHandler(this);
        }
        static get cache() {
            ExtensionUrlBootstrapHandler.disposable.dispose();
            const result = ExtensionUrlBootstrapHandler._cache;
            ExtensionUrlBootstrapHandler._cache = [];
            return result;
        }
        handleURL(uri) {
            ExtensionUrlBootstrapHandler._cache.push(uri);
            return Promise.resolve(true);
        }
    };
    ExtensionUrlBootstrapHandler._cache = [];
    ExtensionUrlBootstrapHandler = __decorate([
        __param(0, url_1.IURLService)
    ], ExtensionUrlBootstrapHandler);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(ExtensionUrlBootstrapHandler, 2 /* Ready */);
});
//# sourceMappingURL=inactiveExtensionUrlHandler.js.map