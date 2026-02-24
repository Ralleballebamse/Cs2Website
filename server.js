import express from "express";
import "dotenv/config";
import steamInventoryRoutes from "./routes/steamInventory.js";
import steamMarketRoutes from "./routes/steamMarket.js";
import steamProfileRoutes from "./routes/steamProfile.js";
import faceit from "./routes/faceit.js";
import mySQLrouter from "./routes/mySQLrouter.js";

const app = express();

app.use(express.json());
app.use(express.static("public"));

// mount both route files
app.use(steamInventoryRoutes);
app.use(steamMarketRoutes);
app.use(steamProfileRoutes);
app.use("/api/faceit", faceit);
app.use("/api/mysql", mySQLrouter);

app.listen(3000, () => console.log("Backend running on http://localhost:3000"));