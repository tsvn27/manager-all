import fs from 'fs';
import path from 'path';
import { ConfigManager } from './ConfigManager.js';
import { EnvManager } from './EnvManager.js';

interface BackupData {
  id: string;
  timestamp: number;
  config: any;
  envVars: any;
  monitors: any;
  notifications: any;
  permissions: any;
}

export class BackupManager {
  private backupsDir = 'backups/config';

  constructor() {
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  private generateId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async createBackup(): Promise<{ success: boolean; backupId?: string; message: string }> {
    try {
      const backupId = this.generateId();
      const backupData: BackupData = {
        id: backupId,
        timestamp: Date.now(),
        config: this.readFileIfExists('config.json'),
        envVars: this.readFileIfExists('env-vars.json'),
        monitors: this.readFileIfExists('monitors.json'),
        notifications: this.readFileIfExists('notifications.json'),
        permissions: this.readFileIfExists('permissions.json')
      };

      const backupPath = path.join(this.backupsDir, `${backupId}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

      return {
        success: true,
        backupId,
        message: `Backup criado com sucesso: ${backupId}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao criar backup: ${error.message}`
      };
    }
  }

  async restoreBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    try {
      const backupPath = path.join(this.backupsDir, `${backupId}.json`);
      
      if (!fs.existsSync(backupPath)) {
        return {
          success: false,
          message: 'Backup não encontrado'
        };
      }

      const backupData: BackupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

      if (backupData.config) {
        fs.writeFileSync('config.json', JSON.stringify(backupData.config, null, 2));
      }
      if (backupData.envVars) {
        fs.writeFileSync('env-vars.json', JSON.stringify(backupData.envVars, null, 2));
      }
      if (backupData.monitors) {
        fs.writeFileSync('monitors.json', JSON.stringify(backupData.monitors, null, 2));
      }
      if (backupData.notifications) {
        fs.writeFileSync('notifications.json', JSON.stringify(backupData.notifications, null, 2));
      }
      if (backupData.permissions) {
        fs.writeFileSync('permissions.json', JSON.stringify(backupData.permissions, null, 2));
      }

      return {
        success: true,
        message: 'Backup restaurado com sucesso. Reinicie o bot para aplicar as mudanças.'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao restaurar backup: ${error.message}`
      };
    }
  }

  listBackups(): Array<{ id: string; timestamp: number; date: string }> {
    try {
      const files = fs.readdirSync(this.backupsDir);
      const backups = files
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const backupPath = path.join(this.backupsDir, f);
          const data: BackupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
          return {
            id: data.id,
            timestamp: data.timestamp,
            date: new Date(data.timestamp).toLocaleString('pt-BR')
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);

      return backups;
    } catch (error) {
      console.error('Erro ao listar backups:', error);
      return [];
    }
  }

  deleteBackup(backupId: string): boolean {
    try {
      const backupPath = path.join(this.backupsDir, `${backupId}.json`);
      
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao deletar backup:', error);
      return false;
    }
  }

  private readFileIfExists(filePath: string): any {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    } catch (error) {
      console.error(`Erro ao ler ${filePath}:`, error);
    }
    return null;
  }
}
