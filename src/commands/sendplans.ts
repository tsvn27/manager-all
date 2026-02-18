import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SectionBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { PlanManager } from '../managers/PlanManager.js';

export const data = new SlashCommandBuilder()
  .setName('sendplans')
  .setDescription('Envia a mensagem de planos em um canal')
  .addChannelOption(option =>
    option
      .setName('canal')
      .setDescription('Canal onde a mensagem será enviada')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction, planManager: PlanManager) {
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.options.getChannel('canal', true);
  const plans = planManager.getActivePlans();

  if (plans.length === 0) {
    await interaction.editReply('❌ Nenhum plano ativo disponível. Crie planos primeiro no `/panel`.');
    return;
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# 🚀 Planos de Hospedagem Disponíveis'),
      new TextDisplayBuilder().setContent('Escolha o plano ideal para sua aplicação e comece agora!')
    )
    .addSeparatorComponents(new SeparatorBuilder());

  plans.forEach(plan => {
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
    const textChannel = await interaction.client.channels.fetch(channel.id);
    if (!textChannel || !textChannel.isTextBased() || textChannel.isDMBased()) {
      await interaction.editReply('❌ Canal inválido.');
      return;
    }

    await (textChannel as any).send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    await interaction.editReply(`✅ Mensagem de planos enviada em <#${channel.id}>`);
  } catch (error: any) {
    await interaction.editReply(`❌ Erro ao enviar mensagem: ${error.message}`);
  }
}
