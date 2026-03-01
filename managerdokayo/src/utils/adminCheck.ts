import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';
import { PermissionManager } from '../managers/PermissionManager.js';

export async function requireAdmin(interaction: any, permissionManager: PermissionManager): Promise<boolean> {
  const guildOwnerId = interaction.guild?.ownerId;
  const isAdmin = permissionManager.isAdmin(interaction.user.id, guildOwnerId);
  
  if (!isAdmin) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('🚫 Apenas administradores podem acessar esta funcionalidade.')
      );
    
    await interaction.update({ 
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
    
    return false;
  }
  
  return true;
}
