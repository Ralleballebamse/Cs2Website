import "./config/env.js";
import express from "express";
import { fileURLToPath } from "node:url";
import steamInventoryRoutes from "./routes/steamInventory.js";
import steamMarketRoutes from "./routes/steamMarket.js";
import steamProfileRoutes from "./routes/steamProfile.js";
import faceitRoutes from "./routes/faceit.js";
import itemRoutes from "./routes/items.js";
import marketIdRoutes from "./routes/marketIds.js";
import marketPriceRoutes from "./routes/marketPrices.js";
import authRoutes from "./routes/auth.js";

const app = express();
const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));

app.use(express.json());
app.use(express.static(publicDirectory));

// Preserve existing bookmarks after moving the HTML pages.
for (const [oldPath, newPath] of Object.entries({
    "/home.html": "/", "/index.html": "/", "/posts.html": "/pages/posts.html",
    "/guide.html": "/pages/guide.html", "/contact.html": "/pages/contact.html",
    "/loginPage.html": "/pages/login.html", "/account.html": "/pages/account.html",
})) app.get(oldPath, (req, res) => res.redirect(newPath));

app.use(steamInventoryRoutes);
app.use(steamProfileRoutes);
app.use("/api/steam", steamMarketRoutes);
app.use("/api/steam", marketIdRoutes);
app.use("/api/steam", marketPriceRoutes);
app.use("/api/faceit", faceitRoutes);
app.use("/api/mysql", itemRoutes);
app.use("/api/auth", authRoutes);

export default app;
