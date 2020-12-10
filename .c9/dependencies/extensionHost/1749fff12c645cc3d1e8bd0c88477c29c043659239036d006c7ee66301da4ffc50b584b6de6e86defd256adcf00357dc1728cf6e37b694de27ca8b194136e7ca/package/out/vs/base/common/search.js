/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./strings"], function (require, exports, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function buildReplaceStringWithCasePreserved(matches, pattern) {
        if (matches && (matches[0] !== '')) {
            if (matches[0].toUpperCase() === matches[0]) {
                return pattern.toUpperCase();
            }
            else if (matches[0].toLowerCase() === matches[0]) {
                return pattern.toLowerCase();
            }
            else if (strings.containsUppercaseCharacter(matches[0][0])) {
                if (validateSpecificSpecialCharacter(matches, pattern, '-')) {
                    return buildReplaceStringForSpecificSpecialCharacter(matches, pattern, '-');
                }
                else {
                    return pattern[0].toUpperCase() + pattern.substr(1);
                }
            }
            else {
                // we don't understand its pattern yet.
                return pattern;
            }
        }
        else {
            return pattern;
        }
    }
    exports.buildReplaceStringWithCasePreserved = buildReplaceStringWithCasePreserved;
    function validateSpecificSpecialCharacter(matches, pattern, specialCharacter) {
        const doesConatinSpecialCharacter = matches[0].indexOf(specialCharacter) !== -1 && pattern.indexOf(specialCharacter) !== -1;
        return doesConatinSpecialCharacter && matches[0].split(specialCharacter).length === pattern.split(specialCharacter).length;
    }
    function buildReplaceStringForSpecificSpecialCharacter(matches, pattern, specialCharacter) {
        const splitPatternAtSpecialCharacter = pattern.split(specialCharacter);
        const splitMatchAtSpecialCharacter = matches[0].split(specialCharacter);
        let replaceString = '';
        splitPatternAtSpecialCharacter.forEach((splitValue, index) => {
            replaceString += buildReplaceStringWithCasePreserved([splitMatchAtSpecialCharacter[index]], splitValue) + specialCharacter;
        });
        return replaceString.slice(0, -1);
    }
});
//# sourceMappingURL=search.js.map