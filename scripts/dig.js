document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnDIG');
  const domainInput = document.getElementById('domain_input');
  const output = document.getElementById('output');

  // Виносимо основну логіку у функцію
  const checkDNS = async () => {
    const domain = domainInput.value.trim();
    output.innerHTML = '⏳ Перевіряємо...';

    if (!domain) {
      output.innerHTML = '⚠️ Введіть домен!';
      return;
    }

    try {
      const aRes = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const nsRes = await fetch(`https://dns.google/resolve?name=${domain}&type=NS`);

      const aData = await aRes.json();
      const nsData = await nsRes.json();

      const aRecords = aData.Answer
        ? aData.Answer.map(r => r.data).join('<br>')
        : '— Немає A-записів';

      const nsRecords = nsData.Answer
        ? nsData.Answer.map(r => r.data).join('<br>')
        : '— Немає NS-записів';

      const linkDNS = `https://dnschecker.org/#A/${domain}`;
      const linkSSL = `https://www.sslshopper.com/ssl-checker.html#hostname=${domain}`;

      output.innerHTML = `
        <div class="external-links">
          <span class="copy-btn" data-copy="${linkDNS}">📋</span>
          <a href="${linkDNS}" target="_blank">DNSChecker (A)</a>
          &nbsp;&nbsp;
          <span class="copy-btn" data-copy="${linkSSL}">📋</span>
          <a href="${linkSSL}" target="_blank">SSLShopper</a>
        </div>

        <h3>🔹 Результат для ${domain}</h3>

        <b>A записи:</b><br>${aRecords}<br><br>
        <b>NS записи:</b><br>${nsRecords}
      `;
    } catch (err) {
      output.innerHTML = '❌ Помилка під час перевірки DNS.';
      console.error(err);
    }
  };

  // Клік по кнопці
  btn.addEventListener('click', checkDNS);

  // Натискання Enter у полі вводу
  domainInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      checkDNS();
    }
  });

  // глобальний копіювальник
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
