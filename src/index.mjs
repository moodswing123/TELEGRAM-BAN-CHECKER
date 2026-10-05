import { Bot, GrammyError, HttpError } from 'grammy';
import pino from 'pino';
import { loadConfig } from './config.mjs';
import { checkBan, isValidPhone, normalizePhone, sleep } from './ban-checker.mjs';
import { forceJoinKeyboard, joinPrompt, resultText, typingFrames, welcomeText } from './format.mjs';
import { richReportPayload } from './rich-report.mjs';

const config = loadConfig();
const log = pino({ level: process.env.LOG_LEVEL || 'info' });
const bot = new Bot(config.botToken);

function parseCommand(text = '') {
  const match = text.trim().match(/^([?/.])\s*(\+?\d[\d\s().-]*)$/i);
  if (!match) return null;
  return { prefix: match[1], command: 'check', argument: match[2].trim() };
}

function checkButton() {
  return { inline_keyboard: [[{ text: '✅ I Joined — Check Again', callback_data: 'verify_join' }]] };
}

async function memberIsPresent(ctx, chatId) {
  try {
    const member = await ctx.api.getChatMember(chatId, ctx.from.id);
    return ['creator', 'administrator', 'member'].includes(member.status) || (member.status === 'restricted' && member.is_member);
  } catch (error) {
    log.warn({ chatId, err: error.message }, 'Could not verify force-join membership');
    return false;
  }
}

async function hasJoinedAll(ctx) {
  const checks = await Promise.all(config.forceJoin.map((item) => memberIsPresent(ctx, item.chatId)));
  return checks.length === 3 && checks.every(Boolean);
}

async function requireJoin(ctx) {
  if (!config.forceJoin.length || await hasJoinedAll(ctx)) return true;
  await ctx.reply(joinPrompt(config.botName, config.watermark), { parse_mode: 'HTML', reply_markup: forceJoinKeyboard(config.forceJoin) });
  await ctx.reply('When you are done, verify your membership:', { reply_markup: checkButton() });
  return false;
}

async function animatedReply(ctx, phone) {
  const frames = typingFrames(config.botName);
  const message = await ctx.reply(frames[0], { parse_mode: 'HTML' });
  for (const frame of frames.slice(1)) {
    await ctx.api.sendChatAction(ctx.chat.id, 'typing');
    await sleep(650);
    try { await ctx.api.editMessageText(ctx.chat.id, message.message_id, frame, { parse_mode: 'HTML' }); } catch {}
  }
  try {
    const result = await checkBan(phone, config);
    if (config.richMessagesEnabled) {
      try {
        await ctx.api.callApi('sendRichMessage', richReportPayload(ctx.chat.id, result, config.botName, config.watermark));
        await ctx.api.deleteMessage(ctx.chat.id, message.message_id).catch(() => {});
        return;
      } catch (richError) {
        log.warn({ err: richError.message }, 'Rich Message API unavailable; using HTML fallback');
      }
    }
    await ctx.api.editMessageText(ctx.chat.id, message.message_id, resultText(result, config.botName, config.watermark), { parse_mode: 'HTML' });
  } catch (error) {
    const explanation = error.code === 'ACCESS_DENIED'
      ? 'baron0 rejected this automated request (usually a Turnstile or rate-limit response). Try again later or configure an approved API endpoint.'
      : error.code === 'INVALID_PHONE' ? error.message : 'The ban-check service is temporarily unavailable. Please try again shortly.';
    await ctx.api.editMessageText(ctx.chat.id, message.message_id, `⚠️ <b>${config.botName}</b>\n\n${explanation}\n\n© ${config.watermark}`, { parse_mode: 'HTML' });
    log.error({ err: error.message, code: error.code }, 'Ban check failed');
  }
}

bot.command('start', async (ctx) => {
  await ctx.reply(welcomeText(config.botName, config.watermark), { parse_mode: 'HTML' });
  if (config.forceJoin.length) await ctx.reply('Join the required communities to unlock checking:', { reply_markup: forceJoinKeyboard(config.forceJoin) });
});
bot.command('help', async (ctx) => ctx.reply(welcomeText(config.botName, config.watermark), { parse_mode: 'HTML' }));

bot.callbackQuery('verify_join', async (ctx) => {
  await ctx.answerCallbackQuery();
  if (await hasJoinedAll(ctx)) {
    await ctx.reply(`✅ Membership verified. Send a number like <code>?+2348131225323</code>.\n\n© ${config.watermark}`, { parse_mode: 'HTML' });
  } else {
    await ctx.reply(joinPrompt(config.botName, config.watermark), { parse_mode: 'HTML', reply_markup: forceJoinKeyboard(config.forceJoin) });
  }
});
bot.callbackQuery('rich_try', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply('Send a WhatsApp number like <code>?+2348131225323</code>.', { parse_mode: 'HTML' });
});
bot.callbackQuery(/^rich_retry:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery({ text: 'Retrying ban check…' });
  const phone = normalizePhone(ctx.match[1]);
  if (isValidPhone(phone)) await animatedReply(ctx, phone);
});
bot.on('message', async (ctx, next) => {
  const message = ctx.message;
  if (message.forward_origin || message.forward_from || message.forward_from_chat) {
    const capture = {
      text: message.text || '',
      caption: message.caption || '',
      entities: message.entities || message.caption_entities || [],
      hasPhoto: Boolean(message.photo),
      hasDocument: Boolean(message.document),
      forwardOrigin: message.forward_origin || null,
    };
    await import('node:fs/promises').then(({ writeFile }) => writeFile('.forwarded-style.json', JSON.stringify(capture, null, 2), { mode: 0o600 }));
    log.info({ hasText: Boolean(capture.text), hasCaption: Boolean(capture.caption), hasPhoto: capture.hasPhoto }, 'Captured forwarded style reference locally');
  }
  await next();
});

bot.on('message:text', async (ctx) => {
  const parsed = parseCommand(ctx.message.text);
  if (!parsed) return;
  if (['start', 'help'].includes(parsed.command)) return;
  if (!['check', 'ban', 'status'].includes(parsed.command)) {
    return ctx.reply('Send only a prefix and WhatsApp number, for example <code>?+2348131225323</code>.', { parse_mode: 'HTML' });
  }
  if (!(await requireJoin(ctx))) return;
  const phone = normalizePhone(parsed.argument);
  if (!isValidPhone(phone)) return ctx.reply('📱 Send a valid international number. Example: <code>?+2348131225323</code>', { parse_mode: 'HTML' });
  await animatedReply(ctx, phone);
});

bot.catch((error) => {
  const ctx = error.ctx;
  const err = error.error;
  if (err instanceof GrammyError) log.error({ description: err.description, update: ctx.update.update_id }, 'Telegram API error');
  else if (err instanceof HttpError) log.error({ message: err.message }, 'Telegram network error');
  else log.error({ err }, 'Unhandled bot error');
});

process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());
log.info({ botName: config.botName, prefixes: config.prefixes, forceJoinButtons: config.forceJoin.length }, 'V-BAN-CHECKER starting');
bot.start({ onStart: (info) => log.info({ username: info.username }, 'Bot started') });
