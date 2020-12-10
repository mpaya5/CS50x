/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/modes/languageFeatureRegistry"], function (require, exports, languageFeatureRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CallHierarchyDirection;
    (function (CallHierarchyDirection) {
        CallHierarchyDirection[CallHierarchyDirection["CallsFrom"] = 1] = "CallsFrom";
        CallHierarchyDirection[CallHierarchyDirection["CallsTo"] = 2] = "CallsTo";
    })(CallHierarchyDirection = exports.CallHierarchyDirection || (exports.CallHierarchyDirection = {}));
    exports.CallHierarchyProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
});
//# sourceMappingURL=callHierarchy.js.map