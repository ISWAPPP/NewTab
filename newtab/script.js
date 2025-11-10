// Отримуємо елементи
const input = document.getElementById("searchInput");
const button = document.getElementById("searchBtn");

// Функція пошуку
function searchGoogle() {
  const query = input.value.trim();
  if (query) {
    const url = "https://www.google.com/search?q=" + encodeURIComponent(query);
    window.open(url, "_blank");
  }
}

// Подія на кнопку
button.addEventListener("click", searchGoogle);

// Подія на Enter у полі
input.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    searchGoogle();
  }
});
