document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnDIG');

  btn.addEventListener('click', async () => {

    const domainInput = document.getElementById('domain_input');
    const domain = domainInput.value.trim();

    const output = document.getElementById('output');
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
          
          <!-- DNSCHECKER -->
          <span class="copy-btn" data-copy="${linkDNS}">📋</span>
          <a href="${linkDNS}" target="_blank">DNSChecker (A)</a>

          &nbsp;&nbsp;

          <!-- SSLSHOPPER -->
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
