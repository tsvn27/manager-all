import { HostManager } from './HostManager.js';
import { ConfigManager } from './ConfigManager.js';
import { Client, TextChannel, EmbedBuilder } from 'discord.js';

interface MonitoredApp {
  hostName: string;
  appId: string;
  lastStatus: string;
  channelId: string;
}

export class MonitorManager {
  private monitors: Map<string, MonitoredApp> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private client: Client;
  private hostManager: HostManager;
  private configManager: ConfigManager;

  constructor(client: Client, hostManager: HostManager, configManager: ConfigManager) {
    this.client = client;
    this.hostManager = hostManager;
    this.configManager = configManager;
    this.loadMonitors();
  }

  private loadMonitors() {
    const monitors = this.configManager.getMonitors();
    monitors.forEach(monitor => {
      this.startMonitoring(monitor.hostName, monitor.appId, monitor.channelId);
    });
  }

  startMonitoring(hostName: string, appId: string, channelId: string) {
    const key = `${hostName}_${appId}`;
    
    if (this.intervals.has(key)) {
      return;
    }

    this.monitors.set(key, {
      hostName,
      appId,
      lastStatus: 'unknown',
      channelId
    });

    const interval = setInterval(async () => {
      await this.checkStatus(hostName, appId, channelId);
    }, 60000);

    this.intervals.set(key, interval);
    this.configManager.addMonitor(hostName, appId, channelId);
  }

  stopMonitoring(hostName: string, appId: string) {
    const key = `${hostName}_${appId}`;
    
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }

    this.monitors.delete(key);
    this.configManager.removeMonitor(hostName, appId);
  }

  private async checkStatus(hostName: string, appId: string, channelId: string) {
    const key = `${hostName}_${appId}`;
    const monitor = this.monitors.get(key);
    if (!monitor) return;

    const provider = this.hostManager.getProvider(hostName);
    if (!provider) return;

    try {
      const status = await provider.getStatus(appId);
      const currentStatus = status.status;

      if (monitor.lastStatus !== 'unknown' && monitor.lastStatus !== currentStatus) {
        await this.sendNotification(channelId, {
          appName: status.name,
          hostName: provider.name,
          oldStatus: monitor.lastStatus,
          newStatus: currentStatus,
          cpu: status.cpu,
          ram: status.ram
        });
      }

      monitor.lastStatus = currentStatus;
    } catch (error) {
      console.error(`Erro ao monitorar ${hostName}/${appId}:`, error);
    }
  }

  private async sendNotification(channelId: string, data: any) {
    try {
      const channel = await this.client.channels.fetch(channelId) as TextChannel;
      if (!channel) return;

      const statusEmoji = data.newStatus === 'online' ? '🟢' : '🔴';
      const color = data.newStatus === 'online' ? 0x00ff00 : 0xff0000;

      const message = `${statusEmoji} **${data.appName}** mudou de status\n` +
                     `Host: ${data.hostName}\n` +
                     `${data.oldStatus.toUpperCase()} → ${data.newStatus.toUpperCase()}`;

      await channel.send({ content: message });
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }

  getMonitoredApps(): MonitoredApp[] {
    return Array.from(this.monitors.values());
  }

  isMonitoring(hostName: string, appId: string): boolean {
    return this.monitors.has(`${hostName}_${appId}`);
  }
}
