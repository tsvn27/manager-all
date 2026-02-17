import { Client, User } from 'discord.js';
import fs from 'fs';
import path from 'path';

interface NotificationSettings {
  userId: string;
  events: {
    deploy: boolean;
    statusChange: boolean;
    crash: boolean;
    restart: boolean;
  };
  method: 'dm' | 'channel';
  channelId?: string;
}

export class NotificationManager {
  private settingsPath: string;
  private settings: Map<string, NotificationSettings>;
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.settingsPath = path.join(process.cwd(), 'notifications.json');
    this.settings = new Map();
    this.loadSettings();
  }

  private loadSettings(): void {
    if (fs.existsSync(this.settingsPath)) {
      const data = fs.readFileSync(this.settingsPath, 'utf-8');
      const parsed = JSON.parse(data);
      Object.entries(parsed).forEach(([userId, settings]) => {
        this.settings.set(userId, settings as NotificationSettings);
      });
    }
  }

  private saveSettings(): void {
    const obj: any = {};
    this.settings.forEach((value, key) => {
      obj[key] = value;
    });
    fs.writeFileSync(this.settingsPath, JSON.stringify(obj, null, 2));
  }

  setUserSettings(userId: string, settings: Partial<NotificationSettings>): void {
    const current = this.settings.get(userId) || {
      userId,
      events: { deploy: true, statusChange: true, crash: true, restart: true },
      method: 'dm'
    };
    this.settings.set(userId, { ...current, ...settings });
    this.saveSettings();
  }

  getUserSettings(userId: string): NotificationSettings {
    return this.settings.get(userId) || {
      userId,
      events: { deploy: true, statusChange: true, crash: true, restart: true },
      method: 'dm'
    };
  }

  async notify(userId: string, eventType: keyof NotificationSettings['events'], message: string): Promise<void> {
    const settings = this.getUserSettings(userId);
    
    if (!settings.events[eventType]) {
      return;
    }

    try {
      if (settings.method === 'dm') {
        const user = await this.client.users.fetch(userId);
        await user.send(message);
      } else if (settings.method === 'channel' && settings.channelId) {
        const channel = await this.client.channels.fetch(settings.channelId);
        if (channel?.isTextBased() && 'send' in channel) {
          await (channel as any).send(message);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }

  toggleEvent(userId: string, eventType: keyof NotificationSettings['events']): boolean {
    const settings = this.getUserSettings(userId);
    settings.events[eventType] = !settings.events[eventType];
    this.setUserSettings(userId, settings);
    return settings.events[eventType];
  }
}
