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
define(["require", "exports", "vs/base/common/path", "vs/base/node/pfs", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/environment/common/environment", "vs/platform/lifecycle/common/lifecycle", "vs/platform/product/node/product", "vs/platform/windows/common/windows", "vs/workbench/contrib/performance/electron-browser/perfviewEditor", "vs/workbench/services/extensions/common/extensions", "vs/platform/clipboard/common/clipboardService", "vs/base/common/uri", "vs/platform/opener/common/opener"], function (require, exports, path_1, pfs_1, resolverService_1, nls_1, dialogs_1, environment_1, lifecycle_1, product_1, windows_1, perfviewEditor_1, extensions_1, clipboardService_1, uri_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let StartupProfiler = class StartupProfiler {
        constructor(_windowsService, _dialogService, _environmentService, _textModelResolverService, _clipboardService, lifecycleService, extensionService, _openerService) {
            this._windowsService = _windowsService;
            this._dialogService = _dialogService;
            this._environmentService = _environmentService;
            this._textModelResolverService = _textModelResolverService;
            this._clipboardService = _clipboardService;
            this._openerService = _openerService;
            // wait for everything to be ready
            Promise.all([
                lifecycleService.when(4 /* Eventually */),
                extensionService.whenInstalledExtensionsRegistered()
            ]).then(() => {
                this._stopProfiling();
            });
        }
        _stopProfiling() {
            const profileFilenamePrefix = this._environmentService.args['prof-startup-prefix'];
            if (!profileFilenamePrefix) {
                return;
            }
            const dir = path_1.dirname(profileFilenamePrefix);
            const prefix = path_1.basename(profileFilenamePrefix);
            const removeArgs = ['--prof-startup'];
            const markerFile = pfs_1.readFile(profileFilenamePrefix).then(value => removeArgs.push(...value.toString().split('|')))
                .then(() => pfs_1.rimraf(profileFilenamePrefix)) // (1) delete the file to tell the main process to stop profiling
                .then(() => new Promise(resolve => {
                const check = () => {
                    pfs_1.exists(profileFilenamePrefix).then(exists => {
                        if (exists) {
                            resolve();
                        }
                        else {
                            setTimeout(check, 500);
                        }
                    });
                };
                check();
            }))
                .then(() => pfs_1.rimraf(profileFilenamePrefix)); // (3) finally delete the file again
            markerFile.then(() => {
                return pfs_1.readdir(dir).then(files => files.filter(value => value.indexOf(prefix) === 0));
            }).then(files => {
                const profileFiles = files.reduce((prev, cur) => `${prev}${path_1.join(dir, cur)}\n`, '\n');
                return this._dialogService.confirm({
                    type: 'info',
                    message: nls_1.localize('prof.message', "Successfully created profiles."),
                    detail: nls_1.localize('prof.detail', "Please create an issue and manually attach the following files:\n{0}", profileFiles),
                    primaryButton: nls_1.localize('prof.restartAndFileIssue', "Create Issue and Restart"),
                    secondaryButton: nls_1.localize('prof.restart', "Restart")
                }).then(res => {
                    if (res.confirmed) {
                        Promise.all([
                            this._windowsService.showItemInFolder(uri_1.URI.file(path_1.join(dir, files[0]))),
                            this._createPerfIssue(files)
                        ]).then(() => {
                            // keep window stable until restart is selected
                            return this._dialogService.confirm({
                                type: 'info',
                                message: nls_1.localize('prof.thanks', "Thanks for helping us."),
                                detail: nls_1.localize('prof.detail.restart', "A final restart is required to continue to use '{0}'. Again, thank you for your contribution.", this._environmentService.appNameLong),
                                primaryButton: nls_1.localize('prof.restart', "Restart"),
                                secondaryButton: undefined
                            }).then(() => {
                                // now we are ready to restart
                                this._windowsService.relaunch({ removeArgs });
                            });
                        });
                    }
                    else {
                        // simply restart
                        this._windowsService.relaunch({ removeArgs });
                    }
                });
            });
        }
        _createPerfIssue(files) {
            return __awaiter(this, void 0, void 0, function* () {
                const ref = yield this._textModelResolverService.createModelReference(perfviewEditor_1.PerfviewInput.Uri);
                yield this._clipboardService.writeText(ref.object.textEditorModel.getValue());
                ref.dispose();
                const body = `
1. :warning: We have copied additional data to your clipboard. Make sure to **paste** here. :warning:
1. :warning: Make sure to **attach** these files from your *home*-directory: :warning:\n${files.map(file => `-\`${file}\``).join('\n')}
`;
                const baseUrl = product_1.default.reportIssueUrl;
                const queryStringPrefix = baseUrl.indexOf('?') === -1 ? '?' : '&';
                this._openerService.open(uri_1.URI.parse(`${baseUrl}${queryStringPrefix}body=${encodeURIComponent(body)}`));
            });
        }
    };
    StartupProfiler = __decorate([
        __param(0, windows_1.IWindowsService),
        __param(1, dialogs_1.IDialogService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, resolverService_1.ITextModelService),
        __param(4, clipboardService_1.IClipboardService),
        __param(5, lifecycle_1.ILifecycleService),
        __param(6, extensions_1.IExtensionService),
        __param(7, opener_1.IOpenerService)
    ], StartupProfiler);
    exports.StartupProfiler = StartupProfiler;
});
//# sourceMappingURL=startupProfiler.js.map