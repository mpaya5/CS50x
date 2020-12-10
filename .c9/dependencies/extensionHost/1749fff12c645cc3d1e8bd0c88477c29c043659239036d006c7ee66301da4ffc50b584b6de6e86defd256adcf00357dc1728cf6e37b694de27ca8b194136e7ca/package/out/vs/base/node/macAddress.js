/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "child_process", "vs/base/common/platform"], function (require, exports, child_process_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const cmdline = {
        windows: 'getmac.exe',
        unix: '/sbin/ifconfig -a || /sbin/ip link'
    };
    const invalidMacAddresses = [
        '00:00:00:00:00:00',
        'ff:ff:ff:ff:ff:ff',
        'ac:de:48:00:11:22'
    ];
    function validateMacAddress(candidate) {
        let tempCandidate = candidate.replace(/\-/g, ':').toLowerCase();
        for (let invalidMacAddress of invalidMacAddresses) {
            if (invalidMacAddress === tempCandidate) {
                return false;
            }
        }
        return true;
    }
    function getMac() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const timeout = setTimeout(() => reject('Unable to retrieve mac address (timeout after 10s)'), 10000);
            try {
                resolve(yield doGetMac());
            }
            catch (error) {
                reject(error);
            }
            finally {
                clearTimeout(timeout);
            }
        }));
    }
    exports.getMac = getMac;
    function doGetMac() {
        return new Promise((resolve, reject) => {
            try {
                child_process_1.exec(platform_1.isWindows ? cmdline.windows : cmdline.unix, { timeout: 10000 }, (err, stdout, stdin) => {
                    if (err) {
                        return reject(`Unable to retrieve mac address (${err.toString()})`);
                    }
                    else {
                        const regex = /(?:[a-f\d]{2}[:\-]){5}[a-f\d]{2}/gi;
                        let match;
                        while ((match = regex.exec(stdout)) !== null) {
                            const macAddressCandidate = match[0];
                            if (validateMacAddress(macAddressCandidate)) {
                                return resolve(macAddressCandidate);
                            }
                        }
                        return reject('Unable to retrieve mac address (unexpected format)');
                    }
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
});
//# sourceMappingURL=macAddress.js.map