/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/workbench/contrib/debug/common/debugModel", "vs/base/common/types", "vs/base/common/resources", "vs/base/common/strings"], function (require, exports, nls, severity_1, debugModel_1, types_1, resources_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const MAX_REPL_LENGTH = 10000;
    let topReplElementCounter = 0;
    class ReplModel {
        constructor(session) {
            this.session = session;
            this.replElements = [];
        }
        getReplElements() {
            return this.replElements;
        }
        addReplExpression(stackFrame, name) {
            const expression = new debugModel_1.Expression(name);
            this.addReplElement(expression);
            return expression.evaluate(this.session, stackFrame, 'repl');
        }
        appendToRepl(data, sev, source) {
            const clearAnsiSequence = '\u001b[2J';
            if (typeof data === 'string' && data.indexOf(clearAnsiSequence) >= 0) {
                // [2J is the ansi escape sequence for clearing the display http://ascii-table.com/ansi-escape-sequences.php
                this.removeReplExpressions();
                this.appendToRepl(nls.localize('consoleCleared', "Console was cleared"), severity_1.default.Ignore);
                data = data.substr(data.lastIndexOf(clearAnsiSequence) + clearAnsiSequence.length);
            }
            if (typeof data === 'string') {
                const previousElement = this.replElements.length ? this.replElements[this.replElements.length - 1] : undefined;
                if (previousElement instanceof debugModel_1.SimpleReplElement && previousElement.severity === sev && !strings_1.endsWith(previousElement.value, '\n') && !strings_1.endsWith(previousElement.value, '\r\n')) {
                    previousElement.value += data;
                }
                else {
                    const element = new debugModel_1.SimpleReplElement(`topReplElement:${topReplElementCounter++}`, data, sev, source);
                    this.addReplElement(element);
                }
            }
            else {
                // TODO@Isidor hack, we should introduce a new type which is an output that can fetch children like an expression
                data.severity = sev;
                data.sourceData = source;
                this.addReplElement(data);
            }
        }
        addReplElement(newElement) {
            this.replElements.push(newElement);
            if (this.replElements.length > MAX_REPL_LENGTH) {
                this.replElements.splice(0, this.replElements.length - MAX_REPL_LENGTH);
            }
        }
        logToRepl(sev, args, frame) {
            let source;
            if (frame) {
                source = {
                    column: frame.column,
                    lineNumber: frame.line,
                    source: this.session.getSource({
                        name: resources_1.basenameOrAuthority(frame.uri),
                        path: frame.uri.fsPath
                    })
                };
            }
            // add output for each argument logged
            let simpleVals = [];
            for (let i = 0; i < args.length; i++) {
                let a = args[i];
                // undefined gets printed as 'undefined'
                if (typeof a === 'undefined') {
                    simpleVals.push('undefined');
                }
                // null gets printed as 'null'
                else if (a === null) {
                    simpleVals.push('null');
                }
                // objects & arrays are special because we want to inspect them in the REPL
                else if (types_1.isObject(a) || Array.isArray(a)) {
                    // flush any existing simple values logged
                    if (simpleVals.length) {
                        this.appendToRepl(simpleVals.join(' '), sev, source);
                        simpleVals = [];
                    }
                    // show object
                    this.appendToRepl(new debugModel_1.RawObjectReplElement(`topReplElement:${topReplElementCounter++}`, a.prototype, a, undefined, nls.localize('snapshotObj', "Only primitive values are shown for this object.")), sev, source);
                }
                // string: watch out for % replacement directive
                // string substitution and formatting @ https://developer.chrome.com/devtools/docs/console
                else if (typeof a === 'string') {
                    let buf = '';
                    for (let j = 0, len = a.length; j < len; j++) {
                        if (a[j] === '%' && (a[j + 1] === 's' || a[j + 1] === 'i' || a[j + 1] === 'd' || a[j + 1] === 'O')) {
                            i++; // read over substitution
                            buf += !types_1.isUndefinedOrNull(args[i]) ? args[i] : ''; // replace
                            j++; // read over directive
                        }
                        else {
                            buf += a[j];
                        }
                    }
                    simpleVals.push(buf);
                }
                // number or boolean is joined together
                else {
                    simpleVals.push(a);
                }
            }
            // flush simple values
            // always append a new line for output coming from an extension such that separate logs go to separate lines #23695
            if (simpleVals.length) {
                this.appendToRepl(simpleVals.join(' ') + '\n', sev, source);
            }
        }
        removeReplExpressions() {
            if (this.replElements.length > 0) {
                this.replElements = [];
            }
        }
    }
    exports.ReplModel = ReplModel;
});
//# sourceMappingURL=replModel.js.map