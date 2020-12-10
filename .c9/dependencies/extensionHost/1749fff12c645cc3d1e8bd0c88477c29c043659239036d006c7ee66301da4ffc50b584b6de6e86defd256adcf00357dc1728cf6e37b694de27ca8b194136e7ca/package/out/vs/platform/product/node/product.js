/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/amd", "vs/platform/product/node/package"], function (require, exports, path, amd_1, package_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const rootPath = path.dirname(amd_1.getPathFromAmdModule(require, ''));
    const productJsonPath = path.join(rootPath, 'product.json');
    const product = require.__$__nodeRequire(productJsonPath);
    if (process.env['VSCODE_DEV']) {
        product.nameShort += ' Dev';
        product.nameLong += ' Dev';
        product.dataFolderName += '-dev';
    }
    product.version = package_1.default.version;
    exports.default = product;
});
//# sourceMappingURL=product.js.map