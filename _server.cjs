const http = require("http");
const fs = require("fs");
const path = require("path");
const root = __dirname;
const port = Number(process.env.QX_PORT || 8124);
const mime = { ".webp":"image/webp", ".svg":"image/svg+xml", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8" };
const database = process.env.QX_DATABASE_URL
  ? import("pg").then(({ default: pg }) => {
    const pool = new pg.Pool({ connectionString: process.env.QX_DATABASE_URL, max: 5, connectionTimeoutMillis: 3000 });
    pool.on("error", () => console.error("Application database connection closed unexpectedly"));
    return pool;
  })
  : Promise.resolve(null);
const analysis = Promise.all([import("./server/background-analysis.mjs"), database])
  .then(([{ createAnalysisHandler }, db]) => createAnalysisHandler(undefined, { db }));
const accounts = Promise.all([import("./server/accounts.mjs"), database])
  .then(([{ createAccountHandler }, db]) => createAccountHandler(db));
const community = Promise.all([import("./server/community.mjs"), database])
  .then(([{ createCommunityHandler }, db]) => createCommunityHandler(db));
const interactions = Promise.all([import("./server/community-interactions.mjs"), database])
  .then(([{ createCommunityInteractions }, db]) => createCommunityInteractions(db));
const moderation = Promise.all([import("./server/community-moderation.mjs"), database])
  .then(([{ createCommunityModeration }, db]) => createCommunityModeration(db));
const messages = Promise.all([import("./server/messages.mjs"), database])
  .then(([{ createMessageHandler }, db]) => createMessageHandler(db));
const server = http.createServer(async (req, res) => {
  const route = req.url.split("?")[0];
  const conversation = route.match(/^\/api\/account\/conversations(?:\/([^/]+))?$/);
  if (conversation) {
    const handleMessages = await messages;
    return handleMessages(req, res, conversation[1] ?? null);
  }
  if (route.startsWith("/api/account/")) {
    const handleAccounts = await accounts;
    return handleAccounts(req, res, route);
  }
  if (route === "/api/community/moderation") {
    const handleModeration = await moderation;
    return handleModeration(req, res);
  }
  const postInteraction = route.match(/^\/api\/community\/posts\/([^/]+)\/interactions$/);
  if (postInteraction) {
    const handleInteractions = await interactions;
    return handleInteractions(req, res, postInteraction[1]);
  }
  if (route === "/api/community/posts") {
    const handleCommunity = await community;
    return handleCommunity(req, res);
  }
  if (route === "/api/background-analysis") {
    const handleAnalysis = await analysis;
    return handleAnalysis(req, res);
  }
  if (!["GET", "HEAD"].includes(req.method)) { res.writeHead(405, { Allow: "GET, HEAD" }); res.end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(req.url.split("?")[0]); }
  catch { res.writeHead(400); res.end("Bad request"); return; }
  if (pathname === "/") pathname = "/index.html";
  const file = path.resolve(root, "." + pathname);
  const relative = path.relative(root, file);
  const publicFile = relative === "index.html" || relative.startsWith("src" + path.sep);
  if (!publicFile || relative.startsWith("..") || path.isAbsolute(relative)) { res.writeHead(404); res.end("Not found"); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" });
    res.end(req.method === "HEAD" ? undefined : data);
  });
});
server.on("error", error => {
  console.error(error.code === "EADDRINUSE" ? `Port ${port} is already in use. Close the previous preview server and retry.` : error.message);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => console.log(`Local: http://127.0.0.1:${port}/`));
