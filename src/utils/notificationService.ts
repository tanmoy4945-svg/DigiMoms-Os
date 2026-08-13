// Browser Notification & Service Worker Manager for DigiMoms OS

let swRegistration: ServiceWorkerRegistration | null = null;
const shownEventIds = new Set<string>();

/**
 * Registers the Service Worker for background notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[NotificationService] Service Workers not supported on this browser/OS.');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    console.log('[NotificationService] Service Worker registered successfully scope:', reg.scope);
    return reg;
  } catch (err) {
    console.warn('[NotificationService] Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Checks if browser supports native Notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns current permission status ('granted' | 'denied' | 'default' | 'unsupported')
 */
export function getNotificationPermissionState(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests Browser Notification Permission from User
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[NotificationService] Error requesting notification permission:', err);
    return false;
  }
}

interface TriggerNotificationOptions {
  eventId: string; // Unique deduplication ID
  title: string;
  body: string;
  icon?: string;
  url?: string;
  restaurantId?: string;
  silent?: boolean;
}

/**
 * Triggers a System/Browser Desktop/Mobile Notification if permitted
 */
export function triggerSystemNotification(opts: TriggerNotificationOptions): boolean {
  if (!opts.eventId) return false;

  // Deduplicate
  if (shownEventIds.has(opts.eventId)) {
    console.log(`[NotificationService] Event ${opts.eventId} already notified, skipping duplicate.`);
    return false;
  }
  shownEventIds.add(opts.eventId);

  // Keep set size manageable
  if (shownEventIds.size > 200) {
    const arr = Array.from(shownEventIds);
    arr.slice(0, 50).forEach(id => shownEventIds.delete(id));
  }

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const title = opts.title || 'DigiMoms OS Alert';
    const notificationOpts = {
      body: opts.body,
      icon: opts.icon || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100',
      tag: opts.eventId,
      data: { url: opts.url || '/owner-dashboard', restaurantId: opts.restaurantId }
    };

    if (swRegistration && swRegistration.showNotification) {
      swRegistration.showNotification(title, notificationOpts);
    } else {
      const n = new Notification(title, notificationOpts);
      n.onclick = () => {
        window.focus();
        if (opts.url) window.location.href = opts.url;
        n.close();
      };
    }
    return true;
  } catch (err) {
    console.warn('[NotificationService] Failed to display native notification:', err);
    return false;
  }
}
