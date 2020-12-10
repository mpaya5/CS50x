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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/driver/browser/baseDriver"], function (require, exports, lifecycle_1, baseDriver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BrowserWindowDriver extends baseDriver_1.BaseWindowDriver {
        click(selector, xoffset, yoffset) {
            throw new Error('Method not implemented.');
        }
        doubleClick(selector) {
            throw new Error('Method not implemented.');
        }
        openDevTools() {
            throw new Error('Method not implemented.');
        }
    }
    function registerWindowDriver() {
        return __awaiter(this, void 0, void 0, function* () {
            window.driver = new BrowserWindowDriver();
            return lifecycle_1.toDisposable(() => {
                return { dispose: () => { } };
            });
        });
    }
    exports.registerWindowDriver = registerWindowDriver;
});
//# sourceMappingURL=driver.js.map