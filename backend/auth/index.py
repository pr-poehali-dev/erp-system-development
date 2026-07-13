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


def verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash or '$' not in stored_hash:
        return False
    salt, _ = stored_hash.split('$', 1)
    candidate = hash_password(password, salt)
    return secrets.compare_digest(candidate, stored_hash)


def gen_token() -> str:
    return secrets.token_hex(32)


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization, X-User-Id',
    'Access-Control-Max-Age': '86400',
}


def resp(status: int, body: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, ensure_ascii=False, default=str),
        'isBase64Encoded': False,
    }


def employee_public(row: dict) -> dict:
    return {
        'id': row['id'],
        'firstName': row['first_name'],
        'lastName': row['last_name'],
        'middleName': row.get('middle_name'),
        'email': row['email'],
        'phone': row.get('phone'),
        'login': row['login'],
        'mustChangePassword': row['must_change_password'],
        'roleId': row['role_id'],
        'roleSlug': row.get('role_slug'),
        'roleName': row.get('role_name'),
        'permissions': row.get('permissions'),
        'departmentId': row.get('department_id'),
        'departmentName': row.get('department_name'),
        'companyId': row.get('company_id'),
        'companyName': row.get('company_name'),
        'avatarUrl': row.get('avatar_url'),
        'status': row['status'],
    }


def get_session_employee(cur, token: str):
    if not token:
        return None
    cur.execute("""
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
        WHERE s.token = %s
    """, (token,))
    row = cur.fetchone()
    if not row:
        return None
    if row['revoked_at'] is not None:
        return None
    if row['expires_at'] < datetime.now(timezone.utc):
        return None
    return dict(row)


def handler(event: dict, context) -> dict:
    """Авторизация сотрудников: вход по логину/паролю, сессии, смена пароля, выход, проверка текущего пользователя."""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    body_raw = event.get('body') or '{}'
    try:
        body = json.loads(body_raw) if body_raw else {}
    except json.JSONDecodeError:
        body = {}

    headers = event.get('headers') or {}
    token = headers.get('X-Authorization') or headers.get('x-authorization') or ''
    if token.lower().startswith('bearer '):
        token = token[7:]

    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if method == 'POST' and action == 'login':
            login = (body.get('login') or '').strip()
            password = body.get('password') or ''
            if not login or not password:
                return resp(400, {'error': 'Введите логин и пароль'})

            cur.execute("""
                SELECT e.*, r.slug as role_slug, r.name as role_name, r.permissions,
                       d.name as department_name, c.name as company_name
                FROM employees e
                JOIN roles r ON r.id = e.role_id
                LEFT JOIN departments d ON d.id = e.department_id
                LEFT JOIN companies c ON c.id = e.company_id
                WHERE (e.login = %s OR e.email = %s) AND e.status = 'active'
            """, (login, login))
            row = cur.fetchone()
            if not row or not verify_password(password, row['password_hash']):
                return resp(401, {'error': 'Неверный логин или пароль'})

            new_token = gen_token()
            expires = datetime.now(timezone.utc) + timedelta(days=14)
            ip = (event.get('requestContext', {}) or {}).get('identity', {}).get('sourceIp', '')
            ua = headers.get('User-Agent') or headers.get('user-agent') or ''
            cur.execute("""
                INSERT INTO sessions (employee_id, token, user_agent, ip_address, expires_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (row['id'], new_token, ua, ip, expires))
            cur.execute("UPDATE employees SET last_login_at = now() WHERE id = %s", (row['id'],))
            conn.commit()

            data = employee_public(dict(row))
            return resp(200, {'token': new_token, 'employee': data})

        if method == 'POST' and action == 'logout':
            if token:
                cur.execute("UPDATE sessions SET revoked_at = now() WHERE token = %s", (token,))
                conn.commit()
            return resp(200, {'ok': True})

        if method == 'GET' and action == 'me':
            emp = get_session_employee(cur, token)
            if not emp:
                return resp(401, {'error': 'Не авторизован'})
            return resp(200, {'employee': employee_public(emp)})

        if method == 'POST' and action == 'change-password':
            emp = get_session_employee(cur, token)
            if not emp:
                return resp(401, {'error': 'Не авторизован'})

            new_password = body.get('newPassword') or ''
            current_password = body.get('currentPassword') or ''

            if len(new_password) < 6:
                return resp(400, {'error': 'Пароль должен быть не короче 6 символов'})

            cur.execute("SELECT password_hash, must_change_password FROM employees WHERE id = %s", (emp['id'],))
            row = cur.fetchone()

            if not row['must_change_password']:
                if not verify_password(current_password, row['password_hash']):
                    return resp(400, {'error': 'Текущий пароль указан неверно'})

            new_hash = hash_password(new_password)
            cur.execute(
                "UPDATE employees SET password_hash = %s, must_change_password = FALSE, updated_at = now() WHERE id = %s",
                (new_hash, emp['id'])
            )
            conn.commit()
            return resp(200, {'ok': True})

        return resp(404, {'error': 'Неизвестное действие'})
    finally:
        conn.close()


