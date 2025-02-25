export interface Toast {
  text: string;
  episodeNumber: string | null; // Using string to handle "???" case
  episodeTimestamp: string | null; // Format: "MM:SS"
  audioFile: string | null; // Path to audio file
  rollTimestamp?: number; // Unix timestamp of when the toast was rolled
}