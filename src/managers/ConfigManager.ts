import fs from 'fs';
import path from 'path';

interface Config {
  hosts: {
    [key: string]: {
      apiToken: string;
      enabled: boolean;
    };
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
    return { hosts: {} };
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

  getAllHosts(): { name: string; enabled: boolean; configured: boolean }[] {
    const availableHosts = ['discloud', 'squarecloud'];
    return availableHosts.map(host => ({
      name: host,
      enabled: this.config.hosts[host]?.enabled ?? false,
      configured: !!this.config.hosts[host]?.apiToken
    }));
  }

  removeHost(hostName: string): void {
    delete this.config.hosts[hostName];
    this.saveConfig();
  }
}
