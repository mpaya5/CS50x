/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InputFocusedContextKey = 'inputFocus';
    exports.InputFocusedContext = new contextkey_1.RawContextKey(exports.InputFocusedContextKey, false);
    exports.FalseContext = new contextkey_1.RawContextKey('__false', false);
});
//# sourceMappingURL=contextkeys.js.map