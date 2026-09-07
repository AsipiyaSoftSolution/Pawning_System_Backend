const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SMS_PLACEHOLDER_REGEX = /@([A-Za-z0-9_]+)(?::([^@]+))?@/g;

function parseSmsDateValue(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const s = String(value).trim();
  if (!s) return null;

  const iso = s.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (iso) {
    return new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      Number(iso[4] || 0),
      Number(iso[5] || 0),
      Number(iso[6] || 0),
    );
  }

  const dmy = s.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (dmy) {
    return new Date(
      Number(dmy[3]),
      Number(dmy[2]) - 1,
      Number(dmy[1]),
      Number(dmy[4] || 0),
      Number(dmy[5] || 0),
      Number(dmy[6] || 0),
    );
  }

  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatSmsDateValue(value, pattern) {
  const raw = value == null ? "" : String(value);
  const format = String(pattern || "").trim();
  if (!format) return raw;

  const date = parseSmsDateValue(value);
  if (!date) return raw;

  const yyyy = date.getFullYear();
  const monthIndex = date.getMonth();
  const hours = date.getHours();
  const h12 = hours % 12 || 12;
  const tokens = {
    YYYY: String(yyyy),
    YY: String(yyyy).slice(-2),
    MMMM: MONTHS_LONG[monthIndex],
    MMM: MONTHS_SHORT[monthIndex],
    MM: String(monthIndex + 1).padStart(2, "0"),
    DD: String(date.getDate()).padStart(2, "0"),
    HH: String(hours).padStart(2, "0"),
    hh: String(h12).padStart(2, "0"),
    mm: String(date.getMinutes()).padStart(2, "0"),
    ss: String(date.getSeconds()).padStart(2, "0"),
    A: hours >= 12 ? "PM" : "AM",
  };

  return format.replace(/YYYY|MMMM|MMM|DD|HH|hh|mm|ss|MM|YY|A/g, (token) => {
    return tokens[token] ?? token;
  });
}

export function applySmsTemplateVariables(template, variables = {}) {
  return String(template || "").replace(
    SMS_PLACEHOLDER_REGEX,
    (match, key, format) => {
      if (!Object.prototype.hasOwnProperty.call(variables, key)) {
        return match;
      }
      const raw = variables[key];
      if (raw == null || raw === "") return "";
      if (format) return formatSmsDateValue(raw, format);
      return String(raw);
    },
  );
}
