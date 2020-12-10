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
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/common/extHostTypeConverters", "vs/platform/commands/common/commands", "vs/platform/windows/common/windows", "vs/platform/workspaces/common/workspaces", "vs/base/common/network"], function (require, exports, uri_1, typeConverters, commands_1, windows_1, workspaces_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function adjustHandler(handler) {
        return (accessor, ...args) => {
            return handler(accessor.get(commands_1.ICommandService), ...args);
        };
    }
    class OpenFolderAPICommand {
        static execute(executor, uri, arg = {}) {
            if (typeof arg === 'boolean') {
                arg = { forceNewWindow: arg };
            }
            if (!uri) {
                return executor.executeCommand('_files.pickFolderAndOpen', { forceNewWindow: arg.forceNewWindow });
            }
            const options = { forceNewWindow: arg.forceNewWindow, forceReuseWindow: arg.forceReuseWindow, noRecentEntry: arg.noRecentEntry };
            uri = uri_1.URI.revive(uri);
            const uriToOpen = (workspaces_1.hasWorkspaceFileExtension(uri) || uri.scheme === network_1.Schemas.untitled) ? { workspaceUri: uri } : { folderUri: uri };
            return executor.executeCommand('_files.windowOpen', [uriToOpen], options);
        }
    }
    OpenFolderAPICommand.ID = 'vscode.openFolder';
    exports.OpenFolderAPICommand = OpenFolderAPICommand;
    commands_1.CommandsRegistry.registerCommand({
        id: OpenFolderAPICommand.ID,
        handler: adjustHandler(OpenFolderAPICommand.execute),
        description: {
            description: 'Open a folder or workspace in the current window or new window depending on the newWindow argument. Note that opening in the same window will shutdown the current extension host process and start a new one on the given folder/workspace unless the newWindow parameter is set to true.',
            args: [
                { name: 'uri', description: '(optional) Uri of the folder or workspace file to open. If not provided, a native dialog will ask the user for the folder', constraint: (value) => value === undefined || value instanceof uri_1.URI },
                { name: 'options', description: '(optional) Options. Object with the following properties: `forceNewWindow `: Whether to open the folder/workspace in a new window or the same. Defaults to opening in the same window. `noRecentEntry`: Wheter the opened URI will appear in the \'Open Recent\' list. Defaults to true.  Note, for backward compatibility, options can also be of type boolean, representing the `forceNewWindow` setting.', constraint: (value) => value === undefined || typeof value === 'object' || typeof value === 'boolean' }
            ]
        }
    });
    class NewWindowAPICommand {
        static execute(executor, options) {
            return executor.executeCommand('_files.newWindow', options);
        }
    }
    NewWindowAPICommand.ID = 'vscode.newWindow';
    exports.NewWindowAPICommand = NewWindowAPICommand;
    commands_1.CommandsRegistry.registerCommand({
        id: NewWindowAPICommand.ID,
        handler: adjustHandler(NewWindowAPICommand.execute),
        description: {
            description: 'Opens an new window',
            args: []
        }
    });
    class DiffAPICommand {
        static execute(executor, left, right, label, options) {
            return executor.executeCommand('_workbench.diff', [
                left, right,
                label,
                undefined,
                typeConverters.TextEditorOptions.from(options),
                options ? typeConverters.ViewColumn.from(options.viewColumn) : undefined
            ]);
        }
    }
    DiffAPICommand.ID = 'vscode.diff';
    exports.DiffAPICommand = DiffAPICommand;
    commands_1.CommandsRegistry.registerCommand(DiffAPICommand.ID, adjustHandler(DiffAPICommand.execute));
    class OpenAPICommand {
        static execute(executor, resource, columnOrOptions, label) {
            let options;
            let position;
            if (columnOrOptions) {
                if (typeof columnOrOptions === 'number') {
                    position = typeConverters.ViewColumn.from(columnOrOptions);
                }
                else {
                    options = typeConverters.TextEditorOptions.from(columnOrOptions);
                    position = typeConverters.ViewColumn.from(columnOrOptions.viewColumn);
                }
            }
            return executor.executeCommand('_workbench.open', [
                resource,
                options,
                position,
                label
            ]);
        }
    }
    OpenAPICommand.ID = 'vscode.open';
    exports.OpenAPICommand = OpenAPICommand;
    commands_1.CommandsRegistry.registerCommand(OpenAPICommand.ID, adjustHandler(OpenAPICommand.execute));
    commands_1.CommandsRegistry.registerCommand('_workbench.removeFromRecentlyOpened', function (accessor, uri) {
        const windowService = accessor.get(windows_1.IWindowService);
        return windowService.removeFromRecentlyOpened([uri]);
    });
    class RemoveFromRecentlyOpenedAPICommand {
        static execute(executor, path) {
            if (typeof path === 'string') {
                path = path.match(/^[^:/?#]+:\/\//) ? uri_1.URI.parse(path) : uri_1.URI.file(path);
            }
            else {
                path = uri_1.URI.revive(path); // called from extension host
            }
            return executor.executeCommand('_workbench.removeFromRecentlyOpened', path);
        }
    }
    RemoveFromRecentlyOpenedAPICommand.ID = 'vscode.removeFromRecentlyOpened';
    exports.RemoveFromRecentlyOpenedAPICommand = RemoveFromRecentlyOpenedAPICommand;
    commands_1.CommandsRegistry.registerCommand(RemoveFromRecentlyOpenedAPICommand.ID, adjustHandler(RemoveFromRecentlyOpenedAPICommand.execute));
    class OpenIssueReporter {
        static execute(executor, extensionId) {
            return executor.executeCommand('workbench.action.openIssueReporter', [extensionId]);
        }
    }
    OpenIssueReporter.ID = 'vscode.openIssueReporter';
    exports.OpenIssueReporter = OpenIssueReporter;
    commands_1.CommandsRegistry.registerCommand('_workbench.addToRecentlyOpened', function (accessor, recentEntry) {
        return __awaiter(this, void 0, void 0, function* () {
            const windowService = accessor.get(windows_1.IWindowService);
            const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
            let recent = undefined;
            const uri = recentEntry.uri;
            const label = recentEntry.label;
            if (recentEntry.type === 'workspace') {
                const workspace = yield workspacesService.getWorkspaceIdentifier(uri);
                recent = { workspace, label };
            }
            else if (recentEntry.type === 'folder') {
                recent = { folderUri: uri, label };
            }
            else {
                recent = { fileUri: uri, label };
            }
            return windowService.addRecentlyOpened([recent]);
        });
    });
    commands_1.CommandsRegistry.registerCommand('_workbench.getRecentlyOpened', function (accessor) {
        return __awaiter(this, void 0, void 0, function* () {
            const windowService = accessor.get(windows_1.IWindowService);
            return windowService.getRecentlyOpened();
        });
    });
    class SetEditorLayoutAPICommand {
        static execute(executor, layout) {
            return executor.executeCommand('layoutEditorGroups', layout);
        }
    }
    SetEditorLayoutAPICommand.ID = 'vscode.setEditorLayout';
    exports.SetEditorLayoutAPICommand = SetEditorLayoutAPICommand;
    commands_1.CommandsRegistry.registerCommand({
        id: SetEditorLayoutAPICommand.ID,
        handler: adjustHandler(SetEditorLayoutAPICommand.execute),
        description: {
            description: 'Set Editor Layout',
            args: [{
                    name: 'args',
                    schema: {
                        'type': 'object',
                        'required': ['groups'],
                        'properties': {
                            'orientation': {
                                'type': 'number',
                                'default': 0,
                                'enum': [0, 1]
                            },
                            'groups': {
                                '$ref': '#/definitions/editorGroupsSchema',
                                'default': [{}, {}],
                            }
                        }
                    }
                }]
        }
    });
});
//# sourceMappingURL=apiCommands.js.map