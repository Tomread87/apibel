const menuToggle = document.getElementById('mobile-menu');
const navLinks = document.getElementById('nav-links');

menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Chiude il menu mobile quando si clicca un link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

function changeLanguage(url) {
    if (url) {
        window.location.href = url;
    }
}

const languageButton = document.getElementById("language-button");
const languageMenu = document.getElementById("language-menu");

languageButton.addEventListener("click", function (event) {
    event.stopPropagation();
    languageMenu.classList.toggle("show");
});

document.addEventListener("click", function () {
    languageMenu.classList.remove("show");
});