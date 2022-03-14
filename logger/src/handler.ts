import { colors } from "../deps.ts";
import { LogLevelName, LoggerOptions } from "./custom-logger.ts";
import { getLevelName, getLevelByName, LogLevels } from "./levels.ts";
import { LogRecord, LogRecordOptions } from "./logger.ts";

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result != null
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 156, g: 67, b: 98 };
}
const appName = colors.rgb24("Land", hexToRgb("ff5e20"));

const LEVEL_COLOR_MAP = {
  CRITICAL: colors.brightRed,
  DEBUG: colors.green,
  INFO: colors.blue,
  ERROR: colors.red,
  WARNING: colors.yellow,
  NOTSET: colors.white,
} as const;

const lvl = (level: keyof typeof LEVEL_COLOR_MAP) => LEVEL_COLOR_MAP[level](level);

export interface LoggerContext {
  reqId?: string;
}

export class CustomLogRecord extends LogRecord {
  levelName: LogLevelName;
  ctx?: LoggerContext;

  constructor(opts: LogRecordOptions) {
    super(opts);
    this.levelName = getLevelName(opts.level);
  }
}

const captureRegex = /((at .*)|(at\s))(?<full>(file|https?).*:([0-9]+):([0-9]+))\)?$/gm;
function getCallee(stack: string) {
  const basePath = new URL("../", import.meta.url).href;
  const splits = stack.split("\n");
  const callees = [splits[5], splits[6], splits[4]];

  for (const callee of callees) {
    const captured = captureRegex.exec(callee);
    if (captured != null) {
      return captured[4].replace(basePath, "");
    }
  }
  return null;
}

export class CustomConsoleHandler {
  level: number;
  reqIdColorMap = new Map<string, number>();
  ctx: LoggerContext;

  constructor(public levelName: LogLevelName, public opts: LoggerOptions) {
    this.level = getLevelByName(levelName);
    this.ctx = opts.ctx;
  }

  async setup() {}
  async destroy() {}

  getPrefix(logRecord: CustomLogRecord) {
    let appNameDisplay = appName;
    const reqId = this.ctx.reqId ?? "server";
    const part = reqId.substring(0, 6);
    const rgbId = this.reqIdColorMap.get(reqId) ?? hexToRgb(part);

    if ("reqId" in this.ctx && this.ctx.reqId != null) {
      appNameDisplay += `@${colors.rgb24(part, rgbId)}`;
    } else {
      appNameDisplay += `@${colors.underline("server")}`;
    }

    const ts = colors.dim(colors.white(logRecord.datetime.toISOString()));
    const level = lvl(logRecord.levelName).padEnd(15);
    const prefix = `${ts} ${appNameDisplay} ${level} `;
    return prefix;
  }

  handle(logRecord: CustomLogRecord): void {
    logRecord.ctx = this.ctx;
    const err = new Error();
    Error.captureStackTrace(err, this.handle);
    const callee = getCallee(err.stack ?? "");

    if (this.level > logRecord.level) return;

    const pref = this.getPrefix(logRecord);

    const msg = pref + logRecord.msg + ` ${colors.blue(colors.underline(callee ?? ""))}`;

    switch (logRecord.level) {
      case LogLevels.DEBUG:
        return console.debug(msg);
      case LogLevels.INFO:
        return console.info(msg);
      default:
        return console.log(msg);
    }
  }

  log(msg: string): void {
    console.log(msg);
  }

  table(data: unknown) {
    console.table(data);
  }
}
