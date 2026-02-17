import { ChatInputCommandInteraction, SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { HostManager } from '../managers/HostManager.js';
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

export async function execute(interaction: ChatInputCommandInteraction, hostManager: HostManager) {
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
    const buffer = Buffer.from(response.data);

    const result = await provider.deploy(buffer, attachment.name);

    if (result.success) {
      return interaction.editReply(`Deploy realizado na ${provider.name}\nApp ID: \`${result.appId}\`\n${result.message}`);
    } else {
      return interaction.editReply(`Erro no deploy: ${result.message}`);
    }
  } catch (error: any) {
    return interaction.editReply(`Erro: ${error.message}`);
  }
}
