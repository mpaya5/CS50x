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
define(["require", "exports", "vs/workbench/services/log/common/keyValueLogProvider"], function (require, exports, keyValueLogProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INDEXEDDB_VSCODE_DB = 'vscode-web-db';
    exports.INDEXEDDB_LOGS_OBJECT_STORE = 'vscode-logs-store';
    class IndexedDBLogProvider extends keyValueLogProvider_1.KeyValueLogProvider {
        constructor(scheme) {
            super(scheme);
            this.database = this.openDatabase(1);
        }
        openDatabase(version) {
            return new Promise((c, e) => {
                const request = window.indexedDB.open(exports.INDEXEDDB_VSCODE_DB, version);
                request.onerror = (err) => e(request.error);
                request.onsuccess = () => {
                    const db = request.result;
                    if (db.objectStoreNames.contains(exports.INDEXEDDB_LOGS_OBJECT_STORE)) {
                        c(db);
                    }
                };
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(exports.INDEXEDDB_LOGS_OBJECT_STORE)) {
                        db.createObjectStore(exports.INDEXEDDB_LOGS_OBJECT_STORE);
                    }
                    c(db);
                };
            });
        }
        getAllKeys() {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((c, e) => __awaiter(this, void 0, void 0, function* () {
                    const db = yield this.database;
                    const transaction = db.transaction([exports.INDEXEDDB_LOGS_OBJECT_STORE]);
                    const objectStore = transaction.objectStore(exports.INDEXEDDB_LOGS_OBJECT_STORE);
                    const request = objectStore.getAllKeys();
                    request.onerror = () => e(request.error);
                    request.onsuccess = () => c(request.result);
                }));
            });
        }
        hasKey(key) {
            return new Promise((c, e) => __awaiter(this, void 0, void 0, function* () {
                const db = yield this.database;
                const transaction = db.transaction([exports.INDEXEDDB_LOGS_OBJECT_STORE]);
                const objectStore = transaction.objectStore(exports.INDEXEDDB_LOGS_OBJECT_STORE);
                const request = objectStore.getKey(key);
                request.onerror = () => e(request.error);
                request.onsuccess = () => {
                    c(!!request.result);
                };
            }));
        }
        getValue(key) {
            return new Promise((c, e) => __awaiter(this, void 0, void 0, function* () {
                const db = yield this.database;
                const transaction = db.transaction([exports.INDEXEDDB_LOGS_OBJECT_STORE]);
                const objectStore = transaction.objectStore(exports.INDEXEDDB_LOGS_OBJECT_STORE);
                const request = objectStore.get(key);
                request.onerror = () => e(request.error);
                request.onsuccess = () => c(request.result || '');
            }));
        }
        setValue(key, value) {
            return new Promise((c, e) => __awaiter(this, void 0, void 0, function* () {
                const db = yield this.database;
                const transaction = db.transaction([exports.INDEXEDDB_LOGS_OBJECT_STORE], 'readwrite');
                const objectStore = transaction.objectStore(exports.INDEXEDDB_LOGS_OBJECT_STORE);
                const request = objectStore.put(value, key);
                request.onerror = () => e(request.error);
                request.onsuccess = () => c();
            }));
        }
        deleteKey(key) {
            return new Promise((c, e) => __awaiter(this, void 0, void 0, function* () {
                const db = yield this.database;
                const transaction = db.transaction([exports.INDEXEDDB_LOGS_OBJECT_STORE], 'readwrite');
                const objectStore = transaction.objectStore(exports.INDEXEDDB_LOGS_OBJECT_STORE);
                const request = objectStore.delete(key);
                request.onerror = () => e(request.error);
                request.onsuccess = () => c();
            }));
        }
    }
    exports.IndexedDBLogProvider = IndexedDBLogProvider;
});
//# sourceMappingURL=indexedDBLogProvider.js.map