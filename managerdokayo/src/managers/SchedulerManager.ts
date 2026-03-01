import fs from 'fs';
import path from 'path';

interface ScheduledDeploy {
  id: string;
  hostName: string;
  appId: string;
  filePath: string;
  scheduledTime: number;
  userId: string;
  recurring?: 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
}

export class SchedulerManager {
  private schedulesFile = 'scheduled-deploys.json';
  private schedules: ScheduledDeploy[] = [];
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.loadSchedules();
    this.startScheduler();
  }

  private loadSchedules() {
    try {
      if (fs.existsSync(this.schedulesFile)) {
        const data = fs.readFileSync(this.schedulesFile, 'utf-8');
        this.schedules = JSON.parse(data);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      this.schedules = [];
    }
  }

  private saveSchedules() {
    try {
      fs.writeFileSync(this.schedulesFile, JSON.stringify(this.schedules, null, 2));
    } catch (error) {
      console.error('Erro ao salvar agendamentos:', error);
    }
  }

  private startScheduler() {
    setInterval(() => {
      this.checkSchedules();
    }, 60000);
  }

  private checkSchedules() {
    const now = Date.now();
    
    this.schedules.forEach(schedule => {
      if (schedule.status === 'pending' && schedule.scheduledTime <= now) {
        this.executeScheduledDeploy(schedule);
      }
    });
  }

  private async executeScheduledDeploy(schedule: ScheduledDeploy) {
    console.log(`Executando deploy agendado: ${schedule.id}`);
    
    schedule.status = 'completed';
    
    if (schedule.recurring) {
      const nextTime = this.calculateNextTime(schedule.scheduledTime, schedule.recurring);
      this.schedules.push({
        ...schedule,
        id: this.generateId(),
        scheduledTime: nextTime,
        status: 'pending'
      });
    }
    
    this.saveSchedules();
  }

  private calculateNextTime(currentTime: number, recurring: 'daily' | 'weekly' | 'monthly'): number {
    const date = new Date(currentTime);
    
    switch (recurring) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
    }
    
    return date.getTime();
  }

  private generateId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  scheduleDeploy(hostName: string, appId: string, filePath: string, scheduledTime: number, userId: string, recurring?: 'daily' | 'weekly' | 'monthly'): string {
    const schedule: ScheduledDeploy = {
      id: this.generateId(),
      hostName,
      appId,
      filePath,
      scheduledTime,
      userId,
      recurring,
      status: 'pending'
    };

    this.schedules.push(schedule);
    this.saveSchedules();
    
    return schedule.id;
  }

  cancelSchedule(scheduleId: string): boolean {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    
    if (schedule) {
      schedule.status = 'cancelled';
      this.saveSchedules();
      return true;
    }
    
    return false;
  }

  getSchedules(userId?: string): ScheduledDeploy[] {
    if (userId) {
      return this.schedules.filter(s => s.userId === userId && s.status === 'pending');
    }
    return this.schedules.filter(s => s.status === 'pending');
  }

  getScheduleById(scheduleId: string): ScheduledDeploy | undefined {
    return this.schedules.find(s => s.id === scheduleId);
  }
}
