/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/tree/compressedObjectTreeModel", "vs/base/common/iterator"], function (require, exports, assert, compressedObjectTreeModel_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function resolve(treeElement) {
        const result = { element: treeElement.element };
        const children = iterator_1.Iterator.collect(iterator_1.Iterator.map(iterator_1.Iterator.from(treeElement.children), resolve));
        if (treeElement.incompressible) {
            result.incompressible = true;
        }
        if (children.length > 0) {
            result.children = children;
        }
        return result;
    }
    suite('CompressedObjectTree', function () {
        suite('compress & decompress', function () {
            test('small', function () {
                const decompressed = { element: 1 };
                const compressed = { element: { elements: [1], incompressible: false } };
                assert.deepEqual(resolve(compressedObjectTreeModel_1.compress(decompressed)), compressed);
                assert.deepEqual(resolve(compressedObjectTreeModel_1.decompress(compressed)), decompressed);
            });
            test('no compression', function () {
                const decompressed = {
                    element: 1, children: [
                        { element: 11 },
                        { element: 12 },
                        { element: 13 }
                    ]
                };
                const compressed = {
                    element: { elements: [1], incompressible: false },
                    children: [
                        { element: { elements: [11], incompressible: false } },
                        { element: { elements: [12], incompressible: false } },
                        { element: { elements: [13], incompressible: false } }
                    ]
                };
                assert.deepEqual(resolve(compressedObjectTreeModel_1.compress(decompressed)), compressed);
                assert.deepEqual(resolve(compressedObjectTreeModel_1.decompress(compressed)), decompressed);
            });
            test('single hierarchy', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, children: [
                                        { element: 1111 }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1, 11, 111, 1111], incompressible: false }
                };
                assert.deepEqual(resolve(compressedObjectTreeModel_1.compress(decompressed)), compressed);
                assert.deepEqual(resolve(compressedObjectTreeModel_1.decompress(compressed)), decompressed);
            });
            test('deep compression', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, children: [
                                        { element: 1111 },
                                        { element: 1112 },
                                        { element: 1113 },
                                        { element: 1114 },
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1, 11, 111], incompressible: false },
                    children: [
                        { element: { elements: [1111], incompressible: false } },
                        { element: { elements: [1112], incompressible: false } },
                        { element: { elements: [1113], incompressible: false } },
                        { element: { elements: [1114], incompressible: false } },
                    ]
                };
                assert.deepEqual(resolve(compressedObjectTreeModel_1.compress(decompressed)), compressed);
                assert.deepEqual(resolve(compressedObjectTreeModel_1.decompress(compressed)), decompressed);
            });
            test('double deep compression', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, children: [
                                        { element: 1112 },
                                        { element: 1113 },
                                    ]
                                }
                            ]
                        },
                        {
                            element: 12, children: [
                                {
                                    element: 121, children: [
                                        { element: 1212 },
                                        { element: 1213 },
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1], incompressible: false },
                    children: [
                        {
                            element: { elements: [11, 111], incompressible: false },
                            children: [
                                { element: { elements: [1112], incompressible: false } },
                                { element: { elements: [1113], incompressible: false } },
                            ]
                        },
                        {
                            element: { elements: [12, 121], incompressible: false },
                            children: [
                                { element: { elements: [1212], incompressible: false } },
                                { element: { elements: [1213], incompressible: false } },
                            ]
                        }
                    ]
                };
                assert.deepEqual(resolve(compressedObjectTreeModel_1.compress(decompressed)), compressed);
                assert.deepEqual(resolve(compressedObjectTreeModel_1.decompress(compressed)), decompressed);
            });
            test('incompressible leaf', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, children: [
                                        { element: 1111, incompressible: true }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1, 11, 111], incompressible: false },
                    children: [
                        { element: { elements: [1111], incompressible: true } }
                    ]
                };
                assert.deepEqual(resolve(compressedObjectTreeModel_1.compress(decompressed)), compressed);
                assert.deepEqual(resolve(compressedObjectTreeModel_1.decompress(compressed)), decompressed);
            });
            test('incompressible branch', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, incompressible: true, children: [
                                        { element: 1111 }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1, 11], incompressible: false },
                    children: [
                        { element: { elements: [111, 1111], incompressible: true } }
                    ]
                };
                assert.deepEqual(resolve(compressedObjectTreeModel_1.compress(decompressed)), compressed);
                assert.deepEqual(resolve(compressedObjectTreeModel_1.decompress(compressed)), decompressed);
            });
            test('incompressible chain', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, incompressible: true, children: [
                                        { element: 1111, incompressible: true }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1, 11], incompressible: false },
                    children: [
                        {
                            element: { elements: [111], incompressible: true },
                            children: [
                                { element: { elements: [1111], incompressible: true } }
                            ]
                        }
                    ]
                };
                assert.deepEqual(resolve(compressedObjectTreeModel_1.compress(decompressed)), compressed);
                assert.deepEqual(resolve(compressedObjectTreeModel_1.decompress(compressed)), decompressed);
            });
            test('incompressible tree', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, incompressible: true, children: [
                                {
                                    element: 111, incompressible: true, children: [
                                        { element: 1111, incompressible: true }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1], incompressible: false },
                    children: [
                        {
                            element: { elements: [11], incompressible: true },
                            children: [
                                {
                                    element: { elements: [111], incompressible: true },
                                    children: [
                                        { element: { elements: [1111], incompressible: true } }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                assert.deepEqual(resolve(compressedObjectTreeModel_1.compress(decompressed)), compressed);
                assert.deepEqual(resolve(compressedObjectTreeModel_1.decompress(compressed)), decompressed);
            });
        });
        function toSpliceable(arr) {
            return {
                splice(start, deleteCount, elements) {
                    arr.splice(start, deleteCount, ...elements);
                }
            };
        }
        function toArray(list) {
            return list.map(i => i.element.elements);
        }
        suite('CompressedObjectTreeModel', function () {
            test('ctor', () => {
                const list = [];
                const model = new compressedObjectTreeModel_1.CompressedTreeModel(toSpliceable(list));
                assert(model);
                assert.equal(list.length, 0);
                assert.equal(model.size, 0);
            });
            test('flat', () => {
                const list = [];
                const model = new compressedObjectTreeModel_1.CompressedTreeModel(toSpliceable(list));
                model.setChildren(null, iterator_1.Iterator.fromArray([
                    { element: 0 },
                    { element: 1 },
                    { element: 2 }
                ]));
                assert.deepEqual(toArray(list), [[0], [1], [2]]);
                assert.equal(model.size, 3);
                model.setChildren(null, iterator_1.Iterator.fromArray([
                    { element: 3 },
                    { element: 4 },
                    { element: 5 },
                ]));
                assert.deepEqual(toArray(list), [[3], [4], [5]]);
                assert.equal(model.size, 3);
                model.setChildren(null, iterator_1.Iterator.empty());
                assert.deepEqual(toArray(list), []);
                assert.equal(model.size, 0);
            });
            test('nested', () => {
                const list = [];
                const model = new compressedObjectTreeModel_1.CompressedTreeModel(toSpliceable(list));
                model.setChildren(null, iterator_1.Iterator.fromArray([
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
                assert.deepEqual(toArray(list), [[0], [10], [11], [12], [1], [2]]);
                assert.equal(model.size, 6);
                model.setChildren(12, iterator_1.Iterator.fromArray([
                    { element: 120 },
                    { element: 121 }
                ]));
                assert.deepEqual(toArray(list), [[0], [10], [11], [12], [120], [121], [1], [2]]);
                assert.equal(model.size, 8);
                model.setChildren(0, iterator_1.Iterator.empty());
                assert.deepEqual(toArray(list), [[0], [1], [2]]);
                assert.equal(model.size, 3);
                model.setChildren(null, iterator_1.Iterator.empty());
                assert.deepEqual(toArray(list), []);
                assert.equal(model.size, 0);
            });
            test('compressed', () => {
                const list = [];
                const model = new compressedObjectTreeModel_1.CompressedTreeModel(toSpliceable(list));
                model.setChildren(null, iterator_1.Iterator.fromArray([
                    {
                        element: 1, children: iterator_1.Iterator.fromArray([{
                                element: 11, children: iterator_1.Iterator.fromArray([{
                                        element: 111, children: iterator_1.Iterator.fromArray([
                                            { element: 1111 },
                                            { element: 1112 },
                                            { element: 1113 },
                                        ])
                                    }])
                            }])
                    }
                ]));
                assert.deepEqual(toArray(list), [[1, 11, 111], [1111], [1112], [1113]]);
                assert.equal(model.size, 6);
                model.setChildren(11, iterator_1.Iterator.fromArray([
                    { element: 111 },
                    { element: 112 },
                    { element: 113 },
                ]));
                assert.deepEqual(toArray(list), [[1, 11], [111], [112], [113]]);
                assert.equal(model.size, 5);
                model.setChildren(113, iterator_1.Iterator.fromArray([
                    { element: 1131 }
                ]));
                assert.deepEqual(toArray(list), [[1, 11], [111], [112], [113, 1131]]);
                assert.equal(model.size, 6);
                model.setChildren(1131, iterator_1.Iterator.fromArray([
                    { element: 1132 }
                ]));
                assert.deepEqual(toArray(list), [[1, 11], [111], [112], [113, 1131, 1132]]);
                assert.equal(model.size, 7);
                model.setChildren(1131, iterator_1.Iterator.fromArray([
                    { element: 1132 },
                    { element: 1133 },
                ]));
                assert.deepEqual(toArray(list), [[1, 11], [111], [112], [113, 1131], [1132], [1133]]);
                assert.equal(model.size, 8);
            });
        });
    });
});
//# sourceMappingURL=compressedObjectTreeModel.test.js.map