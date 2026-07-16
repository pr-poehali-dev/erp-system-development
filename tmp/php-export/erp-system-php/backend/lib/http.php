<?php
/**
 * Общие HTTP-утилиты: CORS-заголовки, JSON-ответы, чтение тела запроса.
 * Повторяют поведение исходных Python cloud-функций (тот же контракт для фронтенда).
 */

declare(strict_types=1);

function cors_headers(): void
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Authorization, X-User-Id');
    header('Access-Control-Max-Age: 86400');
}

/**
 * Отправляет JSON-ответ и завершает выполнение скрипта.
 */
function json_response(int $status, array $body): never
{
    http_response_code($status);
    cors_headers();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Обрабатывает preflight OPTIONS-запрос (всегда вызывать первым в каждом endpoint).
 */
function handle_options(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(200);
        cors_headers();
        exit;
    }
}

/**
 * Читает и декодирует JSON-тело запроса. Возвращает пустой массив при ошибке.
 */
function read_json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Достаёт токен авторизации из заголовка X-Authorization (с опциональным префиксом Bearer).
 */
function get_auth_token(): string
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $token = '';
    foreach ($headers as $name => $value) {
        if (strcasecmp($name, 'X-Authorization') === 0) {
            $token = $value;
            break;
        }
    }
    if ($token === '' && isset($_SERVER['HTTP_X_AUTHORIZATION'])) {
        $token = $_SERVER['HTTP_X_AUTHORIZATION'];
    }
    if (stripos($token, 'bearer ') === 0) {
        $token = substr($token, 7);
    }
    return trim($token);
}
