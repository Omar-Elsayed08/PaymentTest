import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { buildConfig } from "../shared/config.js";
import { createApp } from "./app.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const port = Number.parseInt(process.env.PORT || "3000", 10);

const config = buildConfig({
    ...process.env,
    PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || `http://localhost:${port}`
});

createApp(config, rootDir).listen(port, () => {
    console.log(`Everything Burger shop listening on ${config.publicBaseUrl}`);
    console.log(`Stripe webhook endpoint: ${config.publicBaseUrl}/api/webhooks/stripe`);
});
