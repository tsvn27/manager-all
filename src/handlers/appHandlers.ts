import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, StringSelectMenuBuilder, type MessageActionRowComponentBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';

export async function handleQuickview(interaction: any, hostManager: HostManager, params: string[]) {
  const hostName = params[0];
  const appId = params[1];
  
  const provider = hostManager.getProvider(hostName);
  if (!provider) {
    return interaction.update({ 
      components: [new TextDisplayBuilder().setContent('Host não encontrada')],
      flags: MessageFlags.IsComponentsV2
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
        new TextDisplayBuilder().setContent(`**Status:** ${status.status === 'online' ? 'ONLINE 🟢' : 'OFFLINE 🔴'}`),
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

    const manageBtn = new ButtonBuilder()
      .setCustomId(`manage_app_${hostName}_${appId}`)
      .setLabel('Gerenciar App')
      .setStyle(ButtonStyle.Primary);

    const backBtn = new ButtonBuilder()
      .setCustomId(`back_host_${hostName}`)
      .setLabel('Voltar')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(manageBtn, backBtn);

    await interaction.editReply({ 
      components: [container, row],
      flags: MessageFlags.IsComponentsV2
    });
  } catch (error: any) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Erro: ${error.message}`)
      );

    const backBtn = new ButtonBuilder()
      .setCustomId(`back_host_${hostName}`)
      .setLabel('Voltar')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

    await interaction.editReply({ 
      components: [container, row],
      flags: MessageFlags.IsComponentsV2
    });
  }
}

export async function handleManageApp(interaction: any, hostManager: HostManager, params: string[]) {
  const hostName = params[1];
  const appId = params[2];

  const provider = hostManager.getProvider(hostName);
  if (!provider) {
    return interaction.update({ 
      components: [new TextDisplayBuilder().setContent('Host não encontrada')],
      flags: MessageFlags.IsComponentsV2
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
      .setPlaceholder('Selecione uma ação')
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

export async function handleAppControl(interaction: any, hostManager: HostManager, action: string, params: string[]) {
  const hostName = params[0];
  const appId = params[1];

  const provider = hostManager.getProvider(hostName);
  if (!provider) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Host não encontrada')
      );
    return interaction.update({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }

  await interaction.deferUpdate();

  try {
    let result;
    if (action === 'start') result = await provider.start(appId);
    else if (action === 'stop') result = await provider.stop(appId);
    else if (action === 'restart') result = await provider.restart(appId);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(result?.message || `App ${action === 'start' ? 'iniciado' : action === 'stop' ? 'parado' : 'reiniciado'} com sucesso`)
      );

    await interaction.editReply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  } catch (error: any) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Erro: ${error.message}`)
      );

    await interaction.editReply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
}

export async function handleLogs(interaction: any, hostManager: HostManager, params: string[]) {
  const hostName = params[0];
  const appId = params[1];

  const provider = hostManager.getProvider(hostName);
  if (!provider) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Host não encontrada')
      );
    return interaction.update({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }

  await interaction.deferUpdate();

  try {
    const logs = await provider.getLogs(appId);
    const lines = logs.split('\n');
    const last100 = lines.slice(-100).join('\n');

    if (last100.length > 1900) {
      const attachment = new AttachmentBuilder(Buffer.from(logs), { name: 'logs.txt' });
      await interaction.editReply({ 
        files: [attachment],
        components: []
      });
    } else {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# Logs - ${appId}`),
          new TextDisplayBuilder().setContent(`\`\`\`\n${last100}\n\`\`\``)
        );

      await interaction.editReply({ 
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }
  } catch (error: any) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Erro: ${error.message}`)
      );

    await interaction.editReply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
}
