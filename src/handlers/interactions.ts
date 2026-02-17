import { Interaction, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';
import { ConfigManager } from '../managers/ConfigManager.js';
import { DeployHistoryManager } from '../managers/DeployHistoryManager.js';
import { NotificationManager } from '../managers/NotificationManager.js';
import { MigrationManager } from '../managers/MigrationManager.js';

export async function handleInteraction(interaction: Interaction, hostManager: HostManager, configManager: ConfigManager, monitorManager?: any, deployHistoryManager?: DeployHistoryManager, notificationManager?: NotificationManager, migrationManager?: MigrationManager) {
  if (interaction.isStringSelectMenu()) {
    await handleSelectMenu(interaction, hostManager, monitorManager, migrationManager);
  } else if (interaction.isButton()) {
    await handleButton(interaction, hostManager, configManager, monitorManager, deployHistoryManager, notificationManager, migrationManager);
  } else if (interaction.isModalSubmit()) {
    await handleModal(interaction, hostManager, configManager, monitorManager, deployHistoryManager, notificationManager, migrationManager);
  }
}

async function handleSelectMenu(interaction: any, hostManager: HostManager, monitorManager?: any, migrationManager?: any) {
  const [action, ...params] = interaction.customId.split('_');

  if (action === 'migrate' && params[0] === 'select') {
    const fromHost = params[1];
    const appId = params[2];
    const toHost = interaction.values[0];

    if (!migrationManager) {
      return interaction.reply({ content: 'Sistema de migração não disponível', ephemeral: true });
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
    const hostName = interaction.values[0];
    const provider = hostManager.getProvider(hostName);

    if (!provider) {
      return interaction.reply({ content: 'Host não encontrada', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
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

      const deployButton = new ButtonBuilder()
        .setCustomId(`deploy_${hostName}`)
        .setLabel('Deploy')
        .setStyle(ButtonStyle.Success);

      const configButton = new ButtonBuilder()
        .setCustomId('open_config')
        .setLabel('Configurações')
        .setStyle(ButtonStyle.Secondary);

      const backButton = new ButtonBuilder()
        .setCustomId('back_main')
        .setLabel('Voltar')
        .setStyle(ButtonStyle.Secondary);

      const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(deployButton, configButton, backButton);

      await interaction.editReply({ 
        components: [container, row1, row2]
      });
    } catch (error: any) {
      await interaction.editReply({ content: `Erro: ${error.message}` });
    }
  } else if (action === 'select' && params[0] === 'app') {
    const hostName = params[1];
    const appId = interaction.values[0];

    if (appId === 'none') {
      return interaction.reply({ content: 'Nenhum app disponível', ephemeral: true });
    }

    const provider = hostManager.getProvider(hostName);
    if (!provider) {
      return interaction.reply({ content: 'Host não encontrada', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const status = await provider.getStatus(appId);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${status.name}`)
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`**Status:** ${status.status === 'online' ? 'ONLINE' : 'OFFLINE'}`),
              new TextDisplayBuilder().setContent(`**ID:** \`${status.id}\``)
            )
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

      const startBtn = new ButtonBuilder()
        .setCustomId(`start_${hostName}_${appId}`)
        .setLabel('Iniciar')
        .setStyle(ButtonStyle.Success)
        .setDisabled(status.status === 'online');

      const stopBtn = new ButtonBuilder()
        .setCustomId(`stop_${hostName}_${appId}`)
        .setLabel('Parar')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(status.status === 'offline');

      const restartBtn = new ButtonBuilder()
        .setCustomId(`restart_${hostName}_${appId}`)
        .setLabel('Reiniciar')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(status.status === 'offline');

      const logsBtn = new ButtonBuilder()
        .setCustomId(`logs_${hostName}_${appId}`)
        .setLabel('Logs')
        .setStyle(ButtonStyle.Secondary);

      const migrateBtn = new ButtonBuilder()
        .setCustomId(`migrate_${hostName}_${appId}`)
        .setLabel('Migrar')
        .setStyle(ButtonStyle.Primary);

      const backupBtn = new ButtonBuilder()
        .setCustomId(`backup_${hostName}_${appId}`)
        .setLabel('Backup')
        .setStyle(ButtonStyle.Success);

      const backBtn = new ButtonBuilder()
        .setCustomId(`back_host_${hostName}`)
        .setLabel('Voltar')
        .setStyle(ButtonStyle.Secondary);

      const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(startBtn, stopBtn, restartBtn);
      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(logsBtn, migrateBtn, backupBtn);
      const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

      await interaction.editReply({ 
        components: [container, row1, row2, row3]
      });
    } catch (error: any) {
      await interaction.editReply({ content: `Erro: ${error.message}` });
    }
  }
}

async function handleButton(interaction: any, hostManager: HostManager, configManager: ConfigManager, monitorManager?: any, deployHistoryManager?: any, notificationManager?: any, migrationManager?: any) {
  const [action, ...params] = interaction.customId.split('_');

  if (action === 'open' && params[0] === 'config') {
    const hosts = configManager.getAllHosts();

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Configuração de Hosts'),
        new TextDisplayBuilder().setContent('Configure as API keys das hosts para usar o manager')
      )
      .addSeparatorComponents(new SeparatorBuilder());

    if (hosts.length === 0) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Nenhuma host disponível. Adicione uma nova host.')
      );
    } else {
      hosts.forEach(host => {
        const status = host.configured 
          ? (host.enabled ? 'Configurada e Ativa' : 'Configurada e Desativada')
          : 'Não Configurada';
        
        container.addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`**${host.displayName}**`),
              new TextDisplayBuilder().setContent(`Status: ${status}`)
            )
            .setButtonAccessory(
              new ButtonBuilder()
                .setCustomId(`config_manage_${host.name}`)
                .setLabel('Gerenciar')
                .setStyle(ButtonStyle.Primary)
            )
        );
      });
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('config_refresh')
        .setLabel('Atualizar')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('config_add_host')
        .setLabel('Adicionar Host')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('back_main')
        .setLabel('Voltar')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ 
      components: [container, row]
    });
  } else if (action === 'config') {
    if (params[0] === 'manage') {
      const hostName = params[1];
      const hostInfo = configManager.getHostInfo(hostName);
      const isConfigured = !!configManager.getHostToken(hostName);
      const isEnabled = configManager.isHostEnabled(hostName);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# Gerenciar ${hostInfo?.displayName || hostName}`)
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**Status:** ${isConfigured ? (isEnabled ? 'Ativa' : 'Desativada') : 'Não Configurada'}`),
          new TextDisplayBuilder().setContent(`**Documentação:** ${hostInfo?.documentation || 'N/A'}`)
        );

      const buttons = [];

      if (isConfigured) {
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`config_edit_${hostName}`)
            .setLabel('Editar Token')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`config_toggle_${hostName}`)
            .setLabel(isEnabled ? 'Desativar' : 'Ativar')
            .setStyle(isEnabled ? ButtonStyle.Secondary : ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`config_remove_${hostName}`)
            .setLabel('Remover')
            .setStyle(ButtonStyle.Danger)
        );
      } else {
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`config_setup_${hostName}`)
            .setLabel('Configurar Token')
            .setStyle(ButtonStyle.Success)
        );
      }

      buttons.push(
        new ButtonBuilder()
          .setCustomId(`config_delete_host_${hostName}`)
          .setLabel('Deletar Host')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('open_config')
          .setLabel('Voltar')
          .setStyle(ButtonStyle.Secondary)
      );

      const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(0, 3));
      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(3));

      await interaction.update({ 
        components: [container, row1, row2]
      });
    } else if (params[0] === 'setup' || params[0] === 'edit') {
      const hostName = params[1];
      
      const modal = new ModalBuilder()
        .setCustomId(`config_modal_${hostName}`)
        .setTitle(`Configurar ${hostName}`);

      const tokenInput = new TextInputBuilder()
        .setCustomId('api_token')
        .setLabel('API Token')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Cole sua API key aqui')
        .setRequired(true);

      const row = new ActionRowBuilder<TextInputBuilder>().addComponents(tokenInput);
      modal.addComponents(row);

      await interaction.showModal(modal);
    } else if (params[0] === 'toggle') {
      const hostName = params[1];
      const newState = configManager.toggleHost(hostName);
      
      await interaction.reply({ 
        content: `Host ${hostName} ${newState ? 'ativada' : 'desativada'}`,
        ephemeral: true 
      });
    } else if (params[0] === 'remove') {
      const hostName = params[1];
      configManager.removeHost(hostName);
      
      await interaction.reply({ 
        content: `Configuração da host ${hostName} removida`,
        ephemeral: true 
      });
    } else if (params[0] === 'delete' && params[1] === 'host') {
      const hostName = params[2];
      
      const modal = new ModalBuilder()
        .setCustomId(`config_confirm_delete_${hostName}`)
        .setTitle('Confirmar Exclusão');

      const confirmInput = new TextInputBuilder()
        .setCustomId('confirm')
        .setLabel(`Digite "${hostName}" para confirmar`)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(hostName)
        .setRequired(true);

      const row = new ActionRowBuilder<TextInputBuilder>().addComponents(confirmInput);
      modal.addComponents(row);

      await interaction.showModal(modal);
    } else if (params[0] === 'refresh') {
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
              new TextDisplayBuilder().setContent(`**${host.displayName}**`),
              new TextDisplayBuilder().setContent(`Status: ${status}`)
            )
            .setButtonAccessory(
              new ButtonBuilder()
                .setCustomId(`config_manage_${host.name}`)
                .setLabel('Gerenciar')
                .setStyle(ButtonStyle.Primary)
            )
        );
      });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('config_refresh')
          .setLabel('Atualizar')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('config_add_host')
          .setLabel('Adicionar Host')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('back_main')
          .setLabel('Voltar')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.update({ 
        components: [container, row]
      });
    } else if (params[0] === 'add' && params[1] === 'host') {
      const modal = new ModalBuilder()
        .setCustomId('add_host_modal')
        .setTitle('Adicionar Nova Host');

      const nameInput = new TextInputBuilder()
        .setCustomId('host_name')
        .setLabel('Nome da Host (ex: discloud)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('discloud')
        .setRequired(true);

      const displayNameInput = new TextInputBuilder()
        .setCustomId('display_name')
        .setLabel('Nome de Exibição (ex: Discloud)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Discloud')
        .setRequired(true);

      const docInput = new TextInputBuilder()
        .setCustomId('documentation')
        .setLabel('Link da Documentação')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://docs.discloud.com')
        .setRequired(true);

      const providerInput = new TextInputBuilder()
        .setCustomId('provider_class')
        .setLabel('Classe do Provider (ex: DiscloudProvider)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('DiscloudProvider')
        .setRequired(true);

      const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
      const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(displayNameInput);
      const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(docInput);
      const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(providerInput);
      
      modal.addComponents(row1, row2, row3, row4);

      await interaction.showModal(modal);
    }
  } else if (action === 'back') {
    if (params[0] === 'main') {
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

        return interaction.update({ 
          components: [container, row]
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

      await interaction.update({ 
        components: [container, row1, row2, row3]
      });
    } else if (params[0] === 'host') {
      const hostName = params[1];
      const provider = hostManager.getProvider(hostName);

      if (!provider) {
        return interaction.reply({ content: 'Host não encontrada', ephemeral: true });
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

      const deployButton = new ButtonBuilder()
        .setCustomId(`deploy_${hostName}`)
        .setLabel('Deploy')
        .setStyle(ButtonStyle.Success);

      const configButton = new ButtonBuilder()
        .setCustomId('open_config')
        .setLabel('Configurações')
        .setStyle(ButtonStyle.Secondary);

      const backButton = new ButtonBuilder()
        .setCustomId('back_main')
        .setLabel('Voltar')
        .setStyle(ButtonStyle.Secondary);

      const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(deployButton, configButton, backButton);

      await interaction.editReply({ 
        components: [container, row1, row2]
      });
    }
  } else if (action === 'open' && params[0] === 'monitor') {
    if (!monitorManager) {
      return interaction.update({ content: 'Monitoramento não disponível', ephemeral: true });
    }

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
      monitoredApps.forEach((app: any) => {
        const provider = hostManager.getProvider(app.hostName);
        const statusText = app.lastStatus === 'online' ? 'Online' : 
                          app.lastStatus === 'offline' ? 'Offline' : 'Desconhecido';
        
        container.addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`**${provider?.name || app.hostName}**`),
              new TextDisplayBuilder().setContent(`App ID: \`${app.appId}\`\nStatus: ${statusText}\nCanal: <#${app.channelId}>`)
            )
            .setButtonAccessory(
              new ButtonBuilder()
                .setCustomId(`monitor_manage_${app.hostName}_${app.appId}`)
                .setLabel('Gerenciar')
                .setStyle(ButtonStyle.Primary)
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
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('back_main')
        .setLabel('Voltar')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ 
      components: [container, row]
    });
  } else if (action === 'monitor') {
    if (params[0] === 'add') {
      const modal = new ModalBuilder()
        .setCustomId('monitor_add_modal')
        .setTitle('Adicionar Monitoramento');

      const hostInput = new TextInputBuilder()
        .setCustomId('host_name')
        .setLabel('Nome da Host')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('discloud')
        .setRequired(true);

      const appInput = new TextInputBuilder()
        .setCustomId('app_id')
        .setLabel('ID do App')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('abc123')
        .setRequired(true);

      const channelInput = new TextInputBuilder()
        .setCustomId('channel_id')
        .setLabel('ID do Canal para Notificações')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('123456789')
        .setRequired(true);

      const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(hostInput);
      const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(appInput);
      const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput);
      
      modal.addComponents(row1, row2, row3);

      await interaction.showModal(modal);
    } else if (params[0] === 'manage') {
      const hostName = params[1];
      const appId = params[2];

      if (!monitorManager) {
        return interaction.reply({ content: 'Monitoramento não disponível', ephemeral: true });
      }

      const monitoredApps = monitorManager.getMonitoredApps();
      const app = monitoredApps.find((a: any) => a.hostName === hostName && a.appId === appId);

      if (!app) {
        return interaction.reply({ content: 'App não encontrado no monitoramento', ephemeral: true });
      }

      const provider = hostManager.getProvider(app.hostName);
      const statusText = app.lastStatus === 'online' ? 'Online' : 
                        app.lastStatus === 'offline' ? 'Offline' : 'Desconhecido';

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# Gerenciar Monitoramento`)
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**Host:** ${provider?.name || app.hostName}`),
          new TextDisplayBuilder().setContent(`**App ID:** \`${app.appId}\``),
          new TextDisplayBuilder().setContent(`**Status Atual:** ${statusText}`),
          new TextDisplayBuilder().setContent(`**Canal de Notificações:** <#${app.channelId}>`)
        );

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`monitor_edit_channel_${hostName}_${appId}`)
          .setLabel('Editar Canal')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`monitor_stop_${hostName}_${appId}`)
          .setLabel('Parar Monitoramento')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('open_monitor')
          .setLabel('Voltar')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.update({ 
        components: [container, row]
      });
    } else if (params[0] === 'edit' && params[1] === 'channel') {
      const hostName = params[2];
      const appId = params[3];

      const modal = new ModalBuilder()
        .setCustomId(`monitor_edit_modal_${hostName}_${appId}`)
        .setTitle('Editar Canal de Notificações');

      const channelInput = new TextInputBuilder()
        .setCustomId('channel_id')
        .setLabel('Novo ID do Canal')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('123456789')
        .setRequired(true);

      const row = new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput);
      modal.addComponents(row);

      await interaction.showModal(modal);
    } else if (params[0] === 'stop') {
      const hostName = params[1];
      const appId = params[2];

      if (monitorManager) {
        monitorManager.stopMonitoring(hostName, appId);
        await interaction.reply({ 
          content: `Monitoramento parado para ${hostName}/${appId}`,
          ephemeral: true 
        });
      }
    } else if (params[0] === 'refresh') {
      if (!monitorManager) {
        return interaction.update({ content: 'Monitoramento não disponível', ephemeral: true });
      }

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
        monitoredApps.forEach((app: any) => {
          const provider = hostManager.getProvider(app.hostName);
          const statusText = app.lastStatus === 'online' ? 'Online' : 
                            app.lastStatus === 'offline' ? 'Offline' : 'Desconhecido';
          
          container.addSectionComponents(
            new SectionBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**${provider?.name || app.hostName}**`),
                new TextDisplayBuilder().setContent(`App ID: \`${app.appId}\`\nStatus: ${statusText}\nCanal: <#${app.channelId}>`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`monitor_manage_${app.hostName}_${app.appId}`)
                  .setLabel('Gerenciar')
                  .setStyle(ButtonStyle.Primary)
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
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('back_main')
          .setLabel('Voltar')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.update({ 
        components: [container, row]
      });
    }
  } else if (action === 'deploy') {
    const hostName = params[0];
    
    const modal = new ModalBuilder()
      .setCustomId(`deploy_modal_${hostName}`)
      .setTitle(`Deploy - ${hostName}`);

    const urlInput = new TextInputBuilder()
      .setCustomId('file_url')
      .setLabel('URL do arquivo .zip')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://exemplo.com/bot.zip')
      .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(urlInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  } else if (['start', 'stop', 'restart'].includes(action)) {
    const hostName = params[0];
    const appId = params[1];

    const provider = hostManager.getProvider(hostName);
    if (!provider) {
      return interaction.reply({ content: 'Host não encontrada', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      let result;
      if (action === 'start') result = await provider.start(appId);
      else if (action === 'stop') result = await provider.stop(appId);
      else result = await provider.restart(appId);

      if (result.success) {
        await interaction.editReply({ content: result.message });
        
        setTimeout(async () => {
          const status = await provider.getStatus(appId);

          const container = new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# ${status.name}`)
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addSectionComponents(
              new SectionBuilder()
                .addTextDisplayComponents(
                  new TextDisplayBuilder().setContent(`**Status:** ${status.status === 'online' ? 'ONLINE' : 'OFFLINE'}`),
                  new TextDisplayBuilder().setContent(`**ID:** \`${status.id}\``)
                )
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

          const startBtn = new ButtonBuilder()
            .setCustomId(`start_${hostName}_${appId}`)
            .setLabel('Iniciar')
            .setStyle(ButtonStyle.Success)
            .setDisabled(status.status === 'online');

          const stopBtn = new ButtonBuilder()
            .setCustomId(`stop_${hostName}_${appId}`)
            .setLabel('Parar')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(status.status === 'offline');

          const restartBtn = new ButtonBuilder()
            .setCustomId(`restart_${hostName}_${appId}`)
            .setLabel('Reiniciar')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(status.status === 'offline');

          const logsBtn = new ButtonBuilder()
            .setCustomId(`logs_${hostName}_${appId}`)
            .setLabel('Logs')
            .setStyle(ButtonStyle.Secondary);

          const backBtn = new ButtonBuilder()
            .setCustomId(`back_host_${hostName}`)
            .setLabel('Voltar')
            .setStyle(ButtonStyle.Secondary);

          const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(startBtn, stopBtn, restartBtn);
          const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(logsBtn, backBtn);

          await interaction.message.edit({ 
            components: [container, row1, row2]
          });
        }, 2000);
      } else {
        await interaction.editReply({ content: result.message });
      }
    } catch (error: any) {
      await interaction.editReply({ content: `Erro: ${error.message}` });
    }
  } else if (action === 'open' && params[0] === 'history') {
    if (!deployHistoryManager) {
      return interaction.update({ content: 'Histórico não disponível', ephemeral: true });
    }

    const history = deployHistoryManager.getHistory(undefined, undefined, 15);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Histórico de Deploys'),
        new TextDisplayBuilder().setContent('Últimos 15 deploys realizados')
      )
      .addSeparatorComponents(new SeparatorBuilder());

    if (history.length === 0) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Nenhum deploy registrado ainda')
      );
    } else {
      history.forEach((deploy: any) => {
        const date = new Date(deploy.timestamp);
        const statusEmoji = deploy.status === 'success' ? '✓' : '✗';
        
        container.addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`**${deploy.hostName}** - ${deploy.fileName}`),
              new TextDisplayBuilder().setContent(`${statusEmoji} ${deploy.status === 'success' ? 'Sucesso' : 'Falhou'} - ${date.toLocaleString('pt-BR')}\nApp: \`${deploy.appId}\``)
            )
            .setButtonAccessory(
              new ButtonBuilder()
                .setCustomId(`history_view_${deploy.id}`)
                .setLabel('Detalhes')
                .setStyle(ButtonStyle.Secondary)
            )
        );
      });
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('history_refresh')
        .setLabel('Atualizar')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('back_main')
        .setLabel('Voltar')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ 
      components: [container, row]
    });
  } else if (action === 'history') {
    if (params[0] === 'view') {
      const deployId = params[1];
      if (!deployHistoryManager) {
        return interaction.reply({ content: 'Histórico não disponível', ephemeral: true });
      }

      const deploy = deployHistoryManager.getDeployById(deployId);
      if (!deploy) {
        return interaction.reply({ content: 'Deploy não encontrado', ephemeral: true });
      }

      const date = new Date(deploy.timestamp);
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# Detalhes do Deploy`)
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**Host:** ${deploy.hostName}`),
          new TextDisplayBuilder().setContent(`**App ID:** \`${deploy.appId}\``),
          new TextDisplayBuilder().setContent(`**Arquivo:** ${deploy.fileName}`),
          new TextDisplayBuilder().setContent(`**Status:** ${deploy.status === 'success' ? 'Sucesso ✓' : 'Falhou ✗'}`),
          new TextDisplayBuilder().setContent(`**Data:** ${date.toLocaleString('pt-BR')}`),
          new TextDisplayBuilder().setContent(`**Usuário:** <@${deploy.userId}>`)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**Mensagem:**\n${deploy.message}`)
        );

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('open_history')
          .setLabel('Voltar')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.update({ 
        components: [container, row]
      });
    } else if (params[0] === 'refresh') {
      if (!deployHistoryManager) {
        return interaction.update({ content: 'Histórico não disponível', ephemeral: true });
      }

      const history = deployHistoryManager.getHistory(undefined, undefined, 15);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('# Histórico de Deploys'),
          new TextDisplayBuilder().setContent('Últimos 15 deploys realizados')
        )
        .addSeparatorComponents(new SeparatorBuilder());

      if (history.length === 0) {
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent('Nenhum deploy registrado ainda')
        );
      } else {
        history.forEach((deploy: any) => {
          const date = new Date(deploy.timestamp);
          const statusEmoji = deploy.status === 'success' ? '✓' : '✗';
          
          container.addSectionComponents(
            new SectionBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**${deploy.hostName}** - ${deploy.fileName}`),
                new TextDisplayBuilder().setContent(`${statusEmoji} ${deploy.status === 'success' ? 'Sucesso' : 'Falhou'} - ${date.toLocaleString('pt-BR')}\nApp: \`${deploy.appId}\``)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`history_view_${deploy.id}`)
                  .setLabel('Detalhes')
                  .setStyle(ButtonStyle.Secondary)
              )
          );
        });
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('history_refresh')
          .setLabel('Atualizar')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('back_main')
          .setLabel('Voltar')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.update({ 
        components: [container, row]
      });
    }
  } else if (action === 'open' && params[0] === 'notifications') {
    if (!notificationManager) {
      return interaction.update({ content: 'Notificações não disponíveis', ephemeral: true });
    }

    const settings = notificationManager.getUserSettings(interaction.user.id);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Configurações de Notificações'),
        new TextDisplayBuilder().setContent('Escolha quais eventos você quer ser notificado')
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Método:** ${settings.method === 'dm' ? 'Mensagem Direta' : 'Canal'}`),
        new TextDisplayBuilder().setContent(`**Deploy:** ${settings.events.deploy ? 'Ativado ✓' : 'Desativado ✗'}`),
        new TextDisplayBuilder().setContent(`**Mudança de Status:** ${settings.events.statusChange ? 'Ativado ✓' : 'Desativado ✗'}`),
        new TextDisplayBuilder().setContent(`**Crash:** ${settings.events.crash ? 'Ativado ✓' : 'Desativado ✗'}`),
        new TextDisplayBuilder().setContent(`**Restart:** ${settings.events.restart ? 'Ativado ✓' : 'Desativado ✗'}`)
      );

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('notif_toggle_deploy')
        .setLabel('Deploy')
        .setStyle(settings.events.deploy ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('notif_toggle_statusChange')
        .setLabel('Status')
        .setStyle(settings.events.statusChange ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('notif_toggle_crash')
        .setLabel('Crash')
        .setStyle(settings.events.crash ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('notif_toggle_restart')
        .setLabel('Restart')
        .setStyle(settings.events.restart ? ButtonStyle.Success : ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('notif_method')
        .setLabel(`Método: ${settings.method === 'dm' ? 'DM' : 'Canal'}`)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('back_main')
        .setLabel('Voltar')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ 
      components: [container, row1, row2]
    });
  } else if (action === 'notif') {
    if (params[0] === 'toggle') {
      const eventType = params[1] as any;
      if (!notificationManager) {
        return interaction.reply({ content: 'Notificações não disponíveis', ephemeral: true });
      }

      const newState = notificationManager.toggleEvent(interaction.user.id, eventType);
      await interaction.reply({ 
        content: `Notificações de ${eventType} ${newState ? 'ativadas' : 'desativadas'}`,
        ephemeral: true 
      });
    } else if (params[0] === 'method') {
      if (!notificationManager) {
        return interaction.reply({ content: 'Notificações não disponíveis', ephemeral: true });
      }

      const settings = notificationManager.getUserSettings(interaction.user.id);
      const newMethod = settings.method === 'dm' ? 'channel' : 'dm';
      notificationManager.setUserSettings(interaction.user.id, { method: newMethod });

      await interaction.reply({ 
        content: `Método alterado para ${newMethod === 'dm' ? 'Mensagem Direta' : 'Canal'}`,
        ephemeral: true 
      });
    }
  } else if (action === 'migrate') {
    const hostName = params[0];
    const appId = params[1];

    if (!migrationManager) {
      return interaction.reply({ content: 'Sistema de migração não disponível', ephemeral: true });
    }

    const providers = hostManager.getAllProviders();
    const otherHosts = providers.filter(p => p.name.toLowerCase() !== hostName);

    if (otherHosts.length === 0) {
      return interaction.reply({ content: 'Nenhuma outra host configurada para migrar', ephemeral: true });
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Migrar App'),
        new TextDisplayBuilder().setContent(`Escolha a host de destino para migrar o app \`${appId}\``)
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Host Atual:** ${hostName}`),
        new TextDisplayBuilder().setContent(`**App ID:** \`${appId}\``)
      );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`migrate_select_${hostName}_${appId}`)
      .setPlaceholder('Escolha a host de destino')
      .addOptions(
        otherHosts.map(p => ({
          label: p.name,
          value: p.name.toLowerCase(),
          description: `Migrar para ${p.name}`
        }))
      );

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`back_app_${hostName}_${appId}`)
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ 
      components: [container, row1, row2]
    });
  } else if (action === 'backup') {
    const hostName = params[0];
    const appId = params[1];

    if (!migrationManager) {
      return interaction.reply({ content: 'Sistema de backup não disponível', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await migrationManager.backupApp(hostName, appId);
      
      if (result.success) {
        await interaction.editReply({ 
          content: `Backup criado com sucesso\nArquivo: \`${result.backupPath}\`\n${result.message}` 
        });
      } else {
        await interaction.editReply({ content: result.message });
      }
    } catch (error: any) {
      await interaction.editReply({ content: `Erro ao criar backup: ${error.message}` });
    }
  } else if (action === 'logs') {
    const hostName = params[0];
    const appId = params[1];

    const provider = hostManager.getProvider(hostName);
    if (!provider) {
      return interaction.reply({ content: 'Host não encontrada', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const logs = await provider.getLogs(appId);
      const truncated = logs.length > 1900 ? logs.slice(-1900) + '\n...' : logs;
      
      await interaction.editReply({ content: `**Logs**\n\`\`\`\n${truncated}\n\`\`\`` });
    } catch (error: any) {
      await interaction.editReply({ content: `Erro: ${error.message}` });
    }
  }
}

async function handleModal(interaction: any, hostManager: HostManager, configManager: ConfigManager, monitorManager?: any, deployHistoryManager?: any, notificationManager?: any, migrationManager?: any) {
  const [action, type, hostName] = interaction.customId.split('_');

  if (action === 'deploy' && type === 'modal') {
    const fileUrl = interaction.fields.getTextInputValue('file_url');

    const provider = hostManager.getProvider(hostName);
    if (!provider) {
      return interaction.reply({ content: 'Host não encontrada', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const axios = (await import('axios')).default;
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      const result = await provider.deploy(buffer, 'bot.zip');

      if (result.success) {
        if (deployHistoryManager) {
          deployHistoryManager.addDeploy(hostName, result.appId || 'unknown', fileUrl, 'success', result.message, interaction.user.id);
        }
        if (notificationManager) {
          await notificationManager.notify(interaction.user.id, 'deploy', `Deploy realizado com sucesso em ${hostName}\nApp ID: ${result.appId}`);
        }
        await interaction.editReply({ content: `Deploy realizado\nApp ID: \`${result.appId}\`\n${result.message}` });
      } else {
        if (deployHistoryManager) {
          deployHistoryManager.addDeploy(hostName, 'failed', fileUrl, 'failed', result.message, interaction.user.id);
        }
        await interaction.editReply({ content: result.message });
      }
    } catch (error: any) {
      await interaction.editReply({ content: `Erro: ${error.message}` });
    }
  } else if (action === 'config' && type === 'modal') {
    const apiToken = interaction.fields.getTextInputValue('api_token');

    try {
      configManager.setHostToken(hostName, apiToken);

      const { DiscloudProvider } = await import('../providers/DiscloudProvider.js');
      const { SquareCloudProvider } = await import('../providers/SquareCloudProvider.js');

      if (hostName === 'discloud') {
        const provider = new DiscloudProvider(apiToken);
        hostManager.addProvider(provider);
      } else if (hostName === 'squarecloud') {
        const provider = new SquareCloudProvider(apiToken);
        hostManager.addProvider(provider);
      }

      await interaction.reply({ 
        content: `${hostName.charAt(0).toUpperCase() + hostName.slice(1)} configurada com sucesso`,
        ephemeral: true 
      });
    } catch (error: any) {
      await interaction.reply({ 
        content: `Erro ao configurar: ${error.message}`,
        ephemeral: true 
      });
    }
  } else if (action === 'add' && type === 'host' && hostName === 'modal') {
    const hostNameInput = interaction.fields.getTextInputValue('host_name').toLowerCase();
    const displayName = interaction.fields.getTextInputValue('display_name');
    const documentation = interaction.fields.getTextInputValue('documentation');
    const providerClass = interaction.fields.getTextInputValue('provider_class');

    try {
      configManager.addAvailableHost(hostNameInput, displayName, documentation, providerClass);

      await interaction.reply({ 
        content: `Host ${displayName} adicionada com sucesso\nDocumentação: ${documentation}`,
        ephemeral: true 
      });
    } catch (error: any) {
      await interaction.reply({ 
        content: `Erro ao adicionar host: ${error.message}`,
        ephemeral: true 
      });
    }
  } else if (action === 'monitor' && type === 'add' && hostName === 'modal') {
    const hostNameInput = interaction.fields.getTextInputValue('host_name');
    const appId = interaction.fields.getTextInputValue('app_id');
    const channelId = interaction.fields.getTextInputValue('channel_id');

    try {
      if (monitorManager) {
        monitorManager.startMonitoring(hostNameInput, appId, channelId);
        await interaction.reply({ 
          content: `Monitoramento iniciado para ${hostNameInput}/${appId}`,
          ephemeral: true 
        });
      }
    } catch (error: any) {
      await interaction.reply({ 
        content: `Erro ao iniciar monitoramento: ${error.message}`,
        ephemeral: true 
      });
    }
  } else if (action === 'monitor' && type === 'edit' && hostName === 'modal') {
    const parts = interaction.customId.split('_');
    const hostNameValue = parts[3];
    const appId = parts[4];
    const newChannelId = interaction.fields.getTextInputValue('channel_id');

    try {
      if (monitorManager) {
        monitorManager.stopMonitoring(hostNameValue, appId);
        monitorManager.startMonitoring(hostNameValue, appId, newChannelId);
        await interaction.reply({ 
          content: `Canal de notificações atualizado para <#${newChannelId}>`,
          ephemeral: true 
        });
      }
    } catch (error: any) {
      await interaction.reply({ 
        content: `Erro ao atualizar canal: ${error.message}`,
        ephemeral: true 
      });
    }
  } else if (action === 'migrate' && type === 'confirm') {
    const parts = interaction.customId.split('_');
    const fromHost = parts[2];
    const toHost = parts[3];
    const appId = parts[4];
    const deleteSource = interaction.fields.getTextInputValue('delete_source').toLowerCase();

    if (!migrationManager) {
      return interaction.reply({ content: 'Sistema de migração não disponível', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const shouldDelete = deleteSource === 'sim' || deleteSource === 's' || deleteSource === 'yes' || deleteSource === 'y';
      
      await interaction.editReply({ content: 'Iniciando migração... Isso pode levar alguns minutos.' });

      const result = await migrationManager.migrateApp(fromHost, toHost, appId, shouldDelete);

      if (result.success) {
        if (notificationManager) {
          await notificationManager.notify(interaction.user.id, 'deploy', `Migração concluída\nDe: ${fromHost}\nPara: ${toHost}\nApp ID: ${appId}`);
        }
        await interaction.editReply({ 
          content: `Migração concluída com sucesso\n\n**De:** ${fromHost}\n**Para:** ${toHost}\n**App ID:** \`${appId}\`\n**Deletado da origem:** ${shouldDelete ? 'Sim' : 'Não'}\n\n${result.message}` 
        });
      } else {
        await interaction.editReply({ content: `Erro na migração: ${result.message}` });
      }
    } catch (error: any) {
      await interaction.editReply({ content: `Erro ao migrar: ${error.message}` });
    }
  } else if (action === 'config' && type === 'confirm' && hostName === 'delete') {
    const hostToDelete = interaction.customId.split('_')[3];
    const confirmText = interaction.fields.getTextInputValue('confirm');

    if (confirmText === hostToDelete) {
      try {
        configManager.removeAvailableHost(hostToDelete);
        await interaction.reply({ 
          content: `Host ${hostToDelete} deletada completamente do sistema`,
          ephemeral: true 
        });
      } catch (error: any) {
        await interaction.reply({ 
          content: `Erro ao deletar host: ${error.message}`,
          ephemeral: true 
        });
      }
    } else {
      await interaction.reply({ 
        content: 'Confirmação incorreta. Host não foi deletada.',
        ephemeral: true 
      });
    }
  }
}
