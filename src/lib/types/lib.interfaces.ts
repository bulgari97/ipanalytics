interface IValuesByKey {
  value: string;
  score: number;
}

interface IReturnedIPs {
  ip: string;
  userAgent: string | undefined;
  urls: string[];
  lastVisit: number;
}

interface IReturnedUAs {
  ua: string | undefined;
  ips: string[];
  score: number;
}
