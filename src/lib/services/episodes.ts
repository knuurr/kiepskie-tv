import type { EpisodeData, EpisodeDataset, EpisodeWithMetadata, EpisodeHistoryEntry } from '$lib/types/Episode';
import { DatabaseService } from './db';
import { v4 as uuidv4 } from 'uuid';

export class EpisodeService {
  private static instance: EpisodeService;
  private dbService: DatabaseService;
  private seenUUIDs: Set<string> = new Set();

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): EpisodeService {
    if (!EpisodeService.instance) {
      EpisodeService.instance = new EpisodeService();
    }
    return EpisodeService.instance;
  }

  // Generate a guaranteed unique UUID
  private generateUniqueUUID(): string {
    let uuid = uuidv4();
    while (this.seenUUIDs.has(uuid)) {
      console.debug('UUID collision detected, generating new one');
      uuid = uuidv4();
    }
    this.seenUUIDs.add(uuid);
    return uuid;
  }

  // Get random episode
  public getRandomEpisode(episodes: EpisodeData[], excludeCurrent?: EpisodeData): EpisodeData {
    let randomIndex: number;
    let selectedEpisode: EpisodeData;

    do {
      randomIndex = Math.floor(Math.random() * episodes.length);
      // Create a new episode object with a unique UUID
      selectedEpisode = {
        ...episodes[randomIndex],
        uuid: this.generateUniqueUUID(),
        rollTimestamp: Date.now()
      };
      console.debug('Generated random episode with UUID:', selectedEpisode.uuid);
    } while (episodes.length > 1 && selectedEpisode.nr === excludeCurrent?.nr);

    return selectedEpisode;
  }

  // Get episode history for route
  public async getHistory(route: string): Promise<EpisodeData[]> {
    const history = await this.dbService.getHistory(route);
    const processedHistory = history.map(entry => {
      const historyEntry = entry.data as EpisodeHistoryEntry;

      // Ensure episode has a unique UUID
      if (!historyEntry.episode.uuid || this.seenUUIDs.has(historyEntry.episode.uuid)) {
        historyEntry.episode.uuid = this.generateUniqueUUID();
      } else {
        this.seenUUIDs.add(historyEntry.episode.uuid);
      }

      console.debug('Processing history entry:', {
        entryUUID: historyEntry.uuid,
        episodeUUID: historyEntry.episode.uuid,
        episodeNr: historyEntry.episode.nr
      });

      return historyEntry.episode;
    });

    // Debug log all UUIDs in history
    console.debug('All UUIDs in history:', processedHistory.map(ep => ({
      uuid: ep.uuid,
      nr: ep.nr,
      timestamp: ep.rollTimestamp
    })));

    return processedHistory;
  }

  // Add episode to history
  public async addToHistory(episode: EpisodeData, route: string): Promise<void> {
    // Check if episode already exists in history
    const history = await this.getHistory(route);
    const isDuplicate = history.some(existingEp =>
      existingEp.uuid === episode.uuid ||
      (existingEp.nr === episode.nr && existingEp.rollTimestamp === episode.rollTimestamp)
    );

    if (isDuplicate) {
      console.debug('Skipping duplicate episode:', {
        uuid: episode.uuid,
        nr: episode.nr,
        timestamp: episode.rollTimestamp
      });
      return;
    }

    // Ensure episode has a unique UUID
    if (!episode.uuid || this.seenUUIDs.has(episode.uuid)) {
      episode.uuid = this.generateUniqueUUID();
    } else {
      this.seenUUIDs.add(episode.uuid);
    }

    // Create a history entry with its own UUID
    const historyEntry: EpisodeHistoryEntry = {
      uuid: this.generateUniqueUUID(),
      episode: { ...episode },
      timestamp: Date.now(),
      route
    };

    console.debug('Adding history entry:', {
      entryUUID: historyEntry.uuid,
      episodeUUID: historyEntry.episode.uuid,
      episodeNr: historyEntry.episode.nr,
      timestamp: historyEntry.episode.rollTimestamp
    });

    await this.dbService.addToHistory(route, historyEntry);
  }

  // Clear episode history for route
  public async clearHistory(route: string): Promise<void> {
    await this.dbService.clearHistory(route);
    // Clear the seen UUIDs set when history is cleared
    this.seenUUIDs.clear();
  }

  // Filter episodes by search terms
  public filterEpisodes(episodes: EpisodeData[], searchTerms: string[]): EpisodeWithMetadata[] {
    if (!searchTerms.length) return episodes;

    return episodes.map(episode => {
      const matchScore = this.calculateMatchScore(episode, searchTerms);
      return {
        ...episode,
        isHighlighted: matchScore > 0,
        matchScore
      };
    }).filter(episode => episode.isHighlighted);
  }

  // Calculate match score for search
  private calculateMatchScore(episode: EpisodeData, searchTerms: string[]): number {
    let score = 0;
    const fields = [
      episode.tytul.toLowerCase(),
      episode.opis_odcinka.toLowerCase(),
      episode.rezyseria.toLowerCase(),
      episode.scenariusz.toLowerCase()
    ];

    searchTerms.forEach(term => {
      const termLower = term.toLowerCase();
      fields.forEach(field => {
        if (field.includes(termLower)) score++;
      });
    });

    return score;
  }
} 