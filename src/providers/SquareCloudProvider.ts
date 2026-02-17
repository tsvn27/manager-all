import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { HostProvider, DeployResult, AppStatus, ActionResult, AppInfo } from '../types/index.js';

export class SquareCloudProvider implements HostProvider {
  name = 'SquareCloud';
  private api: AxiosInstance;

  constructor(apiToken: string) {
    this.api = axios.create({
      baseURL: 'https://api.squarecloud.app/v2',
      headers: { 'Authorization': apiToken }
    });
  }

  async deploy(file: Buffer, filename: string): Promise<DeployResult> {
    try {
      const form = new FormData();
      form.append('file', file, filename);

      const response = await this.api.post('/apps', form, {
        headers: form.getHeaders()
      });

      return {
        success: response.data.status === 'success',
        appId: response.data.response?.id,
        message: response.data.message || 'Deploy realizado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.code || 'Erro no deploy'
      };
    }
  }

  async getStatus(appId: string): Promise<AppStatus> {
    try {
      const response = await this.api.get(`/apps/${appId}/status`);
      const app = response.data.response;

      return {
        id: appId,
        name: app.tag || 'App',
        status: app.running ? 'online' : 'offline',
        cpu: app.cpu,
        ram: app.ram,
        uptime: app.uptime
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar status: ${error.response?.data?.message || error.response?.data?.code || error.message}`);
    }
  }

  async start(appId: string): Promise<ActionResult> {
    try {
      const response = await this.api.post(`/apps/${appId}/start`);
      return {
        success: response.data.status === 'success',
        message: response.data.message || 'App iniciado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.code || 'Erro ao iniciar'
      };
    }
  }

  async stop(appId: string): Promise<ActionResult> {
    try {
      const response = await this.api.post(`/apps/${appId}/stop`);
      return {
        success: response.data.status === 'success',
        message: response.data.message || 'App parado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.code || 'Erro ao parar'
      };
    }
  }

  async restart(appId: string): Promise<ActionResult> {
    try {
      const response = await this.api.post(`/apps/${appId}/restart`);
      return {
        success: response.data.status === 'success',
        message: response.data.message || 'App reiniciado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.code || 'Erro ao reiniciar'
      };
    }
  }

  async getLogs(appId: string): Promise<string> {
    try {
      const response = await this.api.get(`/apps/${appId}/logs`);
      return response.data.response?.logs || 'Sem logs';
    } catch (error: any) {
      throw new Error(`Erro ao buscar logs: ${error.response?.data?.message || error.response?.data?.code || error.message}`);
    }
  }

  async getApps(): Promise<AppInfo[]> {
    try {
      const response = await this.api.get('/users/me');
      const apps = response.data.response?.applications || [];
      
      return apps.map((app: any) => ({
        id: app.id,
        name: app.tag,
        status: app.isOnline ? 'online' : 'offline'
      }));
    } catch (error: any) {
      throw new Error(`Erro ao buscar apps: ${error.response?.data?.message || error.message}`);
    }
  }

  async delete(appId: string): Promise<ActionResult> {
    try {
      const response = await this.api.delete(`/apps/${appId}`);
      return {
        success: response.data.status === 'success',
        message: response.data.message || 'App deletado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.code || 'Erro ao deletar'
      };
    }
  }
}
