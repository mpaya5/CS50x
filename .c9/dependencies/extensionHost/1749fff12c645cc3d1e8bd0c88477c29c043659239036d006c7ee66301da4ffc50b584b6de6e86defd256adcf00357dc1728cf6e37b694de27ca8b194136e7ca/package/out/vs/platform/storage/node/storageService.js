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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/base/parts/storage/node/storage", "vs/base/parts/storage/common/storage", "vs/base/common/performance", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/environment/common/environment", "vs/platform/workspaces/common/workspaces", "vs/base/common/errors"], function (require, exports, lifecycle_1, event_1, log_1, storage_1, storage_2, storage_3, performance_1, path_1, pfs_1, environment_1, workspaces_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let StorageService = class StorageService extends lifecycle_1.Disposable {
        constructor(globalStorageDatabase, logService, environmentService) {
            super();
            this.logService = logService;
            this.environmentService = environmentService;
            this._onDidChangeStorage = this._register(new event_1.Emitter());
            this.onDidChangeStorage = this._onDidChangeStorage.event;
            this._onWillSaveState = this._register(new event_1.Emitter());
            this.onWillSaveState = this._onWillSaveState.event;
            // Global Storage
            this.globalStorage = new storage_3.Storage(globalStorageDatabase);
            this._register(this.globalStorage.onDidChangeStorage(key => this.handleDidChangeStorage(key, 0 /* GLOBAL */)));
        }
        handleDidChangeStorage(key, scope) {
            this._onDidChangeStorage.fire({ key, scope });
        }
        initialize(payload) {
            if (!this.initializePromise) {
                this.initializePromise = this.doInitialize(payload);
            }
            return this.initializePromise;
        }
        doInitialize(payload) {
            return __awaiter(this, void 0, void 0, function* () {
                yield Promise.all([
                    this.initializeGlobalStorage(),
                    this.initializeWorkspaceStorage(payload)
                ]);
            });
        }
        initializeGlobalStorage() {
            return this.globalStorage.init();
        }
        initializeWorkspaceStorage(payload) {
            return __awaiter(this, void 0, void 0, function* () {
                // Prepare workspace storage folder for DB
                try {
                    const result = yield this.prepareWorkspaceStorageFolder(payload);
                    const useInMemoryStorage = !!this.environmentService.extensionTestsLocationURI; // no storage during extension tests!
                    // Create workspace storage and initialize
                    performance_1.mark('willInitWorkspaceStorage');
                    try {
                        yield this.createWorkspaceStorage(useInMemoryStorage ? storage_2.SQLiteStorageDatabase.IN_MEMORY_PATH : path_1.join(result.path, StorageService.WORKSPACE_STORAGE_NAME), result.wasCreated ? storage_3.StorageHint.STORAGE_DOES_NOT_EXIST : undefined).init();
                    }
                    finally {
                        performance_1.mark('didInitWorkspaceStorage');
                    }
                }
                catch (error) {
                    errors_1.onUnexpectedError(error);
                    // Upon error, fallback to in-memory storage
                    return this.createWorkspaceStorage(storage_2.SQLiteStorageDatabase.IN_MEMORY_PATH).init();
                }
            });
        }
        createWorkspaceStorage(workspaceStoragePath, hint) {
            // Logger for workspace storage
            const workspaceLoggingOptions = {
                logTrace: (this.logService.getLevel() === log_1.LogLevel.Trace) ? msg => this.logService.trace(msg) : undefined,
                logError: error => this.logService.error(error)
            };
            // Dispose old (if any)
            lifecycle_1.dispose(this.workspaceStorage);
            lifecycle_1.dispose(this.workspaceStorageListener);
            // Create new
            this.workspaceStoragePath = workspaceStoragePath;
            this.workspaceStorage = new storage_3.Storage(new storage_2.SQLiteStorageDatabase(workspaceStoragePath, { logging: workspaceLoggingOptions }), { hint });
            this.workspaceStorageListener = this.workspaceStorage.onDidChangeStorage(key => this.handleDidChangeStorage(key, 1 /* WORKSPACE */));
            return this.workspaceStorage;
        }
        getWorkspaceStorageFolderPath(payload) {
            return path_1.join(this.environmentService.workspaceStorageHome, payload.id); // workspace home + workspace id;
        }
        prepareWorkspaceStorageFolder(payload) {
            return __awaiter(this, void 0, void 0, function* () {
                const workspaceStorageFolderPath = this.getWorkspaceStorageFolderPath(payload);
                const storageExists = yield pfs_1.exists(workspaceStorageFolderPath);
                if (storageExists) {
                    return { path: workspaceStorageFolderPath, wasCreated: false };
                }
                yield pfs_1.mkdirp(workspaceStorageFolderPath);
                // Write metadata into folder
                this.ensureWorkspaceStorageFolderMeta(payload);
                return { path: workspaceStorageFolderPath, wasCreated: true };
            });
        }
        ensureWorkspaceStorageFolderMeta(payload) {
            let meta = undefined;
            if (workspaces_1.isSingleFolderWorkspaceInitializationPayload(payload)) {
                meta = { folder: payload.folder.toString() };
            }
            else if (workspaces_1.isWorkspaceIdentifier(payload)) {
                meta = { configuration: payload.configPath };
            }
            if (meta) {
                const workspaceStorageMetaPath = path_1.join(this.getWorkspaceStorageFolderPath(payload), StorageService.WORKSPACE_META_NAME);
                (function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        try {
                            const storageExists = yield pfs_1.exists(workspaceStorageMetaPath);
                            if (!storageExists) {
                                yield pfs_1.writeFile(workspaceStorageMetaPath, JSON.stringify(meta, undefined, 2));
                            }
                        }
                        catch (error) {
                            errors_1.onUnexpectedError(error);
                        }
                    });
                })();
            }
        }
        get(key, scope, fallbackValue) {
            return this.getStorage(scope).get(key, fallbackValue);
        }
        getBoolean(key, scope, fallbackValue) {
            return this.getStorage(scope).getBoolean(key, fallbackValue);
        }
        getNumber(key, scope, fallbackValue) {
            return this.getStorage(scope).getNumber(key, fallbackValue);
        }
        store(key, value, scope) {
            this.getStorage(scope).set(key, value);
        }
        remove(key, scope) {
            this.getStorage(scope).delete(key);
        }
        close() {
            return __awaiter(this, void 0, void 0, function* () {
                // Signal as event so that clients can still store data
                this._onWillSaveState.fire({ reason: storage_1.WillSaveStateReason.SHUTDOWN });
                // Do it
                yield Promise.all([
                    this.globalStorage.close(),
                    this.workspaceStorage.close()
                ]);
            });
        }
        getStorage(scope) {
            return scope === 0 /* GLOBAL */ ? this.globalStorage : this.workspaceStorage;
        }
        logStorage() {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield Promise.all([
                    this.globalStorage.items,
                    this.workspaceStorage.items
                ]);
                storage_1.logStorage(result[0], result[1], this.environmentService.globalStorageHome, this.workspaceStoragePath);
            });
        }
        migrate(toWorkspace) {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.workspaceStoragePath === storage_2.SQLiteStorageDatabase.IN_MEMORY_PATH) {
                    return Promise.resolve(); // no migration needed if running in memory
                }
                // Close workspace DB to be able to copy
                yield this.workspaceStorage.close();
                // Prepare new workspace storage folder
                const result = yield this.prepareWorkspaceStorageFolder(toWorkspace);
                const newWorkspaceStoragePath = path_1.join(result.path, StorageService.WORKSPACE_STORAGE_NAME);
                // Copy current storage over to new workspace storage
                yield pfs_1.copy(this.workspaceStoragePath, newWorkspaceStoragePath);
                // Recreate and init workspace storage
                return this.createWorkspaceStorage(newWorkspaceStoragePath).init();
            });
        }
    };
    StorageService.WORKSPACE_STORAGE_NAME = 'state.vscdb';
    StorageService.WORKSPACE_META_NAME = 'workspace.json';
    StorageService = __decorate([
        __param(1, log_1.ILogService),
        __param(2, environment_1.IEnvironmentService)
    ], StorageService);
    exports.StorageService = StorageService;
});
//# sourceMappingURL=storageService.js.map