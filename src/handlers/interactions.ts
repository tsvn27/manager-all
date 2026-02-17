import { Interaction } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';
import { ConfigManager } from '../managers/ConfigManager.js';
import { DeployHistoryManager } from '../managers/DeployHistoryManager.js';
import { NotificationManager } from '../managers/NotificationManager.js';
import { MigrationManager } from '../managers/MigrationManager.js';
import { EnvManager } from '../managers/EnvManager.js';
import { PermissionManager } from '../managers/PermissionManager.js';
import { handleSelectMenu } from './selectMenuHandler.js';
import { handleButton } from './buttonHandler.js';
import { handleModal } from './modalHandler.js';

export async function handleInteraction(
  interaction: Interaction, 
  hostManager: HostManager, 
  configManager: ConfigManager, 
  monitorManager?: any, 
  deployHistoryManager?: DeployHistoryManager, 
  notificationManager?: NotificationManager, 
  migrationManager?: MigrationManager, 
  envManager?: EnvManager,
  permissionManager?: PermissionManager,
  schedulerManager?: any,
  webhookManager?: any,
  backupManager?: any
) {
  if (interaction.isStringSelectMenu()) {
    await handleSelectMenu(interaction, hostManager, monitorManager, migrationManager, configManager, deployHistoryManager, notificationManager, envManager);
  } else if (interaction.isButton()) {
    await handleButton(interaction, hostManager, configManager, monitorManager, deployHistoryManager, notificationManager, migrationManager, envManager, schedulerManager, webhookManager, backupManager);
  } else if (interaction.isModalSubmit()) {
    await handleModal(interaction, hostManager, configManager, monitorManager, deployHistoryManager, notificationManager, migrationManager, envManager, schedulerManager, webhookManager, backupManager);
  }
}
