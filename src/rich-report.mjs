import { formatTimestamp } from './ban-checker.mjs';

const upper = (value) => String(value ?? '—').toUpperCase();
const bold = (text) => ({ type: 'bold', text: upper(text) });
const code = (text) => ({ type: 'code', text: String(text ?? '—') });
const dateText = (value, fallback) => {
  if (!value) return upper(fallback);
  const unix = typeof value === 'number' ? value : Math.floor(new Date(value).getTime() / 1000);
  if (!Number.isFinite(unix)) return upper(formatTimestamp(value));
  return { type: 'date_time', text: upper(formatTimestamp(value).replace(/ UTC$/, '')), unix_time: unix, date_time_format: 'DT' };
};
const cell = (text, options = {}) => ({ text, align: options.align || 'left', valign: 'middle', ...(options.header ? { is_header: true } : {}) });
const labelCell = (emoji, label) => [emoji, ' ', bold(label)];

export function buildRichReport(result, botName, watermark) {
  const missing = result.banned ? 'NOT PROVIDED' : 'NOT APPLICABLE';
  const rows = [
    [labelCell('☎️', 'PHONE NUMBER'), cell(code(result.phone))],
    [labelCell('☎️', 'PHONE COUNTRY'), cell(upper(result.phoneCountry))],
    [labelCell(result.banned ? '🔴' : '🟢', 'BAN STATUS'), cell(bold(result.banned ? 'BANNED' : 'NOT BANNED'))],
    [labelCell('📌', 'BAN TYPE'), cell(bold(result.banType))],
    [labelCell('📅', 'BAN DATE'), cell(dateText(result.banDate, missing))],
    [labelCell('🌀', 'BAN TIME'), cell(dateText(result.banTime, missing))],
    [labelCell('⚠️', 'VIOLATION TYPE'), cell(bold(result.violationType))],
    [labelCell('📝', 'VIOLATION REASON'), cell(bold(result.banned ? result.reason : missing))],
    [labelCell('✉️', 'CAN APPEAL'), cell(bold(result.canAppeal))],
    [labelCell('✉️', 'APPEAL STATUS'), cell(bold(result.appealStatus))],
    [labelCell('📅', 'APPEAL CREATED'), cell(dateText(result.appealTime, missing))],
  ];
  return {
    blocks: [
      { type: 'heading', size: 3, text: [bold(`🔹 ${botName} 🔹`)] },
      { type: 'paragraph', text: [bold(`${result.banned ? '🚫' : '🟢'} WHATSAPP BAN ANALYSIS`)] },
      { type: 'table', is_bordered: true, is_striped: true, is_compact: true, cells: [
        [cell(bold('FIELD'), { header: true, align: 'center' }), cell(bold('VALUE'), { header: true, align: 'center' })],
        ...rows,
      ] },
      { type: 'footer', text: [bold(`✅ ${botName}`), '\n', upper(watermark)] },
    ],
  };
}

export function richReportPayload(chatId, result, botName, watermark) {
  return { chat_id: chatId, rich_message: buildRichReport(result, botName, watermark) };
}
