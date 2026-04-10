import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];
const commandFolders = readdirSync(join(__dirname, 'commands'));

for (const folder of commandFolders) {
  const commandFiles = readdirSync(join(__dirname, 'commands', folder)).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = pathToFileURL(join(__dirname, 'commands', folder, file)).href;
    const command = await import(filePath);
    if ('data' in command.default && 'execute' in command.default) {
      commands.push(command.default.data.toJSON());
    }
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
  console.log(chalk.yellow(`📤  Deploying ${commands.length} application commands...`));
  const data = await rest.put(
    Routes.applicationGuildCommands(
      (await rest.get(Routes.user())).id,
      process.env.GUILD_ID
    ),
    { body: commands }
  );
  console.log(chalk.green.bold(`✅  Successfully deployed ${data.length} application commands!`));
} catch (error) {
  console.error(chalk.red('❌  Deploy failed:'), error);
}
