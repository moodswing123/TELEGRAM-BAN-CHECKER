import { formatTimestamp } from './ban-checker.mjs';

const escapeHtml = (value) => String(value ?? '—').toUpperCase()
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const fit = (value, width) => {
  const text = String(value ?? '—');
  return text.length > width ? `${text.slice(0, width - 1)}…` : text.padEnd(width, ' ');
};

const dateLines = (value, fallback) => {
  if (!value) return [fallback, ''];
  const formatted = formatTimestamp(value).replace(/ UTC$/, '');
  if (formatted.length <= 20) return [formatted, ''];
  const comma = formatted.indexOf(', ');
  if (comma > 0) return [formatted.slice(0, comma + 1), formatted.slice(comma + 2)];
  return [formatted.slice(0, 20), formatted.slice(20, 40)];
};

export function forceJoinKeyboard(items) {
  return { inline_keyboard: items.map((item) => [{ text: item.label, url: item.url }]) };
}

export function welcomeText(botName, watermark) {
  return [
    `✅ <b>${botName}</b>`,
    '',
    '🛡 <b>WhatsApp Ban Analysis</b>',
    'Send a WhatsApp number in international format to check its ban status.',
    '',
    '<b>Accepted prefixes:</b> <code>?</code> <code>/</code> <code>.</code>',
    '<b>Example:</b> <code>?+2348131225323</code>',
    '',
    `© ${watermark}`,
  ].join('\n');
}

export function joinPrompt(botName, watermark) {
  return [
    `🔒 <b>${botName}</b>`,
    '',
    'Please join all three communities below before using the checker.',
    'After joining, tap <b>✅ I Joined — Check Again</b>.',
    '',
    `© ${watermark}`,
  ].join('\n');
}

export function resultText(result, botName, watermark) {
  const border = '┌──────────────────────────────────────────┐';
  const bottom = '└──────────────────────────────────────────┘';
  const row = (icon, label, value) => `│ ${icon} ${fit(label, 17)}│ ${fit(value, 21)} │`;
  const missing = result.banned ? 'NOT PROVIDED' : 'NOT APPLICABLE';
  const banDate = dateLines(result.banDate, missing);
  const banTime = dateLines(result.banTime, missing);
  const appealDate = dateLines(result.appealTime, missing);
  const lines = [
    `🔹 ${botName} 🔹`,
    '',
    `${result.banned ? '🚫' : '🟢'} WhatsApp Ban Analysis`,
    '',
    border,
    '│                  Field │ Value                 │',
    '├────────────────────────┼───────────────────────┤',
    row('☎️', 'Phone Number', result.phone),
    row('☎️', 'Phone Country', result.phoneCountry),
    row(result.banned ? '🔴' : '🟢', 'Ban Status', result.banned ? 'BANNED' : 'NOT BANNED'),
    row('📌', 'Ban Type', result.banType),
    `│ 📅 ${fit('Ban Date', 17)}│ ${fit(banDate[0], 21)} │`,
    banDate[1] ? `│    ${fit('', 17)}│ ${fit(banDate[1], 21)} │` : null,
    `│ 🌀 ${fit('Ban Time', 17)}│ ${fit(banTime[0], 21)} │`,
    banTime[1] ? `│    ${fit('', 17)}│ ${fit(banTime[1], 21)} │` : null,
    row('⚠️', 'Violation Type', result.violationType),
    row('📝', 'Violation Reason', result.banned ? result.reason : '—'),
    row('✉️', 'Can Appeal', String(result.canAppeal).toUpperCase()),
    row('✉️', 'Appeal Status', result.appealStatus),
    `│ 📅 ${fit('Appeal Created', 17)}│ ${fit(appealDate[0], 21)} │`,
    appealDate[1] ? `│    ${fit('', 17)}│ ${fit(appealDate[1], 21)} │` : null,
    bottom,
    '',
    `✅ ${botName}`,
  ].filter(Boolean);

  return `<blockquote><pre><b>${lines.map(escapeHtml).join('\n')}</b></pre></blockquote>\n© ${escapeHtml(watermark)}`;
}

export function typingFrames(botName) {
  return [
    `🔎 <b>${botName}</b>\n\n⏳ Preparing WhatsApp ban analysis…`,
    `🔎 <b>${botName}</b>\n\n⏳ Contacting ban-check service…`,
    `🔎 <b>${botName}</b>\n\n⏳ Reading response fields…`,
  ];
}
