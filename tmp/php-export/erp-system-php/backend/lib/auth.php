<?php
/**
 * Утилиты авторизации: хеширование паролей, генерация токенов, проверка сессии.
 *
 * Формат хеша пароля идентичен исходной Python-версии: "salt$hash",
 * где hash = PBKDF2-HMAC-SHA256(password, salt, 200000 итераций, 32 байта), в hex.
 * Это позволяет переносить пароли между версиями без сброса.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

const PBKDF2_ITERATIONS = 200000;
// hash_pbkdf2() с raw_output=false: параметр length означает количество HEX-символов
// на выходе, а не байт. Python-версия использует pbkdf2_hmac(...) с длиной ключа 32 байта,
// что в hex-представлении даёт 64 символа — поэтому здесь length=64.
const PBKDF2_HEX_LENGTH = 64;

function hash_password(string $password, ?string $salt = null): string
{
    if ($salt === null) {
        $salt = bin2hex(random_bytes(16));
    }
    $dk = hash_pbkdf2('sha256', $password, $salt, PBKDF2_ITERATIONS, PBKDF2_HEX_LENGTH, false);
    return $salt . '$' . $dk;
}

function verify_password(string $password, ?string $storedHash): bool
{
    if (!$storedHash || !str_contains($storedHash, '$')) {
        return false;
    }
    [$salt] = explode('$', $storedHash, 2);
    $candidate = hash_password($password, $salt);
    return hash_equals($storedHash, $candidate);
}

function gen_token(): string
{
    return bin2hex(random_bytes(32));
}

function gen_temp_password(): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    $result = '';
    for ($i = 0; $i < 10; $i++) {
        $result .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return $result;
}

/**
 * Проверяет токен сессии и возвращает данные текущего сотрудника (с ролью и правами),
 * либо null, если сессия невалидна/просрочена/отозвана.
 */
function get_session_employee(PDO $db, string $token): ?array
{
    if ($token === '') {
        return null;
    }
    $stmt = $db->prepare("
        SELECT s.id as session_id, s.expires_at, s.revoked_at,
               e.id, e.first_name, e.last_name, e.middle_name, e.email, e.phone,
               e.login, e.must_change_password, e.role_id, e.department_id,
               e.company_id, e.avatar_url, e.status,
               r.slug as role_slug, r.name as role_name, r.permissions,
               d.name as department_name, c.name as company_name
        FROM sessions s
        JOIN employees e ON e.id = s.employee_id
        JOIN roles r ON r.id = e.role_id
        LEFT JOIN departments d ON d.id = e.department_id
        LEFT JOIN companies c ON c.id = e.company_id
        WHERE s.token = :token
    ");
    $stmt->execute(['token' => $token]);
    $row = $stmt->fetch();
    if (!$row) {
        return null;
    }
    if ($row['revoked_at'] !== null) {
        return null;
    }
    if (strtotime($row['expires_at']) < time()) {
        return null;
    }
    $row['permissions'] = json_decode($row['permissions'] ?? '[]', true) ?: [];
    return $row;
}

/**
 * Проверяет, есть ли у сотрудника право управлять персоналом
 * (роль owner/admin, либо явное разрешение '*' или 'staff.edit').
 */
function can_manage_staff(?array $emp): bool
{
    if (!$emp) {
        return false;
    }
    if (in_array($emp['role_slug'] ?? '', ['owner', 'admin'], true)) {
        return true;
    }
    $perms = $emp['permissions'] ?? [];
    return in_array('*', $perms, true) || in_array('staff.edit', $perms, true);
}
