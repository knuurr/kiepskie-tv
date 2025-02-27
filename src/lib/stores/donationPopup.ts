import { writable, get } from 'svelte/store';
import { FEATURES } from '$lib/constants';

// Debug flag for development
const isDev = import.meta.env.DEV;

interface DonationPopupState {
  lastShown: number | null;
  cooldownMs: number;
}

// Create a writable store with initial state
const createDonationPopupStore = () => {
  const COOLDOWN_MS = isDev ? 1000 * 60 * 5 : 1000 * 60 * 10; // 5 minutes in dev, 10 minutes in prod
  const SHOW_CHANCE = isDev ? 0.5 : 0.01; // 50% chance in dev, 1% in prod

  const { subscribe, set, update } = writable<DonationPopupState>({
    lastShown: null,
    cooldownMs: COOLDOWN_MS
  });

  return {
    subscribe,
    reset: () => {
      if (isDev) console.debug('[DonationPopup] Resetting state');
      set({ lastShown: null, cooldownMs: COOLDOWN_MS });
    },
    markShown: () => {
      if (isDev) console.debug('[DonationPopup] Marking as shown');
      update(state => ({ ...state, lastShown: Date.now() }));
    },
    shouldShow: (): boolean => {
      // Check if feature is enabled
      if (!FEATURES.ENABLE_DONATION_POPUP) {
        if (isDev) console.debug('[DonationPopup] Feature disabled');
        return false;
      }

      // If debug force is enabled, always show
      if (FEATURES.DEBUG_FORCE_DONATION) {
        if (isDev) console.debug('[DonationPopup] Debug force enabled, showing popup');
        return true;
      }

      const currentState = get(donationPopupStore);

      // If never shown or cooldown passed
      const timeSinceLastShown = currentState.lastShown ? Date.now() - currentState.lastShown : null;
      const cooldownPassed = !currentState.lastShown ||
        (timeSinceLastShown && timeSinceLastShown > currentState.cooldownMs);

      if (isDev) {
        console.debug('[DonationPopup] Cooldown check:', {
          lastShown: currentState.lastShown ? new Date(currentState.lastShown).toISOString() : null,
          timeSinceLastShown: timeSinceLastShown ? Math.floor(timeSinceLastShown / 1000) + 's' : null,
          cooldownMs: currentState.cooldownMs,
          cooldownPassed
        });
      }

      if (!cooldownPassed) {
        if (isDev) console.debug('[DonationPopup] Cooldown not passed');
        return false;
      }

      // Random chance check
      const shouldShow = Math.random() < SHOW_CHANCE;
      if (isDev) console.debug(`[DonationPopup] Random check: ${shouldShow}`);
      return shouldShow;
    }
  };
};

export const donationPopupStore = createDonationPopupStore(); 