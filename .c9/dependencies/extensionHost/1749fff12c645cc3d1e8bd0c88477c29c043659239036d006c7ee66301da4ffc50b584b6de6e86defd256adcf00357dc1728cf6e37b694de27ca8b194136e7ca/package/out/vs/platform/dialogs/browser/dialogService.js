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
define(["require", "exports", "vs/nls", "vs/platform/layout/browser/layoutService", "vs/platform/log/common/log", "vs/base/common/severity", "vs/base/browser/ui/dialog/dialog", "vs/platform/theme/common/themeService", "vs/platform/theme/common/styler", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/keybinding/common/keybinding"], function (require, exports, nls, layoutService_1, log_1, severity_1, dialog_1, themeService_1, styler_1, lifecycle_1, dom_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DialogService = class DialogService {
        constructor(logService, layoutService, themeService, keybindingService) {
            this.logService = logService;
            this.layoutService = layoutService;
            this.themeService = themeService;
            this.keybindingService = keybindingService;
            this.allowableCommands = ['copy', 'cut'];
        }
        confirm(confirmation) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('DialogService#confirm', confirmation.message);
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
                const dialogDisposables = new lifecycle_1.DisposableStore();
                const dialog = new dialog_1.Dialog(this.layoutService.container, confirmation.message, buttons, {
                    detail: confirmation.detail,
                    cancelId: 1,
                    type: confirmation.type,
                    keyEventProcessor: (event) => {
                        const resolved = this.keybindingService.softDispatch(event, this.layoutService.container);
                        if (resolved && resolved.commandId) {
                            if (this.allowableCommands.indexOf(resolved.commandId) === -1) {
                                dom_1.EventHelper.stop(event, true);
                            }
                        }
                    },
                    checkboxChecked: confirmation.checkbox ? confirmation.checkbox.checked : undefined,
                    checkboxLabel: confirmation.checkbox ? confirmation.checkbox.label : undefined
                });
                dialogDisposables.add(dialog);
                dialogDisposables.add(styler_1.attachDialogStyler(dialog, this.themeService));
                const result = yield dialog.show();
                dialogDisposables.dispose();
                return { confirmed: result.button === 0, checkboxChecked: result.checkboxChecked };
            });
        }
        getDialogType(severity) {
            return (severity === severity_1.default.Info) ? 'question' : (severity === severity_1.default.Error) ? 'error' : (severity === severity_1.default.Warning) ? 'warning' : 'none';
        }
        show(severity, message, buttons, options) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logService.trace('DialogService#show', message);
                const dialogDisposables = new lifecycle_1.DisposableStore();
                const dialog = new dialog_1.Dialog(this.layoutService.container, message, buttons, {
                    detail: options ? options.detail : undefined,
                    cancelId: options ? options.cancelId : undefined,
                    type: this.getDialogType(severity),
                    keyEventProcessor: (event) => {
                        const resolved = this.keybindingService.softDispatch(event, this.layoutService.container);
                        if (resolved && resolved.commandId) {
                            if (this.allowableCommands.indexOf(resolved.commandId) === -1) {
                                dom_1.EventHelper.stop(event, true);
                            }
                        }
                    }
                });
                dialogDisposables.add(dialog);
                dialogDisposables.add(styler_1.attachDialogStyler(dialog, this.themeService));
                const result = yield dialog.show();
                dialogDisposables.dispose();
                return result.button;
            });
        }
    };
    DialogService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, layoutService_1.ILayoutService),
        __param(2, themeService_1.IThemeService),
        __param(3, keybinding_1.IKeybindingService)
    ], DialogService);
    exports.DialogService = DialogService;
});
//# sourceMappingURL=dialogService.js.map