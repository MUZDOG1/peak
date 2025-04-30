<?php
// report.php
// Appends any reported word into kitten.txt (create if missing)

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo 'Method not allowed';
  exit;
}

if (empty($_POST['word'])) {
  http_response_code(400);
  echo 'No word provided';
  exit;
}

$word = trim($_POST['word']);
// sanitize: allow only letters, numbers, dash/underscore
if (!preg_match('/^[\w-]+$/', $word)) {
  http_response_code(400);
  echo 'Invalid word';
  exit;
}

$file = __DIR__ . '/kitten.txt';
if (file_put_contents($file, $word . PHP_EOL, FILE_APPEND | LOCK_EX) === false) {
  http_response_code(500);
  echo 'Write failed';
} else {
  echo 'OK';
}
