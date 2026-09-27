/**
 * Bundles the static export (./out) into ONE self-contained HTML file that
 * runs fully offline straight from the file system — no server, no network.
 *
 * Run automatically after `next build`; writes:
 *   standalone/ledger.html  (committed copy, easy to download)
 *   out/ledger.html         (served alongside the export)
 *
 * Everything is inlined: CSS with fonts as data URIs, all JS chunks in
 * document order, the icon as a data URI. The script fails loudly if any
 * external reference survives.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "out");

const asset = (url) => readFileSync(join(outDir, url.replace(/^\/+/, "")));

let html = readFileSync(join(outDir, "index.html"), "utf8");

// 1. Stylesheets -> <style>, with fonts inlined as base64 data URIs.
html = html.replace(/<link\b[^>]*>/g, (tag) => {
  if (!/rel="stylesheet"/.test(tag)) return tag;
  const href = /href="([^"]+)"/.exec(tag)?.[1];
  if (href === undefined || !href.startsWith("/_next/")) return tag;
  let css = asset(href).toString("utf8");
  css = css.replace(/url\((\/_next\/[^)]+)\)/g, (_, fontPath) => {
    const data = asset(fontPath).toString("base64");
    return `url(data:font/woff2;base64,${data})`;
  });
  return `<style>${css}</style>`;
});

// 2. External scripts -> inline, in place (document order). Inline content
//    cannot contain a literal closing tag, so escape it — `<\/script>` is
//    identical to `</script>` inside JS strings.
html = html.replace(
  /<script([^>]*?)src="(\/_next\/[^"]+)"([^>]*?)><\/script>/g,
  (_match, before, src, after) => {
    const js = asset(src).toString("utf8").replace(/<\/script>/g, "<\\/script>");
    return `<script${before}${after}>${js}</script>`;
  },
);

// 3. Preloads/prefetches are pointless now — everything is inline.
html = html.replace(/<link\b[^>]*rel="(preload|prefetch|preconnect|dns-prefetch)"[^>]*>\s*/g, "");

// 4. Icon -> data URI.
html = html.replace(/<link\b[^>]*rel="icon"[^>]*>/g, () => {
  const svg = readFileSync(join(outDir, "icon.svg")).toString("utf8");
  return `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(svg)}">`;
});

// 5. Asset URLs also survive inside the React flight data (HL preload hints)
//    and webpack runtime metadata. Rewrite every remaining absolute reference
//    to a data URI — data: is a fetchable scheme on file://, so even React's
//    own preload attempts stay CORS-clean and offline.
const MIME = { ".css": "text/css", ".js": "text/javascript", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const replaceWith = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else {
      const ext = entry.name.slice(entry.name.lastIndexOf("."));
      const mime = MIME[ext];
      if (mime === undefined) continue;
      const path = "/" + full.slice(outDir.length + 1).replaceAll("\\", "/");
      replaceWith.push([path, `data:${mime};base64,${readFileSync(full).toString("base64")}`]);
    }
  }
};
walk(join(outDir, "_next", "static"));
for (const [path, uri] of replaceWith) {
  html = html.split(path).join(uri);
  html = html.split(path.replaceAll("/", "\\/")).join(uri);
}

// 6. Fail loudly if any fetchable asset reference survived.
if (html.includes("/_next/static")) {
  console.error("standalone: /_next/static reference survived in the document body");
  process.exit(1);
}
const bare = (html.match(/\/_next\//g) ?? []).length; // webpack publicPath `r.p` only
if (bare > 1) {
  console.error(`standalone: ${bare} bare /_next/ references survived (expected only the webpack publicPath)`);
  process.exit(1);
}
const leftovers = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]);
if (leftovers.length > 0) {
  console.error(`standalone: unreplaced asset references: ${leftovers.join(", ")}`);
  process.exit(1);
}

mkdirSync(join(root, "standalone"), { recursive: true });
writeFileSync(join(root, "standalone", "ledger.html"), html);
writeFileSync(join(outDir, "ledger.html"), html);

const kb = Math.round(Buffer.byteLength(html) / 102.4) / 10;
console.log(`standalone: wrote standalone/ledger.html and out/ledger.html (${kb} KB, self-contained)`);
