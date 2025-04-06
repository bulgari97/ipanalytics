import Api from "./api";

class Log extends Api {
    
    private async fetchData<T>(endpoint: string, key: string, timeout: number = 5000): Promise<T[]> {
        const controller: AbortController = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${Api.API_BASE_URL}/${endpoint}?key=${key}&start=0&stop=10`, { signal: controller.signal });
            clearTimeout(id);

            if (!response.ok) {
                this.pino.log({
                    level: LogLevel.ERROR,
                    method: "Log on client",
                    message: "Request error"
                });
            }

            return await response.json();
        } catch (error: unknown) {
            if (error instanceof Error) {
              this.pino.log({
                level: LogLevel.ERROR,
                method: "Log on client",
                error: error
              })
            } else {
              this.pino.log({
                level: LogLevel.ERROR,
                method: "Log on client",
                message: "Unknown type of error"
              });
            }
            return [];
        }
    }

    async getIPs(key: string): Promise<void> {
        const ips = await this.fetchData<IPData>("getIPs", key === "ips_by_time" ? "ips_by_time" : "active_ips");
        if (!Api.tbody) return;

        Api.tbody.innerHTML = ips.map((ip) => `
            <tr data-ip="${ip.ip}">
                <td>${ip.ip}</td>
                <td>${ip.userAgent}</td>
                <td>${ip.urls.length ? ip.urls.join(", ") : "-"}</td>
                <td>${new Date(ip.lastVisit * 1000).toLocaleString()}</td>
                <td><button onclick="banInstance.banIP('${ip.ip}')">Бан</button></td>
            </tr>
        `).join("");
    }

    async getUAs(key: string): Promise<void> {
        const uas = await this.fetchData<UAData>("getUAs", key === "uas_by_time" ? "uas_by_time" : "active_uas");
        if (!Api.tbody) return;

        Api.tbody.innerHTML = uas.map((ua) => `
            <tr data-ua="${ua.ua}">
                <td>${ua.ua}</td>
                <td>${ua.ips}</td>
                <td>${key === "uas_by_time" ? new Date(ua.score * 1000).toLocaleString() : ua.score}</td>
                <td><button onclick="banInstance.banUA('${ua.ua}')">Бан</button></td>
            </tr>
        `).join("");
    }

    async getBanned(key: string): Promise<void> {
        const bannedArr = await this.fetchData<BannedData>("getBANNED", key === "banned_ips" ? "banned_ips" : "banned_uas");
        if (!Api.tbody) return;

        Api.tbody.innerHTML = bannedArr.map((item) => `
            <tr>
                <td>${item.value}</td>
                <td>${item.score}</td>
            </tr>
        `).join("");
    }
}

export default Log;