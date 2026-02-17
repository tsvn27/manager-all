import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { HostManager } from './managers/HostManager.js';
import { ConfigManager } from './managers/ConfigManager.js';
import { MonitorManager } from './managers/MonitorManager.js';
import { DiscloudProvider } from './providers/DiscloudProvider.js';
import { SquareCloudProvider } from './providers/SquareCloudProvider.js';
import { handleInteraction } from './handlers/interactions.js';
import * as panel from './commands/panel.js';
import * as deploy from './commands/deploy.js';

config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const hostManager = new HostManager();
const configManager = new ConfigManager();
const commands = new Collection();

[panel, deploy].forEach(cmd => {
  commands.set(cmd.data.name, cmd);
});

const discloudToken = configManager.getHostToken('discloud');
if (discloudToken && configManager.isHostEnabled('discloud')) {
  hostManager.addProvider(new DiscloudProvider(discloudToken));
}

const squarecloudToken = configManager.getHostToken('squarecloud');
if (squarecloudToken && configManager.isHostEnabled('squarecloud')) {
  hostManager.addProvider(new SquareCloudProvider(squarecloudToken));
}

let monitorManager: MonitorManager;

client.once('ready', async () => {
  console.log(`Bot online: ${client.user?.tag}`);
  
  monitorManager = new MonitorManager(client, hostManager, configManager);
  
  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
  
  try {
    console.log('Registrando comandos...');
    
    await rest.put(
      Routes.applicationCommands(client.user!.id),
      { body: Array.from(commands.values()).map(cmd => cmd.data.toJSON()) }
    );
    
    console.log('Comandos registrados');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, hostManager);
    } catch (error) {
      console.error(error);
      const reply = { content: 'Erro ao executar comando', ephemeral: true };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  } else {
    try {
      await handleInteraction(interaction, hostManager, configManager, monitorManager);
    } catch (error) {
      console.error(error);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
