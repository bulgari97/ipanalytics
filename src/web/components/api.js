const tbody = document.getElementById("tbody");

// !!!!!!!!! СДЕЛАЙ ВОЗМОЖНОСТЬ ПРОКИНУТЬ .ENV И В ДОКУ НЕ ЗАБУДЬ ЗАКИНУТЬ ЭТУ ВОЗМОЖНОСТЬ !!!!!!!!!!!!! И ПОМЕНЯЙ ПОРТ НА РАНДОМ

const API_BASE_URL = process.env.API_URL || "http://localhost:1488";

// !!!!!!!!!!!! НЕ ЗАБУДЬ ДОДЕЛАТЬ БАНЫ ПО АЙПИ И ЮЗЕРАГЕНТУ !!!!!!!!

async function fetchData(endpoint, key, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(`http://localhost:1488/${endpoint}?key=${key}&start=0&stop=10`, { signal: controller.signal });
        clearTimeout(id);
        if (!response.ok) throw new Error(`Ошибка запроса: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("Ошибка получения данных:", error);
        return [];
    }
}

async function getIPs(key) {
    const ips = await fetchData("/getIPs", key === "ips_by_time" ? "ips_by_time" : "active_ips");
    const tbody = document.querySelector("#table-body");

    tbody.innerHTML = ips.map((ip) => `
        <tr>
            <td>${ip.ip}</td>
            <td>${ip.userAgent}</td>
            <td>${ip.urls.length ? ip.urls.join(", ") : "-"}</td>
            <td>${new Date(ip.lastVisit * 1000).toLocaleString()}</td>
        </tr>
    `).join("");
}

async function getUAs(key) {
    const uas = await fetchData("/getUAs", key === "uas_by_time" ? "uas_by_time" : "active_uas");
    const tbody = document.querySelector("#table-body");

    tbody.innerHTML = uas.map((ua) => `
        <tr>
            <td>${ua.ua}</td>
            <td>${ua.ips}</td>
            <td>${key === "uas_by_time" ? new Date(ua.score * 1000).toLocaleString() : ua.score}</td>
        </tr>
    `).join("");
}

async function getBanned(key) {
    const bannedArr = await fetchData("/getBANNED", key === "banned_ips" ? "banned_ips" : "banned_uas");
    const tbody = document.querySelector("#table-body");

    tbody.innerHTML = bannedArr.map((item) => `
        <tr>
            <td>${item.value}</td>
            <td>${item.score}</td>
        </tr>
    `).join("");
}


// !!!!!!!!!!!! НЕ ЗАБУДЬ ДОДЕЛАТЬ БАНЫ ПО АЙПИ И ЮЗЕРАГЕНТУ !!!!!!!!