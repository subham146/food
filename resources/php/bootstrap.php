<?php

// CORS + cross-site session bootstrap for Vercel frontend -> InfinityFree PHP backend

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Allow production + Vercel preview URLs for this project.
// Vercel previews are typically like: https://foodelight-iota-git-branch-xyz.vercel.app
$isAllowedOrigin = false;
if ($origin) {
    $isAllowedOrigin = ($origin === 'https://foodelight-iota.vercel.app');
    if (!$isAllowedOrigin && preg_match('/^https:\/\/foodelight-iota-.+\.vercel\.app$/', $origin)) {
        $isAllowedOrigin = true;
    }

    // Optional: uncomment for local testing
    // if (!$isAllowedOrigin && $origin === 'http://localhost:5500') $isAllowedOrigin = true;
}

if ($origin && $isAllowedOrigin) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (session_status() !== PHP_SESSION_ACTIVE) {
    // Support cross-site cookies (required for PHP sessions with Vercel)
    // Works on PHP 7.3+ (array form). For older versions, ini_set is used.
    @ini_set('session.cookie_secure', '1');
    @ini_set('session.cookie_httponly', '1');
    @ini_set('session.cookie_samesite', 'None');

    if (PHP_VERSION_ID >= 70300) {
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'None',
        ]);
    }

    session_start();
}
