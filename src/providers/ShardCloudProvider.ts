import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { HostProvider, DeployResult, AppStatus, ActionResult, AppInfo } from '../types/index.js';

export class ShardCloudProvider implements HostProvider {
  name = 'ShardCloud';
  private api: AxiosInstance;

  constructor(apiToken: string) {
    this.api = axios.create({
      baseURL: 'https://shardcloud.app/api',
      headers: { 
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async deploy(file: Buffer, filename: string): Promise<DeployResult> {
    try {
      const form = new FormData();
      form.append('file', file, filename);

      const response = await this.api.post('/apps/deploy', form, {
        headers: form.getHeaders()
      });

      return {
        success: response.data.success || response.data.status === 'success',
        appId: response.data.data?.app_id || response.data.app_id || response.data.id,
        message: response.data.message || 'Deploy realizado com sucesso'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.error || 'Erro no deploy. Verifique se a API do ShardCloud está disponível.'
      };
    }
  }

  async getStatus(appId: string): Promise<AppStatus> {
    try {
      const response = await this.api.get(`/apps/${appId}/status`);
      const app = response.data.data || response.data;

      return {
        id: appId,
        name: app.name || app.app_name || 'App',
        status: this.parseStatus(app.status || app.state),
        cpu: app.cpu ? `${app.cpu}%` : undefined,
        ram: app.ram || app.memory ? `${app.ram || app.memory}MB` : undefined,
        uptime: app.uptime
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar status: ${error.response?.data?.message || error.message}`);
    }
  }

  private parseStatus(status: string): 'online' | 'offline' | 'starting' | 'stopping' {
    if (!status) return 'offline';
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('running') || statusLower.includes('online') || statusLower === 'active') {
      return 'online';
    }
    if (statusLower.includes('starting') || statusLower.includes('deploying')) {
      return 'starting';
    }
    if (statusLower.includes('stopping')) {
      return 'stopping';
    }
    return 'offline';
  }

  async start(appId: string): Promise<ActionResult> {
    try {
      const response = await this.api.post(`/apps/${appId}/start`);
      return {
        success: response.data.success !== false,
        message: response.data.message || 'App iniciado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao iniciar'
      };
    }
  }

  async stop(appId: string): Promise<ActionResult> {
    try {
      const response = await this.api.post(`/apps/${appId}/stop`);
      return {
        success: response.data.success !== false,
        message: response.data.message || 'App parado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao parar'
      };
    }
  }

  async restart(appId: string): Promise<ActionResult> {
    try {
      const response = await this.api.post(`/apps/${appId}/restart`);
      return {
        success: response.data.success !== false,
        message: response.data.message || 'App reiniciado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao reiniciar'
      };
    }
  }

  async getLogs(appId: string): Promise<string> {
    try {
      const response = await this.api.get(`/apps/${appId}/logs`);
      return response.data.data?.logs || response.data.logs || 'Sem logs disponíveis';
    } catch (error: any) {
      throw new Error(`Erro ao buscar logs: ${error.response?.data?.message || error.message}`);
    }
  }

  async getApps(): Promise<AppInfo[]> {
    try {
      const response = await this.api.get('/apps');
      const apps = response.data.data?.apps || response.data.apps || response.data || [];
      
      return apps.map((app: any) => ({
        id: app.id || app.app_id,
        name: app.name || app.app_name || 'App',
        status: this.parseStatus(app.status || app.state)
      }));
    } catch (error: any) {
      throw new Error(`Erro ao buscar apps: ${error.response?.data?.message || error.message}`);
    }
  }

  async delete(appId: string): Promise<ActionResult> {
    try {
      const response = await this.api.delete(`/apps/${appId}`);
      return {
        success: response.data.success !== false,
        message: response.data.message || 'App deletado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao deletar'
      };
    }
  }
}
