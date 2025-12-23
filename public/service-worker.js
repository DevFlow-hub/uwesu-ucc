// Service Worker for Push Notifications
// Version 2.0 - No caching to prevent double loading screen

const CACHE_VERSION = 'v2';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing... Version 2.0');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated - Version 2.0');
  
  event.waitUntil(
    // Clear all old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return clients.claim();
    })
  );
});

// Don't cache anything - always fetch from network
self.addEventListener('fetch', (event) => {
  // Let all requests go directly to network
  // This prevents old cached versions from showing
  event.respondWith(
    fetch(event.request).catch(() => {
      // Only if network fails, try cache as fallback
      return caches.match(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  console.log('=== PUSH EVENT RECEIVED ===');
  
  let notificationData = {
    title: 'Union Event',
    body: 'You have a new notification',
    url: '/events'
  };
  
  // Parse FCM notification data
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Received push data:', data);
      
      // FCM sends: { notification: { title, body }, data: { url } }
      if (data.notification) {
        notificationData.title = data.notification.title;
        notificationData.body = data.notification.body;
      }
      if (data.data && data.data.url) {
        notificationData.url = data.data.url;
      }
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

  console.log('Showing notification:', notificationData.title, notificationData.body);

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/events';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
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