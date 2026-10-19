import app from "./app.js";
import { startPriceMaintenance } from "./routes/marketPrices.js";

const port = process.env.PORT || 3000;
const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Website running on http://localhost:${server.address().port}`);
    startPriceMaintenance();
});

server.on("error", err => {
    if (err.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use. Stop the old server or change PORT in .env.`);
    } else console.error("Server failed to start:", err);
    process.exit(1);
});
