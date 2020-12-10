/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/contrib/terminal/common/terminal"], function (require, exports, keybindingsRegistry_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TERMINAL_COMMAND_ID;
    (function (TERMINAL_COMMAND_ID) {
        TERMINAL_COMMAND_ID["FIND_NEXT"] = "workbench.action.terminal.findNext";
        TERMINAL_COMMAND_ID["FIND_NEXT_TERMINAL_FOCUS"] = "workbench.action.terminal.findNextTerminalFocus";
        TERMINAL_COMMAND_ID["FIND_PREVIOUS"] = "workbench.action.terminal.findPrevious";
        TERMINAL_COMMAND_ID["FIND_PREVIOUS_TERMINAL_FOCUS"] = "workbench.action.terminal.findPreviousTerminalFocus";
        TERMINAL_COMMAND_ID["TOGGLE"] = "workbench.action.terminal.toggleTerminal";
        TERMINAL_COMMAND_ID["KILL"] = "workbench.action.terminal.kill";
        TERMINAL_COMMAND_ID["QUICK_KILL"] = "workbench.action.terminal.quickKill";
        TERMINAL_COMMAND_ID["COPY_SELECTION"] = "workbench.action.terminal.copySelection";
        TERMINAL_COMMAND_ID["SELECT_ALL"] = "workbench.action.terminal.selectAll";
        TERMINAL_COMMAND_ID["DELETE_WORD_LEFT"] = "workbench.action.terminal.deleteWordLeft";
        TERMINAL_COMMAND_ID["DELETE_WORD_RIGHT"] = "workbench.action.terminal.deleteWordRight";
        TERMINAL_COMMAND_ID["DELETE_TO_LINE_START"] = "workbench.action.terminal.deleteToLineStart";
        TERMINAL_COMMAND_ID["MOVE_TO_LINE_START"] = "workbench.action.terminal.moveToLineStart";
        TERMINAL_COMMAND_ID["MOVE_TO_LINE_END"] = "workbench.action.terminal.moveToLineEnd";
        TERMINAL_COMMAND_ID["NEW"] = "workbench.action.terminal.new";
        TERMINAL_COMMAND_ID["NEW_LOCAL"] = "workbench.action.terminal.newLocal";
        TERMINAL_COMMAND_ID["NEW_IN_ACTIVE_WORKSPACE"] = "workbench.action.terminal.newInActiveWorkspace";
        TERMINAL_COMMAND_ID["SPLIT"] = "workbench.action.terminal.split";
        TERMINAL_COMMAND_ID["SPLIT_IN_ACTIVE_WORKSPACE"] = "workbench.action.terminal.splitInActiveWorkspace";
        TERMINAL_COMMAND_ID["FOCUS_PREVIOUS_PANE"] = "workbench.action.terminal.focusPreviousPane";
        TERMINAL_COMMAND_ID["FOCUS_NEXT_PANE"] = "workbench.action.terminal.focusNextPane";
        TERMINAL_COMMAND_ID["RESIZE_PANE_LEFT"] = "workbench.action.terminal.resizePaneLeft";
        TERMINAL_COMMAND_ID["RESIZE_PANE_RIGHT"] = "workbench.action.terminal.resizePaneRight";
        TERMINAL_COMMAND_ID["RESIZE_PANE_UP"] = "workbench.action.terminal.resizePaneUp";
        TERMINAL_COMMAND_ID["RESIZE_PANE_DOWN"] = "workbench.action.terminal.resizePaneDown";
        TERMINAL_COMMAND_ID["FOCUS"] = "workbench.action.terminal.focus";
        TERMINAL_COMMAND_ID["FOCUS_NEXT"] = "workbench.action.terminal.focusNext";
        TERMINAL_COMMAND_ID["FOCUS_PREVIOUS"] = "workbench.action.terminal.focusPrevious";
        TERMINAL_COMMAND_ID["PASTE"] = "workbench.action.terminal.paste";
        TERMINAL_COMMAND_ID["SELECT_DEFAULT_SHELL"] = "workbench.action.terminal.selectDefaultShell";
        TERMINAL_COMMAND_ID["RUN_SELECTED_TEXT"] = "workbench.action.terminal.runSelectedText";
        TERMINAL_COMMAND_ID["RUN_ACTIVE_FILE"] = "workbench.action.terminal.runActiveFile";
        TERMINAL_COMMAND_ID["SWITCH_TERMINAL"] = "workbench.action.terminal.switchTerminal";
        TERMINAL_COMMAND_ID["SCROLL_DOWN_LINE"] = "workbench.action.terminal.scrollDown";
        TERMINAL_COMMAND_ID["SCROLL_DOWN_PAGE"] = "workbench.action.terminal.scrollDownPage";
        TERMINAL_COMMAND_ID["SCROLL_TO_BOTTOM"] = "workbench.action.terminal.scrollToBottom";
        TERMINAL_COMMAND_ID["SCROLL_UP_LINE"] = "workbench.action.terminal.scrollUp";
        TERMINAL_COMMAND_ID["SCROLL_UP_PAGE"] = "workbench.action.terminal.scrollUpPage";
        TERMINAL_COMMAND_ID["SCROLL_TO_TOP"] = "workbench.action.terminal.scrollToTop";
        TERMINAL_COMMAND_ID["CLEAR"] = "workbench.action.terminal.clear";
        TERMINAL_COMMAND_ID["CLEAR_SELECTION"] = "workbench.action.terminal.clearSelection";
        TERMINAL_COMMAND_ID["MANAGE_WORKSPACE_SHELL_PERMISSIONS"] = "workbench.action.terminal.manageWorkspaceShellPermissions";
        TERMINAL_COMMAND_ID["RENAME"] = "workbench.action.terminal.rename";
        TERMINAL_COMMAND_ID["FIND_WIDGET_FOCUS"] = "workbench.action.terminal.focusFindWidget";
        TERMINAL_COMMAND_ID["FIND_WIDGET_HIDE"] = "workbench.action.terminal.hideFindWidget";
        TERMINAL_COMMAND_ID["QUICK_OPEN_TERM"] = "workbench.action.quickOpenTerm";
        TERMINAL_COMMAND_ID["SCROLL_TO_PREVIOUS_COMMAND"] = "workbench.action.terminal.scrollToPreviousCommand";
        TERMINAL_COMMAND_ID["SCROLL_TO_NEXT_COMMAND"] = "workbench.action.terminal.scrollToNextCommand";
        TERMINAL_COMMAND_ID["SELECT_TO_PREVIOUS_COMMAND"] = "workbench.action.terminal.selectToPreviousCommand";
        TERMINAL_COMMAND_ID["SELECT_TO_NEXT_COMMAND"] = "workbench.action.terminal.selectToNextCommand";
        TERMINAL_COMMAND_ID["SELECT_TO_PREVIOUS_LINE"] = "workbench.action.terminal.selectToPreviousLine";
        TERMINAL_COMMAND_ID["SELECT_TO_NEXT_LINE"] = "workbench.action.terminal.selectToNextLine";
        TERMINAL_COMMAND_ID["TOGGLE_ESCAPE_SEQUENCE_LOGGING"] = "toggleEscapeSequenceLogging";
        TERMINAL_COMMAND_ID["SEND_SEQUENCE"] = "workbench.action.terminal.sendSequence";
        TERMINAL_COMMAND_ID["TOGGLE_FIND_REGEX"] = "workbench.action.terminal.toggleFindRegex";
        TERMINAL_COMMAND_ID["TOGGLE_FIND_WHOLE_WORD"] = "workbench.action.terminal.toggleFindWholeWord";
        TERMINAL_COMMAND_ID["TOGGLE_FIND_CASE_SENSITIVE"] = "workbench.action.terminal.toggleFindCaseSensitive";
        TERMINAL_COMMAND_ID["TOGGLE_FIND_REGEX_TERMINAL_FOCUS"] = "workbench.action.terminal.toggleFindRegexTerminalFocus";
        TERMINAL_COMMAND_ID["TOGGLE_FIND_WHOLE_WORD_TERMINAL_FOCUS"] = "workbench.action.terminal.toggleFindWholeWordTerminalFocus";
        TERMINAL_COMMAND_ID["TOGGLE_FIND_CASE_SENSITIVE_TERMINAL_FOCUS"] = "workbench.action.terminal.toggleFindCaseSensitiveTerminalFocus";
        TERMINAL_COMMAND_ID["NAVIGATION_MODE_EXIT"] = "workbench.action.terminal.navigationModeExit";
        TERMINAL_COMMAND_ID["NAVIGATION_MODE_FOCUS_NEXT"] = "workbench.action.terminal.navigationModeFocusNext";
        TERMINAL_COMMAND_ID["NAVIGATION_MODE_FOCUS_PREVIOUS"] = "workbench.action.terminal.navigationModeFocusPrevious";
    })(TERMINAL_COMMAND_ID = exports.TERMINAL_COMMAND_ID || (exports.TERMINAL_COMMAND_ID = {}));
    function setupTerminalCommands() {
        registerOpenTerminalAtIndexCommands();
    }
    exports.setupTerminalCommands = setupTerminalCommands;
    function registerOpenTerminalAtIndexCommands() {
        for (let i = 0; i < 9; i++) {
            const terminalIndex = i;
            const visibleIndex = i + 1;
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: `workbench.action.terminal.focusAtIndex${visibleIndex}`,
                weight: 200 /* WorkbenchContrib */,
                when: undefined,
                primary: 0,
                handler: accessor => {
                    const terminalService = accessor.get(terminal_1.ITerminalService);
                    terminalService.setActiveInstanceByIndex(terminalIndex);
                    return terminalService.showPanel(true);
                }
            });
        }
    }
});
//# sourceMappingURL=terminalCommands.js.map