import Api from "./api";

class Ban extends Api {
    constructor() {
        super();
    }

    async ban(key, item, timeout = 5000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${this.API_BASE_URL}/${key}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ item }),
                signal: controller.signal
            });

            clearTimeout(id);
            if (!response.ok) throw new Error(`Ошибка запроса: ${response.statusText}`);

            return await response.json();
        } catch (error) {
            if (error.name === "AbortError") {
                console.warn("Запрос был отменен из-за тайм-аута");
            } else {
                console.error("Ошибка получения данных:", error);
            }
            return { success: false, error };
        }
    }

    async banIP(ip) {
        const response = await this.ban("banIP", ip);
        if (response.success) {
            document.querySelector(`tr[data-ip="${ip}"]`)?.remove();
        } else {
            console.error("Ошибка при бане IP:", response.error);
        }
    }

    async banUA(ua) {
        const response = await this.ban("banUA", ua);
        if (response.success) {
            document.querySelector(`tr[data-ua="${ua}"]`)?.remove();
        } else {
            console.error("Ошибка при бане UA:", response.error);
        }
    }
}

export default Ban;
