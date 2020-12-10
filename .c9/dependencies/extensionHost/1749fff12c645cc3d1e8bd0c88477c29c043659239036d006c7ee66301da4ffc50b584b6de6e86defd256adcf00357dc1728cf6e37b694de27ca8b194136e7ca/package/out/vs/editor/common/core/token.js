/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Token {
        constructor(offset, type, language) {
            this.offset = offset | 0; // @perf
            this.type = type;
            this.language = language;
        }
        toString() {
            return '(' + this.offset + ', ' + this.type + ')';
        }
    }
    exports.Token = Token;
    class TokenizationResult {
        constructor(tokens, endState) {
            this.tokens = tokens;
            this.endState = endState;
        }
    }
    exports.TokenizationResult = TokenizationResult;
    class TokenizationResult2 {
        constructor(tokens, endState) {
            this.tokens = tokens;
            this.endState = endState;
        }
    }
    exports.TokenizationResult2 = TokenizationResult2;
});
//# sourceMappingURL=token.js.map