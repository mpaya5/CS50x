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
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/parts/tree/browser/treeModel", "vs/base/parts/tree/browser/treeDefaults", "vs/base/common/event", "vs/base/common/async"], function (require, exports, assert, lifecycle, model, TreeDefaults, event_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FakeRenderer {
        getHeight(tree, element) {
            return 20;
        }
        getTemplateId(tree, element) {
            return 'fake';
        }
        renderTemplate(tree, templateId, container) {
            return null;
        }
        renderElement(tree, element, templateId, templateData) {
            // noop
        }
        disposeTemplate(tree, templateId, templateData) {
            // noop
        }
    }
    exports.FakeRenderer = FakeRenderer;
    class TreeContext {
        constructor(configuration) {
            this.configuration = configuration;
            this.tree = null;
            this.options = { autoExpandSingleChildren: true };
            this.dataSource = configuration.dataSource;
            this.renderer = configuration.renderer || new FakeRenderer();
            this.controller = configuration.controller;
            this.dnd = configuration.dnd;
            this.filter = configuration.filter || new TreeDefaults.DefaultFilter();
            this.sorter = configuration.sorter || new TreeDefaults.DefaultSorter();
        }
    }
    class TreeModel extends model.TreeModel {
        constructor(configuration) {
            super(new TreeContext(configuration));
        }
    }
    class EventCounter {
        constructor() {
            this.listeners = [];
            this._count = 0;
        }
        listen(event, fn = null) {
            let r = event(data => {
                this._count++;
                if (fn) {
                    fn(data);
                }
            });
            this.listeners.push(r);
            return () => {
                let idx = this.listeners.indexOf(r);
                if (idx > -1) {
                    this.listeners.splice(idx, 1);
                    r.dispose();
                }
            };
        }
        up() {
            this._count++;
        }
        get count() {
            return this._count;
        }
        dispose() {
            this.listeners = lifecycle.dispose(this.listeners);
            this._count = -1;
        }
    }
    const SAMPLE = {
        ONE: { id: 'one' },
        AB: {
            id: 'ROOT', children: [
                {
                    id: 'a', children: [
                        { id: 'aa' },
                        { id: 'ab' }
                    ]
                },
                { id: 'b' },
                {
                    id: 'c', children: [
                        { id: 'ca' },
                        { id: 'cb' }
                    ]
                }
            ]
        },
        DEEP: {
            id: 'ROOT', children: [
                {
                    id: 'a', children: [
                        {
                            id: 'x', children: [
                                { id: 'xa' },
                                { id: 'xb' },
                            ]
                        }
                    ]
                },
                { id: 'b' }
            ]
        },
        DEEP2: {
            id: 'ROOT', children: [
                {
                    id: 'a', children: [
                        {
                            id: 'x', children: [
                                { id: 'xa' },
                                { id: 'xb' },
                            ]
                        },
                        { id: 'y' }
                    ]
                },
                { id: 'b' }
            ]
        }
    };
    class TestDataSource {
        getId(tree, element) {
            return element.id;
        }
        hasChildren(tree, element) {
            return !!element.children;
        }
        getChildren(tree, element) {
            return Promise.resolve(element.children);
        }
        getParent(tree, element) {
            throw new Error('Not implemented');
        }
    }
    suite('TreeModel', () => {
        let model;
        let counter;
        setup(() => {
            counter = new EventCounter();
            model = new TreeModel({
                dataSource: new TestDataSource()
            });
        });
        teardown(() => {
            counter.dispose();
            model.dispose();
        });
        test('setInput, getInput', () => {
            model.setInput(SAMPLE.ONE);
            assert.equal(model.getInput(), SAMPLE.ONE);
        });
        test('refresh() refreshes all', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                counter.listen(model.onRefresh); // 1
                counter.listen(model.onDidRefresh); // 1
                counter.listen(model.onDidRefreshItem); // 4
                counter.listen(model.onRefreshItemChildren); // 1
                counter.listen(model.onDidRefreshItemChildren); // 1
                return model.refresh(null);
            }).then(() => {
                assert.equal(counter.count, 8);
            });
        });
        test('refresh(root) refreshes all', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                counter.listen(model.onRefresh); // 1
                counter.listen(model.onDidRefresh); // 1
                counter.listen(model.onDidRefreshItem); // 4
                counter.listen(model.onRefreshItemChildren); // 1
                counter.listen(model.onDidRefreshItemChildren); // 1
                return model.refresh(SAMPLE.AB);
            }).then(() => {
                assert.equal(counter.count, 8);
            });
        });
        test('refresh(root, false) refreshes the root', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                counter.listen(model.onRefresh); // 1
                counter.listen(model.onDidRefresh); // 1
                counter.listen(model.onDidRefreshItem); // 1
                counter.listen(model.onRefreshItemChildren); // 1
                counter.listen(model.onDidRefreshItemChildren); // 1
                return model.refresh(SAMPLE.AB, false);
            }).then(() => {
                assert.equal(counter.count, 5);
            });
        });
        test('refresh(collapsed element) does not refresh descendants', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                counter.listen(model.onRefresh); // 1
                counter.listen(model.onDidRefresh); // 1
                counter.listen(model.onDidRefreshItem); // 1
                counter.listen(model.onRefreshItemChildren); // 0
                counter.listen(model.onDidRefreshItemChildren); // 0
                return model.refresh(SAMPLE.AB.children[0]);
            }).then(() => {
                assert.equal(counter.count, 3);
            });
        });
        test('refresh(expanded element) refreshes the element and descendants', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                return model.expand(SAMPLE.AB.children[0]).then(() => {
                    counter.listen(model.onRefresh); // 1
                    counter.listen(model.onDidRefresh); // 1
                    counter.listen(model.onDidRefreshItem); // 3
                    counter.listen(model.onRefreshItemChildren); // 1
                    counter.listen(model.onDidRefreshItemChildren); // 1
                    return model.refresh(SAMPLE.AB.children[0]);
                });
            }).then(() => {
                assert.equal(counter.count, 7);
            });
        });
        test('refresh(element, false) refreshes the element', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                return model.expand(SAMPLE.AB.children[0]).then(() => {
                    counter.listen(model.onRefresh); // 1
                    counter.listen(model.onDidRefresh); // 1
                    counter.listen(model.onDidRefreshItem, item => {
                        assert.equal(item.id, 'a');
                        counter.up();
                    });
                    counter.listen(model.onRefreshItemChildren); // 1
                    counter.listen(model.onDidRefreshItemChildren); // 1
                    return model.refresh(SAMPLE.AB.children[0], false);
                });
            }).then(() => {
                assert.equal(counter.count, 6);
            });
        });
        test('depths', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                return model.expandAll(['a', 'c']).then(() => {
                    counter.listen(model.onDidRefreshItem, item => {
                        switch (item.id) {
                            case 'ROOT':
                                assert.equal(item.getDepth(), 0);
                                break;
                            case 'a':
                                assert.equal(item.getDepth(), 1);
                                break;
                            case 'aa':
                                assert.equal(item.getDepth(), 2);
                                break;
                            case 'ab':
                                assert.equal(item.getDepth(), 2);
                                break;
                            case 'b':
                                assert.equal(item.getDepth(), 1);
                                break;
                            case 'c':
                                assert.equal(item.getDepth(), 1);
                                break;
                            case 'ca':
                                assert.equal(item.getDepth(), 2);
                                break;
                            case 'cb':
                                assert.equal(item.getDepth(), 2);
                                break;
                            default: return;
                        }
                        counter.up();
                    });
                    return model.refresh();
                });
            }).then(() => {
                assert.equal(counter.count, 16);
            });
        });
        test('intersections', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                return model.expandAll(['a', 'c']).then(() => {
                    // going internals
                    const r = model.registry;
                    assert(r.getItem('a').intersects(r.getItem('a')));
                    assert(r.getItem('a').intersects(r.getItem('aa')));
                    assert(r.getItem('a').intersects(r.getItem('ab')));
                    assert(r.getItem('aa').intersects(r.getItem('a')));
                    assert(r.getItem('ab').intersects(r.getItem('a')));
                    assert(!r.getItem('aa').intersects(r.getItem('ab')));
                    assert(!r.getItem('a').intersects(r.getItem('b')));
                    assert(!r.getItem('a').intersects(r.getItem('c')));
                    assert(!r.getItem('a').intersects(r.getItem('ca')));
                    assert(!r.getItem('aa').intersects(r.getItem('ca')));
                });
            });
        });
    });
    suite('TreeModel - TreeNavigator', () => {
        let model;
        let counter;
        setup(() => {
            counter = new EventCounter();
            model = new TreeModel({
                dataSource: new TestDataSource()
            });
        });
        teardown(() => {
            counter.dispose();
            model.dispose();
        });
        test('next()', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                const nav = model.getNavigator();
                assert.equal(nav.next().id, 'a');
                assert.equal(nav.next().id, 'b');
                assert.equal(nav.next().id, 'c');
                assert.equal(nav.next() && false, null);
            });
        });
        test('previous()', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                const nav = model.getNavigator();
                nav.next();
                nav.next();
                assert.equal(nav.next().id, 'c');
                assert.equal(nav.previous().id, 'b');
                assert.equal(nav.previous().id, 'a');
                assert.equal(nav.previous() && false, null);
            });
        });
        test('parent()', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                return model.expandAll([{ id: 'a' }, { id: 'c' }]).then(() => {
                    const nav = model.getNavigator();
                    assert.equal(nav.next().id, 'a');
                    assert.equal(nav.next().id, 'aa');
                    assert.equal(nav.parent().id, 'a');
                    assert.equal(nav.next().id, 'aa');
                    assert.equal(nav.next().id, 'ab');
                    assert.equal(nav.parent().id, 'a');
                    assert.equal(nav.next().id, 'aa');
                    assert.equal(nav.next().id, 'ab');
                    assert.equal(nav.next().id, 'b');
                    assert.equal(nav.next().id, 'c');
                    assert.equal(nav.next().id, 'ca');
                    assert.equal(nav.parent().id, 'c');
                    assert.equal(nav.parent() && false, null);
                });
            });
        });
        test('next() - scoped', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                const nav = model.getNavigator(SAMPLE.AB.children[0]);
                return model.expand({ id: 'a' }).then(() => {
                    assert.equal(nav.next().id, 'aa');
                    assert.equal(nav.next().id, 'ab');
                    assert.equal(nav.next() && false, null);
                });
            });
        });
        test('previous() - scoped', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                const nav = model.getNavigator(SAMPLE.AB.children[0]);
                return model.expand({ id: 'a' }).then(() => {
                    assert.equal(nav.next().id, 'aa');
                    assert.equal(nav.next().id, 'ab');
                    assert.equal(nav.previous().id, 'aa');
                    assert.equal(nav.previous() && false, null);
                });
            });
        });
        test('parent() - scoped', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                return model.expandAll([{ id: 'a' }, { id: 'c' }]).then(() => {
                    const nav = model.getNavigator(SAMPLE.AB.children[0]);
                    assert.equal(nav.next().id, 'aa');
                    assert.equal(nav.next().id, 'ab');
                    assert.equal(nav.parent() && false, null);
                });
            });
        });
        test('next() - non sub tree only', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                const nav = model.getNavigator(SAMPLE.AB.children[0], false);
                return model.expand({ id: 'a' }).then(() => {
                    assert.equal(nav.next().id, 'aa');
                    assert.equal(nav.next().id, 'ab');
                    assert.equal(nav.next().id, 'b');
                    assert.equal(nav.next().id, 'c');
                    assert.equal(nav.next() && false, null);
                });
            });
        });
        test('previous() - non sub tree only', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                const nav = model.getNavigator(SAMPLE.AB.children[0], false);
                return model.expand({ id: 'a' }).then(() => {
                    assert.equal(nav.next().id, 'aa');
                    assert.equal(nav.next().id, 'ab');
                    assert.equal(nav.next().id, 'b');
                    assert.equal(nav.next().id, 'c');
                    assert.equal(nav.previous().id, 'b');
                    assert.equal(nav.previous().id, 'ab');
                    assert.equal(nav.previous().id, 'aa');
                    assert.equal(nav.previous().id, 'a');
                    assert.equal(nav.previous() && false, null);
                });
            });
        });
        test('parent() - non sub tree only', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                return model.expandAll([{ id: 'a' }, { id: 'c' }]).then(() => {
                    const nav = model.getNavigator(SAMPLE.AB.children[0], false);
                    assert.equal(nav.next().id, 'aa');
                    assert.equal(nav.next().id, 'ab');
                    assert.equal(nav.parent().id, 'a');
                    assert.equal(nav.parent() && false, null);
                });
            });
        });
        test('deep next() - scoped', () => {
            return model.setInput(SAMPLE.DEEP).then(() => {
                return model.expand(SAMPLE.DEEP.children[0]).then(() => {
                    return model.expand(SAMPLE.DEEP.children[0].children[0]).then(() => {
                        const nav = model.getNavigator(SAMPLE.DEEP.children[0].children[0]);
                        assert.equal(nav.next().id, 'xa');
                        assert.equal(nav.next().id, 'xb');
                        assert.equal(nav.next() && false, null);
                    });
                });
            });
        });
        test('deep previous() - scoped', () => {
            return model.setInput(SAMPLE.DEEP).then(() => {
                return model.expand(SAMPLE.DEEP.children[0]).then(() => {
                    return model.expand(SAMPLE.DEEP.children[0].children[0]).then(() => {
                        const nav = model.getNavigator(SAMPLE.DEEP.children[0].children[0]);
                        assert.equal(nav.next().id, 'xa');
                        assert.equal(nav.next().id, 'xb');
                        assert.equal(nav.previous().id, 'xa');
                        assert.equal(nav.previous() && false, null);
                    });
                });
            });
        });
        test('last()', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                return model.expandAll([{ id: 'a' }, { id: 'c' }]).then(() => {
                    const nav = model.getNavigator();
                    assert.equal(nav.last().id, 'cb');
                });
            });
        });
    });
    suite('TreeModel - Expansion', () => {
        let model;
        let counter;
        setup(() => {
            counter = new EventCounter();
            model = new TreeModel({
                dataSource: new TestDataSource()
            });
        });
        teardown(() => {
            counter.dispose();
            model.dispose();
        });
        test('collapse, expand', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                counter.listen(model.onExpandItem, (e) => {
                    assert.equal(e.item.id, 'a');
                    const nav = model.getNavigator(e.item);
                    assert.equal(nav.next() && false, null);
                });
                counter.listen(model.onDidExpandItem, (e) => {
                    assert.equal(e.item.id, 'a');
                    const nav = model.getNavigator(e.item);
                    assert.equal(nav.next().id, 'aa');
                    assert.equal(nav.next().id, 'ab');
                    assert.equal(nav.next() && false, null);
                });
                assert(!model.isExpanded(SAMPLE.AB.children[0]));
                let nav = model.getNavigator();
                assert.equal(nav.next().id, 'a');
                assert.equal(nav.next().id, 'b');
                assert.equal(nav.next().id, 'c');
                assert.equal(nav.next() && false, null);
                assert.equal(model.getExpandedElements().length, 0);
                return model.expand(SAMPLE.AB.children[0]).then(() => {
                    assert(model.isExpanded(SAMPLE.AB.children[0]));
                    nav = model.getNavigator();
                    assert.equal(nav.next().id, 'a');
                    assert.equal(nav.next().id, 'aa');
                    assert.equal(nav.next().id, 'ab');
                    assert.equal(nav.next().id, 'b');
                    assert.equal(nav.next().id, 'c');
                    assert.equal(nav.next() && false, null);
                    const expandedElements = model.getExpandedElements();
                    assert.equal(expandedElements.length, 1);
                    assert.equal(expandedElements[0].id, 'a');
                    assert.equal(counter.count, 2);
                });
            });
        });
        test('toggleExpansion', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                assert(!model.isExpanded(SAMPLE.AB.children[0]));
                return model.toggleExpansion(SAMPLE.AB.children[0]).then(() => {
                    assert(model.isExpanded(SAMPLE.AB.children[0]));
                    assert(!model.isExpanded(SAMPLE.AB.children[0].children[0]));
                    return model.toggleExpansion(SAMPLE.AB.children[0].children[0]).then(() => {
                        assert(!model.isExpanded(SAMPLE.AB.children[0].children[0]));
                        return model.toggleExpansion(SAMPLE.AB.children[0]).then(() => {
                            assert(!model.isExpanded(SAMPLE.AB.children[0]));
                        });
                    });
                });
            });
        });
        test('collapseAll', () => {
            return model.setInput(SAMPLE.DEEP2).then(() => {
                return model.expand(SAMPLE.DEEP2.children[0]).then(() => {
                    return model.expand(SAMPLE.DEEP2.children[0].children[0]).then(() => {
                        assert(model.isExpanded(SAMPLE.DEEP2.children[0]));
                        assert(model.isExpanded(SAMPLE.DEEP2.children[0].children[0]));
                        return model.collapseAll().then(() => {
                            assert(!model.isExpanded(SAMPLE.DEEP2.children[0]));
                            return model.expand(SAMPLE.DEEP2.children[0]).then(() => {
                                assert(!model.isExpanded(SAMPLE.DEEP2.children[0].children[0]));
                            });
                        });
                    });
                });
            });
        });
        test('auto expand single child folders', () => {
            return model.setInput(SAMPLE.DEEP).then(() => {
                return model.expand(SAMPLE.DEEP.children[0]).then(() => {
                    assert(model.isExpanded(SAMPLE.DEEP.children[0]));
                    assert(model.isExpanded(SAMPLE.DEEP.children[0].children[0]));
                });
            });
        });
        test('expand can trigger refresh', () => {
            // MUnit.expect(16);
            return model.setInput(SAMPLE.AB).then(() => {
                assert(!model.isExpanded(SAMPLE.AB.children[0]));
                let nav = model.getNavigator();
                assert.equal(nav.next().id, 'a');
                assert.equal(nav.next().id, 'b');
                assert.equal(nav.next().id, 'c');
                assert.equal(nav.next() && false, null);
                const f = counter.listen(model.onRefreshItemChildren, (e) => {
                    assert.equal(e.item.id, 'a');
                    f();
                });
                const g = counter.listen(model.onDidRefreshItemChildren, (e) => {
                    assert.equal(e.item.id, 'a');
                    g();
                });
                return model.expand(SAMPLE.AB.children[0]).then(() => {
                    assert(model.isExpanded(SAMPLE.AB.children[0]));
                    nav = model.getNavigator();
                    assert.equal(nav.next().id, 'a');
                    assert.equal(nav.next().id, 'aa');
                    assert.equal(nav.next().id, 'ab');
                    assert.equal(nav.next().id, 'b');
                    assert.equal(nav.next().id, 'c');
                    assert.equal(nav.next() && false, null);
                    assert.equal(counter.count, 2);
                });
            });
        });
        test('top level collapsed', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                return model.collapseAll([{ id: 'a' }, { id: 'b' }, { id: 'c' }]).then(() => {
                    const nav = model.getNavigator();
                    assert.equal(nav.next().id, 'a');
                    assert.equal(nav.next().id, 'b');
                    assert.equal(nav.next().id, 'c');
                    assert.equal(nav.previous().id, 'b');
                    assert.equal(nav.previous().id, 'a');
                    assert.equal(nav.previous() && false, null);
                });
            });
        });
        test('shouldAutoexpand', () => {
            // setup
            const model = new TreeModel({
                dataSource: {
                    getId: (_, e) => e,
                    hasChildren: (_, e) => true,
                    getChildren: (_, e) => {
                        if (e === 'root') {
                            return Promise.resolve(['a', 'b', 'c']);
                        }
                        if (e === 'b') {
                            return Promise.resolve(['b1']);
                        }
                        return Promise.resolve([]);
                    },
                    getParent: (_, e) => { throw new Error('not implemented'); },
                    shouldAutoexpand: (_, e) => e === 'b'
                }
            });
            return model.setInput('root').then(() => {
                return model.refresh('root', true);
            }).then(() => {
                assert(!model.isExpanded('a'));
                assert(model.isExpanded('b'));
                assert(!model.isExpanded('c'));
            });
        });
    });
    class TestFilter {
        constructor() {
            this.fn = () => true;
        }
        isVisible(tree, element) {
            return this.fn(element);
        }
    }
    suite('TreeModel - Filter', () => {
        let model;
        let counter;
        let filter;
        setup(() => {
            counter = new EventCounter();
            filter = new TestFilter();
            model = new TreeModel({
                dataSource: new TestDataSource(),
                filter: filter
            });
        });
        teardown(() => {
            counter.dispose();
            model.dispose();
        });
        test('no filter', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                return model.expandAll([{ id: 'a' }, { id: 'c' }]).then(() => {
                    const nav = model.getNavigator();
                    assert.equal(nav.next().id, 'a');
                    assert.equal(nav.next().id, 'aa');
                    assert.equal(nav.next().id, 'ab');
                    assert.equal(nav.next().id, 'b');
                    assert.equal(nav.next().id, 'c');
                    assert.equal(nav.next().id, 'ca');
                    assert.equal(nav.next().id, 'cb');
                    assert.equal(nav.previous().id, 'ca');
                    assert.equal(nav.previous().id, 'c');
                    assert.equal(nav.previous().id, 'b');
                    assert.equal(nav.previous().id, 'ab');
                    assert.equal(nav.previous().id, 'aa');
                    assert.equal(nav.previous().id, 'a');
                    assert.equal(nav.previous() && false, null);
                });
            });
        });
        test('filter all', () => {
            filter.fn = () => false;
            return model.setInput(SAMPLE.AB).then(() => {
                return model.refresh().then(() => {
                    const nav = model.getNavigator();
                    assert.equal(nav.next() && false, null);
                });
            });
        });
        test('simple filter', () => {
            // hide elements that do not start with 'a'
            filter.fn = (e) => e.id[0] === 'a';
            return model.setInput(SAMPLE.AB).then(() => {
                return model.expand({ id: 'a' }).then(() => {
                    const nav = model.getNavigator();
                    assert.equal(nav.next().id, 'a');
                    assert.equal(nav.next().id, 'aa');
                    assert.equal(nav.next().id, 'ab');
                    assert.equal(nav.previous().id, 'aa');
                    assert.equal(nav.previous().id, 'a');
                    assert.equal(nav.previous() && false, null);
                });
            });
        });
        test('simple filter 2', () => {
            // hide 'ab'
            filter.fn = (e) => e.id !== 'ab';
            return model.setInput(SAMPLE.AB).then(() => {
                return model.expand({ id: 'a' }).then(() => {
                    const nav = model.getNavigator();
                    assert.equal(nav.next().id, 'a');
                    assert.equal(nav.next().id, 'aa');
                    assert.equal(nav.next().id, 'b');
                    assert.equal(nav.next().id, 'c');
                    assert.equal(nav.next() && false, null);
                });
            });
        });
        test('simple filter, opposite', () => {
            // hide elements that start with 'a'
            filter.fn = (e) => e.id[0] !== 'a';
            return model.setInput(SAMPLE.AB).then(() => {
                return model.expand({ id: 'c' }).then(() => {
                    const nav = model.getNavigator();
                    assert.equal(nav.next().id, 'b');
                    assert.equal(nav.next().id, 'c');
                    assert.equal(nav.next().id, 'ca');
                    assert.equal(nav.next().id, 'cb');
                    assert.equal(nav.previous().id, 'ca');
                    assert.equal(nav.previous().id, 'c');
                    assert.equal(nav.previous().id, 'b');
                    assert.equal(nav.previous() && false, null);
                });
            });
        });
        test('simple filter, mischieving', () => {
            // hide the element 'a'
            filter.fn = (e) => e.id !== 'a';
            return model.setInput(SAMPLE.AB).then(() => {
                return model.expand({ id: 'c' }).then(() => {
                    const nav = model.getNavigator();
                    assert.equal(nav.next().id, 'b');
                    assert.equal(nav.next().id, 'c');
                    assert.equal(nav.next().id, 'ca');
                    assert.equal(nav.next().id, 'cb');
                    assert.equal(nav.previous().id, 'ca');
                    assert.equal(nav.previous().id, 'c');
                    assert.equal(nav.previous().id, 'b');
                    assert.equal(nav.previous() && false, null);
                });
            });
        });
        test('simple filter & previous', () => {
            // hide 'b'
            filter.fn = (e) => e.id !== 'b';
            return model.setInput(SAMPLE.AB).then(() => {
                const nav = model.getNavigator({ id: 'c' }, false);
                assert.equal(nav.previous().id, 'a');
                assert.equal(nav.previous() && false, null);
            });
        });
    });
    suite('TreeModel - Traits', () => {
        let model;
        let counter;
        setup(() => {
            counter = new EventCounter();
            model = new TreeModel({
                dataSource: new TestDataSource()
            });
        });
        teardown(() => {
            counter.dispose();
            model.dispose();
        });
        test('Selection', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                assert.equal(model.getSelection().length, 0);
                model.select(SAMPLE.AB.children[1]);
                assert(model.isSelected(SAMPLE.AB.children[1]));
                assert.equal(model.getSelection().length, 1);
                model.select(SAMPLE.AB.children[0]);
                assert(model.isSelected(SAMPLE.AB.children[0]));
                assert.equal(model.getSelection().length, 2);
                model.select(SAMPLE.AB.children[2]);
                assert(model.isSelected(SAMPLE.AB.children[2]));
                assert.equal(model.getSelection().length, 3);
                model.deselect(SAMPLE.AB.children[0]);
                assert(!model.isSelected(SAMPLE.AB.children[0]));
                assert.equal(model.getSelection().length, 2);
                model.setSelection([]);
                assert(!model.isSelected(SAMPLE.AB.children[0]));
                assert(!model.isSelected(SAMPLE.AB.children[1]));
                assert(!model.isSelected(SAMPLE.AB.children[2]));
                assert.equal(model.getSelection().length, 0);
                model.selectAll([SAMPLE.AB.children[0], SAMPLE.AB.children[1], SAMPLE.AB.children[2]]);
                assert.equal(model.getSelection().length, 3);
                model.select(SAMPLE.AB.children[0]);
                assert.equal(model.getSelection().length, 3);
                model.deselectAll([SAMPLE.AB.children[0], SAMPLE.AB.children[1], SAMPLE.AB.children[2]]);
                assert.equal(model.getSelection().length, 0);
                model.deselect(SAMPLE.AB.children[0]);
                assert.equal(model.getSelection().length, 0);
                model.setSelection([SAMPLE.AB.children[0]]);
                assert.equal(model.getSelection().length, 1);
                assert(model.isSelected(SAMPLE.AB.children[0]));
                assert(!model.isSelected(SAMPLE.AB.children[1]));
                assert(!model.isSelected(SAMPLE.AB.children[2]));
                model.setSelection([SAMPLE.AB.children[0], SAMPLE.AB.children[1], SAMPLE.AB.children[2]]);
                assert.equal(model.getSelection().length, 3);
                assert(model.isSelected(SAMPLE.AB.children[0]));
                assert(model.isSelected(SAMPLE.AB.children[1]));
                assert(model.isSelected(SAMPLE.AB.children[2]));
                model.setSelection([SAMPLE.AB.children[1], SAMPLE.AB.children[2]]);
                assert.equal(model.getSelection().length, 2);
                assert(!model.isSelected(SAMPLE.AB.children[0]));
                assert(model.isSelected(SAMPLE.AB.children[1]));
                assert(model.isSelected(SAMPLE.AB.children[2]));
                model.setSelection([]);
                assert.deepEqual(model.getSelection(), []);
                assert.equal(model.getSelection().length, 0);
                assert(!model.isSelected(SAMPLE.AB.children[0]));
                assert(!model.isSelected(SAMPLE.AB.children[1]));
                assert(!model.isSelected(SAMPLE.AB.children[2]));
                model.selectNext();
                assert.equal(model.getSelection().length, 1);
                assert(model.isSelected(SAMPLE.AB.children[0]));
                model.selectNext();
                assert.equal(model.getSelection().length, 1);
                assert(model.isSelected(SAMPLE.AB.children[1]));
                model.selectNext();
                assert.equal(model.getSelection().length, 1);
                assert(model.isSelected(SAMPLE.AB.children[2]));
                model.selectNext();
                assert.equal(model.getSelection().length, 1);
                assert(model.isSelected(SAMPLE.AB.children[2]));
                model.selectPrevious();
                assert.equal(model.getSelection().length, 1);
                assert(model.isSelected(SAMPLE.AB.children[1]));
                model.selectPrevious();
                assert.equal(model.getSelection().length, 1);
                assert(model.isSelected(SAMPLE.AB.children[0]));
                model.selectPrevious();
                assert.equal(model.getSelection().length, 1);
                assert(model.isSelected(SAMPLE.AB.children[0]));
                model.selectNext(2);
                assert.equal(model.getSelection().length, 1);
                assert(model.isSelected(SAMPLE.AB.children[2]));
                model.selectPrevious(4);
                assert.equal(model.getSelection().length, 1);
                assert(model.isSelected(SAMPLE.AB.children[0]));
                assert.equal(model.isSelected(SAMPLE.AB.children[0]), true);
                assert.equal(model.isSelected(SAMPLE.AB.children[2]), false);
            });
        });
        test('Focus', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                assert(!model.getFocus());
                model.setFocus(SAMPLE.AB.children[1]);
                assert(model.isFocused(SAMPLE.AB.children[1]));
                assert(model.getFocus());
                model.setFocus(SAMPLE.AB.children[0]);
                assert(model.isFocused(SAMPLE.AB.children[0]));
                assert(model.getFocus());
                model.setFocus(SAMPLE.AB.children[2]);
                assert(model.isFocused(SAMPLE.AB.children[2]));
                assert(model.getFocus());
                model.setFocus();
                assert(!model.isFocused(SAMPLE.AB.children[0]));
                assert(!model.isFocused(SAMPLE.AB.children[1]));
                assert(!model.isFocused(SAMPLE.AB.children[2]));
                assert(!model.getFocus());
                model.setFocus(SAMPLE.AB.children[0]);
                assert(model.getFocus());
                assert(model.isFocused(SAMPLE.AB.children[0]));
                assert(!model.isFocused(SAMPLE.AB.children[1]));
                assert(!model.isFocused(SAMPLE.AB.children[2]));
                model.setFocus();
                assert(!model.getFocus());
                assert(!model.isFocused(SAMPLE.AB.children[0]));
                assert(!model.isFocused(SAMPLE.AB.children[1]));
                assert(!model.isFocused(SAMPLE.AB.children[2]));
                model.focusNext();
                assert(model.getFocus());
                assert(model.isFocused(SAMPLE.AB.children[0]));
                model.focusNext();
                assert(model.getFocus());
                assert(model.isFocused(SAMPLE.AB.children[1]));
                model.focusNext();
                assert(model.getFocus());
                assert(model.isFocused(SAMPLE.AB.children[2]));
                model.focusNext();
                assert(model.getFocus());
                assert(model.isFocused(SAMPLE.AB.children[2]));
                model.focusPrevious();
                assert(model.getFocus());
                assert(model.isFocused(SAMPLE.AB.children[1]));
                model.focusPrevious();
                assert(model.getFocus());
                assert(model.isFocused(SAMPLE.AB.children[0]));
                model.focusPrevious();
                assert(model.getFocus());
                assert(model.isFocused(SAMPLE.AB.children[0]));
                model.focusNext(2);
                assert(model.getFocus());
                assert(model.isFocused(SAMPLE.AB.children[2]));
                model.focusPrevious(4);
                assert(model.getFocus());
                assert(model.isFocused(SAMPLE.AB.children[0]));
                assert.equal(model.isFocused(SAMPLE.AB.children[0]), true);
                assert.equal(model.isFocused(SAMPLE.AB.children[2]), false);
                model.focusFirst();
                assert(model.isFocused(SAMPLE.AB.children[0]));
                model.focusNth(0);
                assert(model.isFocused(SAMPLE.AB.children[0]));
                model.focusNth(1);
                assert(model.isFocused(SAMPLE.AB.children[1]));
            });
        });
        test('Highlight', () => {
            return model.setInput(SAMPLE.AB).then(() => {
                assert(!model.getHighlight());
                model.setHighlight(SAMPLE.AB.children[1]);
                assert(model.isHighlighted(SAMPLE.AB.children[1]));
                assert(model.getHighlight());
                model.setHighlight(SAMPLE.AB.children[0]);
                assert(model.isHighlighted(SAMPLE.AB.children[0]));
                assert(model.getHighlight());
                model.setHighlight(SAMPLE.AB.children[2]);
                assert(model.isHighlighted(SAMPLE.AB.children[2]));
                assert(model.getHighlight());
                model.setHighlight();
                assert(!model.isHighlighted(SAMPLE.AB.children[0]));
                assert(!model.isHighlighted(SAMPLE.AB.children[1]));
                assert(!model.isHighlighted(SAMPLE.AB.children[2]));
                assert(!model.getHighlight());
                model.setHighlight(SAMPLE.AB.children[0]);
                assert(model.getHighlight());
                assert(model.isHighlighted(SAMPLE.AB.children[0]));
                assert(!model.isHighlighted(SAMPLE.AB.children[1]));
                assert(!model.isHighlighted(SAMPLE.AB.children[2]));
                assert.equal(model.isHighlighted(SAMPLE.AB.children[0]), true);
                assert.equal(model.isHighlighted(SAMPLE.AB.children[2]), false);
                model.setHighlight();
                assert(!model.getHighlight());
                assert(!model.isHighlighted(SAMPLE.AB.children[0]));
                assert(!model.isHighlighted(SAMPLE.AB.children[1]));
                assert(!model.isHighlighted(SAMPLE.AB.children[2]));
            });
        });
    });
    class DynamicModel {
        constructor() {
            this._onGetChildren = new event_1.Emitter();
            this.onGetChildren = this._onGetChildren.event;
            this._onDidGetChildren = new event_1.Emitter();
            this.onDidGetChildren = this._onDidGetChildren.event;
            this.data = { root: [] };
            this.promiseFactory = null;
        }
        addChild(parent, child) {
            if (!this.data[parent]) {
                this.data[parent] = [];
            }
            this.data[parent].push(child);
        }
        removeChild(parent, child) {
            this.data[parent].splice(this.data[parent].indexOf(child), 1);
            if (this.data[parent].length === 0) {
                delete this.data[parent];
            }
        }
        move(element, oldParent, newParent) {
            this.removeChild(oldParent, element);
            this.addChild(newParent, element);
        }
        rename(parent, oldName, newName) {
            this.removeChild(parent, oldName);
            this.addChild(parent, newName);
        }
        getId(tree, element) {
            return element;
        }
        hasChildren(tree, element) {
            return !!this.data[element];
        }
        getChildren(tree, element) {
            this._onGetChildren.fire(element);
            const result = this.promiseFactory ? this.promiseFactory() : Promise.resolve(null);
            return result.then(() => {
                this._onDidGetChildren.fire(element);
                return Promise.resolve(this.data[element]);
            });
        }
        getParent(tree, element) {
            throw new Error('Not implemented');
        }
    }
    suite('TreeModel - Dynamic data model', () => {
        let model;
        let dataModel;
        let counter;
        setup(() => {
            counter = new EventCounter();
            dataModel = new DynamicModel();
            model = new TreeModel({
                dataSource: dataModel,
            });
        });
        teardown(() => {
            counter.dispose();
            model.dispose();
        });
        test('items get property disposed', () => {
            dataModel.addChild('root', 'grandfather');
            dataModel.addChild('grandfather', 'father');
            dataModel.addChild('father', 'son');
            dataModel.addChild('father', 'daughter');
            dataModel.addChild('son', 'baby');
            return model.setInput('root').then(() => {
                return model.expandAll(['grandfather', 'father', 'son']).then(() => {
                    dataModel.removeChild('grandfather', 'father');
                    const items = ['baby', 'son', 'daughter', 'father'];
                    let times = 0;
                    counter.listen(model.onDidDisposeItem, item => {
                        assert.equal(items[times++], item.id);
                    });
                    return model.refresh().then(() => {
                        assert.equal(times, items.length);
                        assert.equal(counter.count, 4);
                    });
                });
            });
        });
        test('addChild, removeChild, collapse', () => {
            dataModel.addChild('root', 'super');
            dataModel.addChild('root', 'hyper');
            dataModel.addChild('root', 'mega');
            return model.setInput('root').then(() => {
                let nav = model.getNavigator();
                assert.equal(nav.next().id, 'super');
                assert.equal(nav.next().id, 'hyper');
                assert.equal(nav.next().id, 'mega');
                assert.equal(nav.next() && false, null);
                dataModel.removeChild('root', 'hyper');
                return model.refresh().then(() => {
                    nav = model.getNavigator();
                    assert.equal(nav.next().id, 'super');
                    assert.equal(nav.next().id, 'mega');
                    assert.equal(nav.next() && false, null);
                    dataModel.addChild('mega', 'micro');
                    dataModel.addChild('mega', 'nano');
                    dataModel.addChild('mega', 'pico');
                    return model.refresh().then(() => {
                        return model.expand('mega').then(() => {
                            nav = model.getNavigator();
                            assert.equal(nav.next().id, 'super');
                            assert.equal(nav.next().id, 'mega');
                            assert.equal(nav.next().id, 'micro');
                            assert.equal(nav.next().id, 'nano');
                            assert.equal(nav.next().id, 'pico');
                            assert.equal(nav.next() && false, null);
                            model.collapse('mega');
                            nav = model.getNavigator();
                            assert.equal(nav.next().id, 'super');
                            assert.equal(nav.next().id, 'mega');
                            assert.equal(nav.next() && false, null);
                        });
                    });
                });
            });
        });
        test('move', () => {
            dataModel.addChild('root', 'super');
            dataModel.addChild('super', 'apples');
            dataModel.addChild('super', 'bananas');
            dataModel.addChild('super', 'pears');
            dataModel.addChild('root', 'hyper');
            dataModel.addChild('root', 'mega');
            return model.setInput('root').then(() => {
                return model.expand('super').then(() => {
                    let nav = model.getNavigator();
                    assert.equal(nav.next().id, 'super');
                    assert.equal(nav.next().id, 'apples');
                    assert.equal(nav.next().id, 'bananas');
                    assert.equal(nav.next().id, 'pears');
                    assert.equal(nav.next().id, 'hyper');
                    assert.equal(nav.next().id, 'mega');
                    assert.equal(nav.next() && false, null);
                    dataModel.move('bananas', 'super', 'hyper');
                    dataModel.move('apples', 'super', 'mega');
                    return model.refresh().then(() => {
                        return model.expandAll(['hyper', 'mega']).then(() => {
                            nav = model.getNavigator();
                            assert.equal(nav.next().id, 'super');
                            assert.equal(nav.next().id, 'pears');
                            assert.equal(nav.next().id, 'hyper');
                            assert.equal(nav.next().id, 'bananas');
                            assert.equal(nav.next().id, 'mega');
                            assert.equal(nav.next().id, 'apples');
                            assert.equal(nav.next() && false, null);
                        });
                    });
                });
            });
        });
        test('refreshing grandfather recursively should not refresh collapsed father\'s children immediately', () => {
            dataModel.addChild('root', 'grandfather');
            dataModel.addChild('grandfather', 'father');
            dataModel.addChild('father', 'son');
            return model.setInput('root').then(() => {
                return model.expand('grandfather').then(() => {
                    return model.collapse('father').then(() => {
                        let times = 0;
                        let listener = dataModel.onGetChildren((element) => {
                            times++;
                            assert.equal(element, 'grandfather');
                        });
                        return model.refresh('grandfather').then(() => {
                            assert.equal(times, 1);
                            listener.dispose();
                            listener = dataModel.onGetChildren((element) => {
                                times++;
                                assert.equal(element, 'father');
                            });
                            return model.expand('father').then(() => {
                                assert.equal(times, 2);
                                listener.dispose();
                            });
                        });
                    });
                });
            });
        });
        test('simultaneously refreshing two disjoint elements should parallelize the refreshes', () => {
            dataModel.addChild('root', 'father');
            dataModel.addChild('root', 'mother');
            dataModel.addChild('father', 'son');
            dataModel.addChild('mother', 'daughter');
            return model.setInput('root').then(() => {
                return model.expand('father').then(() => {
                    return model.expand('mother').then(() => {
                        let nav = model.getNavigator();
                        assert.equal(nav.next().id, 'father');
                        assert.equal(nav.next().id, 'son');
                        assert.equal(nav.next().id, 'mother');
                        assert.equal(nav.next().id, 'daughter');
                        assert.equal(nav.next() && false, null);
                        dataModel.removeChild('father', 'son');
                        dataModel.removeChild('mother', 'daughter');
                        dataModel.addChild('father', 'brother');
                        dataModel.addChild('mother', 'sister');
                        dataModel.promiseFactory = () => { return async_1.timeout(0); };
                        let getTimes = 0;
                        let gotTimes = 0;
                        const getListener = dataModel.onGetChildren((element) => { getTimes++; });
                        const gotListener = dataModel.onDidGetChildren((element) => { gotTimes++; });
                        const p1 = model.refresh('father');
                        assert.equal(getTimes, 1);
                        assert.equal(gotTimes, 0);
                        const p2 = model.refresh('mother');
                        assert.equal(getTimes, 2);
                        assert.equal(gotTimes, 0);
                        return Promise.all([p1, p2]).then(() => {
                            assert.equal(getTimes, 2);
                            assert.equal(gotTimes, 2);
                            nav = model.getNavigator();
                            assert.equal(nav.next().id, 'father');
                            assert.equal(nav.next().id, 'brother');
                            assert.equal(nav.next().id, 'mother');
                            assert.equal(nav.next().id, 'sister');
                            assert.equal(nav.next() && false, null);
                            getListener.dispose();
                            gotListener.dispose();
                        });
                    });
                });
            });
        });
        test('simultaneously recursively refreshing two intersecting elements should concatenate the refreshes - ancestor first', () => {
            dataModel.addChild('root', 'grandfather');
            dataModel.addChild('grandfather', 'father');
            dataModel.addChild('father', 'son');
            return model.setInput('root').then(() => {
                return model.expand('grandfather').then(() => {
                    return model.expand('father').then(() => {
                        let nav = model.getNavigator();
                        assert.equal(nav.next().id, 'grandfather');
                        assert.equal(nav.next().id, 'father');
                        assert.equal(nav.next().id, 'son');
                        assert.equal(nav.next() && false, null);
                        let refreshTimes = 0;
                        counter.listen(model.onDidRefreshItem, (e) => { refreshTimes++; });
                        let getTimes = 0;
                        const getListener = dataModel.onGetChildren((element) => { getTimes++; });
                        let gotTimes = 0;
                        const gotListener = dataModel.onDidGetChildren((element) => { gotTimes++; });
                        const p1Completes = [];
                        dataModel.promiseFactory = () => { return new Promise((c) => { p1Completes.push(c); }); };
                        model.refresh('grandfather').then(() => {
                            // just a single get
                            assert.equal(refreshTimes, 1); // (+1) grandfather
                            assert.equal(getTimes, 1);
                            assert.equal(gotTimes, 0);
                            // unblock the first get
                            p1Completes.shift()();
                            // once the first get is unblocked, the second get should appear
                            assert.equal(refreshTimes, 2); // (+1) first father refresh
                            assert.equal(getTimes, 2);
                            assert.equal(gotTimes, 1);
                            let p2Complete;
                            dataModel.promiseFactory = () => { return new Promise((c) => { p2Complete = c; }); };
                            const p2 = model.refresh('father');
                            // same situation still
                            assert.equal(refreshTimes, 3); // (+1) second father refresh
                            assert.equal(getTimes, 2);
                            assert.equal(gotTimes, 1);
                            // unblock the second get
                            p1Completes.shift()();
                            // the third get should have appeared, it should've been waiting for the second one
                            assert.equal(refreshTimes, 4); // (+1) first son request
                            assert.equal(getTimes, 3);
                            assert.equal(gotTimes, 2);
                            p2Complete();
                            // all good
                            assert.equal(refreshTimes, 5); // (+1) second son request
                            assert.equal(getTimes, 3);
                            assert.equal(gotTimes, 3);
                            return p2.then(() => {
                                nav = model.getNavigator();
                                assert.equal(nav.next().id, 'grandfather');
                                assert.equal(nav.next().id, 'father');
                                assert.equal(nav.next().id, 'son');
                                assert.equal(nav.next() && false, null);
                                getListener.dispose();
                                gotListener.dispose();
                            });
                        });
                    });
                });
            });
        });
        test('refreshing an empty element that adds children should still keep it collapsed', () => {
            dataModel.addChild('root', 'grandfather');
            dataModel.addChild('grandfather', 'father');
            return model.setInput('root').then(() => {
                return model.expand('grandfather').then(() => {
                    return model.expand('father').then(() => {
                        assert(!model.isExpanded('father'));
                        dataModel.addChild('father', 'son');
                        return model.refresh('father').then(() => {
                            assert(!model.isExpanded('father'));
                        });
                    });
                });
            });
        });
        test('refreshing a collapsed element that adds children should still keep it collapsed', () => {
            dataModel.addChild('root', 'grandfather');
            dataModel.addChild('grandfather', 'father');
            dataModel.addChild('father', 'son');
            return model.setInput('root').then(() => {
                return model.expand('grandfather').then(() => {
                    return model.expand('father').then(() => {
                        return model.collapse('father').then(() => {
                            assert(!model.isExpanded('father'));
                            dataModel.addChild('father', 'daughter');
                            return model.refresh('father').then(() => {
                                assert(!model.isExpanded('father'));
                            });
                        });
                    });
                });
            });
        });
        test('recursively refreshing an ancestor of an expanded element, should keep that element expanded', () => {
            dataModel.addChild('root', 'grandfather');
            dataModel.addChild('grandfather', 'father');
            dataModel.addChild('father', 'son');
            return model.setInput('root').then(() => {
                return model.expand('grandfather').then(() => {
                    return model.expand('father').then(() => {
                        assert(model.isExpanded('grandfather'));
                        assert(model.isExpanded('father'));
                        return model.refresh('grandfather').then(() => {
                            assert(model.isExpanded('grandfather'));
                            assert(model.isExpanded('father'));
                        });
                    });
                });
            });
        });
        test('recursively refreshing an ancestor of a collapsed element, should keep that element collapsed', () => {
            dataModel.addChild('root', 'grandfather');
            dataModel.addChild('grandfather', 'father');
            dataModel.addChild('father', 'son');
            return model.setInput('root').then(() => {
                return model.expand('grandfather').then(() => {
                    return model.expand('father').then(() => {
                        return model.collapse('father').then(() => {
                            assert(model.isExpanded('grandfather'));
                            assert(!model.isExpanded('father'));
                            return model.refresh('grandfather').then(() => {
                                assert(model.isExpanded('grandfather'));
                                assert(!model.isExpanded('father'));
                            });
                        });
                    });
                });
            });
        });
        test('Bug 10855:[explorer] quickly deleting things causes NPE in tree - intersectsLock should always be called when trying to unlock', () => {
            dataModel.addChild('root', 'father');
            dataModel.addChild('father', 'son');
            dataModel.addChild('root', 'mother');
            dataModel.addChild('mother', 'daughter');
            return model.setInput('root').then(() => {
                // delay expansions and refreshes
                dataModel.promiseFactory = () => { return async_1.timeout(0); };
                const promises = [];
                promises.push(model.expand('father'));
                dataModel.removeChild('root', 'father');
                promises.push(model.refresh('root'));
                promises.push(model.expand('mother'));
                dataModel.removeChild('root', 'mother');
                promises.push(model.refresh('root'));
                return Promise.all(promises).then(() => {
                    assert(true, 'all good');
                }, (errs) => {
                    assert(false, 'should not fail');
                });
            });
        });
    });
    suite('TreeModel - bugs', () => {
        let counter;
        setup(() => {
            counter = new EventCounter();
        });
        teardown(() => {
            counter.dispose();
        });
        /**
         * This bug occurs when an item is expanded right during its removal
         */
        test('Bug 10566:[tree] build viewlet is broken after some time', () => {
            // setup
            let model = new TreeModel({
                dataSource: {
                    getId: (_, e) => e,
                    hasChildren: (_, e) => e === 'root' || e === 'bart',
                    getChildren: (_, e) => {
                        if (e === 'root') {
                            return getRootChildren();
                        }
                        if (e === 'bart') {
                            return getBartChildren();
                        }
                        return Promise.resolve([]);
                    },
                    getParent: (_, e) => { throw new Error('not implemented'); },
                }
            });
            let listeners = [];
            // helpers
            const getGetRootChildren = (children, millis = 0) => () => async_1.timeout(millis).then(() => children);
            let getRootChildren = getGetRootChildren(['homer', 'bart', 'lisa', 'marge', 'maggie'], 0);
            const getGetBartChildren = (millis = 0) => () => async_1.timeout(millis).then(() => ['milhouse', 'nelson']);
            const getBartChildren = getGetBartChildren(0);
            // item expanding should not exist!
            counter.listen(model.onExpandItem, () => { assert(false, 'should never receive item:expanding event'); });
            counter.listen(model.onDidExpandItem, () => { assert(false, 'should never receive item:expanded event'); });
            return model.setInput('root').then(() => {
                // remove bart
                getRootChildren = getGetRootChildren(['homer', 'lisa', 'marge', 'maggie'], 10);
                // refresh root
                const p1 = model.refresh('root', true).then(() => {
                    assert(true);
                }, () => {
                    assert(false, 'should never reach this');
                });
                // at the same time, try to expand bart!
                const p2 = model.expand('bart').then(() => {
                    assert(false, 'should never reach this');
                }, () => {
                    assert(true, 'bart should fail to expand since he was removed meanwhile');
                });
                // what now?
                return Promise.all([p1, p2]);
            }).then(() => {
                // teardown
                while (listeners.length > 0) {
                    listeners.pop()();
                }
                listeners = null;
                model.dispose();
                assert.equal(counter.count, 0);
            });
        });
        test('collapsed resolved parent should also update all children visibility on refresh', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const counter = new EventCounter();
                const dataModel = new DynamicModel();
                let isSonVisible = true;
                const filter = {
                    isVisible(_, element) {
                        return element !== 'son' || isSonVisible;
                    }
                };
                const model = new TreeModel({ dataSource: dataModel, filter });
                dataModel.addChild('root', 'father');
                dataModel.addChild('father', 'son');
                yield model.setInput('root');
                yield model.expand('father');
                let nav = model.getNavigator();
                assert.equal(nav.next().id, 'father');
                assert.equal(nav.next().id, 'son');
                assert.equal(nav.next(), null);
                yield model.collapse('father');
                isSonVisible = false;
                yield model.refresh(undefined, true);
                yield model.expand('father');
                nav = model.getNavigator();
                assert.equal(nav.next().id, 'father');
                assert.equal(nav.next(), null);
                counter.dispose();
                model.dispose();
            });
        });
    });
});
//# sourceMappingURL=treeModel.test.js.map