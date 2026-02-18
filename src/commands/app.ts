import { SlashCommandBuilder, ChatInputCommandInteraction, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SectionBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, type MessageActionRowComponentBuilder } from 'discord.js';
import { CustomerManager } from '../managers/CustomerManager.js';
import { ConfigManager } from '../managers/ConfigManager.js';
import { DiscloudProvider } from '../providers/DiscloudProvider.js';
import { SquareCloudProvider } from '../providers/SquareCloudProvider.js';
import { ShardCloudProvider } from '../providers/ShardCloudProvider.js';
import { SparkedHostProvider } from '../providers/SparkedHostProvider.js';
import { RailwayProvider } from '../providers/RailwayProvider.js';
import { ReplitProvider } from '../providers/ReplitProvider.js';

export const data = new SlashCommandBuilder()
  .setName('app')
  .setDescription('Gerencie suas aplicações');

export async function execute(interaction: ChatInputCommandInteraction, customerManager: CustomerManager, configManager: ConfigManager) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const userId = interaction.user.id;
  const applications = customerManager.getCustomerApplications(userId);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Minhas Aplicações')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  if (applications.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Você não possui nenhuma aplicação.\n\nUse `/planos` para ver os planos disponíveis.')
    );

    await interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
    return;
  }

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

  await interaction.editReply({
    components: [container],
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
    .setCustomId('app_back')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

  await interaction.update({
    components: [container, backRow],
    flags: MessageFlags.IsComponentsV2
  });
}

export function getProvider(hostName: string, apiToken: string) {
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
