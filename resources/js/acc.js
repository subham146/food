$(document).ready(function () {
	$.getJSON('resources/php/acc.php')
		.done(function (data) {
			$('#acc-userid').val(data.userId || '');
			$('#acc-username').val(data.username || '');
			$('#acc-email').val(data.email || '');
		});
});
