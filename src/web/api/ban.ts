import Api from "./api";

class Ban extends Api {
    
    async ban(key: string, item: any, timeout: number = 5000): Promise<{ success: boolean; error?: any }> {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${Api.API_BASE_URL}/${key}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ item }),
                signal: controller.signal
            });

            clearTimeout(id);
            if (!response.ok) {
                this.pino.log({
                    level: LogLevel.ERROR,
                    method: "Ban on client",
                    message: "Request error"
                });
            }

            return await response.json();
        } catch (error: unknown) {
            if (error instanceof Error) {
              this.pino.log({
                level: LogLevel.ERROR,
                method: "Ban on client",
                error: error
              })
            } else {
              this.pino.log({
                level: LogLevel.ERROR,
                method: "Ban on client",
                message: "Unknown type of error"
              });
            }
          
            return { success: false, error };
        }
    }

    async banIP(ip: string): Promise<void> {
        const response = await this.ban("banIP", ip);
        if (response.success) {
            document.querySelector(`tr[data-ip="${ip}"]`)?.remove();
        } else {
            this.pino.log({
                level: LogLevel.ERROR,
                method: "Ban.banUA",
                message: "Error with ban IP on client",
                error: response.error
              });
        }
    }

    async banUA(ua: string): Promise<void> {
        const response = await this.ban("banUA", ua);
        if (response.success) {
            document.querySelector(`tr[data-ua="${ua}"]`)?.remove();
        } else {
            this.pino.log({
                level: LogLevel.ERROR,
                method: "Ban.banUA",
                message: "Error with ban UA on client",
                error: response.error
              });
        }
    }
}

export default Ban;
