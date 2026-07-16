<?php
/**
 * CRUD сотрудников: список (+справочники), создание (с автогенерацией
 * логина/пароля), обновление, увольнение (status=fired), сброс пароля.
 *
 * GET    ?id=123           -> { employee }
 * GET    (без id)          -> { employees, departments, roles, companies }
 * POST   ?action=reset-password  { id } -> { tempPassword }
 * POST                     { firstName, lastName, email, roleId, ... } -> { employee, tempPassword, login }
 * PUT                      { id, ...поля } -> { employee }
 *
 * Все действия, кроме GET-списка, требуют право управления персоналом
 * (роль owner/admin либо permission '*'/'staff.edit').
 */

declare(strict_types=1);

require_once __DIR__ . '/../../lib/http.php';
require_once __DIR__ . '/../../lib/auth.php';

handle_options();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$token = get_auth_token();
$body = read_json_body();

$db = get_db();

$current = get_session_employee($db, $token);
if (!$current) {
    json_response(401, ['error' => 'Не авторизован']);
}

const SELECT_FIELDS = "
    e.id, e.first_name, e.last_name, e.middle_name, e.email, e.phone, e.login,
    e.must_change_password, e.role_id, e.department_id, e.company_id,
    e.avatar_url, e.status, e.hired_at, e.fired_at, e.last_login_at,
    r.slug as role_slug, r.name as role_name,
    d.name as department_name, c.name as company_name
";

const FROM_JOINS = "
    FROM employees e
    JOIN roles r ON r.id = e.role_id
    LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN companies c ON c.id = e.company_id
";

function employee_row(array $row): array
{
    $fullName = trim($row['last_name'] . ' ' . $row['first_name'] . ' ' . ($row['middle_name'] ?? ''));
    return [
        'id' => (int)$row['id'],
        'firstName' => $row['first_name'],
        'lastName' => $row['last_name'],
        'middleName' => $row['middle_name'] ?? null,
        'fullName' => $fullName,
        'email' => $row['email'],
        'phone' => $row['phone'] ?? null,
        'login' => $row['login'],
        'mustChangePassword' => (bool)$row['must_change_password'],
        'roleId' => (int)$row['role_id'],
        'roleSlug' => $row['role_slug'] ?? null,
        'roleName' => $row['role_name'] ?? null,
        'departmentId' => $row['department_id'] !== null ? (int)$row['department_id'] : null,
        'departmentName' => $row['department_name'] ?? null,
        'companyId' => $row['company_id'] !== null ? (int)$row['company_id'] : null,
        'companyName' => $row['company_name'] ?? null,
        'avatarUrl' => $row['avatar_url'] ?? null,
        'status' => $row['status'],
        'hiredAt' => $row['hired_at'],
        'firedAt' => $row['fired_at'] ?? null,
        'lastLoginAt' => $row['last_login_at'] ?? null,
    ];
}

/**
 * Транслитерация кириллицы в латиницу для генерации логина (фамилия.имя).
 * При коллизии добавляется числовой суффикс (2, 3, ...).
 */
function slugify_login(string $firstName, string $lastName, PDO $db): string
{
    static $map = [
        'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'g', 'д' => 'd', 'е' => 'e', 'ё' => 'e',
        'ж' => 'zh', 'з' => 'z', 'и' => 'i', 'й' => 'y', 'к' => 'k', 'л' => 'l', 'м' => 'm',
        'н' => 'n', 'о' => 'o', 'п' => 'p', 'р' => 'r', 'с' => 's', 'т' => 't', 'у' => 'u',
        'ф' => 'f', 'х' => 'h', 'ц' => 'ts', 'ч' => 'ch', 'ш' => 'sh', 'щ' => 'sch',
        'ъ' => '', 'ы' => 'y', 'ь' => '', 'э' => 'e', 'ю' => 'yu', 'я' => 'ya',
    ];

    $translit = static function (string $s) use ($map): string {
        $s = mb_strtolower($s, 'UTF-8');
        $result = '';
        foreach (preg_split('//u', $s, -1, PREG_SPLIT_NO_EMPTY) as $ch) {
            $result .= $map[$ch] ?? $ch;
        }
        return $result;
    };

    $base = $translit($lastName) . '.' . $translit($firstName);
    $base = preg_replace('/[^a-z0-9.]/', '', $base);

    $login = $base;
    $i = 1;
    $stmt = $db->prepare("SELECT 1 FROM employees WHERE login = :login");
    while (true) {
        $stmt->execute(['login' => $login]);
        if (!$stmt->fetch()) {
            return $login;
        }
        $i++;
        $login = $base . $i;
    }
}

if ($method === 'GET') {
    $empId = $_GET['id'] ?? null;

    if ($empId) {
        $stmt = $db->prepare("SELECT " . SELECT_FIELDS . " " . FROM_JOINS . " WHERE e.id = :id");
        $stmt->execute(['id' => $empId]);
        $row = $stmt->fetch();
        if (!$row) {
            json_response(404, ['error' => 'Сотрудник не найден']);
        }
        json_response(200, ['employee' => employee_row($row)]);
    }

    $rows = $db->query("
        SELECT " . SELECT_FIELDS . " " . FROM_JOINS . "
        ORDER BY (e.status = 'active') DESC, e.last_name, e.first_name
    ")->fetchAll();

    $departments = $db->query("SELECT id, name FROM departments ORDER BY sort_order")->fetchAll();
    $roles = $db->query("SELECT id, slug, name FROM roles ORDER BY id")->fetchAll();
    $companies = $db->query("SELECT id, slug, name FROM companies WHERE is_active ORDER BY id")->fetchAll();

    json_response(200, [
        'employees' => array_map('employee_row', $rows),
        'departments' => $departments,
        'roles' => $roles,
        'companies' => $companies,
    ]);
}

if (!can_manage_staff($current)) {
    json_response(403, ['error' => 'Недостаточно прав для управления сотрудниками']);
}

if ($method === 'POST' && ($_GET['action'] ?? '') === 'reset-password') {
    $empId = $body['id'] ?? null;
    $tempPassword = gen_temp_password();
    $passwordHash = hash_password($tempPassword);

    $db->prepare("
        UPDATE employees SET password_hash = :hash, must_change_password = 1, updated_at = NOW()
        WHERE id = :id
    ")->execute(['hash' => $passwordHash, 'id' => $empId]);

    json_response(200, ['tempPassword' => $tempPassword]);
}

if ($method === 'POST') {
    $firstName = trim($body['firstName'] ?? '');
    $lastName = trim($body['lastName'] ?? '');
    $middleName = trim($body['middleName'] ?? '') ?: null;
    $email = mb_strtolower(trim($body['email'] ?? ''));
    $phone = trim($body['phone'] ?? '') ?: null;
    $roleId = $body['roleId'] ?? null;
    $departmentId = $body['departmentId'] ?? null;
    $companyId = $body['companyId'] ?? null;

    if (!$firstName || !$lastName || !$email || !$roleId) {
        json_response(400, ['error' => 'Заполните имя, фамилию, email и роль']);
    }

    $stmt = $db->prepare("SELECT 1 FROM employees WHERE email = :email");
    $stmt->execute(['email' => $email]);
    if ($stmt->fetch()) {
        json_response(400, ['error' => 'Сотрудник с таким email уже существует']);
    }

    $login = slugify_login($firstName, $lastName, $db);
    $tempPassword = gen_temp_password();
    $passwordHash = hash_password($tempPassword);

    $stmt = $db->prepare("
        INSERT INTO employees (first_name, last_name, middle_name, email, phone, login,
                                password_hash, must_change_password, role_id, department_id,
                                company_id, status)
        VALUES (:first_name, :last_name, :middle_name, :email, :phone, :login,
                :password_hash, 1, :role_id, :department_id, :company_id, 'active')
    ");
    $stmt->execute([
        'first_name' => $firstName, 'last_name' => $lastName, 'middle_name' => $middleName,
        'email' => $email, 'phone' => $phone, 'login' => $login,
        'password_hash' => $passwordHash, 'role_id' => $roleId,
        'department_id' => $departmentId, 'company_id' => $companyId,
    ]);
    $newId = (int)$db->lastInsertId();

    $stmt = $db->prepare("SELECT " . SELECT_FIELDS . " " . FROM_JOINS . " WHERE e.id = :id");
    $stmt->execute(['id' => $newId]);
    $row = $stmt->fetch();

    json_response(201, [
        'employee' => employee_row($row),
        'tempPassword' => $tempPassword,
        'login' => $login,
    ]);
}

if ($method === 'PUT') {
    $empId = $body['id'] ?? $_GET['id'] ?? null;
    if (!$empId) {
        json_response(400, ['error' => 'Не указан id сотрудника']);
    }

    $mapping = [
        'firstName' => 'first_name', 'lastName' => 'last_name', 'middleName' => 'middle_name',
        'email' => 'email', 'phone' => 'phone', 'roleId' => 'role_id',
        'departmentId' => 'department_id', 'companyId' => 'company_id', 'status' => 'status',
    ];

    $fields = [];
    $values = [];
    foreach ($mapping as $key => $col) {
        if (array_key_exists($key, $body)) {
            $fields[] = "$col = :$col";
            $values[$col] = $body[$key];
        }
    }

    if (($body['status'] ?? null) === 'fired') {
        $fields[] = "fired_at = COALESCE(fired_at, CURDATE())";
    }

    if (!$fields) {
        json_response(400, ['error' => 'Нет данных для обновления']);
    }

    $fields[] = "updated_at = NOW()";
    $values['id'] = $empId;

    $sql = "UPDATE employees SET " . implode(', ', $fields) . " WHERE id = :id";
    $db->prepare($sql)->execute($values);

    $stmt = $db->prepare("SELECT " . SELECT_FIELDS . " " . FROM_JOINS . " WHERE e.id = :id");
    $stmt->execute(['id' => $empId]);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(404, ['error' => 'Сотрудник не найден']);
    }
    json_response(200, ['employee' => employee_row($row)]);
}

json_response(405, ['error' => 'Метод не поддерживается']);
