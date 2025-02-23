import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type ViewMode = 'table' | 'card' | 'chart' | 'timeline';

// Get initial value from localStorage if available, otherwise use null (for responsive default)
const storedValue = browser ? localStorage.getItem('viewPreference') : null;
const initialValue = storedValue ? storedValue as ViewMode : null;

const viewPreference = writable<ViewMode | null>(initialValue);

// Subscribe to changes and update localStorage
if (browser) {
  viewPreference.subscribe(value => {
    if (value === null) {
      localStorage.removeItem('viewPreference');
    } else {
      localStorage.setItem('viewPreference', value);
    }
  });
}

export { viewPreference }; 