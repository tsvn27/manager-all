import fs from 'fs';
import path from 'path';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'pix' | 'mercadopago' | 'stripe' | 'paypal';
  enabled: boolean;
  config: {
    apiKey?: string;
    pixKey?: string;
    webhookUrl?: string;
  };
}

interface PaymentData {
  methods: PaymentMethod[];
}

export class PaymentManager {
  private dataPath: string;
  private data: PaymentData;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'payments.json');
    this.data = this.loadData();
  }

  private loadData(): PaymentData {
    if (fs.existsSync(this.dataPath)) {
      const content = fs.readFileSync(this.dataPath, 'utf-8');
      return JSON.parse(content);
    }
    return { methods: [] };
  }

  private saveData(): void {
    fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
  }

  addPaymentMethod(method: Omit<PaymentMethod, 'id'>): string {
    const id = `pm_${Date.now()}`;
    this.data.methods.push({ ...method, id });
    this.saveData();
    return id;
  }

  updatePaymentMethod(id: string, updates: Partial<Omit<PaymentMethod, 'id'>>): boolean {
    const index = this.data.methods.findIndex(m => m.id === id);
    if (index === -1) return false;
    this.data.methods[index] = { ...this.data.methods[index], ...updates };
    this.saveData();
    return true;
  }

  deletePaymentMethod(id: string): boolean {
    const index = this.data.methods.findIndex(m => m.id === id);
    if (index === -1) return false;
    this.data.methods.splice(index, 1);
    this.saveData();
    return true;
  }

  getPaymentMethod(id: string): PaymentMethod | undefined {
    return this.data.methods.find(m => m.id === id);
  }

  getAllPaymentMethods(): PaymentMethod[] {
    return this.data.methods;
  }

  getEnabledPaymentMethods(): PaymentMethod[] {
    return this.data.methods.filter(m => m.enabled);
  }

  togglePaymentMethod(id: string): boolean {
    const method = this.data.methods.find(m => m.id === id);
    if (!method) return false;
    method.enabled = !method.enabled;
    this.saveData();
    return method.enabled;
  }

  async createPayment(methodId: string, amount: number, description: string): Promise<{ success: boolean; paymentUrl?: string; qrCode?: string; error?: string }> {
    const method = this.data.methods.find(m => m.id === methodId);
    if (!method || !method.enabled) {
      return { success: false, error: 'Método de pagamento não disponível' };
    }

    return { success: true, paymentUrl: 'https://payment.example.com/pay' };
  }
}
