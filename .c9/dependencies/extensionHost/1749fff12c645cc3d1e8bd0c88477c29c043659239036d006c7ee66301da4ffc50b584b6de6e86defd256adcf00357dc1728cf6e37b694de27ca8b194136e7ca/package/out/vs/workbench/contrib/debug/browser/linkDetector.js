/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/strings", "vs/base/common/path", "vs/base/common/uri", "vs/base/common/platform", "vs/base/browser/mouseEvent", "vs/nls", "vs/workbench/services/editor/common/editorService"], function (require, exports, strings, path_1, uri_1, platform_1, mouseEvent_1, nls, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let LinkDetector = class LinkDetector {
        constructor(editorService) {
            this.editorService = editorService;
            // noop
        }
        /**
         * Matches and handles absolute file links in the string provided.
         * Returns <span/> element that wraps the processed string, where matched links are replaced by <a/> and unmatched parts are surrounded by <span/> elements.
         * 'onclick' event is attached to all anchored links that opens them in the editor.
         * Each line of the text, even if it contains no links, is wrapped in a <span> and added as a child of the returned <span>.
         */
        handleLinks(text) {
            const container = document.createElement('span');
            // Handle the text one line at a time
            const lines = text.split('\n');
            if (strings.endsWith(text, '\n')) {
                // Remove the last element ('') that split added
                lines.pop();
            }
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                // Re-introduce the newline for every line except the last (unless the last line originally ended with a newline)
                if (i < lines.length - 1 || strings.endsWith(text, '\n')) {
                    line += '\n';
                }
                // Don't handle links for lines that are too long
                if (line.length > LinkDetector.MAX_LENGTH) {
                    let span = document.createElement('span');
                    span.textContent = line;
                    container.appendChild(span);
                    continue;
                }
                const lineContainer = document.createElement('span');
                for (let pattern of LinkDetector.FILE_LOCATION_PATTERNS) {
                    // Reset the state of the pattern
                    pattern = new RegExp(pattern);
                    let lastMatchIndex = 0;
                    let match = pattern.exec(line);
                    while (match !== null) {
                        let resource = path_1.isAbsolute(match[1]) ? uri_1.URI.file(match[1]) : null;
                        if (!resource) {
                            match = pattern.exec(line);
                            continue;
                        }
                        const textBeforeLink = line.substring(lastMatchIndex, match.index);
                        if (textBeforeLink) {
                            // textBeforeLink may have matches for other patterns, so we run handleLinks on it before adding it.
                            lineContainer.appendChild(this.handleLinks(textBeforeLink));
                        }
                        const link = document.createElement('a');
                        link.textContent = line.substr(match.index, match[0].length);
                        link.title = platform_1.isMacintosh ? nls.localize('fileLinkMac', "Click to follow (Cmd + click opens to the side)") : nls.localize('fileLink', "Click to follow (Ctrl + click opens to the side)");
                        lineContainer.appendChild(link);
                        const lineNumber = Number(match[3]);
                        const columnNumber = match[4] ? Number(match[4]) : undefined;
                        link.onclick = (e) => this.onLinkClick(new mouseEvent_1.StandardMouseEvent(e), resource, lineNumber, columnNumber);
                        lastMatchIndex = pattern.lastIndex;
                        const currentMatch = match;
                        match = pattern.exec(line);
                        // Append last string part if no more link matches
                        if (!match) {
                            const textAfterLink = line.substr(currentMatch.index + currentMatch[0].length);
                            if (textAfterLink) {
                                // textAfterLink may have matches for other patterns, so we run handleLinks on it before adding it.
                                lineContainer.appendChild(this.handleLinks(textAfterLink));
                            }
                        }
                    }
                    // If we found any matches for this pattern, don't check any more patterns. Other parts of the line will be checked for the other patterns due to the recursion.
                    if (lineContainer.hasChildNodes()) {
                        break;
                    }
                }
                if (lines.length === 1) {
                    if (lineContainer.hasChildNodes()) {
                        // Adding lineContainer to container would introduce an unnecessary surrounding span since there is only one line, so instead we just return lineContainer
                        return lineContainer;
                    }
                    else {
                        container.textContent = line;
                    }
                }
                else {
                    if (lineContainer.hasChildNodes()) {
                        // Add this line to the container
                        container.appendChild(lineContainer);
                    }
                    else {
                        // No links were added, but we still need to surround the unmodified line with a span before adding it
                        let span = document.createElement('span');
                        span.textContent = line;
                        container.appendChild(span);
                    }
                }
            }
            return container;
        }
        onLinkClick(event, resource, line, column = 0) {
            const selection = window.getSelection();
            if (!selection || selection.type === 'Range') {
                return; // do not navigate when user is selecting
            }
            event.preventDefault();
            const group = event.ctrlKey || event.metaKey ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP;
            this.editorService.openEditor({
                resource,
                options: {
                    selection: {
                        startLineNumber: line,
                        startColumn: column
                    }
                }
            }, group);
        }
    };
    LinkDetector.MAX_LENGTH = 500;
    LinkDetector.FILE_LOCATION_PATTERNS = [
        // group 0: full path with line and column
        // group 1: full path without line and column, matched by `*.*` in the end to work only on paths with extensions in the end (s.t. node:10352 would not match)
        // group 2: drive letter on windows with trailing backslash or leading slash on mac/linux
        // group 3: line number, matched by (:(\d+))
        // group 4: column number, matched by ((?::(\d+))?)
        // e.g.: at Context.<anonymous> (c:\Users\someone\Desktop\mocha-runner\test\test.js:26:11)
        /(?![\(])(?:file:\/\/)?((?:([a-zA-Z]+:)|[^\(\)<>\'\"\[\]:\s]+)(?:[\\/][^\(\)<>\'\"\[\]:]*)?\.[a-zA-Z]+[0-9]*):(\d+)(?::(\d+))?/g
    ];
    LinkDetector = __decorate([
        __param(0, editorService_1.IEditorService)
    ], LinkDetector);
    exports.LinkDetector = LinkDetector;
});
//# sourceMappingURL=linkDetector.js.map