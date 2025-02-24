import { toast } from '@zerodevx/svelte-toast';

// Export default options for the toast container
export const toastOptions = {
  duration: 3000,
  // initial: 1,
  position: 'bottom-center',
  // progress: 0.3, // Progress bar speed (in seconds)
  pausable: false,
  reversed: false,
};

// Default themes for different toast types
const themes = {
  success: {
    '--toastBackground': '#48BB78',
    '--toastColor': 'white',
    '--toastBarBackground': '#2F855A'
  },
  error: {
    '--toastBackground': '#F56565',
    '--toastColor': 'white',
    '--toastBarBackground': '#C53030'
  },
  info: {
    '--toastBackground': '#4299E1',
    '--toastColor': 'white',
    '--toastBarBackground': '#2B6CB0'
  },
  warning: {
    '--toastBackground': '#ECC94B',
    '--toastColor': 'black',
    '--toastBarBackground': '#B7791F'
  }
} as const;

// Create a single Toast object with methods for different types
export const Toast = {
  success: (message: string, options = {}) => {
    return toast.push(message, { theme: themes.success, ...options });
  },
  error: (message: string, options = {}) => {
    return toast.push(message, { theme: themes.error, ...options });
  },
  info: (message: string, options = {}) => {
    return toast.push(message, { theme: themes.info, ...options });
  },
  warning: (message: string, options = {}) => {
    return toast.push(message, { theme: themes.warning, ...options });
  },
  // Allow custom toast with default options
  custom: (message: string, options = {}) => {
    return toast.push(message, options);
  }
}; 