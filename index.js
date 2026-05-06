const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const URL_REGEX = /https?:\/\/(?:[\w-]+\.)+[\w-]+(?:\/[^\s<>"']*)?/gi;
const MIN_LENGTH = 30; // Only shorten URLs longer than this

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment variables.');
  process.exit(1);
}

// --- Link shortener using TinyURL (no API key required) ---
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
      opt.setName('url')
        .setDescription('The URL to shorten')
        .setRequired(true)
    )
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

// --- Bot client ---
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

// --- Slash command handler ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'shorten') {
    const url = interaction.options.getString('url');
    try {
      new URL(url);
    } catch {
      return interaction.reply({ content: '❌ Invalid URL. Must start with http:// or https://', ephemeral: true });
    }

    await interaction.deferReply();
    try {
      const short = await shortenUrl(url);
      await interaction.editReply(`🔗 **Shortened:** ${short}\n📎 **Original:** <${url}>`);
    } catch {
      await interaction.editReply('❌ Failed to shorten the URL.');
    }
  }
});

// --- Webhook cache (one webhook per channel) ---
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

// --- Auto-shorten with webhook impersonation ---
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.guild) return; // skip DMs (no webhooks)

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
    await webhook.send({
      content: newContent,
      username: message.member?.displayName || message.author.username,
      avatarURL: message.author.displayAvatarURL({ extension: 'png', size: 256 }),
      allowedMentions: { parse: [] } // prevent ping abuse
    });
  } catch (err) {
    console.error('Auto-shorten error:', err);
  }
});

registerCommands().then(() => client.login(TOKEN));