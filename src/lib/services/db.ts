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

// Extend Dexie with our schema
class KiepscyDatabase extends Dexie {
  history!: Table<HistoryEntry>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      history: '++id, uuid, route, timestamp'
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
} 