const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { shortenUrl } = require('../utils/urlShortener');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shorten')
    .setDescription('Shorten a URL')
    .addStringOption(opt =>
      opt.setName('url').setDescription('The URL to shorten').setRequired(true)
    ),

  async execute(interaction) {
    const url = interaction.options.getString('url');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const short = await shortenUrl(url);
      await interaction.editReply({ content: `🔗 ${short}` });
    } catch (err) {
      console.error('Shorten error:', err);
      await interaction.editReply({ content: '❌ Failed to shorten URL.' });
    }
  }
};
