/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/platform/log/common/log", "winston"], function (require, exports, path, log_1, winston) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createRotatingLogger(name, filename, filesize, filecount) {
        return new WinstonRotatingLogger(name, filename, filesize, filecount);
    }
    exports.createRotatingLogger = createRotatingLogger;
    class File extends winston.transports.File {
        constructor(options) {
            super(options);
            this.eol = "";
        }
    }
    function getLogDir(filename) {
        const parts = filename.match(/(.*)[\/\\]/);
        return parts && parts.length > 1 ? parts[1] : "";
    }
    exports.getLogDir = getLogDir;
    class WinstonRotatingLogger {
        constructor(name, filename, filesize, filecount) {
            const transport = new File({
                dirname: getLogDir(filename),
                filename: `${name}.log`,
                format: winston.format.printf(({ message }) => message),
                maxsize: filesize,
                maxFiles: filecount,
            });
            this.winstonLogger = winston.createLogger({
                transports: [transport],
            });
        }
        // winston log levels: https://github.com/winstonjs/winston#logging
        trace(message) {
            this.winstonLogger.log({
                level: "verbose",
                message: message,
            });
        }
        debug(message) {
            this.winstonLogger.log({
                level: "debug",
                message: message,
            });
        }
        info(message) {
            this.winstonLogger.log({
                level: "info",
                message: message,
            });
        }
        warn(message) {
            this.winstonLogger.log({
                level: "warn",
                message: message,
            });
        }
        error(message) {
            this.winstonLogger.log({
                level: "error",
                message: message,
            });
        }
        critical(message) {
            this.winstonLogger.log({
                level: "error",
                message: message,
            });
        }
        setLevel(level) {
            this.winstonLogger.configure({
                level: this.parseLogLevel(level),
            });
        }
        flush() { }
        parseLogLevel(level) {
            switch (level) {
                case log_1.LogLevel.Error:
                case log_1.LogLevel.Critical: return "error";
                case log_1.LogLevel.Warning: return "warn";
                case log_1.LogLevel.Info: return "info";
                case log_1.LogLevel.Debug: return "debug";
                case log_1.LogLevel.Trace: return "trace";
                default: throw new Error('Invalid log level');
            }
        }
    }
    exports.WinstonRotatingLogger = WinstonRotatingLogger;
    class SpdLogService extends log_1.AbstractLogService {
        constructor(name, logsFolder, level) {
            super();
            this.name = name;
            this.logsFolder = logsFolder;
            this._logger = this._createDefaultLogger();
            this._register(this.onDidChangeLogLevel(level => {
                this._logger.setLevel(level);
            }));
            this.setLevel(level);
        }
        _createDefaultLogger() {
            const logfilePath = path.join(this.logsFolder, `${this.name}.log`);
            return createRotatingLogger(this.name, logfilePath, 1024 * 1024 * 5, 6);
        }
        trace() {
            if (this.getLevel() <= log_1.LogLevel.Trace) {
                this._logger.trace(this.format(arguments));
            }
        }
        debug() {
            if (this.getLevel() <= log_1.LogLevel.Debug) {
                this._logger.debug(this.format(arguments));
            }
        }
        info() {
            if (this.getLevel() <= log_1.LogLevel.Info) {
                this._logger.info(this.format(arguments));
            }
        }
        warn() {
            if (this.getLevel() <= log_1.LogLevel.Warning) {
                this._logger.warn(this.format(arguments));
            }
        }
        error() {
            if (this.getLevel() <= log_1.LogLevel.Error) {
                const arg = arguments[0];
                if (arg instanceof Error) {
                    const array = Array.prototype.slice.call(arguments);
                    array[0] = arg.stack;
                    this._logger.error(this.format(array));
                }
                else {
                    this._logger.error(this.format(arguments));
                }
            }
        }
        critical() {
            if (this.getLevel() <= log_1.LogLevel.Critical) {
                this._logger.error(this.format(arguments));
            }
        }
        dispose() { }
        format(args) {
            let result = '';
            for (let i = 0; i < args.length; i++) {
                let a = args[i];
                if (typeof a === 'object') {
                    try {
                        a = JSON.stringify(a);
                    }
                    catch (e) { }
                }
                result += (i > 0 ? ' ' : '') + a;
            }
            return result;
        }
    }
    exports.SpdLogService = SpdLogService;
});
//# sourceMappingURL=spdlogService.js.map