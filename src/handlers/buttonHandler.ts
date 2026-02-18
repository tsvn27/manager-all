import { HostManager } from '../managers/HostManager.js';
import { ConfigManager } from '../managers/ConfigManager.js';
import { handleOpenConfig, handleManageHost, handleGlobalSettings, showConfigModal } from './configHandlers.js';
import { handleDashboard } from './dashboardHandlers.js';
import { handleBackMain, handleBackHost, handleBackApp } from './navigationHandlers.js';
import { handleMonitor, handleHistory, handleNotifications, handleSchedule, handleWebhooks, handleBackup } from './panelHandlers.js';

export async function handleButton(interaction: any, hostManager: HostManager, configManager: ConfigManager, monitorManager?: any, deployHistoryManager?: any, notificationManager?: any, migrationManager?: any, envManager?: any, schedulerManager?: any, webhookManager?: any, backupManager?: any, planManager?: any, customerManager?: any, paymentManager?: any) {
  const [action, ...params] = interaction.customId.split('_');

  if (action === 'my' && params[0] === 'apps') {
    const { handleMyApps } = await import('./appHandlers.js');
    return handleMyApps(interaction, customerManager, configManager);
  }

  if (action === 'view' && params[0] === 'plans') {
    const { handleViewPlans } = await import('./appHandlers.js');
    return handleViewPlans(interaction, planManager, paymentManager);
  }

  if (action === 'plans' && params[0] === 'panel') {
    const { handlePlansPanel } = await import('./planHandlers.js');
    return handlePlansPanel(interaction, planManager);
  }
  
  if (action === 'plan') {
    const { handleManagePlan, showPlanModal, handleTogglePlan, handleDeletePlan } = await import('./planHandlers.js');
    if (params[0] === 'manage') return handleManagePlan(interaction, planManager, params[1]);
    if (params[0] === 'add') return showPlanModal(interaction, false);
    if (params[0] === 'edit') return showPlanModal(interaction, true, params[1]);
    if (params[0] === 'toggle') return handleTogglePlan(interaction, planManager, params[1]);
    if (params[0] === 'delete') return handleDeletePlan(interaction, planManager, params[1]);
    if (params[0] === 'buy') {
      const { handlePlanPurchase } = await import('./appHandlers.js');
      return handlePlanPurchase(interaction, planManager, paymentManager, params[1]);
    }
  }
  
  if (action === 'payments' && params[0] === 'panel') {
    const { handlePaymentsPanel } = await import('./paymentHandlers.js');
    return handlePaymentsPanel(interaction, paymentManager);
  }
  
  if (action === 'payment') {
    const { handleManagePayment, showPaymentModal, handleTogglePayment, handleDeletePayment } = await import('./paymentHandlers.js');
    if (params[0] === 'manage') return handleManagePayment(interaction, paymentManager, params[1]);
    if (params[0] === 'add') return showPaymentModal(interaction, false);
    if (params[0] === 'edit') return showPaymentModal(interaction, true, params[1]);
    if (params[0] === 'toggle') return handleTogglePayment(interaction, paymentManager, params[1]);
    if (params[0] === 'delete') return handleDeletePayment(interaction, paymentManager, params[1]);
  }
  
  if (action === 'customers' && params[0] === 'panel') {
    const { handleCustomersPanel } = await import('./customerHandlers.js');
    return handleCustomersPanel(interaction, customerManager, planManager);
  }
  
  if (action === 'customer' && params[0] === 'view') {
    const { handleViewCustomer } = await import('./customerHandlers.js');
    return handleViewCustomer(interaction, customerManager, planManager, params[1]);
  }
  
  if (action === 'app') {
    if (params[0] === 'manage') {
      const { handleManageApp } = await import('./appHandlers.js');
      return handleManageApp(interaction, customerManager, configManager, params[1]);
    }
    
    const { handleAppStart, handleAppStop, handleAppRestart, handleAppLogs, handleAppStatus, handleAppToggleAutoRenew, showTransferModal, handleMyApps } = await import('./appHandlers.js');
    if (params[0] === 'start') return handleAppStart(interaction, customerManager, configManager, params[1]);
    if (params[0] === 'stop') return handleAppStop(interaction, customerManager, configManager, params[1]);
    if (params[0] === 'restart') return handleAppRestart(interaction, customerManager, configManager, params[1]);
    if (params[0] === 'logs') return handleAppLogs(interaction, customerManager, configManager, params[1]);
    if (params[0] === 'status') return handleAppStatus(interaction, customerManager, configManager, params[1]);
    if (params[0] === 'toggle' && params[1] === 'autorenew') return handleAppToggleAutoRenew(interaction, customerManager, params[2]);
    if (params[0] === 'transfer') return showTransferModal(interaction, params[1]);
    if (params[0] === 'back') return handleMyApps(interaction, customerManager, configManager);
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
    return handleSchedule(interaction, schedulerManager);
  }
  
  if (action === 'schedule') {
    return handleScheduleActions(interaction, schedulerManager, params);
  }
  
  if (action === 'open' && params[0] === 'webhooks') {
    return handleWebhooks(interaction, webhookManager);
  }
  
  if (action === 'webhook') {
    return handleWebhookActions(interaction, webhookManager, params);
  }
  
  if (action === 'open' && params[0] === 'backup') {
    return handleBackup(interaction, backupManager);
  }
  
  if (action === 'backup') {
    return handleBackupActions(interaction, backupManager, params);
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
  
  if (params[0] === 'manage') {
    const hostName = params[1];
    const appId = params[2];
    
    if (!monitorManager) {
      return interaction.update({ 
        components: [new (await import('discord.js')).TextDisplayBuilder().setContent('Monitoramento não disponível')],
        flags: (await import('discord.js')).MessageFlags.IsComponentsV2
      });
    }

    const isMonitoring = monitorManager.isMonitoring(hostName, appId);
    const autoRestart = monitorManager.getAutoRestartStatus(hostName, appId);

    const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = await import('discord.js');

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# Gerenciar Monitoramento`),
        new TextDisplayBuilder().setContent(`**Host:** ${hostName}\n**App ID:** \`${appId}\``)
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Status:** ${isMonitoring ? '🟢 Ativo' : '🔴 Inativo'}`),
        new TextDisplayBuilder().setContent(`**Auto-restart:** ${autoRestart ? '✅ Ativado' : '❌ Desativado'}`)
      );

    const toggleRestartBtn = new ButtonBuilder()
      .setCustomId(`monitor_toggle_restart_${hostName}_${appId}`)
      .setLabel(autoRestart ? 'Desativar Auto-restart' : 'Ativar Auto-restart')
      .setStyle(autoRestart ? ButtonStyle.Danger : ButtonStyle.Success);

    const removeBtn = new ButtonBuilder()
      .setCustomId(`monitor_remove_${hostName}_${appId}`)
      .setLabel('Remover Monitoramento')
      .setStyle(ButtonStyle.Danger);

    const actionRow = new ActionRowBuilder<any>()
      .addComponents(toggleRestartBtn, removeBtn);

    container.addActionRowComponents(actionRow);

    const backBtn = new ButtonBuilder()
      .setCustomId('open_monitor')
      .setLabel('Voltar')
      .setStyle(ButtonStyle.Secondary);

    const backRow = new ActionRowBuilder<any>().addComponents(backBtn);

    await interaction.update({ 
      components: [container, backRow],
      flags: MessageFlags.IsComponentsV2
    });
  }
  
  if (params[0] === 'toggle' && params[1] === 'restart') {
    const hostName = params[2];
    const appId = params[3];
    
    if (!monitorManager) {
      return interaction.update({ 
        components: [new (await import('discord.js')).TextDisplayBuilder().setContent('Monitoramento não disponível')],
        flags: (await import('discord.js')).MessageFlags.IsComponentsV2
      });
    }

    monitorManager.toggleAutoRestart(hostName, appId);
    
    interaction.customId = `monitor_manage_${hostName}_${appId}`;
    return handleMonitorActions(interaction, monitorManager, ['manage', hostName, appId]);
  }
  
  if (params[0] === 'remove') {
    const hostName = params[1];
    const appId = params[2];
    
    if (!monitorManager) {
      return interaction.update({ 
        components: [new (await import('discord.js')).TextDisplayBuilder().setContent('Monitoramento não disponível')],
        flags: (await import('discord.js')).MessageFlags.IsComponentsV2
      });
    }

    monitorManager.stopMonitoring(hostName, appId);
    
    const { handleMonitor } = await import('./panelHandlers.js');
    return handleMonitor(interaction, null, monitorManager);
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

async function handleScheduleActions(interaction: any, schedulerManager: any, params: string[]) {
  if (params[0] === 'add') {
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
    
    const modal = new ModalBuilder()
      .setCustomId('schedule_add_modal')
      .setTitle('Agendar Deploy');

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

    const fileInput = new TextInputBuilder()
      .setCustomId('file_path')
      .setLabel('Caminho do Arquivo')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('./app.zip')
      .setRequired(true);

    const timeInput = new TextInputBuilder()
      .setCustomId('scheduled_time')
      .setLabel('Data/Hora (DD/MM/YYYY HH:MM)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('25/12/2024 15:30')
      .setRequired(true);

    const recurringInput = new TextInputBuilder()
      .setCustomId('recurring')
      .setLabel('Recorrência (daily/weekly/monthly ou vazio)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('daily')
      .setRequired(false);

    const row1 = new ActionRowBuilder<any>().addComponents(hostInput);
    const row2 = new ActionRowBuilder<any>().addComponents(appInput);
    const row3 = new ActionRowBuilder<any>().addComponents(fileInput);
    const row4 = new ActionRowBuilder<any>().addComponents(timeInput);
    const row5 = new ActionRowBuilder<any>().addComponents(recurringInput);
    
    modal.addComponents(row1, row2, row3, row4, row5);

    await interaction.showModal(modal);
  }
  
  if (params[0] === 'cancel') {
    if (!schedulerManager) {
      return interaction.update({ 
        components: [new (await import('discord.js')).TextDisplayBuilder().setContent('Agendamentos não disponíveis')],
        flags: (await import('discord.js')).MessageFlags.IsComponentsV2
      });
    }

    const scheduleId = params[1];
    const success = schedulerManager.cancelSchedule(scheduleId);
    
    const { handleSchedule } = await import('./panelHandlers.js');
    return handleSchedule(interaction, schedulerManager);
  }
}

async function handleWebhookActions(interaction: any, webhookManager: any, params: string[]) {
  if (params[0] === 'add') {
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
    
    const modal = new ModalBuilder()
      .setCustomId('webhook_add_modal')
      .setTitle('Adicionar Webhook');

    const urlInput = new TextInputBuilder()
      .setCustomId('webhook_url')
      .setLabel('URL do Webhook')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://exemplo.com/webhook')
      .setRequired(true);

    const eventsInput = new TextInputBuilder()
      .setCustomId('events')
      .setLabel('Eventos (separados por vírgula)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('deploy,statusChange,crash')
      .setRequired(true);

    const row1 = new ActionRowBuilder<any>().addComponents(urlInput);
    const row2 = new ActionRowBuilder<any>().addComponents(eventsInput);
    
    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
  }
  
  if (params[0] === 'toggle') {
    if (!webhookManager) {
      return interaction.update({ 
        components: [new (await import('discord.js')).TextDisplayBuilder().setContent('Webhooks não disponíveis')],
        flags: (await import('discord.js')).MessageFlags.IsComponentsV2
      });
    }

    const webhookId = params[1];
    webhookManager.toggleWebhook(webhookId);
    
    const { handleWebhooks } = await import('./panelHandlers.js');
    return handleWebhooks(interaction, webhookManager);
  }
  
  if (params[0] === 'remove') {
    if (!webhookManager) {
      return interaction.update({ 
        components: [new (await import('discord.js')).TextDisplayBuilder().setContent('Webhooks não disponíveis')],
        flags: (await import('discord.js')).MessageFlags.IsComponentsV2
      });
    }

    const webhookId = params[1];
    webhookManager.removeWebhook(webhookId);
    
    const { handleWebhooks } = await import('./panelHandlers.js');
    return handleWebhooks(interaction, webhookManager);
  }
}

async function handleBackupActions(interaction: any, backupManager: any, params: string[]) {
  if (params[0] === 'create') {
    if (!backupManager) {
      return interaction.update({ 
        components: [new (await import('discord.js')).TextDisplayBuilder().setContent('Backups não disponíveis')],
        flags: (await import('discord.js')).MessageFlags.IsComponentsV2
      });
    }

    await interaction.deferUpdate();
    
    const result = await backupManager.createBackup();
    
    const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = await import('discord.js');
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(result.message)
      );

    await interaction.editReply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
    
    setTimeout(async () => {
      const { handleBackup } = await import('./panelHandlers.js');
      await handleBackup(interaction, backupManager);
    }, 2000);
  }
  
  if (params[0] === 'restore') {
    if (!backupManager) {
      return interaction.update({ 
        components: [new (await import('discord.js')).TextDisplayBuilder().setContent('Backups não disponíveis')],
        flags: (await import('discord.js')).MessageFlags.IsComponentsV2
      });
    }

    await interaction.deferUpdate();
    
    const backupId = params[1];
    const result = await backupManager.restoreBackup(backupId);
    
    const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = await import('discord.js');
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(result.message)
      );

    await interaction.editReply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
  
  if (params[0] === 'delete') {
    if (!backupManager) {
      return interaction.update({ 
        components: [new (await import('discord.js')).TextDisplayBuilder().setContent('Backups não disponíveis')],
        flags: (await import('discord.js')).MessageFlags.IsComponentsV2
      });
    }

    const backupId = params[1];
    backupManager.deleteBackup(backupId);
    
    const { handleBackup } = await import('./panelHandlers.js');
    return handleBackup(interaction, backupManager);
  }
}
