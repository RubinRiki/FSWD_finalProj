import fs from 'fs';
import path from 'path';

const ROUTES_URL = process.env.ROUTES_URL || 'http://localhost:5000/__routes';
const CLIENT_DIRS_ENV = process.env.CLIENT_DIRS || '';
const CLIENT_DIRS = CLIENT_DIRS_ENV
  ? CLIENT_DIRS_ENV.split(',').map(s => s.trim()).filter(Boolean)
  : ['src/services', 'src/pages', 'src/components'];

const exts = new Set(['.js', '.jsx', '.ts', '.tsx']);
function walk(dir){
  const out=[]; if(!fs.existsSync(dir)) return out;
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) out.push(...walk(p));
    else if(exts.has(path.extname(e.name))) out.push(p);
  }
  return out;
}
function normalizePath(p) {
  if (!p) return '';
  let s = String(p).trim();
  s = s.replace(/^https?:\/\/[^/]+/i, '');
  s = s.replace(/\/api(\/|$)/i, '/');
  s = s.replace(/\/{2,}/g, '/');
  s = s.replace(/\$\{[^}]+\}/g, ':param');
  s = s.replace(/\/:[^/]+/g, '/:param');   // 👈 הופך כל :id / :courseId ל- :param
  s = s.replace(/\/+$/, '');
  if (!s.startsWith('/')) s = '/' + s;
  return s;
}

const normalizeMethod = m => String(m||'get').toUpperCase();

function scanClientCalls(){
  const files = CLIENT_DIRS.flatMap(walk).filter(Boolean);
  const calls=[];
  const rxAxios = /api\.(get|post|put|patch|delete)\(\s*([`'"])(.+?)\2/gi;
  const rxFetch = /fetch\(\s*([`'"])(.+?)\1\s*,\s*\{[^}]*method\s*:\s*([`'"])(GET|POST|PUT|PATCH|DELETE)\3/gi;
  for(const f of files){
    const txt = fs.readFileSync(f,'utf8');
    let m;
    while((m=rxAxios.exec(txt))) calls.push({method:normalizeMethod(m[1]), path:normalizePath(m[3]), file:f});
    while((m=rxFetch.exec(txt))) calls.push({method:normalizeMethod(m[4]), path:normalizePath(m[2]), file:f});
  }
  const key=x=>`${x.method} ${x.path}`;
  return [...new Map(calls.map(c=>[key(c),c])).values()];
}

function flattenServerRoutes(routesJson){
  const out=[];
  for(const r of routesJson||[]){
    const p = normalizePath(r.path||r.route||r);
    for(const m of r.methods||[]) out.push({method:normalizeMethod(m), path:p});
  }
  const key=x=>`${x.method} ${x.path}`;
  return [...new Map(out.map(x=>[key(x),x])).values()];
}

function compare(client,server){
  const key=x=>`${x.method} ${x.path}`;
  const S=new Set(server.map(key));
  const C=new Set(client.map(key));
  const clientOnly = client.filter(x=>!S.has(key(x)));
  const serverOnly = server.filter(x=>!C.has(key(x)));
  const matched = client.length - clientOnly.length;
  return { clientOnly, serverOnly, matched, totals:{client:client.length, server:server.length} };
}

(async()=>{
  try{
    const clientCalls = scanClientCalls();
    const res = await fetch(ROUTES_URL);
    if(!res.ok) throw new Error(`GET ${ROUTES_URL} -> ${res.status}`);
    const serverRoutes = flattenServerRoutes(await res.json());
    const { clientOnly, serverOnly, matched, totals } = compare(clientCalls, serverRoutes);

    console.log('=== API Coverage Report ===');
    console.log(`Client calls: ${totals.client} | Server routes: ${totals.server} | Matched: ${matched}`);

    if(clientOnly.length){
      console.log('\nClient-only (missing on server):');
      clientOnly.forEach(x=>console.log(`- ${x.method} ${x.path}    (${x.file})`));
    } else {
      console.log('\nNo missing server routes for client calls ✅');
    }

    if(serverOnly.length){
      console.log('\nServer-only (unused by client):');
      serverOnly.forEach(x=>console.log(`- ${x.method} ${x.path}`));
    } else {
      console.log('\nNo unused server routes (by client) ✅');
    }
  }catch(e){
    console.error('Failed:', e.message);
    process.exit(1);
  }
})();
