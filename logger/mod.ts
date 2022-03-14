import { CustomLogger } from "./src/custom-logger.ts";

const logger = new CustomLogger({ logLevel: "INFO", name: "default", ctx: {} });

export { logger };
export * from "./src/custom-logger.ts";
export * from "./src/levels.ts";
export { LogRecord, Logger } from "./src/logger.ts";
export * from "./src/handler.ts";
export type { LogRecordOptions } from "./src/logger.ts";
