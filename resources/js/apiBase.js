(function () {
  // Backend (InfinityFree) base URL
  window.FOODELIGHT_API_BASE_URL = window.FOODELIGHT_API_BASE_URL || "https://foodelight.ct.ws";

  // Ensure jQuery requests carry cookies (PHP sessions)
  if (window.jQuery && window.jQuery.ajaxSetup) {
    window.jQuery.ajaxSetup({ xhrFields: { withCredentials: true } });

    // Rewrite relative PHP URLs to the backend domain.
    window.jQuery.ajaxPrefilter(function (options) {
      var base = String(window.FOODELIGHT_API_BASE_URL || "").replace(/\/+$/, "");
      if (!base) return;

      var url = options && options.url;
      if (typeof url !== "string") return;

      if (url.indexOf("resources/php/") === 0) {
        options.url = base + "/" + url;

        // Important: ensure jQuery treats this as a cross-domain request.
        // Otherwise it may assume same-origin (since the original URL was relative),
        // add X-Requested-With, and trigger a CORS preflight that some hosts reject.
        options.crossDomain = true;
      }
    });
  }
})();
