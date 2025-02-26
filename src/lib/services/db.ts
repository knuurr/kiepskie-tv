import Dexie, { type Table } from 'dexie';
import type { Toast } from '$lib/types/Toast';
import type { EpisodeHistoryEntry } from '$lib/types/Episode';
import { browser } from '$app/environment';

// Database schema version and configuration
const DB_NAME = 'kiepscy-db';
const DB_VERSION = 2;

// Define the database schema and types
interface HistoryEntry {
  id?: number;
  uuid: string;
  timestamp: number;
  route: string;
  data: Toast | EpisodeHistoryEntry;
}

// New interface for stats
interface RouteStats {
  id?: number;
  route: string;
  rollCount: number;
}

// Extend Dexie with our schema
class KiepscyDatabase extends Dexie {
  history!: Table<HistoryEntry>;
  stats!: Table<RouteStats>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION + 1).stores({
      history: '++id, uuid, route, timestamp',
      stats: '++id, route'
    });
  }
}

// Create singleton instance
const db = new KiepscyDatabase();

// Database service with clean interface
export class DatabaseService {
  private static instance: DatabaseService;
  private db: KiepscyDatabase;
  private readonly MAX_HISTORY_SIZE = 6;

  private constructor() {
    this.db = db;
  }

  // Singleton pattern
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Initialize database
  public async init(): Promise<void> {
    if (!browser) return;

    try {
      await this.db.open();
      console.debug('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  // Add item to history
  public async addToHistory(route: string, data: Toast | EpisodeHistoryEntry): Promise<void> {
    if (!browser) return;

    try {
      const entry: HistoryEntry = {
        uuid: (data as any).uuid || (data as any).episode?.uuid || crypto.randomUUID(),
        timestamp: Date.now(),
        route,
        data
      };

      await this.db.history.add(entry);
      await this.cleanupHistory(route);

      console.debug(`Added history entry for route: ${route}`);
    } catch (error) {
      console.error('Failed to add history entry:', error);
      throw error;
    }
  }

  // Get history for specific route
  public async getHistory(route: string): Promise<HistoryEntry[]> {
    if (!browser) return [];

    try {
      return await this.db.history
        .where('route')
        .equals(route)
        .reverse()
        .sortBy('timestamp');
    } catch (error) {
      console.error('Failed to get history:', error);
      throw error;
    }
  }

  // Clear history for specific route
  public async clearHistory(route: string): Promise<void> {
    if (!browser) return;

    try {
      await this.db.history
        .where('route')
        .equals(route)
        .delete();

      console.debug(`Cleared history for route: ${route}`);
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw error;
    }
  }

  // Private method to cleanup old entries
  private async cleanupHistory(route: string): Promise<void> {
    const entries = await this.getHistory(route);

    if (entries.length > this.MAX_HISTORY_SIZE) {
      const entriesToDelete = entries.slice(this.MAX_HISTORY_SIZE);
      await this.db.history
        .where('id')
        .anyOf(entriesToDelete.map(e => e.id!))
        .delete();
    }
  }

  // Get roll count for route
  public async getRollCount(route: string): Promise<number> {
    if (!browser) return 0;

    try {
      const stats = await this.db.stats.where('route').equals(route).first();
      return stats?.rollCount || 0;
    } catch (error) {
      console.error('Failed to get roll count:', error);
      return 0;
    }
  }

  // Increment roll count for route
  public async incrementRollCount(route: string): Promise<void> {
    if (!browser) return;

    try {
      const stats = await this.db.stats.where('route').equals(route).first();
      if (stats) {
        await this.db.stats.where('route').equals(route).modify({ rollCount: stats.rollCount + 1 });
      } else {
        await this.db.stats.add({ route, rollCount: 1 });
      }
      console.debug(`Incremented roll count for route: ${route}`);
    } catch (error) {
      console.error('Failed to increment roll count:', error);
      throw error;
    }
  }

  // Clear stats for route
  public async clearStats(route: string): Promise<void> {
    if (!browser) return;

    try {
      await this.db.stats.where('route').equals(route).delete();
      console.debug(`Cleared stats for route: ${route}`);
    } catch (error) {
      console.error('Failed to clear stats:', error);
      throw error;
    }
  }
} 