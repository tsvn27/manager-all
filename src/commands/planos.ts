import { SlashCommandBuilder, ChatInputCommandInteraction, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SectionBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { PlanManager } from '../managers/PlanManager.js';

export const data = new SlashCommandBuilder()
  .setName('planos')
  .setDescription('Veja os planos de hospedagem disponíveis');

export async function execute(interaction: ChatInputCommandInteraction, planManager: PlanManager) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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

  await interaction.editReply({
    components: [container],
    flags: MessageFlags.IsComponentsV2
  });
}
