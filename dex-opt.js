function isFirstPartyDomain(url) {
  var parsedURL =  new URL(url);
  var firstPartyDomain = dexecure.firstPartyDomain;
  for (var i = firstPartyDomain.length - 1; i >= 0; i--) {
    if (firstPartyDomain[i].toLowerCase() == parsedURL.host.toLowerCase()) {
      return true;
    }
  }
  return false;
}

if (dexecure.optimisationsEnabled) {
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
    
    var headersToSend = new Headers(headersToSendJS);
    var imageMatchRegex = new RegExp(dexecure.imageMatchRegex, "i");
    if (imageMatchRegex.test(event.request.url.toLowerCase()) && isFirstPartyDomain(event.request.url)) {
     var dexecureURL = dexecure.server + event.request.url.replace(/^https?\:\/\//i, "");
     dexecureURL = decodeURIComponent(dexecureURL);
     event.respondWith(fetch(dexecureURL, {mode: 'cors', headers: headersToSend})
      .then(response => {
        if (response.ok) {
          return response;
        } else {
          if (dexecure.debugMode)
            console.log('Responding with original image as optimiser was not reachable ', event.request.url);
          throw new Error('Unable to fetch optimised image');
        }
      })
      .catch(err => {
        if (dexecure.debugMode) {
          console.log('Sending original image as an error occured when trying to optimise ', event.request.url);
          console.log('The error was ', err);
        }
        return fetch(event.request);
      }));
   }
  })
}