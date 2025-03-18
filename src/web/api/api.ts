import Server from "../../lib/api/server/server";
import PinoLogger from "../../lib/utils/pino";


class Api { 
    static API_BASE_URL: string;
    static tbody: HTMLTableSectionElement | null;

    private server: Server;
    protected pino: PinoLogger;

    constructor() {
        this.server = Server.getInstance();;
        this.pino = PinoLogger.getInstance();

        Api.API_BASE_URL = this.server.getURL() || "http://localhost:7649";
        Api.tbody = document.getElementById("tbody") as HTMLTableSectionElement | null;
    }
}

export default Api;
