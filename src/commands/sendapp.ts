import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, type MessageActionRowComponentBuilder } from 'discord.js';
import { CustomerManager } from '../managers/CustomerManager.js';
import { PlanManager } from '../managers/PlanManager.js';

export const data = new SlashCommandBuilder()
  .setName('sendapp')
  .setDescription('Envia o container de gerenciamento de uma aplicação')
  .addChannelOption(option =>
    option
      .setName('canal')
      .setDescription('Canal onde o container será enviado')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addUserOption(option =>
    option
      .setName('cliente')
      .setDescription('Cliente dono da aplicação')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('appid')
      .setDescription('ID da aplicação')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction, customerManager: CustomerManager, planManager: PlanManager) {
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.options.getChannel('canal', true);
  const cliente = interaction.options.getUser('cliente', true);
  const appId = interaction.options.getString('appid', true);

  const app = customerManager.getApplication(cliente.id, appId);

  if (!app) {
    await interaction.editReply('❌ Aplicação não encontrada para este cliente.');
    return;
  }

  const plan = planManager.getPlan(app.planId);
  const now = Date.now();
  const daysLeft = Math.ceil((app.expiryDate - now) / (1000 * 60 * 60 * 24));
  const statusEmoji = app.status === 'active' ? '🟢' : app.status === 'suspended' ? '🟡' : '🔴';

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# 🎮 Gerenciar Aplicação: ${appId}`),
      new TextDisplayBuilder().setContent(`👤 **Cliente:** <@${cliente.id}>`)
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${statusEmoji} **Status:** \`${app.status}\``),
      new TextDisplayBuilder().setContent(`📦 **Plano:** ${plan?.name || 'Desconhecido'}`),
      new TextDisplayBuilder().setContent(`🏠 **Host:** \`${app.hostName}\``),
      new TextDisplayBuilder().setContent(`⏰ **Expira em:** \`${daysLeft} dias\``),
      new TextDisplayBuilder().setContent(`🔄 **Auto-renovar:** ${app.autoRenew ? '✅ Ativado' : '❌ Desativado'}`)
    )
    .addSeparatorComponents(new SeparatorBuilder());

  const row1 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`app_start_${appId}`)
      .setLabel('▶️ Ligar')
      .setStyle(ButtonStyle.Success)
      .setDisabled(app.status !== 'active'),
    new ButtonBuilder()
      .setCustomId(`app_stop_${appId}`)
      .setLabel('⏹️ Desligar')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(app.status !== 'active'),
    new ButtonBuilder()
      .setCustomId(`app_restart_${appId}`)
      .setLabel('🔄 Reiniciar')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(app.status !== 'active')
  );

  const row2 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`app_logs_${appId}`)
      .setLabel('📋 Ver Logs')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(app.status !== 'active'),
    new ButtonBuilder()
      .setCustomId(`app_status_${appId}`)
      .setLabel('📊 Status Detalhado')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(app.status !== 'active')
  );

  const row3 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`app_renew_${appId}`)
      .setLabel('💳 Renovar Plano')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`app_toggle_autorenew_${appId}`)
      .setLabel(app.autoRenew ? '🔕 Desativar Auto-renovar' : '🔔 Ativar Auto-renovar')
      .setStyle(app.autoRenew ? ButtonStyle.Secondary : ButtonStyle.Success)
  );

  container.addActionRowComponents(row1, row2, row3);

  try {
    const textChannel = await interaction.client.channels.fetch(channel.id);
    if (!textChannel || !textChannel.isTextBased() || textChannel.isDMBased()) {
      await interaction.editReply('❌ Canal inválido.');
      return;
    }

    await (textChannel as any).send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    await interaction.editReply(`✅ Container de gerenciamento enviado em <#${channel.id}> para a aplicação \`${appId}\``);
  } catch (error: any) {
    await interaction.editReply(`❌ Erro ao enviar container: ${error.message}`);
  }
}
