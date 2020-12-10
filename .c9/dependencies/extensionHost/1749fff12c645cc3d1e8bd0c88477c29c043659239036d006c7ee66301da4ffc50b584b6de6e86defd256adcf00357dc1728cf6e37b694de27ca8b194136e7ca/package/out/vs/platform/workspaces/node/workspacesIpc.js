/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri"], function (require, exports, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WorkspacesChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'createUntitledWorkspace': {
                    const rawFolders = arg[0];
                    const remoteAuthority = arg[1];
                    let folders = undefined;
                    if (Array.isArray(rawFolders)) {
                        folders = rawFolders.map(rawFolder => {
                            return {
                                uri: uri_1.URI.revive(rawFolder.uri),
                                name: rawFolder.name
                            };
                        });
                    }
                    return this.service.createUntitledWorkspace(folders, remoteAuthority);
                }
                case 'deleteUntitledWorkspace': {
                    const w = arg;
                    return this.service.deleteUntitledWorkspace({ id: w.id, configPath: uri_1.URI.revive(w.configPath) });
                }
                case 'getWorkspaceIdentifier': {
                    return this.service.getWorkspaceIdentifier(uri_1.URI.revive(arg));
                }
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.WorkspacesChannel = WorkspacesChannel;
});
//# sourceMappingURL=workspacesIpc.js.map