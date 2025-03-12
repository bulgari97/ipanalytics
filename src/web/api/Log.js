import Api from "./api";

class Log extends Api {
    constructor() {
        super();
    }

    async fetchData(endpoint, key, timeout = 5000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${this.API_BASE_URL}/${endpoint}?key=${key}&start=0&stop=10`, { signal: controller.signal });
            clearTimeout(id);
            if (!response.ok) throw new Error(`Ошибка запроса: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            if (error.name === "AbortError") {
                console.warn("Запрос был отменен из-за тайм-аута");
            } else {
                console.error("Ошибка получения данных:", error);
            }
            return [];
        }
    }

    async getIPs(key) {
        const ips = await this.fetchData("getIPs", key === "ips_by_time" ? "ips_by_time" : "active_ips");
        this.tbody.innerHTML = ips.map((ip) => `
            <tr data-ip="${ip.ip}">
                <td>${ip.ip}</td>
                <td>${ip.userAgent}</td>
                <td>${ip.urls.length ? ip.urls.join(", ") : "-"}</td>
                <td>${new Date(ip.lastVisit * 1000).toLocaleString()}</td>
                <td><button onclick="banInstance.banIP('${ip.ip}')">Бан</button></td>
            </tr>
        `).join("");
    }

    async getUAs(key) {
        const uas = await this.fetchData("getUAs", key === "uas_by_time" ? "uas_by_time" : "active_uas");
        this.tbody.innerHTML = uas.map((ua) => `
            <tr data-ua="${ua.ua}">
                <td>${ua.ua}</td>
                <td>${ua.ips}</td>
                <td>${key === "uas_by_time" ? new Date(ua.score * 1000).toLocaleString() : ua.score}</td>
                <td><button onclick="banInstance.banUA('${ua.ua}')">Бан</button></td>
            </tr>
        `).join("");
    }

    async getBanned(key) {
        const bannedArr = await this.fetchData("getBANNED", key === "banned_ips" ? "banned_ips" : "banned_uas");
        this.tbody.innerHTML = bannedArr.map((item) => `
            <tr>
                <td>${item.value}</td>
                <td>${item.score}</td>
            </tr>
        `).join("");
    }
}

export default Log;
