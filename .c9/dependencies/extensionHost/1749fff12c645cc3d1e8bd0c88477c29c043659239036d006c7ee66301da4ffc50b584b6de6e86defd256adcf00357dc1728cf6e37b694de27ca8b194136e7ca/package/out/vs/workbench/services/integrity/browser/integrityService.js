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
define(["require", "exports", "vs/workbench/services/integrity/common/integrity", "vs/platform/instantiation/common/extensions"], function (require, exports, integrity_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BrowserIntegrityServiceImpl {
        isPure() {
            return __awaiter(this, void 0, void 0, function* () {
                return { isPure: true, proof: [] };
            });
        }
    }
    exports.BrowserIntegrityServiceImpl = BrowserIntegrityServiceImpl;
    extensions_1.registerSingleton(integrity_1.IIntegrityService, BrowserIntegrityServiceImpl, true);
});
//# sourceMappingURL=integrityService.js.map