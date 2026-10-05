import { formatTimestamp } from './ban-checker.mjs';

const escapeHtml = (value) => String(value ?? '—').toUpperCase()
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const fit = (value, width) => {
  const text = String(value ?? '—').toUpperCase();
  return text.length > width ? `${text.slice(0, width - 1)}…` : text.padEnd(width, ' ');
};

const dateLines = (value, fallback) => {
  if (!value) return [fallback, ''];
  const formatted = formatTimestamp(value).replace(/ UTC$/, '');
  if (formatted.length <= 16) return [formatted, ''];
  const comma = formatted.indexOf(', ');
  if (comma > 0) return [formatted.slice(0, comma + 1), formatted.slice(comma + 2)];
  return [formatted.slice(0, 16), formatted.slice(16, 32)];
};

export function forceJoinKeyboard(items) {
  return { inline_keyboard: items.map((item) => [{ text: item.label, url: item.url }]) };
}

export function welcomeText(botName, watermark) {
  return [
    `✅ <b>${botName}</b>`, '', '🛡 <b>WhatsApp Ban Analysis</b>',
    'Send a WhatsApp number in international format to check its ban status.', '',
    '<b>Accepted prefixes:</b> <code>?</code> <code>/</code> <code>.</code>',
    '<b>Example:</b> <code>?+2348131225323</code>', '', `© ${watermark}`,
  ].join('\n');
}

export function joinPrompt(botName, watermark) {
  return [
    `🔒 <b>${botName}</b>`, '', 'Please join all three communities below before using the checker.',
    'After joining, tap <b>✅ I Joined — Check Again</b>.', '', `© ${watermark}`,
  ].join('\n');
}

export function resultText(result, botName, watermark) {
  const border = '┌────────────────────────────────┐';
  const bottom = '└────────────────────────────────┘';
  const separator = '├────────────────┼────────────────┤';
  const row = (icon, label, value) => `│ ${icon} ${fit(label, 13)}│ ${fit(value, 14)} │`;
  const missing = result.banned ? 'NOT PROVIDED' : 'NOT APPLICABLE';
  const banDate = dateLines(result.banDate, missing);
  const banTime = dateLines(result.banTime, missing);
  const appealDate = dateLines(result.appealTime, missing);
  const lines = [
    border,
    '│     FIELD     │     VALUE      │',
    separator,
    row('☎️', 'PHONE NUMBER', result.phone),
    row('☎️', 'PHONE COUNTRY', result.phoneCountry),
    row(result.banned ? '🔴' : '🟢', 'BAN STATUS', result.banned ? 'BANNED' : 'NOT BANNED'),
    row('📌', 'BAN TYPE', result.banType),
    `│ 📅 ${fit('BAN DATE', 13)}│ ${fit(banDate[0], 14)} │`,
    banDate[1] ? `│    ${fit('', 13)}│ ${fit(banDate[1], 14)} │` : null,
    `│ 🌀 ${fit('BAN TIME', 13)}│ ${fit(banTime[0], 14)} │`,
    banTime[1] ? `│    ${fit('', 13)}│ ${fit(banTime[1], 14)} │` : null,
    row('⚠️', 'VIOLATION TYPE', result.violationType),
    row('📝', 'VIOLATION REASON', result.banned ? result.reason : missing),
    row('✉️', 'CAN APPEAL', result.canAppeal),
    row('✉️', 'APPEAL STATUS', result.appealStatus),
    `│ 📅 ${fit('APPEAL CREATED', 13)}│ ${fit(appealDate[0], 14)} │`,
    appealDate[1] ? `│    ${fit('', 13)}│ ${fit(appealDate[1], 14)} │` : null,
    bottom,
  ].filter(Boolean);
  return [
    `<blockquote><b>🔹 ${escapeHtml(botName)} 🔹</b>`,
    `<b>${result.banned ? '🚫' : '🟢'} WHATSAPP BAN ANALYSIS</b>`,
    '', `<pre>${lines.map(escapeHtml).join('\n')}</pre>`,
    `<b>✅ ${escapeHtml(botName)}</b></blockquote>`,
    `© ${escapeHtml(watermark)}`,
  ].join('\n');
}

export function typingFrames(botName) {
  return [
    `🔎 <b>${botName}</b>\n\n⏳ Preparing WhatsApp ban analysis…`,
    `🔎 <b>${botName}</b>\n\n⏳ Contacting ban-check service…`,
    `🔎 <b>${botName}</b>\n\n⏳ Reading response fields…`,
  ];
}
