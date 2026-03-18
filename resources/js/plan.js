function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

$(document).ready(function () {
    $.getJSON('resources/php/plan.py')
        .done(function (data) {
            if (data && typeof data.currentUser === 'string') {
                $('#profileImage').attr('title', data.currentUser);
            }

            var transactions = (data && Array.isArray(data.transactions)) ? data.transactions : [];
            var $tbody = $('#plan-body');
            $tbody.empty();

            if (transactions.length === 0) {
                $tbody.append('<tr><td colspan="5">No records found</td></tr>');
                return;
            }

            transactions.forEach(function (row) {
                var transactionid = escapeHtml(row.transactionid);
                var date = escapeHtml(row.date);
                var name = escapeHtml(row.name);
                var amount = Number(row.amount ?? 0);
                var amountText = isNaN(amount) ? '\u20B90.00' : ('\u20B9' + amount.toFixed(2));
                var status = escapeHtml(row.status ?? 'Success');

                $tbody.append(
                    '<tr class="align-middle">' +
                        '<td>' + transactionid + '</td>' +
                        '<td>' + date + '</td>' +
                        '<td>' + name + '</td>' +
                        '<td><div class="d-flex align-items-center"><span>' + amountText + '</span></div></td>' +
                        '<td><span class="badge fs-6 fw-normal bg-tint-success text-success">' + status + '</span></td>' +
                    '</tr>'
                );
            });
        })
        .fail(function () {
            var $tbody = $('#plan-body');
            $tbody.empty();
            $tbody.append('<tr><td colspan="5">No records found</td></tr>');
        });
});

