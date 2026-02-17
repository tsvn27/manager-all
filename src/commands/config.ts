import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ConfigManager } from '../managers/ConfigManager.js';

export const data = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Configurar hosts e API tokens');

export async function execute(interaction: ChatInputCommandInteraction, configManager: ConfigManager) {
  const hosts = configManager.getAllHosts();

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Configuração de Hosts'),
      new TextDisplayBuilder().setContent('Configure as API keys das hosts para usar o manager')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  hosts.forEach(host => {
    const status = host.configured 
      ? (host.enabled ? 'Configurada e Ativa' : 'Configurada e Desativada')
      : 'Não Configurada';
    
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**${host.name.charAt(0).toUpperCase() + host.name.slice(1)}**`),
          new TextDisplayBuilder().setContent(`Status: ${status}`)
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(`config_host_${host.name}`)
            .setLabel('Configurar')
            .setStyle(ButtonStyle.Primary)
        )
    );
  });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('config_refresh')
      .setLabel('Atualizar')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ 
    components: [container, row],
    flags: MessageFlags.IsComponentsV2,
    ephemeral: true
  });
}
