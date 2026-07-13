import json
import os
from datetime import datetime, timezone

import psycopg2
import psycopg2.extras


def get_conn():
    dsn = os.environ['DATABASE_URL']
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return psycopg2.connect(dsn, options=f'-c search_path={schema}')


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
        FROM sessions s JOIN employees e ON e.id = s.employee_id JOIN roles r ON r.id = e.role_id
        WHERE s.token = %s
    """, (token,))
    row = cur.fetchone()
    if not row or row['revoked_at'] is not None:
        return None
    if row['expires_at'] < datetime.now(timezone.utc):
        return None
    return dict(row)


# ============================================================
# CLIENTS
# ============================================================

def client_row(row: dict) -> dict:
    full_name = f"{row['last_name']} {row['first_name']} {row.get('middle_name') or ''}".strip()
    return {
        'id': row['id'], 'firstName': row['first_name'], 'lastName': row['last_name'],
        'middleName': row.get('middle_name'), 'fullName': full_name,
        'phone': row.get('phone'), 'email': row.get('email'), 'objectType': row.get('object_type'),
        'objectAddress': row.get('object_address'), 'segment': row.get('segment'),
        'status': row.get('status'), 'managerId': row.get('manager_id'),
        'managerName': row.get('manager_name'), 'companyId': row.get('company_id'),
        'source': row.get('source'), 'comment': row.get('comment'),
        'dealsCount': row.get('deals_count') or 0,
        'dealsSum': float(row['deals_sum']) if row.get('deals_sum') is not None else 0,
        'createdAt': row.get('created_at'),
    }


CLIENT_SELECT = """
    c.id, c.first_name, c.last_name, c.middle_name, c.phone, c.email, c.object_type,
    c.object_address, c.segment, c.status, c.manager_id, c.company_id, c.source, c.comment,
    c.created_at, e.first_name || ' ' || LEFT(e.last_name,1) || '.' as manager_name,
    COUNT(d.id) as deals_count, COALESCE(SUM(d.sum), 0) as deals_sum
"""
CLIENT_JOINS = """
    FROM clients c
    LEFT JOIN employees e ON e.id = c.manager_id
    LEFT JOIN deals d ON d.client_id = c.id
"""
CLIENT_GROUP = "GROUP BY c.id, e.first_name, e.last_name"


def handle_clients(cur, conn, current, method, params, body):
    if method == 'GET':
        client_id = params.get('id')
        if client_id:
            cur.execute(f"SELECT {CLIENT_SELECT} {CLIENT_JOINS} WHERE c.id = %s {CLIENT_GROUP}", (client_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Клиент не найден'})
            return resp(200, {'client': client_row(dict(row))})
        cur.execute(f"SELECT {CLIENT_SELECT} {CLIENT_JOINS} {CLIENT_GROUP} ORDER BY c.created_at DESC")
        return resp(200, {'clients': [client_row(dict(r)) for r in cur.fetchall()]})

    if method == 'POST':
        first_name = (body.get('firstName') or '').strip()
        last_name = (body.get('lastName') or '').strip()
        if not first_name or not last_name:
            return resp(400, {'error': 'Укажите имя и фамилию клиента'})
        cur.execute("""
            INSERT INTO clients (first_name, last_name, middle_name, phone, email, object_type,
                                  object_address, segment, manager_id, company_id, source, comment)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            first_name, last_name, body.get('middleName'), body.get('phone'), body.get('email'),
            body.get('objectType'), body.get('objectAddress'), body.get('segment', 'standard'),
            body.get('managerId') or current['id'], body.get('companyId'), body.get('source'), body.get('comment')
        ))
        new_id = cur.fetchone()['id']
        conn.commit()
        cur.execute(f"SELECT {CLIENT_SELECT} {CLIENT_JOINS} WHERE c.id = %s {CLIENT_GROUP}", (new_id,))
        return resp(201, {'client': client_row(dict(cur.fetchone()))})

    if method == 'PUT':
        client_id = body.get('id') or params.get('id')
        if not client_id:
            return resp(400, {'error': 'Не указан id клиента'})
        fields, values = [], []
        mapping = {
            'firstName': 'first_name', 'lastName': 'last_name', 'middleName': 'middle_name',
            'phone': 'phone', 'email': 'email', 'objectType': 'object_type',
            'objectAddress': 'object_address', 'segment': 'segment', 'status': 'status',
            'managerId': 'manager_id', 'source': 'source', 'comment': 'comment',
        }
        for key, col in mapping.items():
            if key in body:
                fields.append(f"{col} = %s")
                values.append(body[key])
        if not fields:
            return resp(400, {'error': 'Нет данных для обновления'})
        fields.append("updated_at = now()")
        values.append(client_id)
        cur.execute(f"UPDATE clients SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        cur.execute(f"SELECT {CLIENT_SELECT} {CLIENT_JOINS} WHERE c.id = %s {CLIENT_GROUP}", (client_id,))
        return resp(200, {'client': client_row(dict(cur.fetchone()))})

    return resp(405, {'error': 'Метод не поддерживается'})


# ============================================================
# DEALS
# ============================================================

def deal_row(row: dict) -> dict:
    return {
        'id': row['id'], 'clientId': row['client_id'], 'clientName': row.get('client_name'),
        'stageId': row['stage_id'], 'stageSlug': row.get('stage_slug'), 'stageName': row.get('stage_name'),
        'objectAddress': row.get('object_address'),
        'sum': float(row['sum']) if row.get('sum') is not None else None,
        'managerId': row.get('manager_id'), 'managerName': row.get('manager_name'),
        'companyId': row.get('company_id'), 'source': row.get('source'), 'tag': row.get('tag'),
        'taskNote': row.get('task_note'), 'isOverdue': row.get('is_overdue'),
        'comment': row.get('comment'), 'stageEnteredAt': row.get('stage_entered_at'),
        'createdAt': row.get('created_at'), 'daysInStage': row.get('days_in_stage'),
    }


DEAL_SELECT = """
    d.id, d.client_id, d.stage_id, d.object_address, d.sum, d.manager_id, d.company_id,
    d.source, d.tag, d.task_note, d.is_overdue, d.comment, d.stage_entered_at, d.created_at,
    EXTRACT(DAY FROM now() - d.stage_entered_at)::int as days_in_stage,
    c.first_name || ' ' || c.last_name as client_name,
    st.slug as stage_slug, st.name as stage_name,
    e.first_name || ' ' || LEFT(e.last_name,1) || '.' as manager_name
"""
DEAL_JOINS = """
    FROM deals d
    JOIN clients c ON c.id = d.client_id
    JOIN deal_stages st ON st.id = d.stage_id
    LEFT JOIN employees e ON e.id = d.manager_id
"""


def handle_deals(cur, conn, current, method, params, body, action):
    if method == 'GET' and action == 'detail':
        deal_id = params.get('id')
        cur.execute(f"SELECT {DEAL_SELECT} {DEAL_JOINS} WHERE d.id = %s", (deal_id,))
        row = cur.fetchone()
        if not row:
            return resp(404, {'error': 'Сделка не найдена'})
        cur.execute("SELECT id, text, done, tone, sort_order FROM deal_tasks WHERE deal_id = %s ORDER BY sort_order", (deal_id,))
        tasks = [dict(r) for r in cur.fetchall()]
        cur.execute("""
            SELECT dh.id, dh.event_text, dh.created_at, e.first_name || ' ' || LEFT(e.last_name,1) || '.' as employee_name
            FROM deal_history dh LEFT JOIN employees e ON e.id = dh.employee_id
            WHERE dh.deal_id = %s ORDER BY dh.created_at DESC
        """, (deal_id,))
        history = [dict(r) for r in cur.fetchall()]
        cur.execute("SELECT phone, email, object_type FROM clients WHERE id = %s", (row['client_id'],))
        client = dict(cur.fetchone() or {})
        data = deal_row(dict(row))
        data['tasks'] = tasks
        data['history'] = history
        data['clientPhone'] = client.get('phone')
        data['clientEmail'] = client.get('email')
        data['objectType'] = client.get('object_type')
        return resp(200, {'deal': data})

    if method == 'GET':
        cur.execute(f"SELECT {DEAL_SELECT} {DEAL_JOINS} ORDER BY d.created_at DESC")
        deals = [deal_row(dict(r)) for r in cur.fetchall()]
        cur.execute("SELECT id, slug, name, color, sort_order, is_final, is_won FROM deal_stages ORDER BY sort_order")
        stages = [dict(r) for r in cur.fetchall()]
        return resp(200, {'deals': deals, 'stages': stages})

    if method == 'POST' and action == 'move-stage':
        deal_id = body.get('id')
        stage_id = body.get('stageId')
        cur.execute("UPDATE deals SET stage_id = %s, stage_entered_at = now(), updated_at = now() WHERE id = %s", (stage_id, deal_id))
        cur.execute("SELECT name FROM deal_stages WHERE id = %s", (stage_id,))
        stage_name = cur.fetchone()['name']
        cur.execute("INSERT INTO deal_history (deal_id, employee_id, event_text) VALUES (%s, %s, %s)",
                    (deal_id, current['id'], f"Переведена на этап «{stage_name}»"))
        conn.commit()
        return resp(200, {'ok': True})

    if method == 'POST' and action == 'comment':
        deal_id = body.get('id')
        text = (body.get('text') or '').strip()
        if not text:
            return resp(400, {'error': 'Текст комментария не может быть пустым'})
        cur.execute("INSERT INTO deal_history (deal_id, employee_id, event_text) VALUES (%s, %s, %s)",
                    (deal_id, current['id'], text))
        conn.commit()
        return resp(201, {'ok': True})

    if method == 'POST':
        client_id = body.get('clientId')
        first_name = (body.get('firstName') or '').strip()
        last_name = (body.get('lastName') or '').strip()
        phone = (body.get('phone') or '').strip()
        source = body.get('source')
        object_address = body.get('objectAddress')
        item_type = body.get('itemType')
        manager_id = body.get('managerId') or current['id']

        if not client_id and (first_name or last_name):
            cur.execute("""
                INSERT INTO clients (first_name, last_name, phone, source, object_type, manager_id, company_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (first_name, last_name, phone, source, item_type, manager_id, body.get('companyId')))
            client_id = cur.fetchone()['id']

        if not client_id:
            return resp(400, {'error': 'Не указан клиент'})

        cur.execute("SELECT id FROM deal_stages WHERE slug = 'lead'")
        lead_stage_id = cur.fetchone()['id']
        cur.execute("""
            INSERT INTO deals (client_id, stage_id, object_address, manager_id, company_id, source, comment)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (client_id, lead_stage_id, object_address, manager_id, body.get('companyId'), source, body.get('comment')))
        deal_id = cur.fetchone()['id']
        cur.execute("INSERT INTO deal_history (deal_id, employee_id, event_text) VALUES (%s, %s, %s)",
                    (deal_id, current['id'], 'Сделка создана'))
        conn.commit()
        cur.execute(f"SELECT {DEAL_SELECT} {DEAL_JOINS} WHERE d.id = %s", (deal_id,))
        return resp(201, {'deal': deal_row(dict(cur.fetchone()))})

    if method == 'PUT':
        deal_id = body.get('id') or params.get('id')
        if not deal_id:
            return resp(400, {'error': 'Не указан id сделки'})
        fields, values = [], []
        mapping = {
            'objectAddress': 'object_address', 'sum': 'sum', 'managerId': 'manager_id',
            'source': 'source', 'tag': 'tag', 'taskNote': 'task_note',
            'isOverdue': 'is_overdue', 'comment': 'comment',
        }
        for key, col in mapping.items():
            if key in body:
                fields.append(f"{col} = %s")
                values.append(body[key])
        if not fields:
            return resp(400, {'error': 'Нет данных для обновления'})
        fields.append("updated_at = now()")
        values.append(deal_id)
        cur.execute(f"UPDATE deals SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        cur.execute(f"SELECT {DEAL_SELECT} {DEAL_JOINS} WHERE d.id = %s", (deal_id,))
        return resp(200, {'deal': deal_row(dict(cur.fetchone()))})

    return resp(405, {'error': 'Метод не поддерживается'})


def handler(event: dict, context) -> dict:
    """CRM: клиенты и сделки/воронка продаж. Роутинг через ?resource=clients|deals&action=..."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Authorization') or headers.get('x-authorization') or ''
    if token.lower().startswith('bearer '):
        token = token[7:]

    params = event.get('queryStringParameters') or {}
    resource = params.get('resource', 'deals')
    action = params.get('action', '')
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

        if resource == 'clients':
            return handle_clients(cur, conn, current, method, params, body)
        if resource == 'deals':
            return handle_deals(cur, conn, current, method, params, body, action)

        return resp(404, {'error': 'Неизвестный ресурс'})
    finally:
        conn.close()
