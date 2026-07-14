import json
import os
import base64
import uuid
from datetime import datetime, timezone

import psycopg2
import psycopg2.extras
import boto3


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
# CLIENT OBJECTS (мультиобъекты клиента)
# ============================================================

def client_object_row(row: dict) -> dict:
    return {
        'id': row['id'], 'clientId': row['client_id'], 'objectType': row.get('object_type'),
        'address': row.get('address'), 'label': row.get('label'), 'comment': row.get('comment'),
        'isPrimary': row.get('is_primary'), 'createdAt': row.get('created_at'),
    }


def handle_client_objects(cur, conn, current, method, params, body):
    if method == 'GET':
        client_id = params.get('clientId')
        if not client_id:
            return resp(400, {'error': 'Укажите clientId'})
        cur.execute(
            "SELECT * FROM client_objects WHERE client_id = %s ORDER BY is_primary DESC, id",
            (client_id,)
        )
        return resp(200, {'objects': [client_object_row(dict(r)) for r in cur.fetchall()]})

    if method == 'POST':
        client_id = body.get('clientId')
        address = (body.get('address') or '').strip()
        if not client_id or not address:
            return resp(400, {'error': 'Укажите клиента и адрес объекта'})
        is_primary = bool(body.get('isPrimary'))
        if is_primary:
            cur.execute("UPDATE client_objects SET is_primary = FALSE WHERE client_id = %s", (client_id,))
        cur.execute("""
            INSERT INTO client_objects (client_id, object_type, address, label, comment, is_primary)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING *
        """, (client_id, body.get('objectType'), address, body.get('label'), body.get('comment'), is_primary))
        row = cur.fetchone()
        conn.commit()
        return resp(201, {'object': client_object_row(dict(row))})

    if method == 'PUT':
        obj_id = body.get('id') or params.get('id')
        if not obj_id:
            return resp(400, {'error': 'Не указан id объекта'})
        cur.execute("SELECT client_id FROM client_objects WHERE id = %s", (obj_id,))
        existing = cur.fetchone()
        if not existing:
            return resp(404, {'error': 'Объект не найден'})
        if body.get('isPrimary'):
            cur.execute("UPDATE client_objects SET is_primary = FALSE WHERE client_id = %s", (existing['client_id'],))
        fields, values = [], []
        mapping = {
            'objectType': 'object_type', 'address': 'address', 'label': 'label',
            'comment': 'comment', 'isPrimary': 'is_primary',
        }
        for key, col in mapping.items():
            if key in body:
                fields.append(f"{col} = %s")
                values.append(body[key])
        if not fields:
            return resp(400, {'error': 'Нет данных для обновления'})
        fields.append("updated_at = now()")
        values.append(obj_id)
        cur.execute(f"UPDATE client_objects SET {', '.join(fields)} WHERE id = %s RETURNING *", values)
        row = cur.fetchone()
        conn.commit()
        return resp(200, {'object': client_object_row(dict(row))})

    if method == 'DELETE':
        obj_id = params.get('id') or body.get('id')
        if not obj_id:
            return resp(400, {'error': 'Не указан id объекта'})
        cur.execute("DELETE FROM client_objects WHERE id = %s", (obj_id,))
        conn.commit()
        return resp(200, {'ok': True})

    return resp(405, {'error': 'Метод не поддерживается'})


# ============================================================
# DEALS
# ============================================================

def deal_row(row: dict) -> dict:
    return {
        'id': row['id'], 'clientId': row['client_id'], 'clientName': row.get('client_name'),
        'stageId': row['stage_id'], 'stageSlug': row.get('stage_slug'), 'stageName': row.get('stage_name'),
        'objectAddress': row.get('object_address'), 'clientObjectId': row.get('client_object_id'),
        'sum': float(row['sum']) if row.get('sum') is not None else None,
        'managerId': row.get('manager_id'), 'managerName': row.get('manager_name'),
        'companyId': row.get('company_id'), 'source': row.get('source'), 'tag': row.get('tag'),
        'taskNote': row.get('task_note'), 'isOverdue': row.get('is_overdue'),
        'comment': row.get('comment'), 'stageEnteredAt': row.get('stage_entered_at'),
        'createdAt': row.get('created_at'), 'daysInStage': row.get('days_in_stage'),
    }


DEAL_SELECT = """
    d.id, d.client_id, d.stage_id, d.object_address, d.client_object_id, d.sum, d.manager_id, d.company_id,
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
        cur.execute("SELECT * FROM client_objects WHERE client_id = %s ORDER BY is_primary DESC, id", (row['client_id'],))
        client_objects = [client_object_row(dict(r)) for r in cur.fetchall()]
        data = deal_row(dict(row))
        data['tasks'] = tasks
        data['history'] = history
        data['clientPhone'] = client.get('phone')
        data['clientEmail'] = client.get('email')
        data['objectType'] = client.get('object_type')
        data['clientObjects'] = client_objects
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
            'isOverdue': 'is_overdue', 'comment': 'comment', 'clientObjectId': 'client_object_id',
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


# ============================================================
# CHAT
# ============================================================

def get_s3_client():
    return boto3.client(
        's3', endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def channel_row(row: dict) -> dict:
    return {
        'id': row['id'], 'name': row.get('name'), 'channelType': row.get('channel_type'),
        'icon': row.get('icon'), 'unreadCount': row.get('unread_count') or 0,
        'lastMessage': row.get('last_message'), 'lastMessageAt': row.get('last_message_at'),
        'memberCount': row.get('member_count') or 0,
    }


def message_row(row: dict) -> dict:
    return {
        'id': row['id'], 'channelId': row['channel_id'], 'employeeId': row['employee_id'],
        'employeeName': row.get('employee_name'), 'text': row.get('text'),
        'fileUrl': row.get('file_url'), 'fileName': row.get('file_name'),
        'fileSize': row.get('file_size'), 'fileType': row.get('file_type'),
        'createdAt': row.get('created_at'),
    }


def handle_chat(cur, conn, current, method, params, body, action):
    emp_id = current['id']

    if method == 'GET' and action == 'channels':
        cur.execute("""
            SELECT c.id, c.name, c.channel_type, c.icon,
                   (SELECT COUNT(*) FROM chat_members m2 WHERE m2.channel_id = c.id) as member_count,
                   (SELECT text FROM chat_messages msg WHERE msg.channel_id = c.id ORDER BY msg.created_at DESC LIMIT 1) as last_message,
                   (SELECT created_at FROM chat_messages msg WHERE msg.channel_id = c.id ORDER BY msg.created_at DESC LIMIT 1) as last_message_at,
                   (SELECT COUNT(*) FROM chat_messages msg WHERE msg.channel_id = c.id
                        AND msg.created_at > COALESCE(m.last_read_at, '1970-01-01'::timestamptz)
                        AND msg.employee_id != %s) as unread_count
            FROM chat_channels c
            JOIN chat_members m ON m.channel_id = c.id AND m.employee_id = %s
            ORDER BY last_message_at DESC NULLS LAST
        """, (emp_id, emp_id))
        return resp(200, {'channels': [channel_row(dict(r)) for r in cur.fetchall()]})

    if method == 'GET' and action == 'members':
        channel_id = params.get('channelId')
        cur.execute("""
            SELECT e.id, e.first_name, e.last_name, r.name as role_name
            FROM chat_members m JOIN employees e ON e.id = m.employee_id
            LEFT JOIN roles r ON r.id = e.role_id
            WHERE m.channel_id = %s ORDER BY e.first_name
        """, (channel_id,))
        return resp(200, {'members': [dict(r) for r in cur.fetchall()]})

    if method == 'GET' and action == 'employees-for-chat':
        cur.execute("SELECT id, first_name, last_name FROM employees WHERE status = 'active' AND id != %s ORDER BY first_name", (emp_id,))
        return resp(200, {'employees': [dict(r) for r in cur.fetchall()]})

    if method == 'GET':
        channel_id = params.get('channelId')
        if not channel_id:
            return resp(400, {'error': 'Укажите channelId'})
        cur.execute("SELECT 1 FROM chat_members WHERE channel_id = %s AND employee_id = %s", (channel_id, emp_id))
        if not cur.fetchone():
            return resp(403, {'error': 'Нет доступа к этому каналу'})
        cur.execute("""
            SELECT msg.id, msg.channel_id, msg.employee_id, msg.text, msg.file_url, msg.file_name,
                   msg.file_size, msg.file_type, msg.created_at,
                   e.first_name || ' ' || e.last_name as employee_name
            FROM chat_messages msg JOIN employees e ON e.id = msg.employee_id
            WHERE msg.channel_id = %s ORDER BY msg.created_at ASC LIMIT 200
        """, (channel_id,))
        messages = [message_row(dict(r)) for r in cur.fetchall()]
        cur.execute("UPDATE chat_members SET last_read_at = now() WHERE channel_id = %s AND employee_id = %s", (channel_id, emp_id))
        conn.commit()
        return resp(200, {'messages': messages})

    if method == 'POST' and action == 'create-channel':
        name = (body.get('name') or '').strip()
        channel_type = body.get('channelType', 'group')
        member_ids = body.get('memberIds') or []
        if channel_type == 'group' and not name:
            return resp(400, {'error': 'Укажите название группы'})
        cur.execute(
            "INSERT INTO chat_channels (name, channel_type, icon, created_by) VALUES (%s, %s, %s, %s) RETURNING id",
            (name or None, channel_type, body.get('icon', 'Users'), emp_id)
        )
        channel_id = cur.fetchone()['id']
        all_members = set(member_ids) | {emp_id}
        for m_id in all_members:
            cur.execute("INSERT INTO chat_members (channel_id, employee_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (channel_id, m_id))
        conn.commit()
        return resp(201, {'channelId': channel_id})

    if method == 'POST' and action == 'send':
        channel_id = body.get('channelId')
        text = (body.get('text') or '').strip()
        file_data = body.get('fileData')
        file_name = body.get('fileName')
        if not channel_id:
            return resp(400, {'error': 'Укажите channelId'})
        cur.execute("SELECT 1 FROM chat_members WHERE channel_id = %s AND employee_id = %s", (channel_id, emp_id))
        if not cur.fetchone():
            return resp(403, {'error': 'Нет доступа к этому каналу'})
        if not text and not file_data:
            return resp(400, {'error': 'Сообщение не может быть пустым'})

        file_url = None
        file_size = None
        file_type = body.get('fileType')
        if file_data and file_name:
            s3 = get_s3_client()
            raw = base64.b64decode(file_data.split(',')[-1])
            file_size = len(raw)
            ext = file_name.rsplit('.', 1)[-1] if '.' in file_name else 'bin'
            key = f"chat/{uuid.uuid4().hex}.{ext}"
            s3.put_object(Bucket='files', Key=key, Body=raw, ContentType=file_type or 'application/octet-stream')
            file_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        cur.execute("""
            INSERT INTO chat_messages (channel_id, employee_id, text, file_url, file_name, file_size, file_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, created_at
        """, (channel_id, emp_id, text or None, file_url, file_name, file_size, file_type))
        new_row = cur.fetchone()
        cur.execute("UPDATE chat_members SET last_read_at = now() WHERE channel_id = %s AND employee_id = %s", (channel_id, emp_id))
        conn.commit()

        cur.execute("SELECT first_name, last_name FROM employees WHERE id = %s", (emp_id,))
        emp = cur.fetchone()
        return resp(201, {'message': message_row({
            'id': new_row['id'], 'channel_id': channel_id, 'employee_id': emp_id,
            'employee_name': f"{emp['first_name']} {emp['last_name']}", 'text': text,
            'file_url': file_url, 'file_name': file_name, 'file_size': file_size,
            'file_type': file_type, 'created_at': new_row['created_at'],
        })})

    return resp(405, {'error': 'Метод не поддерживается'})


# ============================================================
# MARKETING
# ============================================================

def handle_marketing(cur, conn, current, method, params, body):
    if method == 'GET':
        cur.execute("SELECT id, name, channel_type, color FROM marketing_sources ORDER BY name")
        sources = [{'id': r['id'], 'name': r['name'], 'channelType': r.get('channel_type'), 'color': r.get('color')} for r in cur.fetchall()]
        cur.execute("""
            SELECT mb.id, mb.source_id, ms.name as source_name, mb.company_id, mb.period_month,
                   mb.budget_sum, mb.leads_count
            FROM marketing_budgets mb JOIN marketing_sources ms ON ms.id = mb.source_id
            ORDER BY mb.period_month DESC, mb.budget_sum DESC
        """)
        budgets = [{
            'id': r['id'], 'sourceId': r['source_id'], 'sourceName': r['source_name'],
            'companyId': r.get('company_id'), 'periodMonth': r['period_month'],
            'budgetSum': float(r['budget_sum']) if r.get('budget_sum') is not None else 0,
            'leadsCount': r.get('leads_count') or 0,
        } for r in cur.fetchall()]
        cur.execute("""
            SELECT d.source, COUNT(*) as leads_count, COALESCE(SUM(d.sum), 0) as total_sum
            FROM deals d WHERE d.source IS NOT NULL GROUP BY d.source ORDER BY leads_count DESC
        """)
        deal_sources = [{
            'source': r['source'], 'leadsCount': r['leads_count'],
            'totalSum': float(r['total_sum']) if r.get('total_sum') is not None else 0,
        } for r in cur.fetchall()]
        return resp(200, {'sources': sources, 'budgets': budgets, 'dealSources': deal_sources})

    if method == 'POST':
        source_id = body.get('sourceId')
        budget_sum = body.get('budgetSum')
        period_month = body.get('periodMonth')
        if not source_id or not period_month:
            return resp(400, {'error': 'Укажите источник и период'})
        cur.execute("""
            INSERT INTO marketing_budgets (source_id, company_id, period_month, budget_sum, leads_count)
            VALUES (%s, %s, %s, %s, %s) RETURNING id
        """, (source_id, body.get('companyId'), period_month, budget_sum or 0, body.get('leadsCount', 0)))
        new_id = cur.fetchone()['id']
        conn.commit()
        return resp(201, {'id': new_id})

    return resp(405, {'error': 'Метод не поддерживается'})


# ============================================================
# REPORTS
# ============================================================

def handle_reports(cur, conn, current, method, params, body):
    if method != 'GET':
        return resp(405, {'error': 'Метод не поддерживается'})

    cur.execute("SELECT COUNT(*) as c, COALESCE(SUM(sum),0) as s FROM deals")
    deals_agg = dict(cur.fetchone())
    cur.execute("SELECT COUNT(*) as c FROM deals WHERE stage_id = (SELECT id FROM deal_stages WHERE slug='done')")
    deals_won = dict(cur.fetchone())
    cur.execute("SELECT COUNT(*) as c, COALESCE(SUM(sum),0) as s FROM orders")
    orders_agg = dict(cur.fetchone())
    cur.execute("SELECT COUNT(*) as c FROM orders WHERE is_overdue = TRUE")
    orders_overdue = dict(cur.fetchone())
    cur.execute("SELECT COALESCE(SUM(sum),0) as income FROM payments WHERE payment_type='income'")
    income = dict(cur.fetchone())
    cur.execute("SELECT COALESCE(SUM(sum),0) as expense FROM payments WHERE payment_type='expense'")
    expense = dict(cur.fetchone())
    cur.execute("""
        SELECT e.id, e.first_name || ' ' || e.last_name as name, COUNT(d.id) as deals_count,
               COALESCE(SUM(d.sum),0) as deals_sum
        FROM employees e LEFT JOIN deals d ON d.manager_id = e.id
        WHERE e.status = 'active' GROUP BY e.id ORDER BY deals_sum DESC LIMIT 10
    """)
    top_managers = [dict(r) for r in cur.fetchall()]
    cur.execute("""
        SELECT st.name as stage_name, COUNT(d.id) as count
        FROM deal_stages st LEFT JOIN deals d ON d.stage_id = st.id
        GROUP BY st.id, st.name, st.sort_order ORDER BY st.sort_order
    """)
    funnel = [dict(r) for r in cur.fetchall()]
    cur.execute("""
        SELECT w.name as workshop_name, COUNT(pt.id) as tasks_count, AVG(pt.progress_pct) as avg_progress
        FROM workshops w LEFT JOIN production_tasks pt ON pt.workshop_id = w.id
        GROUP BY w.id, w.name ORDER BY w.sort_order
    """)
    workshops = [dict(r) for r in cur.fetchall()]

    return resp(200, {
        'dealsCount': deals_agg['c'], 'dealsSum': float(deals_agg['s']), 'dealsWon': deals_won['c'],
        'ordersCount': orders_agg['c'], 'ordersSum': float(orders_agg['s']), 'ordersOverdue': orders_overdue['c'],
        'income': float(income['income']), 'expense': float(expense['expense']),
        'topManagers': [{'id': m['id'], 'name': m['name'], 'dealsCount': m['deals_count'], 'dealsSum': float(m['deals_sum'])} for m in top_managers],
        'funnel': [{'stageName': f['stage_name'], 'count': f['count']} for f in funnel],
        'workshops': [{'name': w['workshop_name'], 'tasksCount': w['tasks_count'], 'avgProgress': round(float(w['avg_progress']), 1) if w['avg_progress'] else 0} for w in workshops],
    })


def handler(event: dict, context) -> dict:
    """CRM: клиенты, объекты клиентов, сделки, чат сотрудников, маркетинг, отчёты.
    Роутинг через ?resource=clients|clientObjects|deals|chat|marketing|reports&action=..."""
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
        if resource == 'clientObjects':
            return handle_client_objects(cur, conn, current, method, params, body)
        if resource == 'deals':
            return handle_deals(cur, conn, current, method, params, body, action)
        if resource == 'chat':
            return handle_chat(cur, conn, current, method, params, body, action)
        if resource == 'marketing':
            return handle_marketing(cur, conn, current, method, params, body)
        if resource == 'reports':
            return handle_reports(cur, conn, current, method, params, body)

        return resp(404, {'error': 'Неизвестный ресурс'})
    finally:
        conn.close()
