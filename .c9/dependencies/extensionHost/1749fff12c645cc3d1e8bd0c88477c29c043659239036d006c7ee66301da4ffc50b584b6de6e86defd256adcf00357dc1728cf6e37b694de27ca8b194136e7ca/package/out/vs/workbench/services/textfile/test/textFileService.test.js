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
define(["require", "exports", "assert", "sinon", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/test/workbenchTestServices", "vs/base/test/common/utils", "vs/platform/windows/common/windows", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/untitled/common/untitledEditorService", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/editor/common/services/modelService", "vs/base/common/network"], function (require, exports, assert, sinon, platform, uri_1, lifecycle_1, workbenchTestServices_1, utils_1, windows_1, textFileEditorModel_1, textfiles_1, untitledEditorService_1, files_1, workspace_1, modelService_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ServiceAccessor = class ServiceAccessor {
        constructor(lifecycleService, textFileService, untitledEditorService, windowsService, contextService, modelService, fileService) {
            this.lifecycleService = lifecycleService;
            this.textFileService = textFileService;
            this.untitledEditorService = untitledEditorService;
            this.windowsService = windowsService;
            this.contextService = contextService;
            this.modelService = modelService;
            this.fileService = fileService;
        }
    };
    ServiceAccessor = __decorate([
        __param(0, lifecycle_1.ILifecycleService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, untitledEditorService_1.IUntitledEditorService),
        __param(3, windows_1.IWindowsService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, modelService_1.IModelService),
        __param(6, files_1.IFileService)
    ], ServiceAccessor);
    class BeforeShutdownEventImpl {
        constructor() {
            this.reason = 1 /* CLOSE */;
        }
        veto(value) {
            this.value = value;
        }
    }
    suite('Files - TextFileService', () => {
        let instantiationService;
        let model;
        let accessor;
        setup(() => {
            instantiationService = workbenchTestServices_1.workbenchInstantiationService();
            accessor = instantiationService.createInstance(ServiceAccessor);
        });
        teardown(() => {
            if (model) {
                model.dispose();
            }
            accessor.textFileService.models.clear();
            accessor.textFileService.models.dispose();
            accessor.untitledEditorService.revertAll();
        });
        test('confirm onWillShutdown - no veto', function () {
            return __awaiter(this, void 0, void 0, function* () {
                model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
                accessor.textFileService.models.add(model.getResource(), model);
                const event = new BeforeShutdownEventImpl();
                accessor.lifecycleService.fireWillShutdown(event);
                const veto = event.value;
                if (typeof veto === 'boolean') {
                    assert.ok(!veto);
                }
                else {
                    assert.ok(!(yield veto));
                }
            });
        });
        test('confirm onWillShutdown - veto if user cancels', function () {
            return __awaiter(this, void 0, void 0, function* () {
                model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
                accessor.textFileService.models.add(model.getResource(), model);
                const service = accessor.textFileService;
                service.setConfirmResult(2 /* CANCEL */);
                yield model.load();
                model.textEditorModel.setValue('foo');
                assert.equal(service.getDirty().length, 1);
                const event = new BeforeShutdownEventImpl();
                accessor.lifecycleService.fireWillShutdown(event);
                assert.ok(event.value);
            });
        });
        test('confirm onWillShutdown - no veto and backups cleaned up if user does not want to save (hot.exit: off)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
                accessor.textFileService.models.add(model.getResource(), model);
                const service = accessor.textFileService;
                service.setConfirmResult(1 /* DONT_SAVE */);
                service.onFilesConfigurationChange({ files: { hotExit: 'off' } });
                yield model.load();
                model.textEditorModel.setValue('foo');
                assert.equal(service.getDirty().length, 1);
                const event = new BeforeShutdownEventImpl();
                accessor.lifecycleService.fireWillShutdown(event);
                let veto = event.value;
                if (typeof veto === 'boolean') {
                    assert.ok(service.cleanupBackupsBeforeShutdownCalled);
                    assert.ok(!veto);
                    return;
                }
                veto = yield veto;
                assert.ok(service.cleanupBackupsBeforeShutdownCalled);
                assert.ok(!veto);
            });
        });
        test('confirm onWillShutdown - save (hot.exit: off)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
                accessor.textFileService.models.add(model.getResource(), model);
                const service = accessor.textFileService;
                service.setConfirmResult(0 /* SAVE */);
                service.onFilesConfigurationChange({ files: { hotExit: 'off' } });
                yield model.load();
                model.textEditorModel.setValue('foo');
                assert.equal(service.getDirty().length, 1);
                const event = new BeforeShutdownEventImpl();
                accessor.lifecycleService.fireWillShutdown(event);
                const veto = yield event.value;
                assert.ok(!veto);
                assert.ok(!model.isDirty());
            });
        });
        test('isDirty/getDirty - files and untitled', function () {
            return __awaiter(this, void 0, void 0, function* () {
                model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
                accessor.textFileService.models.add(model.getResource(), model);
                const service = accessor.textFileService;
                yield model.load();
                assert.ok(!service.isDirty(model.getResource()));
                model.textEditorModel.setValue('foo');
                assert.ok(service.isDirty(model.getResource()));
                assert.equal(service.getDirty().length, 1);
                assert.equal(service.getDirty([model.getResource()])[0].toString(), model.getResource().toString());
                const untitled = accessor.untitledEditorService.createOrGet();
                const untitledModel = yield untitled.resolve();
                assert.ok(!service.isDirty(untitled.getResource()));
                assert.equal(service.getDirty().length, 1);
                untitledModel.textEditorModel.setValue('changed');
                assert.ok(service.isDirty(untitled.getResource()));
                assert.equal(service.getDirty().length, 2);
                assert.equal(service.getDirty([untitled.getResource()])[0].toString(), untitled.getResource().toString());
            });
        });
        test('save - file', function () {
            return __awaiter(this, void 0, void 0, function* () {
                model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
                accessor.textFileService.models.add(model.getResource(), model);
                const service = accessor.textFileService;
                yield model.load();
                model.textEditorModel.setValue('foo');
                assert.ok(service.isDirty(model.getResource()));
                const res = yield service.save(model.getResource());
                assert.ok(res);
                assert.ok(!service.isDirty(model.getResource()));
            });
        });
        test('save - UNC path', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const untitledUncUri = uri_1.URI.from({ scheme: 'untitled', authority: 'server', path: '/share/path/file.txt' });
                model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, untitledUncUri, 'utf8', undefined);
                accessor.textFileService.models.add(model.getResource(), model);
                const mockedFileUri = untitledUncUri.with({ scheme: network_1.Schemas.file });
                const mockedEditorInput = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, mockedFileUri, 'utf8', undefined);
                const loadOrCreateStub = sinon.stub(accessor.textFileService.models, 'loadOrCreate', () => Promise.resolve(mockedEditorInput));
                sinon.stub(accessor.untitledEditorService, 'exists', () => true);
                sinon.stub(accessor.untitledEditorService, 'hasAssociatedFilePath', () => true);
                sinon.stub(accessor.modelService, 'updateModel', () => { });
                yield model.load();
                model.textEditorModel.setValue('foo');
                const res = yield accessor.textFileService.saveAll(true);
                assert.ok(loadOrCreateStub.calledOnce);
                assert.equal(res.results.length, 1);
                assert.ok(res.results[0].success);
                assert.equal(res.results[0].target.scheme, network_1.Schemas.file);
                assert.equal(res.results[0].target.authority, untitledUncUri.authority);
                assert.equal(res.results[0].target.path, untitledUncUri.path);
            });
        });
        test('saveAll - file', function () {
            return __awaiter(this, void 0, void 0, function* () {
                model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
                accessor.textFileService.models.add(model.getResource(), model);
                const service = accessor.textFileService;
                yield model.load();
                model.textEditorModel.setValue('foo');
                assert.ok(service.isDirty(model.getResource()));
                const res = yield service.saveAll([model.getResource()]);
                assert.ok(res);
                assert.ok(!service.isDirty(model.getResource()));
                assert.equal(res.results.length, 1);
                assert.equal(res.results[0].source.toString(), model.getResource().toString());
            });
        });
        test('saveAs - file', function () {
            return __awaiter(this, void 0, void 0, function* () {
                model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
                accessor.textFileService.models.add(model.getResource(), model);
                const service = accessor.textFileService;
                service.setPromptPath(model.getResource());
                yield model.load();
                model.textEditorModel.setValue('foo');
                assert.ok(service.isDirty(model.getResource()));
                const res = yield service.saveAs(model.getResource());
                assert.equal(res.toString(), model.getResource().toString());
                assert.ok(!service.isDirty(model.getResource()));
            });
        });
        test('revert - file', function () {
            return __awaiter(this, void 0, void 0, function* () {
                model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
                accessor.textFileService.models.add(model.getResource(), model);
                const service = accessor.textFileService;
                service.setPromptPath(model.getResource());
                yield model.load();
                model.textEditorModel.setValue('foo');
                assert.ok(service.isDirty(model.getResource()));
                const res = yield service.revert(model.getResource());
                assert.ok(res);
                assert.ok(!service.isDirty(model.getResource()));
            });
        });
        test('delete - dirty file', function () {
            return __awaiter(this, void 0, void 0, function* () {
                model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
                accessor.textFileService.models.add(model.getResource(), model);
                const service = accessor.textFileService;
                yield model.load();
                model.textEditorModel.setValue('foo');
                assert.ok(service.isDirty(model.getResource()));
                yield service.delete(model.getResource());
                assert.ok(!service.isDirty(model.getResource()));
            });
        });
        test('move - dirty file', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield testMove(utils_1.toResource.call(this, '/path/file.txt'), utils_1.toResource.call(this, '/path/file_target.txt'));
            });
        });
        test('move - dirty file (target exists and is dirty)', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield testMove(utils_1.toResource.call(this, '/path/file.txt'), utils_1.toResource.call(this, '/path/file_target.txt'), true);
            });
        });
        function testMove(source, target, targetDirty) {
            return __awaiter(this, void 0, void 0, function* () {
                let sourceModel = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, source, 'utf8', undefined);
                let targetModel = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, target, 'utf8', undefined);
                accessor.textFileService.models.add(sourceModel.getResource(), sourceModel);
                accessor.textFileService.models.add(targetModel.getResource(), targetModel);
                const service = accessor.textFileService;
                yield sourceModel.load();
                sourceModel.textEditorModel.setValue('foo');
                assert.ok(service.isDirty(sourceModel.getResource()));
                if (targetDirty) {
                    yield targetModel.load();
                    targetModel.textEditorModel.setValue('bar');
                    assert.ok(service.isDirty(targetModel.getResource()));
                }
                yield service.move(sourceModel.getResource(), targetModel.getResource(), true);
                assert.equal(targetModel.textEditorModel.getValue(), 'foo');
                assert.ok(!service.isDirty(sourceModel.getResource()));
                assert.ok(service.isDirty(targetModel.getResource()));
                sourceModel.dispose();
                targetModel.dispose();
            });
        }
        suite('Hot Exit', () => {
            suite('"onExit" setting', () => {
                test('should hot exit on non-Mac (reason: CLOSE, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* CLOSE */, false, true, !!platform.isMacintosh);
                });
                test('should hot exit on non-Mac (reason: CLOSE, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* CLOSE */, false, false, !!platform.isMacintosh);
                });
                test('should NOT hot exit (reason: CLOSE, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* CLOSE */, true, true, true);
                });
                test('should NOT hot exit (reason: CLOSE, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* CLOSE */, true, false, true);
                });
                test('should hot exit (reason: QUIT, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* QUIT */, false, true, false);
                });
                test('should hot exit (reason: QUIT, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* QUIT */, false, false, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* QUIT */, true, true, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* QUIT */, true, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* RELOAD */, false, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* RELOAD */, false, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* RELOAD */, true, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* RELOAD */, true, false, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* LOAD */, false, true, true);
                });
                test('should NOT hot exit (reason: LOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* LOAD */, false, false, true);
                });
                test('should NOT hot exit (reason: LOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* LOAD */, true, true, true);
                });
                test('should NOT hot exit (reason: LOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* LOAD */, true, false, true);
                });
            });
            suite('"onExitAndWindowClose" setting', () => {
                test('should hot exit (reason: CLOSE, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* CLOSE */, false, true, false);
                });
                test('should hot exit (reason: CLOSE, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* CLOSE */, false, false, !!platform.isMacintosh);
                });
                test('should hot exit (reason: CLOSE, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* CLOSE */, true, true, false);
                });
                test('should NOT hot exit (reason: CLOSE, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* CLOSE */, true, false, true);
                });
                test('should hot exit (reason: QUIT, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* QUIT */, false, true, false);
                });
                test('should hot exit (reason: QUIT, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* QUIT */, false, false, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* QUIT */, true, true, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* QUIT */, true, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* RELOAD */, false, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* RELOAD */, false, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* RELOAD */, true, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* RELOAD */, true, false, false);
                });
                test('should hot exit (reason: LOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* LOAD */, false, true, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* LOAD */, false, false, true);
                });
                test('should hot exit (reason: LOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* LOAD */, true, true, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* LOAD */, true, false, true);
                });
            });
            function hotExitTest(setting, shutdownReason, multipleWindows, workspace, shouldVeto) {
                return __awaiter(this, void 0, void 0, function* () {
                    model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
                    accessor.textFileService.models.add(model.getResource(), model);
                    const service = accessor.textFileService;
                    // Set hot exit config
                    service.onFilesConfigurationChange({ files: { hotExit: setting } });
                    // Set empty workspace if required
                    if (!workspace) {
                        accessor.contextService.setWorkspace(new workspace_1.Workspace('empty:1508317022751'));
                    }
                    // Set multiple windows if required
                    if (multipleWindows) {
                        accessor.windowsService.windowCount = 2;
                    }
                    // Set cancel to force a veto if hot exit does not trigger
                    service.setConfirmResult(2 /* CANCEL */);
                    yield model.load();
                    model.textEditorModel.setValue('foo');
                    assert.equal(service.getDirty().length, 1);
                    const event = new BeforeShutdownEventImpl();
                    event.reason = shutdownReason;
                    accessor.lifecycleService.fireWillShutdown(event);
                    const veto = yield event.value;
                    assert.ok(!service.cleanupBackupsBeforeShutdownCalled); // When hot exit is set, backups should never be cleaned since the confirm result is cancel
                    assert.equal(veto, shouldVeto);
                });
            }
        });
    });
});
//# sourceMappingURL=textFileService.test.js.map