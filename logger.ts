import pino from "pino";

const pinoInstance = pino();

export const logger = {
  logInfo: pinoInstance.info.bind(pinoInstance),
  logError: pinoInstance.error.bind(pinoInstance),
};
