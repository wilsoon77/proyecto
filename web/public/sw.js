self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
  if (!event.data) {
    console.log('Push event received but no data provided.');
    return;
  }

  try {
    const data = event.data.json();
    
    // Notification options without emojis
    const options = {
      body: data.message || 'Nueva notificación de Panadería Svetlana',
      icon: '/images/icons/notification-icon-192.png',
      badge: '/images/icons/notification-badge-72.png',
      data: { url: data.url || '/admin/dashboard' },
      vibrate: [100, 50, 100],
      tag: data.type || 'default',
      renotify: true,
      actions: [
        { action: 'open', title: 'Ver detalle' },
        { action: 'dismiss', title: 'Descartar' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Alerta del Sistema', options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = new URL(event.notification.data?.url || '/admin/dashboard', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Check if there is already a window open with this URL and focus it
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
