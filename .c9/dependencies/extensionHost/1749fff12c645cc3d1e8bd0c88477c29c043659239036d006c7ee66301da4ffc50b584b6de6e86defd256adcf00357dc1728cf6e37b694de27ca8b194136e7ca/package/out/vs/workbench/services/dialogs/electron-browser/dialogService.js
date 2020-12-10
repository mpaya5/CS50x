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
define(["require", "exports", "vs/nls", "vs/platform/product/node/product", "vs/base/common/severity", "vs/base/common/platform", "vs/platform/windows/common/windows", "vs/base/common/labels", "vs/platform/dialogs/common/dialogs", "vs/platform/dialogs/browser/dialogService", "vs/platform/log/common/log", "vs/platform/instantiation/common/extensions", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/platform/dialogs/node/dialogIpc", "vs/platform/configuration/common/configuration", "vs/platform/layout/browser/layoutService", "vs/platform/theme/common/themeService", "vs/platform/keybinding/common/keybinding"], function (require, exports, nls, product_1, severity_1, platform_1, windows_1, labels_1, dialogs_1, dialogService_1, log_1, extensions_1, sharedProcessService_1, dialogIpc_1, configuration_1, layoutService_1, themeService_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DialogService = class DialogService {
        constructor(configurationService, logService, layoutService, themeService, windowService, sharedProcessService, keybindingService) {
            // Use HTML based dialogs
            if (configurationService.getValue('workbench.dialogs.customEnabled') === true) {
                this.impl = new dialogService_1.DialogService(logService, layoutService, themeService, keybindingService);
            }
            // Electron dialog service
            else {
                this.impl = new NativeDialogService(windowService, logService, sharedProcessService);
            }
        }
        confirm(confirmation) {
            return this.impl.confirm(confirmation);
        }
        show(severity, message, buttons, options) {
            return this.impl.show(severity, message, buttons, options);
        }
    };
    DialogService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, log_1.ILogService),
        __param(2, layoutService_1.ILayoutService),
        __param(3, themeService_1.IThemeService),
        __param(4, windows_1.IWindowService),
        __param(5, sharedProcessService_1.ISharedProcessService),
        __param(6, keybinding_1.IKeybindingService)
    ], DialogService);
    exports.DialogService = DialogService;
    let NativeDialogService = class NativeDialogService {
        constructor(windowService, logService, sharedProcessService) {
            this.windowService = windowService;
            this.logService = logService;
            sharedProcessService.registerChannel('dialog', new dialogIpc_1.DialogChannel(this));
        }
        confirm(confirmation) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('DialogService#confirm', confirmation.message);
                const { options, buttonIndexMap } = this.massageMessageBoxOptions(this.getConfirmOptions(confirmation));
                const result = yield this.windowService.showMessageBox(options);
                return {
                    confirmed: buttonIndexMap[result.button] === 0 ? true : false,
                    checkboxChecked: result.checkboxChecked
                };
            });
        }
        getConfirmOptions(confirmation) {
            const buttons = [];
            if (confirmation.primaryButton) {
                buttons.push(confirmation.primaryButton);
            }
            else {
                buttons.push(nls.localize({ key: 'yesButton', comment: ['&& denotes a mnemonic'] }, "&&Yes"));
            }
            if (confirmation.secondaryButton) {
                buttons.push(confirmation.secondaryButton);
            }
            else if (typeof confirmation.secondaryButton === 'undefined') {
                buttons.push(nls.localize('cancelButton', "Cancel"));
            }
            const opts = {
                title: confirmation.title,
                message: confirmation.message,
                buttons,
                cancelId: 1
            };
            if (confirmation.detail) {
                opts.detail = confirmation.detail;
            }
            if (confirmation.type) {
                opts.type = confirmation.type;
            }
            if (confirmation.checkbox) {
                opts.checkboxLabel = confirmation.checkbox.label;
                opts.checkboxChecked = confirmation.checkbox.checked;
            }
            return opts;
        }
        show(severity, message, buttons, dialogOptions) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('DialogService#show', message);
                const { options, buttonIndexMap } = this.massageMessageBoxOptions({
                    message,
                    buttons,
                    type: (severity === severity_1.default.Info) ? 'question' : (severity === severity_1.default.Error) ? 'error' : (severity === severity_1.default.Warning) ? 'warning' : 'none',
                    cancelId: dialogOptions ? dialogOptions.cancelId : undefined,
                    detail: dialogOptions ? dialogOptions.detail : undefined
                });
                const result = yield this.windowService.showMessageBox(options);
                return buttonIndexMap[result.button];
            });
        }
        massageMessageBoxOptions(options) {
            let buttonIndexMap = (options.buttons || []).map((button, index) => index);
            let buttons = (options.buttons || []).map(button => labels_1.mnemonicButtonLabel(button));
            let cancelId = options.cancelId;
            // Linux: order of buttons is reverse
            // macOS: also reverse, but the OS handles this for us!
            if (platform_1.isLinux) {
                buttons = buttons.reverse();
                buttonIndexMap = buttonIndexMap.reverse();
            }
            // Default Button (always first one)
            options.defaultId = buttonIndexMap[0];
            // Cancel Button
            if (typeof cancelId === 'number') {
                // Ensure the cancelId is the correct one from our mapping
                cancelId = buttonIndexMap[cancelId];
                // macOS/Linux: the cancel button should always be to the left of the primary action
                // if we see more than 2 buttons, move the cancel one to the left of the primary
                if (!platform_1.isWindows && buttons.length > 2 && cancelId !== 1) {
                    const cancelButton = buttons[cancelId];
                    buttons.splice(cancelId, 1);
                    buttons.splice(1, 0, cancelButton);
                    const cancelButtonIndex = buttonIndexMap[cancelId];
                    buttonIndexMap.splice(cancelId, 1);
                    buttonIndexMap.splice(1, 0, cancelButtonIndex);
                    cancelId = 1;
                }
            }
            options.buttons = buttons;
            options.cancelId = cancelId;
            options.noLink = true;
            options.title = options.title || product_1.default.nameLong;
            return { options, buttonIndexMap };
        }
    };
    NativeDialogService = __decorate([
        __param(0, windows_1.IWindowService),
        __param(1, log_1.ILogService),
        __param(2, sharedProcessService_1.ISharedProcessService)
    ], NativeDialogService);
    extensions_1.registerSingleton(dialogs_1.IDialogService, DialogService, true);
});
//# sourceMappingURL=dialogService.js.map