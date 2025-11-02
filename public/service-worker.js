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
  
  let notificationData = {};
  
  try {
    if (event.data) {
      notificationData = event.data.json();
      console.log('Parsed push data:', notificationData);
    }
  } catch (error) {
    console.error('Error parsing push data:', error);
  }
  
  const title = notificationData.title || 'Union Event';
  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: notificationData.url || '/events',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    tag: 'union-event-' + Date.now(),
    renotify: true
  };

  console.log('Showing notification with title:', title, 'and body:', options.body);

  event.waitUntil(
    self.registration.showNotification(title, options)
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
