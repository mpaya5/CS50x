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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/marked/marked", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/common/modes", "vs/editor/common/modes/supports/tokenization", "vs/editor/common/modes/textToHtmlTokenizer", "vs/editor/common/services/modeService", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/platform/request/common/request", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/node/telemetryNodeUtils", "vs/workbench/contrib/webview/browser/webviewEditorService", "vs/workbench/services/editor/common/editorService", "vs/base/common/keybindingParser", "vs/base/common/cancellation", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/uuid"], function (require, exports, errors_1, marked, platform_1, uri_1, modes_1, tokenization_1, textToHtmlTokenizer_1, modeService_1, nls, environment_1, keybinding_1, opener_1, request_1, telemetry_1, telemetryNodeUtils_1, webviewEditorService_1, editorService_1, keybindingParser_1, cancellation_1, extensions_1, editorGroupsService_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ReleaseNotesManager = class ReleaseNotesManager {
        constructor(_environmentService, _keybindingService, _modeService, _openerService, _requestService, _telemetryService, _editorService, _editorGroupService, _webviewEditorService, _extensionService) {
            this._environmentService = _environmentService;
            this._keybindingService = _keybindingService;
            this._modeService = _modeService;
            this._openerService = _openerService;
            this._requestService = _requestService;
            this._telemetryService = _telemetryService;
            this._editorService = _editorService;
            this._editorGroupService = _editorGroupService;
            this._webviewEditorService = _webviewEditorService;
            this._extensionService = _extensionService;
            this._releaseNotesCache = new Map();
            this._currentReleaseNotes = undefined;
            modes_1.TokenizationRegistry.onDidChange(() => __awaiter(this, void 0, void 0, function* () {
                if (!this._currentReleaseNotes || !this._lastText) {
                    return;
                }
                const html = yield this.renderBody(this._lastText);
                if (this._currentReleaseNotes) {
                    this._currentReleaseNotes.webview.html = html;
                }
            }));
        }
        show(accessor, version) {
            return __awaiter(this, void 0, void 0, function* () {
                const releaseNoteText = yield this.loadReleaseNotes(version);
                this._lastText = releaseNoteText;
                const html = yield this.renderBody(releaseNoteText);
                const title = nls.localize('releaseNotesInputName', "Release Notes: {0}", version);
                const activeControl = this._editorService.activeControl;
                if (this._currentReleaseNotes) {
                    this._currentReleaseNotes.setName(title);
                    this._currentReleaseNotes.webview.html = html;
                    this._webviewEditorService.revealWebview(this._currentReleaseNotes, activeControl ? activeControl.group : this._editorGroupService.activeGroup, false);
                }
                else {
                    this._currentReleaseNotes = this._webviewEditorService.createWebview(uuid_1.generateUuid(), 'releaseNotes', title, { group: editorService_1.ACTIVE_GROUP, preserveFocus: false }, {
                        tryRestoreScrollPosition: true,
                        enableFindWidget: true,
                        localResourceRoots: [
                            uri_1.URI.parse(require.toUrl('./media'))
                        ]
                    }, undefined);
                    this._currentReleaseNotes.webview.onDidClickLink(uri => this.onDidClickLink(uri));
                    this._currentReleaseNotes.onDispose(() => { this._currentReleaseNotes = undefined; });
                    const iconPath = uri_1.URI.parse(require.toUrl('./media/code-icon.svg'));
                    this._currentReleaseNotes.iconPath = {
                        light: iconPath,
                        dark: iconPath
                    };
                    this._currentReleaseNotes.webview.html = html;
                }
                return true;
            });
        }
        loadReleaseNotes(version) {
            const match = /^(\d+\.\d+)\./.exec(version);
            if (!match) {
                return Promise.reject(new Error('not found'));
            }
            const versionLabel = match[1].replace(/\./g, '_');
            const baseUrl = 'https://code.visualstudio.com/raw';
            const url = `${baseUrl}/v${versionLabel}.md`;
            const unassigned = nls.localize('unassigned', "unassigned");
            const patchKeybindings = (text) => {
                const kb = (match, kb) => {
                    const keybinding = this._keybindingService.lookupKeybinding(kb);
                    if (!keybinding) {
                        return unassigned;
                    }
                    return keybinding.getLabel() || unassigned;
                };
                const kbstyle = (match, kb) => {
                    const keybinding = keybindingParser_1.KeybindingParser.parseKeybinding(kb, platform_1.OS);
                    if (!keybinding) {
                        return unassigned;
                    }
                    const resolvedKeybindings = this._keybindingService.resolveKeybinding(keybinding);
                    if (resolvedKeybindings.length === 0) {
                        return unassigned;
                    }
                    return resolvedKeybindings[0].getLabel() || unassigned;
                };
                return text
                    .replace(/kb\(([a-z.\d\-]+)\)/gi, kb)
                    .replace(/kbstyle\(([^\)]+)\)/gi, kbstyle);
            };
            if (!this._releaseNotesCache.has(version)) {
                this._releaseNotesCache.set(version, this._requestService.request({ url }, cancellation_1.CancellationToken.None)
                    .then(request_1.asText)
                    .then(text => {
                    if (!text || !/^#\s/.test(text)) { // release notes always starts with `#` followed by whitespace
                        return Promise.reject(new Error('Invalid release notes'));
                    }
                    return Promise.resolve(text);
                })
                    .then(text => patchKeybindings(text)));
            }
            return this._releaseNotesCache.get(version);
        }
        onDidClickLink(uri) {
            telemetryNodeUtils_1.addGAParameters(this._telemetryService, this._environmentService, uri, 'ReleaseNotes')
                .then(updated => this._openerService.open(updated))
                .then(undefined, errors_1.onUnexpectedError);
        }
        renderBody(text) {
            return __awaiter(this, void 0, void 0, function* () {
                const content = yield this.renderContent(text);
                const colorMap = modes_1.TokenizationRegistry.getColorMap();
                const css = colorMap ? tokenization_1.generateTokensCSSForColorMap(colorMap) : '';
                const styleSheetPath = require.toUrl('./media/markdown.css').replace('file://', 'vscode-resource://');
                return `<!DOCTYPE html>
		<html>
			<head>
				<base href="https://code.visualstudio.com/raw/">
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; media-src https:; script-src 'none'; style-src vscode-resource: https: 'unsafe-inline'; child-src 'none'; frame-src 'none';">
				<link rel="stylesheet" type="text/css" href="${styleSheetPath}">
				<style>${css}</style>
			</head>
			<body>${content}</body>
		</html>`;
            });
        }
        renderContent(text) {
            return __awaiter(this, void 0, void 0, function* () {
                const renderer = yield this.getRenderer(text);
                return marked(text, { renderer });
            });
        }
        getRenderer(text) {
            return __awaiter(this, void 0, void 0, function* () {
                let result = [];
                const renderer = new marked.Renderer();
                renderer.code = (_code, lang) => {
                    const modeId = this._modeService.getModeIdForLanguageName(lang);
                    if (modeId) {
                        result.push(this._extensionService.whenInstalledExtensionsRegistered().then(() => {
                            this._modeService.triggerMode(modeId);
                            return modes_1.TokenizationRegistry.getPromise(modeId);
                        }));
                    }
                    return '';
                };
                marked(text, { renderer });
                yield Promise.all(result);
                renderer.code = (code, lang) => {
                    const modeId = this._modeService.getModeIdForLanguageName(lang);
                    return `<code>${textToHtmlTokenizer_1.tokenizeToString(code, modeId ? modes_1.TokenizationRegistry.get(modeId) : undefined)}</code>`;
                };
                return renderer;
            });
        }
    };
    ReleaseNotesManager = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, keybinding_1.IKeybindingService),
        __param(2, modeService_1.IModeService),
        __param(3, opener_1.IOpenerService),
        __param(4, request_1.IRequestService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, editorService_1.IEditorService),
        __param(7, editorGroupsService_1.IEditorGroupsService),
        __param(8, webviewEditorService_1.IWebviewEditorService),
        __param(9, extensions_1.IExtensionService)
    ], ReleaseNotesManager);
    exports.ReleaseNotesManager = ReleaseNotesManager;
});
//# sourceMappingURL=releaseNotesEditor.js.map