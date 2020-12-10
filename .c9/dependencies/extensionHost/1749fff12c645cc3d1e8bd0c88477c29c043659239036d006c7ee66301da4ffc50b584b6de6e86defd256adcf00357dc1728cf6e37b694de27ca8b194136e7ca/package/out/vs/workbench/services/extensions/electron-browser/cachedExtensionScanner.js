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
define(["require", "exports", "vs/nls", "os", "vs/base/common/path", "vs/base/common/amd", "vs/base/common/errors", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/node/pfs", "vs/platform/environment/common/environment", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensions/common/extensions", "vs/platform/product/node/package", "vs/platform/product/node/product", "vs/platform/notification/common/notification", "vs/platform/windows/common/windows", "vs/workbench/services/extensions/node/extensionPoints"], function (require, exports, nls, os, path, amd_1, errors, network_1, objects, platform, resources_1, uri_1, pfs, environment_1, extensionManagement_1, extensions_1, package_1, product_1, notification_1, windows_1, extensionPoints_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let _SystemExtensionsRoot = null;
    function getSystemExtensionsRoot() {
        if (!_SystemExtensionsRoot) {
            _SystemExtensionsRoot = path.normalize(path.join(amd_1.getPathFromAmdModule(require, ''), '..', 'extensions'));
        }
        return _SystemExtensionsRoot;
    }
    let _ExtraDevSystemExtensionsRoot = null;
    function getExtraDevSystemExtensionsRoot() {
        if (!_ExtraDevSystemExtensionsRoot) {
            _ExtraDevSystemExtensionsRoot = path.normalize(path.join(amd_1.getPathFromAmdModule(require, ''), '..', '.build', 'builtInExtensions'));
        }
        return _ExtraDevSystemExtensionsRoot;
    }
    let CachedExtensionScanner = class CachedExtensionScanner {
        constructor(_notificationService, _environmentService, _extensionEnablementService, _windowService) {
            this._notificationService = _notificationService;
            this._environmentService = _environmentService;
            this._extensionEnablementService = _extensionEnablementService;
            this._windowService = _windowService;
            this.scannedExtensions = new Promise((resolve, reject) => {
                this._scannedExtensionsResolve = resolve;
                this._scannedExtensionsReject = reject;
            });
            this.translationConfig = CachedExtensionScanner._readTranslationConfig();
        }
        scanSingleExtension(path, isBuiltin, log) {
            return __awaiter(this, void 0, void 0, function* () {
                const translations = yield this.translationConfig;
                const version = package_1.default.version;
                const commit = product_1.default.commit;
                const devMode = !!process.env['VSCODE_DEV'];
                const locale = platform.language;
                const input = new extensionPoints_1.ExtensionScannerInput(version, commit, locale, devMode, path, isBuiltin, false, translations);
                return extensionPoints_1.ExtensionScanner.scanSingleExtension(input, log);
            });
        }
        startScanningExtensions(log) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const translations = yield this.translationConfig;
                    const { system, user, development } = yield CachedExtensionScanner._scanInstalledExtensions(this._windowService, this._notificationService, this._environmentService, this._extensionEnablementService, log, translations);
                    let result = new Map();
                    system.forEach((systemExtension) => {
                        const extensionKey = extensions_1.ExtensionIdentifier.toKey(systemExtension.identifier);
                        const extension = result.get(extensionKey);
                        if (extension) {
                            log.warn(systemExtension.extensionLocation.fsPath, nls.localize('overwritingExtension', "Overwriting extension {0} with {1}.", extension.extensionLocation.fsPath, systemExtension.extensionLocation.fsPath));
                        }
                        result.set(extensionKey, systemExtension);
                    });
                    user.forEach((userExtension) => {
                        const extensionKey = extensions_1.ExtensionIdentifier.toKey(userExtension.identifier);
                        const extension = result.get(extensionKey);
                        if (extension) {
                            log.warn(userExtension.extensionLocation.fsPath, nls.localize('overwritingExtension', "Overwriting extension {0} with {1}.", extension.extensionLocation.fsPath, userExtension.extensionLocation.fsPath));
                        }
                        result.set(extensionKey, userExtension);
                    });
                    development.forEach(developedExtension => {
                        log.info('', nls.localize('extensionUnderDevelopment', "Loading development extension at {0}", developedExtension.extensionLocation.fsPath));
                        const extensionKey = extensions_1.ExtensionIdentifier.toKey(developedExtension.identifier);
                        result.set(extensionKey, developedExtension);
                    });
                    let r = [];
                    result.forEach((value) => r.push(value));
                    this._scannedExtensionsResolve(r);
                }
                catch (err) {
                    this._scannedExtensionsReject(err);
                }
            });
        }
        static _validateExtensionsCache(windowService, notificationService, environmentService, cacheKey, input) {
            return __awaiter(this, void 0, void 0, function* () {
                const cacheFolder = path.join(environmentService.userDataPath, extensions_1.MANIFEST_CACHE_FOLDER);
                const cacheFile = path.join(cacheFolder, cacheKey);
                const expected = JSON.parse(JSON.stringify(yield extensionPoints_1.ExtensionScanner.scanExtensions(input, new NullLogger())));
                const cacheContents = yield this._readExtensionCache(environmentService, cacheKey);
                if (!cacheContents) {
                    // Cache has been deleted by someone else, which is perfectly fine...
                    return;
                }
                const actual = cacheContents.result;
                if (objects.equals(expected, actual)) {
                    // Cache is valid and running with it is perfectly fine...
                    return;
                }
                try {
                    yield pfs.rimraf(cacheFile, pfs.RimRafMode.MOVE);
                }
                catch (err) {
                    errors.onUnexpectedError(err);
                    console.error(err);
                }
                notificationService.prompt(notification_1.Severity.Error, nls.localize('extensionCache.invalid', "Extensions have been modified on disk. Please reload the window."), [{
                        label: nls.localize('reloadWindow', "Reload Window"),
                        run: () => windowService.reloadWindow()
                    }]);
            });
        }
        static _readExtensionCache(environmentService, cacheKey) {
            return __awaiter(this, void 0, void 0, function* () {
                const cacheFolder = path.join(environmentService.userDataPath, extensions_1.MANIFEST_CACHE_FOLDER);
                const cacheFile = path.join(cacheFolder, cacheKey);
                try {
                    const cacheRawContents = yield pfs.readFile(cacheFile, 'utf8');
                    return JSON.parse(cacheRawContents);
                }
                catch (err) {
                    // That's ok...
                }
                return null;
            });
        }
        static _writeExtensionCache(environmentService, cacheKey, cacheContents) {
            return __awaiter(this, void 0, void 0, function* () {
                const cacheFolder = path.join(environmentService.userDataPath, extensions_1.MANIFEST_CACHE_FOLDER);
                const cacheFile = path.join(cacheFolder, cacheKey);
                try {
                    yield pfs.mkdirp(cacheFolder);
                }
                catch (err) {
                    // That's ok...
                }
                try {
                    yield pfs.writeFile(cacheFile, JSON.stringify(cacheContents));
                }
                catch (err) {
                    // That's ok...
                }
            });
        }
        static _scanExtensionsWithCache(windowService, notificationService, environmentService, cacheKey, input, log) {
            return __awaiter(this, void 0, void 0, function* () {
                if (input.devMode) {
                    // Do not cache when running out of sources...
                    return extensionPoints_1.ExtensionScanner.scanExtensions(input, log);
                }
                try {
                    const folderStat = yield pfs.stat(input.absoluteFolderPath);
                    input.mtime = folderStat.mtime.getTime();
                }
                catch (err) {
                    // That's ok...
                }
                const cacheContents = yield this._readExtensionCache(environmentService, cacheKey);
                if (cacheContents && cacheContents.input && extensionPoints_1.ExtensionScannerInput.equals(cacheContents.input, input)) {
                    // Validate the cache asynchronously after 5s
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        try {
                            yield this._validateExtensionsCache(windowService, notificationService, environmentService, cacheKey, input);
                        }
                        catch (err) {
                            errors.onUnexpectedError(err);
                        }
                    }), 5000);
                    return cacheContents.result.map((extensionDescription) => {
                        // revive URI object
                        extensionDescription.extensionLocation = uri_1.URI.revive(extensionDescription.extensionLocation);
                        return extensionDescription;
                    });
                }
                const counterLogger = new CounterLogger(log);
                const result = yield extensionPoints_1.ExtensionScanner.scanExtensions(input, counterLogger);
                if (counterLogger.errorCnt === 0) {
                    // Nothing bad happened => cache the result
                    const cacheContents = {
                        input: input,
                        result: result
                    };
                    yield this._writeExtensionCache(environmentService, cacheKey, cacheContents);
                }
                return result;
            });
        }
        static _readTranslationConfig() {
            return __awaiter(this, void 0, void 0, function* () {
                if (platform.translationsConfigFile) {
                    try {
                        const content = yield pfs.readFile(platform.translationsConfigFile, 'utf8');
                        return JSON.parse(content);
                    }
                    catch (err) {
                        // no problemo
                    }
                }
                return Object.create(null);
            });
        }
        static _scanInstalledExtensions(windowService, notificationService, environmentService, extensionEnablementService, log, translations) {
            const version = package_1.default.version;
            const commit = product_1.default.commit;
            const devMode = !!process.env['VSCODE_DEV'];
            const locale = platform.language;
            const builtinExtensions = this._scanExtensionsWithCache(windowService, notificationService, environmentService, extensions_1.BUILTIN_MANIFEST_CACHE_FILE, new extensionPoints_1.ExtensionScannerInput(version, commit, locale, devMode, getSystemExtensionsRoot(), true, false, translations), log);
            let finalBuiltinExtensions = builtinExtensions;
            if (devMode) {
                const builtInExtensionsFilePath = path.normalize(path.join(amd_1.getPathFromAmdModule(require, ''), '..', 'build', 'builtInExtensions.json'));
                const builtInExtensions = pfs.readFile(builtInExtensionsFilePath, 'utf8')
                    .then(raw => JSON.parse(raw));
                const controlFilePath = path.join(os.homedir(), '.vscode-oss-dev', 'extensions', 'control.json');
                const controlFile = pfs.readFile(controlFilePath, 'utf8')
                    .then(raw => JSON.parse(raw), () => ({}));
                const input = new extensionPoints_1.ExtensionScannerInput(version, commit, locale, devMode, getExtraDevSystemExtensionsRoot(), true, false, translations);
                const extraBuiltinExtensions = Promise.all([builtInExtensions, controlFile])
                    .then(([builtInExtensions, control]) => new ExtraBuiltInExtensionResolver(builtInExtensions, control))
                    .then(resolver => extensionPoints_1.ExtensionScanner.scanExtensions(input, log, resolver));
                finalBuiltinExtensions = extensionPoints_1.ExtensionScanner.mergeBuiltinExtensions(builtinExtensions, extraBuiltinExtensions);
            }
            const userExtensions = (extensionEnablementService.allUserExtensionsDisabled || !environmentService.extensionsPath
                ? Promise.resolve([])
                : this._scanExtensionsWithCache(windowService, notificationService, environmentService, extensions_1.USER_MANIFEST_CACHE_FILE, new extensionPoints_1.ExtensionScannerInput(version, commit, locale, devMode, environmentService.extensionsPath, false, false, translations), log));
            // Always load developed extensions while extensions development
            let developedExtensions = Promise.resolve([]);
            if (environmentService.isExtensionDevelopment && environmentService.extensionDevelopmentLocationURI) {
                const extDescsP = environmentService.extensionDevelopmentLocationURI.filter(extLoc => extLoc.scheme === network_1.Schemas.file).map(extLoc => {
                    return extensionPoints_1.ExtensionScanner.scanOneOrMultipleExtensions(new extensionPoints_1.ExtensionScannerInput(version, commit, locale, devMode, resources_1.originalFSPath(extLoc), false, true, translations), log);
                });
                developedExtensions = Promise.all(extDescsP).then((extDescArrays) => {
                    let extDesc = [];
                    for (let eds of extDescArrays) {
                        extDesc = extDesc.concat(eds);
                    }
                    return extDesc;
                });
            }
            return Promise.all([finalBuiltinExtensions, userExtensions, developedExtensions]).then((extensionDescriptions) => {
                const system = extensionDescriptions[0];
                const user = extensionDescriptions[1];
                const development = extensionDescriptions[2];
                return { system, user, development };
            }).then(undefined, err => {
                log.error('', err);
                return { system: [], user: [], development: [] };
            });
        }
    };
    CachedExtensionScanner = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, extensionManagement_1.IExtensionEnablementService),
        __param(3, windows_1.IWindowService)
    ], CachedExtensionScanner);
    exports.CachedExtensionScanner = CachedExtensionScanner;
    class ExtraBuiltInExtensionResolver {
        constructor(builtInExtensions, control) {
            this.builtInExtensions = builtInExtensions;
            this.control = control;
        }
        resolveExtensions() {
            const result = [];
            for (const ext of this.builtInExtensions) {
                const controlState = this.control[ext.name] || 'marketplace';
                switch (controlState) {
                    case 'disabled':
                        break;
                    case 'marketplace':
                        result.push({ name: ext.name, path: path.join(getExtraDevSystemExtensionsRoot(), ext.name) });
                        break;
                    default:
                        result.push({ name: ext.name, path: controlState });
                        break;
                }
            }
            return Promise.resolve(result);
        }
    }
    class CounterLogger {
        constructor(_actual) {
            this._actual = _actual;
            this.errorCnt = 0;
            this.warnCnt = 0;
            this.infoCnt = 0;
        }
        error(source, message) {
            this._actual.error(source, message);
        }
        warn(source, message) {
            this._actual.warn(source, message);
        }
        info(source, message) {
            this._actual.info(source, message);
        }
    }
    class NullLogger {
        error(source, message) {
        }
        warn(source, message) {
        }
        info(source, message) {
        }
    }
});
//# sourceMappingURL=cachedExtensionScanner.js.map