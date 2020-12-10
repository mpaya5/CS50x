/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A very VM friendly rgba datastructure.
     * Please don't touch unless you take a look at the IR.
     */
    class RGBA8 {
        constructor(r, g, b, a) {
            this.r = RGBA8._clamp(r);
            this.g = RGBA8._clamp(g);
            this.b = RGBA8._clamp(b);
            this.a = RGBA8._clamp(a);
        }
        static _clamp(c) {
            if (c < 0) {
                return 0;
            }
            if (c > 255) {
                return 255;
            }
            return c | 0;
        }
    }
    RGBA8.Empty = new RGBA8(0, 0, 0, 0);
    exports.RGBA8 = RGBA8;
});
//# sourceMappingURL=rgba.js.map