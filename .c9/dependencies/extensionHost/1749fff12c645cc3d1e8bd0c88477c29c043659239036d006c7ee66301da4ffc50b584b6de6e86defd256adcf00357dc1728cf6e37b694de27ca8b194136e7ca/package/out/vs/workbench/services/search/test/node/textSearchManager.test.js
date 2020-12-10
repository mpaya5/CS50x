/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/uri", "vs/workbench/services/search/node/textSearchManager"], function (require, exports, assert, cancellation_1, uri_1, textSearchManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TextSearchManager', () => {
        test('fixes encoding', () => __awaiter(this, void 0, void 0, function* () {
            let correctEncoding = false;
            const provider = {
                provideTextSearchResults(query, options, progress, token) {
                    correctEncoding = options.encoding === 'windows-1252';
                    return null;
                }
            };
            const query = {
                type: 2 /* Text */,
                contentPattern: {
                    pattern: 'a'
                },
                folderQueries: [{
                        folder: uri_1.URI.file('/some/folder'),
                        fileEncoding: 'windows1252'
                    }]
            };
            const m = new textSearchManager_1.TextSearchManager(query, provider);
            yield m.search(() => { }, new cancellation_1.CancellationTokenSource().token);
            assert.ok(correctEncoding);
        }));
    });
});
//# sourceMappingURL=textSearchManager.test.js.map