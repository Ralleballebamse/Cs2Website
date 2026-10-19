import test from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import app from "../../src/app.js";

test("all pages, local assets and browser module imports resolve after restructuring", async t => {
    const server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const base = `http://127.0.0.1:${server.address().port}`;
    const visited = new Set();
    async function check(url) {
        const full = new URL(url, base);
        if (full.origin !== base || visited.has(full.href)) return;
        visited.add(full.href);
        const response = await fetch(full);
        assert.equal(response.status, 200, `Missing asset: ${full.pathname}`);
        const text = await response.text();
        if (full.pathname.endsWith(".js")) {
            for (const match of text.matchAll(/(?:from\s*|import\s*)["'](\.{1,2}\/[^"']+)["']/g)) {
                await check(new URL(match[1], full).href);
            }
        }
    }
    for (const page of ["/", "/pages/posts.html", "/pages/account.html", "/pages/login.html", "/pages/contact.html", "/pages/guide.html"]) {
        const response = await fetch(base + page);
        assert.equal(response.status, 200, page);
        const html = await response.text();
        for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
            if (!match[1].startsWith("#")) await check(new URL(match[1], base + page).href);
        }
    }
    for (const [before, after] of [["/home.html", "/"], ["/posts.html", "/pages/posts.html"], ["/account.html", "/pages/account.html"], ["/loginPage.html", "/pages/login.html"], ["/guide.html", "/pages/guide.html"], ["/contact.html", "/pages/contact.html"]]) {
        const response = await fetch(base + before, { redirect: "manual" });
        assert.equal(response.status, 302);
        assert.equal(response.headers.get("location"), after);
    }
    assert.equal((await fetch(base + "/api/auth/me")).status, 200);
    assert.equal((await fetch(base + "/steam")).status, 400);
    const original = process.cwd();
    try {
        process.chdir(tmpdir());
        assert.equal((await fetch(base + "/")).status, 200);
        assert.equal((await fetch(base + "/assets/scripts/inventory/index.js")).status, 200);
    } finally { process.chdir(original); }
});
