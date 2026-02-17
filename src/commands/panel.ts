import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, ButtonBuilder, ButtonStyle, type MessageActionRowComponentBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';

export const data = new SlashCommandBuilder()
  .setName('panel')
  .setDescription('Abre o painel de gerenciamento completo');

export async function execute(interaction: ChatInputCommandInteraction, hostManager: HostManager) {
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

    return interaction.reply({ 
      components: [container, row],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true
    });
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Painel de Gerenciamento'),
      new TextDisplayBuilder().setContent('Selecione uma host para gerenciar seus apps')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  providers.forEach(p => {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**${p.name}**`)
    );
  });

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

  await interaction.reply({ 
    components: [container, row2, row3],
    flags: MessageFlags.IsComponentsV2,
    ephemeral: true
  });
}
