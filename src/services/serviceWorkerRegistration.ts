/**
 * Service Worker Registration for OpenX Studio PWA
 */

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const swUrl = `${cleanBase}sw.js`;

    navigator.serviceWorker
      .register(swUrl, { scope: cleanBase })
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.info('[PWA] New content is available; please refresh.');
              }
            };
          }
        };
      })
      .catch((error) => {
        console.warn('[PWA] ServiceWorker registration failed:', error);
      });
  });
}

export function unregisterServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.ready
    .then((registration) => {
      registration.unregister();
    })
    .catch((error) => {
      console.warn('[PWA] ServiceWorker unregister failed:', error);
    });
}
