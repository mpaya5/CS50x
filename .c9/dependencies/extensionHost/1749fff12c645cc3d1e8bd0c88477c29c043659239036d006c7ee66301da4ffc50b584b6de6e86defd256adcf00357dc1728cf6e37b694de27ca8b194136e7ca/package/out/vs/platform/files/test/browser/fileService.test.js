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
define(["require", "exports", "assert", "vs/platform/files/common/fileService", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/base/common/async", "vs/platform/files/test/common/nullFileSystemProvider"], function (require, exports, assert, fileService_1, uri_1, lifecycle_1, log_1, async_1, nullFileSystemProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('File Service', () => {
        test('provider registration', () => __awaiter(this, void 0, void 0, function* () {
            const service = new fileService_1.FileService(new log_1.NullLogService());
            const resource = uri_1.URI.parse('test://foo/bar');
            assert.equal(service.canHandleResource(resource), false);
            const registrations = [];
            service.onDidChangeFileSystemProviderRegistrations(e => {
                registrations.push(e);
            });
            let registrationDisposable = undefined;
            let callCount = 0;
            service.onWillActivateFileSystemProvider(e => {
                callCount++;
                if (e.scheme === 'test' && callCount === 1) {
                    e.join(new Promise(resolve => {
                        registrationDisposable = service.registerProvider('test', new nullFileSystemProvider_1.NullFileSystemProvider());
                        resolve();
                    }));
                }
            });
            yield service.activateProvider('test');
            assert.equal(service.canHandleResource(resource), true);
            assert.equal(registrations.length, 1);
            assert.equal(registrations[0].scheme, 'test');
            assert.equal(registrations[0].added, true);
            assert.ok(registrationDisposable);
            yield service.activateProvider('test');
            assert.equal(callCount, 2); // activation is called again
            assert.equal(service.hasCapability(resource, 2048 /* Readonly */), true);
            assert.equal(service.hasCapability(resource, 4 /* FileOpenReadWriteClose */), false);
            registrationDisposable.dispose();
            assert.equal(service.canHandleResource(resource), false);
            assert.equal(registrations.length, 2);
            assert.equal(registrations[1].scheme, 'test');
            assert.equal(registrations[1].added, false);
        }));
        test('watch', () => __awaiter(this, void 0, void 0, function* () {
            const service = new fileService_1.FileService(new log_1.NullLogService());
            let disposeCounter = 0;
            service.registerProvider('test', new nullFileSystemProvider_1.NullFileSystemProvider(() => {
                return lifecycle_1.toDisposable(() => {
                    disposeCounter++;
                });
            }));
            yield service.activateProvider('test');
            const resource1 = uri_1.URI.parse('test://foo/bar1');
            const watcher1Disposable = service.watch(resource1);
            yield async_1.timeout(0); // service.watch() is async
            assert.equal(disposeCounter, 0);
            watcher1Disposable.dispose();
            assert.equal(disposeCounter, 1);
            disposeCounter = 0;
            const resource2 = uri_1.URI.parse('test://foo/bar2');
            const watcher2Disposable1 = service.watch(resource2);
            const watcher2Disposable2 = service.watch(resource2);
            const watcher2Disposable3 = service.watch(resource2);
            yield async_1.timeout(0); // service.watch() is async
            assert.equal(disposeCounter, 0);
            watcher2Disposable1.dispose();
            assert.equal(disposeCounter, 0);
            watcher2Disposable2.dispose();
            assert.equal(disposeCounter, 0);
            watcher2Disposable3.dispose();
            assert.equal(disposeCounter, 1);
            disposeCounter = 0;
            const resource3 = uri_1.URI.parse('test://foo/bar3');
            const watcher3Disposable1 = service.watch(resource3);
            const watcher3Disposable2 = service.watch(resource3, { recursive: true, excludes: [] });
            yield async_1.timeout(0); // service.watch() is async
            assert.equal(disposeCounter, 0);
            watcher3Disposable1.dispose();
            assert.equal(disposeCounter, 1);
            watcher3Disposable2.dispose();
            assert.equal(disposeCounter, 2);
        }));
    });
});
//# sourceMappingURL=fileService.test.js.map