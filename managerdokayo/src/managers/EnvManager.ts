import fs from 'fs';
import path from 'path';

interface EnvVars {
  [appId: string]: {
    [key: string]: string;
  };
}

export class EnvManager {
  private envPath: string;
  private envVars: EnvVars;

  constructor() {
    this.envPath = path.join(process.cwd(), 'env-vars.json');
    this.envVars = this.loadEnvVars();
  }

  private loadEnvVars(): EnvVars {
    if (fs.existsSync(this.envPath)) {
      const data = fs.readFileSync(this.envPath, 'utf-8');
      return JSON.parse(data);
    }
    return {};
  }

  private saveEnvVars(): void {
    fs.writeFileSync(this.envPath, JSON.stringify(this.envVars, null, 2));
  }

  getVars(appId: string): { [key: string]: string } {
    return this.envVars[appId] || {};
  }

  setVar(appId: string, key: string, value: string): void {
    if (!this.envVars[appId]) {
      this.envVars[appId] = {};
    }
    this.envVars[appId][key] = value;
    this.saveEnvVars();
  }

  deleteVar(appId: string, key: string): void {
    if (this.envVars[appId]) {
      delete this.envVars[appId][key];
      this.saveEnvVars();
    }
  }

  deleteAllVars(appId: string): void {
    if (this.envVars[appId]) {
      delete this.envVars[appId];
      this.saveEnvVars();
    }
  }

  getAllVars(appId: string): Array<{ key: string; value: string }> {
    const vars = this.getVars(appId);
    return Object.entries(vars).map(([key, value]) => ({ key, value }));
  }

  generateEnvFile(appId: string): string {
    const vars = this.getVars(appId);
    return Object.entries(vars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
  }
}
