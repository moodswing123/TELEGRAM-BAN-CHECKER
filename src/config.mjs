import 'dotenv/config';

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value || value === 'replace_me') throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const optional = (name, fallback) => process.env[name]?.trim() || fallback;

export function loadConfig({ requireToken = true } = {}) {
  const channel = optional('FORCE_JOIN_CHANNEL', '');
  const groupOne = optional('FORCE_JOIN_GROUP_ONE', '');
  const groupTwo = optional('FORCE_JOIN_GROUP_TWO', '');
  const forceJoin = [
    { label: '📣 Join Channel', chatId: channel, url: optional('FORCE_JOIN_CHANNEL_URL', '') },
    { label: '👥 Join Group 1', chatId: groupOne, url: optional('FORCE_JOIN_GROUP_ONE_URL', '') },
    { label: '👥 Join Group 2', chatId: groupTwo, url: optional('FORCE_JOIN_GROUP_TWO_URL', '') },
  ].filter((item) => item.chatId && item.url);

  return {
    botToken: requireToken ? required('BOT_TOKEN') : optional('BOT_TOKEN', ''),
    botName: optional('BOT_NAME', 'V-BAN-CHECKER'),
    watermark: optional('WATERMARK', 'Powered by Victory Tech™'),
    baronBaseUrl: optional('BARON_BASE_URL', 'https://baron0.com').replace(/\/$/, ''),
    baronApiUrl: optional('BAN_CHECKER_API_URL', optional('BARON_API_URL', '')),
    baronApiKey: optional('BARON_API_KEY', ''),
    baronTimeoutMs: Number(optional('BARON_TIMEOUT_MS', '20000')),
    prefixes: ['?', '/', '.'],
    forceJoin,
    ownerIds: optional('OWNER_IDS', '').split(',').map((id) => id.trim()).filter(Boolean),
  };
}
