# lms-spa/frontend

> LMS frontend

## Setup, Build and Run

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# run unit tests
npm run unit

# run all tests (alias for running just unit tests as we have no other type of front end tests)
npm test
```

For detailed explanation on how things work, checkout the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## Decision log

* [Vuejs 2](https://protranslating.atlassian.net/projects/LMS/issues/LMS-1)
* [Bootstrap 4](https://protranslating.atlassian.net/projects/LMS/issues/LMS-1)


## Running the production frontend locally

* Install http-server: `npm install -g http-server`
* [Allow https insecure proxy connections in http-server globally](https://github.com/indexzero/http-server/issues/214)
* Inside the frontend folder execute `npm run build`
* Go to frontend/dist folder and execute `http-server -P https://<your-machine-name>:3443` (this url will be logged by the backend application at startup)

Beware that this method does not render an URL upon refresh, but it is close enought to what's needed.

## Debugging
* Install the Vue DevTools plugin
* Launch DevTools by opening the Inspector in chrome
* Go to the sources tab
* Use ctrl+p to search for a js where to put your breakpoint
* Interact with the app to trigger the breakpoint
* Go to the Vue tab in DevTools to search for a vue component and look into its data, computed properties etc

## HTTPS troubleshooting
1. To allow insecure localhost:
 - Go to `chrome://flags`.
 - Search for `allow-insecure-localhost` flag.
 - Enable it.
2. To pass page with `NET::ERR_CERT_INVALID` message just type `thisisunsafe` while you on that page (no need to search for special input).
