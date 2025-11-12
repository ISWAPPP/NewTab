document.addEventListener('DOMContentLoaded', () => {
  const domainInput = document.getElementById('domain');
  const btnA = document.getElementById('btnA');
  const btnNS = document.getElementById('btnNS');
  const result = document.getElementById('result');

  async function fetchDNS(domain, type) {
    if (!domain) {
      result.textContent = '❗ Введи домен';
      return;
    }

    try {
      const res = await fetch(`https://dns.google/resolve?name=${domain}&type=${type}`);
      const data = await res.json();

      if (!data.Answer) {
        result.textContent = `Нічого не знайдено для ${domain} (${type})`;
        return;
      }

      const output = data.Answer.map(a => `${a.name} → ${a.data}`).join('\n');
      result.textContent = output;
    } catch (err) {
      result.textContent = 'Помилка запиту: ' + err;
    }
  }

  btnA.onclick = () => fetchDNS(domainInput.value.trim(), 'A');
  btnNS.onclick = () => fetchDNS(domainInput.value.trim(), 'NS');
});
