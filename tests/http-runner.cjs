const {spawn}=require('node:child_process');const path=require('node:path');
const root=path.resolve(__dirname,'..');const env={...process.env,QX_PORT:'18124'};
const server=spawn(process.execPath,[path.join(root,'_server.cjs')],{env});let ready=false;
const watchdog=setTimeout(()=>{console.error('HTTP test timeout');server.kill();process.exitCode=1;},8000);
server.stdout.on('data',()=>{if(ready)return;ready=true;const test=spawn(process.execPath,[path.join(__dirname,'http-smoke.cjs')],{env,stdio:'inherit'});test.on('exit',code=>{clearTimeout(watchdog);process.exitCode=code||0;server.kill();});});
server.stderr.on('data',d=>process.stderr.write(d));server.on('exit',code=>{if(!ready){clearTimeout(watchdog);process.exitCode=code||1;}});
process.on('exit',()=>server.kill());
