import test from 'node:test';
import assert from 'node:assert/strict';
import { checkBan, isValidPhone, normalizePhone } from '../src/ban-checker.mjs';
import { resultText } from '../src/format.mjs';

test('normalizes common phone formats', () => {
  assert.equal(normalizePhone('00 234 813 122 5323'), '+2348131225323');
  assert.equal(normalizePhone('+234 813-122-5323'), '+2348131225323');
  assert.equal(isValidPhone('+2348131225323'), true);
  assert.equal(isValidPhone('+123'), false);
});

test('maps baron0 response fields', async () => {
  const fetchImpl = async (url, options = {}) => {
    if (url.endsWith('/api/get-token')) return new Response(JSON.stringify({ token: 'test-token' }), { status: 200 });
    assert.equal(options.headers['X-Page-Token'], 'test-token');
    assert.deepEqual(JSON.parse(options.body), { number: '+2348131225323', 'cf-turnstile-response': '' });
    return new Response(JSON.stringify({ banned: true, violation_label: 'Type 14', ban_type: 'permanent', ban_time: 1727469365, can_appeal: false }), { status: 200 });
  };
  const result = await checkBan('2348131225323', { baseUrl: 'https://example.test', fetchImpl });
  assert.equal(result.banned, true);
  assert.equal(result.reason, 'Type 14');
  assert.equal(result.banType, 'permanent');
});

test('formats a recognizable result card', () => {
  const text = resultText({ phone: '+2348131225323', banned: false, status: 'NOT BANNED', reason: '—', violationType: '—', banType: '—', banTime: null, appealTime: null, canAppeal: '—' }, 'V-BAN-CHECKER', 'Powered by Victory Tech™');
  assert.match(text, /V-BAN-CHECKER/);
  assert.match(text, /NOT BANNED/);
  assert.match(text, /VICTORY TECH/);
});
