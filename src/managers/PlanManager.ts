import fs from 'fs';
import path from 'path';

interface Plan {
  id: string;
  name: string;
  hostName: string;
  price: number;
  duration: number;
  resources: {
    ram: string;
    cpu: string;
    storage: string;
  };
  features: string[];
  active: boolean;
}

interface PlansData {
  plans: Plan[];
}

export class PlanManager {
  private dataPath: string;
  private data: PlansData;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'plans.json');
    this.data = this.loadData();
  }

  private loadData(): PlansData {
    if (fs.existsSync(this.dataPath)) {
      const content = fs.readFileSync(this.dataPath, 'utf-8');
      return JSON.parse(content);
    }
    return { plans: [] };
  }

  private saveData(): void {
    fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
  }

  addPlan(plan: Omit<Plan, 'id'>): string {
    const id = `plan_${Date.now()}`;
    this.data.plans.push({ ...plan, id });
    this.saveData();
    return id;
  }

  updatePlan(id: string, updates: Partial<Omit<Plan, 'id'>>): boolean {
    const index = this.data.plans.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.data.plans[index] = { ...this.data.plans[index], ...updates };
    this.saveData();
    return true;
  }

  deletePlan(id: string): boolean {
    const index = this.data.plans.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.data.plans.splice(index, 1);
    this.saveData();
    return true;
  }

  getPlan(id: string): Plan | undefined {
    return this.data.plans.find(p => p.id === id);
  }

  getAllPlans(): Plan[] {
    return this.data.plans;
  }

  getActivePlans(): Plan[] {
    return this.data.plans.filter(p => p.active);
  }

  getPlansByHost(hostName: string): Plan[] {
    return this.data.plans.filter(p => p.hostName === hostName);
  }

  togglePlan(id: string): boolean {
    const plan = this.data.plans.find(p => p.id === id);
    if (!plan) return false;
    plan.active = !plan.active;
    this.saveData();
    return plan.active;
  }
}
