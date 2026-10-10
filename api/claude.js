// Vercel Function: POST /api/claude
// Keeps the Anthropic API key on the server. The page sends the access code from its private link
// (https://<site>/#join=CODE); the API key itself never reaches a browser.
// Set two environment variables in Vercel: ANTHROPIC_API_KEY and ACCESS_CODE.
const crypto = require('crypto');

const API = 'https://api.anthropic.com/v1/messages';
const MODELS = new Set(['claude-sonnet-5-5', 'claude-haiku-5-5']);
const MAX_TOKENS = 8000;
const MAX_PROMPT_CHARS = 60000;

function fail(res, status, type, message) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify({ type: 'error', error: { type, message } }));
}

function sameCode(given, expected) {
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(String(expected || ''));
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return fail(res, 405, 'method_not_allowed', 'Use POST.');
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const accessCode = process.env.ACCESS_CODE;
  if (!apiKey || !accessCode) return fail(res, 500, 'not_configured', 'Set ANTHROPIC_API_KEY and ACCESS_CODE in Vercel, then redeploy.');
  if (!sameCode(req.headers['x-access-code'], accessCode)) return fail(res, 401, 'access_denied', 'This private link is not valid.');

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body !== 'object') return fail(res, 400, 'invalid_request_error', 'Send a JSON body.');
  const model = MODELS.has(body.model) ? body.model : '';
  const first = Array.isArray(body.messages) ? body.messages[0] : null;
  const prompt = first && first.role === 'user' && typeof first.content === 'string' ? first.content : '';
  if (!model || !prompt || prompt.length > MAX_PROMPT_CHARS) return fail(res, 400, 'invalid_request_error', 'That request is not allowed here.');
  const maxTokens = Math.min(Math.max(1, Math.floor(Number(body.max_tokens) || 1024)), MAX_TOKENS);

  let upstream;
  try {
    upstream = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: maxTokens, stream: true, messages: [{ role: 'user', content: prompt }] })
    });
  } catch (e) {
    return fail(res, 502, 'upstream_unreachable', 'Could not reach Anthropic.');
  }
  if (upstream.status === 401 || upstream.status === 403) {
    return fail(res, 500, 'server_key_invalid', 'Anthropic refused the API key saved in Vercel.');
  }

  res.statusCode = upstream.status;
  res.setHeader('content-type', upstream.headers.get('content-type') || 'application/json');
  res.setHeader('cache-control', 'no-store');
  if (!upstream.body) return res.end(await upstream.text());
  const reader = upstream.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } finally {
    res.end();
  }
};
