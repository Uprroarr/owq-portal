/* OWQ Ask Claude function (Firebase Cloud Functions, 2nd gen, Node 20).
   The portal posts {input: [{role, content}...], web: bool, tier: 'quick'|'default'} with the signed-in person's Firebase
   ID token. This checks the token, checks the person is on the team (members/<email> or the owner email), then asks Claude
   with the ANTHROPIC_API_KEY secret (never sent to the browser) and, when web is on, Anthropic's web search tool. */
const {onRequest} = require('firebase-functions/v2/https');
const {defineSecret, defineString} = require('firebase-functions/params');
const admin = require('firebase-admin');
admin.initializeApp();
const KEY = defineSecret('ANTHROPIC_API_KEY');
const OWNER = defineString('OWQ_OWNER_EMAIL');
const ORIGINS = ['https://uprroarr.github.io'];
const MODEL = {quick: 'claude-haiku-4-5-20251001', default: 'claude-sonnet-5-5'};
const hits = new Map();
exports.askClaude = onRequest({secrets: [KEY], cors: ORIGINS, region: 'us-central1', timeoutSeconds: 120, maxInstances: 3}, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({code: 'method'});
  let email = '';
  try {
    const tok = String(req.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const u = await admin.auth().verifyIdToken(tok);
    if (!u.email_verified) throw 0;
    email = String(u.email || '').toLowerCase();
  } catch (e) { return res.status(401).json({code: 'session_expired'}); }
  const owner = String(OWNER.value() || '').toLowerCase();
  if (email !== owner) {
    const m = await admin.firestore().doc('members/' + email).get();
    if (!m.exists) return res.status(403).json({code: 'not_member'});
  }
  // simple per-person limit: 30 questions per 10 minutes
  const now = Date.now(), h = (hits.get(email) || []).filter(t => now - t < 6e5);
  if (h.length >= 30) return res.status(429).json({code: 'rate_limited'});
  h.push(now); hits.set(email, h);
  const body = req.body || {};
  const input = (Array.isArray(body.input) ? body.input : [])
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12).map(m => ({role: m.role, content: m.content.slice(0, 12000)}));
  if (!input.length || input[0].role !== 'user') return res.status(400).json({code: 'bad_input'});
  const req2 = {model: MODEL[body.tier] || MODEL.default, max_tokens: 1500, messages: input};
  if (body.web) req2.tools = [{type: 'web_search_20250305', name: 'web_search', max_uses: 3}];
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'content-type': 'application/json', 'x-api-key': KEY.value(), 'anthropic-version': '2023-06-01'},
      body: JSON.stringify(req2)
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({code: r.status === 429 ? 'rate_limited' : 'error'});
    const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
    res.json({text, truncated: j.stop_reason === 'max_tokens'});
  } catch (e) { res.status(502).json({code: 'error'}); }
});
