import Server from "../lib/server/server";
import Api from "./api/api";
import Log from "./api/log";

declare global {
    interface Window {
        banInstance: Log;
    }
}

// Initialize the server (if it has not been created yet)
Server.getInstance();
const logInstance = new Log();

window.banInstance = logInstance; // Making it available in `window`

// Loading IP addresses when loading a page
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const ips = await logInstance.getIPs("active_ips");
        console.log("Active IPs:", ips);
    } catch (error) {
        console.error("Error fetching IPs:", error);
    }
});
