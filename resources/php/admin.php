<?php

require_once __DIR__ . '/cors.php';

header('Content-Type: application/json; charset=utf-8');

include __DIR__ . '/config.php';
include __DIR__ . '/db_init.php';

$currentUser = isset($_SESSION['username']) ? $_SESSION['username'] : 'Guest';

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Connection failed']);
    exit;
}

$metrics = [
    'newOrders' => 0,
    'users' => 0,
    'totalSales' => 0,
];

$recentOrders = [];

$usersResult = $conn->query('SELECT COUNT(*) AS total FROM users');
if ($usersResult !== false) {
    $metrics['users'] = (int) (($usersResult->fetch_assoc()['total'] ?? 0));
}

$ordersResult = $conn->query('SELECT COUNT(*) AS total FROM subscriptions');
if ($ordersResult !== false) {
    $metrics['newOrders'] = (int) (($ordersResult->fetch_assoc()['total'] ?? 0));
}

$salesResult = $conn->query('SELECT COALESCE(SUM(amount), 0) AS total FROM transactions');
if ($salesResult !== false) {
    $metrics['totalSales'] = (float) (($salesResult->fetch_assoc()['total'] ?? 0));
}

$normalizedSql = "
    SELECT
        u.username AS username,
        s.subscriptionid AS subscriptionid,
        t.transactionid AS transactionid,
        t.amount AS amount,
        COALESCE(t.paid_at, s.start_date) AS datein
    FROM subscriptions s
    JOIN users u ON u.userid = s.userid
    LEFT JOIN transactions t ON t.subscriptionid = s.subscriptionid
    ORDER BY datein DESC
";

$ordersResult2 = $conn->query($normalizedSql);
if ($ordersResult2 !== false) {
    while ($row = $ordersResult2->fetch_assoc()) {
        $recentOrders[] = [
            'username' => $row['username'] ?? '',
            'subscriptionid' => $row['subscriptionid'] ?? '',
            'transactionid' => $row['transactionid'] ?? '',
            'amount' => $row['amount'] ?? '',
            'datein' => $row['datein'] ?? '',
        ];
    }
}

$conn->close();

echo json_encode([
    'currentUser' => $currentUser,
    'metrics' => $metrics,
    'recentOrders' => $recentOrders,
]);
