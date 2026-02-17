import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';
import { ConfigManager } from '../managers/ConfigManager.js';

export async function handleModal(interaction: any, hostManager: HostManager, configManager: ConfigManager, monitorManager?: any, deployHistoryManager?: any, notificationManager?: any, migrationManager?: any, envManager?: any) {
  const [action, type, hostName] = interaction.customId.split('_');

  if (action === 'config' && type === 'modal') {
    return handleConfigModal(interaction, configManager, hostName);
  }

  if (action === 'config' && type === 'maxbackups' && hostName === 'modal') {
    return handleMaxBackupsModal(interaction, configManager);
  }

  if (action === 'config' && type === 'retention' && hostName === 'modal') {
    return handleRetentionModal(interaction, configManager);
  }
}

async function handleConfigModal(interaction: any, configManager: ConfigManager, hostName: string) {
  const token = interaction.fields.getTextInputValue('api_token');

  try {
    configManager.setHostToken(hostName, token);
    configManager.enableHost(hostName);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Host ${hostName} configurada com sucesso`)
      );

    await interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  } catch (error: any) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Erro ao configurar: ${error.message}`)
      );

    await interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  }
}

async function handleMaxBackupsModal(interaction: any, configManager: ConfigManager) {
  const value = parseInt(interaction.fields.getTextInputValue('value'));
  
  if (isNaN(value) || value < 1) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Valor inválido. Digite um número maior que 0.')
      );
    return interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  }

  configManager.setSetting('maxBackups', value);
  
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`Máximo de backups atualizado para ${value}`)
    );
  await interaction.reply({ 
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    ephemeral: true 
  });
}

async function handleRetentionModal(interaction: any, configManager: ConfigManager) {
  const value = parseInt(interaction.fields.getTextInputValue('value'));
  
  if (isNaN(value) || value < 1) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Valor inválido. Digite um número maior que 0.')
      );
    return interaction.reply({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true 
    });
  }

  configManager.setSetting('backupRetentionDays', value);
  
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`Retenção de backups atualizada para ${value} dias`)
    );
  await interaction.reply({ 
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    ephemeral: true 
  });
}
