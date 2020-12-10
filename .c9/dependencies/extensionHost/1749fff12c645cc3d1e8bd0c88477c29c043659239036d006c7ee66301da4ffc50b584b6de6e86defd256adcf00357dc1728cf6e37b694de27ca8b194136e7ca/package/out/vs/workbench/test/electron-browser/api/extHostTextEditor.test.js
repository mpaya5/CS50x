var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "assert", "vs/workbench/api/common/extHostTypes", "vs/editor/common/config/editorOptions", "vs/workbench/api/common/extHostTextEditor", "vs/workbench/api/common/extHostDocumentData", "vs/base/common/uri", "vs/workbench/test/electron-browser/api/mock"], function (require, exports, assert, extHostTypes_1, editorOptions_1, extHostTextEditor_1, extHostDocumentData_1, uri_1, mock_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostTextEditor', () => {
        let editor;
        let doc = new extHostDocumentData_1.ExtHostDocumentData(undefined, uri_1.URI.file(''), [
            'aaaa bbbb+cccc abc'
        ], '\n', 'text', 1, false);
        setup(() => {
            editor = new extHostTextEditor_1.ExtHostTextEditor(null, 'fake', doc, [], { cursorStyle: 0, insertSpaces: true, lineNumbers: 1, tabSize: 4, indentSize: 4 }, [], 1);
        });
        test('disposed editor', () => {
            assert.ok(editor.document);
            editor._acceptViewColumn(3);
            assert.equal(3, editor.viewColumn);
            editor.dispose();
            assert.throws(() => editor._acceptViewColumn(2));
            assert.equal(3, editor.viewColumn);
            assert.ok(editor.document);
            assert.throws(() => editor._acceptOptions(null));
            assert.throws(() => editor._acceptSelections([]));
        });
        test('API [bug]: registerTextEditorCommand clears redo stack even if no edits are made #55163', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let applyCount = 0;
                let editor = new extHostTextEditor_1.ExtHostTextEditor(new class extends mock_1.mock() {
                    $tryApplyEdits() {
                        applyCount += 1;
                        return Promise.resolve(true);
                    }
                }, 'edt1', doc, [], { cursorStyle: 0, insertSpaces: true, lineNumbers: 1, tabSize: 4, indentSize: 4 }, [], 1);
                yield editor.edit(edit => { });
                assert.equal(applyCount, 0);
                yield editor.edit(edit => { edit.setEndOfLine(1); });
                assert.equal(applyCount, 1);
                yield editor.edit(edit => { edit.delete(new extHostTypes_1.Range(0, 0, 1, 1)); });
                assert.equal(applyCount, 2);
            });
        });
    });
    suite('ExtHostTextEditorOptions', () => {
        let opts;
        let calls = [];
        setup(() => {
            calls = [];
            let mockProxy = {
                dispose: undefined,
                $trySetOptions: (id, options) => {
                    assert.equal(id, '1');
                    calls.push(options);
                    return Promise.resolve(undefined);
                },
                $tryShowTextDocument: undefined,
                $registerTextEditorDecorationType: undefined,
                $removeTextEditorDecorationType: undefined,
                $tryShowEditor: undefined,
                $tryHideEditor: undefined,
                $trySetDecorations: undefined,
                $trySetDecorationsFast: undefined,
                $tryRevealRange: undefined,
                $trySetSelections: undefined,
                $tryApplyEdits: undefined,
                $tryApplyWorkspaceEdit: undefined,
                $tryInsertSnippet: undefined,
                $getDiffInformation: undefined
            };
            opts = new extHostTextEditor_1.ExtHostTextEditorOptions(mockProxy, '1', {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
        });
        teardown(() => {
            opts = null;
            calls = null;
        });
        function assertState(opts, expected) {
            let actual = {
                tabSize: opts.tabSize,
                indentSize: opts.indentSize,
                insertSpaces: opts.insertSpaces,
                cursorStyle: opts.cursorStyle,
                lineNumbers: opts.lineNumbers
            };
            assert.deepEqual(actual, expected);
        }
        test('can set tabSize to the same value', () => {
            opts.tabSize = 4;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('can change tabSize to positive integer', () => {
            opts.tabSize = 1;
            assertState(opts, {
                tabSize: 1,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, [{ tabSize: 1 }]);
        });
        test('can change tabSize to positive float', () => {
            opts.tabSize = 2.3;
            assertState(opts, {
                tabSize: 2,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, [{ tabSize: 2 }]);
        });
        test('can change tabSize to a string number', () => {
            opts.tabSize = '2';
            assertState(opts, {
                tabSize: 2,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, [{ tabSize: 2 }]);
        });
        test('tabSize can request indentation detection', () => {
            opts.tabSize = 'auto';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, [{ tabSize: 'auto' }]);
        });
        test('ignores invalid tabSize 1', () => {
            opts.tabSize = null;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('ignores invalid tabSize 2', () => {
            opts.tabSize = -5;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('ignores invalid tabSize 3', () => {
            opts.tabSize = 'hello';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('ignores invalid tabSize 4', () => {
            opts.tabSize = '-17';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('can set indentSize to the same value', () => {
            opts.indentSize = 4;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('can change indentSize to positive integer', () => {
            opts.indentSize = 1;
            assertState(opts, {
                tabSize: 4,
                indentSize: 1,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, [{ indentSize: 1 }]);
        });
        test('can change indentSize to positive float', () => {
            opts.indentSize = 2.3;
            assertState(opts, {
                tabSize: 4,
                indentSize: 2,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, [{ indentSize: 2 }]);
        });
        test('can change indentSize to a string number', () => {
            opts.indentSize = '2';
            assertState(opts, {
                tabSize: 4,
                indentSize: 2,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, [{ indentSize: 2 }]);
        });
        test('indentSize can request to use tabSize', () => {
            opts.indentSize = 'tabSize';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, [{ indentSize: 'tabSize' }]);
        });
        test('indentSize cannot request indentation detection', () => {
            opts.indentSize = 'auto';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('ignores invalid indentSize 1', () => {
            opts.indentSize = null;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('ignores invalid indentSize 2', () => {
            opts.indentSize = -5;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('ignores invalid indentSize 3', () => {
            opts.indentSize = 'hello';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('ignores invalid indentSize 4', () => {
            opts.indentSize = '-17';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('can set insertSpaces to the same value', () => {
            opts.insertSpaces = false;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('can set insertSpaces to boolean', () => {
            opts.insertSpaces = true;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: true,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, [{ insertSpaces: true }]);
        });
        test('can set insertSpaces to false string', () => {
            opts.insertSpaces = 'false';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('can set insertSpaces to truey', () => {
            opts.insertSpaces = 'hello';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: true,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, [{ insertSpaces: true }]);
        });
        test('insertSpaces can request indentation detection', () => {
            opts.insertSpaces = 'auto';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, [{ insertSpaces: 'auto' }]);
        });
        test('can set cursorStyle to same value', () => {
            opts.cursorStyle = editorOptions_1.TextEditorCursorStyle.Line;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('can change cursorStyle', () => {
            opts.cursorStyle = editorOptions_1.TextEditorCursorStyle.Block;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Block,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, [{ cursorStyle: editorOptions_1.TextEditorCursorStyle.Block }]);
        });
        test('can set lineNumbers to same value', () => {
            opts.lineNumbers = extHostTypes_1.TextEditorLineNumbersStyle.On;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('can change lineNumbers', () => {
            opts.lineNumbers = extHostTypes_1.TextEditorLineNumbersStyle.Off;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 0 /* Off */
            });
            assert.deepEqual(calls, [{ lineNumbers: 0 /* Off */ }]);
        });
        test('can do bulk updates 0', () => {
            opts.assign({
                tabSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: extHostTypes_1.TextEditorLineNumbersStyle.On
            });
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, []);
        });
        test('can do bulk updates 1', () => {
            opts.assign({
                tabSize: 'auto',
                insertSpaces: true
            });
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: true,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, [{ tabSize: 'auto', insertSpaces: true }]);
        });
        test('can do bulk updates 2', () => {
            opts.assign({
                tabSize: 3,
                insertSpaces: 'auto'
            });
            assertState(opts, {
                tabSize: 3,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* On */
            });
            assert.deepEqual(calls, [{ tabSize: 3, insertSpaces: 'auto' }]);
        });
        test('can do bulk updates 3', () => {
            opts.assign({
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Block,
                lineNumbers: extHostTypes_1.TextEditorLineNumbersStyle.Relative
            });
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Block,
                lineNumbers: 2 /* Relative */
            });
            assert.deepEqual(calls, [{ cursorStyle: editorOptions_1.TextEditorCursorStyle.Block, lineNumbers: 2 /* Relative */ }]);
        });
    });
});
//# sourceMappingURL=extHostTextEditor.test.js.map