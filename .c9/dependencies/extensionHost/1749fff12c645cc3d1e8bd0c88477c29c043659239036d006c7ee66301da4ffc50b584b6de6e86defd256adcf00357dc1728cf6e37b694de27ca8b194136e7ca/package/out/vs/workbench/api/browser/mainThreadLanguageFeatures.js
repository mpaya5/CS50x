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
define(["require", "exports", "vs/base/common/event", "vs/editor/common/modes", "vs/workbench/contrib/search/common/search", "../common/extHost.protocol", "vs/editor/common/modes/languageConfigurationRegistry", "vs/editor/common/services/modeService", "vs/workbench/api/common/extHostCustomers", "vs/base/common/uri", "vs/workbench/contrib/callHierarchy/common/callHierarchy", "vs/base/common/objects"], function (require, exports, event_1, modes, search, extHost_protocol_1, languageConfigurationRegistry_1, modeService_1, extHostCustomers_1, uri_1, callh, objects_1) {
    "use strict";
    var MainThreadLanguageFeatures_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    "use strict";
    let MainThreadLanguageFeatures = MainThreadLanguageFeatures_1 = class MainThreadLanguageFeatures {
        constructor(extHostContext, modeService) {
            this._registrations = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostLanguageFeatures);
            this._modeService = modeService;
        }
        dispose() {
            for (const registration of this._registrations.values()) {
                registration.dispose();
            }
            this._registrations.clear();
        }
        $unregister(handle) {
            const registration = this._registrations.get(handle);
            if (registration) {
                registration.dispose();
                this._registrations.delete(handle);
            }
        }
        static _reviveLocationDto(data) {
            if (!data) {
                return data;
            }
            else if (Array.isArray(data)) {
                data.forEach(l => MainThreadLanguageFeatures_1._reviveLocationDto(l));
                return data;
            }
            else {
                data.uri = uri_1.URI.revive(data.uri);
                return data;
            }
        }
        static _reviveLocationLinkDto(data) {
            if (!data) {
                return data;
            }
            else if (Array.isArray(data)) {
                data.forEach(l => MainThreadLanguageFeatures_1._reviveLocationLinkDto(l));
                return data;
            }
            else {
                data.uri = uri_1.URI.revive(data.uri);
                return data;
            }
        }
        static _reviveWorkspaceSymbolDto(data) {
            if (!data) {
                return data;
            }
            else if (Array.isArray(data)) {
                data.forEach(MainThreadLanguageFeatures_1._reviveWorkspaceSymbolDto);
                return data;
            }
            else {
                data.location = MainThreadLanguageFeatures_1._reviveLocationDto(data.location);
                return data;
            }
        }
        static _reviveCodeActionDto(data) {
            if (data) {
                data.forEach(code => extHost_protocol_1.reviveWorkspaceEditDto(code.edit));
            }
            return data;
        }
        static _reviveLinkDTO(data) {
            if (data.url && typeof data.url !== 'string') {
                data.url = uri_1.URI.revive(data.url);
            }
            return data;
        }
        static _reviveCallHierarchyItemDto(data) {
            if (data) {
                data.uri = uri_1.URI.revive(data.uri);
            }
            return data;
        }
        //#endregion
        // --- outline
        $registerDocumentSymbolProvider(handle, selector, displayName) {
            this._registrations.set(handle, modes.DocumentSymbolProviderRegistry.register(selector, {
                displayName,
                provideDocumentSymbols: (model, token) => {
                    return this._proxy.$provideDocumentSymbols(handle, model.uri, token);
                }
            }));
        }
        // --- code lens
        $registerCodeLensSupport(handle, selector, eventHandle) {
            const provider = {
                provideCodeLenses: (model, token) => {
                    return this._proxy.$provideCodeLenses(handle, model.uri, token).then(listDto => {
                        if (!listDto) {
                            return undefined;
                        }
                        return {
                            lenses: listDto.lenses,
                            dispose: () => listDto.cacheId && this._proxy.$releaseCodeLenses(handle, listDto.cacheId)
                        };
                    });
                },
                resolveCodeLens: (_model, codeLens, token) => {
                    return this._proxy.$resolveCodeLens(handle, codeLens, token);
                }
            };
            if (typeof eventHandle === 'number') {
                const emitter = new event_1.Emitter();
                this._registrations.set(eventHandle, emitter);
                provider.onDidChange = emitter.event;
            }
            this._registrations.set(handle, modes.CodeLensProviderRegistry.register(selector, provider));
        }
        $emitCodeLensEvent(eventHandle, event) {
            const obj = this._registrations.get(eventHandle);
            if (obj instanceof event_1.Emitter) {
                obj.fire(event);
            }
        }
        // --- declaration
        $registerDefinitionSupport(handle, selector) {
            this._registrations.set(handle, modes.DefinitionProviderRegistry.register(selector, {
                provideDefinition: (model, position, token) => {
                    return this._proxy.$provideDefinition(handle, model.uri, position, token).then(MainThreadLanguageFeatures_1._reviveLocationLinkDto);
                }
            }));
        }
        $registerDeclarationSupport(handle, selector) {
            this._registrations.set(handle, modes.DeclarationProviderRegistry.register(selector, {
                provideDeclaration: (model, position, token) => {
                    return this._proxy.$provideDeclaration(handle, model.uri, position, token).then(MainThreadLanguageFeatures_1._reviveLocationLinkDto);
                }
            }));
        }
        $registerImplementationSupport(handle, selector) {
            this._registrations.set(handle, modes.ImplementationProviderRegistry.register(selector, {
                provideImplementation: (model, position, token) => {
                    return this._proxy.$provideImplementation(handle, model.uri, position, token).then(MainThreadLanguageFeatures_1._reviveLocationLinkDto);
                }
            }));
        }
        $registerTypeDefinitionSupport(handle, selector) {
            this._registrations.set(handle, modes.TypeDefinitionProviderRegistry.register(selector, {
                provideTypeDefinition: (model, position, token) => {
                    return this._proxy.$provideTypeDefinition(handle, model.uri, position, token).then(MainThreadLanguageFeatures_1._reviveLocationLinkDto);
                }
            }));
        }
        // --- extra info
        $registerHoverProvider(handle, selector) {
            this._registrations.set(handle, modes.HoverProviderRegistry.register(selector, {
                provideHover: (model, position, token) => {
                    return this._proxy.$provideHover(handle, model.uri, position, token);
                }
            }));
        }
        // --- occurrences
        $registerDocumentHighlightProvider(handle, selector) {
            this._registrations.set(handle, modes.DocumentHighlightProviderRegistry.register(selector, {
                provideDocumentHighlights: (model, position, token) => {
                    return this._proxy.$provideDocumentHighlights(handle, model.uri, position, token);
                }
            }));
        }
        // --- references
        $registerReferenceSupport(handle, selector) {
            this._registrations.set(handle, modes.ReferenceProviderRegistry.register(selector, {
                provideReferences: (model, position, context, token) => {
                    return this._proxy.$provideReferences(handle, model.uri, position, context, token).then(MainThreadLanguageFeatures_1._reviveLocationDto);
                }
            }));
        }
        // --- quick fix
        $registerQuickFixSupport(handle, selector, providedCodeActionKinds) {
            this._registrations.set(handle, modes.CodeActionProviderRegistry.register(selector, {
                provideCodeActions: (model, rangeOrSelection, context, token) => __awaiter(this, void 0, void 0, function* () {
                    const listDto = yield this._proxy.$provideCodeActions(handle, model.uri, rangeOrSelection, context, token);
                    if (!listDto) {
                        return undefined;
                    }
                    return {
                        actions: MainThreadLanguageFeatures_1._reviveCodeActionDto(listDto.actions),
                        dispose: () => {
                            if (typeof listDto.cacheId === 'number') {
                                this._proxy.$releaseCodeActions(handle, listDto.cacheId);
                            }
                        }
                    };
                }),
                providedCodeActionKinds
            }));
        }
        // --- formatting
        $registerDocumentFormattingSupport(handle, selector, extensionId, displayName) {
            this._registrations.set(handle, modes.DocumentFormattingEditProviderRegistry.register(selector, {
                extensionId,
                displayName,
                provideDocumentFormattingEdits: (model, options, token) => {
                    return this._proxy.$provideDocumentFormattingEdits(handle, model.uri, options, token);
                }
            }));
        }
        $registerRangeFormattingSupport(handle, selector, extensionId, displayName) {
            this._registrations.set(handle, modes.DocumentRangeFormattingEditProviderRegistry.register(selector, {
                extensionId,
                displayName,
                provideDocumentRangeFormattingEdits: (model, range, options, token) => {
                    return this._proxy.$provideDocumentRangeFormattingEdits(handle, model.uri, range, options, token);
                }
            }));
        }
        $registerOnTypeFormattingSupport(handle, selector, autoFormatTriggerCharacters, extensionId) {
            this._registrations.set(handle, modes.OnTypeFormattingEditProviderRegistry.register(selector, {
                extensionId,
                autoFormatTriggerCharacters,
                provideOnTypeFormattingEdits: (model, position, ch, options, token) => {
                    return this._proxy.$provideOnTypeFormattingEdits(handle, model.uri, position, ch, options, token);
                }
            }));
        }
        // --- navigate type
        $registerNavigateTypeSupport(handle) {
            let lastResultId;
            this._registrations.set(handle, search.WorkspaceSymbolProviderRegistry.register({
                provideWorkspaceSymbols: (search, token) => {
                    return this._proxy.$provideWorkspaceSymbols(handle, search, token).then(result => {
                        if (lastResultId !== undefined) {
                            this._proxy.$releaseWorkspaceSymbols(handle, lastResultId);
                        }
                        lastResultId = result._id;
                        return MainThreadLanguageFeatures_1._reviveWorkspaceSymbolDto(result.symbols);
                    });
                },
                resolveWorkspaceSymbol: (item, token) => {
                    return this._proxy.$resolveWorkspaceSymbol(handle, item, token).then(i => {
                        if (i) {
                            return MainThreadLanguageFeatures_1._reviveWorkspaceSymbolDto(i);
                        }
                        return undefined;
                    });
                }
            }));
        }
        // --- rename
        $registerRenameSupport(handle, selector, supportResolveLocation) {
            this._registrations.set(handle, modes.RenameProviderRegistry.register(selector, {
                provideRenameEdits: (model, position, newName, token) => {
                    return this._proxy.$provideRenameEdits(handle, model.uri, position, newName, token).then(extHost_protocol_1.reviveWorkspaceEditDto);
                },
                resolveRenameLocation: supportResolveLocation
                    ? (model, position, token) => this._proxy.$resolveRenameLocation(handle, model.uri, position, token)
                    : undefined
            }));
        }
        // --- suggest
        static _inflateSuggestDto(defaultRange, data) {
            return {
                label: data.a,
                kind: data.b,
                tags: data.n,
                detail: data.c,
                documentation: data.d,
                sortText: data.e,
                filterText: data.f,
                preselect: data.g,
                insertText: typeof data.h === 'undefined' ? data.a : data.h,
                insertTextRules: data.i,
                range: data.j || defaultRange,
                commitCharacters: data.k,
                additionalTextEdits: data.l,
                command: data.m,
                // not-standard
                _id: data.x,
            };
        }
        $registerSuggestSupport(handle, selector, triggerCharacters, supportsResolveDetails, extensionId) {
            const provider = {
                triggerCharacters,
                _debugDisplayName: extensionId.value,
                provideCompletionItems: (model, position, context, token) => {
                    return this._proxy.$provideCompletionItems(handle, model.uri, position, context, token).then(result => {
                        if (!result) {
                            return result;
                        }
                        return {
                            suggestions: result.b.map(d => MainThreadLanguageFeatures_1._inflateSuggestDto(result.a, d)),
                            incomplete: result.c,
                            dispose: () => typeof result.x === 'number' && this._proxy.$releaseCompletionItems(handle, result.x)
                        };
                    });
                }
            };
            if (supportsResolveDetails) {
                provider.resolveCompletionItem = (model, position, suggestion, token) => {
                    return this._proxy.$resolveCompletionItem(handle, model.uri, position, suggestion._id, token).then(result => {
                        if (!result) {
                            return suggestion;
                        }
                        let newSuggestion = MainThreadLanguageFeatures_1._inflateSuggestDto(suggestion.range, result);
                        return objects_1.mixin(suggestion, newSuggestion, true);
                    });
                };
            }
            this._registrations.set(handle, modes.CompletionProviderRegistry.register(selector, provider));
        }
        // --- parameter hints
        $registerSignatureHelpProvider(handle, selector, metadata) {
            this._registrations.set(handle, modes.SignatureHelpProviderRegistry.register(selector, {
                signatureHelpTriggerCharacters: metadata.triggerCharacters,
                signatureHelpRetriggerCharacters: metadata.retriggerCharacters,
                provideSignatureHelp: (model, position, token, context) => __awaiter(this, void 0, void 0, function* () {
                    const result = yield this._proxy.$provideSignatureHelp(handle, model.uri, position, context, token);
                    if (!result) {
                        return undefined;
                    }
                    return {
                        value: result,
                        dispose: () => {
                            this._proxy.$releaseSignatureHelp(handle, result.id);
                        }
                    };
                })
            }));
        }
        // --- links
        $registerDocumentLinkProvider(handle, selector, supportsResolve) {
            const provider = {
                provideLinks: (model, token) => {
                    return this._proxy.$provideDocumentLinks(handle, model.uri, token).then(dto => {
                        if (!dto) {
                            return undefined;
                        }
                        return {
                            links: dto.links.map(MainThreadLanguageFeatures_1._reviveLinkDTO),
                            dispose: () => {
                                if (typeof dto.id === 'number') {
                                    this._proxy.$releaseDocumentLinks(handle, dto.id);
                                }
                            }
                        };
                    });
                }
            };
            if (supportsResolve) {
                provider.resolveLink = (link, token) => {
                    const dto = link;
                    if (!dto.cacheId) {
                        return link;
                    }
                    return this._proxy.$resolveDocumentLink(handle, dto.cacheId, token).then(obj => {
                        return obj && MainThreadLanguageFeatures_1._reviveLinkDTO(obj);
                    });
                };
            }
            this._registrations.set(handle, modes.LinkProviderRegistry.register(selector, provider));
        }
        // --- colors
        $registerDocumentColorProvider(handle, selector) {
            const proxy = this._proxy;
            this._registrations.set(handle, modes.ColorProviderRegistry.register(selector, {
                provideDocumentColors: (model, token) => {
                    return proxy.$provideDocumentColors(handle, model.uri, token)
                        .then(documentColors => {
                        return documentColors.map(documentColor => {
                            const [red, green, blue, alpha] = documentColor.color;
                            const color = {
                                red: red,
                                green: green,
                                blue: blue,
                                alpha
                            };
                            return {
                                color,
                                range: documentColor.range
                            };
                        });
                    });
                },
                provideColorPresentations: (model, colorInfo, token) => {
                    return proxy.$provideColorPresentations(handle, model.uri, {
                        color: [colorInfo.color.red, colorInfo.color.green, colorInfo.color.blue, colorInfo.color.alpha],
                        range: colorInfo.range
                    }, token);
                }
            }));
        }
        // --- folding
        $registerFoldingRangeProvider(handle, selector) {
            const proxy = this._proxy;
            this._registrations.set(handle, modes.FoldingRangeProviderRegistry.register(selector, {
                provideFoldingRanges: (model, context, token) => {
                    return proxy.$provideFoldingRanges(handle, model.uri, context, token);
                }
            }));
        }
        // -- smart select
        $registerSelectionRangeProvider(handle, selector) {
            this._registrations.set(handle, modes.SelectionRangeRegistry.register(selector, {
                provideSelectionRanges: (model, positions, token) => {
                    return this._proxy.$provideSelectionRanges(handle, model.uri, positions, token);
                }
            }));
        }
        // --- call hierarchy
        $registerCallHierarchyProvider(handle, selector) {
            this._registrations.set(handle, callh.CallHierarchyProviderRegistry.register(selector, {
                provideCallHierarchyItem: (document, position, token) => {
                    return this._proxy.$provideCallHierarchyItem(handle, document.uri, position, token).then(MainThreadLanguageFeatures_1._reviveCallHierarchyItemDto);
                },
                resolveCallHierarchyItem: (item, direction, token) => {
                    return this._proxy.$resolveCallHierarchyItem(handle, item, direction, token).then(data => {
                        if (data) {
                            for (let i = 0; i < data.length; i++) {
                                const [item, locations] = data[i];
                                data[i] = [
                                    MainThreadLanguageFeatures_1._reviveCallHierarchyItemDto(item),
                                    MainThreadLanguageFeatures_1._reviveLocationDto(locations)
                                ];
                            }
                        }
                        return data;
                    });
                }
            }));
        }
        // --- configuration
        static _reviveRegExp(regExp) {
            return new RegExp(regExp.pattern, regExp.flags);
        }
        static _reviveIndentationRule(indentationRule) {
            return {
                decreaseIndentPattern: MainThreadLanguageFeatures_1._reviveRegExp(indentationRule.decreaseIndentPattern),
                increaseIndentPattern: MainThreadLanguageFeatures_1._reviveRegExp(indentationRule.increaseIndentPattern),
                indentNextLinePattern: indentationRule.indentNextLinePattern ? MainThreadLanguageFeatures_1._reviveRegExp(indentationRule.indentNextLinePattern) : undefined,
                unIndentedLinePattern: indentationRule.unIndentedLinePattern ? MainThreadLanguageFeatures_1._reviveRegExp(indentationRule.unIndentedLinePattern) : undefined,
            };
        }
        static _reviveOnEnterRule(onEnterRule) {
            return {
                beforeText: MainThreadLanguageFeatures_1._reviveRegExp(onEnterRule.beforeText),
                afterText: onEnterRule.afterText ? MainThreadLanguageFeatures_1._reviveRegExp(onEnterRule.afterText) : undefined,
                oneLineAboveText: onEnterRule.oneLineAboveText ? MainThreadLanguageFeatures_1._reviveRegExp(onEnterRule.oneLineAboveText) : undefined,
                action: onEnterRule.action
            };
        }
        static _reviveOnEnterRules(onEnterRules) {
            return onEnterRules.map(MainThreadLanguageFeatures_1._reviveOnEnterRule);
        }
        $setLanguageConfiguration(handle, languageId, _configuration) {
            const configuration = {
                comments: _configuration.comments,
                brackets: _configuration.brackets,
                wordPattern: _configuration.wordPattern ? MainThreadLanguageFeatures_1._reviveRegExp(_configuration.wordPattern) : undefined,
                indentationRules: _configuration.indentationRules ? MainThreadLanguageFeatures_1._reviveIndentationRule(_configuration.indentationRules) : undefined,
                onEnterRules: _configuration.onEnterRules ? MainThreadLanguageFeatures_1._reviveOnEnterRules(_configuration.onEnterRules) : undefined,
                autoClosingPairs: undefined,
                surroundingPairs: undefined,
                __electricCharacterSupport: undefined
            };
            if (_configuration.__characterPairSupport) {
                // backwards compatibility
                configuration.autoClosingPairs = _configuration.__characterPairSupport.autoClosingPairs;
            }
            if (_configuration.__electricCharacterSupport && _configuration.__electricCharacterSupport.docComment) {
                configuration.__electricCharacterSupport = {
                    docComment: {
                        open: _configuration.__electricCharacterSupport.docComment.open,
                        close: _configuration.__electricCharacterSupport.docComment.close
                    }
                };
            }
            const languageIdentifier = this._modeService.getLanguageIdentifier(languageId);
            if (languageIdentifier) {
                this._registrations.set(handle, languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(languageIdentifier, configuration));
            }
        }
    };
    MainThreadLanguageFeatures = MainThreadLanguageFeatures_1 = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadLanguageFeatures),
        __param(1, modeService_1.IModeService)
    ], MainThreadLanguageFeatures);
    exports.MainThreadLanguageFeatures = MainThreadLanguageFeatures;
});
//# sourceMappingURL=mainThreadLanguageFeatures.js.map