window.FOODELIGHT_API_BASE = window.FOODELIGHT_API_BASE || 'https://foodelight.ct.ws/php/';
if (typeof window.jQuery !== 'undefined' && !window.__FOODELIGHT_API_PREFILTER__) {
    window.__FOODELIGHT_API_PREFILTER__ = true;

    $.ajaxSetup({
        xhrFields: { withCredentials: true }
    });

    $.ajaxPrefilter(function(options) {
        if (typeof options.url === 'string' && options.url.indexOf('resources/php/') === 0) {
            options.url = window.FOODELIGHT_API_BASE + options.url.replace(/^resources\/php\//, '');
        }

        options.xhrFields = options.xhrFields || {};
        options.xhrFields.withCredentials = true;
    });
}
$(document).ready(function () {
	$.getJSON('resources/php/acc.php')
		.done(function (data) {
			$('#acc-userid').val(data.userId || '');
			$('#acc-username').val(data.username || '');
			$('#acc-email').val(data.email || '');
		});
});
