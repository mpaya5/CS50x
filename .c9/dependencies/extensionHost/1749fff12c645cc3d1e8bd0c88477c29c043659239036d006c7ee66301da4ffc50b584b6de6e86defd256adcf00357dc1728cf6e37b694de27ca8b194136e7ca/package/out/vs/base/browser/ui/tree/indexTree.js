/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iterator", "vs/base/browser/ui/tree/abstractTree", "vs/base/browser/ui/tree/indexTreeModel", "vs/css!./media/tree"], function (require, exports, iterator_1, abstractTree_1, indexTreeModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class IndexTree extends abstractTree_1.AbstractTree {
        constructor(container, delegate, renderers, rootElement, options = {}) {
            super(container, delegate, renderers, options);
            this.rootElement = rootElement;
        }
        splice(location, deleteCount, toInsert = iterator_1.Iterator.empty()) {
            return this.model.splice(location, deleteCount, toInsert);
        }
        rerender(location) {
            if (location === undefined) {
                this.view.rerender();
                return;
            }
            this.model.rerender(location);
        }
        createModel(view, options) {
            return new indexTreeModel_1.IndexTreeModel(view, this.rootElement, options);
        }
    }
    exports.IndexTree = IndexTree;
});
//# sourceMappingURL=indexTree.js.map