import { accountReady, setCurrentUser } from "../shared/account.js";

const form = document.getElementById("authForm");
const status = document.getElementById("authStatus");
const submit = document.getElementById("authSubmit");
const password = document.getElementById("password");
const tabs = [...document.querySelectorAll("[data-auth-mode]")];
let mode = "login";
let busy = false;

function message(text = "", error = false) {
    status.textContent = text;
    status.classList.toggle("is-error", error);
}

function setMode(value) {
    if (busy) return;
    mode = value;
    const register = mode === "register";
    document.getElementById("registerFields").hidden = !register;
    document.getElementById("confirmPassword").required = register;
    document.querySelectorAll("#registerFields input").forEach(input => input.disabled = !register);
    const username = document.getElementById("username");
    if (register) username.pattern = "[A-Za-z0-9_-]{3,30}";
    else username.removeAttribute("pattern");
    password.minLength = register ? 8 : 1;
    password.autocomplete = register ? "new-password" : "current-password";
    document.getElementById("authTitle").textContent = register ? "Create your account" : "Welcome back";
    document.getElementById("authSubtitle").textContent = register ? "Choose your SkinScope username and password." : "Sign in to your SkinScope account.";
    submit.textContent = register ? "Create account" : "Sign in";
    tabs.forEach(tab => {
        tab.classList.toggle("selected", tab.dataset.authMode === value);
        tab.setAttribute("aria-pressed", String(tab.dataset.authMode === value));
    });
    message();
}

function showUser(user) {
    document.getElementById("authPanel").hidden = Boolean(user);
    document.getElementById("accountPanel").hidden = !user;
    if (!user) return;
    document.getElementById("accountName").textContent = user.username;
    document.getElementById("accountInitial").textContent = user.username.slice(0, 1).toUpperCase();
    document.getElementById("accountSteam").textContent = user.steam_url || "No Steam profile added.";
    form.reset();
    password.type = "password";
    document.getElementById("togglePassword").textContent = "Show";
    document.getElementById("togglePassword").setAttribute("aria-pressed", "false");
    message();
}

async function api(path, body) {
    const response = await fetch(`/api/auth/${path}`, body === undefined ? { cache: "no-store" } : {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    let data;
    try { data = await response.json(); } catch {
        throw new Error(response.status === 404 ? "Restart the server to enable the updated login page." : "Could not reach the login service. Please try again.");
    }
    if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
}

tabs.forEach(tab => tab.addEventListener("click", () => setMode(tab.dataset.authMode)));
document.getElementById("togglePassword").addEventListener("click", e => {
    const showing = password.type === "password";
    password.type = showing ? "text" : "password";
    e.currentTarget.textContent = showing ? "Hide" : "Show";
    e.currentTarget.setAttribute("aria-pressed", String(showing));
});

form.addEventListener("submit", async e => {
    e.preventDefault();
    if (busy || !form.reportValidity()) return;
    if (mode === "register" && password.value !== document.getElementById("confirmPassword").value) {
        message("Your passwords do not match.", true);
        document.getElementById("confirmPassword").focus();
        return;
    }
    busy = true;
    submit.disabled = true;
    tabs.forEach(tab => tab.disabled = true);
    message(mode === "register" ? "Creating your account…" : "Signing in…");
    try {
        const data = await api(mode, { username: document.getElementById("username").value.trim(),
            password: password.value, steam_url: document.getElementById("steamUrl").value.trim() });
        setCurrentUser(data.user);
        document.getElementById("accountTitle").focus();
    } catch (err) { message(err.message, true); }
    finally {
        busy = false;
        submit.disabled = false;
        tabs.forEach(tab => tab.disabled = false);
    }
});

document.getElementById("logout").addEventListener("click", async e => {
    e.currentTarget.disabled = true;
    const accountStatus = document.getElementById("accountStatus");
    accountStatus.textContent = "";
    try {
        await api("logout", {});
        setCurrentUser(null);
        setMode("login");
        message("You have been signed out.");
    } catch (err) { accountStatus.textContent = err.message; }
    finally { document.getElementById("logout").disabled = false; }
});

setMode("login");
// Old localStorage values are not authentication; the server session is authoritative.
try { localStorage.removeItem("username"); localStorage.removeItem("steamUrl"); } catch { /* Storage is optional. */ }
submit.disabled = true;
tabs.forEach(tab => tab.disabled = true);
window.addEventListener("skinscope:account", event => showUser(event.detail));
accountReady.then(user => showUser(user)).finally(() => {
    submit.disabled = false;
    tabs.forEach(tab => tab.disabled = false);
});
