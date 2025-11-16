document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnDIG');
  const domainInput = document.getElementById('domain_input');
  const output = document.getElementById('output');

  let pingInterval = null;
  let debounceTimer = null;
  let lastRequest = 0;
  const dnsCache = new Map();
  const MIN_REQUEST_INTERVAL = 2000;

  // Валідація домену
  const isValidDomain = (domain) => {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  };

  // Екранування HTML
  const escapeHTML = (str) => {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  // Форматування часу
  const formatTime = (ms) => {
    if (typeof ms !== 'number') return ms;
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  // Стани кнопки
  const setButtonState = (state) => {
    const states = {
      loading: { text: '⏳ Перевірка...', disabled: true },
      success: { text: '🔍 Перевірити DNS', disabled: false },
      error: { text: '❌ Помилка', disabled: false }
    };
    
    if (btn && states[state]) {
      btn.textContent = states[state].text;
      btn.disabled = states[state].disabled;
    }
  };

  // DNS запит з кешуванням
  const dnsQuery = async (name, type) => {
    const cacheKey = `${name}_${type}`;
    
    if (dnsCache.has(cacheKey)) {
      return dnsCache.get(cacheKey);
    }

    try {
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      dnsCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`DNS query failed for ${type}:`, error);
      return { Answer: null, error: true };
    }
  };

  // Пінг з таймаутом
  const httpPing = async (domain) => {
    const url = `https://${domain}/?_ping=${Date.now()}`;
    const start = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(url, { 
        method: "GET", 
        mode: "no-cors",
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      return formatTime(Math.round(performance.now() - start));
    } catch (error) {
      return error.name === 'AbortError' ? '⏰ таймаут' : '❌ недоступний';
    }
  };

  // Прогрес виконання
  const updateProgress = (step, total, domain) => {
    const percent = Math.round((step / total) * 100);
    if (output) {
      output.innerHTML = `⏳ Перевіряємо ${escapeHTML(domain)}... ${percent}%`;
    }
  };

  // Основна функція перевірки DNS
  const checkDNS = async () => {
    const now = Date.now();
    if (now - lastRequest < MIN_REQUEST_INTERVAL) {
      if (output) output.innerHTML = '⚠️ Занадто часті запити! Зачекайте...';
      return;
    }
    lastRequest = now;

    const domain = domainInput.value.trim().toLowerCase();
    
    if (!domain) {
      if (output) output.innerHTML = '⚠️ Введіть домен!';
      return;
    }
    
    if (!isValidDomain(domain)) {
      if (output) output.innerHTML = '⚠️ Некоректний домен!';
      return;
    }

    if (pingInterval) clearInterval(pingInterval);
    
    setButtonState('loading');

    try {
      updateProgress(0, 8, domain);

      // ===== DNS QUERIES =====
      updateProgress(1, 8, domain);
      const [A, AAAA, MX, TXT, NS, CNAME] = await Promise.all([
        dnsQuery(domain, "A"),
        dnsQuery(domain, "AAAA"),
        dnsQuery(domain, "MX"),
        dnsQuery(domain, "TXT"),
        dnsQuery(domain, "NS"),
        dnsQuery(domain, "CNAME")
      ]);

      updateProgress(5, 8, domain);

      const A_list = A.Answer ? A.Answer.map(r => r.data) : [];
      const AAAA_list = AAAA.Answer ? AAAA.Answer.map(r => r.data) : [];
      const TXT_list = TXT.Answer ? TXT.Answer.map(r => r.data.replace(/"/g, "")) : [];
      const CNAME_list = CNAME.Answer ? CNAME.Answer.map(r => r.data) : [];

      const MX_html = MX.Answer ? MX.Answer.map(r => escapeHTML(r.data)).join("<br>") : "— Немає MX";
      const TXT_html = TXT_list.length ? TXT_list.map(escapeHTML).join("<br>") : "— Немає TXT";
      const NS_html = NS.Answer ? NS.Answer.map(r => escapeHTML(r.data)).join("<br>") : "— Немає NS";
      const CNAME_html = CNAME_list.length ? CNAME_list.map(escapeHTML).join("<br>") : "— Немає CNAME";

      const SPF = TXT_list.find(t => t.includes("v=spf")) || "— Немає SPF";
      const DMARC = TXT_list.find(t => t.includes("v=DMARC")) || "— Немає DMARC";
      const DKIM = TXT_list.find(t => t.includes("dkim")) || "— Немає DKIM";

      // ===== PTR =====
      updateProgress(6, 8, domain);
      let PTR_html = "— Немає PTR";
      let firstIP = A_list[0] || null;

      if (firstIP) {
        const reversed = firstIP.split(".").reverse().join(".") + ".in-addr.arpa";
        const PTR = await dnsQuery(reversed, "PTR");
        PTR_html = PTR.Answer ? PTR.Answer.map(r => escapeHTML(r.data)).join("<br>") : "— PTR не знайдено";
      }

      // ===== ВИЗНАЧЕННЯ СЕРВІСІВ =====
      updateProgress(7, 8, domain);
      const detect = [];
      const nsText = NS_html.toLowerCase();
      const mxText = MX_html.toLowerCase();

      if (nsText.includes("cloudflare")) detect.push("Cloudflare DNS");
      if (mxText.includes("google.com")) detect.push("Google Workspace");
      if (mxText.includes("outlook.com") || mxText.includes("protection.outlook.com")) detect.push("Microsoft 365");
      if (nsText.includes("aws") || nsText.includes("amazon")) detect.push("Amazon Route53");
      if (nsText.includes("azure") || nsText.includes("microsoft")) detect.push("Azure DNS");

      const detect_html = detect.length ? detect.join(", ") : "— Не визначено";

      // ===== ПЕРЕВІРКА DNSSEC =====
      const dnssecStatus = A.AD ? '✅ DNSSEC' : '❌ DNSSEC';

      // ===== ПОСИЛАННЯ =====
      const linkDNS = `https://dnschecker.org/#A/${domain}`;
      const linkSSL = `https://www.sslshopper.com/ssl-checker.html#hostname=${domain}`;
      const linkSpamhaus = firstIP ? `https://check.spamhaus.org/results?query=${firstIP}` : null;
      const linkMXTools = `https://mxtoolbox.com/SuperTool.aspx?action=mx%3A${domain}`;

      updateProgress(8, 8, domain);

      // ===== HTML ВИВОД =====
      if (output) {
        output.innerHTML = `
          <div class="result-header">
            <h3>📡 Пінг (оновлення кожні 3 сек)</h3>
            <div id="pingBox">Очікування…</div>
          </div>

          <div class="service-info">
            <b>Визначені сервіси:</b> ${detect_html}<br>
            <b>DNSSEC:</b> ${dnssecStatus}<br>
          </div>

          <div class="external-links">
            <span class="copy-btn" data-copy="${linkDNS}" title="Копіювати посилання">📋</span>
            <a href="${linkDNS}" target="_blank">DNSChecker</a>

            <span class="copy-btn" data-copy="${linkSSL}" title="Копіювати посилання">📋</span>
            <a href="${linkSSL}" target="_blank">SSLShopper</a>

            <span class="copy-btn" data-copy="${linkMXTools}" title="Копіювати посилання">📋</span>
            <a href="${linkMXTools}" target="_blank">MXToolbox</a>

            ${linkSpamhaus ? `
              <span class="copy-btn" data-copy="${linkSpamhaus}" title="Копіювати посилання">📋</span>
              <a href="${linkSpamhaus}" target="_blank">Spamhaus</a>
            ` : ""}
          </div>

          <div class="dns-results">
            <h3>🔹 DNS інформація для ${escapeHTML(domain)}</h3>

            <div class="dns-section">
              <b>A записи:</b> <span class="copy-btn" data-copy="${A_list.join(", ")}" title="Копіювати значення">📋</span><br>
              ${A_list.length ? A_list.map(escapeHTML).join("<br>") : "— Немає"}
            </div>

            <div class="dns-section">
              <b>AAAA записи:</b> <span class="copy-btn" data-copy="${AAAA_list.join(", ")}" title="Копіювати значення">📋</span><br>
              ${AAAA_list.length ? AAAA_list.map(escapeHTML).join("<br>") : "— Немає"}
            </div>

            <div class="dns-section">
              <b>CNAME записи:</b> <span class="copy-btn" data-copy="${CNAME_list.join(", ")}" title="Копіювати значення">📋</span><br>
              ${CNAME_html}
            </div>

            <div class="dns-section">
              <b>MX записи:</b> <span class="copy-btn" data-copy="${MX_html.replace(/<br>/g, ', ')}" title="Копіювати значення">📋</span><br>
              ${MX_html}
            </div>

            <div class="dns-section">
              <b>TXT записи:</b> <span class="copy-btn" data-copy="${TXT_list.join("; ")}" title="Копіювати значення">📋</span><br>
              ${TXT_html}
            </div>

            <div class="dns-section">
              <b>NS записи:</b> <span class="copy-btn" data-copy="${NS_html.replace(/<br>/g, ', ')}" title="Копіювати значення">📋</span><br>
              ${NS_html}
            </div>

            <div class="dns-section">
              <b>PTR запис:</b> <span class="copy-btn" data-copy="${PTR_html.replace(/<br>/g, ', ')}" title="Копіювати значення">📋</span><br>
              ${PTR_html}
            </div>

            <div class="security-records">
              <h4>🔐 Записи безпеки</h4>
              <b>SPF:</b> ${escapeHTML(SPF)}<br>
              <b>DMARC:</b> ${escapeHTML(DMARC)}<br>
              <b>DKIM:</b> ${escapeHTML(DKIM)}<br>
            </div>
          </div>
        `;

        // ===== ДИНАМІЧНИЙ ПІНГ =====
        const pingBox = document.getElementById("pingBox");
        const doPing = async () => {
          if (pingBox) {
            const res = await httpPing(domain);
            pingBox.innerHTML = `<b>${res}</b>`;
          }
        };

        await doPing();
        pingInterval = setInterval(doPing, 3000);
      }

    } catch (err) {
      console.error('DNS check error:', err);
      if (output) output.innerHTML = '❌ Помилка під час перевірки DNS. Перевірте консоль для деталей.';
    } finally {
      setButtonState('success');
    }
  };

  // Обробники подій
  if (btn) {
    btn.addEventListener('click', checkDNS);
  }

  if (domainInput) {
    domainInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') checkDNS();
    });

    // Дебаунс для майбутньої автоперевірки
    domainInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        // Можна додати автоперевірку при введенні
        console.log('Domain input:', e.target.value);
      }, 500);
    });
  }

  // Глобальне копіювання
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('copy-btn')) {
      const txt = e.target.dataset.copy;
      const originalText = e.target.textContent;
      
      navigator.clipboard.writeText(txt).then(() => {
        e.target.textContent = "✅";
        setTimeout(() => {
          e.target.textContent = originalText;
        }, 2000);
      }).catch(err => {
        console.error('Copy failed:', err);
        e.target.textContent = "❌";
        setTimeout(() => {
          e.target.textContent = originalText;
        }, 2000);
      });
    }
  });

  // Стилі для покращеного відображення
  const style = document.createElement('style');
  style.textContent = `
    .result-header { 
      background: #f8f9fa; 
      padding: 10px; 
      border-radius: 5px; 
      margin-bottom: 15px; 
    }
    .service-info { 
      margin: 15px 0; 
      padding: 10px; 
      background: #e8f4fd; 
      border-radius: 5px; 
    }
    .external-links { 
      margin: 15px 0; 
    }
    .external-links a { 
      margin: 0 10px; 
      text-decoration: none; 
      color: #0066cc; 
    }
    .external-links a:hover { 
      text-decoration: underline; 
    }
    .dns-section { 
      margin: 10px 0; 
      padding: 10px; 
      border-left: 3px solid #0066cc; 
      background: #f8f9fa; 
    }
    .security-records { 
      margin: 15px 0; 
      padding: 15px; 
      background: #fff3cd; 
      border-radius: 5px; 
      border: 1px solid #ffeaa7; 
    }
    .copy-btn { 
      cursor: pointer; 
      margin-left: 5px; 
      user-select: none; 
    }
    .copy-btn:hover { 
      opacity: 0.7; 
    }
    #pingBox { 
      font-size: 1.2em; 
      font-weight: bold; 
      color: #28a745; 
    }
  `;
  document.head.appendChild(style);
});