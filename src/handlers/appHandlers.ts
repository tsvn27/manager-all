import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, type MessageActionRowComponentBuilder } from 'discord.js';
import { CustomerManager } from '../managers/CustomerManager.js';
import { ConfigManager } from '../managers/ConfigManager.js';
import { PlanManager } from '../managers/PlanManager.js';
import { PaymentManager } from '../managers/PaymentManager.js';

export async function handleMyApps(interaction: any, customerManager: CustomerManager, configManager: ConfigManager) {
  const userId = interaction.user.id;
  const applications = customerManager.getCustomerApplications(userId);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Minhas Aplicações')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  if (applications.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Você não possui nenhuma aplicação.\n\nClique em **Ver Planos** para adquirir um plano.')
    );

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('view_plans')
        .setLabel('Ver Planos')
        .setStyle(ButtonStyle.Success)
    );

    container.addActionRowComponents(row);
  } else {
    applications.forEach(app => {
      const now = Date.now();
      const daysLeft = Math.ceil((app.expiryDate - now) / (1000 * 60 * 60 * 24));
      const statusEmoji = app.status === 'active' ? '🟢' : app.status === 'suspended' ? '🟡' : '🔴';
      
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${statusEmoji} **${app.appId}**`),
            new TextDisplayBuilder().setContent(`Host: \`${app.hostName}\``),
            new TextDisplayBuilder().setContent(`Expira em: \`${daysLeft} dias\``),
            new TextDisplayBuilder().setContent(`Auto-renovar: ${app.autoRenew ? '✅' : '❌'}`)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`app_manage_${app.appId}`)
              .setLabel('Gerenciar')
              .setStyle(ButtonStyle.Primary)
          )
      );
    });
  }

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

export async function handleViewPlans(interaction: any, planManager: PlanManager, paymentManager: PaymentManager) {
  const plans = planManager.getActivePlans();

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Planos Disponíveis'),
      new TextDisplayBuilder().setContent('Escolha o plano ideal para sua aplicação')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  if (plans.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Nenhum plano disponível no momento.')
    );
  } else {
    plans.forEach(plan => {
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**${plan.name}**`),
            new TextDisplayBuilder().setContent(`Host: \`${plan.hostName}\``),
            new TextDisplayBuilder().setContent(`Preço: \`R$ ${plan.price.toFixed(2)}\``),
            new TextDisplayBuilder().setContent(`Duração: \`${plan.duration} dias\``),
            new TextDisplayBuilder().setContent(`RAM: \`${plan.resources.ram}\` | CPU: \`${plan.resources.cpu}\` | Storage: \`${plan.resources.storage}\``)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`plan_buy_${plan.id}`)
              .setLabel('Comprar')
              .setStyle(ButtonStyle.Success)
          )
      );
    });
  }

  const backBtn = new ButtonBuilder()
    .setCustomId('my_apps')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

  await interaction.update({
    components: [container, backRow],
    flags: MessageFlags.IsComponentsV2
  });
}

export async function handleManageApp(interaction: any, customerManager: CustomerManager, configManager: ConfigManager, appId: string) {
  const userId = interaction.user.id;
  const app = customerManager.getApplication(userId, appId);

  if (!app) {
    await interaction.reply({ content: 'Aplicação não encontrada.', ephemeral: true });
    return;
  }

  const now = Date.now();
  const daysLeft = Math.ceil((app.expiryDate - now) / (1000 * 60 * 60 * 24));
  const statusEmoji = app.status === 'active' ? '🟢' : app.status === 'suspended' ? '🟡' : '🔴';

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# Gerenciar ${appId}`)
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${statusEmoji} **Status:** \`${app.status}\``),
      new TextDisplayBuilder().setContent(`**Host:** \`${app.hostName}\``),
      new TextDisplayBuilder().setContent(`**Expira em:** \`${daysLeft} dias\``),
      new TextDisplayBuilder().setContent(`**Auto-renovar:** ${app.autoRenew ? '✅ Ativado' : '❌ Desativado'}`)
    )
    .addSeparatorComponents(new SeparatorBuilder());

  const row1 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`app_start_${appId}`)
      .setLabel('Ligar')
      .setStyle(ButtonStyle.Success)
      .setDisabled(app.status !== 'active'),
    new ButtonBuilder()
      .setCustomId(`app_stop_${appId}`)
      .setLabel('Desligar')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(app.status !== 'active'),
    new ButtonBuilder()
      .setCustomId(`app_restart_${appId}`)
      .setLabel('Reiniciar')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(app.status !== 'active')
  );

  const row2 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`app_logs_${appId}`)
      .setLabel('Ver Logs')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(app.status !== 'active'),
    new ButtonBuilder()
      .setCustomId(`app_status_${appId}`)
      .setLabel('Status Detalhado')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(app.status !== 'active')
  );

  const row3 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`app_renew_${appId}`)
      .setLabel('Renovar Plano')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`app_toggle_autorenew_${appId}`)
      .setLabel(app.autoRenew ? 'Desativar Auto-renovar' : 'Ativar Auto-renovar')
      .setStyle(app.autoRenew ? ButtonStyle.Secondary : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`app_transfer_${appId}`)
      .setLabel('Transferir Posse')
      .setStyle(ButtonStyle.Secondary)
  );

  container.addActionRowComponents(row1, row2, row3);

  const backBtn = new ButtonBuilder()
    .setCustomId('my_apps')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

  await interaction.update({
    components: [container, backRow],
    flags: MessageFlags.IsComponentsV2
  });
}

export function getProvider(hostName: string, apiToken: string) {
  const { DiscloudProvider } = require('../providers/DiscloudProvider.js');
  const { SquareCloudProvider } = require('../providers/SquareCloudProvider.js');
  const { ShardCloudProvider } = require('../providers/ShardCloudProvider.js');
  const { SparkedHostProvider } = require('../providers/SparkedHostProvider.js');
  const { RailwayProvider } = require('../providers/RailwayProvider.js');
  const { ReplitProvider } = require('../providers/ReplitProvider.js');

  switch (hostName) {
    case 'discloud':
      return new DiscloudProvider(apiToken);
    case 'squarecloud':
      return new SquareCloudProvider(apiToken);
    case 'shardcloud':
      return new ShardCloudProvider(apiToken);
    case 'sparkedhost':
      return new SparkedHostProvider(apiToken);
    case 'railway':
      return new RailwayProvider(apiToken);
    case 'replit':
      return new ReplitProvider(apiToken);
    default:
      return null;
  }
}
