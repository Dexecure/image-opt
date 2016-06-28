- index.html contains code that installs service worker and inserts client hints.
- dex-opt.js contains the service worker code that matches requests against a regex and sends them to a cloudfront URL.
- the cloudfront URL is backed by Dexecure servers - the servers fetch the original image and optimise them based on the Accept request header and client hints if enabled.

## Tested on node v6.2.2

# To get started run  
> npm install  
> gulp  



