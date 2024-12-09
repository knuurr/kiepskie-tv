import { browser } from '$app/environment';
import { writable, derived } from 'svelte/store';

const windowWidth = writable(browser ? window.innerWidth : 1024);

if (browser) {
  window.addEventListener('resize', () => {
    windowWidth.set(window.innerWidth);
  });
}

export const isMobile = derived(windowWidth, $width => $width < 768); 