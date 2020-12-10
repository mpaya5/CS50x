/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/log/common/log", "vs/base/common/event"], function (require, exports, log_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtHostLogService {
        constructor() {
            this.onDidChangeLogLevel = new event_1.Emitter().event;
        }
        setLevel(level) { }
        getLevel() { return log_1.LogLevel.Info; }
        trace(message, ...args) { console.log(message, ...args); }
        debug(message, ...args) { console.log(message, ...args); }
        info(message, ...args) { console.info(message, ...args); }
        warn(message, ...args) { console.warn(message, ...args); }
        error(message, ...args) { console.error(message, ...args); }
        critical(message, ...args) { console.error(message, ...args); }
        dispose() { }
    }
    exports.ExtHostLogService = ExtHostLogService;
});
//# sourceMappingURL=extHostLogService.js.map