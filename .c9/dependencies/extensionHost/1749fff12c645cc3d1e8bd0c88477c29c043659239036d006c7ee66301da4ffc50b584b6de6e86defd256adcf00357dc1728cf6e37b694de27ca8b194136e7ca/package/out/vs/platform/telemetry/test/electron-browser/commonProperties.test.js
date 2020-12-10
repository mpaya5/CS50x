var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "assert", "vs/base/common/path", "os", "fs", "vs/platform/telemetry/node/workbenchCommonProperties", "vs/base/test/node/testUtils", "vs/platform/storage/common/storage", "vs/base/node/pfs", "vs/base/common/async"], function (require, exports, assert, path, os, fs, workbenchCommonProperties_1, testUtils_1, storage_1, pfs_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Telemetry - common properties', function () {
        const parentDir = testUtils_1.getRandomTestPath(os.tmpdir(), 'vsctests', 'telemetryservice');
        const installSource = path.join(parentDir, 'installSource');
        const commit = (undefined);
        const version = (undefined);
        let testStorageService;
        setup(() => {
            testStorageService = new storage_1.InMemoryStorageService();
        });
        teardown(done => {
            pfs_1.rimraf(parentDir, pfs_1.RimRafMode.MOVE).then(done, done);
        });
        test('default', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield pfs_1.mkdirp(parentDir);
                fs.writeFileSync(installSource, 'my.install.source');
                const props = yield workbenchCommonProperties_1.resolveWorkbenchCommonProperties(testStorageService, commit, version, 'someMachineId', undefined, installSource);
                assert.ok('commitHash' in props);
                assert.ok('sessionID' in props);
                assert.ok('timestamp' in props);
                assert.ok('common.platform' in props);
                assert.ok('common.nodePlatform' in props);
                assert.ok('common.nodeArch' in props);
                assert.ok('common.timesincesessionstart' in props);
                assert.ok('common.sequence' in props);
                // assert.ok('common.version.shell' in first.data); // only when running on electron
                // assert.ok('common.version.renderer' in first.data);
                assert.ok('common.platformVersion' in props, 'platformVersion');
                assert.ok('version' in props);
                assert.equal(props['common.source'], 'my.install.source');
                assert.ok('common.firstSessionDate' in props, 'firstSessionDate');
                assert.ok('common.lastSessionDate' in props, 'lastSessionDate'); // conditional, see below, 'lastSessionDate'ow
                assert.ok('common.isNewSession' in props, 'isNewSession');
                // machine id et al
                assert.ok('common.instanceId' in props, 'instanceId');
                assert.ok('common.machineId' in props, 'machineId');
                fs.unlinkSync(installSource);
                const props_1 = yield workbenchCommonProperties_1.resolveWorkbenchCommonProperties(testStorageService, commit, version, 'someMachineId', undefined, installSource);
                assert.ok(!('common.source' in props_1));
            });
        });
        test('lastSessionDate when aviablale', function () {
            return __awaiter(this, void 0, void 0, function* () {
                testStorageService.store('telemetry.lastSessionDate', new Date().toUTCString(), 0 /* GLOBAL */);
                const props = yield workbenchCommonProperties_1.resolveWorkbenchCommonProperties(testStorageService, commit, version, 'someMachineId', undefined, installSource);
                assert.ok('common.lastSessionDate' in props); // conditional, see below
                assert.ok('common.isNewSession' in props);
                assert.equal(props['common.isNewSession'], 0);
            });
        });
        test('values chance on ask', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const props = yield workbenchCommonProperties_1.resolveWorkbenchCommonProperties(testStorageService, commit, version, 'someMachineId', undefined, installSource);
                let value1 = props['common.sequence'];
                let value2 = props['common.sequence'];
                assert.ok(value1 !== value2, 'seq');
                value1 = props['timestamp'];
                value2 = props['timestamp'];
                assert.ok(value1 !== value2, 'timestamp');
                value1 = props['common.timesincesessionstart'];
                yield async_1.timeout(10);
                value2 = props['common.timesincesessionstart'];
                assert.ok(value1 !== value2, 'timesincesessionstart');
            });
        });
    });
});
//# sourceMappingURL=commonProperties.test.js.map