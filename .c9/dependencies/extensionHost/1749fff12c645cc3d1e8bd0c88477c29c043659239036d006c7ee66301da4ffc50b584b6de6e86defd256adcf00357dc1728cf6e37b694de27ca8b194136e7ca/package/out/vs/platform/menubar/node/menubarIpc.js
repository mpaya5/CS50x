/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MenubarChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'updateMenubar': return this.service.updateMenubar(arg[0], arg[1]);
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.MenubarChannel = MenubarChannel;
});
//# sourceMappingURL=menubarIpc.js.map