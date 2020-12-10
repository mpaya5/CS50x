/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "events", "vs/base/common/path", "string_decoder", "vs/base/common/strings", "vs/base/common/uri", "vs/workbench/services/search/common/search", "./ripgrepSearchUtils", "vs/base/common/arrays", "vs/base/common/glob", "vs/base/common/collections", "vs/workbench/services/search/common/searchExtTypes"], function (require, exports, cp, events_1, path, string_decoder_1, strings_1, uri_1, search_1, ripgrepSearchUtils_1, arrays_1, glob_1, collections_1, searchExtTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const rgPath = "";
    // If vscode-ripgrep is in an .asar file, then the binary is unpacked.
    const rgDiskPath = rgPath.replace(/\bnode_modules\.asar\b/, 'node_modules.asar.unpacked');
    class RipgrepTextSearchEngine {
        constructor(outputChannel) {
            this.outputChannel = outputChannel;
        }
        provideTextSearchResults(query, options, progress, token) {
            this.outputChannel.appendLine(`provideTextSearchResults ${query.pattern}, ${JSON.stringify(Object.assign({}, options, {
                folder: options.folder.toString()
            }))}`);
            return new Promise((resolve, reject) => {
                token.onCancellationRequested(() => cancel());
                const rgArgs = getRgArgs(query, options);
                const cwd = options.folder.fsPath;
                const escapedArgs = rgArgs
                    .map(arg => arg.match(/^-/) ? arg : `'${arg}'`)
                    .join(' ');
                this.outputChannel.appendLine(`rg ${escapedArgs}\n - cwd: ${cwd}`);
                let rgProc = cp.spawn(rgDiskPath, rgArgs, { cwd });
                rgProc.on('error', e => {
                    console.error(e);
                    this.outputChannel.appendLine('Error: ' + (e && e.message));
                    reject(search_1.serializeSearchError(new search_1.SearchError(e && e.message, search_1.SearchErrorCode.rgProcessError)));
                });
                let gotResult = false;
                const ripgrepParser = new RipgrepParser(options.maxResults, cwd, options.previewOptions);
                ripgrepParser.on('result', (match) => {
                    gotResult = true;
                    progress.report(match);
                });
                let isDone = false;
                const cancel = () => {
                    isDone = true;
                    if (rgProc) {
                        rgProc.kill();
                    }
                    if (ripgrepParser) {
                        ripgrepParser.cancel();
                    }
                };
                let limitHit = false;
                ripgrepParser.on('hitLimit', () => {
                    limitHit = true;
                    cancel();
                });
                rgProc.stdout.on('data', data => {
                    ripgrepParser.handleData(data);
                });
                let gotData = false;
                rgProc.stdout.once('data', () => gotData = true);
                let stderr = '';
                rgProc.stderr.on('data', data => {
                    const message = data.toString();
                    this.outputChannel.appendLine(message);
                    stderr += message;
                });
                rgProc.on('close', () => {
                    this.outputChannel.appendLine(gotData ? 'Got data from stdout' : 'No data from stdout');
                    this.outputChannel.appendLine(gotResult ? 'Got result from parser' : 'No result from parser');
                    this.outputChannel.appendLine('');
                    if (isDone) {
                        resolve({ limitHit });
                    }
                    else {
                        // Trigger last result
                        ripgrepParser.flush();
                        rgProc = null;
                        let searchError;
                        if (stderr && !gotData && (searchError = rgErrorMsgForDisplay(stderr))) {
                            reject(search_1.serializeSearchError(new search_1.SearchError(searchError.message, searchError.code)));
                        }
                        else {
                            resolve({ limitHit });
                        }
                    }
                });
            });
        }
    }
    exports.RipgrepTextSearchEngine = RipgrepTextSearchEngine;
    /**
     * Read the first line of stderr and return an error for display or undefined, based on a whitelist.
     * Ripgrep produces stderr output which is not from a fatal error, and we only want the search to be
     * "failed" when a fatal error was produced.
     */
    function rgErrorMsgForDisplay(msg) {
        const lines = msg.split('\n');
        const firstLine = lines[0].trim();
        if (lines.some(l => strings_1.startsWith(l, 'regex parse error'))) {
            return new search_1.SearchError('Regex parse error', search_1.SearchErrorCode.regexParseError);
        }
        const match = firstLine.match(/grep config error: unknown encoding: (.*)/);
        if (match) {
            return new search_1.SearchError(`Unknown encoding: ${match[1]}`, search_1.SearchErrorCode.unknownEncoding);
        }
        if (strings_1.startsWith(firstLine, 'error parsing glob')) {
            // Uppercase first letter
            return new search_1.SearchError(firstLine.charAt(0).toUpperCase() + firstLine.substr(1), search_1.SearchErrorCode.globParseError);
        }
        if (strings_1.startsWith(firstLine, 'the literal')) {
            // Uppercase first letter
            return new search_1.SearchError(firstLine.charAt(0).toUpperCase() + firstLine.substr(1), search_1.SearchErrorCode.invalidLiteral);
        }
        if (strings_1.startsWith(firstLine, 'PCRE2: error compiling pattern')) {
            return new search_1.SearchError(firstLine, search_1.SearchErrorCode.regexParseError);
        }
        return undefined;
    }
    exports.rgErrorMsgForDisplay = rgErrorMsgForDisplay;
    class RipgrepParser extends events_1.EventEmitter {
        constructor(maxResults, rootFolder, previewOptions) {
            super();
            this.maxResults = maxResults;
            this.rootFolder = rootFolder;
            this.previewOptions = previewOptions;
            this.remainder = '';
            this.isDone = false;
            this.hitLimit = false;
            this.numResults = 0;
            this.stringDecoder = new string_decoder_1.StringDecoder();
        }
        cancel() {
            this.isDone = true;
        }
        flush() {
            this.handleDecodedData(this.stringDecoder.end());
        }
        on(event, listener) {
            super.on(event, listener);
            return this;
        }
        handleData(data) {
            if (this.isDone) {
                return;
            }
            const dataStr = typeof data === 'string' ? data : this.stringDecoder.write(data);
            this.handleDecodedData(dataStr);
        }
        handleDecodedData(decodedData) {
            // check for newline before appending to remainder
            let newlineIdx = decodedData.indexOf('\n');
            // If the previous data chunk didn't end in a newline, prepend it to this chunk
            const dataStr = this.remainder + decodedData;
            if (newlineIdx >= 0) {
                newlineIdx += this.remainder.length;
            }
            else {
                // Shortcut
                this.remainder = dataStr;
                return;
            }
            let prevIdx = 0;
            while (newlineIdx >= 0) {
                this.handleLine(dataStr.substring(prevIdx, newlineIdx).trim());
                prevIdx = newlineIdx + 1;
                newlineIdx = dataStr.indexOf('\n', prevIdx);
            }
            this.remainder = dataStr.substring(prevIdx);
        }
        handleLine(outputLine) {
            if (this.isDone || !outputLine) {
                return;
            }
            let parsedLine;
            try {
                parsedLine = JSON.parse(outputLine);
            }
            catch (e) {
                throw new Error(`malformed line from rg: ${outputLine}`);
            }
            if (parsedLine.type === 'match') {
                const matchPath = bytesOrTextToString(parsedLine.data.path);
                const uri = uri_1.URI.file(path.join(this.rootFolder, matchPath));
                const result = this.createTextSearchMatch(parsedLine.data, uri);
                this.onResult(result);
                if (this.hitLimit) {
                    this.cancel();
                    this.emit('hitLimit');
                }
            }
            else if (parsedLine.type === 'context') {
                const contextPath = bytesOrTextToString(parsedLine.data.path);
                const uri = uri_1.URI.file(path.join(this.rootFolder, contextPath));
                const result = this.createTextSearchContext(parsedLine.data, uri);
                result.forEach(r => this.onResult(r));
            }
        }
        createTextSearchMatch(data, uri) {
            const lineNumber = data.line_number - 1;
            let isBOMStripped = false;
            let fullText = bytesOrTextToString(data.lines);
            if (lineNumber === 0 && strings_1.startsWithUTF8BOM(fullText)) {
                isBOMStripped = true;
                fullText = strings_1.stripUTF8BOM(fullText);
            }
            const fullTextBytes = Buffer.from(fullText);
            let prevMatchEnd = 0;
            let prevMatchEndCol = 0;
            let prevMatchEndLine = lineNumber;
            const ranges = arrays_1.coalesce(data.submatches.map((match, i) => {
                if (this.hitLimit) {
                    return null;
                }
                this.numResults++;
                if (this.numResults >= this.maxResults) {
                    // Finish the line, then report the result below
                    this.hitLimit = true;
                }
                let matchText = bytesOrTextToString(match.match);
                if (lineNumber === 0 && i === 0 && isBOMStripped) {
                    matchText = strings_1.stripUTF8BOM(matchText);
                    match.start = match.start <= 3 ? 0 : match.start - 3;
                    match.end = match.end <= 3 ? 0 : match.end - 3;
                }
                const inBetweenChars = fullTextBytes.slice(prevMatchEnd, match.start).toString().length;
                let startCol = prevMatchEndCol + inBetweenChars;
                const stats = getNumLinesAndLastNewlineLength(matchText);
                const startLineNumber = prevMatchEndLine;
                const endLineNumber = stats.numLines + startLineNumber;
                let endCol = stats.numLines > 0 ?
                    stats.lastLineLength :
                    stats.lastLineLength + startCol;
                prevMatchEnd = match.end;
                prevMatchEndCol = endCol;
                prevMatchEndLine = endLineNumber;
                return new searchExtTypes_1.Range(startLineNumber, startCol, endLineNumber, endCol);
            }));
            return ripgrepSearchUtils_1.createTextSearchResult(uri, fullText, ranges, this.previewOptions);
        }
        createTextSearchContext(data, uri) {
            const text = bytesOrTextToString(data.lines);
            const startLine = data.line_number;
            return text
                .replace(/\r?\n$/, '')
                .split('\n')
                .map((line, i) => {
                return {
                    text: line,
                    uri,
                    lineNumber: startLine + i
                };
            });
        }
        onResult(match) {
            this.emit('result', match);
        }
    }
    exports.RipgrepParser = RipgrepParser;
    function bytesOrTextToString(obj) {
        return obj.bytes ?
            Buffer.from(obj.bytes, 'base64').toString() :
            obj.text;
    }
    function getNumLinesAndLastNewlineLength(text) {
        const re = /\n/g;
        let numLines = 0;
        let lastNewlineIdx = -1;
        let match;
        while (match = re.exec(text)) {
            numLines++;
            lastNewlineIdx = match.index;
        }
        const lastLineLength = lastNewlineIdx >= 0 ?
            text.length - lastNewlineIdx - 1 :
            text.length;
        return { numLines, lastLineLength };
    }
    function getRgArgs(query, options) {
        const args = ['--hidden'];
        args.push(query.isCaseSensitive ? '--case-sensitive' : '--ignore-case');
        const { doubleStarIncludes, otherIncludes } = collections_1.groupBy(options.includes, (include) => strings_1.startsWith(include, '**') ? 'doubleStarIncludes' : 'otherIncludes');
        if (otherIncludes && otherIncludes.length) {
            const uniqueOthers = new Set();
            otherIncludes.forEach(other => {
                if (!strings_1.endsWith(other, '/**')) {
                    other += '/**';
                }
                uniqueOthers.add(other);
            });
            args.push('-g', '!*');
            uniqueOthers
                .forEach(otherIncude => {
                spreadGlobComponents(otherIncude)
                    .map(ripgrepSearchUtils_1.anchorGlob)
                    .forEach(globArg => {
                    args.push('-g', globArg);
                });
            });
        }
        if (doubleStarIncludes && doubleStarIncludes.length) {
            doubleStarIncludes.forEach(globArg => {
                args.push('-g', globArg);
            });
        }
        options.excludes
            .map(ripgrepSearchUtils_1.anchorGlob)
            .forEach(rgGlob => args.push('-g', `!${rgGlob}`));
        if (options.maxFileSize) {
            args.push('--max-filesize', options.maxFileSize + '');
        }
        if (options.useIgnoreFiles) {
            args.push('--no-ignore-parent');
        }
        else {
            // Don't use .gitignore or .ignore
            args.push('--no-ignore');
        }
        if (options.followSymlinks) {
            args.push('--follow');
        }
        if (options.encoding && options.encoding !== 'utf8') {
            args.push('--encoding', options.encoding);
        }
        let pattern = query.pattern;
        // Ripgrep handles -- as a -- arg separator. Only --.
        // - is ok, --- is ok, --some-flag is also ok. Need to special case.
        if (pattern === '--') {
            query.isRegExp = true;
            pattern = '\\-\\-';
        }
        if (query.isMultiline && !query.isRegExp) {
            query.pattern = strings_1.escapeRegExpCharacters(query.pattern);
            query.isRegExp = true;
        }
        if (options.usePCRE2) {
            args.push('--pcre2');
        }
        if (query.isRegExp) {
            pattern = unicodeEscapesToPCRE2(pattern);
        }
        // Allow $ to match /r/n
        args.push('--crlf');
        let searchPatternAfterDoubleDashes;
        if (query.isWordMatch) {
            const regexp = strings_1.createRegExp(pattern, !!query.isRegExp, { wholeWord: query.isWordMatch });
            const regexpStr = regexp.source.replace(/\\\//g, '/'); // RegExp.source arbitrarily returns escaped slashes. Search and destroy.
            args.push('--regexp', regexpStr);
        }
        else if (query.isRegExp) {
            let fixedRegexpQuery = fixRegexNewline(query.pattern);
            fixedRegexpQuery = fixNewline(fixedRegexpQuery);
            args.push('--regexp', fixedRegexpQuery);
            args.push('--auto-hybrid-regex');
        }
        else {
            searchPatternAfterDoubleDashes = pattern;
            args.push('--fixed-strings');
        }
        args.push('--no-config');
        if (!options.useGlobalIgnoreFiles) {
            args.push('--no-ignore-global');
        }
        args.push('--json');
        if (query.isMultiline) {
            args.push('--multiline');
        }
        if (options.beforeContext) {
            args.push('--before-context', options.beforeContext + '');
        }
        if (options.afterContext) {
            args.push('--after-context', options.afterContext + '');
        }
        // Folder to search
        args.push('--');
        if (searchPatternAfterDoubleDashes) {
            // Put the query after --, in case the query starts with a dash
            args.push(searchPatternAfterDoubleDashes);
        }
        args.push('.');
        return args;
    }
    /**
     * `"foo/*bar/something"` -> `["foo", "foo/*bar", "foo/*bar/something", "foo/*bar/something/**"]`
     */
    function spreadGlobComponents(globArg) {
        const components = glob_1.splitGlobAware(globArg, '/');
        if (components[components.length - 1] !== '**') {
            components.push('**');
        }
        return components.map((_, i) => components.slice(0, i + 1).join('/'));
    }
    exports.spreadGlobComponents = spreadGlobComponents;
    function unicodeEscapesToPCRE2(pattern) {
        const reg = /((?:[^\\]|^)(?:\\\\)*)\\u([a-z0-9]{4})(?!\d)/g;
        // Replace an unescaped $ at the end of the pattern with \r?$
        // Match $ preceeded by none or even number of literal \
        while (pattern.match(reg)) {
            pattern = pattern.replace(reg, `$1\\x{$2}`);
        }
        return pattern;
    }
    exports.unicodeEscapesToPCRE2 = unicodeEscapesToPCRE2;
    function fixRegexNewline(pattern) {
        // Replace an unescaped $ at the end of the pattern with \r?$
        // Match $ preceeded by none or even number of literal \
        return pattern.replace(/([^\\]|^)(\\\\)*\\n/g, '$1$2\\r?\\n');
    }
    exports.fixRegexNewline = fixRegexNewline;
    function fixNewline(pattern) {
        return pattern.replace(/\n/g, '\\r?\\n');
    }
    exports.fixNewline = fixNewline;
});
//# sourceMappingURL=ripgrepTextSearchEngine.js.map