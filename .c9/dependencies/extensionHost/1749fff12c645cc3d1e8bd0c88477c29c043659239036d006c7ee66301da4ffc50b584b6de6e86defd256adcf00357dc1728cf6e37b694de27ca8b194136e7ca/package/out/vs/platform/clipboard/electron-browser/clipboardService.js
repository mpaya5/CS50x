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
define(["require", "exports", "electron", "vs/base/common/uri", "vs/base/common/platform"], function (require, exports, electron_1, uri_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ClipboardService {
        writeText(text, type) {
            return __awaiter(this, void 0, void 0, function* () {
                electron_1.clipboard.writeText(text, type);
            });
        }
        readText(type) {
            return __awaiter(this, void 0, void 0, function* () {
                return electron_1.clipboard.readText(type);
            });
        }
        readTextSync() {
            return electron_1.clipboard.readText();
        }
        readFindText() {
            if (platform_1.isMacintosh) {
                return electron_1.clipboard.readFindText();
            }
            return '';
        }
        writeFindText(text) {
            if (platform_1.isMacintosh) {
                electron_1.clipboard.writeFindText(text);
            }
        }
        writeResources(resources) {
            if (resources.length) {
                electron_1.clipboard.writeBuffer(ClipboardService.FILE_FORMAT, this.resourcesToBuffer(resources));
            }
        }
        readResources() {
            return this.bufferToResources(electron_1.clipboard.readBuffer(ClipboardService.FILE_FORMAT));
        }
        hasResources() {
            return electron_1.clipboard.has(ClipboardService.FILE_FORMAT);
        }
        resourcesToBuffer(resources) {
            return Buffer.from(resources.map(r => r.toString()).join('\n'));
        }
        bufferToResources(buffer) {
            if (!buffer) {
                return [];
            }
            const bufferValue = buffer.toString();
            if (!bufferValue) {
                return [];
            }
            try {
                return bufferValue.split('\n').map(f => uri_1.URI.parse(f));
            }
            catch (error) {
                return []; // do not trust clipboard data
            }
        }
    }
    ClipboardService.FILE_FORMAT = 'code/file-list'; // Clipboard format for files
    exports.ClipboardService = ClipboardService;
});
//# sourceMappingURL=clipboardService.js.map