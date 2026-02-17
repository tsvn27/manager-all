import { ChatInputCommandInteraction, SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, SectionBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';
import { MonitorManager } from '../managers/MonitorManager.js';

export const data = new SlashCommandBuilder()
  .setName('monitor')
  .setDescription('Gerenciar monitoramento de apps');

export async function execute(interaction: ChatInputCommandInteraction, hostManager: HostManager, monitorManager: MonitorManager) {
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
    monitoredApps.forEach(app => {
      const provider = hostManager.getProvider(app.hostName);
      const statusText = app.lastStatus === 'online' ? 'Online' : 
                        app.lastStatus === 'offline' ? 'Offline' : 'Desconhecido';
      
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**${provider?.name || app.hostName}**`),
            new TextDisplayBuilder().setContent(`App ID: \`${app.appId}\`\nStatus: ${statusText}`)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`monitor_stop_${app.hostName}_${app.appId}`)
              .setLabel('Parar')
              .setStyle(ButtonStyle.Danger)
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
      .setCustomId('monitor_refresh')
      .setLabel('Atualizar')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ 
    components: [container, row],
    flags: MessageFlags.IsComponentsV2,
    ephemeral: true
  });
}
