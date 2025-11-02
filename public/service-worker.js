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
  console.log('Push event data:', event.data);
  
  let notificationData = {
    title: 'Union Event',
    body: 'You have a new notification',
    url: '/events'
  };
  
  try {
    if (event.data) {
      const parsed = event.data.json();
      console.log('Parsed push data:', parsed);
      notificationData = {
        title: parsed.title || notificationData.title,
        body: parsed.body || notificationData.body,
        url: parsed.url || notificationData.url
      };
    }
  } catch (error) {
    console.error('Error parsing push data:', error);
    // Try as text
    try {
      if (event.data) {
        const text = event.data.text();
        console.log('Push data as text:', text);
        const parsed = JSON.parse(text);
        notificationData = {
          title: parsed.title || notificationData.title,
          body: parsed.body || notificationData.body,
          url: parsed.url || notificationData.url
        };
      }
    } catch (e) {
      console.error('Error parsing push data as text:', e);
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

  console.log('Showing notification with title:', notificationData.title, 'and body:', options.body);

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
