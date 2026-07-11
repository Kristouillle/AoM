import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "dist");
const staticEntries = ["index.html", "_headers", "src", "data", "assets"];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const entry of staticEntries) {
  await cp(path.join(root, entry), path.join(outputDir, entry), {
    recursive: true,
  });
}

console.log(`Built static site in ${path.relative(root, outputDir)}`);
