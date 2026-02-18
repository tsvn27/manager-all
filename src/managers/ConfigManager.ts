import fs from 'fs';
import path from 'path';

interface GlobalConfig {
  adminHosts: {
    [key: string]: {
      apiToken: string;
      enabled: boolean;
    };
  };
  availableHosts: {
    [key: string]: {
      displayName: string;
      documentation: string;
      providerClass: string;
    };
  };
  settings?: {
    autoBackupBeforeDeploy?: boolean;
    maxBackups?: number;
    backupRetentionDays?: number;
  };
}

export class ConfigManager {
  private configPath: string;
  private config: GlobalConfig;

  constructor() {
    this.configPath = path.join(process.cwd(), 'config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): GlobalConfig {
    if (fs.existsSync(this.configPath)) {
      const data = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(data);
    }
    return { 
      adminHosts: {},
      availableHosts: {
        discloud: {
          displayName: 'Discloud',
          documentation: 'https://docs.discloud.com',
          providerClass: 'DiscloudProvider'
        },
        squarecloud: {
          displayName: 'SquareCloud',
          documentation: 'https://docs.squarecloud.app',
          providerClass: 'SquareCloudProvider'
        },
        sparkedhost: {
          displayName: 'SparkedHost',
          documentation: 'https://sparkedhost.com/docs',
          providerClass: 'SparkedHostProvider'
        },
        railway: {
          displayName: 'Railway',
          documentation: 'https://docs.railway.app',
          providerClass: 'RailwayProvider'
        },
        replit: {
          displayName: 'Replit',
          documentation: 'https://docs.replit.com',
          providerClass: 'ReplitProvider'
        },
        shardcloud: {
          displayName: 'ShardCloud',
          documentation: 'https://docs.shardcloud.app',
          providerClass: 'ShardCloudProvider'
        }
      },
      settings: {
        autoBackupBeforeDeploy: false,
        maxBackups: 10,
        backupRetentionDays: 30
      }
    };
  }

  private saveConfig(): void {
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  setHostToken(hostName: string, apiToken: string): void {
    if (!this.config.adminHosts[hostName]) {
      this.config.adminHosts[hostName] = { apiToken: '', enabled: true };
    }
    this.config.adminHosts[hostName].apiToken = apiToken;
    this.saveConfig();
  }

  getHostToken(hostName: string): string | null {
    return this.config.adminHosts[hostName]?.apiToken || null;
  }

  toggleHost(hostName: string): boolean {
    if (!this.config.adminHosts[hostName]) return false;
    this.config.adminHosts[hostName].enabled = !this.config.adminHosts[hostName].enabled;
    this.saveConfig();
    return this.config.adminHosts[hostName].enabled;
  }

  enableHost(hostName: string): void {
    if (this.config.adminHosts[hostName]) {
      this.config.adminHosts[hostName].enabled = true;
      this.saveConfig();
    }
  }

  isHostEnabled(hostName: string): boolean {
    return this.config.adminHosts[hostName]?.enabled ?? false;
  }

  getAllHosts(): { name: string; enabled: boolean; configured: boolean; displayName: string; documentation: string }[] {
    return Object.entries(this.config.availableHosts).map(([key, hostInfo]) => ({
      name: key,
      enabled: this.config.adminHosts[key]?.enabled ?? false,
      configured: !!this.config.adminHosts[key]?.apiToken,
      displayName: hostInfo.displayName,
      documentation: hostInfo.documentation
    }));
  }

  addAvailableHost(name: string, displayName: string, documentation: string, providerClass: string): void {
    this.config.availableHosts[name] = {
      displayName,
      documentation,
      providerClass
    };
    this.saveConfig();
  }

  removeAvailableHost(name: string): void {
    delete this.config.availableHosts[name];
    delete this.config.adminHosts[name];
    this.saveConfig();
  }

  getHostInfo(name: string) {
    return this.config.availableHosts[name];
  }

  removeHost(hostName: string): void {
    delete this.config.adminHosts[hostName];
    this.saveConfig();
  }

  getSetting(key: 'autoBackupBeforeDeploy' | 'maxBackups' | 'backupRetentionDays'): any {
    if (!this.config.settings) {
      this.config.settings = {
        autoBackupBeforeDeploy: false,
        maxBackups: 10,
        backupRetentionDays: 30
      };
      this.saveConfig();
    }
    return this.config.settings[key];
  }

  setSetting(key: 'autoBackupBeforeDeploy' | 'maxBackups' | 'backupRetentionDays', value: any): void {
    if (!this.config.settings) {
      this.config.settings = {
        autoBackupBeforeDeploy: false,
        maxBackups: 10,
        backupRetentionDays: 30
      };
    }
    this.config.settings[key] = value;
    this.saveConfig();
  }

  toggleAutoBackup(): boolean {
    const current = this.getSetting('autoBackupBeforeDeploy');
    this.setSetting('autoBackupBeforeDeploy', !current);
    return !current;
  }

  getAllSettings() {
    if (!this.config.settings) {
      this.config.settings = {
        autoBackupBeforeDeploy: false,
        maxBackups: 10,
        backupRetentionDays: 30
      };
      this.saveConfig();
    }
    return this.config.settings;
  }

  addMonitor(hostName: string, appId: string, channelId: string): void {
    if (!this.config.settings) {
      this.config.settings = {
        autoBackupBeforeDeploy: false,
        maxBackups: 10,
        backupRetentionDays: 30
      };
    }
    if (!(this.config.settings as any).monitors) {
      (this.config.settings as any).monitors = [];
    }
    (this.config.settings as any).monitors.push({ hostName, appId, channelId });
    this.saveConfig();
  }

  removeMonitor(hostName: string, appId: string): void {
    if (!this.config.settings || !(this.config.settings as any).monitors) return;
    (this.config.settings as any).monitors = (this.config.settings as any).monitors.filter(
      (m: any) => !(m.hostName === hostName && m.appId === appId)
    );
    this.saveConfig();
  }

  getMonitors(): Array<{ hostName: string; appId: string; channelId: string }> {
    if (!this.config.settings || !(this.config.settings as any).monitors) return [];
    return (this.config.settings as any).monitors || [];
  }
}
