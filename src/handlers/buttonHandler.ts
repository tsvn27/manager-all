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
  
  if (action === 'monitor') {
    return handleMonitorActions(interaction, monitorManager, params);
  }
  
  if (action === 'open' && params[0] === 'history') {
    return handleHistory(interaction, deployHistoryManager);
  }
  
  if (action === 'history') {
    return handleHistoryActions(interaction, deployHistoryManager, params);
  }
  
  if (action === 'open' && params[0] === 'notifications') {
    return handleNotifications(interaction, notificationManager);
  }
  
  if (action === 'notif') {
    return handleNotificationActions(interaction, notificationManager, params);
  }
  
  if (action === 'open' && params[0] === 'schedule') {
    return handleSchedule(interaction);
  }
  
  if (action === 'schedule') {
    return handleScheduleActions(interaction, params);
  }
  
  if (action === 'open' && params[0] === 'webhooks') {
    return handleWebhooks(interaction);
  }
  
  if (action === 'webhook') {
    return handleWebhookActions(interaction, params);
  }
  
  if (action === 'open' && params[0] === 'backup') {
    return handleBackup(interaction);
  }
  
  if (action === 'backup') {
    return handleBackupActions(interaction, params);
  }
}

async function handleConfigActions(interaction: any, configManager: ConfigManager, params: string[]) {
  if (params[0] === 'add' && params[1] === 'host') {
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
    
    const modal = new ModalBuilder()
      .setCustomId('config_addhost_modal')
      .setTitle('Adicionar Nova Host');

    const nameInput = new TextInputBuilder()
      .setCustomId('host_name')
      .setLabel('Nome da Host')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: meuhost')
      .setRequired(true);

    const displayInput = new TextInputBuilder()
      .setCustomId('display_name')
      .setLabel('Nome de Exibição')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Meu Host')
      .setRequired(true);

    const apiInput = new TextInputBuilder()
      .setCustomId('api_url')
      .setLabel('URL da API')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://api.exemplo.com')
      .setRequired(true);

    const row1 = new ActionRowBuilder<any>().addComponents(nameInput);
    const row2 = new ActionRowBuilder<any>().addComponents(displayInput);
    const row3 = new ActionRowBuilder<any>().addComponents(apiInput);
    
    modal.addComponents(row1, row2, row3);

    return interaction.showModal(modal);
  }
  
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
      return handleGlobalSettings(interaction, configManager);
    }
    const newState = configManager.toggleHost(params[1]);
    return handleManageHost(interaction, configManager, params[1]);
  }
  
  if (params[0] === 'remove') {
    configManager.removeHost(params[1]);
    return handleOpenConfig(interaction, configManager);
  }
  
  if (params[0] === 'edit' && params[1] === 'maxbackups') {
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
    
    const modal = new ModalBuilder()
      .setCustomId('config_maxbackups_modal')
      .setTitle('Editar Máximo de Backups');

    const valueInput = new TextInputBuilder()
      .setCustomId('value')
      .setLabel('Número Máximo de Backups')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('5')
      .setRequired(true);

    const row = new ActionRowBuilder<any>().addComponents(valueInput);
    modal.addComponents(row);

    return interaction.showModal(modal);
  }
  
  if (params[0] === 'edit' && params[1] === 'retention') {
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
    
    const modal = new ModalBuilder()
      .setCustomId('config_retention_modal')
      .setTitle('Editar Retenção de Backups');

    const valueInput = new TextInputBuilder()
      .setCustomId('value')
      .setLabel('Dias de Retenção')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('30')
      .setRequired(true);

    const row = new ActionRowBuilder<any>().addComponents(valueInput);
    modal.addComponents(row);

    return interaction.showModal(modal);
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

async function handleMonitorActions(interaction: any, monitorManager: any, params: string[]) {
  if (params[0] === 'add') {
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
    
    const modal = new ModalBuilder()
      .setCustomId('monitor_add_modal')
      .setTitle('Adicionar Monitoramento');

    const hostInput = new TextInputBuilder()
      .setCustomId('host_name')
      .setLabel('Nome da Host')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('squarecloud')
      .setRequired(true);

    const appInput = new TextInputBuilder()
      .setCustomId('app_id')
      .setLabel('ID do App')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('abc123')
      .setRequired(true);

    const channelInput = new TextInputBuilder()
      .setCustomId('channel_id')
      .setLabel('ID do Canal para Notificações')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789')
      .setRequired(true);

    const row1 = new ActionRowBuilder<any>().addComponents(hostInput);
    const row2 = new ActionRowBuilder<any>().addComponents(appInput);
    const row3 = new ActionRowBuilder<any>().addComponents(channelInput);
    
    modal.addComponents(row1, row2, row3);

    await interaction.showModal(modal);
  }
}

async function handleHistoryActions(interaction: any, deployHistoryManager: any, params: string[]) {
  if (params[0] === 'view') {
    const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = await import('discord.js');
    
    const deployId = params[1];
    if (!deployHistoryManager) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('Histórico não disponível')
        );
      return interaction.reply({ 
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true 
      });
    }

    const deploy = deployHistoryManager.getDeployById(deployId);
    if (!deploy) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('Deploy não encontrado')
        );
      return interaction.reply({ 
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true 
      });
    }

    const date = new Date(deploy.timestamp);
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# Detalhes do Deploy`)
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Host:** ${deploy.hostName}`),
        new TextDisplayBuilder().setContent(`**App ID:** \`${deploy.appId}\``),
        new TextDisplayBuilder().setContent(`**Arquivo:** ${deploy.fileName}`),
        new TextDisplayBuilder().setContent(`**Status:** ${deploy.status === 'success' ? 'Sucesso ✓' : 'Falhou ✗'}`),
        new TextDisplayBuilder().setContent(`**Data:** ${date.toLocaleString('pt-BR')}`),
        new TextDisplayBuilder().setContent(`**Usuário:** <@${deploy.userId}>`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Mensagem:**\n${deploy.message}`)
      );

    const row = new ActionRowBuilder<any>().addComponents(
      new ButtonBuilder()
        .setCustomId('open_history')
        .setLabel('Voltar')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ 
      components: [container, row],
      flags: MessageFlags.IsComponentsV2
    });
  }
}

async function handleNotificationActions(interaction: any, notificationManager: any, params: string[]) {
  const { handleNotifications } = await import('./panelHandlers.js');
  
  if (params[0] === 'toggle') {
    const eventType = params[1] as any;
    if (!notificationManager) {
      return interaction.update({ 
        components: [new (await import('discord.js')).TextDisplayBuilder().setContent('Notificações não disponíveis')],
        flags: (await import('discord.js')).MessageFlags.IsComponentsV2
      });
    }

    notificationManager.toggleEvent(interaction.user.id, eventType);
    return handleNotifications(interaction, notificationManager);
  } else if (params[0] === 'method') {
    if (!notificationManager) {
      return interaction.update({ 
        components: [new (await import('discord.js')).TextDisplayBuilder().setContent('Notificações não disponíveis')],
        flags: (await import('discord.js')).MessageFlags.IsComponentsV2
      });
    }

    const settings = notificationManager.getUserSettings(interaction.user.id);
    const newMethod = settings.method === 'dm' ? 'channel' : 'dm';
    notificationManager.setUserSettings(interaction.user.id, { method: newMethod });
    return handleNotifications(interaction, notificationManager);
  }
}

async function handleScheduleActions(interaction: any, params: string[]) {
  const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = await import('discord.js');
  
  if (params[0] === 'add') {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Funcionalidade de agendamento em desenvolvimento')
      );

    await interaction.update({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
}

async function handleWebhookActions(interaction: any, params: string[]) {
  const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = await import('discord.js');
  
  if (params[0] === 'add') {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Funcionalidade de webhooks em desenvolvimento')
      );

    await interaction.update({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
}

async function handleBackupActions(interaction: any, params: string[]) {
  const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = await import('discord.js');
  
  if (params[0] === 'create') {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Funcionalidade de backup em desenvolvimento')
      );

    await interaction.update({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
}
