const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3000;

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function buildPrompt(brand) {
  return [
    'You are a strict D2C post-purchase analyst. Research the Indian D2C brand "' + brand + '" using web search.',
    '',
    'SCORING METHODOLOGY — follow this exactly to calculate pp_score:',
    'Start at 100. Deduct points based on evidence found:',
    '- RTO rate above 15%: deduct 15 points. Above 25%: deduct 25 points.',
    '- Refund time above 10 days: deduct 10 points. Above 15 days: deduct 20 points.',
    '- Repeat purchase rate below 30%: deduct 10 points. Below 20%: deduct 20 points.',
    '- High volume complaints on Reddit/Twitter: deduct 10 points.',
    '- No proactive post-purchase communication: deduct 5 points.',
    '- Broken return portal or manual-only returns: deduct 10 points.',
    '- Positive indicators (fast refunds, easy returns, good reviews): add back up to 10 points.',
    'Final score must reflect this calculation. Do NOT guess or make up a round number.',
    '',
    'SCORE TO VERDICT MAPPING — use exactly:',
    '70-100: Good',
    '50-69: Average', 
    '30-49: Needs Attention',
    '0-29: Critical',
    '',
    'BENCHMARK RULES — very important:',
    'Only use these exact brands as competitors based on category:',
    'Fashion/Apparel: Snitch, Bewakoof, The Souled Store, Rare Rabbit, The Bear House, Urbanic',
    'Innerwear/Basics: DaMENSCH, XYXX, Almo, Wrogn',
    'Beauty/Skincare: Minimalist, Plum, mCaffeine, Dot and Key',
    'Pick the 3 most relevant competitors for ' + brand + '.',
    'CRITICAL: The benchmark score for ' + brand + ' must be IDENTICAL to pp_score above.',
    'Competitor scores must be based on their actual known post-purchase reputation, not guessed.',
    'Use these known approximate scores as reference:',
    'Snitch: 42, Bewakoof: 35, The Souled Store: 55, Rare Rabbit: 60, The Bear House: 58,',
    'DaMENSCH: 65, XYXX: 68, Minimalist: 72, Plum: 70, mCaffeine: 68, Urbanic: 45.',
    '',
    'NUMBER RULES:',
    'All revenue figures must be ANNUAL.',
    'Estimate brand size realistically:',
    'Snitch: ~300 Cr revenue, ~80K monthly orders, AOV ~750',
    'Bewakoof: ~500 Cr revenue, ~150K monthly orders, AOV ~600',
    'The Souled Store: ~200 Cr revenue, ~60K monthly orders, AOV ~700',
    'Rare Rabbit: ~400 Cr revenue, ~50K monthly orders, AOV ~1800',
    'DaMENSCH: ~150 Cr revenue, ~40K monthly orders, AOV ~900',
    'For unknown brands: estimate conservatively based on category and public information.',
    '',
    'Return ONLY a raw JSON object. Start with { end with }. No markdown. No text outside JSON.',
    '',
    '{',
    '  "brand": "' + brand + '",',
    '  "category": "<e.g. Mens Fashion>",',
    '  "pp_score": <calculated score using methodology above>,',
    '  "score_verdict": "<must match score range: Good/Average/Needs Attention/Critical>",',
    '  "revenue_headline": "<' + brand + ' loses est. Rs X Cr annually — not from bad products but from broken post-purchase>",',
    '  "revenue_context": "<2 sentences. Use ANNUAL figures. Frame as revenue and repeat purchase loss. Mention RTO cost and customer LTV impact.>",',
    '  "kpis": {',
    '    "rto_rate": "<researched value e.g. 18-22%>",',
    '    "rto_note": "<vs industry avg of 10-12%>",',
    '    "repeat_rate": "<researched value e.g. 22%>",',
    '    "repeat_note": "<what it could be with ValetPe e.g. Could reach 38%>",',
    '    "refund_time": "<researched value e.g. 12-15 days>",',
    '    "refund_note": "<vs industry best of 5-7 days>",',
    '    "monthly_complaints": "<realistic researched estimate>",',
    '    "complaints_note": "<what most complaints are about>"',
    '  },',
    '  "complaints": [',
    '    {"source": "Reddit", "volume": "high", "text": "<real specific complaint pattern found for ' + brand + '>"},',
    '    {"source": "Twitter/X", "volume": "high", "text": "<real specific complaint>"},',
    '    {"source": "Google Reviews", "volume": "medium", "text": "<real specific complaint>"},',
    '    {"source": "Quora/Forums", "volume": "low", "text": "<real specific complaint>"}',
    '  ],',
    '  "pain_points": [',
    '    {"icon": "📦", "text": "<RTO-specific pain with annual Rs cost for ' + brand + '>"},',
    '    {"icon": "🔄", "text": "<returns process pain with lost repeat revenue angle>"},',
    '    {"icon": "💸", "text": "<refund delay causing permanent churn and annual LTV loss>"},',
    '    {"icon": "🔕", "text": "<post-purchase silence eroding trust before next purchase decision>"}',
    '  ],',
    '  "benchmark": [',
    '    {"brand": "' + brand + '", "score": <MUST equal pp_score exactly>, "grade": "<derived from score>", "is_you": true},',
    '    {"brand": "<competitor 1>", "score": <use reference scores above>, "grade": "<derived>", "is_you": false},',
    '    {"brand": "<competitor 2>", "score": <use reference scores above>, "grade": "<derived>", "is_you": false},',
    '    {"brand": "<competitor 3>", "score": <use reference scores above>, "grade": "<derived>", "is_you": false}',
    '  ],',
    '  "valetpe": {',
    '    "headline": "<' + brand + ' can recover Rs X Cr annually — here is exactly how ValetPe does it>",',
    '    "solves": [',
    '      {"icon": "🧠", "title": "RTO and Refund Intelligence", "desc": "<specific: est X% of ' + brand + ' RTOs are flagged addresses or repeat returners. ValetPe scores every order pre-dispatch reducing RTO by up to 30%>", "number": "<e.g. Saves Rs 40-80L annually in RTO costs>"},',
    '      {"icon": "🏷️", "title": "Price Protection — turn discounts into repeat orders", "desc": "<specific: when ' + brand + ' runs sales, full-price buyers feel cheated and dont return. ValetPe auto-credits difference to brand wallet>", "number": "<e.g. Drives 2.2x repeat purchase rate>"},',
    '      {"icon": "⚡", "title": "Automated Return Flow — build trust at the hardest moment", "desc": "<specific: ' + brand + ' handles X return requests monthly manually. ValetPe automates triage pickup and status updates>", "number": "<e.g. 40% drop in support tickets annually>"}',
    '    ],',
    '    "numbers": [',
    '      {"val": "<Rs XCr>", "label": "Est. annual revenue lost to RTO and poor post-purchase"},',
    '      {"val": "<2.2x>", "label": "Repeat purchase lift with price protection active"},',
    '      {"val": "<40%>", "label": "Reduction in support costs with automated returns"}',
    '    ],',
    '    "calc": {',
    '      "annual_revenue_est": "<brand annual revenue in Cr>",',
    '      "rto_rate_pct": "<number only>",',
    '      "avg_order_value": "<AOV in Rs>",',
    '      "monthly_orders_est": "<estimated monthly orders>",',
    '      "rto_cost_per_order": "<reverse logistics cost per RTO in Rs, typically 80-150>",',
    '      "repeat_rate_current": "<number only>",',
    '      "repeat_rate_potential": "<number only>",',
    '      "refund_time_days": "<number only>"',
    '    }',
    '  }',
    '}',
    '',
    'Replace ALL placeholders with real researched data for ' + brand + '. Return only the JSON object.'
  ].join('\n');
}

function gradeFromScore(score) {
  if (score >= 70) return 'A';
  if (score >= 55) return 'B';
  if (score >= 40) return 'C';
  return 'D';
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
          max_tokens: 4000,
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
              if (result.error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: result.error.message }));
                return;
              }

              var jsonStr = '';
              for (var i = 0; i < result.content.length; i++) {
                if (result.content[i].type === 'text') { jsonStr = result.content[i].text; break; }
              }
              jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              var match = jsonStr.match(/\{[\s\S]*\}/);
              if (!match) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'No JSON in response: ' + jsonStr.substring(0, 150) }));
                return;
              }

              var report = JSON.parse(match[0]);

              // SERVER-SIDE FIXES — enforce consistency regardless of what Claude returned
              // 1. Ensure benchmark score for the brand matches pp_score exactly
              if (report.benchmark && Array.isArray(report.benchmark)) {
                report.benchmark.forEach(function(b) {
                  if (b.is_you) {
                    b.score = report.pp_score;
                    b.grade = gradeFromScore(report.pp_score);
                  } else {
                    // Enforce grade matches score
                    b.grade = gradeFromScore(b.score);
                  }
                });
              }

              // 2. Ensure score_verdict matches pp_score
              var score = report.pp_score;
              if (score >= 70) report.score_verdict = 'Good';
              else if (score >= 50) report.score_verdict = 'Average';
              else if (score >= 30) report.score_verdict = 'Needs Attention';
              else report.score_verdict = 'Critical';

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(report));

            } catch(e) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: 'Parse error: ' + e.message + ' | Raw: ' + data.substring(0, 300) }));
            }
          });
        });

        apiReq.on('error', function(e) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: e.message }));
        });
        apiReq.write(payload);
        apiReq.end();

      } catch(e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, function() {
  console.log('ValetPe running on port ' + PORT);
  console.log('API Key: ' + (API_KEY ? 'SET' : 'NOT SET'));
});
