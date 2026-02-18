import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, type MessageActionRowComponentBuilder } from 'discord.js';
import { CustomerManager } from '../managers/CustomerManager.js';
import { ConfigManager } from '../managers/ConfigManager.js';
import { PlanManager } from '../managers/PlanManager.js';
import { PaymentManager } from '../managers/PaymentManager.js';
import { getProvider } from '../commands/app.js';

export async function handleAppStart(interaction: any, customerManager: CustomerManager, configManager: ConfigManager, appId: string) {
  await interaction.deferUpdate();

  const userId = interaction.user.id;
  const app = customerManager.getApplication(userId, appId);

  if (!app || app.status !== 'active') {
    await interaction.followUp({ content: 'Aplicação não encontrada ou inativa.', ephemeral: true });
    return;
  }

  const token = configManager.getHostToken(app.hostName);
  if (!token) {
    await interaction.followUp({ content: 'Host não configurado.', ephemeral: true });
    return;
  }

  const provider = getProvider(app.hostName, token);
  if (!provider) {
    await interaction.followUp({ content: 'Provider não encontrado.', ephemeral: true });
    return;
  }

  try {
    await provider.start(app.appId);
    await interaction.followUp({ content: `✅ Aplicação \`${appId}\` iniciada com sucesso!`, ephemeral: true });
  } catch (error: any) {
    await interaction.followUp({ content: `❌ Erro ao iniciar aplicação: ${error.message}`, ephemeral: true });
  }
}

export async function handleAppStop(interaction: any, customerManager: CustomerManager, configManager: ConfigManager, appId: string) {
  await interaction.deferUpdate();

  const userId = interaction.user.id;
  const app = customerManager.getApplication(userId, appId);

  if (!app || app.status !== 'active') {
    await interaction.followUp({ content: 'Aplicação não encontrada ou inativa.', ephemeral: true });
    return;
  }

  const token = configManager.getHostToken(app.hostName);
  if (!token) {
    await interaction.followUp({ content: 'Host não configurado.', ephemeral: true });
    return;
  }

  const provider = getProvider(app.hostName, token);
  if (!provider) {
    await interaction.followUp({ content: 'Provider não encontrado.', ephemeral: true });
    return;
  }

  try {
    await provider.stop(app.appId);
    await interaction.followUp({ content: `✅ Aplicação \`${appId}\` parada com sucesso!`, ephemeral: true });
  } catch (error: any) {
    await interaction.followUp({ content: `❌ Erro ao parar aplicação: ${error.message}`, ephemeral: true });
  }
}

export async function handleAppRestart(interaction: any, customerManager: CustomerManager, configManager: ConfigManager, appId: string) {
  await interaction.deferUpdate();

  const userId = interaction.user.id;
  const app = customerManager.getApplication(userId, appId);

  if (!app || app.status !== 'active') {
    await interaction.followUp({ content: 'Aplicação não encontrada ou inativa.', ephemeral: true });
    return;
  }

  const token = configManager.getHostToken(app.hostName);
  if (!token) {
    await interaction.followUp({ content: 'Host não configurado.', ephemeral: true });
    return;
  }

  const provider = getProvider(app.hostName, token);
  if (!provider) {
    await interaction.followUp({ content: 'Provider não encontrado.', ephemeral: true });
    return;
  }

  try {
    await provider.restart(app.appId);
    await interaction.followUp({ content: `✅ Aplicação \`${appId}\` reiniciada com sucesso!`, ephemeral: true });
  } catch (error: any) {
    await interaction.followUp({ content: `❌ Erro ao reiniciar aplicação: ${error.message}`, ephemeral: true });
  }
}

export async function handleAppLogs(interaction: any, customerManager: CustomerManager, configManager: ConfigManager, appId: string) {
  await interaction.deferUpdate();

  const userId = interaction.user.id;
  const app = customerManager.getApplication(userId, appId);

  if (!app || app.status !== 'active') {
    await interaction.followUp({ content: 'Aplicação não encontrada ou inativa.', ephemeral: true });
    return;
  }

  const token = configManager.getHostToken(app.hostName);
  if (!token) {
    await interaction.followUp({ content: 'Host não configurado.', ephemeral: true });
    return;
  }

  const provider = getProvider(app.hostName, token);
  if (!provider) {
    await interaction.followUp({ content: 'Provider não encontrado.', ephemeral: true });
    return;
  }

  try {
    const logs = await provider.getLogs(app.appId);
    const truncatedLogs = logs.length > 1900 ? logs.substring(0, 1900) + '...' : logs;
    await interaction.followUp({ content: `\`\`\`\n${truncatedLogs}\n\`\`\``, ephemeral: true });
  } catch (error: any) {
    await interaction.followUp({ content: `❌ Erro ao buscar logs: ${error.message}`, ephemeral: true });
  }
}

export async function handleAppStatus(interaction: any, customerManager: CustomerManager, configManager: ConfigManager, appId: string) {
  await interaction.deferUpdate();

  const userId = interaction.user.id;
  const app = customerManager.getApplication(userId, appId);

  if (!app || app.status !== 'active') {
    await interaction.followUp({ content: 'Aplicação não encontrada ou inativa.', ephemeral: true });
    return;
  }

  const token = configManager.getHostToken(app.hostName);
  if (!token) {
    await interaction.followUp({ content: 'Host não configurado.', ephemeral: true });
    return;
  }

  const provider = getProvider(app.hostName, token);
  if (!provider) {
    await interaction.followUp({ content: 'Provider não encontrado.', ephemeral: true });
    return;
  }

  try {
    const status = await provider.getStatus(app.appId);
    const statusText = `**Status:** \`${status.status}\`\n**CPU:** \`${status.cpu || 'N/A'}\`\n**RAM:** \`${status.ram || 'N/A'}\`\n**Uptime:** \`${status.uptime || 'N/A'}\``;
    await interaction.followUp({ content: statusText, ephemeral: true });
  } catch (error: any) {
    await interaction.followUp({ content: `❌ Erro ao buscar status: ${error.message}`, ephemeral: true });
  }
}

export async function handleAppToggleAutoRenew(interaction: any, customerManager: CustomerManager, appId: string) {
  const userId = interaction.user.id;
  const newState = customerManager.toggleAutoRenew(userId, appId);

  await interaction.reply({
    content: `${newState ? '✅ Auto-renovação ativada' : '❌ Auto-renovação desativada'} para \`${appId}\``,
    ephemeral: true
  });
}

export function showTransferModal(interaction: any, appId: string) {
  const modal = new ModalBuilder()
    .setCustomId(`app_transfer_modal_${appId}`)
    .setTitle('Transferir Posse');

  const userInput = new TextInputBuilder()
    .setCustomId('new_owner_id')
    .setLabel('ID do novo proprietário')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Cole o ID do Discord do novo proprietário')
    .setRequired(true);

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(userInput);
  modal.addComponents(row);

  return interaction.showModal(modal);
}

export async function handleTransferModal(interaction: any, customerManager: CustomerManager, appId: string) {
  const newOwnerId = interaction.fields.getTextInputValue('new_owner_id');
  const currentUserId = interaction.user.id;

  const success = customerManager.transferOwnership(currentUserId, newOwnerId, appId);

  if (success) {
    await interaction.reply({
      content: `✅ Aplicação \`${appId}\` transferida para <@${newOwnerId}>`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: '❌ Erro ao transferir aplicação. Verifique se você é o proprietário.',
      ephemeral: true
    });
  }
}

export async function handlePlanPurchase(interaction: any, planManager: PlanManager, paymentManager: PaymentManager, planId: string) {
  const plan = planManager.getPlan(planId);
  if (!plan) {
    await interaction.reply({ content: 'Plano não encontrado.', ephemeral: true });
    return;
  }

  const paymentMethods = paymentManager.getEnabledPaymentMethods();
  if (paymentMethods.length === 0) {
    await interaction.reply({ content: 'Nenhum método de pagamento disponível.', ephemeral: true });
    return;
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# Comprar ${plan.name}`),
      new TextDisplayBuilder().setContent(`**Preço:** \`R$ ${plan.price.toFixed(2)}\``),
      new TextDisplayBuilder().setContent(`**Duração:** \`${plan.duration} dias\``)
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Escolha o método de pagamento:**')
    );

  paymentMethods.forEach(method => {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**${method.name}**`),
          new TextDisplayBuilder().setContent(`Tipo: \`${method.type}\``)
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(`payment_${planId}_${method.id}`)
            .setLabel('Pagar')
            .setStyle(ButtonStyle.Success)
        )
    );
  });

  await interaction.update({
    components: [container],
    flags: MessageFlags.IsComponentsV2
  });
}
