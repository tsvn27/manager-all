import axios, { AxiosInstance } from 'axios';
import { HostProvider, DeployResult, AppStatus, ActionResult, AppInfo } from '../types/index.js';

export class ReplitProvider implements HostProvider {
  name = 'Replit';
  private api: AxiosInstance;
  private username: string;

  constructor(apiToken: string, username?: string) {
    this.api = axios.create({
      baseURL: 'https://replit.com/graphql',
      headers: { 
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': `connect.sid=${apiToken}`,
        'Content-Type': 'application/json'
      }
    });
    this.username = username || '';
  }

  async deploy(file: Buffer, filename: string): Promise<DeployResult> {
    return {
      success: false,
      message: 'Replit não suporta deploy via API. Crie um Repl e faça upload manual ou use Git.'
    };
  }

  async getStatus(appId: string): Promise<AppStatus> {
    try {
      const query = `
        query ReplView($url: String!) {
          repl(url: $url) {
            ... on Repl {
              id
              title
              isRunning
              powerUpCosts {
                cpu
                memory
              }
            }
          }
        }
      `;

      const response = await this.api.post('', {
        query,
        variables: { url: `/@${this.username}/${appId}` }
      });

      const repl = response.data.data?.repl;

      if (!repl) {
        throw new Error('Repl não encontrado');
      }

      return {
        id: repl.id,
        name: repl.title || appId,
        status: repl.isRunning ? 'online' : 'offline',
        cpu: repl.powerUpCosts?.cpu ? `${repl.powerUpCosts.cpu}` : undefined,
        ram: repl.powerUpCosts?.memory ? `${repl.powerUpCosts.memory}MB` : undefined
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar status: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  async start(appId: string): Promise<ActionResult> {
    try {
      const mutation = `
        mutation StartRepl($replId: String!) {
          startRepl(replId: $replId) {
            id
          }
        }
      `;

      const response = await this.api.post('', {
        query: mutation,
        variables: { replId: appId }
      });

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      return {
        success: true,
        message: 'Repl iniciado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.errors?.[0]?.message || 'Erro ao iniciar'
      };
    }
  }

  async stop(appId: string): Promise<ActionResult> {
    try {
      const mutation = `
        mutation StopRepl($replId: String!) {
          stopRepl(replId: $replId) {
            id
          }
        }
      `;

      const response = await this.api.post('', {
        query: mutation,
        variables: { replId: appId }
      });

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      return {
        success: true,
        message: 'Repl parado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.errors?.[0]?.message || 'Erro ao parar'
      };
    }
  }

  async restart(appId: string): Promise<ActionResult> {
    const stopResult = await this.stop(appId);
    if (!stopResult.success) {
      return stopResult;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    return await this.start(appId);
  }

  async getLogs(appId: string): Promise<string> {
    return 'Replit não fornece logs via API. Acesse o Repl diretamente para ver os logs.';
  }

  async getApps(): Promise<AppInfo[]> {
    try {
      if (!this.username) {
        throw new Error('Username não configurado');
      }

      const query = `
        query UserRepls($username: String!) {
          user(username: $username) {
            repls {
              items {
                id
                title
                isRunning
              }
            }
          }
        }
      `;

      const response = await this.api.post('', {
        query,
        variables: { username: this.username }
      });

      const items = response.data.data?.user?.repls?.items || [];
      
      return items.map((repl: any) => ({
        id: repl.id,
        name: repl.title,
        status: repl.isRunning ? 'online' : 'offline'
      }));
    } catch (error: any) {
      throw new Error(`Erro ao buscar repls: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  async delete(appId: string): Promise<ActionResult> {
    try {
      const mutation = `
        mutation DeleteRepl($replId: String!) {
          deleteRepl(replId: $replId) {
            id
          }
        }
      `;

      const response = await this.api.post('', {
        query: mutation,
        variables: { replId: appId }
      });

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      return {
        success: true,
        message: 'Repl deletado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.errors?.[0]?.message || 'Erro ao deletar'
      };
    }
  }
}
