import fs from 'fs';
import path from 'path';

interface DeployRecord {
  id: string;
  hostName: string;
  appId: string;
  timestamp: number;
  fileName: string;
  status: 'success' | 'failed';
  message: string;
  userId: string;
}

export class DeployHistoryManager {
  private historyPath: string;
  private history: DeployRecord[];

  constructor() {
    this.historyPath = path.join(process.cwd(), 'deploy-history.json');
    this.history = this.loadHistory();
  }

  private loadHistory(): DeployRecord[] {
    if (fs.existsSync(this.historyPath)) {
      const data = fs.readFileSync(this.historyPath, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  }

  private saveHistory(): void {
    fs.writeFileSync(this.historyPath, JSON.stringify(this.history, null, 2));
  }

  addDeploy(hostName: string, appId: string, fileName: string, status: 'success' | 'failed', message: string, userId: string): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const record: DeployRecord = {
      id,
      hostName,
      appId,
      timestamp: Date.now(),
      fileName,
      status,
      message,
      userId
    };
    this.history.unshift(record);
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }
    this.saveHistory();
    return id;
  }

  getHistory(hostName?: string, appId?: string, limit: number = 10): DeployRecord[] {
    let filtered = this.history;
    if (hostName) {
      filtered = filtered.filter(r => r.hostName === hostName);
    }
    if (appId) {
      filtered = filtered.filter(r => r.appId === appId);
    }
    return filtered.slice(0, limit);
  }

  getDeployById(id: string): DeployRecord | undefined {
    return this.history.find(r => r.id === id);
  }

  clearHistory(hostName?: string): void {
    if (hostName) {
      this.history = this.history.filter(r => r.hostName !== hostName);
    } else {
      this.history = [];
    }
    this.saveHistory();
  }
}
