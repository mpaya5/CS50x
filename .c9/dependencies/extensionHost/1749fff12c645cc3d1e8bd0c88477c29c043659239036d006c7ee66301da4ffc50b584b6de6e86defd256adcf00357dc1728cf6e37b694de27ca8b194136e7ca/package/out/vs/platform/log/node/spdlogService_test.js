var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "assert", "fs", "./spdlogService", "mocha"], function (require, exports, assert, fs, spdlogService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe("spdlogService", () => {
        it(`should get directory from path`, function () {
            return __awaiter(this, void 0, void 0, function* () {
                assert.deepEqual(spdlogService_1.getLogDir(`/local/home/test/output_logging_20191209T105841/1-AWS Toolkit Logs.log`), `/local/home/test/output_logging_20191209T105841`);
            });
        });
        describe("WinstonRotatingLogger", () => {
            const name = "WinstonRotatingLogger";
            const filePath = `${__dirname}/${name}.log`;
            const logger = new spdlogService_1.WinstonRotatingLogger(name, filePath, 1024 * 1024 * 30, 1);
            after(() => {
                fs.unlink(filePath, () => { });
            });
            it('should log output channel messages without modifications', (done) => {
                logger.info('test message\n');
                fs.readFile(filePath, (error, data) => {
                    assert.equal(data, "test message\n");
                    done();
                });
            });
        });
    });
});
//# sourceMappingURL=spdlogService_test.js.map