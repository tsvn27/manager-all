import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';
import { ConfigManager } from '../managers/ConfigManager.js';

export async function handleModal(interaction: any, hostManager: HostManager, configManager: ConfigManager, monitorManager?: any, deployHistoryManager?: any, notificationManager?: any, migrationManager?: any, envManager?: any, schedulerManager?: any, webhookManager?: any, backupManager?: any, planManager?: any, customerManager?: any, paymentManager?: any) {
  const [action, type, hostName] = interaction.customId.split('_');

  if (action === 'send' && type === 'plans' && hostName === 'submit') {
    const { handleSendPlansSubmit } = await import('./sendHandlers.js');
    return handleSendPlansSubmit(interaction, planManager);
  }

  if (action === 'send' && type === 'app' && hostName === 'submit') {
    const { handleSendAppSubmit } = await import('./sendHandlers.js');
    return handleSendAppSubmit(interaction, customerManager, planManager);
  }

  if (action === 'plan' && type === 'add' && hostName === 'modal') {
    const { handlePlanModal } = await import('./planHandlers.js');
    return handlePlanModal(interaction, planManager, false);
  }

  if (action === 'plan' && type === 'edit' && hostName === 'modal') {
    const planId = interaction.customId.split('_')[3];
    const { handlePlanModal } = await import('./planHandlers.js');
    return handlePlanModal(interaction, planManager, true, planId);
  }

  if (action === 'payment' && type === 'add' && hostName === 'modal') {
    const { handlePaymentModal } = await import('./paymentHandlers.js');
    return handlePaymentModal(interaction, paymentManager, false);
  }

  if (action === 'payment' && type === 'edit' && hostName === 'modal') {
    const methodId = interaction.customId.split('_')[3];
    const { handlePaymentModal } = await import('./paymentHandlers.js');
    return handlePaymentModal(interaction, paymentManager, true, methodId);
  }

  if (action === 'app' && type === 'transfer' && hostName === 'modal') {
    const appId = interaction.customId.split('_')[3];
    const { handleTransferModal } = await import('./appHandlers.js');
    return handleTransferModal(interaction, customerManager, appId);
  }

  if (action === 'config' && type === 'modal') {
    return handleConfigModal(interaction, configManager, hostName);
  }

  if (action === 'config' && type === 'maxbackups' && hostName === 'modal') {
    return handleMaxBackupsModal(interaction, configManager);
  }

  if (action === 'config' && type === 'retention' && hostName === 'modal') {
    return handleRetentionModal(interaction, configManager);
  }

  if (action === 'config' && type === 'addhost' && hostName === 'modal') {
    return handleAddHostModal(interaction, configManager);
  }

  if (action === 'monitor' && type === 'add' && hostName === 'modal') {
    return handleMonitorAddModal(interaction, monitorManager);
  }

  if (action === 'schedule' && type === 'add' && hostName === 'modal') {
    return handleScheduleAddModal(interaction, schedulerManager);
  }

  if (action === 'webhook' && type === 'add' && hostName === 'modal') {
    return handleWebhookAddModal(interaction, webhookManager);
  }
}

async function handleConfigModal(interaction: any, configManager: ConfigManager, hostName: string) {
  const token = interaction.fields.getTextInputValue('api_token');

  try {
    configManager.setHostToken(hostName, token);
    configManager.enableHost(hostName);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`✅ Host **${hostName}** configurada com sucesso!`)
      );

    await interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  } catch (error: any) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ Erro ao configurar: ${error.message}`)
      );

    await interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  }
}

async function handleMaxBackupsModal(interaction: any, configManager: ConfigManager) {
  const value = parseInt(interaction.fields.getTextInputValue('value'));
  
  if (isNaN(value) || value < 1) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Valor inválido. Digite um número maior que 0.')
      );
    return interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  }

  configManager.setSetting('maxBackups', value);
  
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`✅ Máximo de backups atualizado para **${value}**`)
    );
  await interaction.reply({ 
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    ephemeral: true 
  });
}

async function handleRetentionModal(interaction: any, configManager: ConfigManager) {
  const value = parseInt(interaction.fields.getTextInputValue('value'));
  
  if (isNaN(value) || value < 1) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Valor inválido. Digite um número maior que 0.')
      );
    return interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  }

  configManager.setSetting('backupRetentionDays', value);
  
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`✅ Retenção de backups atualizada para **${value} dias**`)
    );
  await interaction.reply({ 
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    ephemeral: true 
  });
}

async function handleAddHostModal(interaction: any, configManager: ConfigManager) {
  const hostName = interaction.fields.getTextInputValue('host_name');
  const displayName = interaction.fields.getTextInputValue('display_name');
  const apiUrl = interaction.fields.getTextInputValue('api_url');

  try {
    configManager.addAvailableHost(hostName, displayName, apiUrl, 'CustomProvider');

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`✅ Host **${displayName}** adicionada com sucesso!`)
      );

    await interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  } catch (error: any) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Erro ao adicionar host: ${error.message}`)
      );

    await interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  }
}

async function handleMonitorAddModal(interaction: any, monitorManager: any) {
  const hostName = interaction.fields.getTextInputValue('host_name');
  const appId = interaction.fields.getTextInputValue('app_id');
  const channelId = interaction.fields.getTextInputValue('channel_id');

  if (!monitorManager) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Monitoramento não disponível')
      );
    return interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  }

  await interaction.deferUpdate();

  try {
    monitorManager.startMonitoring(hostName, appId, channelId);

    const { handleMonitor } = await import('./panelHandlers.js');
    await handleMonitor(interaction, null, monitorManager);
  } catch (error: any) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ Erro ao adicionar monitoramento: ${error.message}`)
      );

    await interaction.editReply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
}


async function handleScheduleAddModal(interaction: any, schedulerManager: any) {
  const hostName = interaction.fields.getTextInputValue('host_name');
  const appId = interaction.fields.getTextInputValue('app_id');
  const filePath = interaction.fields.getTextInputValue('file_path');
  const scheduledTimeStr = interaction.fields.getTextInputValue('scheduled_time');
  const recurringStr = interaction.fields.getTextInputValue('recurring');

  if (!schedulerManager) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Agendamentos não disponíveis')
      );
    return interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  }

  try {
    const [datePart, timePart] = scheduledTimeStr.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    
    const scheduledTime = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    ).getTime();

    const recurring = recurringStr && ['daily', 'weekly', 'monthly'].includes(recurringStr.toLowerCase()) 
      ? recurringStr.toLowerCase() as 'daily' | 'weekly' | 'monthly'
      : undefined;

    await interaction.deferUpdate();
    schedulerManager.scheduleDeploy(hostName, appId, filePath, scheduledTime, interaction.user.id, recurring);

    const { handleSchedule } = await import('./panelHandlers.js');
    await handleSchedule(interaction, schedulerManager);
  } catch (error: any) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ Erro ao agendar deploy: ${error.message}`)
      );

    await interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  }
}

async function handleWebhookAddModal(interaction: any, webhookManager: any) {
  const webhookUrl = interaction.fields.getTextInputValue('webhook_url');
  const eventsStr = interaction.fields.getTextInputValue('events');

  if (!webhookManager) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Webhooks não disponíveis')
      );
    return interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  }

  try {
    await interaction.deferUpdate();
    const events = eventsStr.split(',').map((e: string) => e.trim());
    webhookManager.addWebhook(webhookUrl, events, interaction.user.id);

    const { handleWebhooks } = await import('./panelHandlers.js');
    await handleWebhooks(interaction, webhookManager);
  } catch (error: any) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ Erro ao adicionar webhook: ${error.message}`)
      );

    await interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  }
}
