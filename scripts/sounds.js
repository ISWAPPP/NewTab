document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('sound-toggle');

    const hoverSound = new Audio('sounds/sound1.mp3');
    const clickSound = new Audio('sounds/sound2.mp3');

    // Відновлюємо значення з localStorage
    let soundEnabled = localStorage.getItem('soundEnabled') === 'true';

    // Оновлюємо dataset для стилів/стану
    btn.dataset.soundEnabled = soundEnabled;

    // Перемикач звуку
    btn.addEventListener('click', () => {
        // Якщо звук увімкнений — програти звук кліку
        if (soundEnabled) {
            clickSound.currentTime = 0;
            clickSound.play();
        }

        // Перемикаємо
        soundEnabled = !soundEnabled;
        btn.dataset.soundEnabled = soundEnabled;

        // Зберігаємо в localStorage
        localStorage.setItem('soundEnabled', soundEnabled);
    });

    // Звук при наведенні
    btn.addEventListener('mouseenter', () => {
        if (!soundEnabled) return;
        hoverSound.currentTime = 0;
        hoverSound.play();
    });

    // Звук при натисканні (mousedown)
    btn.addEventListener('mousedown', () => {
        if (!soundEnabled) return;
        clickSound.currentTime = 0;
        clickSound.play();
    });
});
