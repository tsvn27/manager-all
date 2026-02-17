import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } from 'discord.js';
import { ConfigManager } from '../managers/ConfigManager.js';

export async function handleOpenConfig(interaction: any, configManager: ConfigManager) {
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
      .setCustomId('config_global_settings')
      .setLabel('Configurações Globais')
      .setStyle(ButtonStyle.Primary),
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
}

export async function handleManageHost(interaction: any, configManager: ConfigManager, hostName: string) {
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

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(0, Math.min(5, buttons.length)));
  const rows = [container, row1];
  
  if (buttons.length > 5) {
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(5));
    rows.push(row2);
  }

  await interaction.update({ 
    components: rows,
    flags: MessageFlags.IsComponentsV2
  });
}

export async function handleGlobalSettings(interaction: any, configManager: ConfigManager) {
  const settings = configManager.getAllSettings();

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Configurações Globais')
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('**Backup Automático**'),
          new TextDisplayBuilder().setContent(`Status: ${settings.autoBackupBeforeDeploy ? 'Ativado' : 'Desativado'}`)
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId('config_toggle_autobackup')
            .setLabel(settings.autoBackupBeforeDeploy ? 'Desativar' : 'Ativar')
            .setStyle(settings.autoBackupBeforeDeploy ? ButtonStyle.Danger : ButtonStyle.Success)
        )
    )
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('**Máximo de Backups**'),
          new TextDisplayBuilder().setContent(`Valor: ${settings.maxBackups}`)
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId('config_edit_maxbackups')
            .setLabel('Editar')
            .setStyle(ButtonStyle.Primary)
        )
    )
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('**Retenção de Backups (dias)**'),
          new TextDisplayBuilder().setContent(`Valor: ${settings.backupRetentionDays}`)
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId('config_edit_retention')
            .setLabel('Editar')
            .setStyle(ButtonStyle.Primary)
        )
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('open_config')
      .setLabel('Voltar')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ 
    components: [container, row],
    flags: MessageFlags.IsComponentsV2
  });
}

export function showConfigModal(interaction: any, hostName: string, isEdit: boolean) {
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

  return interaction.showModal(modal);
}
