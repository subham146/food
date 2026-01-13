<?php

require_once __DIR__ . '/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

include __DIR__ . '/config.php';

$currentUser = isset($_SESSION['username']) ? $_SESSION['username'] : 'Guest';

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Connection failed']);
    exit;
}

include __DIR__ . '/db_init.php';

$users = [];

$result = $conn->query('SELECT userid, username, email, password FROM users ORDER BY userid ASC');
if ($result !== false) {
    while ($row = $result->fetch_assoc()) {
        $users[] = [
            'userid' => $row['userid'] ?? '',
            'username' => $row['username'] ?? '',
            'email' => $row['email'] ?? '',
            'password' => $row['password'] ?? '',
        ];
    }
}

$conn->close();

echo json_encode([
    'currentUser' => $currentUser,
    'users' => $users,
]);
