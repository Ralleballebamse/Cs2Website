import { accountReady, safeSteamUrl, signOut, setCurrentUser, resolveLinkedProfile } from "../shared/account.js";

function render(user) {
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
