const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3000;
const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Fixed reference scores for known brands - NEVER changes between reports
var KNOWN_SCORES = {
  'snitch': 42, 'bewakoof': 35, 'the souled store': 55, 'souled store': 55,
  'rare rabbit': 60, 'the bear house': 58, 'bear house': 58,
  'damensch': 65, 'xyxx': 68, 'urbanic': 45,
  'minimalist': 72, 'plum': 70, 'mcaffeine': 68, 'dot and key': 66,
  'boat': 52, 'noise': 50, 'fastrack': 55
};

function gradeFromScore(score) {
  if (score >= 70) return 'A';
  if (score >= 55) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

function verdictFromScore(score) {
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Average';
  if (score >= 30) return 'Needs Attention';
  return 'Critical';
}

function buildPrompt(brand) {
  var knownScore = KNOWN_SCORES[brand.toLowerCase()];
  var scoreInstruction = knownScore
    ? 'The pp_score for ' + brand + ' MUST be exactly ' + knownScore + '. Do not change this.'
    : 'Calculate pp_score using this method: Start at 100. Deduct 20pts if RTO above 20%, 10pts if 15-20%. Deduct 15pts if refund time above 15 days, 8pts if 10-15 days. Deduct 10pts if repeat rate below 20%, 5pts if 20-30%. Deduct 8pts for high complaint volume. Deduct 5pts for poor return portal.';

  return [
    'You are a D2C post-purchase analyst. Research "' + brand + '" using web search.',
    'Find real customer complaints from Reddit, Twitter, Google Reviews, Quora about returns, RTO, refunds.',
    '',
    'SCORE: ' + scoreInstruction,
    '',
    'BENCHMARK: Use only these scores for competitors (do not change them):',
    'Snitch=42, Bewakoof=35, The Souled Store=55, Rare Rabbit=60, The Bear House=58, DaMENSCH=65, XYXX=68, Urbanic=45, Minimalist=72, Plum=70, mCaffeine=68',
    'Pick 3 relevant competitors for ' + brand + ' from this list only.',
    '',
    'IMPORTANT: Do NOT include any revenue or loss figures in rupees. The frontend calculates those.',
    'Do NOT say things like "loses X Cr" — just describe the qualitative problem.',
    '',
    'Return ONLY valid JSON starting with { and ending with }. No markdown. No text outside JSON.',
    '',
    '{',
    '  "brand": "' + brand + '",',
    '  "category": "<category>",',
    '  "pp_score": <score>,',
    '  "score_verdict": "<Critical/Needs Attention/Average/Good based on score>",',
    '  "revenue_context": "<2 sentences describing the post-purchase problem qualitatively — no rupee figures>",',
    '  "kpis": {',
    '    "rto_rate": "<e.g. 18-22%>",',
    '    "rto_rate_num": <numeric value only e.g. 20>,',
    '    "rto_note": "<vs industry avg 10-12%>",',
    '    "repeat_rate": "<e.g. 22%>",',
    '    "repeat_rate_num": <numeric value only e.g. 22>,',
    '    "repeat_note": "<e.g. Could reach 38% with better PP>",',
    '    "refund_time": "<e.g. 12-15 days>",',
    '    "refund_note": "<vs industry best 5-7 days>",',
    '    "monthly_complaints": "<e.g. 800-1200>",',
    '    "complaints_note": "<what most are about>"',
    '  },',
    '  "complaints": [',
    '    {"source": "Reddit", "volume": "high", "text": "<real complaint for ' + brand + '>"},',
    '    {"source": "Twitter/X", "volume": "high", "text": "<real complaint>"},',
    '    {"source": "Google Reviews", "volume": "medium", "text": "<real complaint>"},',
    '    {"source": "Quora/Forums", "volume": "low", "text": "<real complaint>"}',
    '  ],',
    '  "pain_points": [',
    '    {"icon": "📦", "text": "<RTO problem description — no rupee estimates>"},',
    '    {"icon": "🔄", "text": "<returns problem>"},',
    '    {"icon": "💸", "text": "<refund delay problem>"},',
    '    {"icon": "🔕", "text": "<post-purchase silence problem>"}',
    '  ],',
    '  "benchmark": [',
    '    {"brand": "' + brand + '", "score": <same as pp_score>, "grade": "<from score>", "is_you": true},',
    '    {"brand": "<competitor 1>", "score": <from reference list>, "grade": "<from score>", "is_you": false},',
    '    {"brand": "<competitor 2>", "score": <from reference list>, "grade": "<from score>", "is_you": false},',
    '    {"brand": "<competitor 3>", "score": <from reference list>, "grade": "<from score>", "is_you": false}',
    '  ],',
    '  "valetpe": {',
    '    "solves": [',
    '      {"icon": "🧠", "title": "RTO and Refund Intelligence", "desc": "<specific RTO problem for ' + brand + ' and how ValetPe fixes it>", "number": "Up to 30% RTO reduction"},',
    '      {"icon": "🏷️", "title": "Price Protection", "desc": "<specific problem and ValetPe fix>", "number": "2.2x repeat purchase rate"},',
    '      {"icon": "⚡", "title": "Automated Return Flow", "desc": "<specific problem and ValetPe fix>", "number": "40% drop in support tickets"}',
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
        if (!API_KEY) { res.writeHead(500); res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' })); return; }

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
              if (!match) { res.writeHead(500); res.end(JSON.stringify({ error: 'No JSON found: ' + jsonStr.substring(0, 150) })); return; }

              var report = JSON.parse(match[0]);

              // SERVER-SIDE ENFORCEMENT — override Claude if it got anything wrong

              // 1. Fix pp_score if brand is known
              var knownScore = KNOWN_SCORES[brand.toLowerCase()];
              if (knownScore) report.pp_score = knownScore;

              // 2. Fix score_verdict to match pp_score
              report.score_verdict = verdictFromScore(report.pp_score);

              // 3. Fix benchmark — brand's own score MUST match pp_score
              if (report.benchmark && Array.isArray(report.benchmark)) {
                report.benchmark.forEach(function(b) {
                  if (b.is_you) {
                    b.score = report.pp_score;
                  } else {
                    // Override with known score if we have it
                    var bs = KNOWN_SCORES[b.brand.toLowerCase()];
                    if (bs) b.score = bs;
                  }
                  b.grade = gradeFromScore(b.score);
                });
              }

              // 4. Ensure rto_rate_num and repeat_rate_num exist
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
