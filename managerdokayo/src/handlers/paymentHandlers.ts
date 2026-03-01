import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, type MessageActionRowComponentBuilder } from 'discord.js';
import { PaymentManager } from '../managers/PaymentManager.js';

export async function handlePaymentsPanel(interaction: any, paymentManager: PaymentManager) {
  const methods = paymentManager.getAllPaymentMethods();

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Métodos de Pagamento')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  if (methods.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Nenhum método de pagamento configurado.\n\nClique em **Adicionar Método** para configurar.')
    );
  } else {
    methods.forEach(method => {
      const statusEmoji = method.enabled ? '🟢' : '🔴';
      
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${statusEmoji} **${method.name}**`),
            new TextDisplayBuilder().setContent(`Tipo: \`${method.type}\``)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`payment_manage_${method.id}`)
              .setLabel('Gerenciar')
              .setStyle(ButtonStyle.Primary)
          )
      );
    });
  }

  container.addSeparatorComponents(new SeparatorBuilder());

  const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('payment_add')
      .setLabel('Adicionar Método')
      .setStyle(ButtonStyle.Success)
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

export async function handleManagePayment(interaction: any, paymentManager: PaymentManager, methodId: string) {
  const method = paymentManager.getPaymentMethod(methodId);
  if (!method) {
    await interaction.reply({ content: 'Método não encontrado.', ephemeral: true });
    return;
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${method.name}`)
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**Tipo:** \`${method.type}\``),
      new TextDisplayBuilder().setContent(`**Status:** ${method.enabled ? '🟢 Ativo' : '🔴 Inativo'}`)
    )
    .addSeparatorComponents(new SeparatorBuilder());

  const row1 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`payment_edit_${methodId}`)
      .setLabel('Editar')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`payment_toggle_${methodId}`)
      .setLabel(method.enabled ? 'Desativar' : 'Ativar')
      .setStyle(method.enabled ? ButtonStyle.Secondary : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`payment_delete_${methodId}`)
      .setLabel('Deletar')
      .setStyle(ButtonStyle.Danger)
  );

  container.addActionRowComponents(row1);

  const backBtn = new ButtonBuilder()
    .setCustomId('payments_panel')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

  await interaction.update({
    components: [container, backRow],
    flags: MessageFlags.IsComponentsV2
  });
}

export function showPaymentModal(interaction: any, isEdit: boolean, methodId?: string) {
  const modal = new ModalBuilder()
    .setCustomId(isEdit ? `payment_edit_modal_${methodId}` : 'payment_add_modal')
    .setTitle(isEdit ? 'Editar Método' : 'Adicionar Método');

  const nameInput = new TextInputBuilder()
    .setCustomId('payment_name')
    .setLabel('Nome')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: PIX, MercadoPago')
    .setRequired(true);

  const typeInput = new TextInputBuilder()
    .setCustomId('payment_type')
    .setLabel('Tipo')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('pix, mercadopago, stripe, paypal')
    .setRequired(true);

  const apiKeyInput = new TextInputBuilder()
    .setCustomId('payment_apikey')
    .setLabel('API Key (opcional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Cole a API key aqui')
    .setRequired(false);

  const pixKeyInput = new TextInputBuilder()
    .setCustomId('payment_pixkey')
    .setLabel('Chave PIX (opcional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Cole a chave PIX aqui')
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(typeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(apiKeyInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(pixKeyInput)
  );

  return interaction.showModal(modal);
}

export async function handlePaymentModal(interaction: any, paymentManager: PaymentManager, isEdit: boolean, methodId?: string) {
  const name = interaction.fields.getTextInputValue('payment_name');
  const type = interaction.fields.getTextInputValue('payment_type') as 'pix' | 'mercadopago' | 'stripe' | 'paypal';
  const apiKey = interaction.fields.getTextInputValue('payment_apikey') || undefined;
  const pixKey = interaction.fields.getTextInputValue('payment_pixkey') || undefined;

  if (isEdit && methodId) {
    paymentManager.updatePaymentMethod(methodId, {
      name,
      type,
      config: { apiKey, pixKey }
    });
  } else {
    paymentManager.addPaymentMethod({
      name,
      type,
      enabled: true,
      config: { apiKey, pixKey }
    });
  }

  await interaction.deferUpdate();
  await handlePaymentsPanel(interaction, paymentManager);
}

export async function handleTogglePayment(interaction: any, paymentManager: PaymentManager, methodId: string) {
  paymentManager.togglePaymentMethod(methodId);
  await handleManagePayment(interaction, paymentManager, methodId);
}

export async function handleDeletePayment(interaction: any, paymentManager: PaymentManager, methodId: string) {
  paymentManager.deletePaymentMethod(methodId);
  await handlePaymentsPanel(interaction, paymentManager);
}
