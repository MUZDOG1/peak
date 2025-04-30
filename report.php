<?php
// report.php
// ——————————————————————————————————
// Append reported words into kitten.txt

// Enable error logging for debugging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log');
error_reporting(E_ALL);

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Method not allowed';
    exit;
}

// Pull the raw payload
$word = '';

// 1) If Content-Type is JSON, decode it
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') !== false) {
    $data = json_decode(file_get_contents('php://input'), true);
    $word = $data['word'] ?? '';
}
// 2) Otherwise, use form data
else {
    $word = $_POST['word'] ?? '';
}

// Trim and validate
$word = trim($word);
if ($word === '') {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'No word provided';
    exit;
}
// Only letters, numbers, underscores, dashes
if (!preg_match('/^[A-Za-z0-9_-]+$/', $word)) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Invalid word';
    exit;
}

// Append to file
$file = __DIR__ . '/kitten.txt';
if (file_put_contents($file, $word . PHP_EOL, FILE_APPEND | LOCK_EX) === false) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Write failed';
    error_log("Failed writing \"$word\" to kitten.txt");
} else {
    header('Content-Type: text/plain; charset=utf-8');
    echo 'OK';
}
