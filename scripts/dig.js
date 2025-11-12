document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnDIG');
  btn.addEventListener('click', async () => {
    const domainInput = document.getElementById('domain_input');
    if (!domainInput) return; // додатково перевірка
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
      const aRecords = aData.Answer ? aData.Answer.map(r => r.data).join('<br>') : '— Немає A-записів';
      const nsRecords = nsData.Answer ? nsData.Answer.map(r => r.data).join('<br>') : '— Немає NS-записів';

      output.innerHTML = `
        <h3>🔹 Результат для ${domain}</h3>
        <b>A записи:</b><br>${aRecords}<br><br>
        <b>NS записи:</b><br>${nsRecords}
      `;
    } catch (err) {
      output.innerHTML = '❌ Помилка під час перевірки DNS.';
      console.error(err);
    }
  });
});
