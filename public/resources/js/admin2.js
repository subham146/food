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
    $.getJSON('python/admin2.py')
        .done(function (data) {
            if (data && typeof data.currentUser === 'string') {
                $('#profileImage').attr('title', data.currentUser);
            }

            var users = (data && Array.isArray(data.users)) ? data.users : [];
            var $tbody = $('#users-body');
            $tbody.empty();

            users.forEach(function (row) {
                var userid = escapeHtml(row.userid);
                var username = escapeHtml(row.username);
                var email = escapeHtml(row.email);
                var password = escapeHtml(row.password);

                $tbody.append(
                    '<tr>' +
                        '<td>' +
                            '<img id="profileImage" width="48" height="48" src="https://img.icons8.com/fluency/48/user-male-circle--v1.png" />' +
                            '<p>' + username + '</p>' +
                        '</td>' +
                        '<td>' + userid + '</td>' +
                        '<td>' + email + '</td>' +
                        '<td>' + password + '</td>' +
                        '<td>' +
                            '<a href="#" class="btn btn-danger delete-btn" data-id="' + userid + '" data-email="' + email + '">Delete</a>' +
                        '</td>' +
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
            var userid = $(this).find('td:nth-child(2)').text().replace(/[^0-9]/g, '');
            var username = $(this).find('td:nth-child(1) p').text().toLowerCase();
            var email = $(this).find('td:nth-child(3)').text().toLowerCase(); // Assuming email is in the third column
            if(userid.indexOf(value.toLowerCase()) === 0 || username.indexOf(value.toLowerCase()) === 0 || email.indexOf(value.toLowerCase()) === 0) {
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

$(document).ready(function() {
    $(document).on('click', '.delete-btn', function(e) {
        e.preventDefault();
        var id = $(this).data("id");
		var email = $(this).data("email");
        $.ajax({
            url: "python/delete.py",
            type: "POST",
            data: { id: id, email: email },
            success: function(response) {
                if(response == 1) {
                    alert("Record deleted successfully");
                    location.reload();
                } else {
                    alert("There was an error. Please try again.");
                }
            }
        });
    });
});
 
