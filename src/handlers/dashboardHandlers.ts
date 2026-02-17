import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';

export async function handleDashboard(interaction: any, hostManager: HostManager) {
  await interaction.deferUpdate();

  try {
    const providers = hostManager.getAllProviders();
    
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
    const hostStats: any[] = [];

    for (const provider of providers) {
      try {
        const apps = await provider.getApps();
        totalApps += apps.length;

        let hostOnline = 0;
        let hostOffline = 0;
        let hostCpu = 0;
        let hostRam = 0;
        let hostMetrics = 0;

        for (const app of apps) {
          try {
            const status = await provider.getStatus(app.id);
            
            if (status.status === 'online') {
              onlineApps++;
              hostOnline++;
            } else {
              offlineApps++;
              hostOffline++;
            }

            if (status.cpu) {
              const cpuValue = parseFloat(status.cpu.replace('%', ''));
              if (!isNaN(cpuValue)) {
                totalCpu += cpuValue;
                hostCpu += cpuValue;
                appsWithMetrics++;
                hostMetrics++;
              }
            }
            if (status.ram) {
              const ramMatch = status.ram.match(/(\d+\.?\d*)/);
              if (ramMatch) {
                const ramValue = parseFloat(ramMatch[1]);
                totalRam += ramValue;
                hostRam += ramValue;
              }
            }
          } catch (error) {
          }
        }

        hostStats.push({
          name: provider.name,
          total: apps.length,
          online: hostOnline,
          offline: hostOffline,
          avgCpu: hostMetrics > 0 ? (hostCpu / hostMetrics).toFixed(2) : '0',
          avgRam: hostMetrics > 0 ? (hostRam / hostMetrics).toFixed(2) : '0'
        });

      } catch (error) {
        hostStats.push({
          name: provider.name,
          error: true
        });
      }
    }

    const avgCpu = appsWithMetrics > 0 ? (totalCpu / appsWithMetrics).toFixed(2) : '0';
    const avgRam = appsWithMetrics > 0 ? (totalRam / appsWithMetrics).toFixed(2) : '0';
    const uptime = totalApps > 0 ? ((onlineApps / totalApps) * 100).toFixed(1) : '0';

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Estatísticas Gerais**'),
      new TextDisplayBuilder().setContent(`Total de Apps: ${totalApps}`),
      new TextDisplayBuilder().setContent(`Online: ${onlineApps} | Offline: ${offlineApps}`),
      new TextDisplayBuilder().setContent(`Uptime: ${uptime}%`),
      new TextDisplayBuilder().setContent(`CPU Média: ${avgCpu}%`),
      new TextDisplayBuilder().setContent(`RAM Média: ${avgRam}MB`)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    hostStats.forEach(stat => {
      if (stat.error) {
        container.addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`**${stat.name}**`),
              new TextDisplayBuilder().setContent('Erro ao buscar dados')
            )
        );
      } else {
        container.addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`**${stat.name}**`),
              new TextDisplayBuilder().setContent(
                `Apps: ${stat.total} (${stat.online} online, ${stat.offline} offline)\n` +
                `CPU: ${stat.avgCpu}% | RAM: ${stat.avgRam}MB`
              )
            )
        );
      }
    });

    const backBtn = new ButtonBuilder()
      .setCustomId('back_main')
      .setLabel('Voltar')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

    await interaction.editReply({
      components: [container, row],
      flags: MessageFlags.IsComponentsV2
    });
  } catch (error: any) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Erro ao carregar dashboard: ${error.message}`)
      );

    await interaction.editReply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
}
