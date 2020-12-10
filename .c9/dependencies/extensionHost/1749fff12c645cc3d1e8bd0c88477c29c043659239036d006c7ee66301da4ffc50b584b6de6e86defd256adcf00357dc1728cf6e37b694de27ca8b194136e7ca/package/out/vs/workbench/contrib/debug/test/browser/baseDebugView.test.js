/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/base/browser/dom", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/test/common/mockDebug", "vs/base/browser/ui/highlightedlabel/highlightedLabel"], function (require, exports, assert, baseDebugView_1, dom, debugModel_1, mockDebug_1, highlightedLabel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    suite('Debug - Base Debug View', () => {
        test('replace whitespace', () => {
            assert.equal(baseDebugView_1.replaceWhitespace('hey there'), 'hey there');
            assert.equal(baseDebugView_1.replaceWhitespace('hey there\n'), 'hey there\\n');
            assert.equal(baseDebugView_1.replaceWhitespace('hey \r there\n\t'), 'hey \\r there\\n\\t');
            assert.equal(baseDebugView_1.replaceWhitespace('hey \r\t\n\t\t\n there'), 'hey \\r\\t\\n\\t\\t\\n there');
        });
        test('render expression value', () => {
            let container = $('.container');
            baseDebugView_1.renderExpressionValue('render \n me', container, { showHover: true, preserveWhitespace: true });
            assert.equal(container.className, 'value');
            assert.equal(container.title, 'render \n me');
            assert.equal(container.textContent, 'render \n me');
            const expression = new debugModel_1.Expression('console');
            expression.value = 'Object';
            container = $('.container');
            baseDebugView_1.renderExpressionValue(expression, container, { colorize: true });
            assert.equal(container.className, 'value unavailable error');
            expression.available = true;
            expression.value = '"string value"';
            container = $('.container');
            baseDebugView_1.renderExpressionValue(expression, container, { colorize: true });
            assert.equal(container.className, 'value string');
            assert.equal(container.textContent, '"string value"');
            expression.type = 'boolean';
            container = $('.container');
            baseDebugView_1.renderExpressionValue(expression, container, { colorize: true });
            assert.equal(container.className, 'value boolean');
            assert.equal(container.textContent, expression.value);
            expression.value = 'this is a long string';
            container = $('.container');
            baseDebugView_1.renderExpressionValue(expression, container, { colorize: true, maxValueLength: 4 });
            assert.equal(container.textContent, 'this...');
        });
        test('render variable', () => {
            const session = new mockDebug_1.MockSession();
            const thread = new debugModel_1.Thread(session, 'mockthread', 1);
            const stackFrame = new debugModel_1.StackFrame(thread, 1, null, 'app.js', 'normal', { startLineNumber: 1, startColumn: 1, endLineNumber: undefined, endColumn: undefined }, 0);
            const scope = new debugModel_1.Scope(stackFrame, 1, 'local', 1, false, 10, 10);
            let variable = new debugModel_1.Variable(session, scope, 2, 'foo', 'bar.foo', undefined, 0, 0, {}, 'string');
            let expression = $('.');
            let name = $('.');
            let value = $('.');
            let label = new highlightedLabel_1.HighlightedLabel(name, false);
            baseDebugView_1.renderVariable(variable, { expression, name, value, label }, false, []);
            assert.equal(label.element.textContent, 'foo');
            assert.equal(value.textContent, '');
            assert.equal(value.title, '');
            variable.value = 'hey';
            expression = $('.');
            name = $('.');
            value = $('.');
            baseDebugView_1.renderVariable(variable, { expression, name, value, label }, false, []);
            assert.equal(value.textContent, 'hey');
            assert.equal(label.element.textContent, 'foo:');
            assert.equal(label.element.title, 'string');
            variable = new debugModel_1.Variable(session, scope, 2, 'console', 'console', '5', 0, 0, { kind: 'virtual' });
            expression = $('.');
            name = $('.');
            value = $('.');
            baseDebugView_1.renderVariable(variable, { expression, name, value, label }, false, []);
            assert.equal(name.className, 'virtual');
            assert.equal(label.element.textContent, 'console:');
            assert.equal(label.element.title, 'console');
            assert.equal(value.className, 'value number');
        });
    });
});
//# sourceMappingURL=baseDebugView.test.js.map