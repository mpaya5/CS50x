/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/nls", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/configurationResolver/common/configurationResolverSchema"], function (require, exports, extensionsRegistry, nls, configuration_1, configurationResolverSchema_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // debuggers extension point
    exports.debuggersExtPoint = extensionsRegistry.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'debuggers',
        defaultExtensionKind: 'workspace',
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.debuggers', 'Contributes debug adapters.'),
            type: 'array',
            defaultSnippets: [{ body: [{ type: '' }] }],
            items: {
                additionalProperties: false,
                type: 'object',
                defaultSnippets: [{ body: { type: '', program: '', runtime: '', enableBreakpointsFor: { languageIds: [''] } } }],
                properties: {
                    type: {
                        description: nls.localize('vscode.extension.contributes.debuggers.type', "Unique identifier for this debug adapter."),
                        type: 'string'
                    },
                    label: {
                        description: nls.localize('vscode.extension.contributes.debuggers.label', "Display name for this debug adapter."),
                        type: 'string'
                    },
                    program: {
                        description: nls.localize('vscode.extension.contributes.debuggers.program', "Path to the debug adapter program. Path is either absolute or relative to the extension folder."),
                        type: 'string'
                    },
                    args: {
                        description: nls.localize('vscode.extension.contributes.debuggers.args', "Optional arguments to pass to the adapter."),
                        type: 'array'
                    },
                    runtime: {
                        description: nls.localize('vscode.extension.contributes.debuggers.runtime', "Optional runtime in case the program attribute is not an executable but requires a runtime."),
                        type: 'string'
                    },
                    runtimeArgs: {
                        description: nls.localize('vscode.extension.contributes.debuggers.runtimeArgs', "Optional runtime arguments."),
                        type: 'array'
                    },
                    variables: {
                        description: nls.localize('vscode.extension.contributes.debuggers.variables', "Mapping from interactive variables (e.g. ${action.pickProcess}) in `launch.json` to a command."),
                        type: 'object'
                    },
                    initialConfigurations: {
                        description: nls.localize('vscode.extension.contributes.debuggers.initialConfigurations', "Configurations for generating the initial \'launch.json\'."),
                        type: ['array', 'string'],
                    },
                    languages: {
                        description: nls.localize('vscode.extension.contributes.debuggers.languages', "List of languages for which the debug extension could be considered the \"default debugger\"."),
                        type: 'array'
                    },
                    adapterExecutableCommand: {
                        description: nls.localize('vscode.extension.contributes.debuggers.adapterExecutableCommand', "If specified VS Code will call this command to determine the executable path of the debug adapter and the arguments to pass."),
                        type: 'string'
                    },
                    configurationSnippets: {
                        description: nls.localize('vscode.extension.contributes.debuggers.configurationSnippets', "Snippets for adding new configurations in \'launch.json\'."),
                        type: 'array'
                    },
                    configurationAttributes: {
                        description: nls.localize('vscode.extension.contributes.debuggers.configurationAttributes', "JSON schema configurations for validating \'launch.json\'."),
                        type: 'object'
                    },
                    windows: {
                        description: nls.localize('vscode.extension.contributes.debuggers.windows', "Windows specific settings."),
                        type: 'object',
                        properties: {
                            runtime: {
                                description: nls.localize('vscode.extension.contributes.debuggers.windows.runtime', "Runtime used for Windows."),
                                type: 'string'
                            }
                        }
                    },
                    osx: {
                        description: nls.localize('vscode.extension.contributes.debuggers.osx', "macOS specific settings."),
                        type: 'object',
                        properties: {
                            runtime: {
                                description: nls.localize('vscode.extension.contributes.debuggers.osx.runtime', "Runtime used for macOS."),
                                type: 'string'
                            }
                        }
                    },
                    linux: {
                        description: nls.localize('vscode.extension.contributes.debuggers.linux', "Linux specific settings."),
                        type: 'object',
                        properties: {
                            runtime: {
                                description: nls.localize('vscode.extension.contributes.debuggers.linux.runtime', "Runtime used for Linux."),
                                type: 'string'
                            }
                        }
                    }
                }
            }
        }
    });
    // breakpoints extension point #9037
    exports.breakpointsExtPoint = extensionsRegistry.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'breakpoints',
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.breakpoints', 'Contributes breakpoints.'),
            type: 'array',
            defaultSnippets: [{ body: [{ language: '' }] }],
            items: {
                type: 'object',
                additionalProperties: false,
                defaultSnippets: [{ body: { language: '' } }],
                properties: {
                    language: {
                        description: nls.localize('vscode.extension.contributes.breakpoints.language', "Allow breakpoints for this language."),
                        type: 'string'
                    },
                }
            }
        }
    });
    // debug general schema
    const defaultCompound = { name: 'Compound', configurations: [] };
    exports.launchSchema = {
        id: configuration_1.launchSchemaId,
        type: 'object',
        title: nls.localize('app.launch.json.title', "Launch"),
        allowsTrailingCommas: true,
        allowComments: true,
        required: [],
        default: { version: '0.2.0', configurations: [], compounds: [] },
        properties: {
            version: {
                type: 'string',
                description: nls.localize('app.launch.json.version', "Version of this file format."),
                default: '0.2.0'
            },
            configurations: {
                type: 'array',
                description: nls.localize('app.launch.json.configurations', "List of configurations. Add new configurations or edit existing ones by using IntelliSense."),
                items: {
                    defaultSnippets: [],
                    'type': 'object',
                    oneOf: []
                }
            },
            compounds: {
                type: 'array',
                description: nls.localize('app.launch.json.compounds', "List of compounds. Each compound references multiple configurations which will get launched together."),
                items: {
                    type: 'object',
                    required: ['name', 'configurations'],
                    properties: {
                        name: {
                            type: 'string',
                            description: nls.localize('app.launch.json.compound.name', "Name of compound. Appears in the launch configuration drop down menu.")
                        },
                        configurations: {
                            type: 'array',
                            default: [],
                            items: {
                                oneOf: [{
                                        enum: [],
                                        description: nls.localize('useUniqueNames', "Please use unique configuration names.")
                                    }, {
                                        type: 'object',
                                        required: ['name'],
                                        properties: {
                                            name: {
                                                enum: [],
                                                description: nls.localize('app.launch.json.compound.name', "Name of compound. Appears in the launch configuration drop down menu.")
                                            },
                                            folder: {
                                                enum: [],
                                                description: nls.localize('app.launch.json.compound.folder', "Name of folder in which the compound is located.")
                                            }
                                        }
                                    }]
                            },
                            description: nls.localize('app.launch.json.compounds.configurations', "Names of configurations that will be started as part of this compound.")
                        }
                    },
                    default: defaultCompound
                },
                default: [
                    defaultCompound
                ]
            },
            inputs: configurationResolverSchema_1.inputsSchema.definitions.inputs
        }
    };
});
//# sourceMappingURL=debugSchemas.js.map