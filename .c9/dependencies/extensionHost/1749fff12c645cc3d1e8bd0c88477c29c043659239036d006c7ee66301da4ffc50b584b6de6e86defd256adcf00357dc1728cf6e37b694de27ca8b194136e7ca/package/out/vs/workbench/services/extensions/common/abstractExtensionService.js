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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/performance", "vs/base/common/resources", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/extensions/common/extensionDescriptionRegistry", "vs/platform/extensions/common/extensions", "vs/platform/files/common/files", "vs/workbench/services/extensions/common/extensionDevOptions", "vs/platform/product/common/product"], function (require, exports, arrays_1, async_1, event_1, lifecycle_1, perf, resources_1, environmentService_1, extensionManagement_1, extensionManagementUtil_1, instantiation_1, notification_1, telemetry_1, extensions_1, extensionsRegistry_1, extensionDescriptionRegistry_1, extensions_2, files_1, extensionDevOptions_1, product_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const hasOwnProperty = Object.hasOwnProperty;
    const NO_OP_VOID_PROMISE = Promise.resolve(undefined);
    let AbstractExtensionService = class AbstractExtensionService extends lifecycle_1.Disposable {
        constructor(_instantiationService, _notificationService, _environmentService, _telemetryService, _extensionEnablementService, _fileService, _productService) {
            super();
            this._instantiationService = _instantiationService;
            this._notificationService = _notificationService;
            this._environmentService = _environmentService;
            this._telemetryService = _telemetryService;
            this._extensionEnablementService = _extensionEnablementService;
            this._fileService = _fileService;
            this._productService = _productService;
            this._onDidRegisterExtensions = this._register(new event_1.Emitter());
            this.onDidRegisterExtensions = this._onDidRegisterExtensions.event;
            this._onDidChangeExtensionsStatus = this._register(new event_1.Emitter());
            this.onDidChangeExtensionsStatus = this._onDidChangeExtensionsStatus.event;
            this._onDidChangeExtensions = this._register(new event_1.Emitter());
            this.onDidChangeExtensions = this._onDidChangeExtensions.event;
            this._onWillActivateByEvent = this._register(new event_1.Emitter());
            this.onWillActivateByEvent = this._onWillActivateByEvent.event;
            this._onDidChangeResponsiveChange = this._register(new event_1.Emitter());
            this.onDidChangeResponsiveChange = this._onDidChangeResponsiveChange.event;
            this._allRequestedActivateEvents = new Set();
            // help the file service to activate providers by activating extensions by file system event
            this._register(this._fileService.onWillActivateFileSystemProvider(e => {
                e.join(this.activateByEvent(`onFileSystem:${e.scheme}`));
            }));
            this._registry = new extensionDescriptionRegistry_1.ExtensionDescriptionRegistry([]);
            this._installedExtensionsReady = new async_1.Barrier();
            this._isDev = !this._environmentService.isBuilt || this._environmentService.isExtensionDevelopment;
            this._extensionsMessages = new Map();
            this._proposedApiController = new ProposedApiController(this._environmentService, this._productService);
            this._extensionHostProcessManagers = [];
            this._extensionHostActiveExtensions = new Map();
            this._extensionHostProcessActivationTimes = new Map();
            this._extensionHostExtensionRuntimeErrors = new Map();
            const devOpts = extensionDevOptions_1.parseExtensionDevOptions(this._environmentService);
            this._isExtensionDevHost = devOpts.isExtensionDevHost;
            this._isExtensionDevTestFromCli = devOpts.isExtensionDevTestFromCli;
        }
        _initialize() {
            return __awaiter(this, void 0, void 0, function* () {
                perf.mark('willLoadExtensions');
                this._startExtensionHostProcess(true, []);
                this.whenInstalledExtensionsRegistered().then(() => perf.mark('didLoadExtensions'));
                yield this._scanAndHandleExtensions();
                this._releaseBarrier();
            });
        }
        _releaseBarrier() {
            perf.mark('extensionHostReady');
            this._installedExtensionsReady.open();
            this._onDidRegisterExtensions.fire(undefined);
            this._onDidChangeExtensionsStatus.fire(this._registry.getAllExtensionDescriptions().map(e => e.identifier));
        }
        _stopExtensionHostProcess() {
            let previouslyActivatedExtensionIds = [];
            this._extensionHostActiveExtensions.forEach((value) => {
                previouslyActivatedExtensionIds.push(value);
            });
            for (const manager of this._extensionHostProcessManagers) {
                manager.dispose();
            }
            this._extensionHostProcessManagers = [];
            this._extensionHostActiveExtensions = new Map();
            this._extensionHostProcessActivationTimes = new Map();
            this._extensionHostExtensionRuntimeErrors = new Map();
            if (previouslyActivatedExtensionIds.length > 0) {
                this._onDidChangeExtensionsStatus.fire(previouslyActivatedExtensionIds);
            }
        }
        _startExtensionHostProcess(isInitialStart, initialActivationEvents) {
            this._stopExtensionHostProcess();
            const processManagers = this._createExtensionHosts(isInitialStart, initialActivationEvents);
            processManagers.forEach((processManager) => {
                processManager.onDidExit(([code, signal]) => this._onExtensionHostCrashOrExit(processManager, code, signal));
                processManager.onDidChangeResponsiveState((responsiveState) => { this._onDidChangeResponsiveChange.fire({ isResponsive: responsiveState === 0 /* Responsive */ }); });
                this._extensionHostProcessManagers.push(processManager);
            });
        }
        _onExtensionHostCrashOrExit(extensionHost, code, signal) {
            // Unexpected termination
            if (!this._isExtensionDevHost) {
                this._onExtensionHostCrashed(extensionHost, code, signal);
                return;
            }
            this._onExtensionHostExit(code);
        }
        _onExtensionHostCrashed(extensionHost, code, signal) {
            console.error('Extension host terminated unexpectedly. Code: ', code, ' Signal: ', signal);
            this._stopExtensionHostProcess();
        }
        //#region IExtensionService
        canAddExtension(extension) {
            return false;
        }
        canRemoveExtension(extension) {
            return false;
        }
        restartExtensionHost() {
            this._stopExtensionHostProcess();
            this._startExtensionHostProcess(false, Array.from(this._allRequestedActivateEvents.keys()));
        }
        startExtensionHost() {
            this._startExtensionHostProcess(false, Array.from(this._allRequestedActivateEvents.keys()));
        }
        activateByEvent(activationEvent) {
            if (this._installedExtensionsReady.isOpen()) {
                // Extensions have been scanned and interpreted
                // Record the fact that this activationEvent was requested (in case of a restart)
                this._allRequestedActivateEvents.add(activationEvent);
                if (!this._registry.containsActivationEvent(activationEvent)) {
                    // There is no extension that is interested in this activation event
                    return NO_OP_VOID_PROMISE;
                }
                return this._activateByEvent(activationEvent);
            }
            else {
                // Extensions have not been scanned yet.
                // Record the fact that this activationEvent was requested (in case of a restart)
                this._allRequestedActivateEvents.add(activationEvent);
                return this._installedExtensionsReady.wait().then(() => this._activateByEvent(activationEvent));
            }
        }
        _activateByEvent(activationEvent) {
            const result = Promise.all(this._extensionHostProcessManagers.map(extHostManager => extHostManager.activateByEvent(activationEvent))).then(() => { });
            this._onWillActivateByEvent.fire({
                event: activationEvent,
                activation: result
            });
            return result;
        }
        whenInstalledExtensionsRegistered() {
            return this._installedExtensionsReady.wait();
        }
        getExtensions() {
            return this._installedExtensionsReady.wait().then(() => {
                return this._registry.getAllExtensionDescriptions();
            });
        }
        getExtension(id) {
            return this._installedExtensionsReady.wait().then(() => {
                return this._registry.getExtensionDescription(id);
            });
        }
        readExtensionPointContributions(extPoint) {
            return this._installedExtensionsReady.wait().then(() => {
                const availableExtensions = this._registry.getAllExtensionDescriptions();
                const result = [];
                for (const desc of availableExtensions) {
                    if (desc.contributes && hasOwnProperty.call(desc.contributes, extPoint.name)) {
                        result.push(new extensions_1.ExtensionPointContribution(desc, desc.contributes[extPoint.name]));
                    }
                }
                return result;
            });
        }
        getExtensionsStatus() {
            let result = Object.create(null);
            if (this._registry) {
                const extensions = this._registry.getAllExtensionDescriptions();
                for (const extension of extensions) {
                    const extensionKey = extensions_2.ExtensionIdentifier.toKey(extension.identifier);
                    result[extension.identifier.value] = {
                        messages: this._extensionsMessages.get(extensionKey) || [],
                        activationTimes: this._extensionHostProcessActivationTimes.get(extensionKey),
                        runtimeErrors: this._extensionHostExtensionRuntimeErrors.get(extensionKey) || [],
                    };
                }
            }
            return result;
        }
        getInspectPort() {
            return 0;
        }
        setRemoteEnvironment(env) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this._extensionHostProcessManagers
                    .map(manager => manager.setRemoteEnvironment(env));
            });
        }
        //#endregion
        // --- impl
        _checkEnableProposedApi(extensions) {
            for (let extension of extensions) {
                this._proposedApiController.updateEnableProposedApi(extension);
            }
        }
        _isExtensionUnderDevelopment(extension) {
            if (this._environmentService.isExtensionDevelopment) {
                const extDevLocs = this._environmentService.extensionDevelopmentLocationURI;
                if (extDevLocs) {
                    const extLocation = extension.extensionLocation;
                    for (let p of extDevLocs) {
                        if (resources_1.isEqualOrParent(extLocation, p)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        _isEnabled(extension) {
            if (this._isExtensionUnderDevelopment(extension)) {
                // Never disable extensions under development
                return true;
            }
            if (extensions_2.ExtensionIdentifier.equals(extension.identifier, extensionManagementUtil_1.BetterMergeId)) {
                // Check if this is the better merge extension which was migrated to a built-in extension
                return false;
            }
            return this._extensionEnablementService.isEnabled(extensions_1.toExtension(extension));
        }
        _doHandleExtensionPoints(affectedExtensions) {
            const affectedExtensionPoints = Object.create(null);
            for (let extensionDescription of affectedExtensions) {
                if (extensionDescription.contributes) {
                    for (let extPointName in extensionDescription.contributes) {
                        if (hasOwnProperty.call(extensionDescription.contributes, extPointName)) {
                            affectedExtensionPoints[extPointName] = true;
                        }
                    }
                }
            }
            const messageHandler = (msg) => this._handleExtensionPointMessage(msg);
            const availableExtensions = this._registry.getAllExtensionDescriptions();
            const extensionPoints = extensionsRegistry_1.ExtensionsRegistry.getExtensionPoints();
            for (const extensionPoint of extensionPoints) {
                if (affectedExtensionPoints[extensionPoint.name]) {
                    AbstractExtensionService._handleExtensionPoint(extensionPoint, availableExtensions, messageHandler);
                }
            }
        }
        _handleExtensionPointMessage(msg) {
            const extensionKey = extensions_2.ExtensionIdentifier.toKey(msg.extensionId);
            if (!this._extensionsMessages.has(extensionKey)) {
                this._extensionsMessages.set(extensionKey, []);
            }
            this._extensionsMessages.get(extensionKey).push(msg);
            const extension = this._registry.getExtensionDescription(msg.extensionId);
            const strMsg = `[${msg.extensionId.value}]: ${msg.message}`;
            if (extension && extension.isUnderDevelopment) {
                // This message is about the extension currently being developed
                this._showMessageToUser(msg.type, strMsg);
            }
            else {
                this._logMessageInConsole(msg.type, strMsg);
            }
            if (!this._isDev && msg.extensionId) {
                const { type, extensionId, extensionPointId, message } = msg;
                this._telemetryService.publicLog2('extensionsMessage', {
                    type, extensionId: extensionId.value, extensionPointId, message
                });
            }
        }
        static _handleExtensionPoint(extensionPoint, availableExtensions, messageHandler) {
            const users = [];
            for (const desc of availableExtensions) {
                if (desc.contributes && hasOwnProperty.call(desc.contributes, extensionPoint.name)) {
                    users.push({
                        description: desc,
                        value: desc.contributes[extensionPoint.name],
                        collector: new extensionsRegistry_1.ExtensionMessageCollector(messageHandler, desc, extensionPoint.name)
                    });
                }
            }
            perf.mark(`willHandleExtensionPoint/${extensionPoint.name}`);
            extensionPoint.acceptUsers(users);
            perf.mark(`didHandleExtensionPoint/${extensionPoint.name}`);
        }
        _showMessageToUser(severity, msg) {
            if (severity === notification_1.Severity.Error || severity === notification_1.Severity.Warning) {
                this._notificationService.notify({ severity, message: msg });
            }
            else {
                this._logMessageInConsole(severity, msg);
            }
        }
        _logMessageInConsole(severity, msg) {
            if (severity === notification_1.Severity.Error) {
                console.error(msg);
            }
            else if (severity === notification_1.Severity.Warning) {
                console.warn(msg);
            }
            else {
                console.log(msg);
            }
        }
        //#region Called by extension host
        _logOrShowMessage(severity, msg) {
            if (this._isDev) {
                this._showMessageToUser(severity, msg);
            }
            else {
                this._logMessageInConsole(severity, msg);
            }
        }
        _activateById(extensionId, activationEvent) {
            return __awaiter(this, void 0, void 0, function* () {
                const results = yield Promise.all(this._extensionHostProcessManagers.map(manager => manager.activate(extensionId, activationEvent)));
                const activated = results.some(e => e);
                if (!activated) {
                    throw new Error(`Unknown extension ${extensionId.value}`);
                }
            });
        }
        _onWillActivateExtension(extensionId) {
            this._extensionHostActiveExtensions.set(extensions_2.ExtensionIdentifier.toKey(extensionId), extensionId);
        }
        _onDidActivateExtension(extensionId, startup, codeLoadingTime, activateCallTime, activateResolvedTime, activationEvent) {
            this._extensionHostProcessActivationTimes.set(extensions_2.ExtensionIdentifier.toKey(extensionId), new extensions_1.ActivationTimes(startup, codeLoadingTime, activateCallTime, activateResolvedTime, activationEvent));
            this._onDidChangeExtensionsStatus.fire([extensionId]);
        }
        _onExtensionRuntimeError(extensionId, err) {
            const extensionKey = extensions_2.ExtensionIdentifier.toKey(extensionId);
            if (!this._extensionHostExtensionRuntimeErrors.has(extensionKey)) {
                this._extensionHostExtensionRuntimeErrors.set(extensionKey, []);
            }
            this._extensionHostExtensionRuntimeErrors.get(extensionKey).push(err);
            this._onDidChangeExtensionsStatus.fire([extensionId]);
        }
    };
    AbstractExtensionService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notification_1.INotificationService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, extensionManagement_1.IExtensionEnablementService),
        __param(5, files_1.IFileService),
        __param(6, product_1.IProductService)
    ], AbstractExtensionService);
    exports.AbstractExtensionService = AbstractExtensionService;
    let ProposedApiController = class ProposedApiController {
        constructor(environmentService, productService) {
            this.enableProposedApiFor = environmentService.args['enable-proposed-api'] || [];
            if (this.enableProposedApiFor.length) {
                // Make enabled proposed API be lowercase for case insensitive comparison
                if (Array.isArray(this.enableProposedApiFor)) {
                    this.enableProposedApiFor = this.enableProposedApiFor.map(id => id.toLowerCase());
                }
                else {
                    this.enableProposedApiFor = this.enableProposedApiFor.toLowerCase();
                }
            }
            this.enableProposedApiForAll = !environmentService.isBuilt ||
                (!!environmentService.extensionDevelopmentLocationURI && productService.nameLong !== 'Visual Studio Code') ||
                (this.enableProposedApiFor.length === 0 && 'enable-proposed-api' in environmentService.args);
            this.productAllowProposedApi = new Set();
            if (arrays_1.isNonEmptyArray(productService.extensionAllowedProposedApi)) {
                productService.extensionAllowedProposedApi.forEach((id) => this.productAllowProposedApi.add(extensions_2.ExtensionIdentifier.toKey(id)));
            }
        }
        updateEnableProposedApi(extension) {
            if (this._allowProposedApiFromProduct(extension.identifier)) {
                // fast lane -> proposed api is available to all extensions
                // that are listed in product.json-files
                extension.enableProposedApi = true;
            }
            else if (extension.enableProposedApi && !extension.isBuiltin) {
                if (!this.enableProposedApiForAll &&
                    this.enableProposedApiFor.indexOf(extension.identifier.value.toLowerCase()) < 0) {
                    extension.enableProposedApi = false;
                    console.error(`Extension '${extension.identifier.value} cannot use PROPOSED API (must started out of dev or enabled via --enable-proposed-api)`);
                }
                else {
                    // proposed api is available when developing or when an extension was explicitly
                    // spelled out via a command line argument
                    console.warn(`Extension '${extension.identifier.value}' uses PROPOSED API which is subject to change and removal without notice.`);
                }
            }
        }
        _allowProposedApiFromProduct(id) {
            return this.productAllowProposedApi.has(extensions_2.ExtensionIdentifier.toKey(id));
        }
    };
    ProposedApiController = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, product_1.IProductService)
    ], ProposedApiController);
});
//# sourceMappingURL=abstractExtensionService.js.map