/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/event", "vs/platform/instantiation/common/extensions"], function (require, exports, terminal_1, event_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let Terminal;
    let WebLinksAddon;
    let SearchAddon;
    class TerminalInstanceService {
        constructor() {
            this._onRequestDefaultShellAndArgs = new event_1.Emitter();
        }
        get onRequestDefaultShellAndArgs() { return this._onRequestDefaultShellAndArgs.event; }
        getXtermConstructor() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!Terminal) {
                    Terminal = (yield new Promise((resolve_1, reject_1) => { require(['xterm'], resolve_1, reject_1); })).Terminal;
                }
                return Terminal;
            });
        }
        getXtermWebLinksConstructor() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!WebLinksAddon) {
                    WebLinksAddon = (yield new Promise((resolve_2, reject_2) => { require(['xterm-addon-web-links'], resolve_2, reject_2); })).WebLinksAddon;
                }
                return WebLinksAddon;
            });
        }
        getXtermSearchConstructor() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!SearchAddon) {
                    SearchAddon = (yield new Promise((resolve_3, reject_3) => { require(['xterm-addon-search'], resolve_3, reject_3); })).SearchAddon;
                }
                return SearchAddon;
            });
        }
        createWindowsShellHelper() {
            throw new Error('Not implemented');
        }
        createTerminalProcess() {
            throw new Error('Not implemented');
        }
        getDefaultShellAndArgs(useAutomationShell) {
            return new Promise(r => this._onRequestDefaultShellAndArgs.fire({
                useAutomationShell,
                callback: (shell, args) => r({ shell, args })
            }));
        }
        getMainProcessParentEnv() {
            return __awaiter(this, void 0, void 0, function* () {
                return {};
            });
        }
    }
    exports.TerminalInstanceService = TerminalInstanceService;
    extensions_1.registerSingleton(terminal_1.ITerminalInstanceService, TerminalInstanceService, true);
});
//# sourceMappingURL=terminalInstanceService.js.map