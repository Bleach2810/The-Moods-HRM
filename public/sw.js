// SW Version - change this to force update
const SW_VERSION = '2.0.1';
console.log('[SW] Service Worker version:', SW_VERSION);

self.addEventListener('install', function (event) {
    console.log('[SW] Installing new version:', SW_VERSION);
    self.skipWaiting(); // Force activate immediately
});

self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();
            const options = {
                body: data.body,
                icon: data.icon || '/logo.png',
                badge: '/logo.png',
                vibrate: [200, 100, 200, 100, 200],
                sound: '/notification.wav',
                tag: 'moods-notification-' + Date.now(),
                renotify: true,
                requireInteraction: true,
                data: {
                    url: data.url || '/'
                },
                actions: [
                    { action: 'open', title: 'Xem ngay' },
                    { action: 'close', title: 'Đóng' }
                ]
            };
            event.waitUntil(
                self.registration.showNotification(data.title || 'The Moods', options).then(() => {
                    // Play sound by posting message to all clients
                    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'PUSH_NOTIFICATION_RECEIVED',
                                title: data.title,
                                body: data.body
                            });
                        });
                    });
                })
            );
        } catch (e) {
            console.error('Error parsing push data:', e);
            const text = event.data.text();
            event.waitUntil(
                self.registration.showNotification("The Moods", {
                    body: text,
                    icon: '/logo.png',
                    badge: '/logo.png',
                    vibrate: [200, 100, 200, 100, 200],
                    tag: 'moods-notification-' + Date.now(),
                    renotify: true,
                    requireInteraction: true
                })
            );
        }
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const action = event.action;
    if (action === 'close') return;

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Try to focus an existing window
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if ('focus' in client) {
                    client.focus();
                    client.navigate(urlToOpen);
                    return;
                }
            }
            // Open new window if none found
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Activate immediately
self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});
