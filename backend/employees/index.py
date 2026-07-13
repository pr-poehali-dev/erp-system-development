import json
import os
import hashlib
import binascii
import secrets
from datetime import datetime, timedelta, timezone

import psycopg2
import psycopg2.extras


def get_conn():
    dsn = os.environ['DATABASE_URL']
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(dsn, options=f'-c search_path={schema}')
    return conn


def hash_password(password: str, salt: str = None) -> str:
    if salt is None:
        salt = binascii.hexlify(os.urandom(16)).decode()
    dk = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 200000)
    return f"{salt}${binascii.hexlify(dk).decode()}"


def gen_temp_password() -> str:
    alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    return ''.join(secrets.choice(alphabet) for _ in range(10))


def slugify_login(first_name: str, last_name: str, cur) -> str:
    translit_map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    }

    def translit(s: str) -> str:
        return ''.join(translit_map.get(ch, ch) for ch in s.lower())

    base = f"{translit(last_name)}.{translit(first_name)}"
    base = ''.join(c for c in base if c.isalnum() or c == '.')
    login = base
    i = 1
    while True:
        cur.execute("SELECT 1 FROM employees WHERE login = %s", (login,))
        if not cur.fetchone():
            return login
        i += 1
        login = f"{base}{i}"


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization, X-User-Id',
    'Access-Control-Max-Age': '86400',
}


def resp(status: int, body) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, ensure_ascii=False, default=str),
        'isBase64Encoded': False,
    }


def get_session_employee(cur, token: str):
    if not token:
        return None
    cur.execute("""
        SELECT s.expires_at, s.revoked_at, e.id, e.role_id, r.slug as role_slug, r.permissions
        FROM sessions s
        JOIN employees e ON e.id = s.employee_id
        JOIN roles r ON r.id = e.role_id
        WHERE s.token = %s
    """, (token,))
    row = cur.fetchone()
    if not row or row['revoked_at'] is not None:
        return None
    if row['expires_at'] < datetime.now(timezone.utc):
        return None
    return dict(row)


def can_manage_staff(emp: dict) -> bool:
    if not emp:
        return False
    if emp.get('role_slug') in ('owner', 'admin'):
        return True
    perms = emp.get('permissions') or []
    return '*' in perms or 'staff.edit' in perms


def employee_row(row: dict) -> dict:
    return {
        'id': row['id'],
        'firstName': row['first_name'],
        'lastName': row['last_name'],
        'middleName': row.get('middle_name'),
        'fullName': f"{row['last_name']} {row['first_name']} {row.get('middle_name') or ''}".strip(),
        'email': row['email'],
        'phone': row.get('phone'),
        'login': row['login'],
        'mustChangePassword': row['must_change_password'],
        'roleId': row['role_id'],
        'roleSlug': row.get('role_slug'),
        'roleName': row.get('role_name'),
        'departmentId': row.get('department_id'),
        'departmentName': row.get('department_name'),
        'companyId': row.get('company_id'),
        'companyName': row.get('company_name'),
        'avatarUrl': row.get('avatar_url'),
        'status': row['status'],
        'hiredAt': row.get('hired_at'),
        'firedAt': row.get('fired_at'),
        'lastLoginAt': row.get('last_login_at'),
    }


SELECT_FIELDS = """
    e.id, e.first_name, e.last_name, e.middle_name, e.email, e.phone, e.login,
    e.must_change_password, e.role_id, e.department_id, e.company_id,
    e.avatar_url, e.status, e.hired_at, e.fired_at, e.last_login_at,
    r.slug as role_slug, r.name as role_name,
    d.name as department_name, c.name as company_name
"""

FROM_JOINS = """
    FROM employees e
    JOIN roles r ON r.id = e.role_id
    LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN companies c ON c.id = e.company_id
"""


def handler(event: dict, context) -> dict:
    """CRUD сотрудников: список, создание (с автогенерацией логина/пароля), обновление, увольнение (status=fired)."""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Authorization') or headers.get('x-authorization') or ''
    if token.lower().startswith('bearer '):
        token = token[7:]

    params = event.get('queryStringParameters') or {}
    body_raw = event.get('body') or '{}'
    try:
        body = json.loads(body_raw) if body_raw else {}
    except json.JSONDecodeError:
        body = {}

    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        current = get_session_employee(cur, token)
        if not current:
            return resp(401, {'error': 'Не авторизован'})

        if method == 'GET':
            emp_id = params.get('id')
            if emp_id:
                cur.execute(f"SELECT {SELECT_FIELDS} {FROM_JOINS} WHERE e.id = %s", (emp_id,))
                row = cur.fetchone()
                if not row:
                    return resp(404, {'error': 'Сотрудник не найден'})
                return resp(200, {'employee': employee_row(dict(row))})

            cur.execute(f"SELECT {SELECT_FIELDS} {FROM_JOINS} ORDER BY e.status = 'active' DESC, e.last_name, e.first_name")
            rows = cur.fetchall()
            cur.execute("SELECT id, name FROM departments ORDER BY sort_order")
            departments = [dict(r) for r in cur.fetchall()]
            cur.execute("SELECT id, slug, name FROM roles ORDER BY id")
            roles = [dict(r) for r in cur.fetchall()]
            cur.execute("SELECT id, slug, name FROM companies WHERE is_active ORDER BY id")
            companies = [dict(r) for r in cur.fetchall()]
            return resp(200, {
                'employees': [employee_row(dict(r)) for r in rows],
                'departments': departments,
                'roles': roles,
                'companies': companies,
            })

        if not can_manage_staff(current):
            return resp(403, {'error': 'Недостаточно прав для управления сотрудниками'})

        if method == 'POST' and params.get('action') == 'reset-password':
            emp_id = body.get('id')
            temp_password = gen_temp_password()
            password_hash = hash_password(temp_password)
            cur.execute(
                "UPDATE employees SET password_hash = %s, must_change_password = TRUE, updated_at = now() WHERE id = %s",
                (password_hash, emp_id)
            )
            conn.commit()
            return resp(200, {'tempPassword': temp_password})

        if method == 'POST':
            first_name = (body.get('firstName') or '').strip()
            last_name = (body.get('lastName') or '').strip()
            middle_name = (body.get('middleName') or '').strip() or None
            email = (body.get('email') or '').strip().lower()
            phone = (body.get('phone') or '').strip() or None
            role_id = body.get('roleId')
            department_id = body.get('departmentId')
            company_id = body.get('companyId')

            if not first_name or not last_name or not email or not role_id:
                return resp(400, {'error': 'Заполните имя, фамилию, email и роль'})

            cur.execute("SELECT 1 FROM employees WHERE email = %s", (email,))
            if cur.fetchone():
                return resp(400, {'error': 'Сотрудник с таким email уже существует'})

            login = slugify_login(first_name, last_name, cur)
            temp_password = gen_temp_password()
            password_hash = hash_password(temp_password)

            cur.execute("""
                INSERT INTO employees (first_name, last_name, middle_name, email, phone, login,
                                        password_hash, must_change_password, role_id, department_id,
                                        company_id, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, %s, %s, %s, 'active')
                RETURNING id
            """, (first_name, last_name, middle_name, email, phone, login,
                  password_hash, role_id, department_id, company_id))
            new_id = cur.fetchone()['id']
            conn.commit()

            cur.execute(f"SELECT {SELECT_FIELDS} {FROM_JOINS} WHERE e.id = %s", (new_id,))
            row = dict(cur.fetchone())
            return resp(201, {
                'employee': employee_row(row),
                'tempPassword': temp_password,
                'login': login,
            })

        if method == 'PUT':
            emp_id = body.get('id') or params.get('id')
            if not emp_id:
                return resp(400, {'error': 'Не указан id сотрудника'})

            fields = []
            values = []
            mapping = {
                'firstName': 'first_name', 'lastName': 'last_name', 'middleName': 'middle_name',
                'email': 'email', 'phone': 'phone', 'roleId': 'role_id',
                'departmentId': 'department_id', 'companyId': 'company_id', 'status': 'status',
            }
            for key, col in mapping.items():
                if key in body:
                    fields.append(f"{col} = %s")
                    values.append(body[key])

            if body.get('status') == 'fired':
                fields.append("fired_at = COALESCE(fired_at, CURRENT_DATE)")

            if not fields:
                return resp(400, {'error': 'Нет данных для обновления'})

            fields.append("updated_at = now()")
            values.append(emp_id)
            cur.execute(f"UPDATE employees SET {', '.join(fields)} WHERE id = %s", values)
            conn.commit()

            cur.execute(f"SELECT {SELECT_FIELDS} {FROM_JOINS} WHERE e.id = %s", (emp_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Сотрудник не найден'})
            return resp(200, {'employee': employee_row(dict(row))})

        return resp(405, {'error': 'Метод не поддерживается'})
    finally:
        conn.close()

