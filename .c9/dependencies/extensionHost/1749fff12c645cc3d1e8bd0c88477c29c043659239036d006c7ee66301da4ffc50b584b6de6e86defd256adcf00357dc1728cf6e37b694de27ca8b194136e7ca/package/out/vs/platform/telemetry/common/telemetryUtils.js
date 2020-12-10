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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/base/common/objects", "vs/base/common/types"], function (require, exports, configuration_1, log_1, objects_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullTelemetryService = new class {
        publicLog(eventName, data) {
            return Promise.resolve(undefined);
        }
        publicLog2(eventName, data) {
            return this.publicLog(eventName, data);
        }
        setEnabled() { }
        getTelemetryInfo() {
            return Promise.resolve({
                instanceId: 'someValue.instanceId',
                sessionId: 'someValue.sessionId',
                machineId: 'someValue.machineId'
            });
        }
    };
    function combinedAppender(...appenders) {
        return {
            log: (e, d) => appenders.forEach(a => a.log(e, d)),
            flush: () => Promise.all(appenders.map(a => a.flush()))
        };
    }
    exports.combinedAppender = combinedAppender;
    exports.NullAppender = { log: () => null, flush: () => Promise.resolve(null) };
    let LogAppender = class LogAppender {
        constructor(_logService) {
            this._logService = _logService;
            this.commonPropertiesRegex = /^sessionID$|^version$|^timestamp$|^commitHash$|^common\./;
        }
        flush() {
            return Promise.resolve(undefined);
        }
        log(eventName, data) {
            const strippedData = {};
            Object.keys(data).forEach(key => {
                if (!this.commonPropertiesRegex.test(key)) {
                    strippedData[key] = data[key];
                }
            });
            this._logService.trace(`telemetry/${eventName}`, strippedData);
        }
    };
    LogAppender = __decorate([
        __param(0, log_1.ILogService)
    ], LogAppender);
    exports.LogAppender = LogAppender;
    /**
     * Only add settings that cannot contain any personal/private information of users (PII).
     */
    const configurationValueWhitelist = [
        'editor.fontFamily',
        'editor.fontWeight',
        'editor.fontSize',
        'editor.lineHeight',
        'editor.letterSpacing',
        'editor.lineNumbers',
        'editor.rulers',
        'editor.wordSeparators',
        'editor.tabSize',
        'editor.indentSize',
        'editor.insertSpaces',
        'editor.detectIndentation',
        'editor.roundedSelection',
        'editor.scrollBeyondLastLine',
        'editor.minimap.enabled',
        'editor.minimap.side',
        'editor.minimap.renderCharacters',
        'editor.minimap.maxColumn',
        'editor.find.seedSearchStringFromSelection',
        'editor.find.autoFindInSelection',
        'editor.wordWrap',
        'editor.wordWrapColumn',
        'editor.wrappingIndent',
        'editor.mouseWheelScrollSensitivity',
        'editor.multiCursorModifier',
        'editor.quickSuggestions',
        'editor.quickSuggestionsDelay',
        'editor.parameterHints.enabled',
        'editor.parameterHints.cycle',
        'editor.autoClosingBrackets',
        'editor.autoClosingQuotes',
        'editor.autoSurround',
        'editor.autoIndent',
        'editor.formatOnType',
        'editor.formatOnPaste',
        'editor.suggestOnTriggerCharacters',
        'editor.acceptSuggestionOnEnter',
        'editor.acceptSuggestionOnCommitCharacter',
        'editor.snippetSuggestions',
        'editor.emptySelectionClipboard',
        'editor.wordBasedSuggestions',
        'editor.suggestSelection',
        'editor.suggestFontSize',
        'editor.suggestLineHeight',
        'editor.tabCompletion',
        'editor.selectionHighlight',
        'editor.occurrencesHighlight',
        'editor.overviewRulerLanes',
        'editor.overviewRulerBorder',
        'editor.cursorBlinking',
        'editor.cursorSmoothCaretAnimation',
        'editor.cursorStyle',
        'editor.mouseWheelZoom',
        'editor.fontLigatures',
        'editor.hideCursorInOverviewRuler',
        'editor.renderWhitespace',
        'editor.renderControlCharacters',
        'editor.renderIndentGuides',
        'editor.renderLineHighlight',
        'editor.codeLens',
        'editor.folding',
        'editor.showFoldingControls',
        'editor.matchBrackets',
        'editor.glyphMargin',
        'editor.useTabStops',
        'editor.trimAutoWhitespace',
        'editor.stablePeek',
        'editor.dragAndDrop',
        'editor.formatOnSave',
        'editor.colorDecorators',
        'breadcrumbs.enabled',
        'breadcrumbs.filePath',
        'breadcrumbs.symbolPath',
        'breadcrumbs.symbolSortOrder',
        'breadcrumbs.useQuickPick',
        'explorer.openEditors.visible',
        'extensions.autoUpdate',
        'files.associations',
        'files.autoGuessEncoding',
        'files.autoSave',
        'files.autoSaveDelay',
        'files.encoding',
        'files.eol',
        'files.hotExit',
        'files.trimTrailingWhitespace',
        'git.confirmSync',
        'git.enabled',
        'http.proxyStrictSSL',
        'javascript.validate.enable',
        'php.builtInCompletions.enable',
        'php.validate.enable',
        'php.validate.run',
        'terminal.integrated.fontFamily',
        'window.openFilesInNewWindow',
        'window.restoreWindows',
        'window.nativeFullScreen',
        'window.zoomLevel',
        'workbench.editor.enablePreview',
        'workbench.editor.enablePreviewFromQuickOpen',
        'workbench.editor.showTabs',
        'workbench.editor.highlightModifiedTabs',
        'workbench.sideBar.location',
        'workbench.startupEditor',
        'workbench.statusBar.visible',
        'workbench.welcome.enabled',
    ];
    function configurationTelemetry(telemetryService, configurationService) {
        return configurationService.onDidChangeConfiguration(event => {
            if (event.source !== 6 /* DEFAULT */) {
                telemetryService.publicLog2('updateConfiguration', {
                    configurationSource: configuration_1.ConfigurationTargetToString(event.source),
                    configurationKeys: flattenKeys(event.sourceConfig)
                });
                telemetryService.publicLog2('updateConfigurationValues', {
                    configurationSource: configuration_1.ConfigurationTargetToString(event.source),
                    configurationValues: flattenValues(event.sourceConfig, configurationValueWhitelist)
                });
            }
        });
    }
    exports.configurationTelemetry = configurationTelemetry;
    function keybindingsTelemetry(telemetryService, keybindingService) {
        return keybindingService.onDidUpdateKeybindings(event => {
            if (event.source === 2 /* User */ && event.keybindings) {
                telemetryService.publicLog2('updateKeybindings', {
                    bindings: event.keybindings.map(binding => ({
                        key: binding.key,
                        command: binding.command,
                        when: binding.when,
                        args: binding.args ? true : undefined
                    }))
                });
            }
        });
    }
    exports.keybindingsTelemetry = keybindingsTelemetry;
    function validateTelemetryData(data) {
        const properties = Object.create(null);
        const measurements = Object.create(null);
        const flat = Object.create(null);
        flatten(data, flat);
        for (let prop in flat) {
            // enforce property names less than 150 char, take the last 150 char
            prop = prop.length > 150 ? prop.substr(prop.length - 149) : prop;
            const value = flat[prop];
            if (typeof value === 'number') {
                measurements[prop] = value;
            }
            else if (typeof value === 'boolean') {
                measurements[prop] = value ? 1 : 0;
            }
            else if (typeof value === 'string') {
                //enforce property value to be less than 1024 char, take the first 1024 char
                properties[prop] = value.substring(0, 1023);
            }
            else if (typeof value !== 'undefined' && value !== null) {
                properties[prop] = value;
            }
        }
        return {
            properties,
            measurements
        };
    }
    exports.validateTelemetryData = validateTelemetryData;
    function cleanRemoteAuthority(remoteAuthority) {
        if (!remoteAuthority) {
            return 'none';
        }
        let ret = 'other';
        // Whitelisted remote authorities
        ['ssh-remote', 'dev-container', 'attached-container', 'wsl'].forEach((res) => {
            if (remoteAuthority.indexOf(`${res}+`) === 0) {
                ret = res;
            }
        });
        return ret;
    }
    exports.cleanRemoteAuthority = cleanRemoteAuthority;
    function flatten(obj, result, order = 0, prefix) {
        if (!obj) {
            return;
        }
        for (let item of Object.getOwnPropertyNames(obj)) {
            const value = obj[item];
            const index = prefix ? prefix + item : item;
            if (Array.isArray(value)) {
                result[index] = objects_1.safeStringify(value);
            }
            else if (value instanceof Date) {
                // TODO unsure why this is here and not in _getData
                result[index] = value.toISOString();
            }
            else if (types_1.isObject(value)) {
                if (order < 2) {
                    flatten(value, result, order + 1, index + '.');
                }
                else {
                    result[index] = objects_1.safeStringify(value);
                }
            }
            else {
                result[index] = value;
            }
        }
    }
    function flattenKeys(value) {
        if (!value) {
            return [];
        }
        const result = [];
        flatKeys(result, '', value);
        return result;
    }
    function flatKeys(result, prefix, value) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.keys(value)
                .forEach(key => flatKeys(result, prefix ? `${prefix}.${key}` : key, value[key]));
        }
        else {
            result.push(prefix);
        }
    }
    function flattenValues(value, keys) {
        if (!value) {
            return [];
        }
        return keys.reduce((array, key) => {
            const v = key.split('.')
                .reduce((tmp, k) => tmp && typeof tmp === 'object' ? tmp[k] : undefined, value);
            if (typeof v !== 'undefined') {
                array.push({ [key]: v });
            }
            return array;
        }, []);
    }
});
//# sourceMappingURL=telemetryUtils.js.map