importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCZK7j4T33351EBzpmXUZeod358AU27eng",
  authDomain: "mis-tareas-app-806a4.firebaseapp.com",
  projectId: "mis-tareas-app-806a4",
  storageBucket: "mis-tareas-app-806a4.firebasestorage.app",
  messagingSenderId: "939081546373",
  appId: "1:939081546373:web:2693b599ba52f170e747ec"
});

const messaging = firebase.messaging();

// Handle background push messages
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {};
  if (title) {
    self.registration.showNotification(title, {
      body: body || '',
      icon: './icon.svg',
      badge: './icon.svg',
      tag: payload.collapseKey || 'fcm',
      renotify: true,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: '📋 Ver tarea' },
        { action: 'dismiss', title: 'Cerrar' }
      ]
    });
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('index.html') || c.url.endsWith('/')) return c.focus();
      }
      return clients.openWindow('./index.html');
    })
  );
});
