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

const RUPEE_SYMBOL = '\u20B9';

$(document).ready(function () {
	$.getJSON('python/admin.py')
		.done(function (data) {
			if (data && typeof data.currentUser === 'string') {
				$('#profileImage').attr('title', data.currentUser);
			}

			if (data && data.metrics) {
				$('#metric-neworders').text(data.metrics.newOrders ?? 0);
				$('#metric-users').text(data.metrics.users ?? 0);
				$('#metric-totalsales').text(RUPEE_SYMBOL + ' ' + (data.metrics.totalSales ?? 0));
			}

			var orders = (data && Array.isArray(data.recentOrders)) ? data.recentOrders : [];
			var $tbody = $('#recent-orders-body');
			$tbody.empty();

			orders.forEach(function (row) {
				var username = escapeHtml(row.username);
				var subscriptionid = escapeHtml(row.subscriptionid);
				var transactionid = escapeHtml(row.transactionid);
				var amount = escapeHtml(row.amount);
				var datein = escapeHtml(row.datein);

				$tbody.append(
					'<tr>' +
						'<td>' +
							'<img id="profileImage" width="48" height="48" src="https://img.icons8.com/fluency/48/user-male-circle--v1.png" />' +
							'<p>' + username + '</p>' +
						'</td>' +
						'<td>' + subscriptionid + '</td>' +
						'<td>' + transactionid + '</td>' +
						'<td>' + RUPEE_SYMBOL + amount + '</td>' +
						'<td>' + datein + '</td>' +
						'<td><span class="status completed">Completed</span></td>' +
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
            var user = $(this).find('td:nth-child(1) p').text().toLowerCase();
            if(user.indexOf(value.toLowerCase()) === 0) {
                found = 'true';
            }
            if(found == 'true') {
                $(this).show();
                visibleRows++;
            } else {
                $(this).hide();
            }
        });

        if(visibleRows === 0) {
            $('#no-records-found').show();
        } else {
            $('#no-records-found').hide();
        }
    }
});
 
