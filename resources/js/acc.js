$(document).ready(function () {
	$.getJSON('resources/php/acc.py')
		.done(function (data) {
			$('#acc-userid').val(data.userId || '');
			$('#acc-username').val(data.username || '');
			$('#acc-email').val(data.email || '');
		});
});

