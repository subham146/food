<?php

require_once __DIR__ . '/cors.php';

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'userId' => isset($_SESSION['userId']) ? $_SESSION['userId'] : '',
    'username' => isset($_SESSION['username']) ? $_SESSION['username'] : '',
    'email' => isset($_SESSION['email']) ? $_SESSION['email'] : '',
]);
