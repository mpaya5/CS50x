/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/editor/common/config/editorOptions", "vs/editor/common/config/editorZoom"], function (require, exports, platform, editorOptions_1, editorZoom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Determined from empirical observations.
     * @internal
     */
    const GOLDEN_LINE_HEIGHT_RATIO = platform.isMacintosh ? 1.5 : 1.35;
    /**
     * Font settings maximum and minimum limits
     */
    const MINIMUM_FONT_SIZE = 8;
    const MAXIMUM_FONT_SIZE = 100;
    const MINIMUM_LINE_HEIGHT = 8;
    const MAXIMUM_LINE_HEIGHT = 150;
    const MINIMUM_LETTER_SPACING = -5;
    const MAXIMUM_LETTER_SPACING = 20;
    function safeParseFloat(n, defaultValue) {
        if (typeof n === 'number') {
            return n;
        }
        if (typeof n === 'undefined') {
            return defaultValue;
        }
        let r = parseFloat(n);
        if (isNaN(r)) {
            return defaultValue;
        }
        return r;
    }
    function safeParseInt(n, defaultValue) {
        if (typeof n === 'number') {
            return Math.round(n);
        }
        if (typeof n === 'undefined') {
            return defaultValue;
        }
        let r = parseInt(n);
        if (isNaN(r)) {
            return defaultValue;
        }
        return r;
    }
    function clamp(n, min, max) {
        if (n < min) {
            return min;
        }
        if (n > max) {
            return max;
        }
        return n;
    }
    function _string(value, defaultValue) {
        if (typeof value !== 'string') {
            return defaultValue;
        }
        return value;
    }
    class BareFontInfo {
        /**
         * @internal
         */
        static createFromRawSettings(opts, zoomLevel, ignoreEditorZoom = false) {
            let fontFamily = _string(opts.fontFamily, editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily);
            let fontWeight = _string(opts.fontWeight, editorOptions_1.EDITOR_FONT_DEFAULTS.fontWeight);
            let fontSize = safeParseFloat(opts.fontSize, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize);
            fontSize = clamp(fontSize, 0, MAXIMUM_FONT_SIZE);
            if (fontSize === 0) {
                fontSize = editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize;
            }
            else if (fontSize < MINIMUM_FONT_SIZE) {
                fontSize = MINIMUM_FONT_SIZE;
            }
            let lineHeight = safeParseInt(opts.lineHeight, 0);
            lineHeight = clamp(lineHeight, 0, MAXIMUM_LINE_HEIGHT);
            if (lineHeight === 0) {
                lineHeight = Math.round(GOLDEN_LINE_HEIGHT_RATIO * fontSize);
            }
            else if (lineHeight < MINIMUM_LINE_HEIGHT) {
                lineHeight = MINIMUM_LINE_HEIGHT;
            }
            let letterSpacing = safeParseFloat(opts.letterSpacing, 0);
            letterSpacing = clamp(letterSpacing, MINIMUM_LETTER_SPACING, MAXIMUM_LETTER_SPACING);
            let editorZoomLevelMultiplier = 1 + (ignoreEditorZoom ? 0 : editorZoom_1.EditorZoom.getZoomLevel() * 0.1);
            fontSize *= editorZoomLevelMultiplier;
            lineHeight *= editorZoomLevelMultiplier;
            return new BareFontInfo({
                zoomLevel: zoomLevel,
                fontFamily: fontFamily,
                fontWeight: fontWeight,
                fontSize: fontSize,
                lineHeight: lineHeight,
                letterSpacing: letterSpacing
            });
        }
        /**
         * @internal
         */
        constructor(opts) {
            this.zoomLevel = opts.zoomLevel;
            this.fontFamily = String(opts.fontFamily);
            this.fontWeight = String(opts.fontWeight);
            this.fontSize = opts.fontSize;
            this.lineHeight = opts.lineHeight | 0;
            this.letterSpacing = opts.letterSpacing;
        }
        /**
         * @internal
         */
        getId() {
            return this.zoomLevel + '-' + this.fontFamily + '-' + this.fontWeight + '-' + this.fontSize + '-' + this.lineHeight + '-' + this.letterSpacing;
        }
        /**
         * @internal
         */
        getMassagedFontFamily() {
            if (/[,"']/.test(this.fontFamily)) {
                // Looks like the font family might be already escaped
                return this.fontFamily;
            }
            if (/[+ ]/.test(this.fontFamily)) {
                // Wrap a font family using + or <space> with quotes
                return `"${this.fontFamily}"`;
            }
            return this.fontFamily;
        }
    }
    exports.BareFontInfo = BareFontInfo;
    class FontInfo extends BareFontInfo {
        /**
         * @internal
         */
        constructor(opts, isTrusted) {
            super(opts);
            this.isTrusted = isTrusted;
            this.isMonospace = opts.isMonospace;
            this.typicalHalfwidthCharacterWidth = opts.typicalHalfwidthCharacterWidth;
            this.typicalFullwidthCharacterWidth = opts.typicalFullwidthCharacterWidth;
            this.canUseHalfwidthRightwardsArrow = opts.canUseHalfwidthRightwardsArrow;
            this.spaceWidth = opts.spaceWidth;
            this.maxDigitWidth = opts.maxDigitWidth;
        }
        /**
         * @internal
         */
        equals(other) {
            return (this.fontFamily === other.fontFamily
                && this.fontWeight === other.fontWeight
                && this.fontSize === other.fontSize
                && this.lineHeight === other.lineHeight
                && this.letterSpacing === other.letterSpacing
                && this.typicalHalfwidthCharacterWidth === other.typicalHalfwidthCharacterWidth
                && this.typicalFullwidthCharacterWidth === other.typicalFullwidthCharacterWidth
                && this.canUseHalfwidthRightwardsArrow === other.canUseHalfwidthRightwardsArrow
                && this.spaceWidth === other.spaceWidth
                && this.maxDigitWidth === other.maxDigitWidth);
        }
    }
    exports.FontInfo = FontInfo;
});
//# sourceMappingURL=fontInfo.js.map