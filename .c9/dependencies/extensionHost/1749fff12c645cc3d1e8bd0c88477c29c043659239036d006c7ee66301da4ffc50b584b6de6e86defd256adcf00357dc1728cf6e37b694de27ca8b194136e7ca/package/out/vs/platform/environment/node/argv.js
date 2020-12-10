/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vscode-minimist", "os", "vs/nls", "vs/base/common/path", "vs/base/node/pfs"], function (require, exports, minimist, os, nls_1, path_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This code is also used by standalone cli's. Avoid adding any other dependencies.
     */
    const helpCategories = {
        o: nls_1.localize('optionsUpperCase', "Options"),
        e: nls_1.localize('extensionsManagement', "Extensions Management"),
        t: nls_1.localize('troubleshooting', "Troubleshooting")
    };
    //_urls
    exports.options = [
        { id: 'diff', type: 'boolean', cat: 'o', alias: 'd', args: ['file', 'file'], description: nls_1.localize('diff', "Compare two files with each other.") },
        { id: 'add', type: 'boolean', cat: 'o', alias: 'a', args: 'folder', description: nls_1.localize('add', "Add folder(s) to the last active window.") },
        { id: 'goto', type: 'boolean', cat: 'o', alias: 'g', args: 'file:line[:character]', description: nls_1.localize('goto', "Open a file at the path on the specified line and character position.") },
        { id: 'new-window', type: 'boolean', cat: 'o', alias: 'n', description: nls_1.localize('newWindow', "Force to open a new window.") },
        { id: 'reuse-window', type: 'boolean', cat: 'o', alias: 'r', description: nls_1.localize('reuseWindow', "Force to open a file or folder in an already opened window.") },
        { id: 'wait', type: 'boolean', cat: 'o', alias: 'w', description: nls_1.localize('wait', "Wait for the files to be closed before returning.") },
        { id: 'locale', type: 'string', cat: 'o', args: 'locale', description: nls_1.localize('locale', "The locale to use (e.g. en-US or zh-TW).") },
        { id: 'user-data-dir', type: 'string', cat: 'o', args: 'dir', description: nls_1.localize('userDataDir', "Specifies the directory that user data is kept in. Can be used to open multiple distinct instances of Code.") },
        { id: 'version', type: 'boolean', cat: 'o', alias: 'v', description: nls_1.localize('version', "Print version.") },
        { id: 'help', type: 'boolean', cat: 'o', alias: 'h', description: nls_1.localize('help', "Print usage.") },
        { id: 'telemetry', type: 'boolean', cat: 'o', description: nls_1.localize('telemetry', "Shows all telemetry events which VS code collects.") },
        { id: 'folder-uri', type: 'string', cat: 'o', args: 'uri', description: nls_1.localize('folderUri', "Opens a window with given folder uri(s)") },
        { id: 'file-uri', type: 'string', cat: 'o', args: 'uri', description: nls_1.localize('fileUri', "Opens a window with given file uri(s)") },
        { id: 'extensions-dir', type: 'string', deprecates: 'extensionHomePath', cat: 'e', args: 'dir', description: nls_1.localize('extensionHomePath', "Set the root path for extensions.") },
        { id: 'list-extensions', type: 'boolean', cat: 'e', description: nls_1.localize('listExtensions', "List the installed extensions.") },
        { id: 'show-versions', type: 'boolean', cat: 'e', description: nls_1.localize('showVersions', "Show versions of installed extensions, when using --list-extension.") },
        { id: 'category', type: 'string', cat: 'e', description: nls_1.localize('category', "Filters installed extensions by provided category, when using --list-extension.") },
        { id: 'install-extension', type: 'string', cat: 'e', args: 'extension-id | path-to-vsix', description: nls_1.localize('installExtension', "Installs or updates the extension. Use `--force` argument to avoid prompts.") },
        { id: 'uninstall-extension', type: 'string', cat: 'e', args: 'extension-id', description: nls_1.localize('uninstallExtension', "Uninstalls an extension.") },
        { id: 'enable-proposed-api', type: 'string', cat: 'e', args: 'extension-id', description: nls_1.localize('experimentalApis', "Enables proposed API features for extensions. Can receive one or more extension IDs to enable individually.") },
        { id: 'verbose', type: 'boolean', cat: 't', description: nls_1.localize('verbose', "Print verbose output (implies --wait).") },
        { id: 'log', type: 'string', cat: 't', args: 'level', description: nls_1.localize('log', "Log level to use. Default is 'info'. Allowed values are 'critical', 'error', 'warn', 'info', 'debug', 'trace', 'off'.") },
        { id: 'status', type: 'boolean', alias: 's', cat: 't', description: nls_1.localize('status', "Print process usage and diagnostics information.") },
        { id: 'prof-startup', type: 'boolean', cat: 't', description: nls_1.localize('prof-startup', "Run CPU profiler during startup") },
        { id: 'disable-extensions', type: 'boolean', deprecates: 'disableExtensions', cat: 't', description: nls_1.localize('disableExtensions', "Disable all installed extensions.") },
        { id: 'disable-extension', type: 'string', cat: 't', args: 'extension-id', description: nls_1.localize('disableExtension', "Disable an extension.") },
        { id: 'inspect-extensions', type: 'string', deprecates: 'debugPluginHost', args: 'port', cat: 't', description: nls_1.localize('inspect-extensions', "Allow debugging and profiling of extensions. Check the developer tools for the connection URI.") },
        { id: 'inspect-brk-extensions', type: 'string', deprecates: 'debugBrkPluginHost', args: 'port', cat: 't', description: nls_1.localize('inspect-brk-extensions', "Allow debugging and profiling of extensions with the extension host being paused after start. Check the developer tools for the connection URI.") },
        { id: 'disable-gpu', type: 'boolean', cat: 't', description: nls_1.localize('disableGPU', "Disable GPU hardware acceleration.") },
        { id: 'max-memory', type: 'string', cat: 't', description: nls_1.localize('maxMemory', "Max memory size for a window (in Mbytes).") },
        { id: 'remote', type: 'string' },
        { id: 'locate-extension', type: 'string' },
        { id: 'extensionDevelopmentPath', type: 'string' },
        { id: 'extensionTestsPath', type: 'string' },
        { id: 'extension-development-confirm-save', type: 'boolean' },
        { id: 'debugId', type: 'string' },
        { id: 'inspect-search', type: 'string', deprecates: 'debugSearch' },
        { id: 'inspect-brk-search', type: 'string', deprecates: 'debugBrkSearch' },
        { id: 'export-default-configuration', type: 'string' },
        { id: 'install-source', type: 'string' },
        { id: 'driver', type: 'string' },
        { id: 'logExtensionHostCommunication', type: 'boolean' },
        { id: 'skip-getting-started', type: 'boolean' },
        { id: 'skip-release-notes', type: 'boolean' },
        { id: 'sticky-quickopen', type: 'boolean' },
        { id: 'disable-restore-windows', type: 'boolean' },
        { id: 'disable-telemetry', type: 'boolean' },
        { id: 'disable-updates', type: 'boolean' },
        { id: 'disable-crash-reporter', type: 'boolean' },
        { id: 'skip-add-to-recently-opened', type: 'boolean' },
        { id: 'unity-launch', type: 'boolean' },
        { id: 'open-url', type: 'boolean' },
        { id: 'file-write', type: 'boolean' },
        { id: 'file-chmod', type: 'boolean' },
        { id: 'driver-verbose', type: 'boolean' },
        { id: 'force', type: 'boolean' },
        { id: 'trace-category-filter', type: 'string' },
        { id: 'trace-options', type: 'string' },
        { id: '_', type: 'string' },
        { id: 'js-flags', type: 'string' },
        { id: 'nolazy', type: 'boolean' },
    ];
    function parseArgs(args, isOptionSupported = (_) => true) {
        const alias = {};
        const string = [];
        const boolean = [];
        for (let o of exports.options) {
            if (isOptionSupported(o)) {
                if (o.alias) {
                    alias[o.id] = o.alias;
                }
            }
            if (o.type === 'string') {
                string.push(o.id);
                if (o.deprecates) {
                    string.push(o.deprecates);
                }
            }
            else if (o.type === 'boolean') {
                boolean.push(o.id);
                if (o.deprecates) {
                    boolean.push(o.deprecates);
                }
            }
        }
        // remote aliases to avoid confusion
        const parsedArgs = minimist(args, { string, boolean, alias });
        for (const o of exports.options) {
            if (o.alias) {
                delete parsedArgs[o.alias];
            }
            if (o.deprecates && parsedArgs.hasOwnProperty(o.deprecates) && !parsedArgs[o.id]) {
                parsedArgs[o.id] = parsedArgs[o.deprecates];
                delete parsedArgs[o.deprecates];
            }
        }
        // https://github.com/microsoft/vscode/issues/58177
        parsedArgs._ = parsedArgs._.filter(arg => arg.length > 0);
        return parsedArgs;
    }
    exports.parseArgs = parseArgs;
    function formatUsage(option) {
        let args = '';
        if (option.args) {
            if (Array.isArray(option.args)) {
                args = ` <${option.args.join('> <')}>`;
            }
            else {
                args = ` <${option.args}>`;
            }
        }
        if (option.alias) {
            return `-${option.alias} --${option.id}${args}`;
        }
        return `--${option.id}${args}`;
    }
    // exported only for testing
    function formatOptions(docOptions, columns) {
        let usageTexts = docOptions.map(formatUsage);
        let argLength = Math.max.apply(null, usageTexts.map(k => k.length)) + 2 /*left padding*/ + 1 /*right padding*/;
        if (columns - argLength < 25) {
            // Use a condensed version on narrow terminals
            return docOptions.reduce((r, o, i) => r.concat([`  ${usageTexts[i]}`, `      ${o.description}`]), []);
        }
        let descriptionColumns = columns - argLength - 1;
        let result = [];
        docOptions.forEach((o, i) => {
            let usage = usageTexts[i];
            let wrappedDescription = wrapText(o.description, descriptionColumns);
            let keyPadding = indent(argLength - usage.length - 2 /*left padding*/);
            result.push('  ' + usage + keyPadding + wrappedDescription[0]);
            for (let i = 1; i < wrappedDescription.length; i++) {
                result.push(indent(argLength) + wrappedDescription[i]);
            }
        });
        return result;
    }
    exports.formatOptions = formatOptions;
    function indent(count) {
        return ' '.repeat(count);
    }
    function wrapText(text, columns) {
        let lines = [];
        while (text.length) {
            let index = text.length < columns ? text.length : text.lastIndexOf(' ', columns);
            let line = text.slice(0, index).trim();
            text = text.slice(index);
            lines.push(line);
        }
        return lines;
    }
    function buildHelpMessage(productName, executableName, version, isOptionSupported = (_) => true, isPipeSupported = true) {
        const columns = (process.stdout).isTTY && (process.stdout).columns || 80;
        let help = [`${productName} ${version}`];
        help.push('');
        help.push(`${nls_1.localize('usage', "Usage")}: ${executableName} [${nls_1.localize('options', "options")}][${nls_1.localize('paths', 'paths')}...]`);
        help.push('');
        if (isPipeSupported) {
            if (os.platform() === 'win32') {
                help.push(nls_1.localize('stdinWindows', "To read output from another program, append '-' (e.g. 'echo Hello World | {0} -')", executableName));
            }
            else {
                help.push(nls_1.localize('stdinUnix', "To read from stdin, append '-' (e.g. 'ps aux | grep code | {0} -')", executableName));
            }
            help.push('');
        }
        for (let helpCategoryKey in helpCategories) {
            const key = helpCategoryKey;
            let categoryOptions = exports.options.filter(o => !!o.description && o.cat === key && isOptionSupported(o));
            if (categoryOptions.length) {
                help.push(helpCategories[key]);
                help.push(...formatOptions(categoryOptions, columns));
                help.push('');
            }
        }
        return help.join('\n');
    }
    exports.buildHelpMessage = buildHelpMessage;
    function buildVersionMessage(version, commit) {
        return `${version || nls_1.localize('unknownVersion', "Unknown version")}\n${commit || nls_1.localize('unknownCommit', "Unknown commit")}\n${process.arch}`;
    }
    exports.buildVersionMessage = buildVersionMessage;
    /**
     * Converts an argument into an array
     * @param arg a argument value. Can be undefined, an entry or an array
     */
    function asArray(arg) {
        if (arg) {
            if (Array.isArray(arg)) {
                return arg;
            }
            return [arg];
        }
        return [];
    }
    exports.asArray = asArray;
    /**
     * Returns whether an argument is present.
     */
    function hasArgs(arg) {
        if (arg) {
            if (Array.isArray(arg)) {
                return !!arg.length;
            }
            return true;
        }
        return false;
    }
    exports.hasArgs = hasArgs;
    function addArg(argv, ...args) {
        const endOfArgsMarkerIndex = argv.indexOf('--');
        if (endOfArgsMarkerIndex === -1) {
            argv.push(...args);
        }
        else {
            // if the we have an argument "--" (end of argument marker)
            // we cannot add arguments at the end. rather, we add
            // arguments before the "--" marker.
            argv.splice(endOfArgsMarkerIndex, 0, ...args);
        }
        return argv;
    }
    exports.addArg = addArg;
    function createWaitMarkerFile(verbose) {
        const randomWaitMarkerPath = path_1.join(os.tmpdir(), Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10));
        try {
            pfs_1.writeFileSync(randomWaitMarkerPath, '');
            if (verbose) {
                console.log(`Marker file for --wait created: ${randomWaitMarkerPath}`);
            }
            return randomWaitMarkerPath;
        }
        catch (err) {
            if (verbose) {
                console.error(`Failed to create marker file for --wait: ${err}`);
            }
            return undefined;
        }
    }
    exports.createWaitMarkerFile = createWaitMarkerFile;
});
//# sourceMappingURL=argv.js.map