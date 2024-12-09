import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type ViewMode = 'table' | 'card';

// Get initial value from localStorage if available, otherwise use null (for responsive default)
const storedPreference = browser ? localStorage.getItem('viewPreference') as ViewMode | null : null;

const viewPreference = writable<ViewMode | null>(storedPreference);

// Save preference to localStorage when it changes
if (browser) {
  viewPreference.subscribe((value) => {
    if (value) {
      localStorage.setItem('viewPreference', value);
    } else {
      localStorage.removeItem('viewPreference');
    }
  });
}

export { viewPreference };
export type { ViewMode }; 