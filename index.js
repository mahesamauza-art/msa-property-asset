const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

function normalizePhone(v='') { return String(v).replace(/\D/g, '').replace(/^0/, '62'); }
function nowId() { return crypto.randomUUID(); }

async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}
async function validSession(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/msa_session=([^;]+)/);
  if (!m) return false;
  const [payload, sig] = decodeURIComponent(m[1]).split('.');
  if (!payload || !sig) return false;
  const expected = await sign(payload, env.SESSION_SECRET || env.ADMIN_PASSWORD || 'CHANGE_ME');
  if (sig !== expected) return false;
  const [user, exp] = payload.split('|');
  return user === (env.ADMIN_USER || 'Mahesa2026') && Number(exp) > Date.now();
}

async function api(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (path === '/api/health' && method === 'GET') return json({ok:true, service:'MSA Property & Asset API'});

  if (path === '/api/login' && method === 'POST') {
    const body = await request.json().catch(()=>({}));
    const user = String(body.username || '');
    const pass = String(body.password || '');
    if (user !== (env.ADMIN_USER || 'Mahesa2026') || pass !== (env.ADMIN_PASSWORD || 'CHANGE_ME')) return json({ok:false,error:'Username atau password salah.'},401);
    const payload = `${user}|${Date.now()+1000*60*60*12}`;
    const sig = await sign(payload, env.SESSION_SECRET || env.ADMIN_PASSWORD || 'CHANGE_ME');
    const cookie = `msa_session=${encodeURIComponent(payload+'.'+sig)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`;
    return new Response(JSON.stringify({ok:true}), {status:200, headers:{'content-type':'application/json','set-cookie':cookie}});
  }

  if (path === '/api/logout' && method === 'POST') {
    return new Response(JSON.stringify({ok:true}), {status:200,headers:{'content-type':'application/json','set-cookie':'msa_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'}});
  }

  if (path === '/api/assets' && method === 'GET') {
    const r = await env.DB.prepare(`SELECT * FROM assets WHERE status IN ('Aktif','SOLD') ORDER BY datetime(created_at) DESC`).all();
    return json(r.results || []);
  }

  if (path === '/api/assets' && method === 'POST') {
    if (!(await validSession(request, env))) return json({ok:false,error:'Unauthorized'},401);
    const b = await request.json();
    if (!b.name || !b.location) return json({ok:false,error:'Nama aset dan lokasi wajib diisi.'},400);
    const id = nowId();
    await env.DB.prepare(`INSERT INTO assets (id,name,location,price,area,category,plant,year,land,status,nego,complete,minus,description,image_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(id,b.name,b.location,Number(b.price)||0,b.area||'',b.category||'',b.plant||'',b.year||'',b.land||'Belum diverifikasi',b.status==='SOLD'?'SOLD':'Aktif',b.nego===false?0:1,b.complete||'Perlu verifikasi Admin',b.minus||'Belum dicatat',b.description||'',b.image_url||'').run();
    return json({ok:true,id});
  }

  const assetMatch = path.match(/^\/api\/assets\/([^/]+)$/);
  if (assetMatch) {
    if (!(await validSession(request, env))) return json({ok:false,error:'Unauthorized'},401);
    const id = assetMatch[1];
    if (method === 'PATCH') {
      const b = await request.json();
      const fields = ['name','location','price','area','category','plant','year','land','status','nego','complete','minus','description','image_url'];
      const sets=[]; const vals=[];
      for (const f of fields) if (b[f] !== undefined) { sets.push(`${f}=?`); vals.push(f==='price'?Number(b[f])||0:f==='nego'?(b[f]?1:0):b[f]); }
      if (!sets.length) return json({ok:true});
      sets.push(`updated_at=datetime('now')`); vals.push(id);
      await env.DB.prepare(`UPDATE assets SET ${sets.join(',')} WHERE id=?`).bind(...vals).run();
      return json({ok:true});
    }
    if (method === 'DELETE') { await env.DB.prepare('DELETE FROM assets WHERE id=?').bind(id).run(); return json({ok:true}); }
  }

  if (path === '/api/team' && method === 'GET') {
    if (!(await validSession(request, env))) return json({ok:false,error:'Unauthorized'},401);
    const r=await env.DB.prepare('SELECT * FROM team_whatsapp ORDER BY active DESC, created_at DESC').all(); return json(r.results||[]);
  }
  if (path === '/api/team' && method === 'POST') {
    if (!(await validSession(request, env))) return json({ok:false,error:'Unauthorized'},401);
    const b=await request.json(); if(!b.name||!b.phone)return json({ok:false,error:'Nama dan nomor wajib diisi.'},400);
    const id=nowId(); await env.DB.prepare('INSERT INTO team_whatsapp (id,name,phone,active) VALUES (?,?,?,?)').bind(id,b.name,normalizePhone(b.phone),b.active===false?0:1).run(); return json({ok:true,id});
  }
  const teamMatch=path.match(/^\/api\/team\/([^/]+)$/);
  if(teamMatch){
    if(!(await validSession(request,env)))return json({ok:false,error:'Unauthorized'},401);
    const id=teamMatch[1];
    if(method==='PATCH'){const b=await request.json(); await env.DB.prepare('UPDATE team_whatsapp SET name=COALESCE(?,name), phone=COALESCE(?,phone), active=COALESCE(?,active) WHERE id=?').bind(b.name||null,b.phone?normalizePhone(b.phone):null,b.active===undefined?null:(b.active?1:0),id).run();return json({ok:true});}
    if(method==='DELETE'){await env.DB.prepare('DELETE FROM team_whatsapp WHERE id=?').bind(id).run();return json({ok:true});}
  }

  if (path === '/api/contact-number' && method === 'GET') {
    const r=await env.DB.prepare('SELECT phone FROM team_whatsapp WHERE active=1 ORDER BY created_at ASC LIMIT 1').first();
    return json({phone:r?.phone||''});
  }

  if (path === '/api/owner-submissions' && method === 'POST') {
    const b=await request.json();
    if(!b.asset_name||!b.whatsapp||!b.owner_authorized)return json({ok:false,error:'Nama aset, WhatsApp, dan pernyataan hak/kuasa wajib diisi.'},400);
    const id=nowId(); await env.DB.prepare('INSERT INTO owner_submissions (id,asset_name,location,whatsapp,description,owner_authorized) VALUES (?,?,?,?,?,1)').bind(id,b.asset_name,b.location||'',normalizePhone(b.whatsapp),b.description||'').run(); return json({ok:true});
  }
  if (path === '/api/owner-submissions' && method === 'GET') {
    if (!(await validSession(request, env))) return json({ok:false,error:'Unauthorized'},401);
    const r=await env.DB.prepare('SELECT * FROM owner_submissions ORDER BY datetime(created_at) DESC').all(); return json(r.results||[]);
  }

  return json({ok:false,error:'Not found'},404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return api(request, env);
    return env.ASSETS.fetch(request);
  }
};
