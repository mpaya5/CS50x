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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/config/editorOptions", "vs/editor/common/services/resourceConfiguration", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/notification/common/notification", "vs/workbench/contrib/preferences/browser/preferencesEditor"], function (require, exports, nls, lifecycle_1, uri_1, editorExtensions_1, codeEditorService_1, editorOptions_1, resourceConfiguration_1, actions_1, contextkey_1, notification_1, preferencesEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const transientWordWrapState = 'transientWordWrapState';
    const isWordWrapMinifiedKey = 'isWordWrapMinified';
    const isDominatedByLongLinesKey = 'isDominatedByLongLines';
    const inDiffEditorKey = 'inDiffEditor';
    /**
     * Store (in memory) the word wrap state for a particular model.
     */
    function writeTransientState(model, state, codeEditorService) {
        codeEditorService.setTransientModelProperty(model, transientWordWrapState, state);
    }
    exports.writeTransientState = writeTransientState;
    /**
     * Read (in memory) the word wrap state for a particular model.
     */
    function readTransientState(model, codeEditorService) {
        return codeEditorService.getTransientModelProperty(model, transientWordWrapState);
    }
    function readWordWrapState(model, configurationService, codeEditorService) {
        const editorConfig = configurationService.getValue(model.uri, 'editor');
        let _configuredWordWrap = editorConfig && (typeof editorConfig.wordWrap === 'string' || typeof editorConfig.wordWrap === 'boolean') ? editorConfig.wordWrap : undefined;
        // Compatibility with old true or false values
        if (_configuredWordWrap === true) {
            _configuredWordWrap = 'on';
        }
        else if (_configuredWordWrap === false) {
            _configuredWordWrap = 'off';
        }
        const _configuredWordWrapMinified = editorConfig && typeof editorConfig.wordWrapMinified === 'boolean' ? editorConfig.wordWrapMinified : undefined;
        const _transientState = readTransientState(model, codeEditorService);
        return {
            configuredWordWrap: _configuredWordWrap,
            configuredWordWrapMinified: (typeof _configuredWordWrapMinified === 'boolean' ? _configuredWordWrapMinified : editorOptions_1.EDITOR_DEFAULTS.wordWrapMinified),
            transientState: _transientState
        };
    }
    function toggleWordWrap(editor, state) {
        if (state.transientState) {
            // toggle off => go to null
            return {
                configuredWordWrap: state.configuredWordWrap,
                configuredWordWrapMinified: state.configuredWordWrapMinified,
                transientState: null
            };
        }
        const config = editor.getConfiguration();
        let transientState;
        const actualWrappingInfo = config.wrappingInfo;
        if (actualWrappingInfo.isWordWrapMinified) {
            // => wrapping due to minified file
            transientState = {
                forceWordWrap: 'off',
                forceWordWrapMinified: false
            };
        }
        else if (state.configuredWordWrap !== 'off') {
            // => wrapping is configured to be on (or some variant)
            transientState = {
                forceWordWrap: 'off',
                forceWordWrapMinified: false
            };
        }
        else {
            // => wrapping is configured to be off
            transientState = {
                forceWordWrap: 'on',
                forceWordWrapMinified: state.configuredWordWrapMinified
            };
        }
        return {
            configuredWordWrap: state.configuredWordWrap,
            configuredWordWrapMinified: state.configuredWordWrapMinified,
            transientState: transientState
        };
    }
    const TOGGLE_WORD_WRAP_ID = 'editor.action.toggleWordWrap';
    class ToggleWordWrapAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: TOGGLE_WORD_WRAP_ID,
                label: nls.localize('toggle.wordwrap', "View: Toggle Word Wrap"),
                alias: 'View: Toggle Word Wrap',
                precondition: undefined,
                kbOpts: {
                    kbExpr: null,
                    primary: 512 /* Alt */ | 56 /* KEY_Z */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            if (editor.getContribution(preferencesEditor_1.DefaultSettingsEditorContribution.ID)) {
                // in the settings editor...
                return;
            }
            if (!editor.hasModel()) {
                return;
            }
            const editorConfiguration = editor.getConfiguration();
            if (editorConfiguration.wrappingInfo.inDiffEditor) {
                // Cannot change wrapping settings inside the diff editor
                const notificationService = accessor.get(notification_1.INotificationService);
                notificationService.info(nls.localize('wordWrap.notInDiffEditor', "Cannot toggle word wrap in a diff editor."));
                return;
            }
            const textResourceConfigurationService = accessor.get(resourceConfiguration_1.ITextResourceConfigurationService);
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const model = editor.getModel();
            if (!canToggleWordWrap(model.uri)) {
                return;
            }
            // Read the current state
            const currentState = readWordWrapState(model, textResourceConfigurationService, codeEditorService);
            // Compute the new state
            const newState = toggleWordWrap(editor, currentState);
            // Write the new state
            // (this will cause an event and the controller will apply the state)
            writeTransientState(model, newState.transientState, codeEditorService);
        }
    }
    let ToggleWordWrapController = class ToggleWordWrapController extends lifecycle_1.Disposable {
        constructor(editor, contextKeyService, configurationService, codeEditorService) {
            super();
            this.editor = editor;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.codeEditorService = codeEditorService;
            const configuration = this.editor.getConfiguration();
            const isWordWrapMinified = this.contextKeyService.createKey(isWordWrapMinifiedKey, this._isWordWrapMinified(configuration));
            const isDominatedByLongLines = this.contextKeyService.createKey(isDominatedByLongLinesKey, this._isDominatedByLongLines(configuration));
            const inDiffEditor = this.contextKeyService.createKey(inDiffEditorKey, this._inDiffEditor(configuration));
            let currentlyApplyingEditorConfig = false;
            this._register(editor.onDidChangeConfiguration((e) => {
                if (!e.wrappingInfo) {
                    return;
                }
                const configuration = this.editor.getConfiguration();
                isWordWrapMinified.set(this._isWordWrapMinified(configuration));
                isDominatedByLongLines.set(this._isDominatedByLongLines(configuration));
                inDiffEditor.set(this._inDiffEditor(configuration));
                if (!currentlyApplyingEditorConfig) {
                    // I am not the cause of the word wrap getting changed
                    ensureWordWrapSettings();
                }
            }));
            this._register(editor.onDidChangeModel((e) => {
                ensureWordWrapSettings();
            }));
            this._register(codeEditorService.onDidChangeTransientModelProperty(() => {
                ensureWordWrapSettings();
            }));
            const ensureWordWrapSettings = () => {
                if (this.editor.getContribution(preferencesEditor_1.DefaultSettingsEditorContribution.ID)) {
                    // in the settings editor...
                    return;
                }
                // Ensure correct word wrap settings
                const newModel = this.editor.getModel();
                if (!newModel) {
                    return;
                }
                const configuration = this.editor.getConfiguration();
                if (this._inDiffEditor(configuration)) {
                    return;
                }
                if (!canToggleWordWrap(newModel.uri)) {
                    return;
                }
                // Read current configured values and toggle state
                const desiredState = readWordWrapState(newModel, this.configurationService, this.codeEditorService);
                // Apply the state
                try {
                    currentlyApplyingEditorConfig = true;
                    this._applyWordWrapState(desiredState);
                }
                finally {
                    currentlyApplyingEditorConfig = false;
                }
            };
        }
        _applyWordWrapState(state) {
            if (state.transientState) {
                // toggle is on
                this.editor.updateOptions({
                    wordWrap: state.transientState.forceWordWrap,
                    wordWrapMinified: state.transientState.forceWordWrapMinified
                });
                return;
            }
            // toggle is off
            this.editor.updateOptions({
                wordWrap: state.configuredWordWrap,
                wordWrapMinified: state.configuredWordWrapMinified
            });
        }
        _isWordWrapMinified(config) {
            return config.wrappingInfo.isWordWrapMinified;
        }
        _isDominatedByLongLines(config) {
            return config.wrappingInfo.isDominatedByLongLines;
        }
        _inDiffEditor(config) {
            return config.wrappingInfo.inDiffEditor;
        }
        getId() {
            return ToggleWordWrapController._ID;
        }
    };
    ToggleWordWrapController._ID = 'editor.contrib.toggleWordWrapController';
    ToggleWordWrapController = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, resourceConfiguration_1.ITextResourceConfigurationService),
        __param(3, codeEditorService_1.ICodeEditorService)
    ], ToggleWordWrapController);
    function canToggleWordWrap(uri) {
        if (!uri) {
            return false;
        }
        return (uri.scheme !== 'output');
    }
    editorExtensions_1.registerEditorContribution(ToggleWordWrapController);
    editorExtensions_1.registerEditorAction(ToggleWordWrapAction);
    actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
        command: {
            id: TOGGLE_WORD_WRAP_ID,
            title: nls.localize('unwrapMinified', "Disable wrapping for this file"),
            iconLocation: {
                dark: uri_1.URI.parse(require.toUrl('vs/workbench/contrib/codeEditor/browser/word-wrap-dark.svg')),
                light: uri_1.URI.parse(require.toUrl('vs/workbench/contrib/codeEditor/browser/word-wrap-light.svg'))
            }
        },
        group: 'navigation',
        order: 1,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not(inDiffEditorKey), contextkey_1.ContextKeyExpr.has(isDominatedByLongLinesKey), contextkey_1.ContextKeyExpr.has(isWordWrapMinifiedKey))
    });
    actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
        command: {
            id: TOGGLE_WORD_WRAP_ID,
            title: nls.localize('wrapMinified', "Enable wrapping for this file"),
            iconLocation: {
                dark: uri_1.URI.parse(require.toUrl('vs/workbench/contrib/codeEditor/browser/word-wrap-dark.svg')),
                light: uri_1.URI.parse(require.toUrl('vs/workbench/contrib/codeEditor/browser/word-wrap-light.svg'))
            }
        },
        group: 'navigation',
        order: 1,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not(inDiffEditorKey), contextkey_1.ContextKeyExpr.has(isDominatedByLongLinesKey), contextkey_1.ContextKeyExpr.not(isWordWrapMinifiedKey))
    });
    // View menu
    actions_1.MenuRegistry.appendMenuItem(26 /* MenubarViewMenu */, {
        group: '5_editor',
        command: {
            id: TOGGLE_WORD_WRAP_ID,
            title: nls.localize({ key: 'miToggleWordWrap', comment: ['&& denotes a mnemonic'] }, "Toggle &&Word Wrap")
        },
        order: 1
    });
});
//# sourceMappingURL=toggleWordWrap.js.map