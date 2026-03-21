const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3000;
const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

var SCORES = {
  'snitch':42,'bewakoof':35,'the souled store':55,'souled store':55,
  'rare rabbit':60,'the bear house':58,'bear house':58,
  'damensch':65,'xyxx':68,'urbanic':45,
  'minimalist':72,'plum':70,'mcaffeine':68,'dot and key':66,
  'boat':52,'noise':50
};

function grade(s){return s>=70?'A':s>=55?'B':s>=40?'C':'D';}
function verdict(s){return s>=70?'Good':s>=50?'Average':s>=30?'Needs Attention':'Critical';}

function buildPrompt(brand, ig) {
  var ks = SCORES[brand.toLowerCase()];
  var scoreRule = ks
    ? 'pp_score MUST be exactly ' + ks
    : 'Calculate pp_score: Start 100. Deduct 20 if RTO above 20%, 10 if 15-20%. Deduct 15 if refund above 15 days, 8 if 10-15 days. Deduct 10 if repeat below 20%, 5 if 20-30%. Deduct 8 for high complaints. Deduct 5 for poor return portal.';

  var igInstruction = ig
    ? 'For Instagram source "' + ig + '": Search for "' + ig + ' instagram comments returns refund" and "' + brand + ' instagram complaints". Analyse comment patterns on their posts about orders, returns, delivery. Report the dominant sentiment pattern found.'
    : 'For Instagram source: Search "' + brand + ' instagram comments returns refund complaints" to find patterns from their Instagram posts discussed publicly.';

  return [
    'You are a post-purchase revenue analyst. Research "' + brand + '" using web search.',
    'Search Reddit, Twitter/X, Google Reviews, consumer forums, AND Instagram.',
    '',
    igInstruction,
    '',
    'SCORE: ' + scoreRule,
    'VERDICT: 70+=Good, 50-69=Average, 30-49=Needs Attention, 0-29=Critical',
    '',
    'BENCHMARK scores (fixed — do not change):',
    'Snitch=42, Bewakoof=35, The Souled Store=55, Rare Rabbit=60, The Bear House=58, DaMENSCH=65, XYXX=68, Urbanic=45, Minimalist=72, Plum=70, mCaffeine=68',
    'Pick 3 most relevant competitors for ' + brand + ' from this list only.',
    '',
    'RULES: No rupee figures anywhere. Keep all text SHORT — max 2 lines per field. Be sharp and specific.',
    '',
    'Return ONLY valid JSON starting { ending }. No markdown. No text outside JSON.',
    '',
    '{',
    '  "brand": "' + brand + '",',
    '  "category": "<e.g. Mens Fast Fashion>",',
    '  "pp_score": <score>,',
    '  "score_verdict": "<Critical/Needs Attention/Average/Good>",',
    '  "one_liner": "<1 sharp sentence — the core PP problem for this brand. No rupee figures.>",',
    '  "kpis": {',
    '    "rto_rate": "<e.g. 20-25%>",',
    '    "rto_rate_num": <numeric e.g. 22>,',
    '    "repeat_rate": "<e.g. 22%>",',
    '    "repeat_rate_num": <numeric e.g. 22>',
    '  },',
    '  "signals": [',
    '    {"source": "Reddit", "volume": "high", "signal": "<sharp 1-2 line pattern — what % of posts say what>", "data_note": "<subreddit names + volume e.g. r/IndianFashionAddicts — 300+ posts>"},',
    '    {"source": "Twitter / X", "volume": "high", "signal": "<dominant complaint pattern with context>", "data_note": "<volume and context>"},',
    '    {"source": "Google Reviews", "volume": "medium", "signal": "<rating + what drags it down>", "data_note": "<total reviews analysed>"},',
    '    {"source": "Instagram", "volume": "medium", "signal": "<comment pattern found on their posts — what customers complain about in comments>", "data_note": "<e.g. ' + (ig||brand) + ' posts — comment patterns analysed>"},',
    '    {"source": "Consumer Forums", "volume": "low", "signal": "<PissedConsumer/Quora pattern>", "data_note": "<platform names + volume>"}',
    '  ],',
    '  "priorities": [',
    '    {"title": "<specific fix #1>", "desc": "<why — 1 line, no rupees>", "impact": "<qualitative e.g. Biggest margin lever>"},',
    '    {"title": "<specific fix #2>", "desc": "<why>", "impact": "<qualitative>"},',
    '    {"title": "<specific fix #3>", "desc": "<why>", "impact": "<qualitative>"},',
    '    {"title": "<specific fix #4>", "desc": "<why>", "impact": "<qualitative>"}',
    '  ],',
    '  "benchmark": [',
    '    {"brand": "' + brand + '", "score": <same as pp_score>, "grade": "<A/B/C/D>", "is_you": true},',
    '    {"brand": "<competitor 1>", "score": <from fixed list>, "grade": "<derived>", "is_you": false},',
    '    {"brand": "<competitor 2>", "score": <from fixed list>, "grade": "<derived>", "is_you": false},',
    '    {"brand": "<competitor 3>", "score": <from fixed list>, "grade": "<derived>", "is_you": false}',
    '  ],',
    '  "solves": [',
    '    {"icon": "🧠", "title": "RTO Intelligence", "before": "<1 line — problem today>", "after": "<1 line — with ValetPe>"},',
    '    {"icon": "🏷️", "title": "Price Protection", "before": "<1 line>", "after": "<1 line>"},',
    '    {"icon": "⚡", "title": "Smart Returns", "before": "<1 line>", "after": "<1 line>"}',
    '  ]',
    '}'
  ].join('\n');
}

const server = http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
    return;
  }

  if (req.method === 'POST' && req.url === '/api/scan') {
    var body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
      try {
        var parsed = JSON.parse(body);
        var brand = parsed.brand;
        var ig = parsed.ig || '';
        if (!brand) { res.writeHead(400); res.end(JSON.stringify({ error: 'Brand required' })); return; }
        if (!API_KEY) { res.writeHead(500); res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' })); return; }

        var payload = JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2500,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: buildPrompt(brand, ig) }]
        });

        var options = {
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

        var apiReq = https.request(options, function(apiRes) {
          var data = '';
          apiRes.on('data', function(chunk) { data += chunk; });
          apiRes.on('end', function() {
            try {
              var result = JSON.parse(data);
              if (result.error) { res.writeHead(400); res.end(JSON.stringify({ error: result.error.message })); return; }
              var jsonStr = '';
              for (var i = 0; i < result.content.length; i++) {
                if (result.content[i].type === 'text') { jsonStr = result.content[i].text; break; }
              }
              jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              var match = jsonStr.match(/\{[\s\S]*\}/);
              if (!match) { res.writeHead(500); res.end(JSON.stringify({ error: 'No JSON found: ' + jsonStr.substring(0, 100) })); return; }

              var r = JSON.parse(match[0]);

              // Server-side enforcement
              var ks = SCORES[brand.toLowerCase()];
              if (ks) r.pp_score = ks;
              r.score_verdict = verdict(r.pp_score);
              if (r.benchmark && Array.isArray(r.benchmark)) {
                r.benchmark.forEach(function(b) {
                  if (b.is_you) { b.score = r.pp_score; }
                  else { var bs = SCORES[b.brand.toLowerCase()]; if (bs) b.score = bs; }
                  b.grade = grade(b.score);
                });
              }
              if (!r.kpis) r.kpis = {};
              if (!r.kpis.rto_rate_num) r.kpis.rto_rate_num = 20;
              if (!r.kpis.repeat_rate_num) r.kpis.repeat_rate_num = 25;

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(r));
            } catch(e) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: 'Parse error: ' + e.message }));
            }
          });
        });

        apiReq.on('error', function(e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); });
        apiReq.write(payload);
        apiReq.end();
      } catch(e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, function() {
  console.log('ValetPe running on port ' + PORT);
  console.log('API Key: ' + (API_KEY ? 'SET' : 'NOT SET'));
});
