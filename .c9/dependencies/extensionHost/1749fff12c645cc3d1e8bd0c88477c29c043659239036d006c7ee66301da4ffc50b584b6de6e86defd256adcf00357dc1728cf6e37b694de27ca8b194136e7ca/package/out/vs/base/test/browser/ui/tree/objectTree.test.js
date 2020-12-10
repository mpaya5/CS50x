/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/tree/objectTree", "vs/base/common/iterator"], function (require, exports, assert, objectTree_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ObjectTree', function () {
        suite('TreeNavigator', function () {
            let tree;
            let filter = (_) => true;
            setup(() => {
                const container = document.createElement('div');
                container.style.width = '200px';
                container.style.height = '200px';
                const delegate = new class {
                    getHeight() { return 20; }
                    getTemplateId() { return 'default'; }
                };
                const renderer = new class {
                    constructor() {
                        this.templateId = 'default';
                    }
                    renderTemplate(container) {
                        return container;
                    }
                    renderElement(element, index, templateData) {
                        templateData.textContent = `${element.element}`;
                    }
                    disposeTemplate() { }
                };
                tree = new objectTree_1.ObjectTree(container, delegate, [renderer], { filter: { filter: (el) => filter(el) } });
                tree.layout(200);
            });
            teardown(() => {
                tree.dispose();
                filter = (_) => true;
            });
            test('should be able to navigate', () => {
                tree.setChildren(null, iterator_1.Iterator.fromArray([
                    {
                        element: 0, children: iterator_1.Iterator.fromArray([
                            { element: 10 },
                            { element: 11 },
                            { element: 12 },
                        ])
                    },
                    { element: 1 },
                    { element: 2 }
                ]));
                const navigator = tree.navigate();
                assert.equal(navigator.current(), null);
                assert.equal(navigator.next(), 0);
                assert.equal(navigator.current(), 0);
                assert.equal(navigator.next(), 10);
                assert.equal(navigator.current(), 10);
                assert.equal(navigator.next(), 11);
                assert.equal(navigator.current(), 11);
                assert.equal(navigator.next(), 12);
                assert.equal(navigator.current(), 12);
                assert.equal(navigator.next(), 1);
                assert.equal(navigator.current(), 1);
                assert.equal(navigator.next(), 2);
                assert.equal(navigator.current(), 2);
                assert.equal(navigator.previous(), 1);
                assert.equal(navigator.current(), 1);
                assert.equal(navigator.previous(), 12);
                assert.equal(navigator.previous(), 11);
                assert.equal(navigator.previous(), 10);
                assert.equal(navigator.previous(), 0);
                assert.equal(navigator.previous(), null);
                assert.equal(navigator.next(), 0);
                assert.equal(navigator.next(), 10);
                assert.equal(navigator.parent(), 0);
                assert.equal(navigator.parent(), null);
                assert.equal(navigator.first(), 0);
                assert.equal(navigator.last(), 2);
            });
            test('should skip collapsed nodes', () => {
                tree.setChildren(null, iterator_1.Iterator.fromArray([
                    {
                        element: 0, collapsed: true, children: iterator_1.Iterator.fromArray([
                            { element: 10 },
                            { element: 11 },
                            { element: 12 },
                        ])
                    },
                    { element: 1 },
                    { element: 2 }
                ]));
                const navigator = tree.navigate();
                assert.equal(navigator.current(), null);
                assert.equal(navigator.next(), 0);
                assert.equal(navigator.next(), 1);
                assert.equal(navigator.next(), 2);
                assert.equal(navigator.next(), null);
                assert.equal(navigator.previous(), 2);
                assert.equal(navigator.previous(), 1);
                assert.equal(navigator.previous(), 0);
                assert.equal(navigator.previous(), null);
                assert.equal(navigator.next(), 0);
                assert.equal(navigator.parent(), null);
                assert.equal(navigator.first(), 0);
                assert.equal(navigator.last(), 2);
            });
            test('should skip filtered elements', () => {
                filter = el => el % 2 === 0;
                tree.setChildren(null, iterator_1.Iterator.fromArray([
                    {
                        element: 0, children: iterator_1.Iterator.fromArray([
                            { element: 10 },
                            { element: 11 },
                            { element: 12 },
                        ])
                    },
                    { element: 1 },
                    { element: 2 }
                ]));
                const navigator = tree.navigate();
                assert.equal(navigator.current(), null);
                assert.equal(navigator.next(), 0);
                assert.equal(navigator.next(), 10);
                assert.equal(navigator.next(), 12);
                assert.equal(navigator.next(), 2);
                assert.equal(navigator.next(), null);
                assert.equal(navigator.previous(), 2);
                assert.equal(navigator.previous(), 12);
                assert.equal(navigator.previous(), 10);
                assert.equal(navigator.previous(), 0);
                assert.equal(navigator.previous(), null);
                assert.equal(navigator.next(), 0);
                assert.equal(navigator.next(), 10);
                assert.equal(navigator.parent(), 0);
                assert.equal(navigator.parent(), null);
                assert.equal(navigator.first(), 0);
                assert.equal(navigator.last(), 2);
            });
            test('should be able to start from node', () => {
                tree.setChildren(null, iterator_1.Iterator.fromArray([
                    {
                        element: 0, children: iterator_1.Iterator.fromArray([
                            { element: 10 },
                            { element: 11 },
                            { element: 12 },
                        ])
                    },
                    { element: 1 },
                    { element: 2 }
                ]));
                const navigator = tree.navigate(1);
                assert.equal(navigator.current(), 1);
                assert.equal(navigator.next(), 2);
                assert.equal(navigator.current(), 2);
                assert.equal(navigator.previous(), 1);
                assert.equal(navigator.current(), 1);
                assert.equal(navigator.previous(), 12);
                assert.equal(navigator.previous(), 11);
                assert.equal(navigator.previous(), 10);
                assert.equal(navigator.previous(), 0);
                assert.equal(navigator.previous(), null);
                assert.equal(navigator.next(), 0);
                assert.equal(navigator.next(), 10);
                assert.equal(navigator.parent(), 0);
                assert.equal(navigator.parent(), null);
                assert.equal(navigator.first(), 0);
                assert.equal(navigator.last(), 2);
            });
        });
        test('traits are preserved according to string identity', function () {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const delegate = new class {
                getHeight() { return 20; }
                getTemplateId() { return 'default'; }
            };
            const renderer = new class {
                constructor() {
                    this.templateId = 'default';
                }
                renderTemplate(container) {
                    return container;
                }
                renderElement(element, index, templateData) {
                    templateData.textContent = `${element.element}`;
                }
                disposeTemplate() { }
            };
            const identityProvider = new class {
                getId(element) {
                    return `${element % 100}`;
                }
            };
            const tree = new objectTree_1.ObjectTree(container, delegate, [renderer], { identityProvider });
            tree.layout(200);
            tree.setChildren(null, [{ element: 0 }, { element: 1 }, { element: 2 }, { element: 3 }]);
            tree.setFocus([1]);
            assert.deepStrictEqual(tree.getFocus(), [1]);
            tree.setChildren(null, [{ element: 100 }, { element: 101 }, { element: 102 }, { element: 103 }]);
            assert.deepStrictEqual(tree.getFocus(), [101]);
        });
    });
});
//# sourceMappingURL=objectTree.test.js.map