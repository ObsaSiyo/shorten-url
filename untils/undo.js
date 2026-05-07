const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { popLastMessage } = require('../utils/messageTracker');
const { getOrCreateWebhook } = require('../utils/webhookCache');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('u')
    .setDescription('Delete your most recent bot-shortened message in this channel'),

  async execute(interaction, client) {
    const messageId = popLastMessage(interaction.channelId, interaction.user.id);
    if (!messageId) {
      return interaction.reply({
        content: '❌ No recent shortened messages to undo in this channel.',
        flags: MessageFlags.Ephemeral
      });
    }
    try {
      const webhook = await getOrCreateWebhook(client, interaction.channel);
      await webhook.deleteMessage(messageId);
      await interaction.reply({ content: '✅ Removed your last shortened message.', flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('Undo error:', err);
      await interaction.reply({ content: '❌ Could not delete the message (already gone?).', flags: MessageFlags.Ephemeral });
    }
  }
};