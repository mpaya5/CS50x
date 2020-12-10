/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/tree/abstractTree", "vs/base/browser/ui/tree/objectTreeModel"], function (require, exports, abstractTree_1, objectTreeModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ObjectTree extends abstractTree_1.AbstractTree {
        constructor(container, delegate, renderers, options = {}) {
            super(container, delegate, renderers, options);
        }
        get onDidChangeCollapseState() { return this.model.onDidChangeCollapseState; }
        setChildren(element, children) {
            return this.model.setChildren(element, children);
        }
        rerender(element) {
            if (element === undefined) {
                this.view.rerender();
                return;
            }
            this.model.rerender(element);
        }
        resort(element, recursive = true) {
            this.model.resort(element, recursive);
        }
        createModel(view, options) {
            return new objectTreeModel_1.ObjectTreeModel(view, options);
        }
    }
    exports.ObjectTree = ObjectTree;
});
//# sourceMappingURL=objectTree.js.map