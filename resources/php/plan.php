<?php

session_start();

header('Content-Type: application/json; charset=utf-8');

include __DIR__ . '/config.php';
include __DIR__ . '/db_init.php';

if (!isset($_SESSION['username']) || $_SESSION['username'] === '') {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$currentUser = $_SESSION['username'];

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Connection failed']);
    exit;
}

$transactions = [];

// Normalized schema first.
$normalizedSql = "
    SELECT t.transactionid, COALESCE(t.paid_at, s.start_date) AS datein, t.amount
    FROM users u
    JOIN subscriptions s ON s.userid = u.userid
    LEFT JOIN transactions t ON t.subscriptionid = s.subscriptionid
    WHERE u.username = ?
    ORDER BY datein DESC
";

$normalizedStmt = $conn->prepare($normalizedSql);
if ($normalizedStmt) {
    $normalizedStmt->bind_param('s', $currentUser);
    if ($normalizedStmt->execute()) {
        $normalizedStmt->bind_result($transactionid, $datein, $amount);
        while ($normalizedStmt->fetch()) {
            if ($transactionid === null) {
                continue;
            }
            $transactions[] = [
                'transactionid' => $transactionid,
                'date' => $datein,
                'name' => $currentUser,
                'amount' => (float) $amount,
                'status' => 'Success',
            ];
        }
    }
    $normalizedStmt->close();
}


$conn->close();

echo json_encode([
    'currentUser' => $currentUser,
    'transactions' => $transactions,
]);
