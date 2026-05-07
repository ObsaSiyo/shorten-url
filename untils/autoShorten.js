const { URL_REGEX, MIN_LENGTH } = require('../constants');
const { shortenUrl } = require('../utils/urlShortener');
const { getOrCreateWebhook } = require('../utils/webhookCache');
const { trackMessage } = require('../utils/messageTracker');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
  if (message.author.bot) return;
  if (!message.guild) return;

  const matches = message.content.match(URL_REGEX);
  if (!matches) return;

  const longUrls = matches.filter(u =>
    u.length > MIN_LENGTH &&
    !u.includes('tinyurl.com') &&
    !u.includes('bit.ly') &&
    !u.includes('t.co')
  );
  if (longUrls.length === 0) return;

  try {
    let newContent = message.content;
    for (const url of longUrls) {
      const short = await shortenUrl(url);
      newContent = newContent.split(url).join(short);
    }

    await message.delete();

    const webhook = await getOrCreateWebhook(client, message.channel);
    const sent = await webhook.send({
      content: newContent,
      username: message.member?.displayName || message.author.username,
      avatarURL: message.author.displayAvatarURL({ extension: 'png', size: 256 }),
      allowedMentions: { parse: [] }
    });

    trackMessage(message.channel.id, message.author.id, sent.id);
  } catch (err) {
    console.error('Auto-shorten error:', err);
  }
  }
};
