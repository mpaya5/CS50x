define(["require", "exports", "vs/editor/common/core/selection", "vs/editor/common/modes", "vs/editor/common/modes/languageConfigurationRegistry", "vs/editor/contrib/linesOperations/moveLinesCommand", "vs/editor/test/browser/testCommand", "vs/editor/test/common/mocks/mockMode"], function (require, exports, selection_1, modes_1, languageConfigurationRegistry_1, moveLinesCommand_1, testCommand_1, mockMode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function testMoveLinesDownCommand(lines, selection, expectedLines, expectedSelection) {
        testCommand_1.testCommand(lines, null, selection, (sel) => new moveLinesCommand_1.MoveLinesCommand(sel, true, false), expectedLines, expectedSelection);
    }
    function testMoveLinesUpCommand(lines, selection, expectedLines, expectedSelection) {
        testCommand_1.testCommand(lines, null, selection, (sel) => new moveLinesCommand_1.MoveLinesCommand(sel, false, false), expectedLines, expectedSelection);
    }
    function testMoveLinesDownWithIndentCommand(languageId, lines, selection, expectedLines, expectedSelection) {
        testCommand_1.testCommand(lines, languageId, selection, (sel) => new moveLinesCommand_1.MoveLinesCommand(sel, true, true), expectedLines, expectedSelection);
    }
    function testMoveLinesUpWithIndentCommand(languageId, lines, selection, expectedLines, expectedSelection) {
        testCommand_1.testCommand(lines, languageId, selection, (sel) => new moveLinesCommand_1.MoveLinesCommand(sel, false, true), expectedLines, expectedSelection);
    }
    suite('Editor Contrib - Move Lines Command', () => {
        test('move first up / last down disabled', function () {
            testMoveLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 1, 1), [
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 1, 1));
            testMoveLinesDownCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 1, 5, 1), [
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 1, 5, 1));
        });
        test('move first line down', function () {
            testMoveLinesDownCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 4, 1, 1), [
                'second line',
                'first',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 4, 2, 1));
        });
        test('move 2nd line up', function () {
            testMoveLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 2, 1), [
                'second line',
                'first',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 1, 1));
        });
        test('issue #1322a: move 2nd line up', function () {
            testMoveLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 12, 2, 12), [
                'second line',
                'first',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 12, 1, 12));
        });
        test('issue #1322b: move last line up', function () {
            testMoveLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 6, 5, 6), [
                'first',
                'second line',
                'third line',
                'fifth',
                'fourth line'
            ], new selection_1.Selection(4, 6, 4, 6));
        });
        test('issue #1322c: move last line selected up', function () {
            testMoveLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 6, 5, 1), [
                'first',
                'second line',
                'third line',
                'fifth',
                'fourth line'
            ], new selection_1.Selection(4, 6, 4, 1));
        });
        test('move last line up', function () {
            testMoveLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 1, 5, 1), [
                'first',
                'second line',
                'third line',
                'fifth',
                'fourth line'
            ], new selection_1.Selection(4, 1, 4, 1));
        });
        test('move 4th line down', function () {
            testMoveLinesDownCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(4, 1, 4, 1), [
                'first',
                'second line',
                'third line',
                'fifth',
                'fourth line'
            ], new selection_1.Selection(5, 1, 5, 1));
        });
        test('move multiple lines down', function () {
            testMoveLinesDownCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(4, 4, 2, 2), [
                'first',
                'fifth',
                'second line',
                'third line',
                'fourth line'
            ], new selection_1.Selection(5, 4, 3, 2));
        });
        test('invisible selection is ignored', function () {
            testMoveLinesDownCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 1, 1), [
                'second line',
                'first',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(3, 1, 2, 1));
        });
    });
    class IndentRulesMode extends mockMode_1.MockMode {
        constructor(indentationRules) {
            super(IndentRulesMode._id);
            this._register(languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(this.getLanguageIdentifier(), {
                indentationRules: indentationRules
            }));
        }
    }
    IndentRulesMode._id = new modes_1.LanguageIdentifier('moveLinesIndentMode', 7);
    suite('Editor contrib - Move Lines Command honors Indentation Rules', () => {
        let indentRules = {
            decreaseIndentPattern: /^\s*((?!\S.*\/[*]).*[*]\/\s*)?[})\]]|^\s*(case\b.*|default):\s*(\/\/.*|\/[*].*[*]\/\s*)?$/,
            increaseIndentPattern: /(\{[^}"'`]*|\([^)"']*|\[[^\]"']*|^\s*(\{\}|\(\)|\[\]|(case\b.*|default):))\s*(\/\/.*|\/[*].*[*]\/\s*)?$/,
            indentNextLinePattern: /^\s*(for|while|if|else)\b(?!.*[;{}]\s*(\/\/.*|\/[*].*[*]\/\s*)?$)/,
            unIndentedLinePattern: /^(?!.*([;{}]|\S:)\s*(\/\/.*|\/[*].*[*]\/\s*)?$)(?!.*(\{[^}"']*|\([^)"']*|\[[^\]"']*|^\s*(\{\}|\(\)|\[\]|(case\b.*|default):))\s*(\/\/.*|\/[*].*[*]\/\s*)?$)(?!^\s*((?!\S.*\/[*]).*[*]\/\s*)?[})\]]|^\s*(case\b.*|default):\s*(\/\/.*|\/[*].*[*]\/\s*)?$)(?!^\s*(for|while|if|else)\b(?!.*[;{}]\s*(\/\/.*|\/[*].*[*]\/\s*)?$))/
        };
        // https://github.com/Microsoft/vscode/issues/28552#issuecomment-307862797
        test('first line indentation adjust to 0', () => {
            let mode = new IndentRulesMode(indentRules);
            testMoveLinesUpWithIndentCommand(mode.getLanguageIdentifier(), [
                'class X {',
                '\tz = 2',
                '}'
            ], new selection_1.Selection(2, 1, 2, 1), [
                'z = 2',
                'class X {',
                '}'
            ], new selection_1.Selection(1, 1, 1, 1));
            mode.dispose();
        });
        // https://github.com/Microsoft/vscode/issues/28552#issuecomment-307867717
        test('move lines across block', () => {
            let mode = new IndentRulesMode(indentRules);
            testMoveLinesDownWithIndentCommand(mode.getLanguageIdentifier(), [
                'const value = 2;',
                'const standardLanguageDescriptions = [',
                '    {',
                '        diagnosticSource: \'js\',',
                '    }',
                '];'
            ], new selection_1.Selection(1, 1, 1, 1), [
                'const standardLanguageDescriptions = [',
                '    const value = 2;',
                '    {',
                '        diagnosticSource: \'js\',',
                '    }',
                '];'
            ], new selection_1.Selection(2, 5, 2, 5));
            mode.dispose();
        });
        test('move line should still work as before if there is no indentation rules', () => {
            testMoveLinesUpWithIndentCommand(null, [
                'if (true) {',
                '    var task = new Task(() => {',
                '        var work = 1234;',
                '    });',
                '}'
            ], new selection_1.Selection(3, 1, 3, 1), [
                'if (true) {',
                '        var work = 1234;',
                '    var task = new Task(() => {',
                '    });',
                '}'
            ], new selection_1.Selection(2, 1, 2, 1));
        });
    });
});
//# sourceMappingURL=moveLinesCommand.test.js.map