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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/windows/common/windows", "vs/platform/actions/common/actions", "vs/platform/registry/common/platform", "vs/workbench/browser/contextkeys", "vs/workbench/common/actions", "vs/workbench/services/layout/browser/layoutService", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/platform/label/common/label", "vs/platform/keybinding/common/keybinding", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/platform/history/common/history", "vs/editor/common/services/getIconClasses", "vs/platform/files/common/files", "vs/base/common/labels", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/parts/quickopen/quickopen", "vs/css!./media/actions"], function (require, exports, nls, actions_1, windows_1, actions_2, platform_1, contextkeys_1, actions_3, layoutService_1, keybindingsRegistry_1, quickInput_1, workspace_1, label_1, keybinding_1, modelService_1, modeService_1, history_1, getIconClasses_1, files_1, labels_1, platform_2, contextkey_1, quickopen_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.inRecentFilesPickerContextKey = 'inRecentFilesPicker';
    class BaseOpenRecentAction extends actions_1.Action {
        constructor(id, label, windowService, quickInputService, contextService, labelService, keybindingService, modelService, modeService) {
            super(id, label);
            this.windowService = windowService;
            this.quickInputService = quickInputService;
            this.contextService = contextService;
            this.labelService = labelService;
            this.keybindingService = keybindingService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.removeFromRecentlyOpened = {
                iconClass: 'action-remove-from-recently-opened',
                tooltip: nls.localize('remove', "Remove from Recently Opened")
            };
        }
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                const { workspaces, files } = yield this.windowService.getRecentlyOpened();
                this.openRecent(workspaces, files);
            });
        }
        openRecent(recentWorkspaces, recentFiles) {
            return __awaiter(this, void 0, void 0, function* () {
                const toPick = (recent, labelService, buttons) => {
                    let uriToOpen;
                    let iconClasses;
                    let fullLabel;
                    let resource;
                    // Folder
                    if (history_1.isRecentFolder(recent)) {
                        resource = recent.folderUri;
                        iconClasses = getIconClasses_1.getIconClasses(this.modelService, this.modeService, resource, files_1.FileKind.FOLDER);
                        uriToOpen = { folderUri: resource };
                        fullLabel = recent.label || labelService.getWorkspaceLabel(resource, { verbose: true });
                    }
                    // Workspace
                    else if (history_1.isRecentWorkspace(recent)) {
                        resource = recent.workspace.configPath;
                        iconClasses = getIconClasses_1.getIconClasses(this.modelService, this.modeService, resource, files_1.FileKind.ROOT_FOLDER);
                        uriToOpen = { workspaceUri: resource };
                        fullLabel = recent.label || labelService.getWorkspaceLabel(recent.workspace, { verbose: true });
                    }
                    // File
                    else {
                        resource = recent.fileUri;
                        iconClasses = getIconClasses_1.getIconClasses(this.modelService, this.modeService, resource, files_1.FileKind.FILE);
                        uriToOpen = { fileUri: resource };
                        fullLabel = recent.label || labelService.getUriLabel(resource);
                    }
                    const { name, parentPath } = labels_1.splitName(fullLabel);
                    return {
                        iconClasses,
                        label: name,
                        description: parentPath,
                        buttons,
                        uriToOpen,
                        resource
                    };
                };
                const workspacePicks = recentWorkspaces.map(workspace => toPick(workspace, this.labelService, !this.isQuickNavigate() ? [this.removeFromRecentlyOpened] : undefined));
                const filePicks = recentFiles.map(p => toPick(p, this.labelService, !this.isQuickNavigate() ? [this.removeFromRecentlyOpened] : undefined));
                // focus second entry if the first recent workspace is the current workspace
                const firstEntry = recentWorkspaces[0];
                let autoFocusSecondEntry = firstEntry && this.contextService.isCurrentWorkspace(history_1.isRecentWorkspace(firstEntry) ? firstEntry.workspace : firstEntry.folderUri);
                let keyMods;
                const workspaceSeparator = { type: 'separator', label: nls.localize('workspaces', "workspaces") };
                const fileSeparator = { type: 'separator', label: nls.localize('files', "files") };
                const picks = [workspaceSeparator, ...workspacePicks, fileSeparator, ...filePicks];
                const pick = yield this.quickInputService.pick(picks, {
                    contextKey: exports.inRecentFilesPickerContextKey,
                    activeItem: [...workspacePicks, ...filePicks][autoFocusSecondEntry ? 1 : 0],
                    placeHolder: platform_2.isMacintosh ? nls.localize('openRecentPlaceHolderMac', "Select to open (hold Cmd-key to open in new window)") : nls.localize('openRecentPlaceHolder', "Select to open (hold Ctrl-key to open in new window)"),
                    matchOnDescription: true,
                    onKeyMods: mods => keyMods = mods,
                    quickNavigate: this.isQuickNavigate() ? { keybindings: this.keybindingService.lookupKeybindings(this.id) } : undefined,
                    onDidTriggerItemButton: (context) => __awaiter(this, void 0, void 0, function* () {
                        yield this.windowService.removeFromRecentlyOpened([context.item.resource]);
                        context.removeItem();
                    })
                });
                if (pick) {
                    return this.windowService.openWindow([pick.uriToOpen], { forceNewWindow: keyMods && keyMods.ctrlCmd });
                }
            });
        }
    }
    let OpenRecentAction = class OpenRecentAction extends BaseOpenRecentAction {
        constructor(id, label, windowService, quickInputService, contextService, keybindingService, modelService, modeService, labelService) {
            super(id, label, windowService, quickInputService, contextService, labelService, keybindingService, modelService, modeService);
        }
        isQuickNavigate() {
            return false;
        }
    };
    OpenRecentAction.ID = 'workbench.action.openRecent';
    OpenRecentAction.LABEL = nls.localize('openRecent', "Open Recent...");
    OpenRecentAction = __decorate([
        __param(2, windows_1.IWindowService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, modelService_1.IModelService),
        __param(7, modeService_1.IModeService),
        __param(8, label_1.ILabelService)
    ], OpenRecentAction);
    exports.OpenRecentAction = OpenRecentAction;
    let QuickOpenRecentAction = class QuickOpenRecentAction extends BaseOpenRecentAction {
        constructor(id, label, windowService, quickInputService, contextService, keybindingService, modelService, modeService, labelService) {
            super(id, label, windowService, quickInputService, contextService, labelService, keybindingService, modelService, modeService);
        }
        isQuickNavigate() {
            return true;
        }
    };
    QuickOpenRecentAction.ID = 'workbench.action.quickOpenRecent';
    QuickOpenRecentAction.LABEL = nls.localize('quickOpenRecent', "Quick Open Recent...");
    QuickOpenRecentAction = __decorate([
        __param(2, windows_1.IWindowService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, modelService_1.IModelService),
        __param(7, modeService_1.IModeService),
        __param(8, label_1.ILabelService)
    ], QuickOpenRecentAction);
    exports.QuickOpenRecentAction = QuickOpenRecentAction;
    let ToggleFullScreenAction = class ToggleFullScreenAction extends actions_1.Action {
        constructor(id, label, windowService, layoutService) {
            super(id, label);
            this.windowService = windowService;
            this.layoutService = layoutService;
        }
        run() {
            const container = this.layoutService.getWorkbenchElement();
            return this.windowService.toggleFullScreen(container);
        }
    };
    ToggleFullScreenAction.ID = 'workbench.action.toggleFullScreen';
    ToggleFullScreenAction.LABEL = nls.localize('toggleFullScreen', "Toggle Full Screen");
    ToggleFullScreenAction = __decorate([
        __param(2, windows_1.IWindowService),
        __param(3, layoutService_1.IWorkbenchLayoutService)
    ], ToggleFullScreenAction);
    exports.ToggleFullScreenAction = ToggleFullScreenAction;
    let ReloadWindowAction = class ReloadWindowAction extends actions_1.Action {
        constructor(id, label, windowService) {
            super(id, label);
            this.windowService = windowService;
        }
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.windowService.reloadWindow();
                return true;
            });
        }
    };
    ReloadWindowAction.ID = 'workbench.action.reloadWindow';
    ReloadWindowAction.LABEL = nls.localize('reloadWindow', "Reload Window");
    ReloadWindowAction = __decorate([
        __param(2, windows_1.IWindowService)
    ], ReloadWindowAction);
    exports.ReloadWindowAction = ReloadWindowAction;
    let ShowAboutDialogAction = class ShowAboutDialogAction extends actions_1.Action {
        constructor(id, label, windowsService) {
            super(id, label);
            this.windowsService = windowsService;
        }
        run() {
            return this.windowsService.openAboutDialog();
        }
    };
    ShowAboutDialogAction.ID = 'workbench.action.showAboutDialog';
    ShowAboutDialogAction.LABEL = nls.localize('about', "About");
    ShowAboutDialogAction = __decorate([
        __param(2, windows_1.IWindowsService)
    ], ShowAboutDialogAction);
    exports.ShowAboutDialogAction = ShowAboutDialogAction;
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    // --- Actions Registration
    const fileCategory = nls.localize('file', "File");
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(QuickOpenRecentAction, QuickOpenRecentAction.ID, QuickOpenRecentAction.LABEL), 'File: Quick Open Recent...', fileCategory);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(OpenRecentAction, OpenRecentAction.ID, OpenRecentAction.LABEL, { primary: 2048 /* CtrlCmd */ | 48 /* KEY_R */, mac: { primary: 256 /* WinCtrl */ | 48 /* KEY_R */ } }), 'File: Open Recent...', fileCategory);
    const viewCategory = nls.localize('view', "View");
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ToggleFullScreenAction, ToggleFullScreenAction.ID, ToggleFullScreenAction.LABEL, { primary: 69 /* F11 */, mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 36 /* KEY_F */ } }), 'View: Toggle Full Screen', viewCategory);
    const developerCategory = nls.localize('developer', "Developer");
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ReloadWindowAction, ReloadWindowAction.ID, ReloadWindowAction.LABEL), 'Developer: Reload Window', developerCategory);
    const helpCategory = nls.localize('help', "Help");
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ShowAboutDialogAction, ShowAboutDialogAction.ID, ShowAboutDialogAction.LABEL), `Help: About`, helpCategory);
    // --- Commands/Keybindings Registration
    const recentFilesPickerContext = contextkey_1.ContextKeyExpr.and(quickopen_1.inQuickOpenContext, contextkey_1.ContextKeyExpr.has(exports.inRecentFilesPickerContextKey));
    const quickOpenNavigateNextInRecentFilesPickerId = 'workbench.action.quickOpenNavigateNextInRecentFilesPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickOpenNavigateNextInRecentFilesPickerId,
        weight: 200 /* WorkbenchContrib */ + 50,
        handler: quickopen_1.getQuickNavigateHandler(quickOpenNavigateNextInRecentFilesPickerId, true),
        when: recentFilesPickerContext,
        primary: 2048 /* CtrlCmd */ | 48 /* KEY_R */,
        mac: { primary: 256 /* WinCtrl */ | 48 /* KEY_R */ }
    });
    const quickOpenNavigatePreviousInRecentFilesPicker = 'workbench.action.quickOpenNavigatePreviousInRecentFilesPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickOpenNavigatePreviousInRecentFilesPicker,
        weight: 200 /* WorkbenchContrib */ + 50,
        handler: quickopen_1.getQuickNavigateHandler(quickOpenNavigatePreviousInRecentFilesPicker, false),
        when: recentFilesPickerContext,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 48 /* KEY_R */,
        mac: { primary: 256 /* WinCtrl */ | 1024 /* Shift */ | 48 /* KEY_R */ }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: ReloadWindowAction.ID,
        weight: 200 /* WorkbenchContrib */ + 50,
        when: contextkeys_1.IsDevelopmentContext,
        primary: 2048 /* CtrlCmd */ | 48 /* KEY_R */
    });
    // --- Menu Registration
    actions_2.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
        title: nls.localize({ key: 'miOpenRecent', comment: ['&& denotes a mnemonic'] }, "Open &&Recent"),
        submenu: 21 /* MenubarRecentMenu */,
        group: '2_open',
        order: 4
    });
    actions_2.MenuRegistry.appendMenuItem(21 /* MenubarRecentMenu */, {
        group: 'y_more',
        command: {
            id: OpenRecentAction.ID,
            title: nls.localize({ key: 'miMore', comment: ['&& denotes a mnemonic'] }, "&&More...")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
        group: '1_toggle_view',
        command: {
            id: ToggleFullScreenAction.ID,
            title: nls.localize({ key: 'miToggleFullScreen', comment: ['&& denotes a mnemonic'] }, "&&Full Screen"),
            toggled: contextkeys_1.IsFullscreenContext
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(17 /* MenubarHelpMenu */, {
        group: 'z_about',
        command: {
            id: ShowAboutDialogAction.ID,
            title: nls.localize({ key: 'miAbout', comment: ['&& denotes a mnemonic'] }, "&&About")
        },
        order: 1,
        when: contextkeys_1.IsMacNativeContext.toNegated()
    });
});
//# sourceMappingURL=windowActions.js.map