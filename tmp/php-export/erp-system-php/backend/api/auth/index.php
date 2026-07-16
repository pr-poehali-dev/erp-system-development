<?php
/**
 * Авторизация сотрудников: вход по логину/паролю, сессии, смена пароля,
 * выход, проверка текущего пользователя.
 *
 * Действия (?action=...):
 *   POST ?action=login           { login, password } -> { token, employee }
 *   POST ?action=logout          -> { ok: true }
 *   GET  ?action=me              -> { employee }
 *   POST ?action=change-password { newPassword, currentPassword? } -> { ok: true }
 */

declare(strict_types=1);

require_once __DIR__ . '/../../lib/http.php';
require_once __DIR__ . '/../../lib/auth.php';

handle_options();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';
$body = read_json_body();
$token = get_auth_token();

$db = get_db();

/**
 * Формирует публичное представление сотрудника для ответа фронтенду.
 */
function employee_public(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'firstName' => $row['first_name'],
        'lastName' => $row['last_name'],
        'middleName' => $row['middle_name'] ?? null,
        'email' => $row['email'],
        'phone' => $row['phone'] ?? null,
        'login' => $row['login'],
        'mustChangePassword' => (bool)$row['must_change_password'],
        'roleId' => (int)$row['role_id'],
        'roleSlug' => $row['role_slug'] ?? null,
        'roleName' => $row['role_name'] ?? null,
        'permissions' => is_string($row['permissions'] ?? null)
            ? (json_decode($row['permissions'], true) ?: [])
            : ($row['permissions'] ?? []),
        'departmentId' => $row['department_id'] !== null ? (int)$row['department_id'] : null,
        'departmentName' => $row['department_name'] ?? null,
        'companyId' => $row['company_id'] !== null ? (int)$row['company_id'] : null,
        'companyName' => $row['company_name'] ?? null,
        'avatarUrl' => $row['avatar_url'] ?? null,
        'status' => $row['status'],
    ];
}

if ($method === 'POST' && $action === 'login') {
    $login = trim($body['login'] ?? '');
    $password = $body['password'] ?? '';
    if ($login === '' || $password === '') {
        json_response(400, ['error' => 'Введите логин и пароль']);
    }

    $stmt = $db->prepare("
        SELECT e.*, r.slug as role_slug, r.name as role_name, r.permissions,
               d.name as department_name, c.name as company_name
        FROM employees e
        JOIN roles r ON r.id = e.role_id
        LEFT JOIN departments d ON d.id = e.department_id
        LEFT JOIN companies c ON c.id = e.company_id
        WHERE (e.login = :login OR e.email = :login) AND e.status = 'active'
    ");
    $stmt->execute(['login' => $login]);
    $row = $stmt->fetch();

    if (!$row || !verify_password($password, $row['password_hash'])) {
        json_response(401, ['error' => 'Неверный логин или пароль']);
    }

    $newToken = gen_token();
    $expires = date('Y-m-d H:i:s', time() + 14 * 24 * 3600);
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';

    $stmt = $db->prepare("
        INSERT INTO sessions (employee_id, token, user_agent, ip_address, expires_at)
        VALUES (:employee_id, :token, :ua, :ip, :expires)
    ");
    $stmt->execute([
        'employee_id' => $row['id'],
        'token' => $newToken,
        'ua' => $ua,
        'ip' => $ip,
        'expires' => $expires,
    ]);

    $db->prepare("UPDATE employees SET last_login_at = NOW() WHERE id = :id")
        ->execute(['id' => $row['id']]);

    json_response(200, ['token' => $newToken, 'employee' => employee_public($row)]);
}

if ($method === 'POST' && $action === 'logout') {
    if ($token !== '') {
        $db->prepare("UPDATE sessions SET revoked_at = NOW() WHERE token = :token")
            ->execute(['token' => $token]);
    }
    json_response(200, ['ok' => true]);
}

if ($method === 'GET' && $action === 'me') {
    $emp = get_session_employee($db, $token);
    if (!$emp) {
        json_response(401, ['error' => 'Не авторизован']);
    }
    json_response(200, ['employee' => employee_public($emp)]);
}

if ($method === 'POST' && $action === 'change-password') {
    $emp = get_session_employee($db, $token);
    if (!$emp) {
        json_response(401, ['error' => 'Не авторизован']);
    }

    $newPassword = $body['newPassword'] ?? '';
    $currentPassword = $body['currentPassword'] ?? '';

    if (strlen($newPassword) < 6) {
        json_response(400, ['error' => 'Пароль должен быть не короче 6 символов']);
    }

    $stmt = $db->prepare("SELECT password_hash, must_change_password FROM employees WHERE id = :id");
    $stmt->execute(['id' => $emp['id']]);
    $row = $stmt->fetch();

    if (!$row['must_change_password']) {
        if (!verify_password($currentPassword, $row['password_hash'])) {
            json_response(400, ['error' => 'Текущий пароль указан неверно']);
        }
    }

    $newHash = hash_password($newPassword);
    $db->prepare("
        UPDATE employees SET password_hash = :hash, must_change_password = 0, updated_at = NOW()
        WHERE id = :id
    ")->execute(['hash' => $newHash, 'id' => $emp['id']]);

    json_response(200, ['ok' => true]);
}

json_response(404, ['error' => 'Неизвестное действие']);
