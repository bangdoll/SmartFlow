import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { cp, mkdtemp, symlink, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const repository = resolve(process.argv[2] || fileURLToPath(new URL('..', import.meta.url)));
const revision = process.argv[3];
const root = await mkdtemp(join(tmpdir(), 'smartflow-incident-cache-'));
for (const entry of ['src','public','next.config.ts','tsconfig.json','package.json']) {
  await cp(join(repository,entry),join(root,entry),{recursive:true});
}
if (revision) {
  // Replay the exact production public page implementation, keeping fixture
  // setup and dependency version identical to the candidate control.
  for (const entry of ['src/app/news/[id]/page.tsx','src/app/tags/[tag]/page.tsx','src/proxy.ts','next.config.ts']) {
    const source = execFileSync('git',['show',`${revision}:${entry}`],{cwd:repository,encoding:'utf8'});
    await writeFile(join(root,entry),source);
  }
}
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir');
for (const [entry,component] of [['src/app/news/[id]/page.tsx','NewsDetailPage'],['src/app/tags/[tag]/page.tsx','TagPage']]) {
  const path=join(root,entry), source=await readFile(path,'utf8');
  await writeFile(path,source.replace(`export default async function ${component}({ params }: Props) {`,`export default async function ${component}({ params }: Props) {\n console.log('INCIDENT_RENDER_${component}');`));
}
const item={id:'12345678-1234-4234-9234-123456789abc',title:'快取驗收新聞',title_en:'Cache regression news',source:'Fixture',published_at:'2026-11-14T00:00:00.000Z',created_at:'2026-11-14T00:00:00.000Z',summary_zh:'隔離測試內容',summary_en:'Isolated test content',original_url:'https://example.com/article',audio_url:null,audio_url_en:null,tags:['AI'],slug:'fixture-cache',click_count:0};
let reads=0, failReads=false;
const mock=createServer((req,res)=>{
 reads++;
 if(failReads){res.writeHead(503,{'content-type':'application/json'});res.end(JSON.stringify({code:'TEST_OUTAGE',message:'Isolated outage'}));return;}
 const u=new URL(req.url,'http://localhost');
 let items=u.pathname.endsWith('/news_items')?[item]:[];
 for(const [field,exp] of u.searchParams) {
  const dot=exp.indexOf('.'),op=exp.slice(0,dot),v=exp.slice(dot+1);
  if(['eq','gte','lte','lt','gt'].includes(op))items=items.filter(x=>op==='eq'?x[field]===v:op==='gte'?x[field]>=v:op==='lte'?x[field]<=v:op==='lt'?x[field]<v:x[field]>v);
 }
 res.setHeader('content-type','application/json');
 if(req.headers.accept?.includes('application/vnd.pgrst.object+json')) {
  if(!items.length){res.statusCode=406;res.end(JSON.stringify({code:'PGRST116',details:'The result contains 0 rows'}));return;}
  res.end(JSON.stringify(items[0]));
 } else res.end(JSON.stringify(items));
});
await new Promise(r=>mock.listen(0,'127.0.0.1',r));
const env={PATH:process.env.PATH,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:`http://127.0.0.1:${mock.address().port}`,NEXT_PUBLIC_SUPABASE_ANON_KEY:'fixture-only',SUPABASE_SERVICE_ROLE_KEY:'fixture-only'};
let app,logs='';
const run=args=>spawn(process.execPath,args,{cwd:root,env,stdio:['ignore','pipe','pipe']});
const renderCount=name=>logs.split(`INCIDENT_RENDER_${name}`).length-1;
try {
 const build=run(['node_modules/next/dist/bin/next','build','--webpack']);
 build.stdout.on('data',c=>{logs+=c;});build.stderr.on('data',c=>{logs+=c;});
 assert.equal((await once(build,'exit'))[0],0,'isolated production build succeeds: '+logs.slice(-3000));
 // Let the OS select an unused localhost port, then start Next on it.
 const portProbe=createServer();await new Promise(r=>portProbe.listen(0,'127.0.0.1',r));const port=portProbe.address().port;await new Promise(r=>portProbe.close(r));
 app=run(['node_modules/next/dist/bin/next','start','-p',String(port),'-H','127.0.0.1']);
 app.stdout.on('data',c=>{logs+=c;});app.stderr.on('data',c=>{logs+=c;});
 const base=`http://127.0.0.1:${port}`;
 for(let i=0;;i++){try{await fetch(base);break;}catch(e){if(i>100)throw e;await new Promise(r=>setTimeout(r,100));}}
 const results=[];
 for(const [path,name] of [['/news/12345678','NewsDetailPage'],['/tags/AI','TagPage']]){
  const samples=[];
  for(let i=0;i<3;i++){
   const before=reads, count=renderCount(name);
   const r=await fetch(base+path,{headers:{'user-agent':`IncidentRegression/${i}`}});const html=await r.text();
   await new Promise(r=>setTimeout(r,30));
   assert.equal(r.status,200);assert.ok(html.includes(item.title));
   samples.push({status:r.status,dbReads:reads-before,renders:renderCount(name)-count,cache:r.headers.get('x-nextjs-cache'),policy:r.headers.get('cache-control')});
  }
  results.push({path,samples});
 }
 console.log(JSON.stringify({revision:revision||'candidate-working-copy',results},null,2));
 for(const {path,samples} of results){
  assert.equal(samples[1].renders,0,path+' warm visitor must not invoke page render');
  assert.equal(samples[2].renders,0,path+' third visitor must not invoke page render');
  assert.equal(samples[1].cache,'HIT',path+' repeat response uses full-page ISR');
 }
 const rendersBefore=renderCount('NewsDetailPage'), readsBefore=reads;
 for(const path of ['/news/12345678','/tags/AI']){
  await Promise.all(Array.from({length:10},async()=>{
   const r=await fetch(base+path,{headers:{'user-agent':'IncidentRegression/Concurrent'}});
   assert.equal(r.status,200);assert.equal(r.headers.get('x-nextjs-cache'),'HIT');assert.ok((await r.text()).includes(item.title));
  }));
  const rsc=await fetch(base+path,{headers:{RSC:'1','next-router-prefetch':'1'}});
  assert.equal(rsc.status,200);assert.equal(rsc.headers.get('x-nextjs-cache'),'HIT');assert.ok(rsc.headers.get('content-type').includes('text/x-component'));assert.ok((await rsc.text()).includes(item.title));
 }
 await new Promise(r=>setTimeout(r,30));
 assert.equal(renderCount('NewsDetailPage'),rendersBefore);assert.equal(reads,readsBefore);
 for(const alias of [item.id,item.slug,'12345678'.toUpperCase()]){
  if(alias==='12345678')continue;
  for(const options of [{},{method:'HEAD'},{headers:{RSC:'1','next-router-prefetch':'1'}}]){
   const r=await fetch(`${base}/news/${alias}`,{...options,redirect:'manual'});
   assert.equal(r.status,308);assert.equal(r.headers.get('location'),'/news/12345678');await r.text();
  }
 }
 const missing=await fetch(base+'/news/00000000');assert.equal(missing.status,404);await missing.text();
 failReads=true;
 const cold=await fetch(base+'/news/87654321');assert.equal(cold.status,500);await cold.text();
 failReads=false;
 item.id='87654321-1234-4234-9234-123456789abc';item.title='故障後恢復新聞';
 const recovered=await fetch(base+'/news/87654321');assert.equal(recovered.status,200);assert.ok((await recovered.text()).includes(item.title));
 console.log('PASS: repeated visitors, 20 concurrent crawler reads and RSC avoid rendering/DB; UUID/slug GET/HEAD/RSC return one 308 Location; missing 404; cold failure is retried after recovery');
} finally {
 if(app){app.kill('SIGTERM');await once(app,'exit');}
 await new Promise(r=>mock.close(r));await rm(root,{recursive:true,force:true});
}
