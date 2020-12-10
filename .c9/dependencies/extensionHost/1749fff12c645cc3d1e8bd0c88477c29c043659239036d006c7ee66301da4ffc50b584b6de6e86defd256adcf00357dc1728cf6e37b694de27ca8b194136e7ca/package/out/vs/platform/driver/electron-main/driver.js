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
define(["require", "exports", "vs/platform/driver/node/driver", "vs/platform/windows/electron-main/windows", "vs/base/parts/ipc/node/ipc.net", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc", "vs/base/common/keyCodes", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/base/common/platform", "vs/base/common/event", "vs/base/common/scanCode", "vs/base/common/keybindingParser", "vs/base/common/async"], function (require, exports, driver_1, windows_1, ipc_net_1, lifecycle_1, ipc_1, keyCodes_1, usLayoutResolvedKeybinding_1, platform_1, event_1, scanCode_1, keybindingParser_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isSilentKeyCode(keyCode) {
        return keyCode < 21 /* KEY_0 */;
    }
    let Driver = class Driver {
        constructor(windowServer, options, windowsService) {
            this.windowServer = windowServer;
            this.options = options;
            this.windowsService = windowsService;
            this.registeredWindowIds = new Set();
            this.reloadingWindowIds = new Set();
            this.onDidReloadingChange = new event_1.Emitter();
        }
        registerWindowDriver(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                this.registeredWindowIds.add(windowId);
                this.reloadingWindowIds.delete(windowId);
                this.onDidReloadingChange.fire();
                return this.options;
            });
        }
        reloadWindowDriver(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                this.reloadingWindowIds.add(windowId);
            });
        }
        getWindowIds() {
            return __awaiter(this, void 0, void 0, function* () {
                return this.windowsService.getWindows()
                    .map(w => w.id)
                    .filter(id => this.registeredWindowIds.has(id) && !this.reloadingWindowIds.has(id));
            });
        }
        capturePage(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.whenUnfrozen(windowId);
                const window = this.windowsService.getWindowById(windowId);
                if (!window) {
                    throw new Error('Invalid window');
                }
                const webContents = window.win.webContents;
                const image = yield new Promise(c => webContents.capturePage(c));
                return image.toPNG().toString('base64');
            });
        }
        reloadWindow(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.whenUnfrozen(windowId);
                const window = this.windowsService.getWindowById(windowId);
                if (!window) {
                    throw new Error('Invalid window');
                }
                this.reloadingWindowIds.add(windowId);
                this.windowsService.reload(window);
            });
        }
        exitApplication() {
            return __awaiter(this, void 0, void 0, function* () {
                return this.windowsService.quit();
            });
        }
        dispatchKeybinding(windowId, keybinding) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.whenUnfrozen(windowId);
                const parts = keybindingParser_1.KeybindingParser.parseUserBinding(keybinding);
                for (let part of parts) {
                    yield this._dispatchKeybinding(windowId, part);
                }
            });
        }
        _dispatchKeybinding(windowId, keybinding) {
            return __awaiter(this, void 0, void 0, function* () {
                if (keybinding instanceof scanCode_1.ScanCodeBinding) {
                    throw new Error('ScanCodeBindings not supported');
                }
                const window = this.windowsService.getWindowById(windowId);
                if (!window) {
                    throw new Error('Invalid window');
                }
                const webContents = window.win.webContents;
                const noModifiedKeybinding = new keyCodes_1.SimpleKeybinding(false, false, false, false, keybinding.keyCode);
                const resolvedKeybinding = new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(noModifiedKeybinding.toChord(), platform_1.OS);
                const keyCode = resolvedKeybinding.getElectronAccelerator();
                const modifiers = [];
                if (keybinding.ctrlKey) {
                    modifiers.push('ctrl');
                }
                if (keybinding.metaKey) {
                    modifiers.push('meta');
                }
                if (keybinding.shiftKey) {
                    modifiers.push('shift');
                }
                if (keybinding.altKey) {
                    modifiers.push('alt');
                }
                webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers });
                if (!isSilentKeyCode(keybinding.keyCode)) {
                    webContents.sendInputEvent({ type: 'char', keyCode, modifiers });
                }
                webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers });
                yield async_1.timeout(100);
            });
        }
        click(windowId, selector, xoffset, yoffset) {
            return __awaiter(this, void 0, void 0, function* () {
                const windowDriver = yield this.getWindowDriver(windowId);
                yield windowDriver.click(selector, xoffset, yoffset);
            });
        }
        doubleClick(windowId, selector) {
            return __awaiter(this, void 0, void 0, function* () {
                const windowDriver = yield this.getWindowDriver(windowId);
                yield windowDriver.doubleClick(selector);
            });
        }
        setValue(windowId, selector, text) {
            return __awaiter(this, void 0, void 0, function* () {
                const windowDriver = yield this.getWindowDriver(windowId);
                yield windowDriver.setValue(selector, text);
            });
        }
        getTitle(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                const windowDriver = yield this.getWindowDriver(windowId);
                return yield windowDriver.getTitle();
            });
        }
        isActiveElement(windowId, selector) {
            return __awaiter(this, void 0, void 0, function* () {
                const windowDriver = yield this.getWindowDriver(windowId);
                return yield windowDriver.isActiveElement(selector);
            });
        }
        getElements(windowId, selector, recursive) {
            return __awaiter(this, void 0, void 0, function* () {
                const windowDriver = yield this.getWindowDriver(windowId);
                return yield windowDriver.getElements(selector, recursive);
            });
        }
        getElementXY(windowId, selector, xoffset, yoffset) {
            return __awaiter(this, void 0, void 0, function* () {
                const windowDriver = yield this.getWindowDriver(windowId);
                return yield windowDriver.getElementXY(selector, xoffset, yoffset);
            });
        }
        typeInEditor(windowId, selector, text) {
            return __awaiter(this, void 0, void 0, function* () {
                const windowDriver = yield this.getWindowDriver(windowId);
                yield windowDriver.typeInEditor(selector, text);
            });
        }
        getTerminalBuffer(windowId, selector) {
            return __awaiter(this, void 0, void 0, function* () {
                const windowDriver = yield this.getWindowDriver(windowId);
                return yield windowDriver.getTerminalBuffer(selector);
            });
        }
        writeInTerminal(windowId, selector, text) {
            return __awaiter(this, void 0, void 0, function* () {
                const windowDriver = yield this.getWindowDriver(windowId);
                yield windowDriver.writeInTerminal(selector, text);
            });
        }
        getWindowDriver(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.whenUnfrozen(windowId);
                const id = `window:${windowId}`;
                const router = new ipc_1.StaticRouter(ctx => ctx === id);
                const windowDriverChannel = this.windowServer.getChannel('windowDriver', router);
                return new driver_1.WindowDriverChannelClient(windowDriverChannel);
            });
        }
        whenUnfrozen(windowId) {
            return __awaiter(this, void 0, void 0, function* () {
                while (this.reloadingWindowIds.has(windowId)) {
                    yield event_1.Event.toPromise(this.onDidReloadingChange.event);
                }
            });
        }
    };
    Driver = __decorate([
        __param(2, windows_1.IWindowsMainService)
    ], Driver);
    exports.Driver = Driver;
    function serve(windowServer, handle, environmentService, instantiationService) {
        return __awaiter(this, void 0, void 0, function* () {
            const verbose = environmentService.driverVerbose;
            const driver = instantiationService.createInstance(Driver, windowServer, { verbose });
            const windowDriverRegistryChannel = new driver_1.WindowDriverRegistryChannel(driver);
            windowServer.registerChannel('windowDriverRegistry', windowDriverRegistryChannel);
            const server = yield ipc_net_1.serve(handle);
            const channel = new driver_1.DriverChannel(driver);
            server.registerChannel('driver', channel);
            return lifecycle_1.combinedDisposable(server, windowServer);
        });
    }
    exports.serve = serve;
});
//# sourceMappingURL=driver.js.map