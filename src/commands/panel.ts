import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, ButtonBuilder, ButtonStyle } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';

export const data = new SlashCommandBuilder()
  .setName('panel')
  .setDescription('Abre o painel de gerenciamento');

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
      .setLabel('Configurar Hosts')
      .setStyle(ButtonStyle.Primary);

    const monitorButton = new ButtonBuilder()
      .setCustomId('open_monitor')
      .setLabel('Monitoramento')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(configButton, monitorButton);

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
      providers.map(p => ({
        label: p.name,
        value: p.name.toLowerCase()
      }))
    );

  const configButton = new ButtonBuilder()
    .setCustomId('open_config')
    .setLabel('Configurações')
    .setStyle(ButtonStyle.Secondary);

  const monitorButton = new ButtonBuilder()
    .setCustomId('open_monitor')
    .setLabel('Monitoramento')
    .setStyle(ButtonStyle.Primary);

  const historyButton = new ButtonBuilder()
    .setCustomId('open_history')
    .setLabel('Histórico')
    .setStyle(ButtonStyle.Secondary);

  const notifButton = new ButtonBuilder()
    .setCustomId('open_notifications')
    .setLabel('Notificações')
    .setStyle(ButtonStyle.Secondary);

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(configButton, monitorButton);
  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(historyButton, notifButton);

  await interaction.reply({ 
    components: [container, row1, row2, row3],
    flags: MessageFlags.IsComponentsV2,
    ephemeral: true
  });
}
