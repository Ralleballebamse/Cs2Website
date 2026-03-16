import express from "express";
import "dotenv/config";
import steamInventoryRoutes from "./routes/steamInventory.js";
import steamMarketRoutes from "./routes/steamMarket.js";
import steamProfileRoutes from "./routes/steamProfile.js";
import faceit from "./routes/faceit.js";
import mySQLrouter from "./routes/mySQLrouter.js";
import itemSteamIDs from "./routes/itemSteamIDs.js";
//import githubLoad from "./routes/githubLoad.js";

const app = express();

app.use(express.json());
app.use(express.static("public"));

// mount both route files
//app.use(githubLoad); Used for load extra marketID from github. 
app.use(steamInventoryRoutes);
app.use("/api/steam", steamMarketRoutes);
app.use(steamProfileRoutes);
app.use("/api/faceit", faceit);
app.use("/api/mysql", mySQLrouter);
app.use("/api/steam", itemSteamIDs);

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend running on http://0.0.0.0:${PORT}`);
});