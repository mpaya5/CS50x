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
define(["require", "exports", "assert", "vs/base/common/platform"], function (require, exports, assert, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Windows Native Helpers', () => {
        if (!platform_1.isWindows) {
            return;
        }
        test('windows-mutex', () => __awaiter(this, void 0, void 0, function* () {
            const mutex = yield new Promise((resolve_1, reject_1) => { require(['windows-mutex'], resolve_1, reject_1); });
            assert.ok(mutex && typeof mutex.isActive === 'function', 'Unable to load windows-mutex dependency.');
            assert.ok(typeof mutex.isActive === 'function', 'Unable to load windows-mutex dependency.');
        }));
        test('windows-foreground-love', () => __awaiter(this, void 0, void 0, function* () {
            const foregroundLove = yield new Promise((resolve_2, reject_2) => { require(['windows-foreground-love'], resolve_2, reject_2); });
            assert.ok(foregroundLove && typeof foregroundLove.allowSetForegroundWindow === 'function', 'Unable to load windows-foreground-love dependency.');
        }));
        test('windows-process-tree', () => __awaiter(this, void 0, void 0, function* () {
            const processTree = yield new Promise((resolve_3, reject_3) => { require(['windows-process-tree'], resolve_3, reject_3); });
            assert.ok(processTree && typeof processTree.getProcessTree === 'function', 'Unable to load windows-process-tree dependency.');
        }));
        test('vscode-windows-ca-certs', () => __awaiter(this, void 0, void 0, function* () {
            const windowsCerts = yield new Promise((resolve_4, reject_4) => { require(['vscode-windows-ca-certs'], resolve_4, reject_4); });
            assert.ok(windowsCerts, 'Unable to load vscode-windows-ca-certs dependency.');
        }));
        test('vscode-windows-registry', () => __awaiter(this, void 0, void 0, function* () {
            const windowsRegistry = yield new Promise((resolve_5, reject_5) => { require(['vscode-windows-registry'], resolve_5, reject_5); });
            assert.ok(windowsRegistry && typeof windowsRegistry.GetStringRegKey === 'function', 'Unable to load vscode-windows-registry dependency.');
        }));
    });
});
//# sourceMappingURL=nativeHelpers.test.js.map