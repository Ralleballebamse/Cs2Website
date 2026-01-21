import express from "express";
import steamInventoryRoutes from "./routes/steamInventory.js";
import githubSteamMarketRoutes from "./routes/githubSteamMarket.js";
import steamMarketRoutes from "./routes/steamMarket.js";
import steamProfileRoutes from "./routes/steamProfile.js";

const app = express();

app.use(express.static("public"));

// mount both route files
app.use(steamInventoryRoutes);
app.use(githubSteamMarketRoutes);
app.use(steamMarketRoutes);
app.use(steamProfileRoutes);

app.listen(3000, () => console.log("Backend running on http://localhost:3000"));