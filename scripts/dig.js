document.addEventListener('DOMContentLoaded', () => {

  const btn = document.getElementById('btnDIG');
  const domainInput = document.getElementById('domain_input');
  const output = document.getElementById('output');

  let pingInterval = null;

  const dnsQuery = async (name, type) => {
    const res = await fetch(`https://dns.google/resolve?name=${name}&type=${type}`);
    return await res.json();
  };

  const httpPing = async (domain) => {
    const url = `https://${domain}/?_ping=${Date.now()}`;
    const start = performance.now();
    try {
      await fetch(url, { method: "GET", mode: "no-cors" });
      return Math.round(performance.now() - start) + " ms";
    } catch {
      return "❌ недоступний";
    }
  };

  const checkDNS = async () => {
    const domain = domainInput.value.trim();
    output.innerHTML = '⏳ Перевіряємо...';

    if (!domain) {
      output.innerHTML = '⚠️ Введіть домен!';
      return;
    }

    if (pingInterval) clearInterval(pingInterval);

    try {
      // ===== DNS QUERIES =====
      const A = await dnsQuery(domain, "A");
      const AAAA = await dnsQuery(domain, "AAAA");
      const MX = await dnsQuery(domain, "MX");
      const TXT = await dnsQuery(domain, "TXT");
      const NS = await dnsQuery(domain, "NS");

      const A_list = A.Answer ? A.Answer.map(r => r.data) : [];
      const AAAA_list = AAAA.Answer ? AAAA.Answer.map(r => r.data) : [];
      const TXT_list = TXT.Answer ? TXT.Answer.map(r => r.data.replace(/"/g, "")) : [];

      const MX_html = MX.Answer ? MX.Answer.map(r => r.data).join("<br>") : "— Немає MX";
      const TXT_html = TXT_list.length ? TXT_list.join("<br>") : "— Немає TXT";
      const NS_html = NS.Answer ? NS.Answer.map(r => r.data).join("<br>") : "— Немає NS";

      const SPF = TXT_list.find(t => t.includes("v=spf")) || "— Немає SPF";
      const DMARC = TXT_list.find(t => t.includes("v=DMARC")) || "— Немає DMARC";
      const DKIM = TXT_list.find(t => t.includes("dkim")) || "— Немає DKIM";

      // ===== PTR =====
      let PTR_html = "— Немає PTR";
      let firstIP = A_list[0] || null;

      if (firstIP) {
        const reversed = firstIP.split(".").reverse().join(".") + ".in-addr.arpa";
        const PTR = await dnsQuery(reversed, "PTR");
        PTR_html = PTR.Answer ? PTR.Answer.map(r => r.data).join("<br>") : "— PTR не знайдено";
      }

      // ===== ВИЗНАЧЕННЯ =====
      const detect = [];
      if (NS_html.toLowerCase().includes("cloudflare")) detect.push("Cloudflare DNS");
      if (MX_html.toLowerCase().includes("google.com")) detect.push("Google Workspace");
      if (MX_html.toLowerCase().includes("outlook.com")) detect.push("Microsoft 365");

      const detect_html = detect.length ? detect.join(", ") : "— Не визначено";

      // ===== LINKS =====
      const linkDNS = `https://dnschecker.org/#A/${domain}`;
      const linkSSL = `https://www.sslshopper.com/ssl-checker.html#hostname=${domain}`;
      const linkSpamhaus = firstIP ? `https://check.spamhaus.org/results?query=${firstIP}` : null;

      // ===== HTML ВИВОД =====
      output.innerHTML = `

        <h3>📡 Пінг (оновлення кожні 3 сек)</h3>
        <div id="pingBox">Очікування…</div>
        <br>

        <b>Визначення:</b> ${detect_html}<br><br>

        <div class="external-links">
          <span class="copy-btn" data-copy="${linkDNS}">📋</span>
          <a href="${linkDNS}" target="_blank">DNSChecker</a>

          &nbsp;&nbsp;
          <span class="copy-btn" data-copy="${linkSSL}">📋</span>
          <a href="${linkSSL}" target="_blank">SSLShopper</a>

          ${
            linkSpamhaus
              ? `&nbsp;&nbsp;<span class="copy-btn" data-copy="${linkSpamhaus}">📋</span>
                 <a href="${linkSpamhaus}" target="_blank">Spamhaus</a>`
              : ""
          }
        </div>

        <h3>🔹 DNS інформація для ${domain}</h3>

        <b>A записи:</b> <span class="copy-btn" data-copy="${A_list.join(", ")}">📋</span><br>
        ${A_list.length ? A_list.join("<br>") : "— Немає"}<br><br>

        <b>AAAA записи:</b> <span class="copy-btn" data-copy="${AAAA_list.join(", ")}">📋</span><br>
        ${AAAA_list.length ? AAAA_list.join("<br>") : "— Немає"}<br><br>

        <b>MX записи:</b> <span class="copy-btn" data-copy="${MX_html.replace(/<br>/g, ', ')}">📋</span><br>
        ${MX_html}<br><br>

        <b>TXT записи:</b> <span class="copy-btn" data-copy="${TXT_list.join("; ")}">📋</span><br>
        ${TXT_html}<br><br>

        <b>SPF:</b> ${SPF}<br>
        <b>DMARC:</b> ${DMARC}<br>
        <b>DKIM:</b> ${DKIM}<br><br>

        <b>NS записи:</b> <span class="copy-btn" data-copy="${NS_html.replace(/<br>/g, ', ')}">📋</span><br>
        ${NS_html}<br><br>

        <b>PTR:</b> <span class="copy-btn" data-copy="${PTR_html.replace(/<br>/g, ', ')}">📋</span><br>
        ${PTR_html}<br><br>
      `;

      // ===== ДИНАМІЧНИЙ ПІНГ =====
      const pingBox = document.getElementById("pingBox");

      const doPing = async () => {
        const res = await httpPing(domain);
        pingBox.innerHTML = `<b>${res}</b>`;
      };

      await doPing();
      pingInterval = setInterval(doPing, 3000);

    } catch (err) {
      output.innerHTML = '❌ Помилка під час перевірки DNS.';
      console.error(err);
    }
  };

  btn.addEventListener('click', checkDNS);

  domainInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkDNS();
  });

  // Глобальне копіювання
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('copy-btn')) {
      const txt = e.target.dataset.copy;
      navigator.clipboard.writeText(txt).then(() => {
        e.target.textContent = "✔️";
        setTimeout(() => e.target.textContent = "📋", 500);
      });
    }
  });
});
