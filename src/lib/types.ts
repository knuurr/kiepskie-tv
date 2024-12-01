export interface TableMetadata {
  generated_at: string;
  header_metadata: {
    nr: string;
    tytul: string;
    opis_odcinka: string;
    data_premiery: string;
    rezyseria: string;
    scenariusz: string;
    sezon: string;
  };
}

export interface EpisodeData {
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
}

export interface TableData {
  metadata: TableMetadata;
  data: EpisodeData[];
}

export type FilterType =
  | 'year'
  | 'month'
  | 'day'
  | 'director'
  | 'writer'
  | 'title'
  | 'description'
  | 'season';

export interface Filter {
  type: string;
  value: string;
  isNegated: boolean;
} 