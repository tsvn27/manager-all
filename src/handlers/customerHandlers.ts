import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, type MessageActionRowComponentBuilder } from 'discord.js';
import { CustomerManager } from '../managers/CustomerManager.js';
import { PlanManager } from '../managers/PlanManager.js';

export async function handleCustomersPanel(interaction: any, customerManager: CustomerManager, planManager: PlanManager) {
  const customers = customerManager.getAllCustomers();

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Gerenciar Clientes')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  if (customers.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Nenhum cliente cadastrado ainda.')
    );
  } else {
    const stats = {
      totalCustomers: customers.length,
      totalApps: customers.reduce((sum, c) => sum + c.applications.length, 0),
      activeApps: customers.reduce((sum, c) => sum + c.applications.filter(a => a.status === 'active').length, 0)
    };

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**Total de Clientes:** \`${stats.totalCustomers}\``),
      new TextDisplayBuilder().setContent(`**Total de Aplicações:** \`${stats.totalApps}\``),
      new TextDisplayBuilder().setContent(`**Aplicações Ativas:** \`${stats.activeApps}\``)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    customers.slice(0, 10).forEach(customer => {
      const activeApps = customer.applications.filter(a => a.status === 'active').length;
      
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`<@${customer.userId}>`),
            new TextDisplayBuilder().setContent(`Aplicações: \`${customer.applications.length}\` | Ativas: \`${activeApps}\``)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`customer_view_${customer.userId}`)
              .setLabel('Ver Detalhes')
              .setStyle(ButtonStyle.Primary)
          )
      );
    });

    if (customers.length > 10) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`\n... e mais ${customers.length - 10} clientes`)
      );
    }
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

export async function handleViewCustomer(interaction: any, customerManager: CustomerManager, planManager: PlanManager, userId: string) {
  const applications = customerManager.getCustomerApplications(userId);
  const transactions = customerManager.getCustomerTransactions(userId);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# Cliente <@${userId}>`)
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**Total de Aplicações:** \`${applications.length}\``),
      new TextDisplayBuilder().setContent(`**Total de Transações:** \`${transactions.length}\``)
    )
    .addSeparatorComponents(new SeparatorBuilder());

  if (applications.length > 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Aplicações:**')
    );

    applications.forEach(app => {
      const plan = planManager.getPlan(app.planId);
      const statusEmoji = app.status === 'active' ? '🟢' : app.status === 'suspended' ? '🟡' : '🔴';
      const daysLeft = Math.ceil((app.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${statusEmoji} \`${app.appId}\` - ${plan?.name || 'Plano desconhecido'} - Expira em ${daysLeft} dias`)
      );
    });
  }

  const backBtn = new ButtonBuilder()
    .setCustomId('customers_panel')
    .setLabel('Voltar')
    .setStyle(ButtonStyle.Secondary);

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn);

  await interaction.update({
    components: [container, backRow],
    flags: MessageFlags.IsComponentsV2
  });
}
