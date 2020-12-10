/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

Object.defineProperty(exports, "__esModule", { value: true });
var os = require("os");

var TelemetryReporter = /** @class */ (function () {
    function TelemetryReporter(extensionId, extensionVersion, key, firstParty) {
        this.extensionId = extensionId;
        this.extensionVersion = extensionVersion;
    }
    TelemetryReporter.prototype.updateUserOptIn = function (key) { };
    TelemetryReporter.prototype.createAppInsightsClient = function (key) { };
    TelemetryReporter.prototype.getCommonProperties = function () {
        var commonProperties = Object.create(null);
        commonProperties['common.os'] = os.platform();
        commonProperties['common.platformversion'] = (os.release() || '').replace(/^(\d+)(\.\d+)?(\.\d+)?(.*)/, '$1$2$3');
        commonProperties['common.extname'] = this.extensionId;
        commonProperties['common.extversion'] = this.extensionVersion;
        // if (vscode && vscode.env) {
        //     commonProperties['common.vscodemachineid'] = vscode.env.machineId;
        //     commonProperties['common.vscodesessionid'] = vscode.env.sessionId;
        //     commonProperties['common.vscodeversion'] = vscode.version;
        //     switch (vscode.env.uiKind) {
        //         case vscode.UIKind.Web:
        //             commonProperties['common.uikind'] = 'web';
        //             break;
        //         case vscode.UIKind.Desktop:
        //             commonProperties['common.uikind'] = 'desktop';
        //             break;
        //         default:
        //             commonProperties['common.uikind'] = 'unknown';
        //     }
        //     commonProperties['common.remotename'] = this.cleanRemoteName(vscode.env.remoteName);
        // }
        return commonProperties;
    };
    TelemetryReporter.prototype.cleanRemoteName = function (remoteName) {
        if (!remoteName) {
            return 'none';
        }
        return 'other';
    };
    TelemetryReporter.prototype.shouldSendErrorTelemetry = function () { return false; };
    Object.defineProperty(TelemetryReporter.prototype, "extension", {
        get: function () {
            return undefined;
        },
        enumerable: false,
        configurable: true
    });
    TelemetryReporter.prototype.cloneAndChange = function (obj, change) {
        var ret = {};
        return ret;
    };
    TelemetryReporter.prototype.anonymizeFilePaths = function (stack, anonymizeFilePaths) {
        return '';
    };
    TelemetryReporter.prototype.sendTelemetryEvent = function (eventName, properties, measurements) { };
    TelemetryReporter.prototype.sendTelemetryErrorEvent = function (eventName, properties, measurements, errorProps) { };
    TelemetryReporter.prototype.sendTelemetryException = function (error, properties, measurements) { };
    TelemetryReporter.prototype.dispose = function () { return new Promise(function () { return undefined; }); };
    return TelemetryReporter;
}());

exports.default = TelemetryReporter;
