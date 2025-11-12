const root = document.documentElement; // <html>
const btn = document.getElementById('theme-toggle');

// 1️⃣ Перевіряємо, чи є збережена тема
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  root.classList.add('dark');
} else if (savedTheme === 'light') {
  root.classList.remove('dark');
} else {
  // Якщо користувач ще не вибирав — можна підлаштуватись під системну тему
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.classList.add('dark');
  }
}

// 2️⃣ Кнопка перемикає тему і зберігає вибір
btn.addEventListener('click', () => {
  const isDark = root.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});
