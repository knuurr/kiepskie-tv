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
  const COOLDOWN_MS = isDev ? 1000 * 10 : 1000 * 60 * 30; // 10 seconds in dev, 30 minutes in prod
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
      const cooldownPassed = !currentState.lastShown ||
        (Date.now() - currentState.lastShown) > currentState.cooldownMs;

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