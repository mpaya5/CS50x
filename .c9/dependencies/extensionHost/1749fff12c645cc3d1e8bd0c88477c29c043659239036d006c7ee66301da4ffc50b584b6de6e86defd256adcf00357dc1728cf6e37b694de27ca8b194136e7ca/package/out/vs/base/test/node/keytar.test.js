var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "assert", "vs/base/common/platform"], function (require, exports, assert, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Keytar', () => {
        test('loads and is functional', function (done) {
            if (platform.isLinux) {
                // Skip test due to set up issue with Travis.
                this.skip();
                return;
            }
            (() => __awaiter(this, void 0, void 0, function* () {
                const keytar = yield new Promise((resolve_1, reject_1) => { require(['keytar'], resolve_1, reject_1); });
                const name = `VSCode Test ${Math.floor(Math.random() * 1e9)}`;
                try {
                    yield keytar.setPassword(name, 'foo', 'bar');
                    assert.equal(yield keytar.findPassword(name), 'bar');
                    assert.equal((yield keytar.findCredentials(name)).length, 1);
                    assert.equal(yield keytar.getPassword(name, 'foo'), 'bar');
                    yield keytar.deletePassword(name, 'foo');
                    assert.equal(yield keytar.getPassword(name, 'foo'), undefined);
                }
                catch (err) {
                    // try to clean up
                    try {
                        yield keytar.deletePassword(name, 'foo');
                    }
                    finally {
                        // tslint:disable-next-line: no-unsafe-finally
                        throw err;
                    }
                }
            }))().then(done, done);
        });
    });
});
//# sourceMappingURL=keytar.test.js.map