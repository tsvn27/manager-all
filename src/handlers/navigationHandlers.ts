import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, type MessageActionRowComponentBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';

export async function handleBackMain(interaction: any, hostManager: HostManager) {
  const providers = hostManager.getAllProviders();

  if (providers.length === 0) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Painel de Gerenciamento'),
        new TextDisplayBuilder().setContent('Nenhuma host configurada ainda')
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Use o botão abaixo para configurar suas hosts')
      );

    const configButton = new ButtonBuilder()
      .setCustomId('open_config')
      .setLabel('Configurações')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(configButton);

    return interaction.update({ 
      components: [container, row],
      flags: MessageFlags.IsComponentsV2
    });
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Painel de Gerenciamento'),
      new TextDisplayBuilder().setContent('Selecione uma host para gerenciar seus apps')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('select_host')
    .setPlaceholder('Escolha uma host')
    .addOptions(
      providers.map(p => 
        new StringSelectMenuOptionBuilder()
          .setLabel(p.name)
          .setValue(p.name.toLowerCase())
      )
    );

  const selectRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
    .addComponents(selectMenu);

  container.addActionRowComponents(selectRow);

  const configButton = new ButtonBuilder()
    .setCustomId('open_config')
    .setLabel('Configurações')
    .setStyle(ButtonStyle.Secondary);

  const dashboardButton = new ButtonBuilder()
    .setCustomId('open_dashboard')
    .setLabel('Dashboard')
    .setStyle(ButtonStyle.Primary);

  const monitorButton = new ButtonBuilder()
    .setCustomId('open_monitor')
    .setLabel('Monitoramento')
    .setStyle(ButtonStyle.Secondary);

  const historyButton = new ButtonBuilder()
    .setCustomId('open_history')
    .setLabel('Histórico')
    .setStyle(ButtonStyle.Secondary);

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(configButton, dashboardButton, monitorButton, historyButton);

  const notifButton = new ButtonBuilder()
    .setCustomId('open_notifications')
    .setLabel('Notificações')
    .setStyle(ButtonStyle.Secondary);

  const scheduleButton = new ButtonBuilder()
    .setCustomId('open_schedule')
    .setLabel('Agendamentos')
    .setStyle(ButtonStyle.Secondary);

  const webhookButton = new ButtonBuilder()
    .setCustomId('open_webhooks')
    .setLabel('Webhooks')
    .setStyle(ButtonStyle.Secondary);

  const backupButton = new ButtonBuilder()
    .setCustomId('open_backup')
    .setLabel('Backups')
    .setStyle(ButtonStyle.Secondary);

  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(notifButton, scheduleButton, webhookButton, backupButton);

  await interaction.update({ 
    components: [container, row2, row3],
    flags: MessageFlags.IsComponentsV2
  });
}

export async function handleBackHost(interaction: any, hostManager: HostManager, hostName: string) {
  const provider = hostManager.getProvider(hostName);

  if (!provider) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Host não encontrada')
      );
    return interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  }

  await interaction.deferUpdate();

  const apps = await provider.getApps();

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${provider.name} - Apps`)
    )
    .addSeparatorComponents(new SeparatorBuilder());

  if (apps.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Nenhum app encontrado nesta host')
    );
  } else {
    apps.forEach(app => {
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**${app.name}**`),
            new TextDisplayBuilder().setContent(`ID: \`${app.id}\``)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`quickview_${hostName}_${app.id}`)
              .setLabel(app.status === 'online' ? 'Online' : 'Offline')
              .setStyle(app.status === 'online' ? ButtonStyle.Success : ButtonStyle.Secondary)
          )
      );
    });
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`select_app_${hostName}`)
    .setPlaceholder('Selecione um app para gerenciar')
    .addOptions(
      apps.length > 0 
        ? apps.map(app => ({
            label: app.name,
            value: app.id,
            description: `Status: ${app.status}`
          }))
        : [{ label: 'Nenhum app', value: 'none', description: 'Faça deploy primeiro' }]
    );

  const configButton = new ButtonBuilder()
    .setCustomId('open_config')
    .setLabel('Configurações')
    .setStyle(ButtonStyle.Secondary);

  const backButton = new ButtonBuilder()
    .setCustomId('back_main')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(configButton, backButton);

  await interaction.editReply({ 
    components: [container, row1, row2],
    flags: MessageFlags.IsComponentsV2
  });
}

export async function handleBackApp(interaction: any, hostManager: HostManager, hostName: string, appId: string) {
  const provider = hostManager.getProvider(hostName);
  if (!provider) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Host não encontrada')
      );
    return interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  }

  await interaction.deferUpdate();

  try {
    const status = await provider.getStatus(appId);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${status.name}`)
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Status:** ${status.status === 'online' ? 'ONLINE' : 'OFFLINE'}`),
        new TextDisplayBuilder().setContent(`**ID:** \`${status.id}\``)
      );

    if (status.cpu || status.ram || status.uptime) {
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(false));
      
      const metricsText = [];
      if (status.cpu) metricsText.push(`**CPU:** ${status.cpu}`);
      if (status.ram) metricsText.push(`**RAM:** ${status.ram}`);
      if (status.uptime) metricsText.push(`**Uptime:** ${status.uptime}`);
      
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(metricsText.join('\n'))
      );
    }

    container.addSeparatorComponents(new SeparatorBuilder());

    const actionsMenu = new StringSelectMenuBuilder()
      .setCustomId(`app_action_${hostName}_${appId}`)
      .setPlaceholder('Gerencie sua Aplicação')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Iniciar')
          .setValue('start')
          .setDescription('Iniciar o app'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Parar')
          .setValue('stop')
          .setDescription('Parar o app'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Reiniciar')
          .setValue('restart')
          .setDescription('Reiniciar o app'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Logs')
          .setValue('logs')
          .setDescription('Ver logs do app'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Variáveis')
          .setValue('vars')
          .setDescription('Gerenciar variáveis de ambiente'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Auto-Restart')
          .setValue('autorestart')
          .setDescription('Configurar auto-restart'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Deletar')
          .setValue('delete')
          .setDescription('Deletar o app')
      );

    const selectRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
      .addComponents(actionsMenu);
    
    container.addActionRowComponents(selectRow);

    const backBtn = new ButtonBuilder()
      .setCustomId(`back_host_${hostName}`)
      .setLabel('Voltar')
      .setStyle(ButtonStyle.Secondary);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

    await interaction.editReply({ 
      components: [container, buttonRow],
      flags: MessageFlags.IsComponentsV2
    });
  } catch (error: any) {
    const errorMsg = error.message || 'Erro desconhecido';
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Erro ao buscar status: ${errorMsg}`)
      );
    await interaction.editReply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
}
