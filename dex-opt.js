function isFirstPartyDomain(url) {
  var parsedURL =  new URL(url);
  for (var i = firstPartyDomain.length - 1; i >= 0; i--) {
    if (firstPartyDomain[i].toLowerCase() == parsedURL.host.toLowerCase()) {
      return true;
    }
  }
  return false;
}

if (optimisationsEnabled) {
  self.addEventListener('install', function(event) {
    event.waitUntil(self.skipWaiting());
  });
  self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
  });

  self.addEventListener('fetch', function(event) {
    var headersToSendJS = {};
    if (event.request.headers.has('Accept')) {
      headersToSendJS['Accept'] = event.request.headers.get('Accept');
    }
    if (event.request.headers.has('Viewport-Width')) {
      headersToSendJS['Dex-Viewport-Width'] = parseInt(event.request.headers.get('Viewport-Width'), 10) > 1300 ? 'l':'s';
    }
    if (event.request.headers.has('ETag')) {
      headersToSendJS['ETag'] = event.request.headers.get('ETag');
    }
    var headersToSend = new Headers(headersToSendJS);
    if (imageMatchRegex.test(event.request.url.toLowerCase()) && isFirstPartyDomain(event.request.url)) {
     var dexecureURL = DEXECURE_SERVER + event.request.url.replace(/^https?\:\/\//i, "");
     dexecureURL = decodeURIComponent(dexecureURL);
     event.respondWith(fetch(dexecureURL, {mode: 'cors', headers: headersToSend})
      .then(response => {
        if (response.ok) {
          return response;
        } else {
          return fetch(event.request);
        }
      })
      .catch(err => {
        return fetch(event.request);
      }));
   }
  })
}