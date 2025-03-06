interface IValuesByKey {
  value: string;
  score: number;
};

interface IReturnedArray {
  ip: string;
  userAgent: string | undefined;
  urls: string[];
  lastVisit: number;
};

type keyIPs = "ips_by_time" | "active_ips";

type keyUAs = "uas_by_time" | "active_uas";

enum LogLevel {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
};