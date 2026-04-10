/**
 * Локальная разработка без CORS: статика и /api/* с одного origin.
 * Запуск: npm run dev → http://localhost:8787
 *
 * HTTPS для телефона / Telegram WebView:
 *   npx cloudflared tunnel --url http://localhost:8787
 * (или ngrok: npx ngrok http 8787)
 */
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;
const API_HOST = "ttscrollnplay.dhvcc.me";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};

function safeFilePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  if (decoded.includes("\0")) return null;
  const rel = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "");
  if (rel.startsWith("..")) return null;
  const full = path.join(__dirname, rel);
  if (!full.startsWith(__dirname)) return null;
  return full;
}

function sendStatic(req, res, filePath) {
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

function proxyToApi(req, res) {
  const targetPath = req.url.split("?")[0];
  const search = req.url.includes("?") ? "?" + req.url.split("?").slice(1).join("?") : "";

  const opts = {
    hostname: API_HOST,
    port: 443,
    path: targetPath + search,
    method: req.method,
    headers: {
      ...req.headers,
      host: API_HOST,
      "x-forwarded-host": req.headers.host || "",
    },
  };

  const proxyReq = https.request(opts, (proxyRes) => {
    const headers = { ...proxyRes.headers };
    delete headers["transfer-encoding"];
    res.writeHead(proxyRes.statusCode || 502, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (e) => {
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Proxy error: ${e.message}`);
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];

  if (urlPath.startsWith("/api/")) {
    proxyToApi(req, res);
    return;
  }

  let filePath = urlPath === "/" ? path.join(__dirname, "index.html") : safeFilePath(urlPath.slice(1));
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  sendStatic(req, res, filePath);
});

server.listen(PORT, () => {
  console.log(`Dev: http://localhost:${PORT}/`);
  console.log(`API /api/* → https://${API_HOST} (без CORS)`);
});
