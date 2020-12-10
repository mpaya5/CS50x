/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TERMINAL_PANEL_ID = 'workbench.panel.terminal';
    /** A context key that is set when there is at least one opened integrated terminal. */
    exports.KEYBINDING_CONTEXT_TERMINAL_IS_OPEN = new contextkey_1.RawContextKey('terminalIsOpen', false);
    /** A context key that is set when the integrated terminal has focus. */
    exports.KEYBINDING_CONTEXT_TERMINAL_FOCUS = new contextkey_1.RawContextKey('terminalFocus', false);
    /** A context key that is set when the integrated terminal does not have focus. */
    exports.KEYBINDING_CONTEXT_TERMINAL_NOT_FOCUSED = exports.KEYBINDING_CONTEXT_TERMINAL_FOCUS.toNegated();
    /** A context key that is set when the user is navigating the accessibility tree */
    exports.KEYBINDING_CONTEXT_TERMINAL_A11Y_TREE_FOCUS = new contextkey_1.RawContextKey('terminalA11yTreeFocus', false);
    /** A keybinding context key that is set when the integrated terminal has text selected. */
    exports.KEYBINDING_CONTEXT_TERMINAL_TEXT_SELECTED = new contextkey_1.RawContextKey('terminalTextSelected', false);
    /** A keybinding context key that is set when the integrated terminal does not have text selected. */
    exports.KEYBINDING_CONTEXT_TERMINAL_TEXT_NOT_SELECTED = exports.KEYBINDING_CONTEXT_TERMINAL_TEXT_SELECTED.toNegated();
    /**  A context key that is set when the find widget in integrated terminal is visible. */
    exports.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_VISIBLE = new contextkey_1.RawContextKey('terminalFindWidgetVisible', false);
    /**  A context key that is set when the find widget in integrated terminal is not visible. */
    exports.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_NOT_VISIBLE = exports.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_VISIBLE.toNegated();
    /**  A context key that is set when the find widget find input in integrated terminal is focused. */
    exports.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_INPUT_FOCUSED = new contextkey_1.RawContextKey('terminalFindWidgetInputFocused', false);
    /**  A context key that is set when the find widget in integrated terminal is focused. */
    exports.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_FOCUSED = new contextkey_1.RawContextKey('terminalFindWidgetFocused', false);
    /**  A context key that is set when the find widget find input in integrated terminal is not focused. */
    exports.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_INPUT_NOT_FOCUSED = exports.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_INPUT_FOCUSED.toNegated();
    exports.IS_WORKSPACE_SHELL_ALLOWED_STORAGE_KEY = 'terminal.integrated.isWorkspaceShellAllowed';
    exports.NEVER_MEASURE_RENDER_TIME_STORAGE_KEY = 'terminal.integrated.neverMeasureRenderTime';
    // The creation of extension host terminals is delayed by this value (milliseconds). The purpose of
    // this delay is to allow the terminal instance to initialize correctly and have its ID set before
    // trying to create the corressponding object on the ext host.
    exports.EXT_HOST_CREATION_DELAY = 100;
    exports.ITerminalService = instantiation_1.createDecorator('terminalService');
    exports.ITerminalNativeService = instantiation_1.createDecorator('terminalNativeService');
    exports.TerminalCursorStyle = {
        BLOCK: 'block',
        LINE: 'line',
        UNDERLINE: 'underline'
    };
    exports.TERMINAL_CONFIG_SECTION = 'terminal.integrated';
    exports.TERMINAL_ACTION_CATEGORY = nls.localize('terminalCategory', "Terminal");
    exports.DEFAULT_LETTER_SPACING = 0;
    exports.MINIMUM_LETTER_SPACING = -5;
    exports.DEFAULT_LINE_HEIGHT = 1;
    exports.SHELL_PATH_INVALID_EXIT_CODE = -1;
    exports.SHELL_PATH_DIRECTORY_EXIT_CODE = -2;
    exports.SHELL_CWD_INVALID_EXIT_CODE = -3;
    var Direction;
    (function (Direction) {
        Direction[Direction["Left"] = 0] = "Left";
        Direction[Direction["Right"] = 1] = "Right";
        Direction[Direction["Up"] = 2] = "Up";
        Direction[Direction["Down"] = 3] = "Down";
    })(Direction = exports.Direction || (exports.Direction = {}));
    var ProcessState;
    (function (ProcessState) {
        // The process has not been initialized yet.
        ProcessState[ProcessState["UNINITIALIZED"] = 0] = "UNINITIALIZED";
        // The process is currently launching, the process is marked as launching
        // for a short duration after being created and is helpful to indicate
        // whether the process died as a result of bad shell and args.
        ProcessState[ProcessState["LAUNCHING"] = 1] = "LAUNCHING";
        // The process is running normally.
        ProcessState[ProcessState["RUNNING"] = 2] = "RUNNING";
        // The process was killed during launch, likely as a result of bad shell and
        // args.
        ProcessState[ProcessState["KILLED_DURING_LAUNCH"] = 3] = "KILLED_DURING_LAUNCH";
        // The process was killed by the user (the event originated from VS Code).
        ProcessState[ProcessState["KILLED_BY_USER"] = 4] = "KILLED_BY_USER";
        // The process was killed by itself, for example the shell crashed or `exit`
        // was run.
        ProcessState[ProcessState["KILLED_BY_PROCESS"] = 5] = "KILLED_BY_PROCESS";
    })(ProcessState = exports.ProcessState || (exports.ProcessState = {}));
    var LinuxDistro;
    (function (LinuxDistro) {
        LinuxDistro[LinuxDistro["Fedora"] = 0] = "Fedora";
        LinuxDistro[LinuxDistro["Ubuntu"] = 1] = "Ubuntu";
        LinuxDistro[LinuxDistro["Unknown"] = 2] = "Unknown";
    })(LinuxDistro = exports.LinuxDistro || (exports.LinuxDistro = {}));
    var TitleEventSource;
    (function (TitleEventSource) {
        /** From the API or the rename command that overrides any other type */
        TitleEventSource[TitleEventSource["Api"] = 0] = "Api";
        /** From the process name property*/
        TitleEventSource[TitleEventSource["Process"] = 1] = "Process";
        /** From the VT sequence */
        TitleEventSource[TitleEventSource["Sequence"] = 2] = "Sequence";
    })(TitleEventSource = exports.TitleEventSource || (exports.TitleEventSource = {}));
});
//# sourceMappingURL=terminal.js.map