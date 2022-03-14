import { CustomConsoleHandler, LoggerContext } from "./handler.ts";
import { LogLevels } from "./levels.ts";
import { Logger } from "./logger.ts";

export type LogLevelName = keyof typeof LogLevels;

export interface LoggerOptions {
  ctx: LoggerContext;
  name: string;
  logLevel: LogLevelName;
}

export class CustomLogger extends Logger {
  constructor(public opts: LoggerOptions) {
    super(opts.name, opts.logLevel);
    this.handlers.push(new CustomConsoleHandler(opts.logLevel, opts));
  }

  table(tabularData?: unknown, properties?: string[] | undefined) {
    console.table(tabularData, properties);
  }
}
