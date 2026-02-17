import fs from 'fs';
import path from 'path';

interface Config {
  hosts: {
    [key: string]: {
      apiToken: string;
      enabled: boolean;
      displayName?: string;
      documentation?: string;
    };
  };
  availableHosts: {
    [key: string]: {
      displayName: string;
      documentation: string;
      providerClass: string;
    };
  };
  monitors?: Array<{
    hostName: string;
    appId: string;
    channelId: string;
  }>;
  settings?: {
    autoBackupBeforeDeploy?: boolean;
    maxBackups?: number;
    backupRetentionDays?: number;
  };
}

export class ConfigManager {
  private configPath: string;
  private config: Config;

  constructor() {
    this.configPath = path.join(process.cwd(), 'config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    if (fs.existsSync(this.configPath)) {
      const data = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(data);
    }
    return { 
      hosts: {},
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
      }
    };
  }

  private saveConfig(): void {
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  setHostToken(hostName: string, apiToken: string): void {
    if (!this.config.hosts[hostName]) {
      this.config.hosts[hostName] = { apiToken: '', enabled: true };
    }
    this.config.hosts[hostName].apiToken = apiToken;
    this.saveConfig();
  }

  getHostToken(hostName: string): string | null {
    return this.config.hosts[hostName]?.apiToken || null;
  }

  toggleHost(hostName: string): boolean {
    if (!this.config.hosts[hostName]) return false;
    this.config.hosts[hostName].enabled = !this.config.hosts[hostName].enabled;
    this.saveConfig();
    return this.config.hosts[hostName].enabled;
  }

  isHostEnabled(hostName: string): boolean {
    return this.config.hosts[hostName]?.enabled ?? false;
  }

  getAllHosts(): { name: string; enabled: boolean; configured: boolean; displayName: string; documentation: string }[] {
    return Object.entries(this.config.availableHosts).map(([key, hostInfo]) => ({
      name: key,
      enabled: this.config.hosts[key]?.enabled ?? false,
      configured: !!this.config.hosts[key]?.apiToken,
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
    delete this.config.hosts[name];
    this.saveConfig();
  }

  getHostInfo(name: string) {
    return this.config.availableHosts[name];
  }

  removeHost(hostName: string): void {
    delete this.config.hosts[hostName];
    this.saveConfig();
  }

  addMonitor(hostName: string, appId: string, channelId: string): void {
    if (!this.config.monitors) {
      this.config.monitors = [];
    }
    this.config.monitors.push({ hostName, appId, channelId });
    this.saveConfig();
  }

  removeMonitor(hostName: string, appId: string): void {
    if (!this.config.monitors) return;
    this.config.monitors = this.config.monitors.filter(
      m => !(m.hostName === hostName && m.appId === appId)
    );
    this.saveConfig();
  }

  getMonitors(): Array<{ hostName: string; appId: string; channelId: string }> {
    return this.config.monitors || [];
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
}
