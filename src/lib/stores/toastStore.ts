import { writable } from 'svelte/store';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  showOSNotification?: boolean;
}

async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

function sendOSNotification(message: string, type: ToastType) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const typeEmoji = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

  const options = {
    body: message,
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: 'kiepskie-tv-notification',
    requireInteraction: false,
    silent: false
  };

  new Notification(`${typeEmoji[type]} Kiepskie TV`, options);
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  async function addToast(
    message: string,
    type: ToastType = 'info',
    duration: number = 3000,
    showOSNotification: boolean = false
  ) {
    const id = Math.random().toString(36).substring(2);

    if (showOSNotification) {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        sendOSNotification(message, type);
      }
    }

    update(toasts => [...toasts, {
      id,
      message,
      type,
      duration,
      showOSNotification
    }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  function removeToast(id: string) {
    update(toasts => toasts.filter(t => t.id !== id));
  }

  return {
    subscribe,
    add: addToast,
    remove: removeToast,
  };
}

export const toasts = createToastStore(); 