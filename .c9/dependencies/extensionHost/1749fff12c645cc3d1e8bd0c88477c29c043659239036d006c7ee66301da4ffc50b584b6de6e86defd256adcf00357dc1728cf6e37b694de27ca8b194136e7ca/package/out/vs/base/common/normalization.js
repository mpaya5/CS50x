/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/map"], function (require, exports, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The normalize() method returns the Unicode Normalization Form of a given string. The form will be
     * the Normalization Form Canonical Composition.
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize}
     */
    exports.canNormalize = typeof (''.normalize) === 'function';
    const nfcCache = new map_1.LRUCache(10000); // bounded to 10000 elements
    function normalizeNFC(str) {
        return normalize(str, 'NFC', nfcCache);
    }
    exports.normalizeNFC = normalizeNFC;
    const nfdCache = new map_1.LRUCache(10000); // bounded to 10000 elements
    function normalizeNFD(str) {
        return normalize(str, 'NFD', nfdCache);
    }
    exports.normalizeNFD = normalizeNFD;
    const nonAsciiCharactersPattern = /[^\u0000-\u0080]/;
    function normalize(str, form, normalizedCache) {
        if (!exports.canNormalize || !str) {
            return str;
        }
        const cached = normalizedCache.get(str);
        if (cached) {
            return cached;
        }
        let res;
        if (nonAsciiCharactersPattern.test(str)) {
            res = str.normalize(form);
        }
        else {
            res = str;
        }
        // Use the cache for fast lookup
        normalizedCache.set(str, res);
        return res;
    }
});
//# sourceMappingURL=normalization.js.map