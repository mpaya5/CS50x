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
define(["require", "exports", "vs/workbench/services/log/common/keyValueLogProvider", "vs/base/common/map"], function (require, exports, keyValueLogProvider_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class InMemoryLogProvider extends keyValueLogProvider_1.KeyValueLogProvider {
        constructor() {
            super(...arguments);
            this.logs = new Map();
        }
        getAllKeys() {
            return __awaiter(this, void 0, void 0, function* () {
                return map_1.keys(this.logs);
            });
        }
        hasKey(key) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.logs.has(key);
            });
        }
        getValue(key) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.logs.get(key) || '';
            });
        }
        setValue(key, value) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logs.set(key, value);
            });
        }
        deleteKey(key) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logs.delete(key);
            });
        }
    }
    exports.InMemoryLogProvider = InMemoryLogProvider;
});
//# sourceMappingURL=inMemoryLogProvider.js.map