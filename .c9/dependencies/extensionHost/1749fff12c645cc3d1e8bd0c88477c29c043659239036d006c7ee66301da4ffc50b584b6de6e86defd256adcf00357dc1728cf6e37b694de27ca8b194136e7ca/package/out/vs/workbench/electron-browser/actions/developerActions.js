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
define(["require", "exports", "vs/base/common/actions", "vs/platform/windows/common/windows", "vs/nls"], function (require, exports, actions_1, windows_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ToggleDevToolsAction = class ToggleDevToolsAction extends actions_1.Action {
        constructor(id, label, windowsService) {
            super(id, label);
            this.windowsService = windowsService;
        }
        run() {
            return this.windowsService.toggleDevTools();
        }
    };
    ToggleDevToolsAction.ID = 'workbench.action.toggleDevTools';
    ToggleDevToolsAction.LABEL = nls.localize('toggleDevTools', "Toggle Developer Tools");
    ToggleDevToolsAction = __decorate([
        __param(2, windows_1.IWindowService)
    ], ToggleDevToolsAction);
    exports.ToggleDevToolsAction = ToggleDevToolsAction;
    let ToggleSharedProcessAction = class ToggleSharedProcessAction extends actions_1.Action {
        constructor(id, label, windowsService) {
            super(id, label);
            this.windowsService = windowsService;
        }
        run() {
            return this.windowsService.toggleSharedProcess();
        }
    };
    ToggleSharedProcessAction.ID = 'workbench.action.toggleSharedProcess';
    ToggleSharedProcessAction.LABEL = nls.localize('toggleSharedProcess', "Toggle Shared Process");
    ToggleSharedProcessAction = __decorate([
        __param(2, windows_1.IWindowsService)
    ], ToggleSharedProcessAction);
    exports.ToggleSharedProcessAction = ToggleSharedProcessAction;
});
//# sourceMappingURL=developerActions.js.map