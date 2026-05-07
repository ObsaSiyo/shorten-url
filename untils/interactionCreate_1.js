const shorten = require('../commands/shorten');
const undo = require('../commands/undo');

const commands = { shorten, u: undo };

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;
    const cmd = commands[interaction.commandName];
    if (cmd) await cmd.execute(interaction, client);
  }
};
