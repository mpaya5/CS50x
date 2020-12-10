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
define(["require", "exports", "assert", "vs/workbench/api/browser/mainThreadDocuments", "vs/editor/common/model/textModel", "vs/base/common/async"], function (require, exports, assert, mainThreadDocuments_1, textModel_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('BoundModelReferenceCollection', () => {
        let col = new mainThreadDocuments_1.BoundModelReferenceCollection(15, 75);
        teardown(() => {
            col.dispose();
        });
        test('max age', () => __awaiter(this, void 0, void 0, function* () {
            let didDispose = false;
            col.add({
                object: { textEditorModel: textModel_1.TextModel.createFromString('farboo') },
                dispose() {
                    didDispose = true;
                }
            });
            yield async_1.timeout(30);
            assert.equal(didDispose, true);
        }));
        test('max size', () => {
            let disposed = [];
            col.add({
                object: { textEditorModel: textModel_1.TextModel.createFromString('farboo') },
                dispose() {
                    disposed.push(0);
                }
            });
            col.add({
                object: { textEditorModel: textModel_1.TextModel.createFromString('boofar') },
                dispose() {
                    disposed.push(1);
                }
            });
            col.add({
                object: { textEditorModel: textModel_1.TextModel.createFromString(new Array(71).join('x')) },
                dispose() {
                    disposed.push(2);
                }
            });
            assert.deepEqual(disposed, [0, 1]);
        });
    });
});
//# sourceMappingURL=mainThreadDocuments.test.js.map