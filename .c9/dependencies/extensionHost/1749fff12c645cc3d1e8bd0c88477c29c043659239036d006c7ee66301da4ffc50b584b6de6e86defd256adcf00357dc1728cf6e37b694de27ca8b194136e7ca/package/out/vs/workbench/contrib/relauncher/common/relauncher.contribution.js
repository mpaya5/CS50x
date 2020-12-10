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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/windows/common/windows", "vs/platform/configuration/common/configuration", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/common/extensions", "vs/base/common/async", "vs/base/common/resources", "vs/base/common/platform", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/environment/common/environmentService"], function (require, exports, lifecycle_1, contributions_1, platform_1, windows_1, configuration_1, nls_1, environment_1, workspace_1, extensions_1, async_1, resources_1, platform_2, dialogs_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SettingsChangeRelauncher = class SettingsChangeRelauncher extends lifecycle_1.Disposable {
        constructor(windowsService, windowService, configurationService, envService, dialogService) {
            super();
            this.windowsService = windowsService;
            this.windowService = windowService;
            this.configurationService = configurationService;
            this.envService = envService;
            this.dialogService = dialogService;
            this.onConfigurationChange(configurationService.getValue(), false);
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChange(this.configurationService.getValue(), true)));
        }
        onConfigurationChange(config, notify) {
            let changed = false;
            // Tree horizontal scrolling support
            if (config.workbench && config.workbench.list && typeof config.workbench.list.horizontalScrolling === 'boolean' && config.workbench.list.horizontalScrolling !== this.treeHorizontalScrolling) {
                this.treeHorizontalScrolling = config.workbench.list.horizontalScrolling;
                changed = true;
            }
            // Workbench Grid Layout
            if (config.workbench && typeof config.workbench.useExperimentalGridLayout === 'boolean' && config.workbench.useExperimentalGridLayout !== this.useGridLayout) {
                this.useGridLayout = config.workbench.useExperimentalGridLayout;
                changed = true;
            }
            // Debug console word wrap
            if (config.debug && typeof config.debug.console.wordWrap === 'boolean' && config.debug.console.wordWrap !== this.debugConsoleWordWrap) {
                this.debugConsoleWordWrap = config.debug.console.wordWrap;
                changed = true;
            }
            if (platform_2.isNative) {
                // Titlebar style
                if (config.window && config.window.titleBarStyle !== this.titleBarStyle && (config.window.titleBarStyle === 'native' || config.window.titleBarStyle === 'custom')) {
                    this.titleBarStyle = config.window.titleBarStyle;
                    changed = true;
                }
                // macOS: Native tabs
                if (platform_2.isMacintosh && config.window && typeof config.window.nativeTabs === 'boolean' && config.window.nativeTabs !== this.nativeTabs) {
                    this.nativeTabs = config.window.nativeTabs;
                    changed = true;
                }
                // macOS: Native fullscreen
                if (platform_2.isMacintosh && config.window && typeof config.window.nativeFullScreen === 'boolean' && config.window.nativeFullScreen !== this.nativeFullScreen) {
                    this.nativeFullScreen = config.window.nativeFullScreen;
                    changed = true;
                }
                // macOS: Click through (accept first mouse)
                if (platform_2.isMacintosh && config.window && typeof config.window.clickThroughInactive === 'boolean' && config.window.clickThroughInactive !== this.clickThroughInactive) {
                    this.clickThroughInactive = config.window.clickThroughInactive;
                    changed = true;
                }
                // Update channel
                if (config.update && typeof config.update.mode === 'string' && config.update.mode !== this.updateMode) {
                    this.updateMode = config.update.mode;
                    changed = true;
                }
                // Crash reporter
                if (config.telemetry && typeof config.telemetry.enableCrashReporter === 'boolean' && config.telemetry.enableCrashReporter !== this.enableCrashReporter) {
                    this.enableCrashReporter = config.telemetry.enableCrashReporter;
                    changed = true;
                }
            }
            // Notify only when changed and we are the focused window (avoids notification spam across windows)
            if (notify && changed) {
                this.doConfirm(platform_2.isNative ?
                    nls_1.localize('relaunchSettingMessage', "A setting has changed that requires a restart to take effect.") :
                    nls_1.localize('relaunchSettingMessageWeb', "A setting has changed that requires a reload to take effect."), platform_2.isNative ?
                    nls_1.localize('relaunchSettingDetail', "Press the restart button to restart {0} and enable the setting.", this.envService.appNameLong) :
                    nls_1.localize('relaunchSettingDetailWeb', "Press the reload button to reload {0} and enable the setting.", this.envService.appNameLong), platform_2.isNative ?
                    nls_1.localize('restart', "&&Restart") :
                    nls_1.localize('restartWeb', "&&Reload"), () => this.windowsService.relaunch(Object.create(null)));
            }
        }
        doConfirm(message, detail, primaryButton, confirmed) {
            this.windowService.isFocused().then(focused => {
                if (focused) {
                    return this.dialogService.confirm({
                        type: 'info',
                        message,
                        detail,
                        primaryButton
                    }).then(res => {
                        if (res.confirmed) {
                            confirmed();
                        }
                    });
                }
                return undefined;
            });
        }
    };
    SettingsChangeRelauncher = __decorate([
        __param(0, windows_1.IWindowsService),
        __param(1, windows_1.IWindowService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, dialogs_1.IDialogService)
    ], SettingsChangeRelauncher);
    exports.SettingsChangeRelauncher = SettingsChangeRelauncher;
    let WorkspaceChangeExtHostRelauncher = class WorkspaceChangeExtHostRelauncher extends lifecycle_1.Disposable {
        constructor(contextService, extensionService, windowService, environmentService) {
            super();
            this.contextService = contextService;
            this.extensionHostRestarter = this._register(new async_1.RunOnceScheduler(() => {
                if (!!environmentService.extensionTestsLocationURI) {
                    return; // no restart when in tests: see https://github.com/Microsoft/vscode/issues/66936
                }
                if (environmentService.configuration.remoteAuthority) {
                    windowService.reloadWindow(); // TODO@aeschli, workaround
                }
                else {
                    extensionService.restartExtensionHost();
                }
            }, 10));
            this.contextService.getCompleteWorkspace()
                .then(workspace => {
                this.firstFolderResource = workspace.folders.length > 0 ? workspace.folders[0].uri : undefined;
                this.handleWorkbenchState();
                this._register(this.contextService.onDidChangeWorkbenchState(() => setTimeout(() => this.handleWorkbenchState())));
            });
            this._register(lifecycle_1.toDisposable(() => {
                if (this.onDidChangeWorkspaceFoldersUnbind) {
                    this.onDidChangeWorkspaceFoldersUnbind.dispose();
                }
            }));
        }
        handleWorkbenchState() {
            // React to folder changes when we are in workspace state
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                // Update our known first folder path if we entered workspace
                const workspace = this.contextService.getWorkspace();
                this.firstFolderResource = workspace.folders.length > 0 ? workspace.folders[0].uri : undefined;
                // Install workspace folder listener
                if (!this.onDidChangeWorkspaceFoldersUnbind) {
                    this.onDidChangeWorkspaceFoldersUnbind = this.contextService.onDidChangeWorkspaceFolders(() => this.onDidChangeWorkspaceFolders());
                }
            }
            // Ignore the workspace folder changes in EMPTY or FOLDER state
            else {
                lifecycle_1.dispose(this.onDidChangeWorkspaceFoldersUnbind);
                this.onDidChangeWorkspaceFoldersUnbind = undefined;
            }
        }
        onDidChangeWorkspaceFolders() {
            const workspace = this.contextService.getWorkspace();
            // Restart extension host if first root folder changed (impact on deprecated workspace.rootPath API)
            const newFirstFolderResource = workspace.folders.length > 0 ? workspace.folders[0].uri : undefined;
            if (!resources_1.isEqual(this.firstFolderResource, newFirstFolderResource)) {
                this.firstFolderResource = newFirstFolderResource;
                this.extensionHostRestarter.schedule(); // buffer calls to extension host restart
            }
        }
    };
    WorkspaceChangeExtHostRelauncher = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, extensions_1.IExtensionService),
        __param(2, windows_1.IWindowService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService)
    ], WorkspaceChangeExtHostRelauncher);
    exports.WorkspaceChangeExtHostRelauncher = WorkspaceChangeExtHostRelauncher;
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(SettingsChangeRelauncher, 3 /* Restored */);
    workbenchRegistry.registerWorkbenchContribution(WorkspaceChangeExtHostRelauncher, 3 /* Restored */);
});
//# sourceMappingURL=relauncher.contribution.js.map