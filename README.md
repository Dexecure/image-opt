## General info

- index.html contains code that registers the service worker and enables client hints
- dex-opt.js contains the service worker code that matches requests against a regex and sends them to AWS CloudFront CDN
- the CloudFront CDN is backed by Dexecure servers - which fetch the original image and optimize them

## To get started 

- tested on node v6.2.2
- set the variables in config.user.json
  * server refers to the CDN URL that has been generated for you by Dexecure
  * firstPartyDomain is an array of domains. Only images from these domains will be optimised.

- then run
> npm install  
> gulp  

- you should now have the service worker code generated in dist folder
- the dist folder also conains the service worker registration code in index.html. You need to insert the code from index.html onto your webpage(s)
- host the service worker on your server and ensure the registration code in index.html contains the right path to the service worker

- you can contact us at [Dexecure Support](mailto:support@dexecure.com "support@dexecure.com") if you run into any issues

