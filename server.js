import express from "express";
import steamInventoryRoutes from "./routes/steamInventory.js";
import steamMarketRoutes from "./routes/steamMarket.js";

const app = express();

app.use(express.static("public"));

// mount both route files
app.use(steamInventoryRoutes);
app.use(steamMarketRoutes);

app.listen(3000, () => console.log("Backend running on http://localhost:3000"));