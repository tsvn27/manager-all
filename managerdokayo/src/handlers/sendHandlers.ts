import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, ChannelType, type MessageActionRowComponentBuilder } from 'discord.js';
import { PlanManager } from '../managers/PlanManager.js';
import { CustomerManager } from '../managers/CustomerManager.js';

export async function handleSendMessagesPanel(interaction: any) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# 📤 Enviar Mensagens')
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Enviar Planos:** Envia um container com todos os planos ativos em um canal para os clientes comprarem.'),
      new TextDisplayBuilder().setContent('**Enviar App:** Envia um container de gerenciamento de uma aplicação específica para um cliente.')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('send_plans_modal')
      .setLabel('📋 Enviar Planos')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('send_app_modal')
      .setLabel('🎮 Enviar App')
      .setStyle(ButtonStyle.Primary)
  );

  container.addActionRowComponents(row);

  const backBtn = new ButtonBuilder()
    .setCustomId('back_main')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

  await interaction.update({
    components: [container, backRow],
    flags: MessageFlags.IsComponentsV2
  });
}

export function showSendPlansModal(interaction: any) {
  const modal = new ModalBuilder()
    .setCustomId('send_plans_submit')
    .setTitle('Enviar Planos');

  const channelInput = new TextInputBuilder()
    .setCustomId('channel_id')
    .setLabel('ID do Canal')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Cole o ID do canal aqui')
    .setRequired(true);

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput);
  modal.addComponents(row);

  return interaction.showModal(modal);
}

export function showSendAppModal(interaction: any) {
  const modal = new ModalBuilder()
    .setCustomId('send_app_submit')
    .setTitle('Enviar Container de App');

  const channelInput = new TextInputBuilder()
    .setCustomId('channel_id')
    .setLabel('ID do Canal')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Cole o ID do canal aqui')
    .setRequired(true);

  const userInput = new TextInputBuilder()
    .setCustomId('user_id')
    .setLabel('ID do Cliente')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Cole o ID do Discord do cliente')
    .setRequired(true);

  const appInput = new TextInputBuilder()
    .setCustomId('app_id')
    .setLabel('ID da Aplicação')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: abc123')
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(userInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(appInput)
  );

  return interaction.showModal(modal);
}

export async function handleSendPlansSubmit(interaction: any, planManager: PlanManager) {
  const channelId = interaction.fields.getTextInputValue('channel_id');
  const plans = planManager.getActivePlans();

  if (plans.length === 0) {
    await interaction.reply({ content: '❌ Nenhum plano ativo disponível. Crie planos primeiro.', ephemeral: true });
    return;
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# 🚀 Planos de Hospedagem Disponíveis'),
      new TextDisplayBuilder().setContent('Escolha o plano ideal para sua aplicação e comece agora!')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  plans.forEach(plan => {
    const { SectionBuilder } = require('discord.js');
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**${plan.name}**`),
          new TextDisplayBuilder().setContent(`💰 **R$ ${plan.price.toFixed(2)}** por ${plan.duration} dias`),
          new TextDisplayBuilder().setContent(`📊 **Recursos:**`),
          new TextDisplayBuilder().setContent(`• RAM: \`${plan.resources.ram}\``),
          new TextDisplayBuilder().setContent(`• CPU: \`${plan.resources.cpu}\``),
          new TextDisplayBuilder().setContent(`• Storage: \`${plan.resources.storage}\``),
          new TextDisplayBuilder().setContent(`• Host: \`${plan.hostName}\``)
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(`plan_buy_${plan.id}`)
            .setLabel('Comprar Agora')
            .setStyle(ButtonStyle.Success)
        )
    );
  });

  try {
    const channel = await interaction.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      await interaction.reply({ content: '❌ Canal inválido.', ephemeral: true });
      return;
    }

    await (channel as any).send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    await interaction.reply({ content: `✅ Mensagem de planos enviada em <#${channelId}>`, ephemeral: true });
  } catch (error: any) {
    await interaction.reply({ content: `❌ Erro ao enviar mensagem: ${error.message}`, ephemeral: true });
  }
}

export async function handleSendAppSubmit(interaction: any, customerManager: CustomerManager, planManager: PlanManager) {
  const channelId = interaction.fields.getTextInputValue('channel_id');
  const userId = interaction.fields.getTextInputValue('user_id');
  const appId = interaction.fields.getTextInputValue('app_id');

  const app = customerManager.getApplication(userId, appId);

  if (!app) {
    await interaction.reply({ content: '❌ Aplicação não encontrada para este cliente.', ephemeral: true });
    return;
  }

  const plan = planManager.getPlan(app.planId);
  const now = Date.now();
  const daysLeft = Math.ceil((app.expiryDate - now) / (1000 * 60 * 60 * 24));
  const statusEmoji = app.status === 'active' ? '🟢' : app.status === 'suspended' ? '🟡' : '🔴';

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# 🎮 Gerenciar Aplicação: ${appId}`),
      new TextDisplayBuilder().setContent(`👤 **Cliente:** <@${userId}>`)
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
    const channel = await interaction.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      await interaction.reply({ content: '❌ Canal inválido.', ephemeral: true });
      return;
    }

    await (channel as any).send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    await interaction.reply({ content: `✅ Container de gerenciamento enviado em <#${channelId}> para a aplicação \`${appId}\``, ephemeral: true });
  } catch (error: any) {
    await interaction.reply({ content: `❌ Erro ao enviar container: ${error.message}`, ephemeral: true });
  }
}
