/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/editor/browser/editorExtensions", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/webview/electron-browser/webviewElement"], function (require, exports, actions_1, nls, editorExtensions_1, editorService_1, webviewElement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class OpenWebviewDeveloperToolsAction extends actions_1.Action {
        constructor(id, label) {
            super(id, label);
        }
        run() {
            const elements = document.querySelectorAll('webview.ready');
            for (let i = 0; i < elements.length; i++) {
                try {
                    elements.item(i).openDevTools();
                }
                catch (e) {
                    console.error(e);
                }
            }
            return Promise.resolve(true);
        }
    }
    OpenWebviewDeveloperToolsAction.ID = 'workbench.action.webview.openDeveloperTools';
    OpenWebviewDeveloperToolsAction.ALIAS = 'Open Webview Developer Tools';
    OpenWebviewDeveloperToolsAction.LABEL = nls.localize('openToolsLabel', "Open Webview Developer Tools");
    exports.OpenWebviewDeveloperToolsAction = OpenWebviewDeveloperToolsAction;
    class SelectAllWebviewEditorCommand extends editorExtensions_1.Command {
        runCommand(accessor, args) {
            withActiveWebviewBasedWebview(accessor, webview => webview.selectAll());
        }
    }
    SelectAllWebviewEditorCommand.ID = 'editor.action.webvieweditor.selectAll';
    exports.SelectAllWebviewEditorCommand = SelectAllWebviewEditorCommand;
    class CopyWebviewEditorCommand extends editorExtensions_1.Command {
        runCommand(accessor, _args) {
            withActiveWebviewBasedWebview(accessor, webview => webview.copy());
        }
    }
    CopyWebviewEditorCommand.ID = 'editor.action.webvieweditor.copy';
    exports.CopyWebviewEditorCommand = CopyWebviewEditorCommand;
    class PasteWebviewEditorCommand extends editorExtensions_1.Command {
        runCommand(accessor, _args) {
            withActiveWebviewBasedWebview(accessor, webview => webview.paste());
        }
    }
    PasteWebviewEditorCommand.ID = 'editor.action.webvieweditor.paste';
    exports.PasteWebviewEditorCommand = PasteWebviewEditorCommand;
    class CutWebviewEditorCommand extends editorExtensions_1.Command {
        runCommand(accessor, _args) {
            withActiveWebviewBasedWebview(accessor, webview => webview.cut());
        }
    }
    CutWebviewEditorCommand.ID = 'editor.action.webvieweditor.cut';
    exports.CutWebviewEditorCommand = CutWebviewEditorCommand;
    class UndoWebviewEditorCommand extends editorExtensions_1.Command {
        runCommand(accessor, args) {
            withActiveWebviewBasedWebview(accessor, webview => webview.undo());
        }
    }
    UndoWebviewEditorCommand.ID = 'editor.action.webvieweditor.undo';
    exports.UndoWebviewEditorCommand = UndoWebviewEditorCommand;
    class RedoWebviewEditorCommand extends editorExtensions_1.Command {
        runCommand(accessor, args) {
            withActiveWebviewBasedWebview(accessor, webview => webview.redo());
        }
    }
    RedoWebviewEditorCommand.ID = 'editor.action.webvieweditor.redo';
    exports.RedoWebviewEditorCommand = RedoWebviewEditorCommand;
    function getActiveWebviewEditor(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const activeControl = editorService.activeControl;
        return activeControl.isWebviewEditor ? activeControl : undefined;
    }
    function withActiveWebviewBasedWebview(accessor, f) {
        const webViewEditor = getActiveWebviewEditor(accessor);
        if (webViewEditor) {
            webViewEditor.withWebview(webview => {
                if (webview instanceof webviewElement_1.ElectronWebviewBasedWebview) {
                    f(webview);
                }
                else if (webview.getInnerWebview) {
                    const innerWebview = webview.getInnerWebview();
                    if (innerWebview instanceof webviewElement_1.ElectronWebviewBasedWebview) {
                        f(innerWebview);
                    }
                }
            });
        }
    }
});
//# sourceMappingURL=webviewCommands.js.map