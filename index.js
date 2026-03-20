const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3000;
const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

var KNOWN_SCORES = {
  'snitch': 42, 'bewakoof': 35, 'the souled store': 55, 'souled store': 55,
  'rare rabbit': 60, 'the bear house': 58, 'bear house': 58,
  'damensch': 65, 'xyxx': 68, 'urbanic': 45,
  'minimalist': 72, 'plum': 70, 'mcaffeine': 68, 'dot and key': 66,
  'boat': 52, 'noise': 50
};

function gradeFromScore(s) {
  return s >= 70 ? 'A' : s >= 55 ? 'B' : s >= 40 ? 'C' : 'D';
}

function verdictFromScore(s) {
  return s >= 70 ? 'Good' : s >= 50 ? 'Average' : s >= 30 ? 'Needs Attention' : 'Critical';
}

function buildPrompt(brand) {
  var knownScore = KNOWN_SCORES[brand.toLowerCase()];
  var scoreRule = knownScore
    ? 'pp_score MUST be exactly ' + knownScore + '.'
    : 'Calculate pp_score: Start 100. Deduct 20 if RTO above 20%, 10 if 15-20%. Deduct 15 if refund time above 15 days, 8 if 10-15 days. Deduct 10 if repeat rate below 20%, 5 if 20-30%. Deduct 8 for high complaint volume. Deduct 5 for poor return portal.';

  return [
    'You are a post-purchase revenue strategist. Research "' + brand + '" using web search.',
    '',
    'SCORE: ' + scoreRule,
    'VERDICT: 70+= Good, 50-69= Average, 30-49= Needs Attention, 0-29= Critical',
    '',
    'BENCHMARK scores (use exactly, do not change):',
    'Snitch=42, Bewakoof=35, The Souled Store=55, Rare Rabbit=60, The Bear House=58',
    'DaMENSCH=65, XYXX=68, Urbanic=45, Minimalist=72, Plum=70, mCaffeine=68',
    'Pick 3 relevant competitors for ' + brand + ' from this list only.',
    '',
    'DO NOT include any rupee revenue estimates — the frontend calculates those.',
    'DO NOT list online reviews or social media complaints.',
    'Focus on STRATEGIC INSIGHTS — what is the root cause, what to fix, what it unlocks.',
    '',
    'Return ONLY valid JSON starting { ending }. No markdown.',
    '',
    '{',
    '  "brand": "' + brand + '",',
    '  "category": "<e.g. Mens Fashion>",',
    '  "pp_score": <score>,',
    '  "score_verdict": "<Critical/Needs Attention/Average/Good>",',
    '  "revenue_context": "<2 sentences. Strategic framing of the post-purchase problem. No rupee figures. Focus on customer trust, repeat purchase, and sustainable D2C growth.>",',
    '  "kpis": {',
    '    "rto_rate": "<e.g. 18-22%>",',
    '    "rto_rate_num": <numeric e.g. 20>,',
    '    "rto_note": "Industry avg 10-12%",',
    '    "repeat_rate": "<e.g. 22%>",',
    '    "repeat_rate_num": <numeric e.g. 22>,',
    '    "repeat_note": "<Could reach 38% with better PP>",',
    '    "refund_time": "<e.g. 12-15 days>",',
    '    "refund_note": "Industry best 5-7 days",',
    '    "monthly_complaints": "<e.g. 800-1200>",',
    '    "complaints_note": "<what most are about>"',
    '  },',
    '  "priority_actions": [',
    '    {',
    '      "title": "<most impactful thing to fix — e.g. Reduce RTO rate from 22% to under 15%>",',
    '      "desc": "<why this matters strategically for brand growth — 1-2 sentences, no rupee figures>",',
    '      "revenue_impact": "<qualitative e.g. Biggest single lever for margin improvement>"',
    '    },',
    '    {',
    '      "title": "<second priority — e.g. Automate the return process>",',
    '      "desc": "<why this is critical for repeat purchase and brand trust>",',
    '      "revenue_impact": "<qualitative impact>"',
    '    },',
    '    {',
    '      "title": "<third priority — e.g. Implement price protection>",',
    '      "desc": "<why this builds long-term customer loyalty>",',
    '      "revenue_impact": "<qualitative impact>"',
    '    },',
    '    {',
    '      "title": "<fourth priority — e.g. Proactive post-purchase communication>",',
    '      "desc": "<why silent post-purchase kills repeat intent>",',
    '      "revenue_impact": "<qualitative impact>"',
    '    }',
    '  ],',
    '  "benchmark": [',
    '    {"brand": "' + brand + '", "score": <same as pp_score>, "grade": "<from score>", "is_you": true},',
    '    {"brand": "<competitor 1>", "score": <from reference>, "grade": "<from score>", "is_you": false},',
    '    {"brand": "<competitor 2>", "score": <from reference>, "grade": "<from score>", "is_you": false},',
    '    {"brand": "<competitor 3>", "score": <from reference>, "grade": "<from score>", "is_you": false}',
    '  ],',
    '  "valetpe": {',
    '    "solves": [',
    '      {',
    '        "icon": "🧠",',
    '        "title": "RTO and Refund Intelligence",',
    '        "desc": "<specific description of how ValetPe\'s RMS works for ' + brand + '>",',
    '        "before": "<what happens today without ValetPe — 1 line, no numbers>",',
    '        "after": "<what happens with ValetPe — 1 line, no numbers>"',
    '      },',
    '      {',
    '        "icon": "🏷️",',
    '        "title": "Price Protection",',
    '        "desc": "<specific description of how price protection works for ' + brand + '>",',
    '        "before": "<what happens today>",',
    '        "after": "<what happens with ValetPe>"',
    '      },',
    '      {',
    '        "icon": "⚡",',
    '        "title": "Automated Return Flow",',
    '        "desc": "<specific description of automated returns for ' + brand + '>",',
    '        "before": "<what happens today>",',
    '        "after": "<what happens with ValetPe>"',
    '      }',
    '    ]',
    '  }',
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
        if (!brand) { res.writeHead(400); res.end(JSON.stringify({ error: 'Brand required' })); return; }
        if (!API_KEY) { res.writeHead(500); res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in Environment Variables' })); return; }

        var payload = JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: buildPrompt(brand) }]
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

              var report = JSON.parse(match[0]);

              // SERVER-SIDE ENFORCEMENT
              var knownScore = KNOWN_SCORES[brand.toLowerCase()];
              if (knownScore) report.pp_score = knownScore;
              report.score_verdict = verdictFromScore(report.pp_score);
              if (report.benchmark && Array.isArray(report.benchmark)) {
                report.benchmark.forEach(function(b) {
                  if (b.is_you) { b.score = report.pp_score; }
                  else { var ks = KNOWN_SCORES[b.brand.toLowerCase()]; if (ks) b.score = ks; }
                  b.grade = gradeFromScore(b.score);
                });
              }
              if (!report.kpis.rto_rate_num) report.kpis.rto_rate_num = 20;
              if (!report.kpis.repeat_rate_num) report.kpis.repeat_rate_num = 25;

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(report));
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
