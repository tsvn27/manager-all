import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';

export const data = new SlashCommandBuilder()
  .setName('panel')
  .setDescription('Abre o painel de gerenciamento');

export async function execute(interaction: ChatInputCommandInteraction, hostManager: HostManager) {
  const providers = hostManager.getAllProviders();
  
  if (providers.length === 0) {
    return interaction.reply({ content: 'Nenhuma host configurada', ephemeral: true });
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

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  await interaction.reply({ 
    components: [container, row],
    flags: MessageFlags.IsComponentsV2
  });
}
