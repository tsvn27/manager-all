import { ChatInputCommandInteraction, SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SectionBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';

export const data = new SlashCommandBuilder()
  .setName('dashboard')
  .setDescription('Visualiza estatísticas de todos os apps hospedados');

export async function execute(interaction: ChatInputCommandInteraction, hostManager: HostManager) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const providers = hostManager.getAllProviders();
    
    if (providers.length === 0) {
      return interaction.editReply('Nenhuma host configurada');
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Dashboard - Visão Geral')
      )
      .addSeparatorComponents(new SeparatorBuilder());

    let totalApps = 0;
    let onlineApps = 0;
    let offlineApps = 0;
    let totalCpu = 0;
    let totalRam = 0;
    let appsWithMetrics = 0;

    for (const provider of providers) {
      try {
        const apps = await provider.getApps();
        totalApps += apps.length;

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**${provider.name}** - ${apps.length} apps`)
        );

        for (const app of apps) {
          try {
            const status = await provider.getStatus(app.id);
            
            if (status.status === 'online') onlineApps++;
            else offlineApps++;

            if (status.cpu) {
              const cpuValue = parseFloat(status.cpu.replace('%', ''));
              if (!isNaN(cpuValue)) {
                totalCpu += cpuValue;
                appsWithMetrics++;
              }
            }
            if (status.ram) {
              const ramMatch = status.ram.match(/(\d+\.?\d*)/);
              if (ramMatch) {
                totalRam += parseFloat(ramMatch[1]);
              }
            }
          } catch (error) {
          }
        }
      } catch (error) {
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**${provider.name}** - Erro ao buscar apps`)
        );
      }
    }

    container.addSeparatorComponents(new SeparatorBuilder());

    const avgCpu = appsWithMetrics > 0 ? (totalCpu / appsWithMetrics).toFixed(2) : '0';
    const avgRam = appsWithMetrics > 0 ? (totalRam / appsWithMetrics).toFixed(2) : '0';

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Estatísticas Gerais**'),
      new TextDisplayBuilder().setContent(`Total de Apps: ${totalApps}`),
      new TextDisplayBuilder().setContent(`Online: ${onlineApps} | Offline: ${offlineApps}`),
      new TextDisplayBuilder().setContent(`CPU Média: ${avgCpu}%`),
      new TextDisplayBuilder().setContent(`RAM Média: ${avgRam}MB`)
    );

    const refreshBtn = new ButtonBuilder()
      .setCustomId('dashboard_refresh')
      .setLabel('Atualizar')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(refreshBtn);

    await interaction.editReply({
      content: '',
      components: [container, row],
      flags: MessageFlags.IsComponentsV2
    });
  } catch (error: any) {
    await interaction.editReply(`Erro ao gerar dashboard: ${error.message}`);
  }
}
