import { HostManager } from './HostManager.js';
import { ConfigManager } from './ConfigManager.js';
import { Client, TextChannel, EmbedBuilder } from 'discord.js';

interface MonitoredApp {
  hostName: string;
  appId: string;
  lastStatus: string;
  channelId: string;
  autoRestart: boolean;
  restartCount: number;
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

  startMonitoring(hostName: string, appId: string, channelId: string, autoRestart: boolean = false) {
    const key = `${hostName}_${appId}`;
    
    if (this.intervals.has(key)) {
      return;
    }

    this.monitors.set(key, {
      hostName,
      appId,
      lastStatus: 'unknown',
      channelId,
      autoRestart,
      restartCount: 0
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

      if (monitor.autoRestart && monitor.lastStatus === 'online' && currentStatus === 'offline') {
        try {
          await provider.start(appId);
          monitor.restartCount++;
          
          await this.sendNotification(channelId, {
            appName: status.name,
            hostName: provider.name,
            oldStatus: monitor.lastStatus,
            newStatus: 'restarting',
            cpu: status.cpu,
            ram: status.ram,
            autoRestart: true,
            restartCount: monitor.restartCount
          });
        } catch (error) {
          console.error(`Erro ao reiniciar ${hostName}/${appId}:`, error);
        }
      } else if (monitor.lastStatus !== 'unknown' && monitor.lastStatus !== currentStatus) {
        await this.sendNotification(channelId, {
          appName: status.name,
          hostName: provider.name,
          oldStatus: monitor.lastStatus,
          newStatus: currentStatus,
          cpu: status.cpu,
          ram: status.ram,
          autoRestart: false
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

      let statusEmoji = data.newStatus === 'online' ? '🟢' : '🔴';
      let message = '';

      if (data.autoRestart) {
        statusEmoji = '🔄';
        message = `${statusEmoji} **${data.appName}** caiu e foi reiniciado automaticamente\n` +
                 `Host: ${data.hostName}\n` +
                 `Reinicializações: ${data.restartCount}`;
      } else {
        message = `${statusEmoji} **${data.appName}** mudou de status\n` +
                 `Host: ${data.hostName}\n` +
                 `${data.oldStatus.toUpperCase()} → ${data.newStatus.toUpperCase()}`;
      }

      await channel.send({ content: message });
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }

  toggleAutoRestart(hostName: string, appId: string): boolean {
    const key = `${hostName}_${appId}`;
    const monitor = this.monitors.get(key);
    if (!monitor) return false;

    monitor.autoRestart = !monitor.autoRestart;
    monitor.restartCount = 0;
    return monitor.autoRestart;
  }

  getAutoRestartStatus(hostName: string, appId: string): boolean {
    const key = `${hostName}_${appId}`;
    const monitor = this.monitors.get(key);
    return monitor?.autoRestart || false;
  }

  getMonitoredApps(): MonitoredApp[] {
    return Array.from(this.monitors.values());
  }

  isMonitoring(hostName: string, appId: string): boolean {
    return this.monitors.has(`${hostName}_${appId}`);
  }
}
