import { accountReady, safeSteamUrl, signOut, setCurrentUser, resolveLinkedProfile } from "../shared/account.js";
import { steamSessionCache } from "../shared/sessionCache.js";

let backgroundVersion = 0;
async function updateBackground(user) {
    const version = ++backgroundVersion;
    const cover = document.querySelector(".account-backdrop");
    cover.replaceChildren();
    cover.classList.remove("has-steam-background");
    cover.removeAttribute("title");
    if (!user?.steam_url) return;
    try {
        const profile = await resolveLinkedProfile(user);
        if (!profile?.steamid || version !== backgroundVersion) return;
        const data = await steamSessionCache.load(`steam-background:v1:${profile.steamid}`, 3600000, async () => {
            const response = await fetch(`/steam/background?steamid=${profile.steamid}`);
            if (!response.ok) throw new Error("Background unavailable");
            return response.json();
        });
        if (version !== backgroundVersion || !data.background) return;
        const background = data.background;
        const valid = value => typeof value === "string" && value.startsWith("https://shared.fastly.steamstatic.com/community_assets/images/items/");
        const image = valid(background.image) ? background.image : null;
        const videos = [background.webm, background.mp4].filter(valid);
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        function showImage() {
            if (version !== backgroundVersion) return;
            cover.replaceChildren();
            if (!image) { cover.classList.remove("has-steam-background"); return; }
            const img = document.createElement("img");
            img.src = image;
            img.alt = "";
            img.addEventListener("error", () => { if (version === backgroundVersion) { cover.replaceChildren(); cover.classList.remove("has-steam-background"); } });
            cover.append(img);
        }
        if (videos.length && !reducedMotion) {
            const video = document.createElement("video");
            video.muted = true;
            video.autoplay = true;
            video.loop = true;
            video.playsInline = true;
            video.setAttribute("aria-hidden", "true");
            video.preload = "metadata";
            if (image) video.poster = image;
            for (const url of videos) {
                const source = document.createElement("source");
                source.src = url;
                source.type = url.endsWith(".webm") ? "video/webm" : "video/mp4";
                video.append(source);
            }
            video.addEventListener("error", showImage);
            cover.append(video);
        } else showImage();
        if (cover.childElementCount) {
            cover.classList.add("has-steam-background");
            cover.title = background.title || "Steam profile background";
        }
    } catch { /* Keep the gradient when Steam is unavailable or no background is equipped. */ }
}

function render(user) {
    void updateBackground(user);
    document.getElementById("accountLoading").hidden = true;
    document.getElementById("signedOut").hidden = Boolean(user);
    document.getElementById("profileContent").hidden = !user;
    if (!user) return;
    document.getElementById("editSteamUrl").value = user.steam_url || "";
    document.getElementById("profileName").textContent = user.username;
    document.getElementById("profileUsername").textContent = user.username;
    const steam = document.getElementById("profileSteam");
    steam.textContent = user.steam_url || "No Steam profile added";
    const url = safeSteamUrl(user.steam_url);
    if (url) steam.href = url.href;
    else steam.removeAttribute("href");
}

window.addEventListener("skinscope:account", event => render(event.detail));
accountReady.then(render);
document.getElementById("steamProfileForm").addEventListener("submit", async event => {
    event.preventDefault();
    const button = document.getElementById("saveSteamProfile");
    const status = document.getElementById("steamProfileStatus");
    button.disabled = true;
    status.textContent = "Saving…";
    try {
        const response = await fetch("/api/auth/profile", { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ steam_url: document.getElementById("editSteamUrl").value.trim() }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not save your profile.");
        setCurrentUser(data.user);
        status.textContent = "Steam profile saved.";
        if (data.user.steam_url) {
            try { await resolveLinkedProfile(data.user); }
            catch { status.textContent = "Saved. Steam is temporarily unavailable; your default avatar will be used until it can be loaded."; }
        }
    } catch (err) { status.textContent = err.message; }
    finally { button.disabled = false; }
});
document.getElementById("profileLogout").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try { await signOut(); document.querySelector("#signedOut a").focus(); }
    catch (err) { document.getElementById("profileStatus").textContent = err.message; }
    finally { button.disabled = false; }
});
