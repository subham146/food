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


function mapGoal(value) {
	switch (value) {
		case 'wl': return 'Weight Loss';
		case 'wm': return 'Weight Maintenance';
		case 'gm': return 'Gain Muscle';
		case 'he': return 'Healthy eating';
		default: return value || '';
	}
}

function mapDuration(value) {
	switch (value) {
		case '3d': return '3 days';
		case '2w': return '2 weeks';
		case '4w': return '4 weeks';
		default:
			if (value === undefined || value === null || value === '') return '';
			if (!isNaN(Number(value))) return value + ' days';
			return value;
	}
}

function mapMeals(value) {
	switch (value) {
		case '1m': return '1 meal';
		case '2m': return '2 meals';
		case '3m': return '3 meals';
		case '4m': return '4 meals';
		default: return value || '';
	}
}

function mapDiet(value) {
	switch (value) {
		case 'keto': return 'Ketogenic Diet';
		case 'balanced': return 'Balanced Diet';
		case 'low': return 'Low-carb Diet';
		case 'glu': return 'Gluten-free Diet';
		default: return value || '';
	}
}

function mapType(value) {
	switch (value) {
		case 'egg': return 'Eggetarian';
		case 'veg': return 'Vegetarian';
		case 'nonveg': return 'Non-Vegetarian';
		default: return value || '';
	}
}

function escapeHtml(text) {
	return String(text ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function renderSubscriptions(subscriptions) {
	const tbody = document.getElementById('subscriptions-body');
	if (!tbody) return;

	if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
		tbody.innerHTML = '<tr><td colspan="11">No records found</td></tr>';
		$('#no-records-found').show();
		return;
	}

	$('#no-records-found').hide();

	const rowsHtml = subscriptions.map(function (s) {
		const amountValue = s.amount === undefined || s.amount === null || s.amount === '' ? '' : ('₹' + s.amount);
		return (
			'<tr>' +
				'<td><p>' + escapeHtml(s.userid) + '</p></td>' +
				'<td>' + escapeHtml(mapGoal(s.goal)) + '</td>' +
				'<td>' + escapeHtml(mapDuration(s.duration)) + '</td>' +
				'<td>' + escapeHtml(mapMeals(s.meals)) + '</td>' +
				'<td>' + escapeHtml(mapDiet(s.diet)) + '</td>' +
				'<td>' + escapeHtml(mapType(s.type)) + '</td>' +
				'<td>' + escapeHtml(s.mealtype) + '</td>' +
				'<td>' + escapeHtml(s.subscriptionid) + '</td>' +
				'<td>' + escapeHtml(s.transactionid) + '</td>' +
				'<td>' + escapeHtml(amountValue) + '</td>' +
				'<td>' + escapeHtml(s.datein) + '</td>' +
			'</tr>'
		);
	}).join('');

	tbody.innerHTML = rowsHtml;
}

$(document).ready(function () {
	$.getJSON('resources/php/admin3.php')
		.done(function (data) {
			if (data && data.currentUser !== undefined) {
				$('#profileImage').attr('title', data.currentUser);
			}
			renderSubscriptions(data && data.subscriptions ? data.subscriptions : []);
		})
		.fail(function () {
			renderSubscriptions([]);
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
            var goal = $(this).find('td:nth-child(2)').text().toLowerCase();
            var diet = $(this).find('td:nth-child(5)').text().toLowerCase();
            var type = $(this).find('td:nth-child(6)').text().toLowerCase();
            var mealtype = $(this).find('td:nth-child(7)').text().toLowerCase();
            if(userid.indexOf(value.toLowerCase()) === 0 || goal.indexOf(value.toLowerCase()) === 0 || diet.indexOf(value.toLowerCase()) === 0 || type.indexOf(value.toLowerCase()) === 0 || mealtype.indexOf(value.toLowerCase()) === 0) {
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
 