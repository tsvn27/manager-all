import { Client, GatewayIntentBits, Collection, REST, Routes, TextDisplayBuilder, ContainerBuilder, MessageFlags } from 'discord.js';
import { config } from 'dotenv';
import { HostManager } from './managers/HostManager.js';
import { ConfigManager } from './managers/ConfigManager.js';
import { MonitorManager } from './managers/MonitorManager.js';
import { DeployHistoryManager } from './managers/DeployHistoryManager.js';
import { NotificationManager } from './managers/NotificationManager.js';
import { MigrationManager } from './managers/MigrationManager.js';
import { EnvManager } from './managers/EnvManager.js';
import { PermissionManager } from './managers/PermissionManager.js';
import { SchedulerManager } from './managers/SchedulerManager.js';
import { WebhookManager } from './managers/WebhookManager.js';
import { BackupManager } from './managers/BackupManager.js';
import { PlanManager } from './managers/PlanManager.js';
import { CustomerManager } from './managers/CustomerManager.js';
import { PaymentManager } from './managers/PaymentManager.js';
import { DiscloudProvider } from './providers/DiscloudProvider.js';
import { SquareCloudProvider } from './providers/SquareCloudProvider.js';
import { SparkedHostProvider } from './providers/SparkedHostProvider.js';
import { RailwayProvider } from './providers/RailwayProvider.js';
import { ReplitProvider } from './providers/ReplitProvider.js';
import { ShardCloudProvider } from './providers/ShardCloudProvider.js';
import { handleInteraction } from './handlers/interactions.js';
import * as panel from './commands/panel.js';
import * as deploy from './commands/deploy.js';
import * as app from './commands/app.js';
import * as planos from './commands/planos.js';

config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const hostManager = new HostManager();
const configManager = new ConfigManager();
const deployHistoryManager = new DeployHistoryManager();
const envManager = new EnvManager();
const permissionManager = new PermissionManager();
const schedulerManager = new SchedulerManager();
const webhookManager = new WebhookManager();
const backupManager = new BackupManager();
const planManager = new PlanManager();
const customerManager = new CustomerManager();
const paymentManager = new PaymentManager();
const commands = new Collection();

[panel, deploy, app, planos].forEach(cmd => {
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

const sparkedhostToken = configManager.getHostToken('sparkedhost');
if (sparkedhostToken && configManager.isHostEnabled('sparkedhost')) {
  hostManager.addProvider(new SparkedHostProvider(sparkedhostToken));
}

const railwayToken = configManager.getHostToken('railway');
if (railwayToken && configManager.isHostEnabled('railway')) {
  hostManager.addProvider(new RailwayProvider(railwayToken));
}

const replitToken = configManager.getHostToken('replit');
if (replitToken && configManager.isHostEnabled('replit')) {
  hostManager.addProvider(new ReplitProvider(replitToken));
}

const shardcloudToken = configManager.getHostToken('shardcloud');
if (shardcloudToken && configManager.isHostEnabled('shardcloud')) {
  hostManager.addProvider(new ShardCloudProvider(shardcloudToken));
}

let monitorManager: MonitorManager;
let notificationManager: NotificationManager;
let migrationManager: MigrationManager;

client.once('ready', async () => {
  console.log(`Bot online: ${client.user?.tag}`);
  
  monitorManager = new MonitorManager(client, hostManager, configManager);
  notificationManager = new NotificationManager(client);
  migrationManager = new MigrationManager(hostManager);
  
  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
  
  try {
    console.log('Limpando comandos antigos...');
    
    await rest.put(
      Routes.applicationCommands(client.user!.id),
      { body: [] }
    );
    
    console.log('Comandos antigos removidos');
    console.log('Registrando comandos...');
    
    await rest.put(
      Routes.applicationCommands(client.user!.id),
      { body: Array.from(commands.values()).map((cmd: any) => cmd.data.toJSON()) }
    );
    
    console.log('Comandos registrados');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command: any = commands.get(interaction.commandName);
    if (!command) return;

    try {
      const userRoles = interaction.member?.roles && typeof interaction.member.roles !== 'string' && !Array.isArray(interaction.member.roles)
        ? Array.from(interaction.member.roles.cache.keys())
        : [];
      
      if (!permissionManager.hasPermission(interaction.user.id, userRoles, interaction.commandName)) {
        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('🚫 Você não tem permissão para usar este comando.')
          );
        
        return interaction.reply({ 
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          ephemeral: true 
        });
      }

      if (interaction.commandName === 'deploy') {
        await command.execute(interaction, hostManager, deployHistoryManager, notificationManager, envManager);
      } else if (interaction.commandName === 'app') {
        await command.execute(interaction, customerManager, configManager);
      } else if (interaction.commandName === 'planos') {
        await command.execute(interaction, planManager);
      } else {
        await command.execute(interaction, hostManager);
      }
    } catch (error: any) {
      console.error(error);
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`❌ Erro ao executar comando: ${error.message || 'Erro desconhecido'}`)
        );
      
      const reply: any = { 
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true 
      };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  } else {
    try {
      await handleInteraction(interaction, hostManager, configManager, monitorManager, deployHistoryManager, notificationManager, migrationManager, envManager, permissionManager, schedulerManager, webhookManager, backupManager, planManager, customerManager, paymentManager);
    } catch (error: any) {
      console.error(error);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
