import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, type MessageActionRowComponentBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';
import { ConfigManager } from '../managers/ConfigManager.js';
import { DeployHistoryManager } from '../managers/DeployHistoryManager.js';
import { NotificationManager } from '../managers/NotificationManager.js';
import { MigrationManager } from '../managers/MigrationManager.js';
import { EnvManager } from '../managers/EnvManager.js';
import { handleButton } from './buttonHandler.js';

export async function handleSelectMenu(interaction: any, hostManager: HostManager, monitorManager?: any, migrationManager?: any, configManager?: any, deployHistoryManager?: any, notificationManager?: any, envManager?: any) {
  const [action, ...params] = interaction.customId.split('_');

  if (action === 'migrate' && params[0] === 'select') {
    const fromHost = params[1];
    const appId = params[2];
    const toHost = interaction.values[0];

    if (!migrationManager) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('Sistema de migração não disponível')
        );
      return interaction.reply({ 
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true 
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`migrate_confirm_${fromHost}_${toHost}_${appId}`)
      .setTitle('Confirmar Migração');

    const deleteInput = new TextInputBuilder()
      .setCustomId('delete_source')
      .setLabel('Deletar da host original? (sim/não)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('não')
      .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(deleteInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  } else if (action === 'select' && params[0] === 'host') {
    await handleHostSelect(interaction, hostManager);
  } else if (action === 'app' && params[0] === 'action') {
    await handleAppAction(interaction, hostManager, configManager, monitorManager, deployHistoryManager, notificationManager, migrationManager, envManager, params);
  } else if (action === 'select' && params[0] === 'app') {
    await handleAppSelect(interaction, hostManager, params);
  }
}

async function handleHostSelect(interaction: any, hostManager: HostManager) {
  const hostName = interaction.values[0];
  const provider = hostManager.getProvider(hostName);

  if (!provider) {
    return interaction.update({ 
      components: [new TextDisplayBuilder().setContent('Host não encontrada')],
      flags: MessageFlags.IsComponentsV2
    });
  }

  await interaction.deferUpdate();

  try {
    const apps = await provider.getApps();

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${provider.name} - Apps`)
      )
      .addSeparatorComponents(new SeparatorBuilder());

    if (apps.length === 0) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Nenhum app encontrado nesta host'),
        new TextDisplayBuilder().setContent('Faça seu primeiro deploy usando o botão abaixo')
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

    const row1 = apps.length > 0 ? new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu) : null;
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(configButton, backButton);

    const components: any[] = [container];
    if (row1) components.push(row1);
    components.push(row2);

    await interaction.editReply({ 
      components,
      flags: MessageFlags.IsComponentsV2
    });
  } catch (error: any) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${provider.name} - Apps`),
        new TextDisplayBuilder().setContent('Nenhum app encontrado ou erro ao buscar'),
        new TextDisplayBuilder().setContent('Faça seu primeiro deploy usando o botão abaixo')
      )
      .addSeparatorComponents(new SeparatorBuilder());

    const deployButton = new ButtonBuilder()
      .setCustomId(`deploy_${hostName}`)
      .setLabel('Deploy')
      .setStyle(ButtonStyle.Success);

    const backButton = new ButtonBuilder()
      .setCustomId('back_main')
      .setLabel('Voltar')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton);

    await interaction.editReply({ 
      components: [container, row],
      flags: MessageFlags.IsComponentsV2
    });
  }
}

async function handleAppAction(interaction: any, hostManager: HostManager, configManager: any, monitorManager: any, deployHistoryManager: any, notificationManager: any, migrationManager: any, envManager: any, params: string[]) {
  const hostName = params[1];
  const appId = params[2];
  const selectedAction = interaction.values[0];

  const actionMap: any = {
    start: `start_${hostName}_${appId}`,
    stop: `stop_${hostName}_${appId}`,
    restart: `restart_${hostName}_${appId}`,
    logs: `logs_${hostName}_${appId}`,
    vars: `vars_manage_${hostName}_${appId}`,
    autorestart: `autorestart_toggle_${hostName}_${appId}`,
    delete: `delete_app_${hostName}_${appId}`
  };

  if (actionMap[selectedAction]) {
    interaction.customId = actionMap[selectedAction];
    return handleButton(interaction, hostManager, configManager, monitorManager, deployHistoryManager, notificationManager, migrationManager, envManager);
  }
}

async function handleAppSelect(interaction: any, hostManager: HostManager, params: string[]) {
  const hostName = params[1];
  const appId = interaction.values[0];

  if (appId === 'none') {
    return interaction.update({ 
      components: [new TextDisplayBuilder().setContent('Nenhum app disponível')],
      flags: MessageFlags.IsComponentsV2
    });
  }

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
