$(document).ready(function () {
	$.getJSON('python/acc.py')
		.done(function (data) {
			$('#acc-userid').val(data.userId || '');
			$('#acc-username').val(data.username || '');
			$('#acc-email').val(data.email || '');
		});
});

