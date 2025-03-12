import Log from "./log.js";
import Ban from "./ban.js";

const logInstance = new Log();
const banInstance = new Ban();

// Загружаем IP-шники при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    logInstance.getIPs("active_ips");
});

// Делаем `banInstance` глобальным, чтобы можно было вызывать в `onclick`
window.banInstance = banInstance;
