/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iterator", "vs/base/common/event", "vs/base/browser/ui/tree/objectTreeModel"], function (require, exports, iterator_1, event_1, objectTreeModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function compress(element) {
        const elements = [element.element];
        const incompressible = element.incompressible || false;
        let childrenIterator;
        let children;
        while (true) {
            childrenIterator = iterator_1.Iterator.from(element.children);
            children = iterator_1.Iterator.collect(childrenIterator, 2);
            if (children.length !== 1) {
                break;
            }
            element = children[0];
            if (element.incompressible) {
                break;
            }
            elements.push(element.element);
        }
        return {
            element: { elements, incompressible },
            children: iterator_1.Iterator.map(iterator_1.Iterator.concat(iterator_1.Iterator.fromArray(children), childrenIterator), compress)
        };
    }
    exports.compress = compress;
    function _decompress(element, index = 0) {
        let children;
        if (index < element.element.elements.length - 1) {
            children = iterator_1.Iterator.single(_decompress(element, index + 1));
        }
        else {
            children = iterator_1.Iterator.map(iterator_1.Iterator.from(element.children), el => _decompress(el, 0));
        }
        if (index === 0 && element.element.incompressible) {
            return { element: element.element.elements[index], children, incompressible: true };
        }
        return { element: element.element.elements[index], children };
    }
    exports._decompress = _decompress;
    function decompress(element) {
        return _decompress(element, 0);
    }
    exports.decompress = decompress;
    function splice(treeElement, element, children) {
        if (treeElement.element === element) {
            return { element, children };
        }
        return Object.assign({}, treeElement, { children: iterator_1.Iterator.map(iterator_1.Iterator.from(treeElement.children), e => splice(e, element, children)) });
    }
    exports.splice = splice;
    class CompressedTreeModel {
        constructor(list, options = {}) {
            this.rootRef = null;
            this.nodes = new Map();
            this.model = new objectTreeModel_1.ObjectTreeModel(list, options);
        }
        get onDidSplice() { return this.model.onDidSplice; }
        get onDidChangeCollapseState() { return this.model.onDidChangeCollapseState; }
        get onDidChangeRenderNodeCount() { return this.model.onDidChangeRenderNodeCount; }
        get size() { return this.nodes.size; }
        setChildren(element, children, onDidCreateNode, onDidDeleteNode) {
            const insertedElements = new Set();
            const _onDidCreateNode = (node) => {
                for (const element of node.element.elements) {
                    insertedElements.add(element);
                    this.nodes.set(element, node.element);
                }
                // if (this.identityProvider) {
                // 	const id = this.identityProvider.getId(node.element).toString();
                // 	insertedElementIds.add(id);
                // 	this.nodesByIdentity.set(id, node);
                // }
                if (onDidCreateNode) {
                    onDidCreateNode(node);
                }
            };
            const _onDidDeleteNode = (node) => {
                for (const element of node.element.elements) {
                    if (!insertedElements.has(element)) {
                        this.nodes.delete(element);
                    }
                }
                // if (this.identityProvider) {
                // 	const id = this.identityProvider.getId(node.element).toString();
                // 	if (!insertedElementIds.has(id)) {
                // 		this.nodesByIdentity.delete(id);
                // 	}
                // }
                if (onDidDeleteNode) {
                    onDidDeleteNode(node);
                }
            };
            if (element === null) {
                const compressedChildren = iterator_1.Iterator.map(iterator_1.Iterator.from(children), compress);
                const result = this.model.setChildren(null, compressedChildren, _onDidCreateNode, _onDidDeleteNode);
                return iterator_1.Iterator.map(result, decompress);
            }
            const compressedNode = this.nodes.get(element);
            const node = this.model.getNode(compressedNode);
            const parent = node.parent;
            const decompressedElement = decompress(node);
            const splicedElement = splice(decompressedElement, element, iterator_1.Iterator.from(children));
            const recompressedElement = compress(splicedElement);
            const parentChildren = parent.children
                .map(child => child === node ? recompressedElement : child);
            this.model.setChildren(parent.element, parentChildren, _onDidCreateNode, _onDidDeleteNode);
            // TODO
            return iterator_1.Iterator.empty();
        }
        getListIndex(location) {
            const node = this.getCompressedNode(location);
            return this.model.getListIndex(node);
        }
        getListRenderCount(location) {
            const node = this.getCompressedNode(location);
            return this.model.getListRenderCount(node);
        }
        getNode(location) {
            if (typeof location === 'undefined') {
                return this.model.getNode();
            }
            const node = this.getCompressedNode(location);
            return this.model.getNode(node);
        }
        // TODO: review this
        getNodeLocation(node) {
            const compressedNode = this.model.getNodeLocation(node);
            if (compressedNode === null) {
                return null;
            }
            return compressedNode.elements[compressedNode.elements.length - 1];
        }
        // TODO: review this
        getParentNodeLocation(location) {
            const compressedNode = this.getCompressedNode(location);
            const parentNode = this.model.getParentNodeLocation(compressedNode);
            if (parentNode === null) {
                return null;
            }
            return parentNode.elements[parentNode.elements.length - 1];
        }
        getParentElement(location) {
            const compressedNode = this.getCompressedNode(location);
            return this.model.getParentElement(compressedNode);
        }
        getFirstElementChild(location) {
            const compressedNode = this.getCompressedNode(location);
            return this.model.getFirstElementChild(compressedNode);
        }
        getLastElementAncestor(location) {
            const compressedNode = typeof location === 'undefined' ? undefined : this.getCompressedNode(location);
            return this.model.getLastElementAncestor(compressedNode);
        }
        isCollapsible(location) {
            const compressedNode = this.getCompressedNode(location);
            return this.model.isCollapsible(compressedNode);
        }
        isCollapsed(location) {
            const compressedNode = this.getCompressedNode(location);
            return this.model.isCollapsed(compressedNode);
        }
        setCollapsed(location, collapsed, recursive) {
            const compressedNode = this.getCompressedNode(location);
            return this.model.setCollapsed(compressedNode, collapsed, recursive);
        }
        expandTo(location) {
            const compressedNode = this.getCompressedNode(location);
            this.model.expandTo(compressedNode);
        }
        rerender(location) {
            const compressedNode = this.getCompressedNode(location);
            this.model.rerender(compressedNode);
        }
        refilter() {
            this.model.refilter();
        }
        resort(location = null, recursive = true) {
            const compressedNode = this.getCompressedNode(location);
            this.model.resort(compressedNode, recursive);
        }
        getCompressedNode(element) {
            if (element === null) {
                return null;
            }
            const node = this.nodes.get(element);
            if (!node) {
                throw new Error(`Tree element not found: ${element}`);
            }
            return node;
        }
    }
    exports.CompressedTreeModel = CompressedTreeModel;
    exports.DefaultElementMapper = elements => elements[elements.length - 1];
    function mapNode(elementMapper, node) {
        return Object.assign({}, node, { element: node.element === null ? null : elementMapper(node.element.elements), children: node.children.map(child => mapNode(elementMapper, child)), parent: typeof node.parent === 'undefined' ? node.parent : mapNode(elementMapper, node.parent) });
    }
    function createNodeMapper(elementMapper) {
        return node => mapNode(elementMapper, node);
    }
    class CompressedObjectTreeModel {
        constructor(list, options = {}) {
            this.rootRef = null;
            this.mapElement = options.elementMapper || exports.DefaultElementMapper;
            this.mapNode = createNodeMapper(this.mapElement);
            this.model = new CompressedTreeModel(list, options);
        }
        get onDidSplice() {
            return event_1.Event.map(this.model.onDidSplice, ({ insertedNodes, deletedNodes }) => ({
                insertedNodes: insertedNodes.map(this.mapNode),
                deletedNodes: deletedNodes.map(this.mapNode),
            }));
        }
        get onDidChangeCollapseState() {
            return event_1.Event.map(this.model.onDidChangeCollapseState, ({ node, deep }) => ({
                node: this.mapNode(node),
                deep
            }));
        }
        get onDidChangeRenderNodeCount() {
            return event_1.Event.map(this.model.onDidChangeRenderNodeCount, this.mapNode);
        }
        setChildren(element, children) {
            this.model.setChildren(element, children);
            // TODO
            return iterator_1.Iterator.empty();
        }
        getListIndex(location) {
            return this.model.getListIndex(location);
        }
        getListRenderCount(location) {
            return this.model.getListRenderCount(location);
        }
        getNode(location) {
            return this.mapNode(this.model.getNode(location));
        }
        getNodeLocation(node) {
            return node.element;
        }
        getParentNodeLocation(location) {
            return this.model.getParentNodeLocation(location);
        }
        getParentElement(location) {
            const result = this.model.getParentElement(location);
            if (result === null) {
                return result;
            }
            return this.mapElement(result.elements);
        }
        getFirstElementChild(location) {
            const result = this.model.getFirstElementChild(location);
            if (result === null || typeof result === 'undefined') {
                return result;
            }
            return this.mapElement(result.elements);
        }
        getLastElementAncestor(location) {
            const result = this.model.getLastElementAncestor(location);
            if (result === null || typeof result === 'undefined') {
                return result;
            }
            return this.mapElement(result.elements);
        }
        isCollapsible(location) {
            return this.model.isCollapsible(location);
        }
        isCollapsed(location) {
            return this.model.isCollapsed(location);
        }
        setCollapsed(location, collapsed, recursive) {
            return this.model.setCollapsed(location, collapsed, recursive);
        }
        expandTo(location) {
            return this.model.expandTo(location);
        }
        rerender(location) {
            return this.model.rerender(location);
        }
        refilter() {
            return this.model.refilter();
        }
        resort(element = null, recursive = true) {
            return this.model.resort(element, recursive);
        }
    }
    exports.CompressedObjectTreeModel = CompressedObjectTreeModel;
});
//# sourceMappingURL=compressedObjectTreeModel.js.map