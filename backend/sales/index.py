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


def gen_code(cur, table: str, prefix: str) -> str:
    cur.execute(f"SELECT COALESCE(MAX(NULLIF(regexp_replace(code, '\\D', '', 'g'), '')::int), 1250) + 1 as next_num FROM {table}")
    n = cur.fetchone()['next_num']
    return f"{prefix}-{n}"


# ============================================================
# MEASUREMENTS (замеры + контрольные замеры)
# ============================================================

def measurement_row(row: dict) -> dict:
    return {
        'id': row['id'], 'code': row.get('code'), 'dealId': row.get('deal_id'),
        'clientId': row['client_id'], 'clientName': row.get('client_name'),
        'measureType': row.get('measure_type'), 'objectType': row.get('object_type'),
        'objectName': row.get('object_name'), 'address': row.get('address'),
        'measureDate': row.get('measure_date'),
        'measureTime': str(row['measure_time']) if row.get('measure_time') else None,
        'managerId': row.get('manager_id'), 'managerName': row.get('manager_name'),
        'status': row.get('status'), 'companyId': row.get('company_id'),
        'resultNotes': row.get('result_notes'), 'createdAt': row.get('created_at'),
    }


MEASURE_SELECT = """
    m.id, m.code, m.deal_id, m.client_id, m.measure_type, m.object_type, m.object_name,
    m.address, m.measure_date, m.measure_time, m.manager_id, m.status, m.company_id,
    m.result_notes, m.created_at,
    c.first_name || ' ' || c.last_name as client_name,
    e.first_name || ' ' || LEFT(e.last_name,1) || '.' as manager_name
"""
MEASURE_JOINS = """
    FROM measurements m
    JOIN clients c ON c.id = m.client_id
    LEFT JOIN employees e ON e.id = m.manager_id
"""


def handle_measurements(cur, conn, current, method, params, body):
    if method == 'GET':
        m_id = params.get('id')
        if m_id:
            cur.execute(f"SELECT {MEASURE_SELECT} {MEASURE_JOINS} WHERE m.id = %s", (m_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Замер не найден'})
            return resp(200, {'measurement': measurement_row(dict(row))})
        cur.execute(f"SELECT {MEASURE_SELECT} {MEASURE_JOINS} ORDER BY m.measure_date, m.measure_time")
        return resp(200, {'measurements': [measurement_row(dict(r)) for r in cur.fetchall()]})

    if method == 'POST':
        client_id = body.get('clientId')
        measure_date = body.get('measureDate')
        if not client_id or not measure_date:
            return resp(400, {'error': 'Укажите клиента и дату замера'})
        code = gen_code(cur, 'measurements', 'Z')
        cur.execute("""
            INSERT INTO measurements (code, deal_id, client_id, measure_type, object_type, object_name,
                                       address, measure_date, measure_time, manager_id, company_id, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'scheduled') RETURNING id
        """, (
            code, body.get('dealId'), client_id, body.get('measureType', 'primary'),
            body.get('objectType'), body.get('objectName'), body.get('address'),
            measure_date, body.get('measureTime'), body.get('managerId') or current['id'],
            body.get('companyId')
        ))
        new_id = cur.fetchone()['id']
        conn.commit()
        cur.execute(f"SELECT {MEASURE_SELECT} {MEASURE_JOINS} WHERE m.id = %s", (new_id,))
        return resp(201, {'measurement': measurement_row(dict(cur.fetchone()))})

    if method == 'PUT':
        m_id = body.get('id') or params.get('id')
        if not m_id:
            return resp(400, {'error': 'Не указан id замера'})
        fields, values = [], []
        mapping = {
            'status': 'status', 'resultNotes': 'result_notes', 'measureDate': 'measure_date',
            'measureTime': 'measure_time', 'managerId': 'manager_id',
        }
        for key, col in mapping.items():
            if key in body:
                fields.append(f"{col} = %s")
                values.append(body[key])
        if not fields:
            return resp(400, {'error': 'Нет данных для обновления'})
        fields.append("updated_at = now()")
        values.append(m_id)
        cur.execute(f"UPDATE measurements SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        cur.execute(f"SELECT {MEASURE_SELECT} {MEASURE_JOINS} WHERE m.id = %s", (m_id,))
        return resp(200, {'measurement': measurement_row(dict(cur.fetchone()))})

    return resp(405, {'error': 'Метод не поддерживается'})


# ============================================================
# PROPOSALS (коммерческие предложения)
# ============================================================

def proposal_row(row: dict) -> dict:
    return {
        'id': row['id'], 'code': row.get('code'), 'version': row.get('version'),
        'dealId': row.get('deal_id'), 'clientId': row['client_id'], 'clientName': row.get('client_name'),
        'itemType': row.get('item_type'), 'companyId': row.get('company_id'),
        'companyName': row.get('company_name'),
        'sum': float(row['sum']) if row.get('sum') is not None else 0,
        'discount': float(row['discount']) if row.get('discount') is not None else 0,
        'status': row.get('status'), 'managerId': row.get('manager_id'),
        'managerName': row.get('manager_name'), 'validDays': row.get('valid_days'),
        'comment': row.get('comment'), 'createdAt': row.get('created_at'),
    }


PROPOSAL_SELECT = """
    p.id, p.code, p.version, p.deal_id, p.client_id, p.item_type, p.company_id, p.sum,
    p.discount, p.status, p.manager_id, p.valid_days, p.comment, p.created_at,
    c.first_name || ' ' || c.last_name as client_name,
    co.name as company_name,
    e.first_name || ' ' || LEFT(e.last_name,1) || '.' as manager_name
"""
PROPOSAL_JOINS = """
    FROM proposals p
    JOIN clients c ON c.id = p.client_id
    LEFT JOIN companies co ON co.id = p.company_id
    LEFT JOIN employees e ON e.id = p.manager_id
"""


def handle_proposals(cur, conn, current, method, params, body):
    if method == 'GET':
        p_id = params.get('id')
        if p_id:
            cur.execute(f"SELECT {PROPOSAL_SELECT} {PROPOSAL_JOINS} WHERE p.id = %s", (p_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'КП не найдено'})
            cur.execute(
                "SELECT id, name, qty, unit, price, sum, sort_order FROM proposal_items WHERE proposal_id = %s ORDER BY sort_order",
                (p_id,)
            )
            items = [dict(r) for r in cur.fetchall()]
            data = proposal_row(dict(row))
            data['items'] = [{
                'id': i['id'], 'name': i['name'], 'qty': float(i['qty']), 'unit': i['unit'],
                'price': float(i['price']), 'sum': float(i['sum']),
            } for i in items]
            return resp(200, {'proposal': data})
        cur.execute(f"SELECT {PROPOSAL_SELECT} {PROPOSAL_JOINS} ORDER BY p.created_at DESC")
        return resp(200, {'proposals': [proposal_row(dict(r)) for r in cur.fetchall()]})

    if method == 'POST':
        client_id = body.get('clientId')
        if not client_id:
            return resp(400, {'error': 'Укажите клиента'})
        code = gen_code(cur, 'proposals', 'КП')
        cur.execute("""
            INSERT INTO proposals (code, version, deal_id, client_id, item_type, company_id, sum,
                                    discount, status, manager_id, valid_days, comment)
            VALUES (%s, 1, %s, %s, %s, %s, %s, %s, 'draft', %s, %s, %s) RETURNING id
        """, (
            code, body.get('dealId'), client_id, body.get('itemType'), body.get('companyId'),
            body.get('sum', 0), body.get('discount', 0), body.get('managerId') or current['id'],
            body.get('validDays', 14), body.get('comment')
        ))
        new_id = cur.fetchone()['id']
        items = body.get('items') or []
        for i, item in enumerate(items):
            cur.execute("""
                INSERT INTO proposal_items (proposal_id, name, qty, unit, price, sum, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (new_id, item.get('name'), item.get('qty', 1), item.get('unit', 'шт.'),
                  item.get('price', 0), item.get('sum', 0), i))
        conn.commit()
        cur.execute(f"SELECT {PROPOSAL_SELECT} {PROPOSAL_JOINS} WHERE p.id = %s", (new_id,))
        return resp(201, {'proposal': proposal_row(dict(cur.fetchone()))})

    if method == 'PUT':
        p_id = body.get('id') or params.get('id')
        if not p_id:
            return resp(400, {'error': 'Не указан id КП'})
        fields, values = [], []
        mapping = {
            'status': 'status', 'sum': 'sum', 'discount': 'discount', 'comment': 'comment',
            'validDays': 'valid_days',
        }
        for key, col in mapping.items():
            if key in body:
                fields.append(f"{col} = %s")
                values.append(body[key])
        if not fields:
            return resp(400, {'error': 'Нет данных для обновления'})
        fields.append("updated_at = now()")
        values.append(p_id)
        cur.execute(f"UPDATE proposals SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        cur.execute(f"SELECT {PROPOSAL_SELECT} {PROPOSAL_JOINS} WHERE p.id = %s", (p_id,))
        return resp(200, {'proposal': proposal_row(dict(cur.fetchone()))})

    return resp(405, {'error': 'Метод не поддерживается'})


# ============================================================
# SPECIFICATIONS (технические задания)
# ============================================================

def spec_row(row: dict) -> dict:
    return {
        'id': row['id'], 'code': row.get('code'), 'orderId': row.get('order_id'),
        'orderCode': row.get('order_code'), 'clientName': row.get('client_name'),
        'itemType': row.get('item_type'), 'designerId': row.get('designer_id'),
        'designerName': row.get('designer_name'), 'status': row.get('status'),
        'materials': row.get('materials'), 'progressPct': row.get('progress_pct'),
        'deadline': row.get('deadline'), 'drawingFileUrl': row.get('drawing_file_url'),
        'specFileUrl': row.get('spec_file_url'), 'createdAt': row.get('created_at'),
    }


SPEC_SELECT = """
    sp.id, sp.code, sp.order_id, sp.designer_id, sp.status, sp.materials, sp.progress_pct,
    sp.deadline, sp.drawing_file_url, sp.spec_file_url, sp.created_at,
    o.code as order_code, o.item_type,
    c.first_name || ' ' || c.last_name as client_name,
    e.first_name || ' ' || LEFT(e.last_name,1) || '.' as designer_name
"""
SPEC_JOINS = """
    FROM specifications sp
    JOIN orders o ON o.id = sp.order_id
    JOIN clients c ON c.id = o.client_id
    LEFT JOIN employees e ON e.id = sp.designer_id
"""


def handle_specifications(cur, conn, current, method, params, body):
    if method == 'GET':
        s_id = params.get('id')
        if s_id:
            cur.execute(f"SELECT {SPEC_SELECT} {SPEC_JOINS} WHERE sp.id = %s", (s_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'ТЗ не найдено'})
            return resp(200, {'specification': spec_row(dict(row))})
        cur.execute(f"SELECT {SPEC_SELECT} {SPEC_JOINS} ORDER BY sp.created_at DESC")
        return resp(200, {'specifications': [spec_row(dict(r)) for r in cur.fetchall()]})

    if method == 'POST':
        order_id = body.get('orderId')
        if not order_id:
            return resp(400, {'error': 'Укажите заказ'})
        code = gen_code(cur, 'specifications', 'ТЗ')
        cur.execute("""
            INSERT INTO specifications (code, order_id, designer_id, status, materials, progress_pct, deadline)
            VALUES (%s, %s, %s, 'draft', %s, 0, %s) RETURNING id
        """, (code, order_id, body.get('designerId') or current['id'], body.get('materials'), body.get('deadline')))
        new_id = cur.fetchone()['id']
        conn.commit()
        cur.execute(f"SELECT {SPEC_SELECT} {SPEC_JOINS} WHERE sp.id = %s", (new_id,))
        return resp(201, {'specification': spec_row(dict(cur.fetchone()))})

    if method == 'PUT':
        s_id = body.get('id') or params.get('id')
        if not s_id:
            return resp(400, {'error': 'Не указан id ТЗ'})
        fields, values = [], []
        mapping = {'status': 'status', 'materials': 'materials', 'progressPct': 'progress_pct', 'deadline': 'deadline'}
        for key, col in mapping.items():
            if key in body:
                fields.append(f"{col} = %s")
                values.append(body[key])
        if not fields:
            return resp(400, {'error': 'Нет данных для обновления'})
        fields.append("updated_at = now()")
        values.append(s_id)
        cur.execute(f"UPDATE specifications SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        cur.execute(f"SELECT {SPEC_SELECT} {SPEC_JOINS} WHERE sp.id = %s", (s_id,))
        return resp(200, {'specification': spec_row(dict(cur.fetchone()))})

    return resp(405, {'error': 'Метод не поддерживается'})


# ============================================================
# FINANCE (платежи, себестоимость)
# ============================================================

def payment_row(row: dict) -> dict:
    return {
        'id': row['id'], 'orderId': row.get('order_id'), 'orderCode': row.get('order_code'),
        'paymentType': row.get('payment_type'), 'category': row.get('category'),
        'sum': float(row['sum']), 'paymentDate': row.get('payment_date'),
        'companyId': row.get('company_id'), 'comment': row.get('comment'),
        'createdAt': row.get('created_at'),
    }


def handle_finance(cur, conn, current, method, params, body, action):
    if method == 'GET' and action == 'summary':
        cur.execute("SELECT COALESCE(SUM(sum),0) as v FROM payments WHERE payment_type = 'income'")
        income = float(cur.fetchone()['v'])
        cur.execute("SELECT COALESCE(SUM(sum),0) as v FROM payments WHERE payment_type = 'expense'")
        expense = float(cur.fetchone()['v'])
        cur.execute("""
            SELECT o.id, o.code, c.first_name || ' ' || c.last_name as client_name, o.item_type,
                   o.sum, COALESCE(oc.materials_cost,0) + COALESCE(oc.labor_cost,0) + COALESCE(oc.other_cost,0) as cost
            FROM orders o
            JOIN clients c ON c.id = o.client_id
            LEFT JOIN order_costs oc ON oc.order_id = o.id
            ORDER BY o.created_at DESC
        """)
        margins = []
        for r in cur.fetchall():
            r = dict(r)
            sum_v = float(r['sum'])
            cost_v = float(r['cost'])
            profit = sum_v - cost_v
            margin = (profit / sum_v * 100) if sum_v else 0
            margins.append({
                'orderId': r['id'], 'orderCode': r['code'], 'clientName': r['client_name'],
                'itemType': r['item_type'], 'sum': sum_v, 'cost': cost_v, 'profit': profit,
                'marginPct': round(margin, 1),
            })
        return resp(200, {'income': income, 'expense': expense, 'profit': income - expense, 'margins': margins})

    if method == 'GET':
        cur.execute("""
            SELECT p.id, p.order_id, p.payment_type, p.category, p.sum, p.payment_date, p.company_id,
                   p.comment, p.created_at, o.code as order_code
            FROM payments p LEFT JOIN orders o ON o.id = p.order_id
            ORDER BY p.payment_date DESC LIMIT 100
        """)
        return resp(200, {'payments': [payment_row(dict(r)) for r in cur.fetchall()]})

    if method == 'POST':
        payment_type = body.get('paymentType')
        sum_v = body.get('sum')
        if not payment_type or not sum_v:
            return resp(400, {'error': 'Укажите тип операции и сумму'})
        cur.execute("""
            INSERT INTO payments (order_id, payment_type, category, sum, payment_date, company_id, comment, created_by)
            VALUES (%s, %s, %s, %s, COALESCE(%s, CURRENT_DATE), %s, %s, %s) RETURNING id
        """, (
            body.get('orderId'), payment_type, body.get('category'), sum_v,
            body.get('paymentDate'), body.get('companyId'), body.get('comment'), current['id']
        ))
        new_id = cur.fetchone()['id']
        conn.commit()
        cur.execute("""
            SELECT p.id, p.order_id, p.payment_type, p.category, p.sum, p.payment_date, p.company_id,
                   p.comment, p.created_at, o.code as order_code
            FROM payments p LEFT JOIN orders o ON o.id = p.order_id WHERE p.id = %s
        """, (new_id,))
        return resp(201, {'payment': payment_row(dict(cur.fetchone()))})

    return resp(405, {'error': 'Метод не поддерживается'})


# ============================================================
# CONTROL MEASUREMENTS (контрольные замеры перед запуском в производство)
# ============================================================

def control_measurement_row(row: dict) -> dict:
    return {
        'id': row['id'], 'code': row.get('code'), 'orderId': row.get('order_id'),
        'orderCode': row.get('order_code'), 'measurementId': row.get('measurement_id'),
        'clientId': row['client_id'], 'clientName': row.get('client_name'),
        'objectType': row.get('object_type'), 'measureDate': row.get('measure_date'),
        'measureTime': row.get('measure_time'), 'managerId': row.get('manager_id'),
        'managerName': row.get('manager_name'), 'status': row.get('status'),
        'resultNotes': row.get('result_notes'), 'checklist': row.get('checklist') or [],
        'createdAt': row.get('created_at'),
    }


CM_SELECT = """
    cm.id, cm.code, cm.order_id, cm.measurement_id, cm.client_id, cm.object_type,
    cm.measure_date, cm.measure_time, cm.manager_id, cm.status, cm.result_notes, cm.checklist,
    cm.created_at, o.code as order_code,
    c.first_name || ' ' || c.last_name as client_name,
    e.first_name || ' ' || LEFT(e.last_name,1) || '.' as manager_name
"""
CM_JOINS = """
    FROM control_measurements cm
    JOIN clients c ON c.id = cm.client_id
    LEFT JOIN orders o ON o.id = cm.order_id
    LEFT JOIN employees e ON e.id = cm.manager_id
"""

DEFAULT_CHECKLIST = [
    {"item": "Ширина проёма соответствует чертежу", "done": False},
    {"item": "Высота потолка от чистового пола", "done": False},
    {"item": "Расположение розеток и выключателей", "done": False},
    {"item": "Расположение водопровода и канализации", "done": False},
    {"item": "Наличие вентиляционного канала", "done": False},
    {"item": "Ровность стен (отклонение ≤ 3 мм)", "done": False},
    {"item": "Напольное покрытие уложено", "done": False},
]


def handle_control_measurements(cur, conn, current, method, params, body):
    if method == 'GET':
        cm_id = params.get('id')
        if cm_id:
            cur.execute(f"SELECT {CM_SELECT} {CM_JOINS} WHERE cm.id = %s", (cm_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Контрольный замер не найден'})
            return resp(200, {'controlMeasurement': control_measurement_row(dict(row))})
        cur.execute(f"SELECT {CM_SELECT} {CM_JOINS} ORDER BY cm.measure_date DESC")
        return resp(200, {'controlMeasurements': [control_measurement_row(dict(r)) for r in cur.fetchall()]})

    if method == 'POST':
        client_id = body.get('clientId')
        measure_date = body.get('measureDate')
        if not client_id or not measure_date:
            return resp(400, {'error': 'Укажите клиента и дату замера'})
        code = gen_code(cur, 'control_measurements', 'КЗ')
        cur.execute("""
            INSERT INTO control_measurements (code, order_id, measurement_id, client_id, object_type,
                                                measure_date, measure_time, manager_id, status, checklist)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'scheduled', %s) RETURNING id
        """, (
            code, body.get('orderId'), body.get('measurementId'), client_id, body.get('objectType'),
            measure_date, body.get('measureTime'), body.get('managerId') or current['id'],
            json.dumps(body.get('checklist') or DEFAULT_CHECKLIST),
        ))
        new_id = cur.fetchone()['id']
        conn.commit()
        cur.execute(f"SELECT {CM_SELECT} {CM_JOINS} WHERE cm.id = %s", (new_id,))
        return resp(201, {'controlMeasurement': control_measurement_row(dict(cur.fetchone()))})

    if method == 'PUT':
        cm_id = body.get('id') or params.get('id')
        if not cm_id:
            return resp(400, {'error': 'Не указан id контрольного замера'})
        fields, values = [], []
        mapping = {
            'objectType': 'object_type', 'measureDate': 'measure_date', 'measureTime': 'measure_time',
            'managerId': 'manager_id', 'status': 'status', 'resultNotes': 'result_notes',
        }
        for key, col in mapping.items():
            if key in body:
                fields.append(f"{col} = %s")
                values.append(body[key])
        if 'checklist' in body:
            fields.append("checklist = %s")
            values.append(json.dumps(body['checklist']))
        if not fields:
            return resp(400, {'error': 'Нет данных для обновления'})
        fields.append("updated_at = now()")
        values.append(cm_id)
        cur.execute(f"UPDATE control_measurements SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        cur.execute(f"SELECT {CM_SELECT} {CM_JOINS} WHERE cm.id = %s", (cm_id,))
        return resp(200, {'controlMeasurement': control_measurement_row(dict(cur.fetchone()))})

    return resp(405, {'error': 'Метод не поддерживается'})


def handler(event: dict, context) -> dict:
    """Продажи и финансы: замеры, КП, ТЗ, платежи, контрольные замеры. Роутинг через ?resource=measurements|proposals|specifications|finance|controlMeasurements"""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Authorization') or headers.get('x-authorization') or ''
    if token.lower().startswith('bearer '):
        token = token[7:]

    params = event.get('queryStringParameters') or {}
    resource = params.get('resource', 'measurements')
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

        if resource == 'measurements':
            return handle_measurements(cur, conn, current, method, params, body)
        if resource == 'proposals':
            return handle_proposals(cur, conn, current, method, params, body)
        if resource == 'specifications':
            return handle_specifications(cur, conn, current, method, params, body)
        if resource == 'finance':
            return handle_finance(cur, conn, current, method, params, body, action)
        if resource == 'controlMeasurements':
            return handle_control_measurements(cur, conn, current, method, params, body)

        return resp(404, {'error': 'Неизвестный ресурс'})
    finally:
        conn.close()