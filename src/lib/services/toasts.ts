import type { Toast } from '$lib/types/Toast';
import { DatabaseService } from './db';
import { writable, type Writable } from 'svelte/store';

export class ToastService {
  private static instance: ToastService;
  private dbService: DatabaseService;
  private readonly ROUTE = '/toasty';

  // Store for current toast
  public currentToast: Writable<Toast | null> = writable(null);
  public previousToast: Writable<Toast | null> = writable(null);

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): ToastService {
    if (!ToastService.instance) {
      ToastService.instance = new ToastService();
    }
    return ToastService.instance;
  }

  // Get random toast
  public getRandomToast(toasts: Toast[], excludeCurrent?: Toast): Toast {
    let randomIndex: number;
    let selectedToast: Toast;

    do {
      randomIndex = Math.floor(Math.random() * toasts.length);
      selectedToast = { ...toasts[randomIndex], rollTimestamp: Date.now() };
    } while (toasts.length > 1 && selectedToast === excludeCurrent);

    // Update stores
    this.previousToast.set(excludeCurrent || null);
    this.currentToast.set(selectedToast);

    return selectedToast;
  }

  // Add toast to history
  public async addToHistory(toast: Toast): Promise<void> {
    await this.dbService.addToHistory(this.ROUTE, toast);
  }

  // Get toast history
  public async getHistory(): Promise<Toast[]> {
    const history = await this.dbService.getHistory(this.ROUTE);

    // If there's history, set current toast to the most recent one
    if (history.length > 0) {
      const mostRecent = history[0].data as Toast;
      this.currentToast.set(mostRecent);
      this.previousToast.set(null);
    }

    return history.map(entry => entry.data as Toast);
  }

  // Clear toast history
  public async clearHistory(): Promise<void> {
    await this.dbService.clearHistory(this.ROUTE);
    this.currentToast.set(null);
    this.previousToast.set(null);
  }

  // Load initial history and show notification
  public async loadHistory(): Promise<Toast[]> {
    try {
      const history = await this.getHistory();
      return history;
    } catch (error) {
      console.error('Failed to load toast history:', error);
      throw error;
    }
  }
} 