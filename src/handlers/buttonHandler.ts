import { HostManager } from '../managers/HostManager.js';
import { ConfigManager } from '../managers/ConfigManager.js';
import { handleQuickview, handleManageApp, handleAppControl, handleLogs } from './appHandlers.js';
import { handleOpenConfig, handleManageHost, handleGlobalSettings, showConfigModal } from './configHandlers.js';
import { handleDashboard } from './dashboardHandlers.js';
import { handleBackMain, handleBackHost, handleBackApp } from './navigationHandlers.js';
import { handleMonitor, handleHistory, handleNotifications, handleSchedule, handleWebhooks, handleBackup } from './panelHandlers.js';

export async function handleButton(interaction: any, hostManager: HostManager, configManager: ConfigManager, monitorManager?: any, deployHistoryManager?: any, notificationManager?: any, migrationManager?: any, envManager?: any) {
  const [action, ...params] = interaction.customId.split('_');

  if (action === 'quickview') {
    return handleQuickview(interaction, hostManager, params);
  }
  
  if (action === 'manage' && params[0] === 'app') {
    return handleManageApp(interaction, hostManager, params);
  }
  
  if (action === 'start' || action === 'stop' || action === 'restart') {
    return handleAppControl(interaction, hostManager, action, params);
  }
  
  if (action === 'logs') {
    return handleLogs(interaction, hostManager, params);
  }
  
  if (action === 'open' && params[0] === 'config') {
    return handleOpenConfig(interaction, configManager);
  }
  
  if (action === 'config') {
    return handleConfigActions(interaction, configManager, params);
  }
  
  if (action === 'back') {
    return handleBackNavigation(interaction, hostManager, params);
  }
  
  if (action === 'open' && params[0] === 'dashboard') {
    return handleDashboard(interaction, hostManager);
  }
  
  if (action === 'open' && params[0] === 'monitor') {
    return handleMonitor(interaction, hostManager, monitorManager);
  }
  
  if (action === 'open' && params[0] === 'history') {
    return handleHistory(interaction, deployHistoryManager);
  }
  
  if (action === 'open' && params[0] === 'notifications') {
    return handleNotifications(interaction, notificationManager);
  }
  
  if (action === 'open' && params[0] === 'schedule') {
    return handleSchedule(interaction);
  }
  
  if (action === 'open' && params[0] === 'webhooks') {
    return handleWebhooks(interaction);
  }
  
  if (action === 'open' && params[0] === 'backup') {
    return handleBackup(interaction);
  }
}

async function handleConfigActions(interaction: any, configManager: ConfigManager, params: string[]) {
  if (params[0] === 'manage') {
    return handleManageHost(interaction, configManager, params[1]);
  }
  
  if (params[0] === 'global' && params[1] === 'settings') {
    return handleGlobalSettings(interaction, configManager);
  }
  
  if (params[0] === 'setup' || params[0] === 'edit') {
    return showConfigModal(interaction, params[1], params[0] === 'edit');
  }
  
  if (params[0] === 'toggle') {
    if (params[1] === 'autobackup') {
      const newState = configManager.toggleAutoBackup();
      return interaction.update({ content: `Backup automático ${newState ? 'ativado' : 'desativado'}` });
    }
    const newState = configManager.toggleHost(params[1]);
    return interaction.update({ content: `Host ${params[1]} ${newState ? 'ativada' : 'desativada'}` });
  }
  
  if (params[0] === 'remove') {
    configManager.removeHost(params[1]);
    return interaction.update({ content: `Configuração da host ${params[1]} removida` });
  }
}

async function handleBackNavigation(interaction: any, hostManager: HostManager, params: string[]) {
  if (params[0] === 'main') {
    return handleBackMain(interaction, hostManager);
  }
  
  if (params[0] === 'host') {
    return handleBackHost(interaction, hostManager, params[1]);
  }
  
  if (params[0] === 'app') {
    return handleBackApp(interaction, hostManager, params[1], params[2]);
  }
}
