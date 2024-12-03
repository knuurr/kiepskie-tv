import { writable } from 'svelte/store';
import type { VideoSettings } from '../types/VideoSettings';
import { DEFAULT_SETTINGS } from '../constants';

function createVideoSettingsStore() {
  const { subscribe, set, update } = writable<VideoSettings[]>([]);

  return {
    subscribe,
    addFile: (fileName: string) => {
      const newSetting: VideoSettings = {
        id: crypto.randomUUID(),
        fileName,
        settings: { ...DEFAULT_SETTINGS }
      };

      update(settings => [...settings, newSetting]);
      return newSetting.id;
    },
    updateSettings: (id: string, newSettings: Partial<VideoSettings['settings']>) => {
      update(settings => settings.map(setting =>
        setting.id === id
          ? { ...setting, settings: { ...setting.settings, ...newSettings } }
          : setting
      ));
    },
    removeFile: (id: string) => {
      update(settings => settings.filter(setting => setting.id !== id));
    },
    reset: () => set([]),
    resetToDefault: (id: string) => {
      update(settings => settings.map(setting =>
        setting.id === id
          ? { ...setting, settings: { ...DEFAULT_SETTINGS } }
          : setting
      ));
    }
  };
}

export const videoSettings = createVideoSettingsStore(); 