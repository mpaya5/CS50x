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
define(["require", "exports", "vs/platform/commands/common/commands", "../common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/base/common/marshalling"], function (require, exports, commands_1, extHost_protocol_1, extHostCustomers_1, marshalling_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MainThreadCommands = class MainThreadCommands {
        constructor(extHostContext, _commandService) {
            this._commandService = _commandService;
            this._commandRegistrations = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostCommands);
            this._generateCommandsDocumentationRegistration = commands_1.CommandsRegistry.registerCommand('_generateCommandsDocumentation', () => this._generateCommandsDocumentation());
        }
        dispose() {
            this._commandRegistrations.forEach(value => value.dispose());
            this._commandRegistrations.clear();
            this._generateCommandsDocumentationRegistration.dispose();
        }
        _generateCommandsDocumentation() {
            return this._proxy.$getContributedCommandHandlerDescriptions().then(result => {
                // add local commands
                const commands = commands_1.CommandsRegistry.getCommands();
                for (const [id, command] of commands) {
                    if (command.description) {
                        result[id] = command.description;
                    }
                }
                // print all as markdown
                const all = [];
                for (let id in result) {
                    all.push('`' + id + '` - ' + _generateMarkdown(result[id]));
                }
                console.log(all.join('\n'));
            });
        }
        $registerCommand(id) {
            this._commandRegistrations.set(id, commands_1.CommandsRegistry.registerCommand(id, (accessor, ...args) => {
                return this._proxy.$executeContributedCommand(id, ...args).then(result => {
                    return marshalling_1.revive(result, 0);
                });
            }));
        }
        $unregisterCommand(id) {
            const command = this._commandRegistrations.get(id);
            if (command) {
                command.dispose();
                this._commandRegistrations.delete(id);
            }
        }
        $executeCommand(id, args) {
            for (let i = 0; i < args.length; i++) {
                args[i] = marshalling_1.revive(args[i], 0);
            }
            return this._commandService.executeCommand(id, ...args);
        }
        $getCommands() {
            return Promise.resolve([...commands_1.CommandsRegistry.getCommands().keys()]);
        }
    };
    MainThreadCommands = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadCommands),
        __param(1, commands_1.ICommandService)
    ], MainThreadCommands);
    exports.MainThreadCommands = MainThreadCommands;
    // --- command doc
    function _generateMarkdown(description) {
        if (typeof description === 'string') {
            return description;
        }
        else {
            const parts = [description.description];
            parts.push('\n\n');
            if (description.args) {
                for (let arg of description.args) {
                    parts.push(`* _${arg.name}_ - ${arg.description || ''}\n`);
                }
            }
            if (description.returns) {
                parts.push(`* _(returns)_ - ${description.returns}`);
            }
            parts.push('\n\n');
            return parts.join('');
        }
    }
});
//# sourceMappingURL=mainThreadCommands.js.map