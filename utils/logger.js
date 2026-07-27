import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.resolve(__dirname, "../logs");

/** Keep ~1 month of daily files; older files are deleted automatically. */
const RETENTION = "30d";
const MAX_SIZE = "10m";

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    ({ level, message, timestamp }) =>
      `[${timestamp}] ${level.toUpperCase()}: ${message}`,
  ),
);

const domainLoggers = new Map();

const errorLogger = winston.createLogger({
  level: "error",
  format: fileFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, "errors", "%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxFiles: RETENTION,
      maxSize: MAX_SIZE,
    }),
  ],
});

function getDomainLogger(domain) {
  if (!domainLoggers.has(domain)) {
    domainLoggers.set(
      domain,
      winston.createLogger({
        level: "info",
        format: fileFormat,
        transports: [
          new DailyRotateFile({
            filename: path.join(logDir, domain, "%DATE%.log"),
            datePattern: "YYYY-MM-DD",
            maxFiles: RETENTION,
            maxSize: MAX_SIZE,
          }),
        ],
      }),
    );
  }
  return domainLoggers.get(domain);
}

function detectDomain(stack) {
  const DOMAIN_MAP = [
    [["auth.controller", "auth.route", "auth.middleware"], "auth"],
    [["pawning.ticket.payment", "ticket.payment"], "payment"],
    [["pawning.ticket", "ticket"], "ticket"],
    [["customer.controller", "customer.route"], "customer"],
    [["company.controller", "company.route"], "company"],
    [["account.controller", "account.route"], "account"],
    [["report.controller", "report.route"], "report"],
    [["dashboard"], "dashboard"],
    [["accountCenterApi"], "account-center"],
    [["server.js", "db.js", "mailConfig"], "app"],
  ];

  for (const [keywords, domain] of DOMAIN_MAP) {
    if (keywords.some((k) => stack.includes(k))) return domain;
  }
  return "app";
}

function formatArgs(args) {
  return args
    .map((a) =>
      a instanceof Error
        ? `${a.message}\n${a.stack}`
        : typeof a === "object" && a !== null
          ? JSON.stringify(a)
          : String(a),
    )
    .join(" ");
}

/**
 * Intercept console.* so errors are written under logs/{domain}/ and logs/errors/.
 * Daily files older than 30 days are removed automatically by winston-daily-rotate-file.
 */
export function setupLogger() {
  const orig = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  function intercept(level, origFn, args) {
    origFn(...args);
    if (level !== "error") return;

    const message = formatArgs(args);
    const stack = new Error().stack || "";
    const domain = detectDomain(stack);

    getDomainLogger(domain).error(message);
    errorLogger.error(`[${domain}] ${message}`);
  }

  console.log = (...args) => intercept("info", orig.log, args);
  console.info = (...args) => intercept("info", orig.info, args);
  console.warn = (...args) => intercept("warn", orig.warn, args);
  console.error = (...args) => intercept("error", orig.error, args);
}
