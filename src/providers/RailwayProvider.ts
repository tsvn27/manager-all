import axios, { AxiosInstance } from 'axios';
import { HostProvider, DeployResult, AppStatus, ActionResult, AppInfo } from '../types/index.js';

export class RailwayProvider implements HostProvider {
  name = 'Railway';
  private api: AxiosInstance;
  private projectId: string;

  constructor(apiToken: string, projectId?: string) {
    this.api = axios.create({
      baseURL: 'https://backboard.railway.app/graphql/v2',
      headers: { 
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });
    this.projectId = projectId || '';
  }

  async deploy(file: Buffer, filename: string): Promise<DeployResult> {
    return {
      success: false,
      message: 'Railway não suporta deploy via API. Use GitHub integration ou Railway CLI.'
    };
  }

  async getStatus(appId: string): Promise<AppStatus> {
    try {
      const query = `
        query {
          deployment(id: "${appId}") {
            id
            status
            meta
            createdAt
          }
        }
      `;

      const response = await this.api.post('', { query });
      const deployment = response.data.data?.deployment;

      if (!deployment) {
        throw new Error('Deployment não encontrado');
      }

      return {
        id: appId,
        name: deployment.meta?.name || 'Railway App',
        status: this.parseStatus(deployment.status),
        uptime: deployment.createdAt ? this.calculateUptime(deployment.createdAt) : undefined
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar status: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  private parseStatus(status: string): 'online' | 'offline' | 'starting' | 'stopping' {
    const statusUpper = status?.toUpperCase() || '';
    if (statusUpper === 'SUCCESS' || statusUpper === 'ACTIVE') return 'online';
    if (statusUpper === 'BUILDING' || statusUpper === 'DEPLOYING') return 'starting';
    if (statusUpper === 'CRASHED' || statusUpper === 'FAILED') return 'offline';
    return 'offline';
  }

  private calculateUptime(createdAt: string): string {
    const now = Date.now();
    const created = new Date(createdAt).getTime();
    const diff = now - created;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }

  async start(appId: string): Promise<ActionResult> {
    return {
      success: false,
      message: 'Railway deployments iniciam automaticamente. Use redeploy se necessário.'
    };
  }

  async stop(appId: string): Promise<ActionResult> {
    return {
      success: false,
      message: 'Railway não suporta parar deployments via API. Delete o deployment se necessário.'
    };
  }

  async restart(appId: string): Promise<ActionResult> {
    try {
      const mutation = `
        mutation {
          deploymentRedeploy(id: "${appId}") {
            id
          }
        }
      `;

      const response = await this.api.post('', { query: mutation });
      
      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      return {
        success: true,
        message: 'Redeploy iniciado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.errors?.[0]?.message || 'Erro ao fazer redeploy'
      };
    }
  }

  async getLogs(appId: string): Promise<string> {
    try {
      const query = `
        query {
          deploymentLogs(deploymentId: "${appId}", limit: 100) {
            message
            timestamp
          }
        }
      `;

      const response = await this.api.post('', { query });
      const logs = response.data.data?.deploymentLogs || [];
      
      return logs.map((log: any) => `[${log.timestamp}] ${log.message}`).join('\n') || 'Sem logs';
    } catch (error: any) {
      throw new Error(`Erro ao buscar logs: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  async getApps(): Promise<AppInfo[]> {
    try {
      if (!this.projectId) {
        throw new Error('Project ID não configurado');
      }

      const query = `
        query {
          project(id: "${this.projectId}") {
            deployments {
              edges {
                node {
                  id
                  status
                  meta
                }
              }
            }
          }
        }
      `;

      const response = await this.api.post('', { query });
      const edges = response.data.data?.project?.deployments?.edges || [];
      
      return edges.map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.meta?.name || 'Railway App',
        status: this.parseStatus(edge.node.status)
      }));
    } catch (error: any) {
      throw new Error(`Erro ao buscar deployments: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  async delete(appId: string): Promise<ActionResult> {
    try {
      const mutation = `
        mutation {
          deploymentRemove(id: "${appId}")
        }
      `;

      const response = await this.api.post('', { query: mutation });
      
      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      return {
        success: true,
        message: 'Deployment deletado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.errors?.[0]?.message || 'Erro ao deletar'
      };
    }
  }
}
