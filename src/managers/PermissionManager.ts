import fs from 'fs';
import path from 'path';

export class PermissionManager {
  private permissionsFile = 'permissions.json';
  private permissions: PermissionsData;
  private rateLimits: Map<string, RateLimitData> = new Map();

  constructor() {
    this.permissions = this.loadPermissions();
  }

  private loadPermissions(): PermissionsData {
    try {
      if (fs.existsSync(this.permissionsFile)) {
        const data = fs.readFileSync(this.permissionsFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    }

    return {
      admins: [],
      allowedUsers: [],
      allowedRoles: [],
      publicCommands: ['panel'], 
      rateLimits: {
        commandsPerMinute: 10,
        deploysPerHour: 5
      }
    };
  }

  private savePermissions(): void {
    try {
      fs.writeFileSync(this.permissionsFile, JSON.stringify(this.permissions, null, 2));
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
    }
  }

  isAdmin(userId: string, guildOwnerId?: string): boolean {
    if (guildOwnerId && userId === guildOwnerId) {
      if (!this.permissions.admins.includes(userId)) {
        this.permissions.admins.push(userId);
        this.savePermissions();
      }
      return true;
    }
    return this.permissions.admins.includes(userId);
  }

  hasPermission(userId: string, userRoles: string[], action: string, guildOwnerId?: string): boolean {
    if (this.isAdmin(userId, guildOwnerId)) {
      return true;
    }

    if (this.permissions.publicCommands.includes(action)) {
      return true;
    }

    if (this.permissions.allowedUsers.includes(userId)) {
      return true;
    }

    if (userRoles.some(role => this.permissions.allowedRoles.includes(role))) {
      return true;
    }

    return false;
  }

  checkRateLimit(userId: string, action: 'command' | 'deploy'): boolean {
    const now = Date.now();
    const key = `${userId}_${action}`;
    
    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, { count: 1, resetAt: now + (action === 'deploy' ? 3600000 : 60000) });
      return true;
    }

    const limit = this.rateLimits.get(key)!;
    
    if (now > limit.resetAt) {
      this.rateLimits.set(key, { count: 1, resetAt: now + (action === 'deploy' ? 3600000 : 60000) });
      return true;
    }

    const maxLimit = action === 'deploy' 
      ? this.permissions.rateLimits.deploysPerHour 
      : this.permissions.rateLimits.commandsPerMinute;

    if (limit.count >= maxLimit) {
      return false;
    }

    limit.count++;
    return true;
  }

  getRateLimitResetTime(userId: string, action: 'command' | 'deploy'): number {
    const key = `${userId}_${action}`;
    const limit = this.rateLimits.get(key);
    
    if (!limit) return 0;
    
    const remaining = limit.resetAt - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  addAdmin(userId: string): void {
    if (!this.permissions.admins.includes(userId)) {
      this.permissions.admins.push(userId);
      this.savePermissions();
    }
  }

  removeAdmin(userId: string): void {
    this.permissions.admins = this.permissions.admins.filter(id => id !== userId);
    this.savePermissions();
  }

  addAllowedUser(userId: string): void {
    if (!this.permissions.allowedUsers.includes(userId)) {
      this.permissions.allowedUsers.push(userId);
      this.savePermissions();
    }
  }

  removeAllowedUser(userId: string): void {
    this.permissions.allowedUsers = this.permissions.allowedUsers.filter(id => id !== userId);
    this.savePermissions();
  }

  addAllowedRole(roleId: string): void {
    if (!this.permissions.allowedRoles.includes(roleId)) {
      this.permissions.allowedRoles.push(roleId);
      this.savePermissions();
    }
  }

  removeAllowedRole(roleId: string): void {
    this.permissions.allowedRoles = this.permissions.allowedRoles.filter(id => id !== roleId);
    this.savePermissions();
  }

  getAllPermissions(): PermissionsData {
    return { ...this.permissions };
  }

  updateRateLimits(commandsPerMinute: number, deploysPerHour: number): void {
    this.permissions.rateLimits = { commandsPerMinute, deploysPerHour };
    this.savePermissions();
  }
}

interface PermissionsData {
  admins: string[];
  allowedUsers: string[];
  allowedRoles: string[];
  publicCommands: string[];
  rateLimits: {
    commandsPerMinute: number;
    deploysPerHour: number;
  };
}

interface RateLimitData {
  count: number;
  resetAt: number;
}
