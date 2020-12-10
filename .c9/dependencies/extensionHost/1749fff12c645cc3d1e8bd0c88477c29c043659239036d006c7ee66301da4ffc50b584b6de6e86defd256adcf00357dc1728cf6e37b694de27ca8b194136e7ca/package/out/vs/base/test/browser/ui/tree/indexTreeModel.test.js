/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/iterator", "vs/base/browser/ui/tree/indexTreeModel"], function (require, exports, assert, iterator_1, indexTreeModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function toSpliceable(arr) {
        return {
            splice(start, deleteCount, elements) {
                arr.splice(start, deleteCount, ...elements);
            }
        };
    }
    function toArray(list) {
        return list.map(i => i.element);
    }
    suite('IndexTreeModel', function () {
        test('ctor', () => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1);
            assert(model);
            assert.equal(list.length, 0);
        });
        test('insert', () => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1);
            model.splice([0], 0, iterator_1.Iterator.fromArray([
                { element: 0 },
                { element: 1 },
                { element: 2 }
            ]));
            assert.deepEqual(list.length, 3);
            assert.deepEqual(list[0].element, 0);
            assert.deepEqual(list[0].collapsed, false);
            assert.deepEqual(list[0].depth, 1);
            assert.deepEqual(list[1].element, 1);
            assert.deepEqual(list[1].collapsed, false);
            assert.deepEqual(list[1].depth, 1);
            assert.deepEqual(list[2].element, 2);
            assert.deepEqual(list[2].collapsed, false);
            assert.deepEqual(list[2].depth, 1);
        });
        test('deep insert', function () {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1);
            model.splice([0], 0, iterator_1.Iterator.fromArray([
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
            assert.deepEqual(list.length, 6);
            assert.deepEqual(list[0].element, 0);
            assert.deepEqual(list[0].collapsed, false);
            assert.deepEqual(list[0].depth, 1);
            assert.deepEqual(list[1].element, 10);
            assert.deepEqual(list[1].collapsed, false);
            assert.deepEqual(list[1].depth, 2);
            assert.deepEqual(list[2].element, 11);
            assert.deepEqual(list[2].collapsed, false);
            assert.deepEqual(list[2].depth, 2);
            assert.deepEqual(list[3].element, 12);
            assert.deepEqual(list[3].collapsed, false);
            assert.deepEqual(list[3].depth, 2);
            assert.deepEqual(list[4].element, 1);
            assert.deepEqual(list[4].collapsed, false);
            assert.deepEqual(list[4].depth, 1);
            assert.deepEqual(list[5].element, 2);
            assert.deepEqual(list[5].collapsed, false);
            assert.deepEqual(list[5].depth, 1);
        });
        test('deep insert collapsed', function () {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1);
            model.splice([0], 0, iterator_1.Iterator.fromArray([
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
            assert.deepEqual(list.length, 3);
            assert.deepEqual(list[0].element, 0);
            assert.deepEqual(list[0].collapsed, true);
            assert.deepEqual(list[0].depth, 1);
            assert.deepEqual(list[1].element, 1);
            assert.deepEqual(list[1].collapsed, false);
            assert.deepEqual(list[1].depth, 1);
            assert.deepEqual(list[2].element, 2);
            assert.deepEqual(list[2].collapsed, false);
            assert.deepEqual(list[2].depth, 1);
        });
        test('delete', () => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1);
            model.splice([0], 0, iterator_1.Iterator.fromArray([
                { element: 0 },
                { element: 1 },
                { element: 2 }
            ]));
            assert.deepEqual(list.length, 3);
            model.splice([1], 1);
            assert.deepEqual(list.length, 2);
            assert.deepEqual(list[0].element, 0);
            assert.deepEqual(list[0].collapsed, false);
            assert.deepEqual(list[0].depth, 1);
            assert.deepEqual(list[1].element, 2);
            assert.deepEqual(list[1].collapsed, false);
            assert.deepEqual(list[1].depth, 1);
            model.splice([0], 2);
            assert.deepEqual(list.length, 0);
        });
        test('nested delete', function () {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1);
            model.splice([0], 0, iterator_1.Iterator.fromArray([
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
            assert.deepEqual(list.length, 6);
            model.splice([1], 2);
            assert.deepEqual(list.length, 4);
            assert.deepEqual(list[0].element, 0);
            assert.deepEqual(list[0].collapsed, false);
            assert.deepEqual(list[0].depth, 1);
            assert.deepEqual(list[1].element, 10);
            assert.deepEqual(list[1].collapsed, false);
            assert.deepEqual(list[1].depth, 2);
            assert.deepEqual(list[2].element, 11);
            assert.deepEqual(list[2].collapsed, false);
            assert.deepEqual(list[2].depth, 2);
            assert.deepEqual(list[3].element, 12);
            assert.deepEqual(list[3].collapsed, false);
            assert.deepEqual(list[3].depth, 2);
        });
        test('deep delete', function () {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1);
            model.splice([0], 0, iterator_1.Iterator.fromArray([
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
            assert.deepEqual(list.length, 6);
            model.splice([0], 1);
            assert.deepEqual(list.length, 2);
            assert.deepEqual(list[0].element, 1);
            assert.deepEqual(list[0].collapsed, false);
            assert.deepEqual(list[0].depth, 1);
            assert.deepEqual(list[1].element, 2);
            assert.deepEqual(list[1].collapsed, false);
            assert.deepEqual(list[1].depth, 1);
        });
        test('hidden delete', function () {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1);
            model.splice([0], 0, iterator_1.Iterator.fromArray([
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
            assert.deepEqual(list.length, 3);
            model.splice([0, 1], 1);
            assert.deepEqual(list.length, 3);
            model.splice([0, 0], 2);
            assert.deepEqual(list.length, 3);
        });
        test('collapse', () => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1);
            model.splice([0], 0, iterator_1.Iterator.fromArray([
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
            assert.deepEqual(list.length, 6);
            model.setCollapsed([0], true);
            assert.deepEqual(list.length, 3);
            assert.deepEqual(list[0].element, 0);
            assert.deepEqual(list[0].collapsed, true);
            assert.deepEqual(list[0].depth, 1);
            assert.deepEqual(list[1].element, 1);
            assert.deepEqual(list[1].collapsed, false);
            assert.deepEqual(list[1].depth, 1);
            assert.deepEqual(list[2].element, 2);
            assert.deepEqual(list[2].collapsed, false);
            assert.deepEqual(list[2].depth, 1);
        });
        test('expand', () => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1);
            model.splice([0], 0, iterator_1.Iterator.fromArray([
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
            assert.deepEqual(list.length, 3);
            model.setCollapsed([0], false);
            assert.deepEqual(list.length, 6);
            assert.deepEqual(list[0].element, 0);
            assert.deepEqual(list[0].collapsed, false);
            assert.deepEqual(list[0].depth, 1);
            assert.deepEqual(list[1].element, 10);
            assert.deepEqual(list[1].collapsed, false);
            assert.deepEqual(list[1].depth, 2);
            assert.deepEqual(list[2].element, 11);
            assert.deepEqual(list[2].collapsed, false);
            assert.deepEqual(list[2].depth, 2);
            assert.deepEqual(list[3].element, 12);
            assert.deepEqual(list[3].collapsed, false);
            assert.deepEqual(list[3].depth, 2);
            assert.deepEqual(list[4].element, 1);
            assert.deepEqual(list[4].collapsed, false);
            assert.deepEqual(list[4].depth, 1);
            assert.deepEqual(list[5].element, 2);
            assert.deepEqual(list[5].collapsed, false);
            assert.deepEqual(list[5].depth, 1);
        });
        test('collapse should recursively adjust visible count', function () {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1);
            model.splice([0], 0, iterator_1.Iterator.fromArray([
                {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                { element: 111 }
                            ]
                        }
                    ]
                },
                {
                    element: 2, children: [
                        { element: 21 }
                    ]
                }
            ]));
            assert.deepEqual(list.length, 5);
            assert.deepEqual(toArray(list), [1, 11, 111, 2, 21]);
            model.setCollapsed([0, 0], true);
            assert.deepEqual(list.length, 4);
            assert.deepEqual(toArray(list), [1, 11, 2, 21]);
            model.setCollapsed([1], true);
            assert.deepEqual(list.length, 3);
            assert.deepEqual(toArray(list), [1, 11, 2]);
        });
        test('simple filter', function () {
            const list = [];
            const filter = new class {
                filter(element) {
                    return element % 2 === 0 ? 1 /* Visible */ : 0 /* Hidden */;
                }
            };
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1, { filter });
            model.splice([0], 0, iterator_1.Iterator.fromArray([
                {
                    element: 0, children: [
                        { element: 1 },
                        { element: 2 },
                        { element: 3 },
                        { element: 4 },
                        { element: 5 },
                        { element: 6 },
                        { element: 7 }
                    ]
                }
            ]));
            assert.deepEqual(list.length, 4);
            assert.deepEqual(toArray(list), [0, 2, 4, 6]);
            model.setCollapsed([0], true);
            assert.deepEqual(toArray(list), [0]);
            model.setCollapsed([0], false);
            assert.deepEqual(toArray(list), [0, 2, 4, 6]);
        });
        test('recursive filter on initial model', function () {
            const list = [];
            const filter = new class {
                filter(element) {
                    return element === 0 ? 2 /* Recurse */ : 0 /* Hidden */;
                }
            };
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1, { filter });
            model.splice([0], 0, iterator_1.Iterator.fromArray([
                {
                    element: 0, children: [
                        { element: 1 },
                        { element: 2 }
                    ]
                }
            ]));
            assert.deepEqual(toArray(list), []);
        });
        test('refilter', function () {
            const list = [];
            let shouldFilter = false;
            const filter = new class {
                filter(element) {
                    return (!shouldFilter || element % 2 === 0) ? 1 /* Visible */ : 0 /* Hidden */;
                }
            };
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1, { filter });
            model.splice([0], 0, iterator_1.Iterator.fromArray([
                {
                    element: 0, children: [
                        { element: 1 },
                        { element: 2 },
                        { element: 3 },
                        { element: 4 },
                        { element: 5 },
                        { element: 6 },
                        { element: 7 }
                    ]
                },
            ]));
            assert.deepEqual(toArray(list), [0, 1, 2, 3, 4, 5, 6, 7]);
            model.refilter();
            assert.deepEqual(toArray(list), [0, 1, 2, 3, 4, 5, 6, 7]);
            shouldFilter = true;
            model.refilter();
            assert.deepEqual(toArray(list), [0, 2, 4, 6]);
            shouldFilter = false;
            model.refilter();
            assert.deepEqual(toArray(list), [0, 1, 2, 3, 4, 5, 6, 7]);
        });
        test('recursive filter', function () {
            const list = [];
            let query = new RegExp('');
            const filter = new class {
                filter(element) {
                    return query.test(element) ? 1 /* Visible */ : 2 /* Recurse */;
                }
            };
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), 'root', { filter });
            model.splice([0], 0, iterator_1.Iterator.fromArray([
                {
                    element: 'vscode', children: [
                        { element: '.build' },
                        { element: 'git' },
                        {
                            element: 'github', children: [
                                { element: 'calendar.yml' },
                                { element: 'endgame' },
                                { element: 'build.js' },
                            ]
                        },
                        {
                            element: 'build', children: [
                                { element: 'lib' },
                                { element: 'gulpfile.js' }
                            ]
                        }
                    ]
                },
            ]));
            assert.deepEqual(list.length, 10);
            query = /build/;
            model.refilter();
            assert.deepEqual(toArray(list), ['vscode', '.build', 'github', 'build.js', 'build']);
            model.setCollapsed([0], true);
            assert.deepEqual(toArray(list), ['vscode']);
            model.setCollapsed([0], false);
            assert.deepEqual(toArray(list), ['vscode', '.build', 'github', 'build.js', 'build']);
        });
        test('recursive filter with collapse', function () {
            const list = [];
            let query = new RegExp('');
            const filter = new class {
                filter(element) {
                    return query.test(element) ? 1 /* Visible */ : 2 /* Recurse */;
                }
            };
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), 'root', { filter });
            model.splice([0], 0, iterator_1.Iterator.fromArray([
                {
                    element: 'vscode', children: [
                        { element: '.build' },
                        { element: 'git' },
                        {
                            element: 'github', children: [
                                { element: 'calendar.yml' },
                                { element: 'endgame' },
                                { element: 'build.js' },
                            ]
                        },
                        {
                            element: 'build', children: [
                                { element: 'lib' },
                                { element: 'gulpfile.js' }
                            ]
                        }
                    ]
                },
            ]));
            assert.deepEqual(list.length, 10);
            query = /gulp/;
            model.refilter();
            assert.deepEqual(toArray(list), ['vscode', 'build', 'gulpfile.js']);
            model.setCollapsed([0, 3], true);
            assert.deepEqual(toArray(list), ['vscode', 'build']);
            model.setCollapsed([0], true);
            assert.deepEqual(toArray(list), ['vscode']);
        });
        test('recursive filter while collapsed', function () {
            const list = [];
            let query = new RegExp('');
            const filter = new class {
                filter(element) {
                    return query.test(element) ? 1 /* Visible */ : 2 /* Recurse */;
                }
            };
            const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), 'root', { filter });
            model.splice([0], 0, iterator_1.Iterator.fromArray([
                {
                    element: 'vscode', collapsed: true, children: [
                        { element: '.build' },
                        { element: 'git' },
                        {
                            element: 'github', children: [
                                { element: 'calendar.yml' },
                                { element: 'endgame' },
                                { element: 'build.js' },
                            ]
                        },
                        {
                            element: 'build', children: [
                                { element: 'lib' },
                                { element: 'gulpfile.js' }
                            ]
                        }
                    ]
                },
            ]));
            assert.deepEqual(toArray(list), ['vscode']);
            query = /gulp/;
            model.refilter();
            assert.deepEqual(toArray(list), ['vscode']);
            model.setCollapsed([0], false);
            assert.deepEqual(toArray(list), ['vscode', 'build', 'gulpfile.js']);
            model.setCollapsed([0], true);
            assert.deepEqual(toArray(list), ['vscode']);
            query = new RegExp('');
            model.refilter();
            assert.deepEqual(toArray(list), ['vscode']);
            model.setCollapsed([0], false);
            assert.deepEqual(list.length, 10);
        });
        suite('getNodeLocation', function () {
            test('simple', function () {
                const list = [];
                const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1);
                model.splice([0], 0, iterator_1.Iterator.fromArray([
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
                assert.deepEqual(model.getNodeLocation(list[0]), [0]);
                assert.deepEqual(model.getNodeLocation(list[1]), [0, 0]);
                assert.deepEqual(model.getNodeLocation(list[2]), [0, 1]);
                assert.deepEqual(model.getNodeLocation(list[3]), [0, 2]);
                assert.deepEqual(model.getNodeLocation(list[4]), [1]);
                assert.deepEqual(model.getNodeLocation(list[5]), [2]);
            });
            test('with filter', function () {
                const list = [];
                const filter = new class {
                    filter(element) {
                        return element % 2 === 0 ? 1 /* Visible */ : 0 /* Hidden */;
                    }
                };
                const model = new indexTreeModel_1.IndexTreeModel(toSpliceable(list), -1, { filter });
                model.splice([0], 0, iterator_1.Iterator.fromArray([
                    {
                        element: 0, children: [
                            { element: 1 },
                            { element: 2 },
                            { element: 3 },
                            { element: 4 },
                            { element: 5 },
                            { element: 6 },
                            { element: 7 }
                        ]
                    }
                ]));
                assert.deepEqual(model.getNodeLocation(list[0]), [0]);
                assert.deepEqual(model.getNodeLocation(list[1]), [0, 1]);
                assert.deepEqual(model.getNodeLocation(list[2]), [0, 3]);
                assert.deepEqual(model.getNodeLocation(list[3]), [0, 5]);
            });
        });
    });
});
//# sourceMappingURL=indexTreeModel.test.js.map