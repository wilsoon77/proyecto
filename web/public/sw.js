self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    clients.claim().then(() => {
      console.log('[SW] Service Worker activo y controlando clientes.');
    })
  );
});

self.addEventListener('push', function (event) {
  console.log('[SW] Evento push recibido');
  if (!event.data) {
    console.warn('[SW] Evento push recibido pero sin datos (payload vacío).');
    return;
  }

  try {
    const data = event.data.json();
    const origin = self.location.origin;
    
    // Icono principal y badge con URL absoluta para evitar fallback de Android
    const iconUrl = data.icon || `${origin}/images/icon-panaderia.svg`;
    const badgeUrl = `${origin}/images/icons/notification-badge-72.png`;

    const options = {
      body: data.message || 'Nueva notificación de Panadería Svetlana',
      icon: iconUrl,
      badge: badgeUrl,
      image: data.image || undefined,
      data: { url: data.url || '/admin' },
      vibrate: [200, 100, 200],
      tag: data.tag || data.type || 'panaderia-alerta',
      renotify: true,
      requireInteraction: false,
      actions: [
        { action: 'open', title: 'Ver' },
        { action: 'dismiss', title: 'Cerrar' }
      ]
    };

    console.log('[SW] Mostrando notificación nativa:', data.title);
    event.waitUntil(
      self.registration.showNotification(data.title || 'Panadería Svetlana', options)
    );
  } catch (error) {
    console.error('[SW] ❌ Error procesando evento push:', error);
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = new URL(event.notification.data?.url || '/admin', self.location.origin).href;

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
