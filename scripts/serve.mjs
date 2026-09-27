// Serves the static export in ./out — the whole app is just these files,
// so it runs offline, from any static file server or the file system.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname, "out");
const port = Number(process.env.PORT || 3000);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    let filePath = join(root, decodeURIComponent(url.pathname));
    if (filePath !== root && !filePath.startsWith(root + sep)) {
      throw new Error("path escapes root");
    }
    if (url.pathname.endsWith("/")) {
      filePath = join(filePath, "index.html");
    }
    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`Ledger (static export) served from ${root} on http://0.0.0.0:${port}`);
});
