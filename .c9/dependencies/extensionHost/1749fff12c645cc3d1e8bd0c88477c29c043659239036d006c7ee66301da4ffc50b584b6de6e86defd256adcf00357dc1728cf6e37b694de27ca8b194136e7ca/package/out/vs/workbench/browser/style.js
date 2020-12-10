/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/css!./media/style"], function (require, exports, themeService_1, colorRegistry_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    themeService_1.registerThemingParticipant((theme, collector) => {
        // Foreground
        const windowForeground = theme.getColor(colorRegistry_1.foreground);
        if (windowForeground) {
            collector.addRule(`.monaco-workbench { color: ${windowForeground}; }`);
        }
        // Selection
        const windowSelectionBackground = theme.getColor(colorRegistry_1.selectionBackground);
        if (windowSelectionBackground) {
            collector.addRule(`.monaco-workbench ::selection { background-color: ${windowSelectionBackground}; }`);
        }
        // Input placeholder
        const placeholderForeground = theme.getColor(colorRegistry_1.inputPlaceholderForeground);
        if (placeholderForeground) {
            collector.addRule(`.monaco-workbench input::-webkit-input-placeholder { color: ${placeholderForeground}; }`);
            collector.addRule(`.monaco-workbench textarea::-webkit-input-placeholder { color: ${placeholderForeground}; }`);
        }
        // List highlight
        const listHighlightForegroundColor = theme.getColor(colorRegistry_1.listHighlightForeground);
        if (listHighlightForegroundColor) {
            collector.addRule(`
			.monaco-workbench .monaco-tree .monaco-tree-row .monaco-highlighted-label .highlight,
			.monaco-workbench .monaco-list .monaco-list-row .monaco-highlighted-label .highlight {
				color: ${listHighlightForegroundColor};
			}
		`);
        }
        // We need to set the workbench background color so that on Windows we get subpixel-antialiasing.
        const workbenchBackground = theme_1.WORKBENCH_BACKGROUND(theme);
        collector.addRule(`.monaco-workbench { background-color: ${workbenchBackground}; }`);
        // Scrollbars
        const scrollbarShadowColor = theme.getColor(colorRegistry_1.scrollbarShadow);
        if (scrollbarShadowColor) {
            collector.addRule(`
			.monaco-workbench .monaco-scrollable-element > .shadow.top {
				box-shadow: ${scrollbarShadowColor} 0 6px 6px -6px inset;
			}

			.monaco-workbench .monaco-scrollable-element > .shadow.left {
				box-shadow: ${scrollbarShadowColor} 6px 0 6px -6px inset;
			}

			.monaco-workbench .monaco-scrollable-element > .shadow.top.left {
				box-shadow: ${scrollbarShadowColor} 6px 6px 6px -6px inset;
			}
		`);
        }
        const scrollbarSliderBackgroundColor = theme.getColor(colorRegistry_1.scrollbarSliderBackground);
        if (scrollbarSliderBackgroundColor) {
            collector.addRule(`
			.monaco-workbench .monaco-scrollable-element > .scrollbar > .slider {
				background: ${scrollbarSliderBackgroundColor};
			}
		`);
        }
        const scrollbarSliderHoverBackgroundColor = theme.getColor(colorRegistry_1.scrollbarSliderHoverBackground);
        if (scrollbarSliderHoverBackgroundColor) {
            collector.addRule(`
			.monaco-workbench .monaco-scrollable-element > .scrollbar > .slider:hover {
				background: ${scrollbarSliderHoverBackgroundColor};
			}
		`);
        }
        const scrollbarSliderActiveBackgroundColor = theme.getColor(colorRegistry_1.scrollbarSliderActiveBackground);
        if (scrollbarSliderActiveBackgroundColor) {
            collector.addRule(`
			.monaco-workbench .monaco-scrollable-element > .scrollbar > .slider.active {
				background: ${scrollbarSliderActiveBackgroundColor};
			}
		`);
        }
        // Focus outline
        const focusOutline = theme.getColor(colorRegistry_1.focusBorder);
        if (focusOutline) {
            collector.addRule(`
		.monaco-workbench [tabindex="0"]:focus,
		.monaco-workbench [tabindex="-1"]:focus,
		.monaco-workbench .synthetic-focus,
		.monaco-workbench select:focus,
		.monaco-workbench .monaco-tree.focused.no-focused-item:focus:before,
		.monaco-workbench .monaco-list:not(.element-focused):focus:before,
		.monaco-workbench input[type="button"]:focus,
		.monaco-workbench input[type="text"]:focus,
		.monaco-workbench button:focus,
		.monaco-workbench textarea:focus,
		.monaco-workbench input[type="search"]:focus,
		.monaco-workbench input[type="checkbox"]:focus {
			outline-color: ${focusOutline};
		}
		`);
        }
        // High Contrast theme overwrites for outline
        if (theme.type === themeService_1.HIGH_CONTRAST) {
            collector.addRule(`
		.hc-black [tabindex="0"]:focus,
		.hc-black [tabindex="-1"]:focus,
		.hc-black .synthetic-focus,
		.hc-black select:focus,
		.hc-black input[type="button"]:focus,
		.hc-black input[type="text"]:focus,
		.hc-black textarea:focus,
		.hc-black input[type="checkbox"]:focus {
			outline-style: solid;
			outline-width: 1px;
		}

		.hc-black .monaco-tree.focused.no-focused-item:focus:before {
			outline-width: 1px;
			outline-offset: -2px;
		}

		.hc-black .synthetic-focus input {
			background: transparent; /* Search input focus fix when in high contrast */
		}
		`);
        }
    });
});
//# sourceMappingURL=style.js.map