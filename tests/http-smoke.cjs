const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const root = path.resolve(__dirname,"..");
const files = ["/"];
function walk(dir) { for (const e of fs.readdirSync(dir,{withFileTypes:true})) { const f=path.join(dir,e.name); if(e.isDirectory())walk(f);else if(/\.(js|css|svg|webp)$/.test(f))files.push("/"+path.relative(root,f).split(path.sep).join("/")); } }
function request(url) { return new Promise((resolve,reject)=>{const req=http.get({hostname:"127.0.0.1",port:Number(process.env.QX_PORT||8124),path:url,timeout:3000},res=>{let body="";res.on("data",d=>body+=d);res.on("end",()=>resolve({status:res.statusCode,type:res.headers["content-type"],body}));});req.on("timeout",()=>req.destroy(new Error("Request timeout")));req.on("error",reject);}); }
(async()=>{walk(path.join(root,"src"));for(const file of files){const res=await request(file);assert.equal(res.status,200,file);const mime={js:"text/javascript",css:"text/css",svg:"image/svg+xml",webp:"image/webp"}[file.split(".").pop()];if(mime)assert.ok(res.type.startsWith(mime),file+" MIME");}
assert.equal((await request("/.rollback/before-redesign.zip")).status,404);
assert.equal((await request("/%E0%A4%A")).status,400);
assert.equal((await request("/missing.js")).status,404);
for (const seed of ["journalism-general-v1.json", "journalism-sources-v1.json"]) {
  assert.equal((await request("/data/recruitment/" + seed)).status, 404, seed);
}
console.log(`PASS: ${files.length} resources returned HTTP 200; JS/CSS/SVG/WebP MIME valid; backup and recruitment candidates are not served; malformed URL handled.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
