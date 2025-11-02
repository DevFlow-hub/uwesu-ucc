// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'Union Event',
    body: 'You have a new notification',
    url: '/events'
  };
  
  // Try to parse the data
  if (event.data) {
    try {
      const text = event.data.text();
      console.log('Push data received:', text);
      const parsed = JSON.parse(text);
      console.log('Parsed notification data:', parsed);
      
      notificationData = {
        title: parsed.title || notificationData.title,
        body: parsed.body || notificationData.body,
        url: parsed.url || notificationData.url
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }
  
  const options = {
    body: notificationData.body,
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: { url: notificationData.url },
    requireInteraction: true,
    vibrate: [200, 100, 200],
    tag: 'union-event-' + Date.now(),
    renotify: true
  };

  console.log('Showing notification - Title:', notificationData.title, '| Body:', notificationData.body);

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data || '/events';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
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
  }
});
