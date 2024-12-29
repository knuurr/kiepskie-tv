export interface Toast {
  text: string;
  episodeNumber: string | null; // Using string to handle "???" case
  episodeTimestamp: string | null; // Format: "MM:SS"
  audioFile: string | null; // Path to audio file
}