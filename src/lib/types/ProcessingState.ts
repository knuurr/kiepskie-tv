export type TransformState =
  | "PREPARING"      // Initial setup, loading files
  | "PROCESSING"     // Main video processing with effects
  | "APPENDING"      // Adding Boczek/intro if enabled
  | "FINALIZING";    // Cleanup and output generation

export interface ProcessingSubState {
  message: string;
  threshold: number;  // Progress percentage when this message should appear
}

export const PROCESSING_SUBSTATES: Record<TransformState, ProcessingSubState[]> = {
  PREPARING: [
    { threshold: 0, message: "Rozgrzewam kineskop..." },
    { threshold: 30, message: "Odkurzam taśmę..." },
    { threshold: 70, message: "Reguluję antenę..." },
  ],
  PROCESSING: [
    { threshold: 0, message: "Włączam telewizor..." },
    { threshold: 15, message: "Walę w kineskop..." },
    { threshold: 30, message: "Reguluję kontrast..." },
    { threshold: 45, message: "Poprawiam tracking..." },
    { threshold: 60, message: "Kręcę śrubokrętem..." },
    { threshold: 75, message: "Dodaję efekt Kiepskiego..." },
    { threshold: 90, message: "Dolewam browara..." },
  ],
  APPENDING: [
    { threshold: 0, message: "Budzę Boczka..." },
    { threshold: 33, message: "Boczek się ubiera..." },
    { threshold: 66, message: "Boczek idzie do sklepu..." },
  ],
  FINALIZING: [
    { threshold: 0, message: "Składam wszystko do kupy..." },
    { threshold: 50, message: "Jeszcze tylko chwila..." },
    { threshold: 80, message: "Co jest kurde..." },
  ]
};

// Helper function to get current substate message based on progress
export function getCurrentSubstate(state: TransformState, progress: number): string {
  const substates = PROCESSING_SUBSTATES[state];
  if (!substates || !substates.length) {
    return "Przetwarzanie...";
  }

  // Find last substate where threshold is less than or equal to current progress
  const currentSubstate = [...substates]
    .reverse()
    .find(substate => progress >= substate.threshold);

  return currentSubstate?.message ?? substates[0].message;
} 