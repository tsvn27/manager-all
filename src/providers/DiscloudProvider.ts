import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { HostProvider, DeployResult, AppStatus, ActionResult, AppInfo } from '../types/index.js';

export class DiscloudProvider implements HostProvider {
  name = 'Discloud';
  private api: AxiosInstance;

  constructor(apiToken: string) {
    this.api = axios.create({
      baseURL: 'https://api.discloud.app/v2',
      headers: { 'api-token': apiToken }
    });
  }

  async deploy(file: Buffer, filename: string): Promise<DeployResult> {
    try {
      const form = new FormData();
      form.append('file', file, filename);

      const response = await this.api.post('/upload', form, {
        headers: form.getHeaders()
      });

      return {
        success: response.data.status === 'ok',
        appId: response.data.app?.id,
        message: response.data.message || 'Deploy realizado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro no deploy'
      };
    }
  }

  async getStatus(appId: string): Promise<AppStatus> {
    const response = await this.api.get(`/app/${appId}/status`);
    const app = response.data.apps?.[0] || response.data.app;

    return {
      id: app.id,
      name: app.name,
      status: app.online ? 'online' : 'offline',
      cpu: app.cpu,
      ram: app.memory,
      uptime: app.uptime
    };
  }

  async start(appId: string): Promise<ActionResult> {
    try {
      const response = await this.api.put(`/app/${appId}/start`);
      return {
        success: response.data.status === 'ok',
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
      const response = await this.api.put(`/app/${appId}/stop`);
      return {
        success: response.data.status === 'ok',
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
      const response = await this.api.put(`/app/${appId}/restart`);
      return {
        success: response.data.status === 'ok',
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
    const response = await this.api.get(`/app/${appId}/logs`);
    return response.data.apps?.logs?.terminal || 'Sem logs';
  }

  async getApps(): Promise<AppInfo[]> {
    const response = await this.api.get('/app/all');
    const apps = response.data.apps || [];
    
    return apps.map((app: any) => ({
      id: app.id,
      name: app.name,
      status: app.online ? 'online' : 'offline'
    }));
  }

  async delete(appId: string): Promise<ActionResult> {
    try {
      const response = await this.api.delete(`/app/${appId}/delete`);
      return {
        success: response.data.status === 'ok',
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
