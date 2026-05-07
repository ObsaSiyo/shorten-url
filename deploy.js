require('dotenv').config();
const { REST, Routes } = require('discord.js');
const path = require('path');
const fs = require('fs');

const commands = [];
const commandsDir = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'))) {
  const mod = require(path.join(commandsDir, file));
  if (mod.data) commands.push(mod.data.toJSON());
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  console.log(`Registering ${commands.length} slash commands...`);
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log('Done.');
})();
