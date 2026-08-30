(function () {
    "use strict";

    /* Where the checkout API lives.
     *
     * GitHub Pages serves these pages but cannot run the API, so on the live
     * domain the browser is sent to the Cloudflare Worker instead. Update this
     * if the Worker's URL changes. */
    var WORKER_ORIGIN = "https://everything-burger.tesburgereverything.workers.dev";

    /* Anywhere the API is already on the same origin as the page, this is left
     * alone: `npm start`, `npm run cf:dev`, and the workers.dev URL all serve
     * both halves themselves. Only the Pages domain needs redirecting. */
    var host = window.location.hostname;
    var isLocal = host === "localhost" || host === "127.0.0.1" || host === "";
    var servesItsOwnApi = isLocal || /\.workers\.dev$/i.test(host);

    if (!servesItsOwnApi) {
        window.EB_CHECKOUT_ORIGIN = WORKER_ORIGIN;
    }
})();
