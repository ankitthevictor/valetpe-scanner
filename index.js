// ValetPe Brand Scanner — Single File Server
// ─────────────────────────────────────────────
// HOW TO USE ON REPLIT:
// 1. Go to replit.com → Create Repl → Node.js
// 2. Delete everything in main.js / index.js
// 3. Paste this entire file
// 4. Click the Secrets tab (🔒) → Add secret:
//    Key:   ANTHROPIC_API_KEY
//    Value: your sk-ant-... key
// 5. Click Run → you get a live public URL
// ─────────────────────────────────────────────

const http = require('http');
const https = require('https');

const API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3000;

// ── FRONTEND HTML ──────────────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ValetPe — Post-Purchase Revenue Scanner</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">
<style>
:root{
  --black:#0a0a0a;--black2:#111111;--black3:#161616;--black4:#1e1e1e;
  --teal:#15c0ab;--teal-d:#0fa090;--teal-bg:rgba(21,192,171,0.08);--teal-bd:rgba(21,192,171,0.2);
  --white:#ffffff;--text:#e8e8e6;--text2:#a8a8a5;--muted:#606060;
  --border:#242424;--border2:#2e2e2e;
  --red:#f04444;--red-bg:rgba(240,68,68,0.1);--red-bd:rgba(240,68,68,0.2);
  --amber:#f0a030;--amber-bg:rgba(240,160,48,0.1);--amber-bd:rgba(240,160,48,0.2);
  --blue:#4a9eff;--blue-bg:rgba(74,158,255,0.1);--blue-bd:rgba(74,158,255,0.2);
}
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'DM Sans',sans-serif;background:var(--black);color:var(--text);min-height:100vh;font-size:14px;line-height:1.55;}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-track{background:var(--black);}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px;}
nav{background:var(--black);border-bottom:1px solid var(--border);padding:0 32px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
.logo{display:flex;align-items:center;gap:12px;}
.logo-wordmark{font-family:'Nunito',sans-serif;font-weight:900;font-size:20px;letter-spacing:-0.5px;color:var(--teal);}
.nav-tag{font-size:11px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:var(--teal);background:var(--teal-bg);border:1px solid var(--teal-bd);padding:5px 13px;border-radius:20px;}
#hero{max-width:740px;margin:0 auto;padding:60px 28px 52px;text-align:center;}
.eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:var(--teal);background:var(--teal-bg);border:1px solid var(--teal-bd);padding:5px 14px;border-radius:20px;margin-bottom:24px;}
.eyebrow-dot{width:6px;height:6px;background:var(--teal);border-radius:50%;display:inline-block;animation:pulse 2s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.5;transform:scale(0.8);}}
.hero-h1{font-family:'Nunito',sans-serif;font-weight:900;font-size:clamp(32px,5.5vw,52px);line-height:1.05;letter-spacing:-1.5px;color:var(--white);margin-bottom:10px;}
.hero-h1 em{font-style:normal;color:var(--teal);}
.hero-sub{font-size:15px;color:var(--text2);line-height:1.75;max-width:500px;margin:0 auto 32px;font-weight:300;}
.stats-strip{display:flex;gap:0;max-width:600px;margin:0 auto 32px;background:var(--black2);border:1px solid var(--border2);border-radius:14px;overflow:hidden;}
.stat{flex:1;padding:18px 14px;text-align:center;border-right:1px solid var(--border);}
.stat:last-child{border-right:none;}
.stat-val{font-family:'Nunito',sans-serif;font-weight:900;font-size:24px;color:var(--teal);line-height:1;margin-bottom:5px;}
.stat-lbl{font-size:10px;color:var(--muted);line-height:1.45;}
.search-wrap{display:flex;gap:8px;max-width:520px;margin:0 auto 16px;}
.sinput{flex:1;height:50px;padding:0 18px;font-size:14px;font-family:'DM Sans',sans-serif;border:1px solid var(--border2);border-radius:10px;background:var(--black2);color:var(--white);outline:none;transition:border-color 0.2s;}
.sinput:focus{border-color:var(--teal);}
.sinput::placeholder{color:var(--muted);}
.sbtn{height:50px;padding:0 26px;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;background:var(--teal);color:var(--black);border:none;border-radius:10px;cursor:pointer;white-space:nowrap;transition:opacity 0.15s;}
.sbtn:hover{opacity:0.88;}
.sbtn:disabled{opacity:0.35;cursor:not-allowed;}
.pills{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;}
.pill{font-size:12px;padding:5px 14px;border:1px solid var(--border2);border-radius:20px;cursor:pointer;color:var(--muted);background:transparent;transition:all 0.15s;font-family:'DM Sans',sans-serif;}
.pill:hover{border-color:var(--teal);color:var(--teal);}
.err{display:none;background:var(--red-bg);border:1px solid var(--red-bd);border-radius:8px;padding:12px 16px;font-size:13px;color:var(--red);margin:14px auto 0;max-width:520px;text-align:center;}
#loading{display:none;text-align:center;padding:80px 28px;}
.spinner{width:32px;height:32px;border:2px solid var(--border2);border-top-color:var(--teal);border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto 20px;}
@keyframes spin{to{transform:rotate(360deg);}}
.load-brand{font-family:'Nunito',sans-serif;font-weight:900;font-size:16px;color:var(--white);margin-bottom:20px;}
.load-steps{display:flex;flex-direction:column;gap:8px;max-width:290px;margin:0 auto;}
.lstep{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:8px;opacity:0;transform:translateY(4px);transition:all 0.35s;}
.lstep.on{opacity:1;transform:none;color:var(--text);}
.lstep.ok{opacity:1;transform:none;color:var(--teal);}
.ldot{width:5px;height:5px;border-radius:50%;background:var(--border2);flex-shrink:0;}
.lstep.on .ldot,.lstep.ok .ldot{background:var(--teal);}
#dash{display:none;max-width:840px;margin:0 auto;padding:0 28px 72px;animation:up 0.45s ease both;}
@keyframes up{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}
.back{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--muted);background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;padding:0;margin:20px 0 0;transition:color 0.15s;}
.back:hover{color:var(--teal);}
.brand-hdr{background:var(--black2);border:1px solid var(--border2);border-radius:14px;padding:26px 28px;margin:16px 0 12px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;}
.bname{font-family:'Nunito',sans-serif;font-weight:900;font-size:28px;letter-spacing:-0.5px;color:var(--white);}
.bcat{font-size:12px;color:var(--muted);margin-top:4px;}
.score-wrap{text-align:center;flex-shrink:0;}
.score-num{font-family:'Nunito',sans-serif;font-weight:900;font-size:48px;color:var(--teal);line-height:1;}
.score-of{font-size:12px;color:var(--muted);margin-top:2px;}
.score-tag{display:inline-block;font-size:11px;font-weight:700;padding:3px 11px;border-radius:20px;margin-top:7px;}
.t-critical{background:var(--red-bg);color:var(--red);border:1px solid var(--red-bd);}
.t-attention{background:var(--amber-bg);color:var(--amber);border:1px solid var(--amber-bd);}
.t-good{background:var(--teal-bg);color:var(--teal);border:1px solid var(--teal-bd);}
.rev-strip{border:1px solid var(--teal-bd);border-radius:12px;padding:20px 24px;margin-bottom:12px;background:var(--black2);position:relative;overflow:hidden;}
.rev-strip::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--teal),transparent);}
.rev-label{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--teal);margin-bottom:8px;}
.rev-headline{font-family:'Nunito',sans-serif;font-weight:900;font-size:17px;color:var(--white);line-height:1.3;margin-bottom:7px;}
.rev-body{font-size:13px;color:var(--text2);line-height:1.7;}
.kpi-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:12px;}
.kpi{background:var(--black2);border:1px solid var(--border);border-radius:10px;padding:16px 14px;}
.kpi-val{font-family:'Nunito',sans-serif;font-weight:900;font-size:22px;line-height:1;margin-bottom:4px;}
.kv-red{color:var(--red);}.kv-amber{color:var(--amber);}.kv-teal{color:var(--teal);}.kv-white{color:var(--white);}
.kpi-lbl{font-size:11px;color:var(--muted);line-height:1.4;margin-bottom:6px;}
.kpi-note{font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;display:inline-block;}
.kn-bad{background:var(--red-bg);color:var(--red);}.kn-warn{background:var(--amber-bg);color:var(--amber);}.kn-ok{background:var(--teal-bg);color:var(--teal);}
.two-col{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:10px;}
.card{background:var(--black2);border:1px solid var(--border);border-radius:12px;padding:20px;}
.card-label{font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:var(--muted);margin-bottom:16px;}
.full-card{background:var(--black2);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:10px;}
.complaints{display:flex;flex-direction:column;gap:14px;}
.ci{display:flex;gap:10px;align-items:flex-start;}
.cvol-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:7px;}
.ch{background:var(--red);}.cm{background:var(--amber);}.cl{background:var(--teal);}
.ci-src{font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);margin-bottom:3px;}
.ci-text{font-size:13px;line-height:1.6;color:var(--text);}
.pains{display:flex;flex-direction:column;gap:8px;}
.pain{display:flex;align-items:flex-start;gap:10px;font-size:13px;line-height:1.6;padding:11px 13px;background:var(--black3);border:1px solid var(--border);border-radius:8px;}
.pain-ic{font-size:15px;flex-shrink:0;margin-top:1px;}
.bench{display:flex;flex-direction:column;gap:12px;}
.br{display:flex;align-items:center;gap:10px;}
.br-name{font-size:13px;min-width:145px;color:var(--text2);}
.br-name.you{font-weight:700;color:var(--white);}
.br-bar-bg{flex:1;height:6px;background:var(--black3);border-radius:3px;overflow:hidden;border:1px solid var(--border);}
.br-bar{height:6px;border-radius:3px;}
.br-score{font-size:12px;color:var(--muted);min-width:44px;text-align:right;}
.grade{font-size:11px;font-weight:800;width:26px;height:26px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}
.ga{background:var(--teal-bg);color:var(--teal);}.gb{background:var(--blue-bg);color:var(--blue);}.gc{background:var(--amber-bg);color:var(--amber);}.gd{background:var(--red-bg);color:var(--red);}
.vp-box{background:var(--black2);border:1px solid var(--teal-bd);border-radius:14px;overflow:hidden;position:relative;}
.vp-box::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--teal),transparent 70%);}
.vp-head{padding:24px 26px 0;}
.vp-eyebrow{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--teal);margin-bottom:7px;}
.vp-title{font-family:'Nunito',sans-serif;font-weight:900;font-size:20px;color:var(--white);line-height:1.25;letter-spacing:-0.3px;margin-bottom:22px;}
.vp-solves{display:flex;flex-direction:column;gap:2px;padding:0 26px;}
.solve{display:flex;gap:14px;padding:15px 0;border-bottom:1px solid var(--border);}
.solve:last-child{border-bottom:none;}
.solve-icon{flex-shrink:0;width:40px;height:40px;border-radius:10px;background:var(--teal-bg);border:1px solid var(--teal-bd);display:flex;align-items:center;justify-content:center;font-size:18px;}
.solve-title{font-size:13px;font-weight:700;color:var(--white);margin-bottom:4px;}
.solve-desc{font-size:12px;color:var(--text2);line-height:1.65;}
.solve-save{display:inline-block;font-size:12px;font-weight:700;color:var(--teal);margin-top:6px;}
.vp-nums{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid var(--border);}
.vpn{padding:20px 26px;border-right:1px solid var(--border);}
.vpn:last-child{border-right:none;}
.vpn-val{font-family:'Nunito',sans-serif;font-weight:900;font-size:30px;color:var(--teal);line-height:1;margin-bottom:5px;}
.vpn-lbl{font-size:11px;color:var(--muted);line-height:1.5;}
.vp-cta{padding:20px 26px;border-top:1px solid var(--border);display:flex;gap:10px;flex-wrap:wrap;}
.btn-p{padding:12px 28px;background:var(--teal);color:var(--black);border:none;border-radius:9px;font-size:13px;font-weight:800;font-family:'DM Sans',sans-serif;cursor:pointer;transition:opacity 0.15s;}
.btn-p:hover{opacity:0.88;}
.btn-s{padding:12px 22px;background:transparent;color:var(--text2);border:1px solid var(--border2);border-radius:9px;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all 0.15s;}
.btn-s:hover{color:var(--white);border-color:var(--muted);}
footer{text-align:center;padding:20px;font-size:11px;color:var(--muted);border-top:1px solid var(--border);}
footer strong{color:var(--teal);}
@media(max-width:600px){
  nav{padding:0 16px;}#hero{padding:40px 16px 36px;}#dash{padding:0 16px 56px;}
  .kpi-row{grid-template-columns:repeat(2,1fr);}.two-col{grid-template-columns:1fr;}
  .vp-nums{grid-template-columns:repeat(2,1fr);}
  .stats-strip{flex-direction:column;}.stat{border-right:none;border-bottom:1px solid var(--border);}
  .stat:last-child{border-bottom:none;}.search-wrap{flex-direction:column;}
}
</style>
</head>
<body>
<nav>
  <div class="logo">
    <svg width="34" height="28" viewBox="0 0 34 28" fill="none">
      <path d="M32 3C28 2 8 1 3 10C-1 18 5 26 13 23C21 20 27 10 32 3Z" fill="rgba(21,192,171,0.12)"/>
      <path d="M30 4C24 3 10 3 4 11C0 17 6 25 14 22" stroke="#15c0ab" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <path d="M30 4C28 8 24 16 18 20" stroke="#15c0ab" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.5"/>
    </svg>
    <span class="logo-wordmark">ValetPe</span>
  </div>
  <div class="nav-tag">Post-Purchase Revenue Scanner</div>
</nav>

<div id="hero">
  <div class="eyebrow"><span class="eyebrow-dot"></span>Free AI Report · Indian D2C</div>
  <h1 class="hero-h1">Sales gets customers.<br><em>Post-purchase keeps them.</em></h1>
  <div class="stats-strip">
    <div class="stat"><div class="stat-val">67%</div><div class="stat-lbl">of customers reorder based on post-purchase experience</div></div>
    <div class="stat"><div class="stat-val">5×</div><div class="stat-lbl">cheaper to retain than acquire a new customer</div></div>
    <div class="stat"><div class="stat-val">₹18K Cr</div><div class="stat-lbl">lost annually to RTO &amp; returns across Indian D2C</div></div>
  </div>
  <p class="hero-sub">Most brands spend on ads, not retention. Scan any D2C brand to see exactly how much revenue is leaking — and what ValetPe does to fix it.</p>
  <div class="search-wrap">
    <input class="sinput" id="brand-input" type="text" placeholder="Enter brand e.g. Snitch, Bewakoof…"/>
    <button class="sbtn" id="scan-btn" onclick="startScan()">Scan Brand →</button>
  </div>
  <div class="pills">
    <span class="pill" onclick="qs('Snitch')">Snitch</span>
    <span class="pill" onclick="qs('Bewakoof')">Bewakoof</span>
    <span class="pill" onclick="qs('The Souled Store')">The Souled Store</span>
    <span class="pill" onclick="qs('DaMENSCH')">DaMENSCH</span>
    <span class="pill" onclick="qs('Rare Rabbit')">Rare Rabbit</span>
  </div>
  <div class="err" id="err"></div>
</div>

<div id="loading">
  <div class="spinner"></div>
  <div class="load-brand" id="load-lbl">Scanning brand…</div>
  <div class="load-steps">
    <div class="lstep" id="ls1"><span class="ldot"></span>Searching reviews &amp; complaints</div>
    <div class="lstep" id="ls2"><span class="ldot"></span>Analysing RTO, returns &amp; refund data</div>
    <div class="lstep" id="ls3"><span class="ldot"></span>Benchmarking against competitors</div>
    <div class="lstep" id="ls4"><span class="ldot"></span>Calculating revenue opportunity</div>
  </div>
</div>

<div id="dash">
  <button class="back" onclick="goBack()">← Scan another brand</button>
  <div class="brand-hdr">
    <div><div class="bname" id="d-name"></div><div class="bcat" id="d-cat"></div></div>
    <div class="score-wrap">
      <div class="score-num" id="d-score"></div>
      <div class="score-of">/ 100 post-purchase score</div>
      <div class="score-tag" id="d-tag"></div>
    </div>
  </div>
  <div class="rev-strip">
    <div class="rev-label">Why this matters more than your next ad campaign</div>
    <div class="rev-headline" id="rev-hl"></div>
    <div class="rev-body" id="rev-body"></div>
  </div>
  <div class="kpi-row">
    <div class="kpi"><div class="kpi-val kv-red" id="k-rto"></div><div class="kpi-lbl">RTO rate</div><div class="kpi-note kn-bad" id="k-rto-n"></div></div>
    <div class="kpi"><div class="kpi-val kv-white" id="k-rep"></div><div class="kpi-lbl">Repeat purchase rate</div><div class="kpi-note kn-warn" id="k-rep-n"></div></div>
    <div class="kpi"><div class="kpi-val kv-amber" id="k-ref"></div><div class="kpi-lbl">Avg refund time</div><div class="kpi-note kn-warn" id="k-ref-n"></div></div>
    <div class="kpi"><div class="kpi-val kv-red" id="k-com"></div><div class="kpi-lbl">Monthly PP complaints</div><div class="kpi-note kn-bad" id="k-com-n"></div></div>
  </div>
  <div class="two-col">
    <div class="card"><div class="card-label">What customers say publicly</div><div class="complaints" id="d-complaints"></div></div>
    <div class="card"><div class="card-label">Root causes killing repeat revenue</div><div class="pains" id="d-pains"></div></div>
  </div>
  <div class="full-card"><div class="card-label">Post-purchase score vs competitors</div><div class="bench" id="d-bench"></div></div>
  <div class="vp-box">
    <div class="vp-head">
      <div class="vp-eyebrow">ValetPe fixes this — and turns it into revenue</div>
      <div class="vp-title" id="vp-title"></div>
    </div>
    <div class="vp-solves" id="vp-solves"></div>
    <div class="vp-nums" id="vp-nums"></div>
    <div class="vp-cta">
      <button class="btn-p" onclick="window.open('https://valetpe.com','_blank')">See how ValetPe works →</button>
      <button class="btn-s" onclick="shareRep()">Share this report</button>
    </div>
  </div>
</div>
<footer>AI report using public data &nbsp;·&nbsp; Powered by <strong>ValetPe</strong> &nbsp;·&nbsp; valetpe.com</footer>

<script>
const STEPS=['ls1','ls2','ls3','ls4'];
let tim=null;
function qs(n){document.getElementById('brand-input').value=n;startScan();}
function startScan(){
  const brand=document.getElementById('brand-input').value.trim();
  if(!brand){document.getElementById('brand-input').focus();return;}
  document.getElementById('err').style.display='none';
  document.getElementById('hero').style.display='none';
  document.getElementById('dash').style.display='none';
  document.getElementById('loading').style.display='block';
  document.getElementById('load-lbl').textContent='Scanning '+brand+'…';
  document.getElementById('scan-btn').disabled=true;
  STEPS.forEach(id=>document.getElementById(id).className='lstep');
  let s=0;
  tim=setInterval(()=>{
    if(s>0)document.getElementById(STEPS[s-1]).className='lstep ok';
    if(s<STEPS.length){document.getElementById(STEPS[s]).className='lstep on';s++;}
  },2200);
  fetchReport(brand);
}
async function fetchReport(brand){
  try{
    const res=await fetch('/api/scan',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({brand})
    });
    const data=await res.json();
    clearInterval(tim);
    STEPS.forEach(id=>document.getElementById(id).className='lstep ok');
    if(data.error)throw new Error(data.error);
    setTimeout(()=>{document.getElementById('loading').style.display='none';render(data);},400);
  }catch(e){
    clearInterval(tim);
    document.getElementById('loading').style.display='none';
    document.getElementById('hero').style.display='block';
    document.getElementById('scan-btn').disabled=false;
    const eb=document.getElementById('err');
    eb.textContent=e.message||'Something went wrong. Please try again.';
    eb.style.display='block';
  }
}
function render(r){
  document.getElementById('d-name').textContent=r.brand;
  document.getElementById('d-cat').textContent=r.category+' · India · Generated just now';
  document.getElementById('d-score').textContent=r.pp_score;
  const tag=document.getElementById('d-tag');
  tag.textContent=r.score_verdict;
  tag.className='score-tag '+({'Critical':'t-critical','Needs Attention':'t-attention','Average':'t-attention','Good':'t-good'}[r.score_verdict]||'t-attention');
  document.getElementById('rev-hl').textContent=r.revenue_headline;
  document.getElementById('rev-body').innerHTML=r.revenue_context;
  const k=r.kpis;
  document.getElementById('k-rto').textContent=k.rto_rate;
  document.getElementById('k-rto-n').textContent=k.rto_note;
  document.getElementById('k-rep').textContent=k.repeat_rate;
  document.getElementById('k-rep-n').textContent=k.repeat_note;
  document.getElementById('k-ref').textContent=k.refund_time;
  document.getElementById('k-ref-n').textContent=k.refund_note;
  document.getElementById('k-com').textContent=k.monthly_complaints;
  document.getElementById('k-com-n').textContent=k.complaints_note;
  const vc={high:'ch',medium:'cm',low:'cl'};
  document.getElementById('d-complaints').innerHTML=r.complaints.map(c=>'<div class="ci"><div class="cvol-dot '+(vc[c.volume]||'cm')+'"></div><div><div class="ci-src">'+c.source+'</div><div class="ci-text">'+c.text+'</div></div></div>').join('');
  document.getElementById('d-pains').innerHTML=r.pain_points.map(p=>'<div class="pain"><span class="pain-ic">'+p.icon+'</span><span>'+p.text+'</span></div>').join('');
  document.getElementById('d-bench').innerHTML=r.benchmark.map(b=>{
    const gc={A:'ga',B:'gb',C:'gc',D:'gd'}[b.grade]||'gc';
    const bc=b.score>=70?'#15c0ab':b.score>=50?'#f0a030':'#f04444';
    return'<div class="br"><div class="br-name'+(b.is_you?' you':'')+'"">'+(b.is_you?'→ ':'')+b.brand+'</div><div class="br-bar-bg"><div class="br-bar" style="width:'+b.score+'%;background:'+bc+'"></div></div><div class="br-score">'+b.score+'/100</div><span class="grade '+gc+'">'+b.grade+'</span></div>';
  }).join('');
  const vp=r.valetpe;
  document.getElementById('vp-title').textContent=vp.headline;
  document.getElementById('vp-solves').innerHTML=vp.solves.map(s=>'<div class="solve"><div class="solve-icon">'+s.icon+'</div><div><div class="solve-title">'+s.title+'</div><div class="solve-desc">'+s.desc+'</div><div class="solve-save">'+s.number+'</div></div></div>').join('');
  document.getElementById('vp-nums').innerHTML=vp.numbers.map(n=>'<div class="vpn"><div class="vpn-val">'+n.val+'</div><div class="vpn-lbl">'+n.label+'</div></div>').join('');
  document.getElementById('dash').style.display='block';
  document.getElementById('scan-btn').disabled=false;
  window._report = r;
  window.scrollTo({top:0,behavior:'smooth'});
}
function downloadExcel(){
  const r = window._report;
  if(!r) return;
  const c = r.valetpe.calc || {};
  const monthlyOrders = parseInt(c.monthly_orders_est) || 50000;
  const rtoRate = parseFloat(c.rto_rate_pct)/100 || 0.20;
  const aov = parseFloat(c.avg_order_value) || 800;
  const rtoCost = parseFloat(c.rto_cost_per_order) || 120;
  const repeatCurrent = parseFloat(c.repeat_rate_current)/100 || 0.25;
  const repeatPotential = parseFloat(c.repeat_rate_potential)/100 || 0.40;

  const monthlyRTOs = Math.round(monthlyOrders * rtoRate);
  const annualRTOs = monthlyRTOs * 12;
  const annualRTOCost = Math.round(annualRTOs * rtoCost);
  const annualRevenueLostRTO = Math.round(annualRTOs * aov * 0.15);
  const repeatGap = repeatPotential - repeatCurrent;
  const annualRepeatOpportunity = Math.round(monthlyOrders * 12 * repeatGap * aov * 0.3);
  const totalOpportunity = annualRTOCost + annualRevenueLostRTO + annualRepeatOpportunity;

  const rows = [
    ["ValetPe Post-Purchase Revenue Calculator","",""],
    ["Brand", r.brand, ""],
    ["Report Date", new Date().toLocaleDateString('en-IN'), ""],
    ["","",""],
    ["=== INPUT ASSUMPTIONS ===","",""],
    ["Metric","Value","Source"],
    ["Est. Monthly Orders", monthlyOrders, "Industry estimate"],
    ["Avg Order Value (AOV)", "Rs "+aov, "Industry estimate"],
    ["Current RTO Rate", c.rto_rate_pct+"%", "Research"],
    ["Industry Avg RTO Rate", "10-12%", "Industry benchmark"],
    ["Reverse Logistics Cost per RTO", "Rs "+rtoCost, "Industry estimate"],
    ["Current Repeat Purchase Rate", c.repeat_rate_current+"%", "Research"],
    ["Potential Repeat Rate with ValetPe", c.repeat_rate_potential+"%", "ValetPe benchmark"],
    ["Avg Refund Time (days)", c.refund_time_days, "Research"],
    ["","",""],
    ["=== ANNUAL COST OF POOR POST-PURCHASE ===","",""],
    ["Metric","Amount (Rs)","Notes"],
    ["Monthly RTOs", monthlyRTOs, "Orders x RTO Rate"],
    ["Annual RTOs", annualRTOs, "Monthly RTOs x 12"],
    ["Annual Reverse Logistics Cost", annualRTOCost, "Annual RTOs x Cost per RTO"],
    ["Annual Revenue Lost to RTO", annualRevenueLostRTO, "15% of RTO order value unrecovered"],
    ["Annual Repeat Revenue Opportunity", annualRepeatOpportunity, "Closing repeat rate gap"],
    ["TOTAL ANNUAL OPPORTUNITY", totalOpportunity, "Total recoverable with ValetPe"],
    ["","",""],
    ["=== VALETPE ROI PROJECTION ===","",""],
    ["Metric","Value",""],
    ["RTO Reduction (30%)", Math.round(annualRTOs*0.3)+" orders saved", "ValetPe RTO Intelligence"],
    ["Annual RTO Savings", Math.round(annualRTOCost*0.3), "30% reduction in RTO costs"],
    ["Repeat Rate After ValetPe", c.repeat_rate_potential+"%", "Price Protection + better UX"],
    ["Additional Annual Repeat Revenue", annualRepeatOpportunity, "Gap closed by ValetPe"],
    ["Support Cost Reduction (40%)", "40%", "Automated return flow"],
    ["","",""],
    ["Note: All figures are estimates based on industry benchmarks and public data.","",""],
    ["Actual results may vary. Contact valetpe.com for a detailed assessment.","",""]
  ];

  let csv = rows.map(r => r.map(cell => '"'+String(cell).replace(/"/g,'""')+'"').join(',')).join('
');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = r.brand.replace(/\s+/g,'-')+'-ValetPe-Revenue-Calculator.csv';
  a.click();
  URL.revokeObjectURL(url);
}
function goBack(){
  document.getElementById('dash').style.display='none';
  document.getElementById('hero').style.display='block';
  document.getElementById('brand-input').value='';
  document.getElementById('brand-input').focus();
}
function shareRep(){
  const brand=document.getElementById('d-name').textContent;
  if(navigator.share)navigator.share({title:brand+' post-purchase report · ValetPe',url:window.location.href});
  else{navigator.clipboard.writeText(window.location.href);alert('Link copied!');}
}
document.getElementById('brand-input').addEventListener('keydown',e=>{if(e.key==='Enter')startScan();});
</script>
</body>
</html>`;

// ── API PROMPT BUILDER ─────────────────────────────────────────────────────
function buildPrompt(brand) {
  return `You are a D2C revenue analyst for Indian brands. Research "${brand}" using web search.

IMPORTANT RULES FOR NUMBERS:
- All revenue/loss figures must be ANNUAL (per year), not per month. Be consistent everywhere.
- Keep numbers realistic and conservative. For a mid-size D2C brand doing 100-500 Cr revenue, annual post-purchase revenue loss should be 50L-2Cr, NOT 14Cr or higher.
- RTO rate for Indian D2C is typically 15-30% for fashion. Do not exaggerate.
- Repeat purchase rate for D2C fashion is typically 20-35%.
- Refund time is typically 7-15 days.

Return ONLY a raw JSON object. Start with { and end with }. No text before or after. No markdown.

{
  "brand": "${brand}",
  "category": "<e.g. Men's Fashion>",
  "pp_score": <realistic 0-100>,
  "score_verdict": "<Critical / Needs Attention / Average / Good>",
  "revenue_headline": "<e.g. '${brand} loses est. ₹X Cr annually from poor post-purchase experience'>",
  "revenue_context": "<2 sentences. Use ANNUAL figures only. Frame as revenue and repeat purchase loss, not support cost.>",
  "kpis": {
    "rto_rate": "<e.g. 18-22%>",
    "rto_note": "<e.g. Industry avg 10-12%>",
    "repeat_rate": "<e.g. 25-30%>",
    "repeat_note": "<e.g. Could reach 40% with better PP>",
    "refund_time": "<e.g. 10-15 days>",
    "refund_note": "<e.g. Industry best is 5-7 days>",
    "monthly_complaints": "<realistic number e.g. 800-1200>",
    "complaints_note": "<e.g. 65% return or RTO related>"
  },
  "complaints": [
    {"source": "Reddit", "volume": "high", "text": "<real specific complaint>"},
    {"source": "Twitter/X", "volume": "high", "text": "<real specific complaint>"},
    {"source": "Google Reviews", "volume": "medium", "text": "<real specific complaint>"},
    {"source": "Quora/Forums", "volume": "low", "text": "<real specific complaint>"}
  ],
  "pain_points": [
    {"icon": "📦", "text": "<RTO pain with realistic annual ₹ cost>"},
    {"icon": "🔄", "text": "<returns pain with annual revenue angle>"},
    {"icon": "💸", "text": "<refund delay causing churn - annual LTV impact>"},
    {"icon": "🔕", "text": "<post-purchase silence eroding repeat purchase rate>"}
  ],
  "benchmark": [
    {"brand": "${brand}", "score": <0-100>, "grade": "<A/B/C/D>", "is_you": true},
    {"brand": "<real competitor 1>", "score": <0-100>, "grade": "<A/B/C/D>", "is_you": false},
    {"brand": "<real competitor 2>", "score": <0-100>, "grade": "<A/B/C/D>", "is_you": false},
    {"brand": "<real competitor 3>", "score": <0-100>, "grade": "<A/B/C/D>", "is_you": false}
  ],
  "valetpe": {
    "headline": "<e.g. '${brand} can recover ₹X Cr annually — here is ValetPe's exact fix'>",
    "solves": [
      {
        "icon": "🧠",
        "title": "RTO and Refund Intelligence — stop the revenue bleed",
        "desc": "<specific: est. X% of RTOs are flagged addresses or repeat returners. ValetPe scores every order pre-dispatch reducing RTO by up to 30%>",
        "number": "<e.g. Saves ₹40-80L annually in RTO and reverse logistics>"
      },
      {
        "icon": "🏷️",
        "title": "Price Protection — turn every discount into the next order",
        "desc": "<specific: when ${brand} runs sales, full-price buyers feel cheated. ValetPe auto-credits difference to brand wallet converting churn into repeat order>",
        "number": "<e.g. Drives 2.2x repeat purchase rate>"
      },
      {
        "icon": "⚡",
        "title": "Automated Return Flow — build trust at the hardest moment",
        "desc": "<specific: automates triage, pickup scheduling and status updates cutting support cost 40% and turning frustration into brand loyalty>",
        "number": "<e.g. 40% drop in support tickets annually>"
      }
    ],
    "numbers": [
      {"val": "<e.g. ₹1.2Cr>", "label": "Est. annual revenue lost to RTO and poor post-purchase"},
      {"val": "<e.g. 2.2x>", "label": "Repeat purchase lift with price protection active"},
      {"val": "<e.g. 40%>", "label": "Reduction in support costs with automated returns"}
    ],
    "calc": {
      "annual_revenue_est": "<brand annual revenue in Cr e.g. 150>",
      "rto_rate_pct": "<number only e.g. 20>",
      "avg_order_value": "<AOV in rupees e.g. 850>",
      "monthly_orders_est": "<estimated monthly orders e.g. 50000>",
      "rto_cost_per_order": "<reverse logistics cost per RTO in rupees e.g. 120>",
      "repeat_rate_current": "<number only e.g. 25>",
      "repeat_rate_potential": "<number only e.g. 40>",
      "refund_time_days": "<number only e.g. 12>"
    }
  }
}

Replace ALL placeholders with real researched data about ${brand}. Use conservative, realistic numbers. Annual figures throughout. Return only the JSON.`;
}


// ── HTTP SERVER ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // Serve frontend
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
    return;
  }

  // API endpoint
  if (req.method === 'POST' && req.url === '/api/scan') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { brand } = JSON.parse(body);
        if (!brand) { res.writeHead(400); res.end(JSON.stringify({ error: 'Brand required' })); return; }
        if (!API_KEY) { res.writeHead(500); res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in Replit Secrets' })); return; }

        const payload = JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: buildPrompt(brand) }]
        });

        const options = {
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(payload)
          }
        };

        const apiReq = https.request(options, apiRes => {
          let data = '';
          apiRes.on('data', chunk => data += chunk);
          apiRes.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) { res.writeHead(400); res.end(JSON.stringify({ error: parsed.error.message })); return; }

              let jsonStr = '';
              for (const block of parsed.content) {
                if (block.type === 'text') { jsonStr = block.text; break; }
              }
              // Strip markdown fences
              jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              // Extract just the JSON object even if AI added surrounding text
              const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
              if (!jsonMatch) {
                throw new Error('AI returned text instead of JSON: ' + jsonStr.substring(0, 120));
              }
              jsonStr = jsonMatch[0];
              const report = JSON.parse(jsonStr);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(report));
            } catch (e) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: 'Failed to parse response: ' + e.message }));
            }
          });
        });

        apiReq.on('error', e => { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); });
        apiReq.write(payload);
        apiReq.end();

      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`ValetPe Brand Scanner running on port ${PORT}`);
  console.log(`API Key configured: ${API_KEY ? 'YES ✓' : 'NO — add ANTHROPIC_API_KEY to Replit Secrets'}`);
});
