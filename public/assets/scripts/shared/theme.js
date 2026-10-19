(() => {
    const key = "skinscope:theme";
    function apply(value) {
        const theme = value === "light" ? "light" : "dark";
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
        document.querySelectorAll("[data-theme-choice]").forEach(button => {
            const selected = button.dataset.themeChoice === theme;
            button.setAttribute("aria-pressed", String(selected));
            button.classList.toggle("selected", selected);
        });
    }
    let saved;
    try { saved = localStorage.getItem(key); } catch { /* Dark remains the default. */ }
    apply(saved);
    document.addEventListener("DOMContentLoaded", () => {
        apply(document.documentElement.dataset.theme);
        document.querySelectorAll("[data-theme-choice]").forEach(button => button.addEventListener("click", () => {
            const theme = button.dataset.themeChoice;
            apply(theme);
            let stored = true;
            try { localStorage.setItem(key, theme); } catch { stored = false; }
            document.getElementById("themeStatus").textContent = stored ?
                `${theme === "light" ? "Light" : "Dark"} mode saved for this browser.` :
                "Theme applied. Your browser could not save this preference.";
        }));
    });
    window.addEventListener("storage", event => { if (event.key === key || event.key === null) apply(event.newValue); });
})();
