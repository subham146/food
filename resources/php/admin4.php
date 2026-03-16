<?php

session_start();

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

$logs = [];

$sql = "
    SELECT a.userid AS userid, u.email AS email, a.event AS event, a.logged_at AS datetime
    FROM activity_log a
    LEFT JOIN users u ON u.userid = a.userid
    ORDER BY a.logged_at DESC
";

$result = $conn->query($sql);
if ($result !== false) {
    while ($row = $result->fetch_assoc()) {
        $logs[] = [
            'userid' => $row['userid'] ?? '',
            'email' => $row['email'] ?? '',
            'event' => $row['event'] ?? '',
            'datetime' => $row['datetime'] ?? '',
        ];
    }
}

$conn->close();

echo json_encode([
    'currentUser' => $currentUser,
    'logs' => $logs,
]);
