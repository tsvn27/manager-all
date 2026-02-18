import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, type MessageActionRowComponentBuilder } from 'discord.js';
import { PlanManager } from '../managers/PlanManager.js';

export async function handlePlansPanel(interaction: any, planManager: PlanManager) {
  const plans = planManager.getAllPlans();

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Gerenciar Planos')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  if (plans.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Nenhum plano cadastrado.\n\nClique em **Adicionar Plano** para criar um novo.')
    );
  } else {
    plans.forEach(plan => {
      const statusEmoji = plan.active ? '🟢' : '🔴';
      
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${statusEmoji} **${plan.name}**`),
            new TextDisplayBuilder().setContent(`Host: \`${plan.hostName}\` | Preço: \`R$ ${plan.price.toFixed(2)}\``),
            new TextDisplayBuilder().setContent(`Duração: \`${plan.duration} dias\``)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`plan_manage_${plan.id}`)
              .setLabel('Gerenciar')
              .setStyle(ButtonStyle.Primary)
          )
      );
    });
  }

  container.addSeparatorComponents(new SeparatorBuilder());

  const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('plan_add')
      .setLabel('Adicionar Plano')
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

export async function handleManagePlan(interaction: any, planManager: PlanManager, planId: string) {
  const plan = planManager.getPlan(planId);
  if (!plan) {
    await interaction.reply({ content: 'Plano não encontrado.', ephemeral: true });
    return;
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${plan.name}`)
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**Host:** \`${plan.hostName}\``),
      new TextDisplayBuilder().setContent(`**Preço:** \`R$ ${plan.price.toFixed(2)}\``),
      new TextDisplayBuilder().setContent(`**Duração:** \`${plan.duration} dias\``),
      new TextDisplayBuilder().setContent(`**Status:** ${plan.active ? '🟢 Ativo' : '🔴 Inativo'}`),
      new TextDisplayBuilder().setContent(`**Recursos:**`),
      new TextDisplayBuilder().setContent(`RAM: \`${plan.resources.ram}\``),
      new TextDisplayBuilder().setContent(`CPU: \`${plan.resources.cpu}\``),
      new TextDisplayBuilder().setContent(`Storage: \`${plan.resources.storage}\``)
    )
    .addSeparatorComponents(new SeparatorBuilder());

  const row1 = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`plan_edit_${planId}`)
      .setLabel('Editar')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`plan_toggle_${planId}`)
      .setLabel(plan.active ? 'Desativar' : 'Ativar')
      .setStyle(plan.active ? ButtonStyle.Secondary : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`plan_delete_${planId}`)
      .setLabel('Deletar')
      .setStyle(ButtonStyle.Danger)
  );

  container.addActionRowComponents(row1);

  const backBtn = new ButtonBuilder()
    .setCustomId('plans_panel')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

  await interaction.update({
    components: [container, backRow],
    flags: MessageFlags.IsComponentsV2
  });
}

export function showPlanModal(interaction: any, isEdit: boolean, planId?: string) {
  const modal = new ModalBuilder()
    .setCustomId(isEdit ? `plan_edit_modal_${planId}` : 'plan_add_modal')
    .setTitle(isEdit ? 'Editar Plano' : 'Adicionar Plano');

  const nameInput = new TextInputBuilder()
    .setCustomId('plan_name')
    .setLabel('Nome do Plano')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: Básico, Premium, Enterprise')
    .setRequired(true);

  const hostInput = new TextInputBuilder()
    .setCustomId('plan_host')
    .setLabel('Host')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: discloud, squarecloud')
    .setRequired(true);

  const priceInput = new TextInputBuilder()
    .setCustomId('plan_price')
    .setLabel('Preço (R$)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: 15.00')
    .setRequired(true);

  const durationInput = new TextInputBuilder()
    .setCustomId('plan_duration')
    .setLabel('Duração (dias)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: 30')
    .setRequired(true);

  const resourcesInput = new TextInputBuilder()
    .setCustomId('plan_resources')
    .setLabel('Recursos (RAM,CPU,Storage)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: 512MB,1 Core,1GB')
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(hostInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(priceInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(durationInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(resourcesInput)
  );

  return interaction.showModal(modal);
}

export async function handlePlanModal(interaction: any, planManager: PlanManager, isEdit: boolean, planId?: string) {
  const name = interaction.fields.getTextInputValue('plan_name');
  const hostName = interaction.fields.getTextInputValue('plan_host');
  const price = parseFloat(interaction.fields.getTextInputValue('plan_price'));
  const duration = parseInt(interaction.fields.getTextInputValue('plan_duration'));
  const resourcesStr = interaction.fields.getTextInputValue('plan_resources');
  
  const [ram, cpu, storage] = resourcesStr.split(',').map((s: string) => s.trim());

  if (isEdit && planId) {
    planManager.updatePlan(planId, {
      name,
      hostName,
      price,
      duration,
      resources: { ram, cpu, storage }
    });
  } else {
    planManager.addPlan({
      name,
      hostName,
      price,
      duration,
      resources: { ram, cpu, storage },
      features: [],
      active: true
    });
  }

  await interaction.deferUpdate();
  await handlePlansPanel(interaction, planManager);
}

export async function handleTogglePlan(interaction: any, planManager: PlanManager, planId: string) {
  planManager.togglePlan(planId);
  await handleManagePlan(interaction, planManager, planId);
}

export async function handleDeletePlan(interaction: any, planManager: PlanManager, planId: string) {
  planManager.deletePlan(planId);
  await handlePlansPanel(interaction, planManager);
}
