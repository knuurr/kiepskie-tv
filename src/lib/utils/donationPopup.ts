import { donationPopupStore } from '$lib/stores/donationPopup';
import { Toast } from '$lib/toast';

const isDev = import.meta.env.DEV;

/**
 * Utility function to potentially show the donation popup
 * @param callback Optional callback to be executed when popup is shown
 * @returns Promise<boolean> indicating if popup was shown
 */
export async function tryShowDonationPopup(callback?: () => void): Promise<boolean> {
  try {
    if (isDev) console.debug('[DonationPopup] Checking if should show popup');

    if (!donationPopupStore.shouldShow()) {
      if (isDev) console.debug('[DonationPopup] Conditions not met, skipping popup');
      return false;
    }

    if (isDev) console.debug('[DonationPopup] Showing popup');

    // Execute callback if provided
    if (callback) {
      callback();
    }

    return true;
  } catch (error) {
    console.error('[DonationPopup] Error showing popup:', error);
    Toast.error('Something went wrong with donation popup');
    return false;
  }
} 