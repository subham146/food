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
const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');

allSideMenu.forEach(item=> {
	const li = item.parentElement;

	item.addEventListener('click', function () {
		allSideMenu.forEach(i=> {
			i.parentElement.classList.remove('active');
		})
		li.classList.add('active');
	})
});




// TOGGLE SIDEBAR
const menuBar = document.querySelector('#content nav .bx.bx-menu');
const sidebar = document.getElementById('sidebar');

menuBar.addEventListener('click', function () {
	sidebar.classList.toggle('hide');
})







const searchButton = document.querySelector('#content nav form .form-input button');
const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
const searchForm = document.querySelector('#content nav form');

searchButton.addEventListener('click', function (e) {
	if(window.innerWidth < 576) {
		e.preventDefault();
		searchForm.classList.toggle('show');
		if(searchForm.classList.contains('show')) {
			searchButtonIcon.classList.replace('bx-search', 'bx-x');
		} else {
			searchButtonIcon.classList.replace('bx-x', 'bx-search');
		}
	}
})





if(window.innerWidth < 768) {
	sidebar.classList.add('hide');
} else if(window.innerWidth > 576) {
	searchButtonIcon.classList.replace('bx-x', 'bx-search');
	searchForm.classList.remove('show');
}


window.addEventListener('resize', function () {
	if(this.innerWidth > 576) {
		searchButtonIcon.classList.replace('bx-x', 'bx-search');
		searchForm.classList.remove('show');
	}
})



const switchMode = document.getElementById('switch-mode');

switchMode.addEventListener('change', function () {
	if(this.checked) {
		document.body.classList.add('dark');
	} else {
		document.body.classList.remove('dark');
	}
})

function escapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

$(document).ready(function () {
	$.getJSON('resources/php/admin4.php')
		.done(function (data) {
			if (data && typeof data.currentUser === 'string') {
				$('#profileImage').attr('title', data.currentUser);
			}

			var logs = (data && Array.isArray(data.logs)) ? data.logs : [];
			var $tbody = $('#activity-body');
			$tbody.empty();

			logs.forEach(function (row) {
				var userid = escapeHtml(row.userid);
				var email = escapeHtml(row.email);
				var eventText = escapeHtml(row.event);
				var datetime = escapeHtml(row.datetime);

				$tbody.append(
					'<tr>' +
						'<td><p>' + userid + '</p></td>' +
						'<td>' + email + '</td>' +
						'<td>' + eventText + '</td>' +
						'<td>' + datetime + '</td>' +
					'</tr>'
				);
			});
		})
		.fail(function () {
			// Keep UI functional even if backend fails.
		});
});


$(document).ready(function() {
    $("#search").keyup(function() {
        searchtb($(this).val());
    });

	$("#search").on('input', function() {
        if($(this).val() === '') {
            searchtb('');
        }
    });

    function searchtb(value) {
		var visibleRows = 0;
        $("#myTable tr:not(:has(th))").each(function() {
            var found = 'false';
            var userid = $(this).find('td:nth-child(1)').text().replace(/[^0-9]/g, '');
			var username = $(this).find('td:nth-child(2)').text().toLowerCase();
			if(userid.indexOf(value.toLowerCase()) === 0 || username.indexOf(value.toLowerCase()) === 0) {
    			found = 'true';
			}
            if(found == 'true') {
                $(this).show();
				visibleRows++;
            } else {
                $(this).hide();
            }

			if(visibleRows === 0) {
				$('#no-records-found').show();
			} else {
				$('#no-records-found').hide();
			}
        });
    }
});
 