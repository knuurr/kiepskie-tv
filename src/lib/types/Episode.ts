// Base episode data interface
export interface EpisodeData {
  uuid: string; // Unique identifier for each episode
  nr: number;
  tytul: string;
  opis_odcinka: string;
  data_premiery: string;
  rezyseria: string;
  scenariusz: string;
  sezon: number;
  link_wiki: string;
  data_components: {
    year: number;
    month: number;
    day: number;
  };
  rollTimestamp?: number; // Optional timestamp for when the episode was rolled
}

// Episode with additional metadata for UI/display purposes
export interface EpisodeWithMetadata extends EpisodeData {
  isHighlighted?: boolean;
  matchScore?: number; // For search results
}

// Episode history entry
export interface EpisodeHistoryEntry {
  uuid: string;
  episode: EpisodeData;
  timestamp: number;
  route: string;
}

// Episode table metadata
export interface EpisodeTableMetadata {
  totalCount: number;
  lastUpdated: string;
  source: string;
}

// Complete episode dataset
export interface EpisodeDataset {
  metadata: EpisodeTableMetadata;
  data: EpisodeData[];
} 