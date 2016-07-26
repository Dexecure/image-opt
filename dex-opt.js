function urlContainsSignature(input) {
  var potentialSignature = input.substring(input.lastIndexOf('/') + 1);
  potentialSignature = potentialSignature.toLowerCase();
  return potentialSignature.includes('se') && potentialSignature.includes('st') && potentialSignature.includes('sp') && potentialSignature.includes('sv') && potentialSignature.includes('sr') && potentialSignature.includes('sig');
}

function separateSignatureAndURL(input) {
  var potentialSignature = input.substring(input.lastIndexOf('/') + 1);
  var potentialURL = input.substring(0, input.lastIndexOf('/'));
  return {potentialURL, potentialSignature};
}

function convertToDexecureURL(url) {
  var listOfJoyDomains = {'dev-media.withjoy.com':'dev-media-joy.dexecure.net',
                          'rehearsal-media.withjoy.com': 'rehearsal-joy.dexecure.net',
                          'dev.withjoy.com': 'dev-joy.dexecure.net',
                          'rehearsal.withjoy.com': 'rehearsal-joy.dexecure.net',
                          'ceremony-media.withjoy.com': 'ceremony-media-joy.dexecure.net',
                          'withjoy.com': 'joy.dexecure.net'
                          };
  var parsedURL = new URL(url);
  for (i in listOfJoyDomains) {
    if (i.toLowerCase() == parsedURL.host.toLowerCase()) {
      return url.replace(i, listOfJoyDomains[i]);
    }
  }
  return url;
}

function isDefiniteImageURL(url) {
  var parsedURL =  new URL(url);
  console.log('parsedURL.host.toLowerCase() is ', parsedURL.host.toLowerCase());
  for (var i = dexecure.confirmedImageDomains.length - 1; i >= 0; i--) {
    console.log('checking with ', dexecure.confirmedImageDomains[i].toLowerCase());
    if (dexecure.confirmedImageDomains[i].toLowerCase() == parsedURL.host.toLowerCase()) {
      return true;
    }
  }
}

function isFirstPartyDomain(url) {
  var parsedURL =  new URL(url);
  var firstPartyDomain = dexecure.firstPartyDomain;
  if (!firstPartyDomain) {
    if (dexecure.debugMode) 
      console.log('firstPartyDomain is null');
    return false;
  }
  for (var i = firstPartyDomain.length - 1; i >= 0; i--) {
    if (firstPartyDomain[i].toLowerCase() == parsedURL.host.toLowerCase()) {
      return true;
    }
  }
  if (dexecure.debugMode)
    console.log('firstPartyDomain is false for ', url);
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

    if (isDefiniteImageURL(event.request.url.toLowerCase()) || imageMatchRegex.test(event.request.url.toLowerCase()) && isFirstPartyDomain(event.request.url)) {
     var dexecureURL = convertToDexecureURL(event.request.url);
     var signatureSeparator = '';
     var signatureComponent = '';
     if (urlContainsSignature(dexecureURL)) {
      if (dexecure.debugMode)
        console.log('url contains signature');
      var separatedComponents = separateSignatureAndURL(dexecureURL);
      if (dexecure.debugMode) 
        console.log('separatedComponents is ', separatedComponents);
      dexecureURL = separatedComponents['potentialURL'];
      signatureComponent = separatedComponents['potentialSignature'];
      dexecureURL = decodeURIComponent(dexecureURL);
     }
     console.log('dexecureURL is ', dexecureURL);
     console.log('signatureComponent is ', signatureComponent);
     if (dexecure.debugMode)
      console.log('Modified url is ', dexecureURL);
     let muraliHeaders = new Headers();
     if (signatureComponent && signatureComponent.length > 0) {
      headersToSend.append('signaturepresent', 'true');
      headersToSend.append('signatureseparator', '/');
      headersToSend.append('signature', signatureComponent);
     }
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