import { ChatInputCommandInteraction, SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';
import { DeployHistoryManager } from '../managers/DeployHistoryManager.js';
import { NotificationManager } from '../managers/NotificationManager.js';
import axios from 'axios';

export const data = new SlashCommandBuilder()
  .setName('deploy')
  .setDescription('Faz deploy de um bot em uma host')
  .addStringOption(option =>
    option.setName('host')
      .setDescription('Host para deploy')
      .setRequired(true)
      .addChoices(
        { name: 'Discloud', value: 'discloud' },
        { name: 'SquareCloud', value: 'squarecloud' }
      ))
  .addAttachmentOption(option =>
    option.setName('arquivo')
      .setDescription('Arquivo .zip do bot')
      .setRequired(true));

export async function execute(
  interaction: ChatInputCommandInteraction, 
  hostManager: HostManager,
  deployHistoryManager?: DeployHistoryManager,
  notificationManager?: NotificationManager
) {
  await interaction.deferReply();

  const hostName = interaction.options.getString('host', true);
  const attachment = interaction.options.getAttachment('arquivo', true);

  const provider = hostManager.getProvider(hostName);
  if (!provider) {
    return interaction.editReply('Host não configurada');
  }

  if (!attachment.name.endsWith('.zip')) {
    return interaction.editReply('Envie um arquivo .zip');
  }

  try {
    const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
    let buffer = Buffer.from(response.data);

    if (hostName === 'squarecloud') {
      const { needsSquareCloudConfig, ensureSquareCloudConfig } = await import('../utils/zipHelper.js');
      
      if (needsSquareCloudConfig(buffer)) {
        await interaction.editReply('Arquivo de configuração SquareCloud não encontrado. Criando automaticamente...');
        buffer = await ensureSquareCloudConfig(buffer);
      }
    }

    const result = await provider.deploy(buffer, attachment.name);

    if (result.success) {
      if (deployHistoryManager) {
        deployHistoryManager.addDeploy(hostName, result.appId || 'unknown', attachment.url, 'success', result.message, interaction.user.id);
      }
      if (notificationManager) {
        await notificationManager.notify(interaction.user.id, 'deploy', `Deploy realizado com sucesso em ${hostName}\nApp ID: ${result.appId}`);
      }
      return interaction.editReply(`Deploy realizado com sucesso na ${provider.name}\nApp ID: \`${result.appId}\`\n${result.message}`);
    } else {
      if (deployHistoryManager) {
        deployHistoryManager.addDeploy(hostName, 'failed', attachment.url, 'failed', result.message, interaction.user.id);
      }
      return interaction.editReply(`Erro no deploy: ${result.message}`);
    }
  } catch (error: any) {
    return interaction.editReply(`Erro: ${error.message}`);
  }
}
