interface IValuesByKey {
  value: string;
  score: number;
};

interface IReturnedIPs {
  ip: string;
  userAgent: string | undefined;
  urls: string[];
  lastVisit: number;
};

interface IReturnedUAs {
  ua: string | undefined;
  ips: string[];
  score: number;
};

type keyIPs = "ips_by_time" | "active_ips";

type keyUAs = "uas_by_time" | "active_uas";

type keyBANNED = "banned_ips" | "banned_uas";

enum LogLevel {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
};