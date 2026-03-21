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
  'plumgoodness.com':70,'mcaffeine.com':68,'dotandkey.com':66,
  'boult.com':52,'gonoise.com':50
};

function grade(s){return s>=70?'A':s>=55?'B':s>=40?'C':'D';}
function verdict(s){return s>=70?'Good':s>=50?'Average':s>=30?'Needs Attention':'Critical';}

function cleanUrl(u){
  return u.replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*$/,'').trim();
}

function buildPrompt(url,ig){
  var domain=cleanUrl(url);
  var ks=SCORES[domain];
  var scoreRule=ks
    ?'pp_score MUST be exactly '+ks
    :'Calculate pp_score: Start 100. Deduct 20 if RTO above 20%, 10 if 15-20%. Deduct 15 if refund above 15 days, 8 if 10-15 days. Deduct 10 if repeat below 20%, 5 if 20-30%. Deduct 8 for high complaint volume. Deduct 5 for poor return process.';

  var igLine=ig
    ?'Instagram '+ig+': Search "'+ig+' comments returns refund" to find comment patterns on their posts.'
    :'Instagram: Search "'+domain+' instagram comments returns refund" for public comment patterns.';

  return [
    'You are a post-purchase analyst. Research the D2C brand at "'+url+'" using web search.',
    'First visit or search the website to identify: brand name, product category, and Indian D2C presence.',
    'Then search for customer complaints on Reddit, Twitter/X, Google Reviews, consumer forums, AND Instagram.',
    '',
    igLine,
    '',
    'SCORE: '+scoreRule,
    'VERDICT: 70+=Good, 50-69=Average, 30-49=Needs Attention, 0-29=Critical',
    '',
    'BENCHMARK: Use these fixed scores for competitors (do not change them):',
    'Snitch=42, Bewakoof=35, The Souled Store=55, Rare Rabbit=60, The Bear House=58, DaMENSCH=65, XYXX=68, Urbanic=45, Minimalist=72, Plum=70',
    'Pick 3-4 most relevant competitors from this list. If brand is unknown pick closest category match.',
    '',
    'CRITICAL RULES:',
    '- No rupee revenue estimates anywhere in the JSON — frontend calculates those',
    '- Keep all text SHARP and SHORT — max 2 lines per field',
    '- signals must show REAL patterns found, not generic statements',
    '- problems must be SPECIFIC to this brand with real data points',
    '',
    'Return ONLY valid JSON starting { ending }. No markdown. No text outside JSON.',
    '',
    '{',
    '  "brand": "<brand name found from website>",',
    '  "category": "<e.g. Mens Fast Fashion>",',
    '  "pp_score": <calculated score>,',
    '  "score_verdict": "<Critical/Needs Attention/Average/Good>",',
    '  "kpis": {',
    '    "rto_rate_num": <numeric RTO rate e.g. 20>,',
    '    "repeat_rate_num": <numeric repeat rate e.g. 22>',
    '  },',
    '  "signals": [',
    '    {"source": "Reddit", "signal": "<sharp 1 line — real pattern found, what % say what>"},',
    '    {"source": "Instagram", "signal": "<real comment pattern found on their posts>"},',
    '    {"source": "Google", "signal": "<star rating + what drags it — 1 line>"},',
    '    {"source": "Twitter", "signal": "<dominant complaint pattern — 1 line>"},',
    '    {"source": "Forums", "signal": "<PissedConsumer/Quora pattern — 1 line>"}',
    '  ],',
    '  "problems": [',
    '    {"title": "<specific problem #1 with data e.g. RTO rate at 22% vs industry avg 10-12%>", "desc": "<why this costs money — 1-2 lines, specific, no rupee figures>"},',
    '    {"title": "<specific problem #2>", "desc": "<why this hurts growth — 1-2 lines>"}',
    '  ],',
    '  "benchmark": [',
    '    {"brand": "<brand name>", "score": <same as pp_score>, "is_you": true},',
    '    {"brand": "<competitor 1>", "score": <from fixed list>, "is_you": false},',
    '    {"brand": "<competitor 2>", "score": <from fixed list>, "is_you": false},',
    '    {"brand": "<competitor 3>", "score": <from fixed list>, "is_you": false}',
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
    req.on('data',function(chunk){body+=chunk;});
    req.on('end',function(){
      try{
        var parsed=JSON.parse(body);
        var url=parsed.url;
        var ig=parsed.ig||'';
        if(!url){res.writeHead(400);res.end(JSON.stringify({error:'Brand URL required'}));return;}
        if(!API_KEY){res.writeHead(500);res.end(JSON.stringify({error:'ANTHROPIC_API_KEY not set in Environment Variables'}));return;}

        var payload=JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:2000,
          tools:[{type:'web_search_20250305',name:'web_search'}],
          messages:[{role:'user',content:buildPrompt(url,ig)}]
        });

        var options={
          hostname:'api.anthropic.com',
          path:'/v1/messages',
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            'x-api-key':API_KEY,
            'anthropic-version':'2023-06-01',
            'Content-Length':Buffer.byteLength(payload)
          }
        };

        var apiReq=https.request(options,function(apiRes){
          var data='';
          apiRes.on('data',function(chunk){data+=chunk;});
          apiRes.on('end',function(){
            try{
              var result=JSON.parse(data);
              if(result.error){res.writeHead(400);res.end(JSON.stringify({error:result.error.message}));return;}
              var jsonStr='';
              for(var i=0;i<result.content.length;i++){
                if(result.content[i].type==='text'){jsonStr=result.content[i].text;break;}
              }
              jsonStr=jsonStr.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
              var match=jsonStr.match(/\{[\s\S]*\}/);
              if(!match){res.writeHead(500);res.end(JSON.stringify({error:'No JSON found: '+jsonStr.substring(0,100)}));return;}

              var r=JSON.parse(match[0]);

              // Enforce known scores
              var domain=url.replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*$/,'').trim();
              var ks=SCORES[domain];
              if(ks)r.pp_score=ks;
              r.score_verdict=verdict(r.pp_score);

              // Fix benchmark scores
              if(r.benchmark&&Array.isArray(r.benchmark)){
                r.benchmark.forEach(function(b){
                  if(b.is_you){b.score=r.pp_score;}
                  else{
                    var bDomain=Object.keys(SCORES).find(function(k){
                      return k.indexOf(b.brand.toLowerCase().replace(/\s+/g,''))>-1||
                             b.brand.toLowerCase().indexOf(k.replace(/\.[a-z]+$/,''))>-1;
                    });
                    if(bDomain)b.score=SCORES[bDomain];
                  }
                });
              }

              // Defaults
              if(!r.kpis)r.kpis={};
              if(!r.kpis.rto_rate_num)r.kpis.rto_rate_num=20;
              if(!r.kpis.repeat_rate_num)r.kpis.repeat_rate_num=25;

              res.writeHead(200,{'Content-Type':'application/json'});
              res.end(JSON.stringify(r));
            }catch(e){
              res.writeHead(500);
              res.end(JSON.stringify({error:'Parse error: '+e.message}));
            }
          });
        });

        apiReq.on('error',function(e){res.writeHead(500);res.end(JSON.stringify({error:e.message}));});
        apiReq.write(payload);
        apiReq.end();
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
