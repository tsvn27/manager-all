import fs from 'fs';
import path from 'path';

interface Customer {
  userId: string;
  applications: Application[];
  transactions: Transaction[];
}

interface Application {
  id: string;
  appId: string;
  hostName: string;
  planId: string;
  purchaseDate: number;
  expiryDate: number;
  autoRenew: boolean;
  status: 'active' | 'suspended' | 'expired';
}

interface Transaction {
  id: string;
  type: 'purchase' | 'renewal';
  planId: string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed';
  date: number;
}

interface CustomersData {
  customers: Customer[];
}

export class CustomerManager {
  private dataPath: string;
  private data: CustomersData;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'customers.json');
    this.data = this.loadData();
  }

  private loadData(): CustomersData {
    if (fs.existsSync(this.dataPath)) {
      const content = fs.readFileSync(this.dataPath, 'utf-8');
      return JSON.parse(content);
    }
    return { customers: [] };
  }

  private saveData(): void {
    fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
  }

  private getCustomer(userId: string): Customer {
    let customer = this.data.customers.find(c => c.userId === userId);
    if (!customer) {
      customer = { userId, applications: [], transactions: [] };
      this.data.customers.push(customer);
      this.saveData();
    }
    return customer;
  }

  addApplication(userId: string, appId: string, hostName: string, planId: string, duration: number): string {
    const customer = this.getCustomer(userId);
    const id = `app_${Date.now()}`;
    const now = Date.now();
    
    customer.applications.push({
      id,
      appId,
      hostName,
      planId,
      purchaseDate: now,
      expiryDate: now + (duration * 24 * 60 * 60 * 1000),
      autoRenew: false,
      status: 'active'
    });
    
    this.saveData();
    return id;
  }

  getCustomerApplications(userId: string): Application[] {
    const customer = this.data.customers.find(c => c.userId === userId);
    return customer?.applications || [];
  }

  getApplication(userId: string, appId: string): Application | undefined {
    const customer = this.data.customers.find(c => c.userId === userId);
    return customer?.applications.find(app => app.appId === appId);
  }

  updateApplicationStatus(userId: string, appId: string, status: Application['status']): boolean {
    const customer = this.data.customers.find(c => c.userId === userId);
    if (!customer) return false;
    
    const app = customer.applications.find(a => a.appId === appId);
    if (!app) return false;
    
    app.status = status;
    this.saveData();
    return true;
  }

  toggleAutoRenew(userId: string, appId: string): boolean {
    const customer = this.data.customers.find(c => c.userId === userId);
    if (!customer) return false;
    
    const app = customer.applications.find(a => a.appId === appId);
    if (!app) return false;
    
    app.autoRenew = !app.autoRenew;
    this.saveData();
    return app.autoRenew;
  }

  renewApplication(userId: string, appId: string, duration: number): boolean {
    const customer = this.data.customers.find(c => c.userId === userId);
    if (!customer) return false;
    
    const app = customer.applications.find(a => a.appId === appId);
    if (!app) return false;
    
    app.expiryDate = Math.max(app.expiryDate, Date.now()) + (duration * 24 * 60 * 60 * 1000);
    app.status = 'active';
    this.saveData();
    return true;
  }

  transferOwnership(currentUserId: string, newUserId: string, appId: string): boolean {
    const currentCustomer = this.data.customers.find(c => c.userId === currentUserId);
    if (!currentCustomer) return false;
    
    const appIndex = currentCustomer.applications.findIndex(a => a.appId === appId);
    if (appIndex === -1) return false;
    
    const app = currentCustomer.applications[appIndex];
    currentCustomer.applications.splice(appIndex, 1);
    
    const newCustomer = this.getCustomer(newUserId);
    newCustomer.applications.push(app);
    
    this.saveData();
    return true;
  }

  addTransaction(userId: string, transaction: Omit<Transaction, 'id' | 'date'>): string {
    const customer = this.getCustomer(userId);
    const id = `txn_${Date.now()}`;
    
    customer.transactions.push({
      ...transaction,
      id,
      date: Date.now()
    });
    
    this.saveData();
    return id;
  }

  updateTransactionStatus(userId: string, transactionId: string, status: Transaction['status']): boolean {
    const customer = this.data.customers.find(c => c.userId === userId);
    if (!customer) return false;
    
    const txn = customer.transactions.find(t => t.id === transactionId);
    if (!txn) return false;
    
    txn.status = status;
    this.saveData();
    return true;
  }

  getCustomerTransactions(userId: string): Transaction[] {
    const customer = this.data.customers.find(c => c.userId === userId);
    return customer?.transactions || [];
  }

  checkExpiredApplications(): Array<{ userId: string; appId: string }> {
    const expired: Array<{ userId: string; appId: string }> = [];
    const now = Date.now();
    
    this.data.customers.forEach(customer => {
      customer.applications.forEach(app => {
        if (app.status === 'active' && app.expiryDate < now) {
          app.status = 'expired';
          expired.push({ userId: customer.userId, appId: app.appId });
        }
      });
    });
    
    if (expired.length > 0) {
      this.saveData();
    }
    
    return expired;
  }

  getAllCustomers(): Customer[] {
    return this.data.customers;
  }
}
