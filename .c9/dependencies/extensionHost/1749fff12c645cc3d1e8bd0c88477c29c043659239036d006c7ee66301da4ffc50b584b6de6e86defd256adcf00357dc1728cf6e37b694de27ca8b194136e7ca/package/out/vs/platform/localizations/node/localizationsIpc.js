/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LocalizationsChannel {
        constructor(service) {
            this.service = service;
            this.onDidLanguagesChange = event_1.Event.buffer(service.onDidLanguagesChange, true);
        }
        listen(_, event) {
            switch (event) {
                case 'onDidLanguagesChange': return this.onDidLanguagesChange;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'getLanguageIds': return this.service.getLanguageIds(arg);
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.LocalizationsChannel = LocalizationsChannel;
});
//# sourceMappingURL=localizationsIpc.js.map