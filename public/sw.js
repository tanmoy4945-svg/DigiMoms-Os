// DigiMoms OS Service Worker for Push & Background Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Push Events
self.addEventListener('push', (event) => {
  let data = {
    title: 'DigiMoms Restaurant Notification',
    body: 'New update from your restaurant dashboard.',
    icon: '/icon-192.png',
    url: '/owner-dashboard'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.icon || '/icon-192.png',
    vibrate: [300, 150, 300],
    data: {
      url: data.url || '/owner-dashboard',
      orderId: data.orderId,
      restaurantId: data.restaurantId
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle Direct PostMessage Notifications from Web/App Client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const notifOptions = {
      body: options?.body || '',
      icon: options?.icon || '/icon-192.png',
      badge: options?.badge || '/icon-192.png',
      vibrate: options?.vibrate || [300, 150, 300],
      tag: options?.tag || `notif_${Date.now()}`,
      renotify: true,
      data: options?.data || { url: '/owner-dashboard' }
    };
    self.registration.showNotification(title || 'DigiMoms Alert', notifOptions).catch((err) => {
      console.warn('[SW] showNotification message error:', err);
    });
  }
});

// Handle Notification Clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || '/owner-dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
