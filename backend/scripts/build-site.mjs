/* Copies the public site into dist/ for Cloudflare to serve as static assets.
 *
 * Cloudflare needs a dedicated asset directory. Pointing it at the repo root
 * would expose server code and make wrangler watch its own output, so the
 * shippable files are collected here instead. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const distDir = path.join(rootDir, "dist");

/* Everything not listed here is treated as part of the public site, so new
 * pages and folders are picked up without touching this script. */
const EXCLUDED = new Set([
    "dist",
    "node_modules",
    "backend",
    "package.json",
    "package-lock.json",
    "wrangler.toml",
    "README.md",
    ".github"
]);

function isPublic(name) {
    return !name.startsWith(".") && !EXCLUDED.has(name);
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

const copied = fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => isPublic(entry.name))
    .map((entry) => {
        fs.cpSync(path.join(rootDir, entry.name), path.join(distDir, entry.name), {
            recursive: true
        });
        return entry.name;
    });

console.log(`Copied ${copied.length} entries into dist/: ${copied.join(", ")}`);
