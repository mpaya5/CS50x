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
define(["require", "exports", "vs/platform/environment/node/environmentService", "vs/base/common/decorators", "vs/base/common/uri", "vs/base/common/network", "vs/workbench/services/backup/common/backup", "vs/base/common/path"], function (require, exports, environmentService_1, decorators_1, uri_1, network_1, backup_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WorkbenchEnvironmentService extends environmentService_1.EnvironmentService {
        constructor(configuration, execPath) {
            super(configuration, execPath);
            this.configuration = configuration;
            this.webviewResourceRoot = 'vscode-resource:{{resource}}';
            this.webviewCspSource = 'vscode-resource:';
            this.configuration.backupWorkspaceResource = this.configuration.backupPath ? backup_1.toBackupWorkspaceResource(this.configuration.backupPath, this) : undefined;
        }
        get skipGettingStarted() { return !!this.args['skip-getting-started']; }
        get skipReleaseNotes() { return !!this.args['skip-release-notes']; }
        get userRoamingDataHome() { return this.appSettingsHome.with({ scheme: network_1.Schemas.userData }); }
        get logFile() { return uri_1.URI.file(path_1.join(this.logsPath, `renderer${this.configuration.windowId}.log`)); }
        get logExtensionHostCommunication() { return !!this.args.logExtensionHostCommunication; }
        get debugSearch() { return environmentService_1.parseSearchPort(this.args, this.isBuilt); }
    }
    __decorate([
        decorators_1.memoize
    ], WorkbenchEnvironmentService.prototype, "userRoamingDataHome", null);
    __decorate([
        decorators_1.memoize
    ], WorkbenchEnvironmentService.prototype, "logFile", null);
    __decorate([
        decorators_1.memoize
    ], WorkbenchEnvironmentService.prototype, "debugSearch", null);
    exports.WorkbenchEnvironmentService = WorkbenchEnvironmentService;
});
//# sourceMappingURL=environmentService.js.map