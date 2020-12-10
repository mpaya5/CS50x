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
define(["require", "exports", "assert", "vs/base/parts/ipc/node/ipc.cp", "./testService", "vs/base/common/amd"], function (require, exports, assert, ipc_cp_1, testService_1, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createClient() {
        return new ipc_cp_1.Client(amd_1.getPathFromAmdModule(require, 'bootstrap-fork'), {
            serverName: 'TestServer',
            env: { AMD_ENTRYPOINT: 'vs/base/parts/ipc/test/node/testApp', verbose: true }
        });
    }
    suite('IPC, Child Process', () => {
        test('createChannel', () => {
            const client = createClient();
            const channel = client.getChannel('test');
            const service = new testService_1.TestServiceClient(channel);
            const result = service.pong('ping').then(r => {
                assert.equal(r.incoming, 'ping');
                assert.equal(r.outgoing, 'pong');
            });
            return result.finally(() => client.dispose());
        });
        test('events', () => {
            const client = createClient();
            const channel = client.getChannel('test');
            const service = new testService_1.TestServiceClient(channel);
            const event = new Promise((c, e) => {
                service.onMarco(({ answer }) => {
                    try {
                        assert.equal(answer, 'polo');
                        c(undefined);
                    }
                    catch (err) {
                        e(err);
                    }
                });
            });
            const request = service.marco();
            const result = Promise.all([request, event]);
            return result.finally(() => client.dispose());
        });
        test('event dispose', () => {
            const client = createClient();
            const channel = client.getChannel('test');
            const service = new testService_1.TestServiceClient(channel);
            let count = 0;
            const disposable = service.onMarco(() => count++);
            const result = service.marco().then((answer) => __awaiter(this, void 0, void 0, function* () {
                assert.equal(answer, 'polo');
                assert.equal(count, 1);
                const answer_1 = yield service.marco();
                assert.equal(answer_1, 'polo');
                assert.equal(count, 2);
                disposable.dispose();
                const answer_2 = yield service.marco();
                assert.equal(answer_2, 'polo');
                assert.equal(count, 2);
            }));
            return result.finally(() => client.dispose());
        });
    });
});
//# sourceMappingURL=ipc.cp.test.js.map