import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } from 'discord.js';

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
      new TextDisplayBuilder().setContent('Nenhum app sendo monitorado')
    );
  } else {
    monitoredApps.forEach((app: any) => {
      const provider = hostManager.getProvider(app.hostName);
      const statusText = app.lastStatus === 'online' ? 'Online' : 
                        app.lastStatus === 'offline' ? 'Offline' : 'Desconhecido';
      
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**${provider?.name || app.hostName}**`),
            new TextDisplayBuilder().setContent(`App ID: \`${app.appId}\`\nStatus: ${statusText}\nCanal: <#${app.channelId}>`)
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

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('monitor_add')
      .setLabel('Adicionar Monitoramento')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('back_main')
      .setLabel('Voltar')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ 
    components: [container, row],
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
      new TextDisplayBuilder().setContent('Nenhum deploy registrado ainda')
    );
  } else {
    history.forEach((deploy: any) => {
      const date = new Date(deploy.timestamp);
      const statusEmoji = deploy.status === 'success' ? '✓' : '✗';
      
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**${deploy.hostName}** - ${deploy.fileName}`),
            new TextDisplayBuilder().setContent(`${statusEmoji} ${deploy.status === 'success' ? 'Sucesso' : 'Falhou'} - ${date.toLocaleString('pt-BR')}\nApp: \`${deploy.appId}\``)
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

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('back_main')
      .setLabel('Voltar')
      .setStyle(ButtonStyle.Secondary)
  );

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
      new TextDisplayBuilder().setContent('Escolha quais eventos você quer ser notificado')
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**Método:** ${settings.method === 'dm' ? 'Mensagem Direta' : 'Canal'}`),
      new TextDisplayBuilder().setContent(`**Deploy:** ${settings.events.deploy ? 'Ativado ✓' : 'Desativado ✗'}`),
      new TextDisplayBuilder().setContent(`**Mudança de Status:** ${settings.events.statusChange ? 'Ativado ✓' : 'Desativado ✗'}`),
      new TextDisplayBuilder().setContent(`**Crash:** ${settings.events.crash ? 'Ativado ✓' : 'Desativado ✗'}`),
      new TextDisplayBuilder().setContent(`**Restart:** ${settings.events.restart ? 'Ativado ✓' : 'Desativado ✗'}`)
    );

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('notif_method')
      .setLabel(`Método: ${settings.method === 'dm' ? 'DM' : 'Canal'}`)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('back_main')
      .setLabel('Voltar')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ 
    components: [container, row1, row2],
    flags: MessageFlags.IsComponentsV2
  });
}

export async function handleSchedule(interaction: any) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Deploys Agendados'),
      new TextDisplayBuilder().setContent('Gerencie seus deploys programados')
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Funcionalidade em desenvolvimento')
    );

  const addBtn = new ButtonBuilder()
    .setCustomId('schedule_add')
    .setLabel('Agendar Deploy')
    .setStyle(ButtonStyle.Success);

  const backBtn = new ButtonBuilder()
    .setCustomId('back_main')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(addBtn, backBtn);

  await interaction.update({ 
    components: [container, row],
    flags: MessageFlags.IsComponentsV2
  });
}

export async function handleWebhooks(interaction: any) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Webhooks'),
      new TextDisplayBuilder().setContent('Configure webhooks para receber notificações externas')
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Funcionalidade em desenvolvimento')
    );

  const addBtn = new ButtonBuilder()
    .setCustomId('webhook_add')
    .setLabel('Adicionar Webhook')
    .setStyle(ButtonStyle.Success);

  const backBtn = new ButtonBuilder()
    .setCustomId('back_main')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(addBtn, backBtn);

  await interaction.update({ 
    components: [container, row],
    flags: MessageFlags.IsComponentsV2
  });
}

export async function handleBackup(interaction: any) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Backups de Configuração'),
      new TextDisplayBuilder().setContent('Faça backup e restaure suas configurações')
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Funcionalidade em desenvolvimento')
    );

  const createBtn = new ButtonBuilder()
    .setCustomId('backup_create')
    .setLabel('Criar Backup')
    .setStyle(ButtonStyle.Success);

  const backBtn = new ButtonBuilder()
    .setCustomId('back_main')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(createBtn, backBtn);

  await interaction.update({ 
    components: [container, row],
    flags: MessageFlags.IsComponentsV2
  });
}
