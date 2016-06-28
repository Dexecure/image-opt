- index.html contains code that installs service worker and inserts client hints.
- dex-opt.js contains the service worker code that matches requests against a regex and sends them to a cloudfront URL.
- the cloudfront URL is backed by Dexecure servers - the servers fetch the original image and optimise them based on the Accept request header and client hints if enabled.
- tested on node v6.2.2

## To get started 

- set the variables in config.user.json
  * server refers to a CDN URL that has been give to you by Dexecure
  * firstPartyDomain is an array of domains. images on this domain will be optimised. you can see how this variable is used in dex-opt.js

- then run
> npm install  
> gulp  

- you should now have the service worker code generated in dist folder
- the dist folder also conains the service worker registration code in index.html. you need to insert the code from index.html onto your webpage(s).
- host the service worker on your server and ensure the registration code in index.html contains the right path to the service worker





