import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, type MessageActionRowComponentBuilder } from 'discord.js';

export async function handleMonitor(interaction: any, hostManager: any, monitorManager: any) {
  if (!monitorManager) {
    return interaction.update({ 
      components: [new TextDisplayBuilder().setContent('Monitoramento não disponível')],
      flags: MessageFlags.IsComponentsV2
    });
  }

  const monitoredApps = monitorManager.getMonitoredApps();

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Monitoramento de Apps'),
      new TextDisplayBuilder().setContent('Apps sendo monitorados em tempo real')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  if (monitoredApps.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Nenhum app sendo monitorado.\n\nUse o botão **Adicionar Monitoramento** para começar.')
    );
  } else {
    monitoredApps.forEach((app: any) => {
      const provider = hostManager.getProvider(app.hostName);
      const statusText = app.lastStatus === 'online' ? '🟢 Online' : 
                        app.lastStatus === 'offline' ? '🔴 Offline' : '⚪ Desconhecido';
      
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**${provider?.name || app.hostName}**`),
            new TextDisplayBuilder().setContent(`**App ID:** \`${app.appId}\`\n**Status:** ${statusText}\n**Canal:** <#${app.channelId}>`)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`monitor_manage_${app.hostName}_${app.appId}`)
              .setLabel('Gerenciar')
              .setStyle(ButtonStyle.Primary)
          )
      );
    });
  }

  const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('monitor_add')
      .setLabel('Adicionar Monitoramento')
      .setStyle(ButtonStyle.Success)
  );

  container.addActionRowComponents(row);

  const backBtn = new ButtonBuilder()
    .setCustomId('back_main')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

  await interaction.update({ 
    components: [container, backRow],
    flags: MessageFlags.IsComponentsV2
  });
}

export async function handleHistory(interaction: any, deployHistoryManager: any) {
  if (!deployHistoryManager) {
    return interaction.update({ 
      components: [new TextDisplayBuilder().setContent('Histórico não disponível')],
      flags: MessageFlags.IsComponentsV2
    });
  }

  const history = deployHistoryManager.getHistory(undefined, undefined, 15);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Histórico de Deploys'),
      new TextDisplayBuilder().setContent('Últimos 15 deploys realizados')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  if (history.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Nenhum deploy registrado ainda.\n\nUse `/deploy` para fazer seu primeiro deploy.')
    );
  } else {
    history.forEach((deploy: any) => {
      const date = new Date(deploy.timestamp);
      const statusEmoji = deploy.status === 'success' ? '✅' : '❌';
      
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**${deploy.hostName}** - ${deploy.fileName}`),
            new TextDisplayBuilder().setContent(`${statusEmoji} ${deploy.status === 'success' ? 'Sucesso' : 'Falhou'} - ${date.toLocaleString('pt-BR')}\n**App:** \`${deploy.appId}\``)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`history_view_${deploy.id}`)
              .setLabel('Detalhes')
              .setStyle(ButtonStyle.Secondary)
          )
      );
    });
  }

  const backBtn = new ButtonBuilder()
    .setCustomId('back_main')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

  await interaction.update({ 
    components: [container, row],
    flags: MessageFlags.IsComponentsV2
  });
}

export async function handleNotifications(interaction: any, notificationManager: any) {
  if (!notificationManager) {
    return interaction.update({ 
      components: [new TextDisplayBuilder().setContent('Notificações não disponíveis')],
      flags: MessageFlags.IsComponentsV2
    });
  }

  const settings = notificationManager.getUserSettings(interaction.user.id);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Configurações de Notificações'),
      new TextDisplayBuilder().setContent('Escolha quais **eventos** você quer ser notificado')
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**Método:** ${settings.method === 'dm' ? '📧 Mensagem Direta' : '📢 Canal'}`),
      new TextDisplayBuilder().setContent(`**Deploy:** ${settings.events.deploy ? '✅ Ativado' : '❌ Desativado'}`),
      new TextDisplayBuilder().setContent(`**Mudança de Status:** ${settings.events.statusChange ? '✅ Ativado' : '❌ Desativado'}`),
      new TextDisplayBuilder().setContent(`**Crash:** ${settings.events.crash ? '✅ Ativado' : '❌ Desativado'}`),
      new TextDisplayBuilder().setContent(`**Restart:** ${settings.events.restart ? '✅ Ativado' : '❌ Desativado'}`)
    );

  const row1 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('notif_toggle_deploy')
      .setLabel('Deploy')
      .setStyle(settings.events.deploy ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('notif_toggle_statusChange')
      .setLabel('Status')
      .setStyle(settings.events.statusChange ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('notif_toggle_crash')
      .setLabel('Crash')
      .setStyle(settings.events.crash ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('notif_toggle_restart')
      .setLabel('Restart')
      .setStyle(settings.events.restart ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  container.addActionRowComponents(row1);

  const row2 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('notif_method')
      .setLabel(`Método: ${settings.method === 'dm' ? 'DM' : 'Canal'}`)
      .setStyle(ButtonStyle.Primary)
  );

  container.addActionRowComponents(row2);

  const backBtn = new ButtonBuilder()
    .setCustomId('back_main')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

  await interaction.update({ 
    components: [container, backRow],
    flags: MessageFlags.IsComponentsV2
  });
}

export async function handleSchedule(interaction: any, schedulerManager: any) {
  if (!schedulerManager) {
    return interaction.update({ 
      components: [new TextDisplayBuilder().setContent('Agendamentos não disponíveis')],
      flags: MessageFlags.IsComponentsV2
    });
  }

  const schedules = schedulerManager.getSchedules(interaction.user.id);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Deploys Agendados'),
      new TextDisplayBuilder().setContent('Gerencie seus deploys programados')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  if (schedules.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Nenhum deploy agendado.\n\nUse o botão **Agendar Deploy** para programar um deploy.')
    );
  } else {
    let schedulesText = '';
    schedules.forEach((schedule: any) => {
      const date = new Date(schedule.scheduledTime);
      const recurring = schedule.recurring ? ` 🔄 (${schedule.recurring})` : '';
      schedulesText += `**Host:** ${schedule.hostName} | **App:** \`${schedule.appId}\`\n`;
      schedulesText += `**Data:** ${date.toLocaleString('pt-BR')}${recurring}\n`;
      schedulesText += `**Status:** ${schedule.status}\n\n`;
    });
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(schedulesText.trim())
    );
  }

  const addBtn = new ButtonBuilder()
    .setCustomId('schedule_add')
    .setLabel('Agendar Deploy')
    .setStyle(ButtonStyle.Success);

  const addRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(addBtn);
  container.addActionRowComponents(addRow);

  const backBtn = new ButtonBuilder()
    .setCustomId('back_main')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

  await interaction.update({ 
    components: [container, row],
    flags: MessageFlags.IsComponentsV2
  });
}

export async function handleWebhooks(interaction: any, webhookManager: any) {
  if (!webhookManager) {
    return interaction.update({ 
      components: [new TextDisplayBuilder().setContent('Webhooks não disponíveis')],
      flags: MessageFlags.IsComponentsV2
    });
  }

  const webhooks = webhookManager.getWebhooks(interaction.user.id);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Webhooks'),
      new TextDisplayBuilder().setContent('Configure webhooks para receber notificações externas')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  if (webhooks.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Nenhum webhook configurado.\n\nUse o botão **Adicionar Webhook** para configurar notificações externas.')
    );
  } else {
    let webhooksText = '';
    webhooks.forEach((webhook: any) => {
      const status = webhook.enabled ? '🟢 Ativo' : '🔴 Desativado';
      webhooksText += `**URL:** \`${webhook.url}\`\n`;
      webhooksText += `**Eventos:** ${webhook.events.map((e: string) => `\`${e}\``).join(', ')}\n`;
      webhooksText += `**Status:** ${status}\n\n`;
    });
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(webhooksText.trim())
    );
  }

  const addBtn = new ButtonBuilder()
    .setCustomId('webhook_add')
    .setLabel('Adicionar Webhook')
    .setStyle(ButtonStyle.Success);

  const addRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(addBtn);
  container.addActionRowComponents(addRow);

  const backBtn = new ButtonBuilder()
    .setCustomId('back_main')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

  await interaction.update({ 
    components: [container, row],
    flags: MessageFlags.IsComponentsV2
  });
}

export async function handleBackup(interaction: any, backupManager: any) {
  if (!backupManager) {
    return interaction.update({ 
      components: [new TextDisplayBuilder().setContent('Backups não disponíveis')],
      flags: MessageFlags.IsComponentsV2
    });
  }

  const backups = backupManager.listBackups();

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Backups de Configuração'),
      new TextDisplayBuilder().setContent('Faça backup e restaure suas configurações')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  if (backups.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Nenhum backup disponível.\n\nUse o botão **Criar Backup** para fazer backup das suas configurações.')
    );
  } else {
    let backupsText = '';
    backups.slice(0, 10).forEach((backup: any) => {
      backupsText += `**ID:** \`${backup.id}\`\n`;
      backupsText += `**Data:** ${backup.date}\n\n`;
    });
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(backupsText.trim())
    );
  }

  const createBtn = new ButtonBuilder()
    .setCustomId('backup_create')
    .setLabel('Criar Backup')
    .setStyle(ButtonStyle.Success);

  const createRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(createBtn);
  container.addActionRowComponents(createRow);

  const backBtn = new ButtonBuilder()
    .setCustomId('back_main')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

  await interaction.update({ 
    components: [container, row],
    flags: MessageFlags.IsComponentsV2
  });
}
