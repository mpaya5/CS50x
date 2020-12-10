/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/nls", "vs/base/common/uri", "vs/base/common/platform", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/jsonEdit", "vs/base/common/json", "vs/base/common/network", "vs/base/common/labels", "vs/base/common/extpath", "vs/platform/remote/common/remoteHosts"], function (require, exports, instantiation_1, nls_1, uri_1, platform_1, path_1, resources_1, jsonEdit, json, network_1, labels_1, extpath_1, remoteHosts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWorkspacesMainService = instantiation_1.createDecorator('workspacesMainService');
    exports.IWorkspacesService = instantiation_1.createDecorator('workspacesService');
    exports.WORKSPACE_EXTENSION = 'code-workspace';
    exports.WORKSPACE_FILTER = [{ name: nls_1.localize('codeWorkspace', "Code Workspace"), extensions: [exports.WORKSPACE_EXTENSION] }];
    exports.UNTITLED_WORKSPACE_NAME = 'workspace.json';
    function reviveWorkspaceIdentifier(workspace) {
        return { id: workspace.id, configPath: uri_1.URI.revive(workspace.configPath) };
    }
    exports.reviveWorkspaceIdentifier = reviveWorkspaceIdentifier;
    function isStoredWorkspaceFolder(thing) {
        return isRawFileWorkspaceFolder(thing) || isRawUriWorkspaceFolder(thing);
    }
    exports.isStoredWorkspaceFolder = isStoredWorkspaceFolder;
    function isRawFileWorkspaceFolder(thing) {
        return thing
            && typeof thing === 'object'
            && typeof thing.path === 'string'
            && (!thing.name || typeof thing.name === 'string');
    }
    exports.isRawFileWorkspaceFolder = isRawFileWorkspaceFolder;
    function isRawUriWorkspaceFolder(thing) {
        return thing
            && typeof thing === 'object'
            && typeof thing.uri === 'string'
            && (!thing.name || typeof thing.name === 'string');
    }
    exports.isRawUriWorkspaceFolder = isRawUriWorkspaceFolder;
    function isSingleFolderWorkspaceIdentifier(obj) {
        return obj instanceof uri_1.URI;
    }
    exports.isSingleFolderWorkspaceIdentifier = isSingleFolderWorkspaceIdentifier;
    function isWorkspaceIdentifier(obj) {
        const workspaceIdentifier = obj;
        return workspaceIdentifier && typeof workspaceIdentifier.id === 'string' && workspaceIdentifier.configPath instanceof uri_1.URI;
    }
    exports.isWorkspaceIdentifier = isWorkspaceIdentifier;
    function toWorkspaceIdentifier(workspace) {
        if (workspace.configuration) {
            return {
                configPath: workspace.configuration,
                id: workspace.id
            };
        }
        if (workspace.folders.length === 1) {
            return workspace.folders[0].uri;
        }
        // Empty workspace
        return undefined;
    }
    exports.toWorkspaceIdentifier = toWorkspaceIdentifier;
    function isSingleFolderWorkspaceInitializationPayload(obj) {
        return isSingleFolderWorkspaceIdentifier(obj.folder);
    }
    exports.isSingleFolderWorkspaceInitializationPayload = isSingleFolderWorkspaceInitializationPayload;
    const WORKSPACE_SUFFIX = '.' + exports.WORKSPACE_EXTENSION;
    function hasWorkspaceFileExtension(path) {
        const ext = (typeof path === 'string') ? path_1.extname(path) : resources_1.extname(path);
        return ext === WORKSPACE_SUFFIX;
    }
    exports.hasWorkspaceFileExtension = hasWorkspaceFileExtension;
    const SLASH = '/';
    /**
     * Given a folder URI and the workspace config folder, computes the IStoredWorkspaceFolder using
    * a relative or absolute path or a uri.
     * Undefined is returned if the folderURI and the targetConfigFolderURI don't have the same schema or authority
     *
     * @param folderURI a workspace folder
     * @param folderName a workspace name
     * @param targetConfigFolderURI the folder where the workspace is living in
     * @param useSlashForPath if set, use forward slashes for file paths on windows
     */
    function getStoredWorkspaceFolder(folderURI, folderName, targetConfigFolderURI, useSlashForPath = !platform_1.isWindows) {
        if (folderURI.scheme !== targetConfigFolderURI.scheme) {
            return { name: folderName, uri: folderURI.toString(true) };
        }
        let folderPath;
        if (resources_1.isEqualOrParent(folderURI, targetConfigFolderURI)) {
            // use relative path
            folderPath = resources_1.relativePath(targetConfigFolderURI, folderURI) || '.'; // always uses forward slashes
            if (platform_1.isWindows && folderURI.scheme === network_1.Schemas.file && !useSlashForPath) {
                // Windows gets special treatment:
                // - use backslahes unless slash is used by other existing folders
                folderPath = folderPath.replace(/\//g, '\\');
            }
        }
        else {
            // use absolute path
            if (folderURI.scheme === network_1.Schemas.file) {
                folderPath = folderURI.fsPath;
                if (platform_1.isWindows) {
                    // Windows gets special treatment:
                    // - normalize all paths to get nice casing of drive letters
                    // - use backslahes unless slash is used by other existing folders
                    folderPath = labels_1.normalizeDriveLetter(folderPath);
                    if (useSlashForPath) {
                        folderPath = extpath_1.toSlashes(folderPath);
                    }
                }
            }
            else {
                if (!resources_1.isEqualAuthority(folderURI.authority, targetConfigFolderURI.authority)) {
                    return { name: folderName, uri: folderURI.toString(true) };
                }
                folderPath = folderURI.path;
            }
        }
        return { name: folderName, path: folderPath };
    }
    exports.getStoredWorkspaceFolder = getStoredWorkspaceFolder;
    /**
     * Rewrites the content of a workspace file to be saved at a new location.
     * Throws an exception if file is not a valid workspace file
     */
    function rewriteWorkspaceFileForNewLocation(rawWorkspaceContents, configPathURI, targetConfigPathURI) {
        let storedWorkspace = doParseStoredWorkspace(configPathURI, rawWorkspaceContents);
        const sourceConfigFolder = resources_1.dirname(configPathURI);
        const targetConfigFolder = resources_1.dirname(targetConfigPathURI);
        const rewrittenFolders = [];
        const slashForPath = useSlashForPath(storedWorkspace.folders);
        // Rewrite absolute paths to relative paths if the target workspace folder
        // is a parent of the location of the workspace file itself. Otherwise keep
        // using absolute paths.
        for (const folder of storedWorkspace.folders) {
            let folderURI = isRawFileWorkspaceFolder(folder) ? resources_1.resolvePath(sourceConfigFolder, folder.path) : uri_1.URI.parse(folder.uri);
            rewrittenFolders.push(getStoredWorkspaceFolder(folderURI, folder.name, targetConfigFolder, slashForPath));
        }
        // Preserve as much of the existing workspace as possible by using jsonEdit
        // and only changing the folders portion.
        const formattingOptions = { insertSpaces: false, tabSize: 4, eol: (platform_1.isLinux || platform_1.isMacintosh) ? '\n' : '\r\n' };
        const edits = jsonEdit.setProperty(rawWorkspaceContents, ['folders'], rewrittenFolders, formattingOptions);
        let newContent = jsonEdit.applyEdits(rawWorkspaceContents, edits);
        if (storedWorkspace.remoteAuthority === remoteHosts_1.getRemoteAuthority(targetConfigPathURI)) {
            // unsaved remote workspaces have the remoteAuthority set. Remove it when no longer nexessary.
            newContent = jsonEdit.applyEdits(newContent, jsonEdit.removeProperty(newContent, ['remoteAuthority'], formattingOptions));
        }
        return newContent;
    }
    exports.rewriteWorkspaceFileForNewLocation = rewriteWorkspaceFileForNewLocation;
    function doParseStoredWorkspace(path, contents) {
        // Parse workspace file
        let storedWorkspace = json.parse(contents); // use fault tolerant parser
        // Filter out folders which do not have a path or uri set
        if (Array.isArray(storedWorkspace.folders)) {
            storedWorkspace.folders = storedWorkspace.folders.filter(folder => isStoredWorkspaceFolder(folder));
        }
        // Validate
        if (!Array.isArray(storedWorkspace.folders)) {
            throw new Error(`${path} looks like an invalid workspace file.`);
        }
        return storedWorkspace;
    }
    function useSlashForPath(storedFolders) {
        if (platform_1.isWindows) {
            for (const folder of storedFolders) {
                if (isRawFileWorkspaceFolder(folder) && folder.path.indexOf(SLASH) >= 0) {
                    return true;
                }
            }
            return false;
        }
        return true;
    }
    exports.useSlashForPath = useSlashForPath;
});
//# sourceMappingURL=workspaces.js.map