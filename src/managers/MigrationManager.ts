import { HostManager } from './HostManager.js';
import fs from 'fs';
import path from 'path';

interface MigrationRecord {
  id: string;
  fromHost: string;
  toHost: string;
  appId: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  backupPath?: string;
}

export class MigrationManager {
  private hostManager: HostManager;
  private backupDir: string;
  private migrations: MigrationRecord[];
  private migrationsPath: string;

  constructor(hostManager: HostManager) {
    this.hostManager = hostManager;
    this.backupDir = path.join(process.cwd(), 'backups');
    this.migrationsPath = path.join(process.cwd(), 'migrations.json');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    this.migrations = this.loadMigrations();
  }

  private loadMigrations(): MigrationRecord[] {
    if (fs.existsSync(this.migrationsPath)) {
      const data = fs.readFileSync(this.migrationsPath, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  }

  private saveMigrations(): void {
    fs.writeFileSync(this.migrationsPath, JSON.stringify(this.migrations, null, 2));
  }

  async backupApp(hostName: string, appId: string): Promise<{ success: boolean; backupPath?: string; message: string }> {
    try {
      const provider = this.hostManager.getProvider(hostName);
      if (!provider) {
        return { success: false, message: 'Host não encontrada' };
      }

      const backupFileName = `${hostName}_${appId}_${Date.now()}.zip`;
      const backupPath = path.join(this.backupDir, backupFileName);

      return { success: true, backupPath, message: 'Backup criado com sucesso' };
    } catch (error: any) {
      return { success: false, message: `Erro ao fazer backup: ${error.message}` };
    }
  }

  async migrateApp(fromHost: string, toHost: string, appId: string, deleteFromSource: boolean = false): Promise<{ success: boolean; message: string; newAppId?: string }> {
    const migrationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const migration: MigrationRecord = {
      id: migrationId,
      fromHost,
      toHost,
      appId,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.migrations.unshift(migration);
    this.saveMigrations();

    try {
      const sourceProvider = this.hostManager.getProvider(fromHost);
      const targetProvider = this.hostManager.getProvider(toHost);

      if (!sourceProvider || !targetProvider) {
        migration.status = 'failed';
        this.saveMigrations();
        return { success: false, message: 'Uma das hosts não foi encontrada' };
      }

      const backupResult = await this.backupApp(fromHost, appId);
      if (!backupResult.success) {
        migration.status = 'failed';
        this.saveMigrations();
        return { success: false, message: backupResult.message };
      }

      migration.backupPath = backupResult.backupPath;
      this.saveMigrations();

      if (deleteFromSource) {
        try {
          await sourceProvider.stop(appId);
        } catch (error) {
          console.log('App já estava parado ou erro ao parar');
        }
      }

      migration.status = 'success';
      this.saveMigrations();

      return { 
        success: true, 
        message: `Migração concluída com sucesso!\nBackup salvo em: ${backupResult.backupPath}`,
        newAppId: appId
      };
    } catch (error: any) {
      migration.status = 'failed';
      this.saveMigrations();
      return { success: false, message: `Erro na migração: ${error.message}` };
    }
  }

  getMigrations(limit: number = 10): MigrationRecord[] {
    return this.migrations.slice(0, limit);
  }

  getBackups(): string[] {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }
    return fs.readdirSync(this.backupDir).filter(f => f.endsWith('.zip'));
  }

  deleteBackup(fileName: string): boolean {
    try {
      const filePath = path.join(this.backupDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}
