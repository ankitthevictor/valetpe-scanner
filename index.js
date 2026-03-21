const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3000;
const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

var SCORES = {
  'snitch.com':42,'bewakoof.com':35,'thesouledstore.com':55,
  'rarerabbit.in':60,'thebearhouse.in':58,'damensch.com':65,
  'xyxx.in':68,'urbanic.com':45,'minimalist.com':72,
  'plumgoodness.com':70,'mcaffeine.com':68,'dotandkey.com':66
};

function grade(s){return s>=70?'A':s>=55?'B':s>=40?'C':'D';}
function verdict(s){return s>=70?'Good':s>=50?'Average':s>=30?'Needs Attention':'Critical';}
function cleanUrl(u){return u.replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*$/,'').trim().toLowerCase();}

function buildPrompt(url,ig){
  var domain=cleanUrl(url);
  var ks=SCORES[domain];
  var scoreRule=ks
    ?'pp_score MUST be exactly '+ks+'.'
    :'Calculate pp_score: Start 100. Deduct 20 if RTO above 20%, 10 if 15-20%. Deduct 15 if refund above 15 days, 8 if 10-15 days. Deduct 10 if repeat rate below 20%, 5 if 20-30%. Deduct 8 for high complaints.';
  var igLine=ig
    ?'Instagram: Search "'+ig+' comments returns refund delivery" for real comment patterns on their posts.'
    :'Instagram: Search "'+domain+' instagram comments complaints returns" for public comment patterns.';

  return [
    'Research the D2C brand at "'+url+'" using web search.',
    'First identify the brand name and category from the website.',
    'Then find real customer complaints from Reddit, Twitter/X, Google Reviews, consumer forums, and Instagram.',
    '',
    igLine,
    '',
    'SCORE: '+scoreRule,
    'VERDICT: 70+=Good, 50-69=Average, 30-49=Needs Attention, 0-29=Critical',
    '',
    'RULES:',
    '- No rupee figures anywhere in the JSON',
    '- signals: ONE sharp line per source — real pattern, source name short',
    '- problems: exactly 2, specific to this brand, no solutions',
    '- Keep everything SHORT — this renders as a small card image',
    '',
    'Return ONLY valid JSON starting { ending }. No markdown.',
    '',
    '{',
    '  "brand": "<brand name>",',
    '  "category": "<e.g. Mens Fast Fashion>",',
    '  "pp_score": <score>,',
    '  "score_verdict": "<Critical/Needs Attention/Average/Good>",',
    '  "kpis": {',
    '    "rto_rate_num": <numeric e.g. 20>,',
    '    "repeat_rate_num": <numeric e.g. 22>',
    '  },',
    '  "signals": [',
    '    {"source": "Reddit", "signal": "<one sharp line — real pattern>"},',
    '    {"source": "Instagram", "signal": "<one sharp line — real comment pattern>"},',
    '    {"source": "Google", "signal": "<star rating + what drags it>"},',
    '    {"source": "Twitter", "signal": "<dominant complaint — one line>"},',
    '    {"source": "Forums", "signal": "<PissedConsumer/Quora — one line>"}',
    '  ],',
    '  "problems": [',
    '    {"title": "<problem #1 with specific data e.g. RTO at 22% vs industry 10-12%>", "desc": "<why this costs — 1 line, no rupees>"},',
    '    {"title": "<problem #2 specific>", "desc": "<why this hurts — 1 line>"}',
    '  ]',
    '}'
  ].join('\n');
}

const server=http.createServer(function(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS'){res.writeHead(200);res.end();return;}

  if(req.method==='GET'&&(req.url==='/'||req.url==='/index.html')){
    res.writeHead(200,{'Content-Type':'text/html'});
    res.end(HTML);
    return;
  }

  if(req.method==='POST'&&req.url==='/api/scan'){
    var body='';
    req.on('data',function(c){body+=c;});
    req.on('end',function(){
      try{
        var p=JSON.parse(body);
        var url=p.url,ig=p.ig||'';
        if(!url){res.writeHead(400);res.end(JSON.stringify({error:'Brand URL required'}));return;}
        if(!API_KEY){res.writeHead(500);res.end(JSON.stringify({error:'ANTHROPIC_API_KEY not set'}));return;}

        var payload=JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:1500,
          tools:[{type:'web_search_20250305',name:'web_search'}],
          messages:[{role:'user',content:buildPrompt(url,ig)}]
        });

        var opts={
          hostname:'api.anthropic.com',path:'/v1/messages',method:'POST',
          headers:{'Content-Type':'application/json','x-api-key':API_KEY,'anthropic-version':'2023-06-01','Content-Length':Buffer.byteLength(payload)}
        };

        var apiReq=https.request(opts,function(apiRes){
          var data='';
          apiRes.on('data',function(c){data+=c;});
          apiRes.on('end',function(){
            try{
              var result=JSON.parse(data);
              if(result.error){res.writeHead(400);res.end(JSON.stringify({error:result.error.message}));return;}
              var jsonStr='';
              for(var i=0;i<result.content.length;i++){if(result.content[i].type==='text'){jsonStr=result.content[i].text;break;}}
              jsonStr=jsonStr.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
              var match=jsonStr.match(/\{[\s\S]*\}/);
              if(!match){res.writeHead(500);res.end(JSON.stringify({error:'No JSON found'}));return;}
              var r=JSON.parse(match[0]);

              // Enforce scores
              var domain=cleanUrl(url);
              var ks=SCORES[domain];
              if(ks)r.pp_score=ks;
              r.score_verdict=verdict(r.pp_score);
              if(!r.kpis)r.kpis={};
              if(!r.kpis.rto_rate_num)r.kpis.rto_rate_num=20;
              if(!r.kpis.repeat_rate_num)r.kpis.repeat_rate_num=25;

              res.writeHead(200,{'Content-Type':'application/json'});
              res.end(JSON.stringify(r));
            }catch(e){res.writeHead(500);res.end(JSON.stringify({error:'Parse error: '+e.message}));}
          });
        });
        apiReq.on('error',function(e){res.writeHead(500);res.end(JSON.stringify({error:e.message}));});
        apiReq.write(payload);apiReq.end();
      }catch(e){res.writeHead(500);res.end(JSON.stringify({error:e.message}));}
    });
    return;
  }
  res.writeHead(404);res.end('Not found');
});

server.listen(PORT,function(){
  console.log('ValetPe running on port '+PORT);
  console.log('API Key: '+(API_KEY?'SET':'NOT SET'));
});
