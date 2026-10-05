import { formatTimestamp } from './ban-checker.mjs';

const upper = (value) => String(value ?? '—').toUpperCase();
const title = (value) => String(value ?? '—');
const bold = (text) => ({ type: 'bold', text });
const code = (text) => ({ type: 'code', text: String(text ?? '—') });
const dateText = (value, fallback) => {
  if (!value) return title(fallback);
  const unix = typeof value === 'number' ? value : Math.floor(new Date(value).getTime() / 1000);
  if (!Number.isFinite(unix)) return title(formatTimestamp(value));
  return { type: 'date_time', text: formatTimestamp(value).replace(/ UTC$/, ''), unix_time: unix, date_time_format: 'DT' };
};
const cell = (text, options = {}) => ({
  text,
  align: options.align || 'left',
  valign: 'middle',
  ...(options.header ? { is_header: true } : {}),
});
const labelCell = (emoji, label) => [emoji, ' ', title(label)];

export function buildRichReport(result, botName, watermark) {
  const missing = result.banned ? 'Not provided' : 'Not applicable';
  const rows = [
    [cell(labelCell('☎️', 'Phone Number')), cell(code(result.phone))],
    [cell(labelCell('☎️', 'Phone Country')), cell(title(result.phoneCountry))],
    [cell(labelCell(result.banned ? '🔴' : '🟢', 'Ban Status')), cell(title(result.banned ? 'BANNED' : 'NOT BANNED'))],
    [cell(labelCell('📌', 'Ban Type')), cell(title(result.banType))],
    [cell(labelCell('📅', 'Ban Date')), cell(dateText(result.banDate, missing))],
    [cell(labelCell('🌀', 'Ban Time')), cell(dateText(result.banTime, missing))],
    [cell(labelCell('⚠️', 'Violation Type')), cell(title(result.violationType))],
    [cell(labelCell('📝', 'Violation Reason')), cell(title(result.banned ? result.reason : missing))],
    [cell(labelCell('✉️', 'Can Appeal')), cell(title(result.canAppeal))],
    [cell(labelCell('✉️', 'Appeal Status')), cell(title(result.appealStatus))],
    [cell(labelCell('📅', 'Appeal Created')), cell(dateText(result.appealTime, missing))],
  ];
  const retryData = `rich_retry:${result.phone}`.slice(0, 64);
  return {
    blocks: [
      {
        type: 'blockquote',
        blocks: [{
          type: 'paragraph',
          text: [bold('⚔ Retired Dev • Victory ⚔ 〔♧〕'), '\n', `? ${result.phone}`],
        }],
      },
      { type: 'heading', size: 2, text: [bold(`✅ ${botName}`)] },
      { type: 'paragraph', text: [bold(`${result.banned ? '🚫' : '🟢'} WhatsApp Ban Analysis`)] },
      { type: 'table', is_bordered: true, is_striped: true, is_compact: true, cells: [
        [cell(bold('Field'), { header: true, align: 'center' }), cell(bold('Value'), { header: true, align: 'center' })],
        ...rows,
      ] },
      { type: 'footer', text: [bold(`✅ ${botName}`), '\n', watermark] },
      {
        type: 'buttons',
        align: 'center',
        buttons: [
          { text: '🚀 Try', style: 'success', callback_data: 'rich_try' },
          { text: '↻ Retry Check', style: 'danger', callback_data: retryData },
        ],
      },
    ],
  };
}

export function richReportPayload(chatId, result, botName, watermark) {
  return { chat_id: chatId, rich_message: buildRichReport(result, botName, watermark) };
}
