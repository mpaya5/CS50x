/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/base/browser/ui/octiconLabel/octiconLabel", "vs/base/common/strings"], function (require, exports, objects, octiconLabel_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HighlightedLabel {
        constructor(container, supportOcticons) {
            this.supportOcticons = supportOcticons;
            this.domNode = document.createElement('span');
            this.domNode.className = 'monaco-highlighted-label';
            this.didEverRender = false;
            container.appendChild(this.domNode);
        }
        get element() {
            return this.domNode;
        }
        set(text, highlights = [], title = '', escapeNewLines) {
            if (!text) {
                text = '';
            }
            if (escapeNewLines) {
                // adjusts highlights inplace
                text = HighlightedLabel.escapeNewLines(text, highlights);
            }
            if (this.didEverRender && this.text === text && this.title === title && objects.equals(this.highlights, highlights)) {
                return;
            }
            if (!Array.isArray(highlights)) {
                highlights = [];
            }
            this.text = text;
            this.title = title;
            this.highlights = highlights;
            this.render();
        }
        render() {
            let htmlContent = '';
            let pos = 0;
            for (const highlight of this.highlights) {
                if (highlight.end === highlight.start) {
                    continue;
                }
                if (pos < highlight.start) {
                    htmlContent += '<span>';
                    const substring = this.text.substring(pos, highlight.start);
                    htmlContent += this.supportOcticons ? octiconLabel_1.renderOcticons(substring) : strings_1.escape(substring);
                    htmlContent += '</span>';
                    pos = highlight.end;
                }
                htmlContent += '<span class="highlight">';
                const substring = this.text.substring(highlight.start, highlight.end);
                htmlContent += this.supportOcticons ? octiconLabel_1.renderOcticons(substring) : strings_1.escape(substring);
                htmlContent += '</span>';
                pos = highlight.end;
            }
            if (pos < this.text.length) {
                htmlContent += '<span>';
                const substring = this.text.substring(pos);
                htmlContent += this.supportOcticons ? octiconLabel_1.renderOcticons(substring) : strings_1.escape(substring);
                htmlContent += '</span>';
            }
            this.domNode.innerHTML = htmlContent;
            this.domNode.title = this.title;
            this.didEverRender = true;
        }
        static escapeNewLines(text, highlights) {
            let total = 0;
            let extra = 0;
            return text.replace(/\r\n|\r|\n/g, (match, offset) => {
                extra = match === '\r\n' ? -1 : 0;
                offset += total;
                for (const highlight of highlights) {
                    if (highlight.end <= offset) {
                        continue;
                    }
                    if (highlight.start >= offset) {
                        highlight.start += extra;
                    }
                    if (highlight.end >= offset) {
                        highlight.end += extra;
                    }
                }
                total += extra;
                return '\u23CE';
            });
        }
    }
    exports.HighlightedLabel = HighlightedLabel;
});
//# sourceMappingURL=highlightedLabel.js.map