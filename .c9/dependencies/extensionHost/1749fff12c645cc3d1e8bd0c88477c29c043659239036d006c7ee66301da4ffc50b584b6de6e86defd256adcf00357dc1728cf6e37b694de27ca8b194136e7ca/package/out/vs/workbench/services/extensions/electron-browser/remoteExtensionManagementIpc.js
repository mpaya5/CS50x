/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "os", "vs/base/common/uri", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/errorMessage", "vs/workbench/services/extensions/common/extensionsUtil", "vs/base/common/arrays", "vs/base/common/map", "vs/base/common/cancellation", "vs/nls", "vs/platform/extensionManagement/common/extensionManagementIpc"], function (require, exports, os_1, uri_1, extensionManagementUtil_1, errorMessage_1, extensionsUtil_1, arrays_1, map_1, cancellation_1, nls_1, extensionManagementIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RemoteExtensionManagementChannelClient extends extensionManagementIpc_1.ExtensionManagementChannelClient {
        constructor(channel, localExtensionManagementService, galleryService, logService, configurationService, productService) {
            super(channel);
            this.localExtensionManagementService = localExtensionManagementService;
            this.galleryService = galleryService;
            this.logService = logService;
            this.configurationService = configurationService;
            this.productService = productService;
        }
        install(vsix) {
            const _super = Object.create(null, {
                install: { get: () => super.install }
            });
            return __awaiter(this, void 0, void 0, function* () {
                const local = yield _super.install.call(this, vsix);
                yield this.installUIDependenciesAndPackedExtensions(local);
                return local;
            });
        }
        installFromGallery(extension) {
            return __awaiter(this, void 0, void 0, function* () {
                const local = yield this.doInstallFromGallery(extension);
                yield this.installUIDependenciesAndPackedExtensions(local);
                return local;
            });
        }
        doInstallFromGallery(extension) {
            const _super = Object.create(null, {
                installFromGallery: { get: () => super.installFromGallery }
            });
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const local = yield _super.installFromGallery.call(this, extension);
                    return local;
                }
                catch (error) {
                    try {
                        this.logService.error(`Error while installing '${extension.identifier.id}' extension in the remote server.`, errorMessage_1.toErrorMessage(error));
                        this.logService.info(`Trying to download '${extension.identifier.id}' extension locally and install`);
                        const local = yield this.downloadCompatibleAndInstall(extension);
                        this.logService.info(`Successfully installed '${extension.identifier.id}' extension`);
                        return local;
                    }
                    catch (e) {
                        this.logService.error(e);
                        throw error;
                    }
                }
            });
        }
        downloadCompatibleAndInstall(extension) {
            return __awaiter(this, void 0, void 0, function* () {
                const installed = yield this.getInstalled(1 /* User */);
                const compatible = yield this.galleryService.getCompatibleExtension(extension);
                if (!compatible) {
                    return Promise.reject(new Error(nls_1.localize('incompatible', "Unable to install extension '{0}' as it is not compatible with VS Code '{1}'.", extension.identifier.id, this.productService.version)));
                }
                const manifest = yield this.galleryService.getManifest(compatible, cancellation_1.CancellationToken.None);
                if (manifest) {
                    const workspaceExtensions = yield this.getAllWorkspaceDependenciesAndPackedExtensions(manifest, cancellation_1.CancellationToken.None);
                    yield Promise.all(workspaceExtensions.map(e => this.downloadAndInstall(e, installed)));
                }
                return this.downloadAndInstall(extension, installed);
            });
        }
        downloadAndInstall(extension, installed) {
            const _super = Object.create(null, {
                install: { get: () => super.install }
            });
            return __awaiter(this, void 0, void 0, function* () {
                const location = yield this.galleryService.download(extension, uri_1.URI.file(os_1.tmpdir()), installed.filter(i => extensionManagementUtil_1.areSameExtensions(i.identifier, extension.identifier))[0] ? 2 /* Update */ : 1 /* Install */);
                return _super.install.call(this, location);
            });
        }
        installUIDependenciesAndPackedExtensions(local) {
            return __awaiter(this, void 0, void 0, function* () {
                const uiExtensions = yield this.getAllUIDependenciesAndPackedExtensions(local.manifest, cancellation_1.CancellationToken.None);
                const installed = yield this.localExtensionManagementService.getInstalled();
                const toInstall = uiExtensions.filter(e => installed.every(i => !extensionManagementUtil_1.areSameExtensions(i.identifier, e.identifier)));
                yield Promise.all(toInstall.map(d => this.localExtensionManagementService.installFromGallery(d)));
            });
        }
        getAllUIDependenciesAndPackedExtensions(manifest, token) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = new Map();
                const extensions = [...(manifest.extensionPack || []), ...(manifest.extensionDependencies || [])];
                yield this.getDependenciesAndPackedExtensionsRecursively(extensions, result, true, token);
                return map_1.values(result);
            });
        }
        getAllWorkspaceDependenciesAndPackedExtensions(manifest, token) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = new Map();
                const extensions = [...(manifest.extensionPack || []), ...(manifest.extensionDependencies || [])];
                yield this.getDependenciesAndPackedExtensionsRecursively(extensions, result, false, token);
                return map_1.values(result);
            });
        }
        getDependenciesAndPackedExtensionsRecursively(toGet, result, uiExtension, token) {
            return __awaiter(this, void 0, void 0, function* () {
                if (toGet.length === 0) {
                    return Promise.resolve();
                }
                const extensions = (yield this.galleryService.query({ names: toGet, pageSize: toGet.length }, token)).firstPage;
                const manifests = yield Promise.all(extensions.map(e => this.galleryService.getManifest(e, token)));
                const extensionsManifests = [];
                for (let idx = 0; idx < extensions.length; idx++) {
                    const extension = extensions[idx];
                    const manifest = manifests[idx];
                    if (manifest && extensionsUtil_1.isUIExtension(manifest, this.productService, this.configurationService) === uiExtension) {
                        result.set(extension.identifier.id.toLowerCase(), extension);
                        extensionsManifests.push(manifest);
                    }
                }
                toGet = [];
                for (const extensionManifest of extensionsManifests) {
                    if (arrays_1.isNonEmptyArray(extensionManifest.extensionDependencies)) {
                        for (const id of extensionManifest.extensionDependencies) {
                            if (!result.has(id.toLowerCase())) {
                                toGet.push(id);
                            }
                        }
                    }
                    if (arrays_1.isNonEmptyArray(extensionManifest.extensionPack)) {
                        for (const id of extensionManifest.extensionPack) {
                            if (!result.has(id.toLowerCase())) {
                                toGet.push(id);
                            }
                        }
                    }
                }
                return this.getDependenciesAndPackedExtensionsRecursively(toGet, result, uiExtension, token);
            });
        }
    }
    exports.RemoteExtensionManagementChannelClient = RemoteExtensionManagementChannelClient;
});
//# sourceMappingURL=remoteExtensionManagementIpc.js.map