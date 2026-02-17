import { HostProvider } from '../types/index.js';

export class HostManager {
  private providers: Map<string, HostProvider> = new Map();

  addProvider(provider: HostProvider) {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  getProvider(name: string): HostProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  getAllProviders(): HostProvider[] {
    return Array.from(this.providers.values());
  }

  hasProvider(name: string): boolean {
    return this.providers.has(name.toLowerCase());
  }
}
