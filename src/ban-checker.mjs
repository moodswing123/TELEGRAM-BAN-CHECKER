const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function normalizePhone(input) {
  const raw = String(input ?? '').trim().replace(/[\s().-]/g, '');
  if (!raw) return '';
  if (raw.startsWith('00')) return `+${raw.slice(2)}`;
  if (raw.startsWith('+')) return `+${raw.slice(1).replace(/\D/g, '')}`;
  return `+${raw.replace(/\D/g, '')}`;
}

export function isValidPhone(phone) {
  return /^\+\d{7,15}$/.test(phone);
}

const countryByPrefix = [
  ['+234', '🇳🇬 Nigeria'], ['+233', '🇬🇭 Ghana'], ['+254', '🇰🇪 Kenya'], ['+27', '🇿🇦 South Africa'],
  ['+44', '🇬🇧 United Kingdom'], ['+49', '🇩🇪 Germany'], ['+33', '🇫🇷 France'], ['+39', '🇮🇹 Italy'],
  ['+34', '🇪🇸 Spain'], ['+91', '🇮🇳 India'], ['+86', '🇨🇳 China'], ['+81', '🇯🇵 Japan'],
  ['+1', '🇺🇸/🇨🇦 North America'], ['+55', '🇧🇷 Brazil'], ['+52', '🇲🇽 Mexico'], ['+971', '🇦🇪 United Arab Emirates'],
];

function countryFor(phone, data) {
  return data.country_name || data.country || data.phone_country || countryByPrefix.find(([prefix]) => phone.startsWith(prefix))?.[1] || '—';
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function checkBan(phone, { baseUrl, baronApiUrl = '', baronApiKey = '', timeoutMs = 20000, fetchImpl = fetch } = {}) {
  const normalized = normalizePhone(phone);
  if (!isValidPhone(normalized)) {
    const error = new Error('Enter a valid international phone number, for example +2348131225323.');
    error.code = 'INVALID_PHONE';
    throw error;
  }

  const get = async (url, options) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try { return await fetchImpl(url, { ...options, signal: controller.signal }); }
    finally { clearTimeout(timer); }
  };

  const authHeaders = { Accept: 'application/json' };
  if (baronApiKey) authHeaders.Authorization = `Bearer ${baronApiKey}`;
  let response;
  if (baronApiUrl) {
    response = await get(baronApiUrl, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: normalized }),
    });
  } else {
    const tokenResponse = await get(`${baseUrl}/api/get-token`, { headers: authHeaders });
    if (!tokenResponse.ok) throw new Error(`baron0 token request failed (${tokenResponse.status})`);
    const tokenData = await tokenResponse.json();
    const token = tokenData?.token || '';
    if (!token) throw new Error('baron0 did not return a page token.');
    response = await get(`${baseUrl}/check-numberr2`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json', 'X-Page-Token': token },
      body: JSON.stringify({ number: normalized, 'cf-turnstile-response': '' }),
    });
  }
  const text = await response.text();
  let data = {};
  try { data = JSON.parse(text); } catch { /* handled below */ }
  if (!response.ok) {
    const error = new Error(data?.error || `baron0 check failed (${response.status})`);
    error.code = response.status === 403 ? 'ACCESS_DENIED' : 'UPSTREAM_ERROR';
    throw error;
  }

  if (data?.error) throw new Error(data.error);
  const banned = Boolean(data.banned || data.mod_ban);
  return {
    phone: normalized,
    phoneCountry: countryFor(normalized, data),
    banned,
    status: banned ? 'BANNED' : 'NOT BANNED',
    reason: data.violation_label || data.violation_reason || data.reason || (banned ? 'NOT PROVIDED' : 'NOT APPLICABLE'),
    violationType: data.violation_type || data.violation || (banned ? 'NOT PROVIDED' : 'NOT APPLICABLE'),
    banType: data.ban_type || (data.mod_ban ? 'MODERATION' : (banned ? 'NOT PROVIDED' : 'NOT APPLICABLE')),
    banDate: data.ban_date || data.ban_time || null,
    banTime: data.ban_time || null,
    appealTime: data.appeal_creation_time || null,
    appealStatus: data.appeal_status || (data.appeal_creation_time ? 'CREATED' : 'NOT APPLICABLE'),
    canAppeal: data.can_appeal ?? data.appealable ?? (banned ? 'NOT PROVIDED' : 'NOT APPLICABLE'),
    raw: data,
  };
}

export function formatTimestamp(value) {
  if (!value) return '—';
  const date = new Date(typeof value === 'number' ? value * 1000 : value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' }) + ' UTC';
}

export { sleep };
