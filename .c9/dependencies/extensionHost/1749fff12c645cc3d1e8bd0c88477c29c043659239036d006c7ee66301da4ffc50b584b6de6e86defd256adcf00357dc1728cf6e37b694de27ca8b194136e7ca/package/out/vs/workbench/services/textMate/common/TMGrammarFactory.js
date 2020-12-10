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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/services/textMate/common/TMScopeRegistry"], function (require, exports, nls, lifecycle_1, TMScopeRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TMGrammarFactory extends lifecycle_1.Disposable {
        constructor(host, grammarDefinitions, vscodeTextmate, onigLib) {
            super();
            this._host = host;
            this._initialState = vscodeTextmate.INITIAL;
            this._scopeRegistry = this._register(new TMScopeRegistry_1.TMScopeRegistry());
            this._injections = {};
            this._injectedEmbeddedLanguages = {};
            this._languageToScope2 = [];
            this._grammarRegistry = new vscodeTextmate.Registry({
                getOnigLib: (typeof onigLib === 'undefined' ? undefined : () => onigLib),
                loadGrammar: (scopeName) => __awaiter(this, void 0, void 0, function* () {
                    const grammarDefinition = this._scopeRegistry.getGrammarDefinition(scopeName);
                    if (!grammarDefinition) {
                        this._host.logTrace(`No grammar found for scope ${scopeName}`);
                        return null;
                    }
                    const location = grammarDefinition.location;
                    try {
                        const content = yield this._host.readFile(location);
                        return vscodeTextmate.parseRawGrammar(content, location.path);
                    }
                    catch (e) {
                        this._host.logError(`Unable to load and parse grammar for scope ${scopeName} from ${location}`, e);
                        return null;
                    }
                }),
                getInjections: (scopeName) => {
                    const scopeParts = scopeName.split('.');
                    let injections = [];
                    for (let i = 1; i <= scopeParts.length; i++) {
                        const subScopeName = scopeParts.slice(0, i).join('.');
                        injections = [...injections, ...(this._injections[subScopeName] || [])];
                    }
                    return injections;
                }
            });
            for (const validGrammar of grammarDefinitions) {
                this._scopeRegistry.register(validGrammar);
                if (validGrammar.injectTo) {
                    for (let injectScope of validGrammar.injectTo) {
                        let injections = this._injections[injectScope];
                        if (!injections) {
                            this._injections[injectScope] = injections = [];
                        }
                        injections.push(validGrammar.scopeName);
                    }
                    if (validGrammar.embeddedLanguages) {
                        for (let injectScope of validGrammar.injectTo) {
                            let injectedEmbeddedLanguages = this._injectedEmbeddedLanguages[injectScope];
                            if (!injectedEmbeddedLanguages) {
                                this._injectedEmbeddedLanguages[injectScope] = injectedEmbeddedLanguages = [];
                            }
                            injectedEmbeddedLanguages.push(validGrammar.embeddedLanguages);
                        }
                    }
                }
                if (validGrammar.language) {
                    this._languageToScope2[validGrammar.language] = validGrammar.scopeName;
                }
            }
        }
        has(languageId) {
            return this._languageToScope2[languageId] ? true : false;
        }
        setTheme(theme) {
            this._grammarRegistry.setTheme(theme);
        }
        getColorMap() {
            return this._grammarRegistry.getColorMap();
        }
        createGrammar(languageId) {
            return __awaiter(this, void 0, void 0, function* () {
                const scopeName = this._languageToScope2[languageId];
                if (typeof scopeName !== 'string') {
                    // No TM grammar defined
                    return Promise.reject(new Error(nls.localize('no-tm-grammar', "No TM Grammar registered for this language.")));
                }
                const grammarDefinition = this._scopeRegistry.getGrammarDefinition(scopeName);
                if (!grammarDefinition) {
                    // No TM grammar defined
                    return Promise.reject(new Error(nls.localize('no-tm-grammar', "No TM Grammar registered for this language.")));
                }
                let embeddedLanguages = grammarDefinition.embeddedLanguages;
                if (this._injectedEmbeddedLanguages[scopeName]) {
                    const injectedEmbeddedLanguages = this._injectedEmbeddedLanguages[scopeName];
                    for (const injected of injectedEmbeddedLanguages) {
                        for (const scope of Object.keys(injected)) {
                            embeddedLanguages[scope] = injected[scope];
                        }
                    }
                }
                const containsEmbeddedLanguages = (Object.keys(embeddedLanguages).length > 0);
                const grammar = yield this._grammarRegistry.loadGrammarWithConfiguration(scopeName, languageId, { embeddedLanguages, tokenTypes: grammarDefinition.tokenTypes });
                return {
                    languageId: languageId,
                    grammar: grammar,
                    initialState: this._initialState,
                    containsEmbeddedLanguages: containsEmbeddedLanguages
                };
            });
        }
    }
    exports.TMGrammarFactory = TMGrammarFactory;
});
//# sourceMappingURL=TMGrammarFactory.js.map