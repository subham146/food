<?php

require_once __DIR__ . '/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

$days = isset($_SESSION['days']) ? $_SESSION['days'] : null;
$price = isset($_SESSION['price']) ? (float) $_SESSION['price'] : null;

if ($days === null || $price === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing subscription details in session']);
    exit;
}

if ($days === '4w') {
    $discount = ($price * 0.1);
    $daysLabel = '4 weeks';
} else if ($days === '2w') {
    $discount = ($price * 0.03);
    $daysLabel = '2 weeks';
} else {
    $discount = ($price * 0.1);
    $daysLabel = '3 days';
}

$gst = $price * 0.05;
$cgst = $sgst = $gst / 2;
$totalAmount = $price + $cgst + $sgst - $discount;

// Keep existing billing flow that expects tp in session.
$_SESSION['tp'] = $totalAmount;

echo json_encode([
    'price' => $price,
    'days' => $days,
    'daysLabel' => $daysLabel,
    'sgst' => $sgst,
    'cgst' => $cgst,
    'discount' => $discount,
    'totalAmount' => $totalAmount,
]);
