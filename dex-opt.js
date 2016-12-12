var db;

function isFirstPartyDomain(url) {
    var parsedURL = new URL(url);
    var firstPartyDomain = dexecure.firstPartyDomain;
    for (var i = firstPartyDomain.length - 1; i >= 0; i--) {
        if (firstPartyDomain[i].toLowerCase() == parsedURL.host.toLowerCase()) {
            return true;
        }
    }
    return false;
}

function changeToDexecureURL(inputURL) {
    var changedURL = new URL(inputURL);
    dexecure.debugMode && console.log('inputURL is ', inputURL);
    dexecure.debugMode && console.log('inputURL.hostname is ', inputURL.hostname)
    changedURL.hostname = dexecure.server[changedURL.hostname];
    dexecure.debugMode && console.log('changedURL.hostname is ', changedURL.hostname)
    dexecure.debugMode && console.log('changedURL is ', changedURL.href)
    return changedURL.href;
}

function isCloudflareURL(inputURL) {
    return new URL(inputURL).pathname.indexOf('/cdn-cgi/') == 0;
}

function isPageEnabled(referrerURL) {
    if (!referrerURL) {
    if(dexecure.debugMode) 
        console.log('returning isPageEnabled false due to no referrer')
    return false;
    }
    var parsedURL = new URL(referrerURL);
    var urlToMatchAgainst = parsedURL.origin + parsedURL.pathname;
    if(dexecure.debugMode) {
    console.log('parsed URL is', urlToMatchAgainst)
    console.log('matching URL is ', referrerURL);
    }

    for (var i = dexecure.pagesEnabled.length - 1; i >= 0; i--) {
    if (urlToMatchAgainst.indexOf(dexecure.pagesEnabled[i]) == 0) {
        if (dexecure.debugMode)
        console.log('dexecure.pagesEnabled[i] is ', dexecure.pagesEnabled[i]);
        return true;
    } else {
        if (dexecure.debugMode) {
        console.log('dexecure.pagesEnabled[i] does not match ', dexecure.pagesEnabled[i])
        console.log('parsedURL.hostname + parsedURL.pathname.indexOf(dexecure.pagesEnabled[i]) is ', (urlToMatchAgainst).indexOf(pagesEnabled[i]));
        }
    }
    }
    return true;
}

function getIDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            dexecure.debugMode && console.log("returning existing IDB instance");
            resolve(db);
        } else {
            var request = indexedDB.open("Dexecure", 1);
            request.onerror = function(event) {
                dexecure.debugMode && console.log("error: ");
                reject(request.error);
            };
            request.onsuccess = function(event) {
                db = request.result;
                resolve(request.result);
            };
        }

    });
}


function getBrotliStatus() {
    return getIDB()
        .then((db) => {
            return new Promise((resolve, reject) => {
                var transaction = db.transaction("config");
                var objectStore = transaction.objectStore("config");
                var request = objectStore.get(1);
                request.onerror = function(event) {
                    // safely asssume brotli not supported
                    reject(false);
                };
                request.onsuccess = function(event) {
                    dexecure.debugMode && console.log('reading from idb', event.target.result.isBrotliSupported);
                    resolve(event.target.result.isBrotliSupported);
                };
            });
        })
}

if (dexecure.optimisationsEnabled) {
    self.addEventListener('install', function(event) {
        if (dexecure.debugMode)
            console.log('install triggered');
        event.waitUntil(
            fetch('https://blog.dexecure.com/content/images/perm/test.br')
            .then((res) => {
                if (res.ok) {
                    return res.text();
                }
            })
            .then((resp) => {
                // check if the browser was able to decode the Brotli response correctly
                var isBrotliSupported = (resp === 'Dexecure');
                return isBrotliSupported;
            })
            .catch(() => {
                // assume brotli is not supported if request fails to be safe
                var isBrotliSupported = false;
                return isBrotliSupported;
            })
            .then((isBrotliSupported) => {
                return new Promise((resolve, reject) => {
                    var request = indexedDB.open("Dexecure", 1);
                    request.onerror = function(event) {
                        dexecure.debugMode && console.log("error: ");
                        reject(request.error);
                    };

                    request.onsuccess = function(event) {
                        db = request.result;
                        var transaction = db.transaction("config", "readwrite");
                        var store = transaction.objectStore("config");
                        var config = {
                            isBrotliSupported: isBrotliSupported
                        }
                        var request2 = store.put(config, 1);
                        request2.onsuccess = function() {
                            resolve();
                        }
                    };

                    request.onupgradeneeded = function(e) {
                        var thisDB = e.target.result;
                        if (!thisDB.objectStoreNames.contains("config")) {
                            thisDB.createObjectStore("config");
                        }
                    }
                });
            })
            .then(() => self.skipWaiting())
        );
        // event.waitUntil(self.skipWaiting());
    });

    self.addEventListener('activate', function(event) {
        event.waitUntil(self.clients.claim());
    });

    self.addEventListener('fetch', function(event) {
            if (!event.clientId) return fetch(e.request);
            if (dexecure.debugMode)
                console.log('fetch triggered');

            return self.clients.get(event.clientId).then(client => {
            const clientURL = new URL(client.url);

                if (!isPageEnabled(clientURL.pathname)) {
                    return fetch(event.request);
                }
                var imageMatchRegex = new RegExp(dexecure.imageMatchRegex, "i");
                var textMatchRegex = new RegExp(dexecure.textMatchRegex, "i");
                var isImageRequest = imageMatchRegex.test(event.request.url.toLowerCase());
                var isTextRequest = textMatchRegex.test(event.request.url.toLowerCase());

                if (dexecure.debugMode)
                    console.log('input url is ', event.request.url);

                if (event.request.method != 'GET') {
                return;
                }

                var shouldOptimize = (isImageRequest || isTextRequest) && isFirstPartyDomain(event.request.url) && !isCloudflareURL(event.request.url);
                if (!shouldOptimize) {
                return;
                }

                event.respondWith(getBrotliStatus()
                    .then((isBrotliSupported) => {

                        var headersToSendJS = {};
                        if (isImageRequest) {
                            if (event.request.headers.has('Accept')) {
                                headersToSendJS['Accept'] = event.request.headers.get('Accept');
                            }
                        }
                        if (isTextRequest && typeof isBrotliSupported !== 'undefined' && isBrotliSupported) {
                            headersToSendJS['Dex-Accept-Encoding'] = 'br';
                        }

                        var headersToSend = new Headers(headersToSendJS);
                        var dexecureURL = changeToDexecureURL(event.request.url);
                        dexecureURL = decodeURIComponent(dexecureURL);
                        if (dexecure.debugMode)
                            console.log('output url is ', dexecureURL);
                        return new Promise((resolve, reject) => {
                            setTimeout(reject(), dexecure.timeoutDuration);
                            fetch(dexecureURL, { mode: 'cors', headers: headersToSend })
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
                            })
                        })
                    })
                );
            });
        })
}