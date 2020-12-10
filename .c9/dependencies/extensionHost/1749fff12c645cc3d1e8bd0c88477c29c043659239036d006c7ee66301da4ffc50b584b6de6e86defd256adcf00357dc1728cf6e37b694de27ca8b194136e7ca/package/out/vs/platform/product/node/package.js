/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/amd"], function (require, exports, path, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const rootPath = path.dirname(amd_1.getPathFromAmdModule(require, ''));
    const packageJsonPath = path.join(rootPath, 'package.json');
    exports.default = require.__$__nodeRequire(packageJsonPath);
});
//# sourceMappingURL=package.js.map