var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "assert", "sinon", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionEnablementService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/event", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/common/environmentService", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/configuration/common/configuration", "vs/base/common/uri", "vs/base/common/network", "vs/platform/remote/common/remoteHosts", "vs/base/common/objects", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/test/workbenchTestServices"], function (require, exports, assert, sinon, extensionManagement_1, extensionManagement_2, extensionEnablementService_1, instantiationServiceMock_1, event_1, workspace_1, environmentService_1, storage_1, types_1, extensionManagementUtil_1, configuration_1, uri_1, network_1, remoteHosts_1, objects_1, testConfigurationService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function storageService(instantiationService) {
        let service = instantiationService.get(storage_1.IStorageService);
        if (!service) {
            let workspaceContextService = instantiationService.get(workspace_1.IWorkspaceContextService);
            if (!workspaceContextService) {
                workspaceContextService = instantiationService.stub(workspace_1.IWorkspaceContextService, {
                    getWorkbenchState: () => 2 /* FOLDER */,
                });
            }
            service = instantiationService.stub(storage_1.IStorageService, new storage_1.InMemoryStorageService());
        }
        return service;
    }
    class TestExtensionEnablementService extends extensionEnablementService_1.ExtensionEnablementService {
        constructor(instantiationService) {
            super(storageService(instantiationService), instantiationService.get(workspace_1.IWorkspaceContextService), instantiationService.get(environmentService_1.IWorkbenchEnvironmentService) || instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { configuration: Object.create(null) }), instantiationService.get(extensionManagement_1.IExtensionManagementService) || instantiationService.stub(extensionManagement_1.IExtensionManagementService, { onDidInstallExtension: new event_1.Emitter().event, onDidUninstallExtension: new event_1.Emitter().event }), instantiationService.get(configuration_1.IConfigurationService), instantiationService.get(extensionManagement_2.IExtensionManagementServerService), workbenchTestServices_1.productService);
        }
        reset() {
            let extensions = this._getDisabledExtensions(0 /* GLOBAL */);
            for (const e of this._getDisabledExtensions(1 /* WORKSPACE */)) {
                if (!extensions.some(r => extensionManagementUtil_1.areSameExtensions(r, e))) {
                    extensions.push(e);
                }
            }
            const workspaceEnabledExtensions = this._getEnabledExtensions(1 /* WORKSPACE */);
            if (workspaceEnabledExtensions.length) {
                extensions = extensions.filter(r => !workspaceEnabledExtensions.some(e => extensionManagementUtil_1.areSameExtensions(e, r)));
            }
            extensions.forEach(d => this.setEnablement([aLocalExtension(d.id)], 4 /* EnabledGlobally */));
        }
    }
    exports.TestExtensionEnablementService = TestExtensionEnablementService;
    suite('ExtensionEnablementService Test', () => {
        let instantiationService;
        let testObject;
        const didUninstallEvent = new event_1.Emitter();
        const didInstallEvent = new event_1.Emitter();
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, { onDidUninstallExtension: didUninstallEvent.event, onDidInstallExtension: didInstallEvent.event, getInstalled: () => Promise.resolve([]) });
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, {
                localExtensionManagementServer: {
                    extensionManagementService: instantiationService.get(extensionManagement_1.IExtensionManagementService)
                }
            });
            testObject = new TestExtensionEnablementService(instantiationService);
        });
        teardown(() => {
            testObject.dispose();
        });
        test('test disable an extension globally', () => __awaiter(this, void 0, void 0, function* () {
            const extension = aLocalExtension('pub.a');
            yield testObject.setEnablement([extension], 2 /* DisabledGlobally */);
            assert.ok(!testObject.isEnabled(extension));
            assert.equal(testObject.getEnablementState(extension), 2 /* DisabledGlobally */);
        }));
        test('test disable an extension globally should return truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */)
                .then(value => assert.ok(value));
        });
        test('test disable an extension globally triggers the change event', () => {
            const target = sinon.spy();
            testObject.onEnablementChanged(target);
            return testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */)
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            });
        });
        test('test disable an extension globally again should return a falsy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */))
                .then(value => assert.ok(!value[0]));
        });
        test('test state of globally disabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */)
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 2 /* DisabledGlobally */));
        });
        test('test state of globally enabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 4 /* EnabledGlobally */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 4 /* EnabledGlobally */));
        });
        test('test disable an extension for workspace', () => __awaiter(this, void 0, void 0, function* () {
            const extension = aLocalExtension('pub.a');
            yield testObject.setEnablement([extension], 3 /* DisabledWorkspace */);
            assert.ok(!testObject.isEnabled(extension));
            assert.equal(testObject.getEnablementState(extension), 3 /* DisabledWorkspace */);
        }));
        test('test disable an extension for workspace returns a truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */)
                .then(value => assert.ok(value));
        });
        test('test disable an extension for workspace again should return a falsy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */))
                .then(value => assert.ok(!value[0]));
        });
        test('test state of workspace disabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */)
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 3 /* DisabledWorkspace */));
        });
        test('test state of workspace and globally disabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 3 /* DisabledWorkspace */));
        });
        test('test state of workspace enabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 5 /* EnabledWorkspace */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 5 /* EnabledWorkspace */));
        });
        test('test state of globally disabled and workspace enabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 5 /* EnabledWorkspace */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 5 /* EnabledWorkspace */));
        });
        test('test state of an extension when disabled for workspace from workspace enabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 5 /* EnabledWorkspace */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 3 /* DisabledWorkspace */));
        });
        test('test state of an extension when disabled globally from workspace enabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 5 /* EnabledWorkspace */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 2 /* DisabledGlobally */));
        });
        test('test state of an extension when disabled globally from workspace disabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 2 /* DisabledGlobally */));
        });
        test('test state of an extension when enabled globally from workspace enabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 5 /* EnabledWorkspace */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 4 /* EnabledGlobally */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 4 /* EnabledGlobally */));
        });
        test('test state of an extension when enabled globally from workspace disabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 4 /* EnabledGlobally */))
                .then(() => assert.equal(testObject.getEnablementState(aLocalExtension('pub.a')), 4 /* EnabledGlobally */));
        });
        test('test disable an extension for workspace and then globally', () => __awaiter(this, void 0, void 0, function* () {
            const extension = aLocalExtension('pub.a');
            yield testObject.setEnablement([extension], 3 /* DisabledWorkspace */);
            yield testObject.setEnablement([extension], 2 /* DisabledGlobally */);
            assert.ok(!testObject.isEnabled(extension));
            assert.equal(testObject.getEnablementState(extension), 2 /* DisabledGlobally */);
        }));
        test('test disable an extension for workspace and then globally return a truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */))
                .then(value => assert.ok(value));
        });
        test('test disable an extension for workspace and then globally trigger the change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */)
                .then(() => testObject.onEnablementChanged(target))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            });
        });
        test('test disable an extension globally and then for workspace', () => __awaiter(this, void 0, void 0, function* () {
            const extension = aLocalExtension('pub.a');
            yield testObject.setEnablement([extension], 2 /* DisabledGlobally */);
            yield testObject.setEnablement([extension], 3 /* DisabledWorkspace */);
            assert.ok(!testObject.isEnabled(extension));
            assert.equal(testObject.getEnablementState(extension), 3 /* DisabledWorkspace */);
        }));
        test('test disable an extension globally and then for workspace return a truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */))
                .then(value => assert.ok(value));
        });
        test('test disable an extension globally and then for workspace triggers the change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */)
                .then(() => testObject.onEnablementChanged(target))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            });
        });
        test('test disable an extension for workspace when there is no workspace throws error', () => {
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkbenchState', 1 /* EMPTY */);
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */)
                .then(() => assert.fail('should throw an error'), error => assert.ok(error));
        });
        test('test enable an extension globally', () => __awaiter(this, void 0, void 0, function* () {
            const extension = aLocalExtension('pub.a');
            yield testObject.setEnablement([extension], 2 /* DisabledGlobally */);
            yield testObject.setEnablement([extension], 4 /* EnabledGlobally */);
            assert.ok(testObject.isEnabled(extension));
            assert.equal(testObject.getEnablementState(extension), 4 /* EnabledGlobally */);
        }));
        test('test enable an extension globally return truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 4 /* EnabledGlobally */))
                .then(value => assert.ok(value));
        });
        test('test enable an extension globally triggers change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */)
                .then(() => testObject.onEnablementChanged(target))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 4 /* EnabledGlobally */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            });
        });
        test('test enable an extension globally when already enabled return falsy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 4 /* EnabledGlobally */)
                .then(value => assert.ok(!value[0]));
        });
        test('test enable an extension for workspace', () => __awaiter(this, void 0, void 0, function* () {
            const extension = aLocalExtension('pub.a');
            yield testObject.setEnablement([extension], 3 /* DisabledWorkspace */);
            yield testObject.setEnablement([extension], 5 /* EnabledWorkspace */);
            assert.ok(testObject.isEnabled(extension));
            assert.equal(testObject.getEnablementState(extension), 5 /* EnabledWorkspace */);
        }));
        test('test enable an extension for workspace return truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 5 /* EnabledWorkspace */))
                .then(value => assert.ok(value));
        });
        test('test enable an extension for workspace triggers change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.b')], 3 /* DisabledWorkspace */)
                .then(() => testObject.onEnablementChanged(target))
                .then(() => testObject.setEnablement([aLocalExtension('pub.b')], 5 /* EnabledWorkspace */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepEqual(target.args[0][0][0].identifier, { id: 'pub.b' });
            });
        });
        test('test enable an extension for workspace when already enabled return truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 5 /* EnabledWorkspace */)
                .then(value => assert.ok(value));
        });
        test('test enable an extension for workspace when disabled in workspace and gloablly', () => __awaiter(this, void 0, void 0, function* () {
            const extension = aLocalExtension('pub.a');
            yield testObject.setEnablement([extension], 3 /* DisabledWorkspace */);
            yield testObject.setEnablement([extension], 2 /* DisabledGlobally */);
            yield testObject.setEnablement([extension], 5 /* EnabledWorkspace */);
            assert.ok(testObject.isEnabled(extension));
            assert.equal(testObject.getEnablementState(extension), 5 /* EnabledWorkspace */);
        }));
        test('test enable an extension globally when disabled in workspace and gloablly', () => __awaiter(this, void 0, void 0, function* () {
            const extension = aLocalExtension('pub.a');
            yield testObject.setEnablement([extension], 5 /* EnabledWorkspace */);
            yield testObject.setEnablement([extension], 3 /* DisabledWorkspace */);
            yield testObject.setEnablement([extension], 2 /* DisabledGlobally */);
            yield testObject.setEnablement([extension], 4 /* EnabledGlobally */);
            assert.ok(testObject.isEnabled(extension));
            assert.equal(testObject.getEnablementState(extension), 4 /* EnabledGlobally */);
        }));
        test('test installing an extension re-eanbles it when disabled globally', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 2 /* DisabledGlobally */);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 1 /* Install */ });
            assert.ok(testObject.isEnabled(local));
            assert.equal(testObject.getEnablementState(local), 4 /* EnabledGlobally */);
        }));
        test('test updating an extension does not re-eanbles it when disabled globally', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 2 /* DisabledGlobally */);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 2 /* Update */ });
            assert.ok(!testObject.isEnabled(local));
            assert.equal(testObject.getEnablementState(local), 2 /* DisabledGlobally */);
        }));
        test('test installing an extension fires enablement change event when disabled globally', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 2 /* DisabledGlobally */);
            return new Promise((c, e) => {
                testObject.onEnablementChanged(([e]) => {
                    if (e.identifier.id === local.identifier.id) {
                        c();
                    }
                });
                didInstallEvent.fire({ local, identifier: local.identifier, operation: 1 /* Install */ });
            });
        }));
        test('test updating an extension does not fires enablement change event when disabled globally', () => __awaiter(this, void 0, void 0, function* () {
            const target = sinon.spy();
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 2 /* DisabledGlobally */);
            testObject.onEnablementChanged(target);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 2 /* Update */ });
            assert.ok(!target.called);
        }));
        test('test installing an extension re-eanbles it when workspace disabled', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 3 /* DisabledWorkspace */);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 1 /* Install */ });
            assert.ok(testObject.isEnabled(local));
            assert.equal(testObject.getEnablementState(local), 4 /* EnabledGlobally */);
        }));
        test('test updating an extension does not re-eanbles it when workspace disabled', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 3 /* DisabledWorkspace */);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 2 /* Update */ });
            assert.ok(!testObject.isEnabled(local));
            assert.equal(testObject.getEnablementState(local), 3 /* DisabledWorkspace */);
        }));
        test('test installing an extension fires enablement change event when workspace disabled', () => __awaiter(this, void 0, void 0, function* () {
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 3 /* DisabledWorkspace */);
            return new Promise((c, e) => {
                testObject.onEnablementChanged(([e]) => {
                    if (e.identifier.id === local.identifier.id) {
                        c();
                    }
                });
                didInstallEvent.fire({ local, identifier: local.identifier, operation: 1 /* Install */ });
            });
        }));
        test('test updating an extension does not fires enablement change event when workspace disabled', () => __awaiter(this, void 0, void 0, function* () {
            const target = sinon.spy();
            const local = aLocalExtension('pub.a');
            yield testObject.setEnablement([local], 3 /* DisabledWorkspace */);
            testObject.onEnablementChanged(target);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 2 /* Update */ });
            assert.ok(!target.called);
        }));
        test('test installing an extension should not fire enablement change event when extension is not disabled', () => __awaiter(this, void 0, void 0, function* () {
            const target = sinon.spy();
            const local = aLocalExtension('pub.a');
            testObject.onEnablementChanged(target);
            didInstallEvent.fire({ local, identifier: local.identifier, operation: 1 /* Install */ });
            assert.ok(!target.called);
        }));
        test('test remove an extension from disablement list when uninstalled', () => __awaiter(this, void 0, void 0, function* () {
            const extension = aLocalExtension('pub.a');
            yield testObject.setEnablement([extension], 3 /* DisabledWorkspace */);
            yield testObject.setEnablement([extension], 2 /* DisabledGlobally */);
            didUninstallEvent.fire({ identifier: { id: 'pub.a' } });
            assert.ok(testObject.isEnabled(extension));
            assert.equal(testObject.getEnablementState(extension), 4 /* EnabledGlobally */);
        }));
        test('test isEnabled return false extension is disabled globally', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 2 /* DisabledGlobally */)
                .then(() => assert.ok(!testObject.isEnabled(aLocalExtension('pub.a'))));
        });
        test('test isEnabled return false extension is disabled in workspace', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */)
                .then(() => assert.ok(!testObject.isEnabled(aLocalExtension('pub.a'))));
        });
        test('test isEnabled return true extension is not disabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 3 /* DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.c')], 2 /* DisabledGlobally */))
                .then(() => assert.ok(testObject.isEnabled(aLocalExtension('pub.b'))));
        });
        test('test canChangeEnablement return false for language packs', () => {
            assert.equal(testObject.canChangeEnablement(aLocalExtension('pub.a', { localizations: [{ languageId: 'gr', translations: [{ id: 'vscode', path: 'path' }] }] })), false);
        });
        test('test canChangeEnablement return false when extensions are disabled in environment', () => {
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: true });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.equal(testObject.canChangeEnablement(aLocalExtension('pub.a')), false);
        });
        test('test canChangeEnablement return false when the extension is disabled in environment', () => {
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: ['pub.a'] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.equal(testObject.canChangeEnablement(aLocalExtension('pub.a')), false);
        });
        test('test canChangeEnablement return true for system extensions when extensions are disabled in environment', () => {
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: true });
            testObject = new TestExtensionEnablementService(instantiationService);
            const extension = aLocalExtension('pub.a', undefined, 0 /* System */);
            assert.equal(testObject.canChangeEnablement(extension), true);
        });
        test('test canChangeEnablement return false for system extension when extension is disabled in environment', () => {
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: ['pub.a'] });
            testObject = new TestExtensionEnablementService(instantiationService);
            const extension = aLocalExtension('pub.a', undefined, 0 /* System */);
            assert.ok(!testObject.canChangeEnablement(extension));
        });
        test('test extension is disabled when disabled in enviroment', () => __awaiter(this, void 0, void 0, function* () {
            const extension = aLocalExtension('pub.a');
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: ['pub.a'] });
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, { onDidUninstallExtension: didUninstallEvent.event, onDidInstallExtension: didInstallEvent.event, getInstalled: () => Promise.resolve([extension, aLocalExtension('pub.b')]) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(!testObject.isEnabled(extension));
            assert.deepEqual(testObject.getEnablementState(extension), 1 /* DisabledByEnvironemt */);
        }));
        test('test local workspace extension is disabled by kind', () => __awaiter(this, void 0, void 0, function* () {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(!testObject.isEnabled(localWorkspaceExtension));
            assert.deepEqual(testObject.getEnablementState(localWorkspaceExtension), 0 /* DisabledByExtensionKind */);
        }));
        test('test local ui extension is not disabled by kind', () => __awaiter(this, void 0, void 0, function* () {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(testObject.isEnabled(localWorkspaceExtension));
            assert.deepEqual(testObject.getEnablementState(localWorkspaceExtension), 4 /* EnabledGlobally */);
        }));
        test('test canChangeEnablement return false when the local workspace extension is disabled by kind', () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.equal(testObject.canChangeEnablement(localWorkspaceExtension), false);
        });
        test('test canChangeEnablement return true for local ui extension', () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.equal(testObject.canChangeEnablement(localWorkspaceExtension), true);
        });
        test('test remote ui extension is disabled by kind', () => __awaiter(this, void 0, void 0, function* () {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(!testObject.isEnabled(localWorkspaceExtension));
            assert.deepEqual(testObject.getEnablementState(localWorkspaceExtension), 0 /* DisabledByExtensionKind */);
        }));
        test('test remote workspace extension is not disabled by kind', () => __awaiter(this, void 0, void 0, function* () {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(testObject.isEnabled(localWorkspaceExtension));
            assert.deepEqual(testObject.getEnablementState(localWorkspaceExtension), 4 /* EnabledGlobally */);
        }));
        test('test canChangeEnablement return false when the remote ui extension is disabled by kind', () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: 'ui' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.equal(testObject.canChangeEnablement(localWorkspaceExtension), false);
        });
        test('test canChangeEnablement return true for remote workspace extension', () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: 'workspace' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.equal(testObject.canChangeEnablement(localWorkspaceExtension), true);
        });
    });
    function aMultiExtensionManagementServerService(instantiationService) {
        const localExtensionManagementServer = {
            authority: 'vscode-local',
            label: 'local',
            extensionManagementService: instantiationService.get(extensionManagement_1.IExtensionManagementService)
        };
        const remoteExtensionManagementServer = {
            authority: 'vscode-remote',
            label: 'remote',
            extensionManagementService: instantiationService.get(extensionManagement_1.IExtensionManagementService)
        };
        return {
            _serviceBrand: {},
            localExtensionManagementServer,
            remoteExtensionManagementServer,
            getExtensionManagementServer: (location) => {
                if (location.scheme === network_1.Schemas.file) {
                    return localExtensionManagementServer;
                }
                if (location.scheme === remoteHosts_1.REMOTE_HOST_SCHEME) {
                    return remoteExtensionManagementServer;
                }
                return null;
            }
        };
    }
    function aLocalExtension(id, contributes, type) {
        return aLocalExtension2(id, contributes ? { contributes } : {}, types_1.isUndefinedOrNull(type) ? {} : { type });
    }
    function aLocalExtension2(id, manifest = {}, properties = {}) {
        const [publisher, name] = id.split('.');
        properties = objects_1.assign({
            identifier: { id },
            galleryIdentifier: { id, uuid: undefined },
            type: 1 /* User */
        }, properties);
        manifest = objects_1.assign({ name, publisher }, manifest);
        return Object.create(Object.assign({ manifest }, properties));
    }
});
//# sourceMappingURL=extensionEnablementService.test.js.map