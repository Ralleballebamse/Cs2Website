import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createAuthRouter } from "../routes/auth.js";

async function fixture(t) {
    const users = new Map();
    const sessions = new Map();
    const db = {
        async query() { return [[]]; },
        async execute(sql, args) {
            if (sql.startsWith("INSERT INTO users")) {
                if (users.has(args[0])) throw Object.assign(new Error(), { code: "ER_DUP_ENTRY" });
                const user = { id: users.size + 1, username: args[0], password_hash: args[1], steam_url: args[2] };
                users.set(user.username, user);
                return [{ insertId: user.id }];
            }
            if (sql.startsWith("SELECT id, username")) return [[...users.values()].filter(user => user.username === args[0])];
            if (sql.startsWith("UPDATE users SET steam_url")) {
                const user = [...users.values()].find(user => user.id === args[1]);
                if (user) user.steam_url = args[0];
                return [{}];
            }
            if (sql.startsWith("INSERT INTO user_sessions")) { sessions.set(args[0], { userId: args[1], expires: args[2] }); return [{}]; }
            if (sql.startsWith("DELETE FROM user_sessions WHERE token_hash")) { sessions.delete(args[0]); return [{}]; }
            if (sql.startsWith("DELETE FROM user_sessions WHERE expires_at")) {
                for (const [key, value] of sessions) if (value.expires <= args[0]) sessions.delete(key);
                return [{}];
            }
            if (sql.includes("JOIN users")) {
                const session = sessions.get(args[0]);
                const user = session?.expires > args[1] && [...users.values()].find(user => user.id === session.userId);
                return [user ? [{ ...(sql.includes("SELECT u.id") ? { id: user.id } : {}), username: user.username, steam_url: user.steam_url }] : []];
            }
            throw new Error(`Unexpected query: ${sql}`);
        },
    };
    const app = express();
    app.use(express.json());
    app.use("/api/auth", createAuthRouter(db));
    const server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const base = `http://127.0.0.1:${server.address().port}/api/auth/`;
    return { users, sessions, async request(path, body, cookie, headers = {}) {
        const res = await fetch(base + path, { method: body === undefined ? "GET" : "POST",
            headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: cookie } : {}), ...headers },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        return { status: res.status, cookie: res.headers.get("set-cookie"), body: await res.json() };
    } };
}

const account = { username: "TestUser", password: "a-long-test-password", steam_url: "https://steamcommunity.com/id/testuser" };

test("registration, session restoration, logout and subsequent login", async t => {
    const f = await fixture(t);
    assert.equal((await f.request("me")).body.user, null);
    const registered = await f.request("register", account);
    assert.equal(registered.status, 201);
    assert.equal(registered.body.user.username, account.username);
    assert.ok(registered.cookie.includes("HttpOnly"));
    assert.ok(registered.cookie.includes("SameSite=Lax"));
    assert.notEqual(f.users.get(account.username).password_hash, account.password);
    const cookie = registered.cookie.split(";")[0];
    assert.equal((await f.request("me", undefined, cookie)).body.user.username, account.username);
    assert.equal((await f.request("logout", {}, cookie)).status, 200);
    assert.equal((await f.request("me", undefined, cookie)).body.user, null);
    assert.equal((await f.request("login", { username: account.username, password: account.password })).status, 200);
});

test("missing users and incorrect passwords return clear failures", async t => {
    const f = await fixture(t);
    assert.equal((await f.request("login", { username: "missing", password: "wrong" })).status, 401);
    await f.request("register", account);
    assert.equal((await f.request("login", { username: account.username, password: "wrong" })).status, 401);
    assert.equal((await f.request("register", account)).status, 409);
});

test("validates account inputs and optional Steam URL", async t => {
    const f = await fixture(t);
    for (const fields of [{ username: "a" }, { password: "short" }, { password: "a".repeat(73) }, { steam_url: "https://example.com/id/test" }]) {
        assert.equal((await f.request("register", { ...account, ...fields })).status, 400);
    }
    assert.equal((await f.request("register", { ...account, steam_url: "" })).status, 201);
});

test("expired sessions are rejected and cross-site writes are blocked", async t => {
    const f = await fixture(t);
    const registered = await f.request("register", account);
    for (const session of f.sessions.values()) session.expires = 0;
    assert.equal((await f.request("me", undefined, registered.cookie.split(";")[0])).body.user, null);
    assert.equal((await f.request("logout", {}, undefined, { Origin: "https://other.example" })).status, 403);
});

test("limits repeated authentication attempts", async t => {
    const f = await fixture(t);
    for (let i = 0; i < 30; i++) await f.request("login", { username: "missing", password: "test" });
    assert.equal((await f.request("login", { username: "missing", password: "test" })).status, 429);
});

test("only signed-in users can update their own Steam URL", async t => {
    const f = await fixture(t);
    const url = "https://steamcommunity.com/id/newprofile";
    assert.equal((await f.request("profile", { steam_url: url })).status, 401);
    const created = await f.request("register", account);
    const cookie = created.cookie.split(";")[0];
    await f.request("register", { ...account, username: "OtherUser" });
    const saved = await f.request("profile", { steam_url: url, username: "OtherUser", id: 2 }, cookie);
    assert.equal(saved.status, 200);
    assert.equal((await f.request("me", undefined, cookie)).body.user.steam_url, url);
    assert.equal(f.users.get("OtherUser").steam_url, account.steam_url);
    assert.equal((await f.request("profile", { steam_url: "https://example.com" }, cookie)).status, 400);
    assert.equal((await f.request("profile", {}, cookie)).status, 400);
    assert.equal((await f.request("profile", { steam_url: "" }, cookie)).status, 200);
    assert.equal((await f.request("me", undefined, cookie)).body.user.steam_url, "");
});
