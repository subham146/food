(function () {
    var host = window.location.hostname || "";
    var isLocal = host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
    var API_BASE = isLocal ? "" : "/api";

    function normalizeApiUrl(url) {
        if (typeof url !== "string") {
            return url;
        }
        if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) {
            return url;
        }

        if (url.indexOf("python/") === 0) {
            return API_BASE + "/" + url;
        }
        if (url.indexOf("/python/") === 0) {
            return API_BASE + url;
        }
        return url;
    }

    window.apiPath = function (path) {
        return normalizeApiUrl(path);
    };

    if (window.jQuery) {
        var originalAjax = window.jQuery.ajax;
        window.jQuery.ajax = function (options) {
            if (typeof options === "string") {
                return originalAjax.call(this, normalizeApiUrl(options));
            }
            if (options && options.url) {
                options.url = normalizeApiUrl(options.url);
            }
            return originalAjax.call(this, options);
        };

        var originalGetJSON = window.jQuery.getJSON;
        window.jQuery.getJSON = function (url) {
            arguments[0] = normalizeApiUrl(url);
            return originalGetJSON.apply(this, arguments);
        };
    }

    if (window.fetch) {
        var originalFetch = window.fetch;
        window.fetch = function (input, init) {
            if (typeof input === "string") {
                input = normalizeApiUrl(input);
            } else if (input && input.url) {
                input = normalizeApiUrl(input.url);
            }
            return originalFetch.call(this, input, init);
        };
    }
})();
