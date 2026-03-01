export interface HostProvider {
  name: string;
  deploy(file: Buffer, filename: string): Promise<DeployResult>;
  getStatus(appId: string): Promise<AppStatus>;
  start(appId: string): Promise<ActionResult>;
  stop(appId: string): Promise<ActionResult>;
  restart(appId: string): Promise<ActionResult>;
  getLogs(appId: string): Promise<string>;
  getApps(): Promise<AppInfo[]>;
  delete(appId: string): Promise<ActionResult>;
}

export interface DeployResult {
  success: boolean;
  appId?: string;
  message: string;
}

export interface AppStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'starting' | 'stopping';
  cpu?: string;
  ram?: string;
  uptime?: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface AppInfo {
  id: string;
  name: string;
  status: string;
}
