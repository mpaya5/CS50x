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
define(["require", "exports", "vs/workbench/api/common/extHost.api.impl", "vs/workbench/api/common/extHostExtensionService", "vs/base/common/strings", "vs/base/common/resources", "vs/workbench/api/common/extHostRequireInterceptor"], function (require, exports, extHost_api_impl_1, extHostExtensionService_1, strings_1, resources_1, extHostRequireInterceptor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExportsTrap {
        constructor() {
            this._names = [];
            this._exports = new Map();
            const exportsProxy = new Proxy({}, {
                set: (target, p, value) => {
                    // store in target
                    target[p] = value;
                    // store in named-bucket
                    const name = this._names[this._names.length - 1];
                    this._exports.get(name)[p] = value;
                    return true;
                }
            });
            const moduleProxy = new Proxy({}, {
                get: (target, p) => {
                    if (p === 'exports') {
                        return exportsProxy;
                    }
                    return target[p];
                },
                set: (target, p, value) => {
                    // store in target
                    target[p] = value;
                    // override bucket
                    if (p === 'exports') {
                        const name = this._names[this._names.length - 1];
                        this._exports.set(name, value);
                    }
                    return true;
                }
            });
            self.exports = exportsProxy;
            self.module = moduleProxy;
        }
        add(name) {
            this._exports.set(name, Object.create(null));
            this._names.push(name);
            return {
                claim: () => {
                    const result = this._exports.get(name);
                    this._exports.delete(name);
                    this._names.pop();
                    return result;
                }
            };
        }
    }
    ExportsTrap.Instance = new ExportsTrap();
    class WorkerRequireInterceptor extends extHostRequireInterceptor_1.RequireInterceptor {
        _installInterceptor() { }
        getModule(request, parent) {
            for (let alternativeModuleName of this._alternatives) {
                let alternative = alternativeModuleName(request);
                if (alternative) {
                    request = alternative;
                    break;
                }
            }
            if (this._factories.has(request)) {
                return this._factories.get(request).load(request, parent, () => { throw new Error('CANNOT LOAD MODULE from here.'); });
            }
            return undefined;
        }
    }
    class ExtHostExtensionService extends extHostExtensionService_1.AbstractExtHostExtensionService {
        _beforeAlmostReadyToRunExtensions() {
            return __awaiter(this, void 0, void 0, function* () {
                // initialize API and register actors
                const apiFactory = this._instaService.invokeFunction(extHost_api_impl_1.createApiFactoryAndRegisterActors);
                this._fakeModules = this._instaService.createInstance(WorkerRequireInterceptor, apiFactory, this._registry);
                yield this._fakeModules.install();
            });
        }
        _loadCommonJSModule(module, activationTimesBuilder) {
            self.window = self; // <- that's improper but might help extensions that aren't authored correctly
            // FAKE require function that only works for the vscode-module
            const moduleStack = [];
            self.require = (mod) => {
                const parent = moduleStack[moduleStack.length - 1];
                const result = this._fakeModules.getModule(mod, parent);
                if (result !== undefined) {
                    return result;
                }
                if (!strings_1.startsWith(mod, '.')) {
                    throw new Error(`Cannot load module '${mod}'`);
                }
                const next = resources_1.joinPath(parent, '..', ensureSuffix(mod, '.js'));
                moduleStack.push(next);
                const trap = ExportsTrap.Instance.add(next.toString());
                importScripts(next.toString(true));
                moduleStack.pop();
                return trap.claim();
            };
            try {
                activationTimesBuilder.codeLoadingStart();
                module = module.with({ path: ensureSuffix(module.path, '.js') });
                moduleStack.push(module);
                const trap = ExportsTrap.Instance.add(module.toString());
                importScripts(module.toString(true));
                moduleStack.pop();
                return Promise.resolve(trap.claim());
            }
            finally {
                activationTimesBuilder.codeLoadingStop();
            }
        }
        $setRemoteEnvironment(_env) {
            return __awaiter(this, void 0, void 0, function* () {
                throw new Error('Not supported');
            });
        }
    }
    exports.ExtHostExtensionService = ExtHostExtensionService;
    function ensureSuffix(path, suffix) {
        return strings_1.endsWith(path, suffix) ? path : path + suffix;
    }
});
//# sourceMappingURL=extHostExtensionService.js.map