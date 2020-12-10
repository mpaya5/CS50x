/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class IssueChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'openIssueReporter':
                    return this.service.openReporter(arg);
                case 'openProcessExplorer':
                    return this.service.openProcessExplorer(arg);
                case 'getSystemStatus':
                    return this.service.getSystemStatus();
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.IssueChannel = IssueChannel;
});
//# sourceMappingURL=issueIpc.js.map