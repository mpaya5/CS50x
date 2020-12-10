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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/strings", "vs/editor/browser/services/codeEditorService", "vs/platform/commands/common/commands"], function (require, exports, dom, lifecycle_1, linkedList_1, marshalling_1, network_1, resources, strings_1, codeEditorService_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let OpenerService = class OpenerService extends lifecycle_1.Disposable {
        constructor(_editorService, _commandService) {
            super();
            this._editorService = _editorService;
            this._commandService = _commandService;
            this._openers = new linkedList_1.LinkedList();
            this._validators = new linkedList_1.LinkedList();
        }
        registerOpener(opener) {
            const remove = this._openers.push(opener);
            return { dispose: remove };
        }
        registerValidator(validator) {
            const remove = this._validators.push(validator);
            return { dispose: remove };
        }
        open(resource, options) {
            return __awaiter(this, void 0, void 0, function* () {
                // no scheme ?!?
                if (!resource.scheme) {
                    return Promise.resolve(false);
                }
                // check with contributed validators
                for (const validator of this._validators.toArray()) {
                    if (!(yield validator.shouldOpen(resource))) {
                        return false;
                    }
                }
                // check with contributed openers
                for (const opener of this._openers.toArray()) {
                    const handled = yield opener.open(resource, options);
                    if (handled) {
                        return true;
                    }
                }
                // use default openers
                return this._doOpen(resource, options);
            });
        }
        _doOpen(resource, options) {
            const { scheme, path, query, fragment } = resource;
            if (strings_1.equalsIgnoreCase(scheme, network_1.Schemas.mailto) || (options && options.openExternal)) {
                // open default mail application
                return this._doOpenExternal(resource);
            }
            if (strings_1.equalsIgnoreCase(scheme, network_1.Schemas.http) || strings_1.equalsIgnoreCase(scheme, network_1.Schemas.https)) {
                // open link in default browser
                return this._doOpenExternal(resource);
            }
            else if (strings_1.equalsIgnoreCase(scheme, network_1.Schemas.command)) {
                // run command or bail out if command isn't known
                if (!commands_1.CommandsRegistry.getCommand(path)) {
                    return Promise.reject(`command '${path}' NOT known`);
                }
                // execute as command
                let args = [];
                try {
                    args = marshalling_1.parse(query);
                    if (!Array.isArray(args)) {
                        args = [args];
                    }
                }
                catch (e) {
                    //
                }
                return this._commandService.executeCommand(path, ...args).then(() => true);
            }
            else {
                let selection = undefined;
                const match = /^L?(\d+)(?:,(\d+))?/.exec(fragment);
                if (match) {
                    // support file:///some/file.js#73,84
                    // support file:///some/file.js#L73
                    selection = {
                        startLineNumber: parseInt(match[1]),
                        startColumn: match[2] ? parseInt(match[2]) : 1
                    };
                    // remove fragment
                    resource = resource.with({ fragment: '' });
                }
                if (resource.scheme === network_1.Schemas.file) {
                    resource = resources.normalizePath(resource); // workaround for non-normalized paths (https://github.com/Microsoft/vscode/issues/12954)
                }
                return this._editorService.openCodeEditor({ resource, options: { selection, } }, this._editorService.getFocusedCodeEditor(), options && options.openToSide).then(() => true);
            }
        }
        _doOpenExternal(resource) {
            dom.windowOpenNoOpener(encodeURI(resource.toString(true)));
            return Promise.resolve(true);
        }
        dispose() {
            this._validators.clear();
        }
    };
    OpenerService = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService),
        __param(1, commands_1.ICommandService)
    ], OpenerService);
    exports.OpenerService = OpenerService;
});
//# sourceMappingURL=openerService.js.map