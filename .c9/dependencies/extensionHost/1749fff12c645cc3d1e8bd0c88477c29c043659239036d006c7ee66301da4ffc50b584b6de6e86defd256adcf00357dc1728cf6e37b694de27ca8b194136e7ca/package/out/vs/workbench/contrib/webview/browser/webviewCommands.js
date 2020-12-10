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
define(["require", "exports", "vs/base/common/actions", "vs/editor/browser/editorExtensions", "vs/nls", "vs/workbench/services/editor/common/editorService"], function (require, exports, actions_1, editorExtensions_1, nls, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ShowWebViewEditorFindWidgetCommand extends editorExtensions_1.Command {
        runCommand(accessor, args) {
            const webViewEditor = getActiveWebviewEditor(accessor);
            if (webViewEditor) {
                webViewEditor.showFind();
            }
        }
    }
    ShowWebViewEditorFindWidgetCommand.ID = 'editor.action.webvieweditor.showFind';
    exports.ShowWebViewEditorFindWidgetCommand = ShowWebViewEditorFindWidgetCommand;
    class HideWebViewEditorFindCommand extends editorExtensions_1.Command {
        runCommand(accessor, args) {
            const webViewEditor = getActiveWebviewEditor(accessor);
            if (webViewEditor) {
                webViewEditor.hideFind();
            }
        }
    }
    HideWebViewEditorFindCommand.ID = 'editor.action.webvieweditor.hideFind';
    exports.HideWebViewEditorFindCommand = HideWebViewEditorFindCommand;
    class WebViewEditorFindNextCommand extends editorExtensions_1.Command {
        runCommand(accessor, args) {
            const webViewEditor = getActiveWebviewEditor(accessor);
            if (webViewEditor) {
                webViewEditor.find(false);
            }
        }
    }
    WebViewEditorFindNextCommand.ID = 'editor.action.webvieweditor.findNext';
    exports.WebViewEditorFindNextCommand = WebViewEditorFindNextCommand;
    class WebViewEditorFindPreviousCommand extends editorExtensions_1.Command {
        runCommand(accessor, args) {
            const webViewEditor = getActiveWebviewEditor(accessor);
            if (webViewEditor) {
                webViewEditor.find(true);
            }
        }
    }
    WebViewEditorFindPreviousCommand.ID = 'editor.action.webvieweditor.findPrevious';
    exports.WebViewEditorFindPreviousCommand = WebViewEditorFindPreviousCommand;
    let ReloadWebviewAction = class ReloadWebviewAction extends actions_1.Action {
        constructor(id, label, editorService) {
            super(id, label);
            this.editorService = editorService;
        }
        run() {
            for (const webview of this.getVisibleWebviews()) {
                webview.reload();
            }
            return Promise.resolve(true);
        }
        getVisibleWebviews() {
            return this.editorService.visibleControls
                .filter(control => control && control.isWebviewEditor)
                .map(control => control);
        }
    };
    ReloadWebviewAction.ID = 'workbench.action.webview.reloadWebviewAction';
    ReloadWebviewAction.LABEL = nls.localize('refreshWebviewLabel', "Reload Webviews");
    ReloadWebviewAction = __decorate([
        __param(2, editorService_1.IEditorService)
    ], ReloadWebviewAction);
    exports.ReloadWebviewAction = ReloadWebviewAction;
    function getActiveWebviewEditor(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const activeControl = editorService.activeControl;
        return activeControl.isWebviewEditor ? activeControl : null;
    }
});
//# sourceMappingURL=webviewCommands.js.map