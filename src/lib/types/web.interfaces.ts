interface IPData {
    ip: string;
    userAgent: string;
    urls: string[];
    lastVisit: number;
}

interface UAData {
    ua: string;
    ips: string;
    score: number;
}

interface BannedData {
    value: string;
    score: number;
}