<?php
/**
 * Подключение к базе данных MySQL.
 * Настройки читаются из .env (см. .env.example).
 */

declare(strict_types=1);

function env_load(string $path): array
{
    $vars = [];
    if (!file_exists($path)) {
        return $vars;
    }
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
        $vars[trim($key)] = trim($value);
    }
    return $vars;
}

$envPath = __DIR__ . '/../.env';
$env = env_load($envPath);

function env_get(array $env, string $key, string $default = ''): string
{
    return $env[$key] ?? getenv($key) ?: $default;
}

define('DB_HOST', env_get($env, 'DB_HOST', 'localhost'));
define('DB_NAME', env_get($env, 'DB_NAME', 'erp_system'));
define('DB_USER', env_get($env, 'DB_USER', 'erp_user'));
define('DB_PASSWORD', env_get($env, 'DB_PASSWORD', ''));
define('DB_PORT', env_get($env, 'DB_PORT', '3306'));

/**
 * Возвращает PDO-соединение с базой данных (MySQL).
 * Соединение создаётся один раз и переиспользуется (статическая переменная).
 */
function get_db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
    $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}
