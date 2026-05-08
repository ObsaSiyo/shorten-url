require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const URL_REGEX = /https?:\/\/(?!(?:[\w-]+\.)*(?:cdn\.discordapp\.com|media\.discordapp\.net|tenor\.com|giphy\.com|c\.tenor\.com|i\.giphy\.com)(?:\/|\s|$))(?:[\w-]+\.)+[\w-]+(?:\/[^\s<>"']*)?/gi;
const MIN_LENGTH = 30;

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in environment variables.');
  process.exit(1);
}

// --- Link shortener using TinyURL ---
async function shortenUrl(url) {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('TinyURL request failed');
  const short = await res.text();
  if (!short.startsWith('http')) throw new Error('Invalid response from TinyURL');
  return short.trim();
}

// --- Register slash commands ---
const commands = [
  new SlashCommandBuilder()
    .setName('shorten')
    .setDescription('Shorten a URL using TinyURL')
    .addStringOption(opt =>
      opt.setName('url').setDescription('The URL to shorten').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('u')
    .setDescription('Delete your most recent bot-shortened message in this channel')
].map(c => c.toJSON());

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('Registering slash commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Slash commands registered.');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// --- Webhook cache ---
const webhookCache = new Map();

async function getOrCreateWebhook(channel) {
  if (webhookCache.has(channel.id)) return webhookCache.get(channel.id);
  const webhooks = await channel.fetchWebhooks();
  let webhook = webhooks.find(w => w.name === 'LinkShortener' && w.owner?.id === client.user.id);
  if (!webhook) {
    webhook = await channel.createWebhook({
      name: 'LinkShortener',
      reason: 'Auto-shorten link impersonation'
    });
  }
  webhookCache.set(channel.id, webhook);
  return webhook;
}

// --- Track shortened messages: { channelId: { userId: [messageIds] } } ---
const shortenedMessages = new Map();

function trackMessage(channelId, userId, messageId) {
  if (!shortenedMessages.has(channelId)) shortenedMessages.set(channelId, new Map());
  const channelMap = shortenedMessages.get(channelId);
  if (!channelMap.has(userId)) channelMap.set(userId, []);
  channelMap.get(userId).push(messageId);
  const arr = channelMap.get(userId);
  if (arr.length > 20) arr.shift();
}

function popLastMessage(channelId, userId) {
  const channelMap = shortenedMessages.get(channelId);
  if (!channelMap) return null;
  const arr = channelMap.get(userId);
  if (!arr || arr.length === 0) return null;
  return arr.pop();
}

// --- Slash command handler ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // /shorten
  if (interaction.commandName === 'shorten') {
    const url = interaction.options.getString('url');
    try { new URL(url); } catch {
      return interaction.reply({ content: '❌ Invalid URL.', flags: MessageFlags.Ephemeral });
    }
    await interaction.deferReply();
    try {
      const short = await shortenUrl(url);
      await interaction.editReply(`🔗 **Shortened:** ${short}\n📎 **Original:** <${url}>`);
    } catch {
      await interaction.editReply('❌ Failed to shorten the URL.');
    }
    return;
  }

  // /u
  if (interaction.commandName === 'u') {
    const messageId = popLastMessage(interaction.channelId, interaction.user.id);
    if (!messageId) {
      return interaction.reply({
        content: '❌ No recent shortened messages to undo in this channel.',
        flags: MessageFlags.Ephemeral
      });
    }
    try {
      const webhook = await getOrCreateWebhook(interaction.channel);
      await webhook.deleteMessage(messageId);
      await interaction.reply({
        content: '✅ Removed your last shortened message.',
        flags: MessageFlags.Ephemeral
      });
    } catch (err) {
      console.error('Undo error:', err);
      await interaction.reply({
        content: '❌ Could not delete the message (already gone?).',
        flags: MessageFlags.Ephemeral
      });
    }
    return;
  }
});

// --- Auto-shorten with webhook impersonation ---
client.on('messageCreate', async message => {
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

    const webhook = await getOrCreateWebhook(message.channel);
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
});

registerCommands().then(() => client.login(TOKEN));