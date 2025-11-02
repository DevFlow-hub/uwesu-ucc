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
  console.log('=== PUSH EVENT RECEIVED ===');
  console.log('Event:', event);
  console.log('Event.data exists:', !!event.data);
  
  if (event.data) {
    console.log('Event.data type:', typeof event.data);
    const text = event.data.text();
    console.log('Raw data as text:', text);
  }
  
  let notificationData = {
    title: 'Union Event',
    body: 'You have a new notification',
    url: '/events'
  };
  
  // Try to parse the data from FCM
  if (event.data) {
    try {
      const text = event.data.text();
      console.log('Raw push data text:', text);
      
      if (text) {
        const parsed = JSON.parse(text);
        console.log('Successfully parsed notification data:', parsed);
        
        // FCM wraps the data in a 'data' object
        const messageData = parsed.data || parsed;
        
        notificationData = {
          title: messageData.title || notificationData.title,
          body: messageData.body || notificationData.body,
          url: messageData.url || notificationData.url
        };
      } else {
        console.warn('Push data text is empty');
      }
    } catch (error) {
      console.error('Error parsing push data:', error);
      console.error('Error stack:', error.stack);
    }
  } else {
    console.warn('No event.data in push event');
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

  console.log('=== SHOWING NOTIFICATION ===');
  console.log('Title:', notificationData.title);
  console.log('Body:', notificationData.body);
  console.log('Options:', options);

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
