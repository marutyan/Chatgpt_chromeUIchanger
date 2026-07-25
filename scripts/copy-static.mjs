import { cp, mkdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const dist = new URL("../dist/", import.meta.url);

await mkdir(dist, { recursive: true });
await Promise.all([
  cp(new URL("static/manifest.json", root), new URL("manifest.json", dist)),
  cp(new URL("src/content/content.css", root), new URL("content.css", dist)),
]);
