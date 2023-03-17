"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
var pino_1 = require("pino");
var pinoInstance = (0, pino_1.default)();
exports.logger = {
    logInfo: pinoInstance.info.bind(pinoInstance),
    logError: pinoInstance.error.bind(pinoInstance),
};
