/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/nls", "vs/platform/instantiation/common/instantiation"], function (require, exports, platform_1, JSONContributionRegistry, nls, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ISnippetsService = instantiation_1.createDecorator('snippetService');
    const languageScopeSchemaId = 'vscode://schemas/snippets';
    const languageScopeSchema = {
        id: languageScopeSchemaId,
        allowComments: true,
        allowsTrailingCommas: true,
        defaultSnippets: [{
                label: nls.localize('snippetSchema.json.default', "Empty snippet"),
                body: { '${1:snippetName}': { 'prefix': '${2:prefix}', 'body': '${3:snippet}', 'description': '${4:description}' } }
            }],
        type: 'object',
        description: nls.localize('snippetSchema.json', 'User snippet configuration'),
        additionalProperties: {
            type: 'object',
            required: ['prefix', 'body'],
            properties: {
                prefix: {
                    description: nls.localize('snippetSchema.json.prefix', 'The prefix to used when selecting the snippet in intellisense'),
                    type: ['string', 'array']
                },
                body: {
                    description: nls.localize('snippetSchema.json.body', 'The snippet content. Use \'$1\', \'${1:defaultText}\' to define cursor positions, use \'$0\' for the final cursor position. Insert variable values with \'${varName}\' and \'${varName:defaultText}\', e.g. \'This is file: $TM_FILENAME\'.'),
                    type: ['string', 'array'],
                    items: {
                        type: 'string'
                    }
                },
                description: {
                    description: nls.localize('snippetSchema.json.description', 'The snippet description.'),
                    type: ['string', 'array']
                }
            },
            additionalProperties: false
        }
    };
    const globalSchemaId = 'vscode://schemas/global-snippets';
    const globalSchema = {
        id: globalSchemaId,
        allowComments: true,
        allowsTrailingCommas: true,
        defaultSnippets: [{
                label: nls.localize('snippetSchema.json.default', "Empty snippet"),
                body: { '${1:snippetName}': { 'scope': '${2:scope}', 'prefix': '${3:prefix}', 'body': '${4:snippet}', 'description': '${5:description}' } }
            }],
        type: 'object',
        description: nls.localize('snippetSchema.json', 'User snippet configuration'),
        additionalProperties: {
            type: 'object',
            required: ['prefix', 'body'],
            properties: {
                prefix: {
                    description: nls.localize('snippetSchema.json.prefix', 'The prefix to used when selecting the snippet in intellisense'),
                    type: ['string', 'array']
                },
                scope: {
                    description: nls.localize('snippetSchema.json.scope', "A list of language names to which this snippet applies, e.g. 'typescript,javascript'."),
                    type: 'string'
                },
                body: {
                    description: nls.localize('snippetSchema.json.body', 'The snippet content. Use \'$1\', \'${1:defaultText}\' to define cursor positions, use \'$0\' for the final cursor position. Insert variable values with \'${varName}\' and \'${varName:defaultText}\', e.g. \'This is file: $TM_FILENAME\'.'),
                    type: ['string', 'array'],
                    items: {
                        type: 'string'
                    }
                },
                description: {
                    description: nls.localize('snippetSchema.json.description', 'The snippet description.'),
                    type: 'string'
                }
            },
            additionalProperties: false
        }
    };
    const reg = platform_1.Registry.as(JSONContributionRegistry.Extensions.JSONContribution);
    reg.registerSchema(languageScopeSchemaId, languageScopeSchema);
    reg.registerSchema(globalSchemaId, globalSchema);
});
//# sourceMappingURL=snippets.contribution.js.map