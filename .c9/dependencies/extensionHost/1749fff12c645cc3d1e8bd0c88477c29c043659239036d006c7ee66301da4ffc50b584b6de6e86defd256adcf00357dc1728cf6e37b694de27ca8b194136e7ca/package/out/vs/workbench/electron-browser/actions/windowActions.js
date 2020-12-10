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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/actions", "vs/platform/windows/common/windows", "vs/nls", "vs/base/browser/browser", "vs/platform/keybinding/common/keybinding", "electron", "vs/platform/files/common/files", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/platform/configuration/common/configuration"], function (require, exports, uri_1, actions_1, windows_1, nls, browser, keybinding_1, electron_1, files_1, modelService_1, modeService_1, quickInput_1, getIconClasses_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CloseCurrentWindowAction = class CloseCurrentWindowAction extends actions_1.Action {
        constructor(id, label, windowService) {
            super(id, label);
            this.windowService = windowService;
        }
        run() {
            this.windowService.closeWindow();
            return Promise.resolve(true);
        }
    };
    CloseCurrentWindowAction.ID = 'workbench.action.closeWindow';
    CloseCurrentWindowAction.LABEL = nls.localize('closeWindow', "Close Window");
    CloseCurrentWindowAction = __decorate([
        __param(2, windows_1.IWindowService)
    ], CloseCurrentWindowAction);
    exports.CloseCurrentWindowAction = CloseCurrentWindowAction;
    let NewWindowAction = class NewWindowAction extends actions_1.Action {
        constructor(id, label, windowsService) {
            super(id, label);
            this.windowsService = windowsService;
        }
        run() {
            return this.windowsService.openNewWindow();
        }
    };
    NewWindowAction.ID = 'workbench.action.newWindow';
    NewWindowAction.LABEL = nls.localize('newWindow', "New Window");
    NewWindowAction = __decorate([
        __param(2, windows_1.IWindowsService)
    ], NewWindowAction);
    exports.NewWindowAction = NewWindowAction;
    let BaseZoomAction = class BaseZoomAction extends actions_1.Action {
        constructor(id, label, configurationService) {
            super(id, label);
            this.configurationService = configurationService;
        }
        setConfiguredZoomLevel(level) {
            return __awaiter(this, void 0, void 0, function* () {
                level = Math.round(level); // when reaching smallest zoom, prevent fractional zoom levels
                if (level > BaseZoomAction.MAX_ZOOM_LEVEL || level < BaseZoomAction.MIN_ZOOM_LEVEL) {
                    return; // https://github.com/microsoft/vscode/issues/48357
                }
                const applyZoom = () => {
                    electron_1.webFrame.setZoomLevel(level);
                    browser.setZoomFactor(electron_1.webFrame.getZoomFactor());
                    // See https://github.com/Microsoft/vscode/issues/26151
                    // Cannot be trusted because the webFrame might take some time
                    // until it really applies the new zoom level
                    browser.setZoomLevel(electron_1.webFrame.getZoomLevel(), /*isTrusted*/ false);
                };
                yield this.configurationService.updateValue(BaseZoomAction.SETTING_KEY, level);
                applyZoom();
            });
        }
    };
    BaseZoomAction.SETTING_KEY = 'window.zoomLevel';
    BaseZoomAction.MAX_ZOOM_LEVEL = 9;
    BaseZoomAction.MIN_ZOOM_LEVEL = -8;
    BaseZoomAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], BaseZoomAction);
    exports.BaseZoomAction = BaseZoomAction;
    let ZoomInAction = class ZoomInAction extends BaseZoomAction {
        constructor(id, label, configurationService) {
            super(id, label, configurationService);
        }
        run() {
            this.setConfiguredZoomLevel(electron_1.webFrame.getZoomLevel() + 1);
            return Promise.resolve(true);
        }
    };
    ZoomInAction.ID = 'workbench.action.zoomIn';
    ZoomInAction.LABEL = nls.localize('zoomIn', "Zoom In");
    ZoomInAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], ZoomInAction);
    exports.ZoomInAction = ZoomInAction;
    let ZoomOutAction = class ZoomOutAction extends BaseZoomAction {
        constructor(id, label, configurationService) {
            super(id, label, configurationService);
        }
        run() {
            this.setConfiguredZoomLevel(electron_1.webFrame.getZoomLevel() - 1);
            return Promise.resolve(true);
        }
    };
    ZoomOutAction.ID = 'workbench.action.zoomOut';
    ZoomOutAction.LABEL = nls.localize('zoomOut', "Zoom Out");
    ZoomOutAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], ZoomOutAction);
    exports.ZoomOutAction = ZoomOutAction;
    let ZoomResetAction = class ZoomResetAction extends BaseZoomAction {
        constructor(id, label, configurationService) {
            super(id, label, configurationService);
        }
        run() {
            this.setConfiguredZoomLevel(0);
            return Promise.resolve(true);
        }
    };
    ZoomResetAction.ID = 'workbench.action.zoomReset';
    ZoomResetAction.LABEL = nls.localize('zoomReset', "Reset Zoom");
    ZoomResetAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], ZoomResetAction);
    exports.ZoomResetAction = ZoomResetAction;
    let ReloadWindowWithExtensionsDisabledAction = class ReloadWindowWithExtensionsDisabledAction extends actions_1.Action {
        constructor(id, label, windowService) {
            super(id, label);
            this.windowService = windowService;
        }
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.windowService.reloadWindow({ _: [], 'disable-extensions': true });
                return true;
            });
        }
    };
    ReloadWindowWithExtensionsDisabledAction.ID = 'workbench.action.reloadWindowWithExtensionsDisabled';
    ReloadWindowWithExtensionsDisabledAction.LABEL = nls.localize('reloadWindowWithExntesionsDisabled', "Reload Window With Extensions Disabled");
    ReloadWindowWithExtensionsDisabledAction = __decorate([
        __param(2, windows_1.IWindowService)
    ], ReloadWindowWithExtensionsDisabledAction);
    exports.ReloadWindowWithExtensionsDisabledAction = ReloadWindowWithExtensionsDisabledAction;
    class BaseSwitchWindow extends actions_1.Action {
        constructor(id, label, windowsService, windowService, quickInputService, keybindingService, modelService, modeService) {
            super(id, label);
            this.windowsService = windowsService;
            this.windowService = windowService;
            this.quickInputService = quickInputService;
            this.keybindingService = keybindingService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.closeWindowAction = {
                iconClass: 'action-remove-from-recently-opened',
                tooltip: nls.localize('close', "Close Window")
            };
        }
        run() {
            return __awaiter(this, void 0, void 0, function* () {
                const currentWindowId = this.windowService.windowId;
                const windows = yield this.windowsService.getWindows();
                const placeHolder = nls.localize('switchWindowPlaceHolder', "Select a window to switch to");
                const picks = windows.map(win => {
                    const resource = win.filename ? uri_1.URI.file(win.filename) : win.folderUri ? win.folderUri : win.workspace ? win.workspace.configPath : undefined;
                    const fileKind = win.filename ? files_1.FileKind.FILE : win.workspace ? files_1.FileKind.ROOT_FOLDER : win.folderUri ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
                    return {
                        payload: win.id,
                        label: win.title,
                        iconClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, resource, fileKind),
                        description: (currentWindowId === win.id) ? nls.localize('current', "Current Window") : undefined,
                        buttons: (!this.isQuickNavigate() && currentWindowId !== win.id) ? [this.closeWindowAction] : undefined
                    };
                });
                const autoFocusIndex = (picks.indexOf(picks.filter(pick => pick.payload === currentWindowId)[0]) + 1) % picks.length;
                const pick = yield this.quickInputService.pick(picks, {
                    contextKey: 'inWindowsPicker',
                    activeItem: picks[autoFocusIndex],
                    placeHolder,
                    quickNavigate: this.isQuickNavigate() ? { keybindings: this.keybindingService.lookupKeybindings(this.id) } : undefined,
                    onDidTriggerItemButton: (context) => __awaiter(this, void 0, void 0, function* () {
                        yield this.windowsService.closeWindow(context.item.payload);
                        context.removeItem();
                    })
                });
                if (pick) {
                    this.windowsService.focusWindow(pick.payload);
                }
            });
        }
    }
    exports.BaseSwitchWindow = BaseSwitchWindow;
    let SwitchWindow = class SwitchWindow extends BaseSwitchWindow {
        constructor(id, label, windowsService, windowService, quickInputService, keybindingService, modelService, modeService) {
            super(id, label, windowsService, windowService, quickInputService, keybindingService, modelService, modeService);
        }
        isQuickNavigate() {
            return false;
        }
    };
    SwitchWindow.ID = 'workbench.action.switchWindow';
    SwitchWindow.LABEL = nls.localize('switchWindow', "Switch Window...");
    SwitchWindow = __decorate([
        __param(2, windows_1.IWindowsService),
        __param(3, windows_1.IWindowService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, modelService_1.IModelService),
        __param(7, modeService_1.IModeService)
    ], SwitchWindow);
    exports.SwitchWindow = SwitchWindow;
    let QuickSwitchWindow = class QuickSwitchWindow extends BaseSwitchWindow {
        constructor(id, label, windowsService, windowService, quickInputService, keybindingService, modelService, modeService) {
            super(id, label, windowsService, windowService, quickInputService, keybindingService, modelService, modeService);
        }
        isQuickNavigate() {
            return true;
        }
    };
    QuickSwitchWindow.ID = 'workbench.action.quickSwitchWindow';
    QuickSwitchWindow.LABEL = nls.localize('quickSwitchWindow', "Quick Switch Window...");
    QuickSwitchWindow = __decorate([
        __param(2, windows_1.IWindowsService),
        __param(3, windows_1.IWindowService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, modelService_1.IModelService),
        __param(7, modeService_1.IModeService)
    ], QuickSwitchWindow);
    exports.QuickSwitchWindow = QuickSwitchWindow;
    exports.NewWindowTabHandler = function (accessor) {
        return accessor.get(windows_1.IWindowsService).newWindowTab();
    };
    exports.ShowPreviousWindowTabHandler = function (accessor) {
        return accessor.get(windows_1.IWindowsService).showPreviousWindowTab();
    };
    exports.ShowNextWindowTabHandler = function (accessor) {
        return accessor.get(windows_1.IWindowsService).showNextWindowTab();
    };
    exports.MoveWindowTabToNewWindowHandler = function (accessor) {
        return accessor.get(windows_1.IWindowsService).moveWindowTabToNewWindow();
    };
    exports.MergeWindowTabsHandlerHandler = function (accessor) {
        return accessor.get(windows_1.IWindowsService).mergeAllWindowTabs();
    };
    exports.ToggleWindowTabsBarHandler = function (accessor) {
        return accessor.get(windows_1.IWindowsService).toggleWindowTabsBar();
    };
});
//# sourceMappingURL=windowActions.js.map