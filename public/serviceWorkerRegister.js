if ('serviceWorker' in navigator) {
  window.addEventListener('DOMContentLoaded', function () {
    const enableServiceWorkerCache = function () {
      window._SW_ENABLED = !!navigator.serviceWorker.controller;
      return window._SW_ENABLED;
    };
    window._SW_ENABLED = false;
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      console.log('ServiceWorker controllerchange ');
      enableServiceWorkerCache();
    });
    navigator.serviceWorker.register('/serviceWorker.js').then(function (registration) {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
      enableServiceWorkerCache();
      navigator.serviceWorker.ready.then(function () {
        enableServiceWorkerCache();
      });
      registration.update().then(res => {
        console.log('ServiceWorker registration update: ', res);
      });
    }, function (err) {
      console.error('ServiceWorker registration failed: ', err);
    });
  });
}
