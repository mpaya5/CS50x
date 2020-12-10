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
define(["require", "exports", "vs/base/common/errorMessage", "vs/platform/lifecycle/common/lifecycle", "vs/platform/storage/common/storage", "electron", "vs/platform/windows/common/windows", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/base/common/errors", "vs/platform/lifecycle/common/lifecycleService"], function (require, exports, errorMessage_1, lifecycle_1, storage_1, electron_1, windows_1, log_1, notification_1, errors_1, lifecycleService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let LifecycleService = class LifecycleService extends lifecycleService_1.AbstractLifecycleService {
        constructor(notificationService, windowService, storageService, logService) {
            super(logService);
            this.notificationService = notificationService;
            this.windowService = windowService;
            this.storageService = storageService;
            this.logService = logService;
            this._startupKind = this.resolveStartupKind();
            this.registerListeners();
        }
        resolveStartupKind() {
            const lastShutdownReason = this.storageService.getNumber(LifecycleService.LAST_SHUTDOWN_REASON_KEY, 1 /* WORKSPACE */);
            this.storageService.remove(LifecycleService.LAST_SHUTDOWN_REASON_KEY, 1 /* WORKSPACE */);
            let startupKind;
            if (lastShutdownReason === 3 /* RELOAD */) {
                startupKind = 3 /* ReloadedWindow */;
            }
            else if (lastShutdownReason === 4 /* LOAD */) {
                startupKind = 4 /* ReopenedWindow */;
            }
            else {
                startupKind = 1 /* NewWindow */;
            }
            this.logService.trace(`lifecycle: starting up (startup kind: ${this._startupKind})`);
            return startupKind;
        }
        registerListeners() {
            const windowId = this.windowService.windowId;
            // Main side indicates that window is about to unload, check for vetos
            electron_1.ipcRenderer.on('vscode:onBeforeUnload', (_event, reply) => {
                this.logService.trace(`lifecycle: onBeforeUnload (reason: ${reply.reason})`);
                // trigger onBeforeShutdown events and veto collecting
                this.handleBeforeShutdown(reply.reason).then(veto => {
                    if (veto) {
                        this.logService.trace('lifecycle: onBeforeUnload prevented via veto');
                        electron_1.ipcRenderer.send(reply.cancelChannel, windowId);
                    }
                    else {
                        this.logService.trace('lifecycle: onBeforeUnload continues without veto');
                        this.shutdownReason = reply.reason;
                        electron_1.ipcRenderer.send(reply.okChannel, windowId);
                    }
                });
            });
            // Main side indicates that we will indeed shutdown
            electron_1.ipcRenderer.on('vscode:onWillUnload', (_event, reply) => __awaiter(this, void 0, void 0, function* () {
                this.logService.trace(`lifecycle: onWillUnload (reason: ${reply.reason})`);
                // trigger onWillShutdown events and joining
                yield this.handleWillShutdown(reply.reason);
                // trigger onShutdown event now that we know we will quit
                this._onShutdown.fire();
                // acknowledge to main side
                electron_1.ipcRenderer.send(reply.replyChannel, windowId);
            }));
            // Save shutdown reason to retrieve on next startup
            this.storageService.onWillSaveState(e => {
                if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                    this.storageService.store(LifecycleService.LAST_SHUTDOWN_REASON_KEY, this.shutdownReason, 1 /* WORKSPACE */);
                }
            });
        }
        handleBeforeShutdown(reason) {
            const vetos = [];
            this._onBeforeShutdown.fire({
                veto(value) {
                    vetos.push(value);
                },
                reason
            });
            return lifecycle_1.handleVetos(vetos, err => {
                this.notificationService.error(errorMessage_1.toErrorMessage(err));
                errors_1.onUnexpectedError(err);
            });
        }
        handleWillShutdown(reason) {
            return __awaiter(this, void 0, void 0, function* () {
                const joiners = [];
                this._onWillShutdown.fire({
                    join(promise) {
                        if (promise) {
                            joiners.push(promise);
                        }
                    },
                    reason
                });
                try {
                    yield Promise.all(joiners);
                }
                catch (error) {
                    this.notificationService.error(errorMessage_1.toErrorMessage(error));
                    errors_1.onUnexpectedError(error);
                }
            });
        }
    };
    LifecycleService.LAST_SHUTDOWN_REASON_KEY = 'lifecyle.lastShutdownReason';
    LifecycleService = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, windows_1.IWindowService),
        __param(2, storage_1.IStorageService),
        __param(3, log_1.ILogService)
    ], LifecycleService);
    exports.LifecycleService = LifecycleService;
});
//# sourceMappingURL=lifecycleService.js.map