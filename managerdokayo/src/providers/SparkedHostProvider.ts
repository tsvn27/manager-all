import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { HostProvider, DeployResult, AppStatus, ActionResult, AppInfo } from '../types/index.js';

export class SparkedHostProvider implements HostProvider {
  name = 'SparkedHost';
  private api: AxiosInstance;

  constructor(apiToken: string) {
    this.api = axios.create({
      baseURL: 'https://sparkedhost.com/api',
      headers: { 
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    });
  }

  async deploy(file: Buffer, filename: string): Promise<DeployResult> {
    try {
      const form = new FormData();
      form.append('file', file, filename);

      const response = await this.api.post('/servers/deploy', form, {
        headers: form.getHeaders()
      });

      return {
        success: response.data.success || false,
        appId: response.data.data?.server_id || response.data.server_id,
        message: response.data.message || 'Deploy realizado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.error || 'Erro no deploy'
      };
    }
  }

  async getStatus(appId: string): Promise<AppStatus> {
    try {
      const response = await this.api.get(`/servers/${appId}`);
      const server = response.data.data || response.data;

      return {
        id: appId,
        name: server.name || server.identifier || 'Server',
        status: this.parseStatus(server.status || server.state),
        cpu: server.cpu ? `${server.cpu}%` : undefined,
        ram: server.memory ? `${server.memory}MB` : undefined,
        uptime: server.uptime
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar status: ${error.response?.data?.message || error.message}`);
    }
  }

  private parseStatus(status: string): 'online' | 'offline' | 'starting' | 'stopping' {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('running') || statusLower.includes('online')) return 'online';
    if (statusLower.includes('starting')) return 'starting';
    if (statusLower.includes('stopping')) return 'stopping';
    return 'offline';
  }

  async start(appId: string): Promise<ActionResult> {
    try {
      const response = await this.api.post(`/servers/${appId}/power`, { signal: 'start' });
      return {
        success: response.data.success !== false,
        message: response.data.message || 'Server iniciado'
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
      const response = await this.api.post(`/servers/${appId}/power`, { signal: 'stop' });
      return {
        success: response.data.success !== false,
        message: response.data.message || 'Server parado'
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
      const response = await this.api.post(`/servers/${appId}/power`, { signal: 'restart' });
      return {
        success: response.data.success !== false,
        message: response.data.message || 'Server reiniciado'
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
      const response = await this.api.get(`/servers/${appId}/logs`);
      return response.data.data?.logs || response.data.logs || 'Sem logs';
    } catch (error: any) {
      throw new Error(`Erro ao buscar logs: ${error.response?.data?.message || error.message}`);
    }
  }

  async getApps(): Promise<AppInfo[]> {
    try {
      const response = await this.api.get('/servers');
      const servers = response.data.data || response.data.servers || [];
      
      return servers.map((server: any) => ({
        id: server.id || server.identifier,
        name: server.name || server.identifier || 'Server',
        status: this.parseStatus(server.status || server.state)
      }));
    } catch (error: any) {
      throw new Error(`Erro ao buscar servers: ${error.response?.data?.message || error.message}`);
    }
  }

  async delete(appId: string): Promise<ActionResult> {
    try {
      const response = await this.api.delete(`/servers/${appId}`);
      return {
        success: response.data.success !== false,
        message: response.data.message || 'Server deletado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao deletar'
      };
    }
  }
}
