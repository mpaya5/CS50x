/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "assert", "vs/base/browser/ui/tree/asyncDataTree", "vs/base/browser/dom"], function (require, exports, assert, asyncDataTree_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function find(elements, id) {
        while (elements) {
            for (const element of elements) {
                if (element.id === id) {
                    return element;
                }
            }
        }
        throw new Error('element not found');
    }
    suite('AsyncDataTree', function () {
        test('Collapse state should be preserved across refresh calls', () => __awaiter(this, void 0, void 0, function* () {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const delegate = new class {
                getHeight() { return 20; }
                getTemplateId(element) { return 'default'; }
            };
            const renderer = new class {
                constructor() {
                    this.templateId = 'default';
                }
                renderTemplate(container) {
                    return container;
                }
                renderElement(element, index, templateData) {
                    templateData.textContent = element.element.id;
                }
                disposeTemplate(templateData) {
                    // noop
                }
            };
            const dataSource = new class {
                hasChildren(element) {
                    return !!element.children && element.children.length > 0;
                }
                getChildren(element) {
                    return Promise.resolve(element.children || []);
                }
            };
            const identityProvider = new class {
                getId(element) {
                    return element.id;
                }
            };
            const root = {
                id: 'root',
                children: [{
                        id: 'a'
                    }]
            };
            const _ = find.bind(null, root.children);
            const tree = new asyncDataTree_1.AsyncDataTree(container, delegate, [renderer], dataSource, { identityProvider });
            tree.layout(200);
            assert.equal(container.querySelectorAll('.monaco-list-row').length, 0);
            yield tree.setInput(root);
            assert.equal(container.querySelectorAll('.monaco-list-row').length, 1);
            let twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(!dom_1.hasClass(twistie, 'collapsible'));
            assert(!dom_1.hasClass(twistie, 'collapsed'));
            _('a').children = [
                { id: 'aa' },
                { id: 'ab' },
                { id: 'ac' }
            ];
            yield tree.updateChildren(root);
            assert.equal(container.querySelectorAll('.monaco-list-row').length, 1);
            yield tree.expand(_('a'));
            assert.equal(container.querySelectorAll('.monaco-list-row').length, 4);
            _('a').children = [];
            yield tree.updateChildren(root);
            assert.equal(container.querySelectorAll('.monaco-list-row').length, 1);
        }));
        test('issue #68648', () => __awaiter(this, void 0, void 0, function* () {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const delegate = new class {
                getHeight() { return 20; }
                getTemplateId(element) { return 'default'; }
            };
            const renderer = new class {
                constructor() {
                    this.templateId = 'default';
                }
                renderTemplate(container) {
                    return container;
                }
                renderElement(element, index, templateData) {
                    templateData.textContent = element.element.id;
                }
                disposeTemplate(templateData) {
                    // noop
                }
            };
            const getChildrenCalls = [];
            const dataSource = new class {
                hasChildren(element) {
                    return !!element.children && element.children.length > 0;
                }
                getChildren(element) {
                    getChildrenCalls.push(element.id);
                    return Promise.resolve(element.children || []);
                }
            };
            const identityProvider = new class {
                getId(element) {
                    return element.id;
                }
            };
            const root = {
                id: 'root',
                children: [{
                        id: 'a'
                    }]
            };
            const _ = find.bind(null, root.children);
            const tree = new asyncDataTree_1.AsyncDataTree(container, delegate, [renderer], dataSource, { identityProvider });
            tree.layout(200);
            yield tree.setInput(root);
            assert.deepStrictEqual(getChildrenCalls, ['root']);
            let twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(!dom_1.hasClass(twistie, 'collapsible'));
            assert(!dom_1.hasClass(twistie, 'collapsed'));
            assert(tree.getNode().children[0].collapsed);
            _('a').children = [{ id: 'aa' }, { id: 'ab' }, { id: 'ac' }];
            yield tree.updateChildren(root);
            assert.deepStrictEqual(getChildrenCalls, ['root', 'root']);
            twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(dom_1.hasClass(twistie, 'collapsible'));
            assert(dom_1.hasClass(twistie, 'collapsed'));
            assert(tree.getNode().children[0].collapsed);
            _('a').children = [];
            yield tree.updateChildren(root);
            assert.deepStrictEqual(getChildrenCalls, ['root', 'root', 'root']);
            twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(!dom_1.hasClass(twistie, 'collapsible'));
            assert(!dom_1.hasClass(twistie, 'collapsed'));
            assert(tree.getNode().children[0].collapsed);
            _('a').children = [{ id: 'aa' }, { id: 'ab' }, { id: 'ac' }];
            yield tree.updateChildren(root);
            assert.deepStrictEqual(getChildrenCalls, ['root', 'root', 'root', 'root']);
            twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(dom_1.hasClass(twistie, 'collapsible'));
            assert(dom_1.hasClass(twistie, 'collapsed'));
            assert(tree.getNode().children[0].collapsed);
        }));
        test('issue #67722 - once resolved, refreshed collapsed nodes should only get children when expanded', () => __awaiter(this, void 0, void 0, function* () {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const delegate = new class {
                getHeight() { return 20; }
                getTemplateId(element) { return 'default'; }
            };
            const renderer = new class {
                constructor() {
                    this.templateId = 'default';
                }
                renderTemplate(container) {
                    return container;
                }
                renderElement(element, index, templateData) {
                    templateData.textContent = element.element.id;
                }
                disposeTemplate(templateData) {
                    // noop
                }
            };
            const getChildrenCalls = [];
            const dataSource = new class {
                hasChildren(element) {
                    return !!element.children && element.children.length > 0;
                }
                getChildren(element) {
                    getChildrenCalls.push(element.id);
                    return Promise.resolve(element.children || []);
                }
            };
            const identityProvider = new class {
                getId(element) {
                    return element.id;
                }
            };
            const root = {
                id: 'root',
                children: [{
                        id: 'a', children: [{ id: 'aa' }, { id: 'ab' }, { id: 'ac' }]
                    }]
            };
            const _ = find.bind(null, root.children);
            const tree = new asyncDataTree_1.AsyncDataTree(container, delegate, [renderer], dataSource, { identityProvider });
            tree.layout(200);
            yield tree.setInput(root);
            assert(tree.getNode(_('a')).collapsed);
            assert.deepStrictEqual(getChildrenCalls, ['root']);
            yield tree.expand(_('a'));
            assert(!tree.getNode(_('a')).collapsed);
            assert.deepStrictEqual(getChildrenCalls, ['root', 'a']);
            tree.collapse(_('a'));
            assert(tree.getNode(_('a')).collapsed);
            assert.deepStrictEqual(getChildrenCalls, ['root', 'a']);
            yield tree.updateChildren();
            assert(tree.getNode(_('a')).collapsed);
            assert.deepStrictEqual(getChildrenCalls, ['root', 'a', 'root'], 'a should not be refreshed, since it\' collapsed');
        }));
        test('resolved collapsed nodes which lose children should lose twistie as well', () => __awaiter(this, void 0, void 0, function* () {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const delegate = new class {
                getHeight() { return 20; }
                getTemplateId(element) { return 'default'; }
            };
            const renderer = new class {
                constructor() {
                    this.templateId = 'default';
                }
                renderTemplate(container) {
                    return container;
                }
                renderElement(element, index, templateData) {
                    templateData.textContent = element.element.id;
                }
                disposeTemplate(templateData) {
                    // noop
                }
            };
            const dataSource = new class {
                hasChildren(element) {
                    return !!element.children && element.children.length > 0;
                }
                getChildren(element) {
                    return Promise.resolve(element.children || []);
                }
            };
            const identityProvider = new class {
                getId(element) {
                    return element.id;
                }
            };
            const root = {
                id: 'root',
                children: [{
                        id: 'a', children: [{ id: 'aa' }, { id: 'ab' }, { id: 'ac' }]
                    }]
            };
            const _ = find.bind(null, root.children);
            const tree = new asyncDataTree_1.AsyncDataTree(container, delegate, [renderer], dataSource, { identityProvider });
            tree.layout(200);
            yield tree.setInput(root);
            yield tree.expand(_('a'));
            let twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(dom_1.hasClass(twistie, 'collapsible'));
            assert(!dom_1.hasClass(twistie, 'collapsed'));
            assert(!tree.getNode(_('a')).collapsed);
            tree.collapse(_('a'));
            _('a').children = [];
            yield tree.updateChildren(root);
            twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(!dom_1.hasClass(twistie, 'collapsible'));
            assert(!dom_1.hasClass(twistie, 'collapsed'));
            assert(tree.getNode(_('a')).collapsed);
        }));
        test('support default collapse state per element', () => __awaiter(this, void 0, void 0, function* () {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const delegate = new class {
                getHeight() { return 20; }
                getTemplateId(element) { return 'default'; }
            };
            const renderer = new class {
                constructor() {
                    this.templateId = 'default';
                }
                renderTemplate(container) {
                    return container;
                }
                renderElement(element, index, templateData) {
                    templateData.textContent = element.element.id;
                }
                disposeTemplate(templateData) {
                    // noop
                }
            };
            const getChildrenCalls = [];
            const dataSource = new class {
                hasChildren(element) {
                    return !!element.children && element.children.length > 0;
                }
                getChildren(element) {
                    getChildrenCalls.push(element.id);
                    return Promise.resolve(element.children || []);
                }
            };
            const root = {
                id: 'root',
                children: [{
                        id: 'a', children: [{ id: 'aa' }, { id: 'ab' }, { id: 'ac' }]
                    }]
            };
            const _ = find.bind(null, root.children);
            const tree = new asyncDataTree_1.AsyncDataTree(container, delegate, [renderer], dataSource, {
                collapseByDefault: el => el.id !== 'a'
            });
            tree.layout(200);
            yield tree.setInput(root);
            assert(!tree.getNode(_('a')).collapsed);
            assert.deepStrictEqual(getChildrenCalls, ['root', 'a']);
        }));
    });
});
//# sourceMappingURL=asyncDataTree.test.js.map