<?php

session_start();

header('Content-Type: application/json; charset=utf-8');

session_unset();
session_destroy();

echo json_encode([
    'ok' => true,
    'redirect' => 'index.html',
]);
