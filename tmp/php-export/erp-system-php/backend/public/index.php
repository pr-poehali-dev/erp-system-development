<?php
/**
 * Единая точка входа (front controller) для API.
 * Разбирает путь вида /api/auth, /api/employees и подключает
 * соответствующий обработчик из backend/api/{module}/index.php.
 *
 * Используется, если сервер настроен на rewrite всех /api/* запросов
 * на этот файл (см. deploy/nginx.conf.example и .htaccess).
 */

declare(strict_types=1);

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$uri = trim($uri, '/');
$uri = preg_replace('#^api/#', '', $uri);
$module = explode('/', $uri)[0] ?? '';

$allowed = ['auth', 'employees', 'crm', 'operations', 'sales'];

if (!in_array($module, $allowed, true)) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Неизвестный модуль API'], JSON_UNESCAPED_UNICODE);
    exit;
}

$target = __DIR__ . "/../api/{$module}/index.php";

if (!file_exists($target)) {
    http_response_code(501);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => "Модуль '{$module}' ещё не реализован в этой версии"], JSON_UNESCAPED_UNICODE);
    exit;
}

require $target;
