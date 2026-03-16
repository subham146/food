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

$subscriptions = [];

$sql = "
    SELECT
        s.userid AS userid,
        p.goal AS goal,
        p.duration_days AS duration_days,
        GROUP_CONCAT(m.meal_name ORDER BY m.meal_name SEPARATOR ', ') AS meals_list,
        p.diet AS diet,
        '' AS type,
        p.mealtype AS mealtype,
        s.subscriptionid AS subscriptionid,
        t.transactionid AS transactionid,
        t.amount AS amount,
        COALESCE(t.paid_at, s.start_date) AS datein
    FROM subscriptions s
    JOIN plans p ON p.planid = s.planid
    LEFT JOIN plan_meals pm ON pm.planid = p.planid
    LEFT JOIN meals m ON m.mealid = pm.mealid
    LEFT JOIN transactions t ON t.subscriptionid = s.subscriptionid
    GROUP BY
        s.subscriptionid,
        s.userid,
        p.goal,
        p.duration_days,
        p.diet,
        p.mealtype,
        t.transactionid,
        t.amount,
        t.paid_at,
        s.start_date
    ORDER BY datein DESC
";

$result = $conn->query($sql);
if ($result !== false) {
    while ($row = $result->fetch_assoc()) {
        $subscriptions[] = [
            'userid' => $row['userid'] ?? '',
            'goal' => $row['goal'] ?? '',
            'duration' => isset($row['duration_days']) ? ((string) $row['duration_days']) : '',
            'meals' => $row['meals_list'] ?? '',
            'diet' => $row['diet'] ?? '',
            'type' => $row['type'] ?? '',
            'mealtype' => $row['mealtype'] ?? '',
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
    'subscriptions' => $subscriptions,
]);
