// ---- STORAGE ----

// Дані каталогу (категорії + елементи)
let catalogData = JSON.parse(localStorage.getItem("catalogData")) || {};

// Зберегти в localStorage
function saveCatalog() {
    localStorage.setItem("catalogData", JSON.stringify(catalogData));
}

// ---- РЕНДЕРИНГ ----

function renderCatalog() {
    const shortcuts = document.querySelector("#shortcuts ul");
    shortcuts.innerHTML = ""; // очистити старі

    for (const categoryName in catalogData) {
        const category = catalogData[categoryName];

        const li = document.createElement("li");
        const div = document.createElement("div");
        div.classList.add("category");

        const strong = document.createElement("strong");
        strong.textContent = categoryName;

        const innerUl = document.createElement("ul");

        category.forEach(item => {
            const itemLi = document.createElement("li");

            const a = document.createElement("a");
            a.href = item.url;
            a.rel = "noopener noreferrer";

            const img = document.createElement("img");
            img.src = item.icon;
            img.classList.add("icon");

            a.appendChild(img);
            a.appendChild(document.createTextNode(" " + item.name));
            itemLi.appendChild(a);
            innerUl.appendChild(itemLi);
        });

        div.appendChild(strong);
        div.appendChild(innerUl);
        li.appendChild(div);
        shortcuts.appendChild(li);
    }
}

// ---- ДОДАВАННЯ ----

document.getElementById("addCategoryBtn").addEventListener("click", () => {
    const name = document.getElementById("categoryName").value.trim();
    if (!name) return alert("Введіть назву розділу!");

    if (!catalogData[name]) {
        catalogData[name] = [];
        saveCatalog();
        renderCatalog();
        alert("Розділ додано!");
    } else {
        alert("Такий розділ вже існує.");
    }
});

document.getElementById("addItemBtn").addEventListener("click", () => {
    const categoryName = document.getElementById("categoryName").value.trim();
    const itemName = document.getElementById("itemName").value.trim();
    const url = document.getElementById("itemUrl").value.trim();
    const icon = document.getElementById("itemIcon").value.trim();

    if (!categoryName) return alert("Вкажіть розділ!");
    if (!catalogData[categoryName]) return alert("Такого розділу не існує.");

    if (!itemName || !url || !icon) {
        return alert("Заповніть всі поля!");
    }

    catalogData[categoryName].push({
        name: itemName,
        url: url,
        icon: icon
    });

    saveCatalog();
    renderCatalog();
    alert("Кнопку додано!");
});

// ---- Запустити при завантаженні ----
document.addEventListener("DOMContentLoaded", () => {
    renderCatalog();
});
// ---- ВИДАЛЕННЯ ----

// Видалити розділ
document.getElementById("deleteCategoryBtn").addEventListener("click", () => {
    const categoryName = document.getElementById("categoryName").value.trim();

    if (!categoryName) return alert("Вкажіть назву розділу!");
    if (!catalogData[categoryName]) return alert("Такого розділу не існує.");

    if (!confirm(`Точно видалити розділ "${categoryName}"?`)) return;

    delete catalogData[categoryName];

    saveCatalog();
    renderCatalog();

    alert("Розділ видалено!");
});


// Видалити кнопку
document.getElementById("deleteItemBtn").addEventListener("click", () => {
    const categoryName = document.getElementById("categoryName").value.trim();
    const itemName = document.getElementById("itemName").value.trim();

    if (!categoryName) return alert("Вкажіть розділ!");
    if (!catalogData[categoryName]) return alert("Такого розділу не існує.");

    if (!itemName) return alert("Вкажіть назву кнопки!");

    const items = catalogData[categoryName];

    const index = items.findIndex(i => i.name.toLowerCase() === itemName.toLowerCase());
    if (index === -1) return alert("Кнопку не знайдено!");

    if (!confirm(`Видалити кнопку "${itemName}" у розділі "${categoryName}"?`)) return;

    items.splice(index, 1);

    // якщо у розділі більше немає кнопок — можна або залишити порожнім, або видалити весь розділ
    if (items.length === 0) {
        delete catalogData[categoryName];
    }

    saveCatalog();
    renderCatalog();

    alert("Кнопку видалено!");
});
// ---- ДЕФОЛТНІ ДАНІ ----

const defaultCatalog = {
    "Соціум і сторінки": [
        { name: "Telegram", url: "https://web.telegram.org/k/", icon: "images/telegram.svg" },
        { name: "X", url: "https://x.com/home", icon: "images/x.svg" },
        { name: "LinkedIn", url: "https://www.linkedin.com/feed/", icon: "images/linkedin.svg" },
        { name: "GitHub", url: "https://github.com/ISWAPPP", icon: "images/github.svg" }
    ],

    "Google": [
        { name: "Gmail", url: "https://mail.google.com", icon: "images/gmail.svg" },
        { name: "Gemini", url: "https://gemini.google.com/app", icon: "images/gemini.svg" },
        { name: "YouTube", url: "https://www.youtube.com", icon: "images/youtube.svg" },
        { name: "Docs", url: "https://docs.google.com/document/u/0/", icon: "images/docs.svg" },
        { name: "Sheets", url: "https://docs.google.com/spreadsheets/u/0/", icon: "images/sheets.svg" }
    ],

    "Інструменти": [
        { name: "ChatGPT", url: "https://chatgpt.com", icon: "images/chatgpt.svg" },
        { name: "Gemini", url: "https://gemini.google.com/app", icon: "images/gemini.svg" },
        { name: "DeepSeek", url: "https://chat.deepseek.com", icon: "images/deepseek.svg" },
        { name: "DeepL", url: "https://www.deepl.com/en/translator", icon: "images/deepl.svg" },
        { name: "DNSChecker", url: "https://dnschecker.org", icon: "images/dnschecker.svg" },
        { name: "SSLChecker", url: "https://www.sslshopper.com/ssl-checker.html", icon: "images/sslchecker.svg" },
        { name: "PostIMG", url: "https://postimg.cc/", icon: "images/p.png" }
    ]
};

// ---- ВІДНОВЛЕННЯ СТАНДАРТНОГО КАТАЛОГУ ----

document.getElementById("restoreDefaultBtn").addEventListener("click", () => {
    if (!confirm("Ви точно хочете встановити стандартні налаштування каталогу?\nУсі ваші дані будуть видалені.")) {
        return;
    }

    catalogData = JSON.parse(JSON.stringify(defaultCatalog)); // клон
    saveCatalog();
    renderCatalog();

    alert("Стандартний каталог відновлено!");
});
