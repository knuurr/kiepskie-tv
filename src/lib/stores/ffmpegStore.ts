import { writable } from 'svelte/store';

// Define FFmpeg loading states
export type FFmpegLoadingState = 'not_loaded' | 'loading' | 'loaded' | 'error';

// Define store interface
interface FFmpegStore {
  state: FFmpegLoadingState;
  error?: string;
  connectionType?: string;
}

// Create the store with initial state
const createFFmpegStore = () => {
  const { subscribe, set, update } = writable<FFmpegStore>({
    state: 'not_loaded'
  });

  return {
    subscribe,
    setState: (state: FFmpegLoadingState, error?: string) =>
      update(store => ({ ...store, state, error })),
    setConnectionType: (type: string) =>
      update(store => ({ ...store, connectionType: type })),
    reset: () => set({ state: 'not_loaded' })
  };
};

export const ffmpegStore = createFFmpegStore(); 