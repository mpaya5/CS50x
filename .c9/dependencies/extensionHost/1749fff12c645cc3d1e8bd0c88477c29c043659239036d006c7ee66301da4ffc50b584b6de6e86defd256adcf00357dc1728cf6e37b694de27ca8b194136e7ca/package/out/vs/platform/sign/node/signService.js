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
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SignService {
        vsda() {
            return new Promise((resolve_1, reject_1) => { require(['vsda'], resolve_1, reject_1); });
        }
        sign(value) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const vsda = yield this.vsda();
                    const signer = new vsda.signer();
                    if (signer) {
                        return signer.sign(value);
                    }
                }
                catch (e) {
                    console.error('signer.sign: ' + e);
                }
                return value;
            });
        }
    }
    exports.SignService = SignService;
});
//# sourceMappingURL=signService.js.map