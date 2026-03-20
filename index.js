const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3000;

// Load HTML from file
const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function buildPrompt(brand) {
  return 'You are a D2C revenue analyst for Indian brands. Research "' + brand + '" using web search. '
    + 'Find real data on RTO, returns, refunds, repeat purchases, and post-purchase complaints. '
    + 'IMPORTANT: All revenue figures must be ANNUAL. Keep numbers realistic (annual loss for mid-size D2C = 50L to 2Cr). '
    + 'RTO rate 15-30%, repeat purchase rate 20-35%, refund time 7-15 days. '
    + 'Return ONLY a raw JSON object starting with { and ending with }. No text before or after. No markdown. '
    + 'Use this exact structure with real data for ' + brand + ': '
    + '{"brand":"' + brand + '",'
    + '"category":"<category>",'
    + '"pp_score":<0-100>,'
    + '"score_verdict":"<Critical or Needs Attention or Average or Good>",'
    + '"revenue_headline":"<annual revenue loss headline>",'
    + '"revenue_context":"<2 sentences about annual revenue and repeat purchase loss>",'
    + '"kpis":{"rto_rate":"<e.g. 18-22%>","rto_note":"<vs industry avg>","repeat_rate":"<e.g. 25%>","repeat_note":"<potential with ValetPe>","refund_time":"<e.g. 10-14 days>","refund_note":"<vs industry best>","monthly_complaints":"<realistic number>","complaints_note":"<what they are about>"},'
    + '"complaints":[{"source":"Reddit","volume":"high","text":"<real complaint>"},{"source":"Twitter/X","volume":"high","text":"<real complaint>"},{"source":"Google Reviews","volume":"medium","text":"<real complaint>"},{"source":"Quora/Forums","volume":"low","text":"<real complaint>"}],'
    + '"pain_points":[{"icon":"\ud83d\udce6","text":"<RTO pain with annual Rs cost>"},{"icon":"\ud83d\udd04","text":"<returns pain>"},{"icon":"\ud83d\udcb8","text":"<refund delay churn>"},{"icon":"\ud83d\udd15","text":"<post-purchase silence>"}],'
    + '"benchmark":[{"brand":"' + brand + '","score":<0-100>,"grade":"<A/B/C/D>","is_you":true},{"brand":"<competitor 1>","score":<0-100>,"grade":"<A/B/C/D>","is_you":false},{"brand":"<competitor 2>","score":<0-100>,"grade":"<A/B/C/D>","is_you":false},{"brand":"<competitor 3>","score":<0-100>,"grade":"<A/B/C/D>","is_you":false}],'
    + '"valetpe":{"headline":"<' + brand + ' can recover X Cr annually with ValetPe>",'
    + '"solves":[{"icon":"\ud83e\udde0","title":"RTO and Refund Intelligence","desc":"<specific RTO fix for ' + brand + '>","number":"<annual savings>"},{"icon":"\ud83c\udff7\ufe0f","title":"Price Protection","desc":"<specific price protection value>","number":"<repeat rate impact>"},{"icon":"\u26a1","title":"Automated Return Flow","desc":"<specific automation value>","number":"<support cost reduction>"}],'
    + '"numbers":[{"val":"<e.g. Rs 1.2Cr>","label":"Est. annual revenue lost to RTO and poor post-purchase"},{"val":"<e.g. 2.2x>","label":"Repeat purchase lift with price protection"},{"val":"<e.g. 40%>","label":"Reduction in support costs with automated returns"}],'
    + '"calc":{"annual_revenue_est":"150","rto_rate_pct":"20","avg_order_value":"850","monthly_orders_est":"50000","rto_cost_per_order":"120","repeat_rate_current":"25","repeat_rate_potential":"40","refund_time_days":"12"}}}';
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
              if (result.error) { res.writeHead(400); res.end(JSON.stringify({ error: result.error.message })); return; }
              var jsonStr = '';
              for (var i = 0; i < result.content.length; i++) {
                if (result.content[i].type === 'text') { jsonStr = result.content[i].text; break; }
              }
              jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              var match = jsonStr.match(/\{[\s\S]*\}/);
              if (!match) { res.writeHead(500); res.end(JSON.stringify({ error: 'No JSON in response: ' + jsonStr.substring(0, 150) })); return; }
              var report = JSON.parse(match[0]);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(report));
            } catch(e) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: 'Parse error: ' + e.message + ' | Raw: ' + data.substring(0, 200) }));
            }
          });
        });

        apiReq.on('error', function(e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); });
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
  console.log('API Key: ' + (API_KEY ? 'SET' : 'NOT SET - add ANTHROPIC_API_KEY to Environment Variables'));
});
