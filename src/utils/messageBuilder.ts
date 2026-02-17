import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';

export function createErrorMessage(message: string) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`❌ ${message}`)
    );

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2
  };
}

export function createSuccessMessage(message: string) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`✅ ${message}`)
    );

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2
  };
}

export function createInfoMessage(message: string) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`ℹ️ ${message}`)
    );

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2
  };
}

export function createWarningMessage(message: string) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`⚠️ ${message}`)
    );

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2
  };
}
