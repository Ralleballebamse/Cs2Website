import { steamSessionCache } from "../posts/sessionCache.js";

const login = document.querySelector(".header .login-link");
let currentUser = null;
let trigger, avatar;

export function safeSteamUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" && url.hostname === "steamcommunity.com" && !url.username && !url.password ? url : null;
    } catch { return null; }
}

export async function resolveLinkedProfile(user) {
    const url = safeSteamUrl(user?.steam_url);
    if (!url) return null;
    const steamid = url.pathname.match(/^\/profiles\/(\d{17})\/?$/)?.[1];
    const key = steamid ? `profile:${steamid}` : `linked-profile:${url.href}`;
    const profile = await steamSessionCache.load(key, 86400000, async () => {
        const response = await fetch(`/steam/profile?${steamid ? `steamid=${steamid}` : `url=${encodeURIComponent(url.href)}`}`);
        if (!response.ok) throw new Error("Steam profile is temporarily unavailable. Try again later.");
        return response.json();
    }, data => Boolean(data?.name && (data.steamid || steamid)));
    const result = { ...profile, steamid: profile.steamid || steamid };
    return result;
}

async function loadAvatar(user) {
    try {
        const profile = await resolveLinkedProfile(user);
        if (!profile) return;
        if (currentUser !== user || !profile.avatar || new URL(profile.avatar).protocol !== "https:") return;
        for (const image of document.querySelectorAll("[data-account-avatar]")) image.src = profile.avatar;
    } catch { /* Keep the local avatar when Steam is unavailable. */ }
}

export function setCurrentUser(user) {
    currentUser = user;
    if (login) {
        login.hidden = Boolean(user);
        trigger.hidden = !user;
        avatar.src = "/shared/avatar.svg";
        for (const image of document.querySelectorAll("[data-account-avatar]")) image.src = "/shared/avatar.svg";
        if (user) {
            trigger.setAttribute("aria-label", `Open account for ${user.username}`);
            void loadAvatar(user);
        }
    }
    window.dispatchEvent(new CustomEvent("skinscope:account", { detail: user }));
}

export async function signOut() {
    const response = await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (!response.ok) throw new Error("Could not sign out. Please try again.");
    setCurrentUser(null);
}

if (login) {
    login.hidden = true;
    const root = document.createElement("div");
    root.className = "account-nav";
    login.replaceWith(root);
    root.append(login);
    trigger = document.createElement("a");
    trigger.className = "account-avatar-button";
    trigger.href = "/account.html";
    trigger.hidden = true;
    trigger.innerHTML = '<img src="/shared/avatar.svg" alt="" width="40" height="40" data-account-avatar><span class="account-online-dot" aria-hidden="true"></span>';
    root.append(trigger);
    avatar = trigger.querySelector("img");
}

document.addEventListener("error", event => {
    const image = event.target;
    if (image.matches?.("[data-account-avatar]") && !image.src.endsWith("/shared/avatar.svg")) image.src = "/shared/avatar.svg";
}, true);

export const accountReady = fetch("/api/auth/me", { cache: "no-store" })
    .then(response => { if (!response.ok) throw new Error("Could not check your session."); return response.json(); })
    .then(data => { setCurrentUser(data.user); return data.user; })
    .catch(() => { setCurrentUser(null); return null; });
