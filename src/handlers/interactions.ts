import { Interaction, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';
import { ConfigManager } from '../managers/ConfigManager.js';

export async function handleInteraction(interaction: Interaction, hostManager: HostManager, configManager: ConfigManager) {
  if (interaction.isStringSelectMenu()) {
    await handleSelectMenu(interaction, hostManager);
  } else if (interaction.isButton()) {
    await handleButton(interaction, hostManager, configManager);
  } else if (interaction.isModalSubmit()) {
    await handleModal(interaction, hostManager, configManager);
  }
}

async function handleSelectMenu(interaction: any, hostManager: HostManager) {
  const [action, ...params] = interaction.customId.split('_');

  if (action === 'select' && params[0] === 'host') {
    const hostName = interaction.values[0];
    const provider = hostManager.getProvider(hostName);

    if (!provider) {
      return interaction.reply({ content: 'Host não encontrada', ephemeral: true });
    }

    await interaction.deferReply();

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
        components: [container, row1, row2],
        flags: MessageFlags.IsComponentsV2
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

    await interaction.deferReply();

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

      const backBtn = new ButtonBuilder()
        .setCustomId(`back_host_${hostName}`)
        .setLabel('Voltar')
        .setStyle(ButtonStyle.Secondary);

      const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(startBtn, stopBtn, restartBtn);
      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(logsBtn, backBtn);

      await interaction.editReply({ 
        components: [container, row1, row2],
        flags: MessageFlags.IsComponentsV2
      });
    } catch (error: any) {
      await interaction.editReply({ content: `Erro: ${error.message}` });
    }
  }
}

async function handleButton(interaction: any, hostManager: HostManager, configManager: ConfigManager) {
  const [action, ...params] = interaction.customId.split('_');

  if (action === 'open' && params[0] === 'config') {
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
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('back_main')
        .setLabel('Voltar')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ 
      components: [container, row],
      flags: MessageFlags.IsComponentsV2
    });
  } else if (action === 'config') {
    if (params[0] === 'host') {
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
        components: [container, row],
        flags: MessageFlags.IsComponentsV2
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

      const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(configButton);

      await interaction.update({ 
        components: [container, row1, row2],
        flags: MessageFlags.IsComponentsV2
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
        components: [container, row1, row2],
        flags: MessageFlags.IsComponentsV2
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
            components: [container, row1, row2],
            flags: MessageFlags.IsComponentsV2
          });
        }, 2000);
      } else {
        await interaction.editReply({ content: result.message });
      }
    } catch (error: any) {
      await interaction.editReply({ content: `Erro: ${error.message}` });
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

async function handleModal(interaction: any, hostManager: HostManager, configManager: ConfigManager) {
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
        await interaction.editReply({ content: `Deploy realizado\nApp ID: \`${result.appId}\`\n${result.message}` });
      } else {
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
  }
}
