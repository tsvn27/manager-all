import fs from 'fs';
import axios from 'axios';

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  userId: string;
}

export class WebhookManager {
  private webhooksFile = 'webhooks.json';
  private webhooks: WebhookConfig[] = [];

  constructor() {
    this.loadWebhooks();
  }

  private loadWebhooks() {
    try {
      if (fs.existsSync(this.webhooksFile)) {
        const data = fs.readFileSync(this.webhooksFile, 'utf-8');
        this.webhooks = JSON.parse(data);
      }
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error);
      this.webhooks = [];
    }
  }

  private saveWebhooks() {
    try {
      fs.writeFileSync(this.webhooksFile, JSON.stringify(this.webhooks, null, 2));
    } catch (error) {
      console.error('Erro ao salvar webhooks:', error);
    }
  }

  private generateId(): string {
    return `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addWebhook(url: string, events: string[], userId: string): string {
    const webhook: WebhookConfig = {
      id: this.generateId(),
      url,
      events,
      enabled: true,
      userId
    };

    this.webhooks.push(webhook);
    this.saveWebhooks();
    
    return webhook.id;
  }

  removeWebhook(webhookId: string): boolean {
    const index = this.webhooks.findIndex(w => w.id === webhookId);
    
    if (index !== -1) {
      this.webhooks.splice(index, 1);
      this.saveWebhooks();
      return true;
    }
    
    return false;
  }

  toggleWebhook(webhookId: string): boolean {
    const webhook = this.webhooks.find(w => w.id === webhookId);
    
    if (webhook) {
      webhook.enabled = !webhook.enabled;
      this.saveWebhooks();
      return webhook.enabled;
    }
    
    return false;
  }

  async sendWebhook(event: string, data: any) {
    const webhooksToSend = this.webhooks.filter(w => w.enabled && w.events.includes(event));

    for (const webhook of webhooksToSend) {
      try {
        await axios.post(webhook.url, {
          event,
          data,
          timestamp: Date.now()
        }, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Discord-Host-Manager/1.0'
          },
          timeout: 5000
        });
      } catch (error: any) {
        console.error(`Erro ao enviar webhook ${webhook.id}:`, error.message);
      }
    }
  }

  getWebhooks(userId?: string): WebhookConfig[] {
    if (userId) {
      return this.webhooks.filter(w => w.userId === userId);
    }
    return this.webhooks;
  }

  getWebhookById(webhookId: string): WebhookConfig | undefined {
    return this.webhooks.find(w => w.id === webhookId);
  }
}
