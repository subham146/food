<?php

require_once __DIR__ . '/cors.php';

header('Content-Type: application/json; charset=utf-8');

session_unset();
session_destroy();

echo json_encode([
    'ok' => true,
    'redirect' => 'index.html',
]);
