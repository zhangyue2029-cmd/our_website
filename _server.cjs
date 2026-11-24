const http = require("http");
const fs = require("fs");
const path = require("path");
const root = __dirname;
const port = Number(process.env.QX_PORT || 8124);
const mime = { ".webp":"image/webp", ".svg":"image/svg+xml", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8" };
const analysis = import("./server/background-analysis.mjs").then(({ createAnalysisHandler, createOpenAIProvider }) =>
  createAnalysisHandler(createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY, model: process.env.QX_AI_MODEL }))
);
const server = http.createServer(async (req, res) => {
  if (req.url.split("?")[0] === "/api/background-analysis") {
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
