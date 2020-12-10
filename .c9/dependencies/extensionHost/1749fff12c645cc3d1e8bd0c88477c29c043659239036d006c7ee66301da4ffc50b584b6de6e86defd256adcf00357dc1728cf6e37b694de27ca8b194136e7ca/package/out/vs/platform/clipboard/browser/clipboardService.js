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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/clipboard/common/clipboardService"], function (require, exports, extensions_1, clipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BrowserClipboardService {
        writeText(text, type) {
            return __awaiter(this, void 0, void 0, function* () {
                if (type) {
                    return; // TODO@sbatten
                }
                return navigator.clipboard.writeText(text);
            });
        }
        readText(type) {
            return __awaiter(this, void 0, void 0, function* () {
                if (type) {
                    return ''; // TODO@sbatten
                }
                return navigator.clipboard.readText();
            });
        }
        readTextSync() {
            return undefined;
        }
        readFindText() {
            // @ts-ignore
            return undefined;
        }
        writeFindText(text) { }
        writeResources(resources) {
            this._internalResourcesClipboard = resources;
        }
        readResources() {
            return this._internalResourcesClipboard || [];
        }
        hasResources() {
            return this._internalResourcesClipboard !== undefined && this._internalResourcesClipboard.length > 0;
        }
    }
    exports.BrowserClipboardService = BrowserClipboardService;
    extensions_1.registerSingleton(clipboardService_1.IClipboardService, BrowserClipboardService, true);
});
//# sourceMappingURL=clipboardService.js.map