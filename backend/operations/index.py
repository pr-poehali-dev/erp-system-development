import json
import os
from datetime import datetime, timezone, date

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
    return f"{prefix}{n}"


# ============================================================
# ORDERS (заказы)
# ============================================================

def order_row(row: dict) -> dict:
    return {
        'id': row['id'], 'code': row.get('code'), 'clientId': row['client_id'],
        'clientName': row.get('client_name'), 'dealId': row.get('deal_id'),
        'proposalId': row.get('proposal_id'), 'objectAddress': row.get('object_address'),
        'itemType': row.get('item_type'),
        'sum': float(row['sum']) if row.get('sum') is not None else 0,
        'stageId': row.get('stage_id'), 'stageSlug': row.get('stage_slug'),
        'stageName': row.get('stage_name'), 'progressPct': row.get('progress_pct'),
        'managerId': row.get('manager_id'), 'managerName': row.get('manager_name'),
        'companyId': row.get('company_id'), 'deadline': row.get('deadline'),
        'isOverdue': row.get('is_overdue'), 'comment': row.get('comment'),
        'createdAt': row.get('created_at'),
    }


ORDER_SELECT = """
    o.id, o.code, o.client_id, o.deal_id, o.proposal_id, o.object_address, o.item_type, o.sum,
    o.stage_id, o.progress_pct, o.manager_id, o.company_id, o.deadline, o.is_overdue, o.comment,
    o.created_at,
    c.first_name || ' ' || c.last_name as client_name,
    st.slug as stage_slug, st.name as stage_name,
    e.first_name || ' ' || LEFT(e.last_name,1) || '.' as manager_name
"""
ORDER_JOINS = """
    FROM orders o
    JOIN clients c ON c.id = o.client_id
    JOIN order_stages st ON st.id = o.stage_id
    LEFT JOIN employees e ON e.id = o.manager_id
"""


def handle_orders(cur, conn, current, method, params, body, action):
    if method == 'GET' and action == 'stages':
        cur.execute("SELECT id, slug, name, sort_order FROM order_stages ORDER BY sort_order")
        return resp(200, {'stages': [dict(r) for r in cur.fetchall()]})

    if method == 'GET':
        o_id = params.get('id')
        if o_id:
            cur.execute(f"SELECT {ORDER_SELECT} {ORDER_JOINS} WHERE o.id = %s", (o_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Заказ не найден'})
            cur.execute("""
                SELECT oc.id, oc.text, oc.created_at, e.first_name || ' ' || LEFT(e.last_name,1) || '.' as employee_name
                FROM order_comments oc LEFT JOIN employees e ON e.id = oc.employee_id
                WHERE oc.order_id = %s ORDER BY oc.created_at DESC
            """, (o_id,))
            comments = [dict(r) for r in cur.fetchall()]
            data = order_row(dict(row))
            data['comments'] = comments
            return resp(200, {'order': data})
        cur.execute(f"SELECT {ORDER_SELECT} {ORDER_JOINS} ORDER BY o.created_at DESC")
        return resp(200, {'orders': [order_row(dict(r)) for r in cur.fetchall()]})

    if method == 'POST' and action == 'comment':
        o_id = body.get('id')
        text = (body.get('text') or '').strip()
        if not text:
            return resp(400, {'error': 'Комментарий не может быть пустым'})
        cur.execute("INSERT INTO order_comments (order_id, employee_id, text) VALUES (%s, %s, %s)",
                    (o_id, current['id'], text))
        conn.commit()
        return resp(201, {'ok': True})

    if method == 'POST':
        client_id = body.get('clientId')
        if not client_id:
            return resp(400, {'error': 'Укажите клиента'})
        code = gen_code(cur, 'orders', '№')
        cur.execute("""
            INSERT INTO orders (code, client_id, deal_id, proposal_id, object_address, item_type,
                                 sum, stage_id, manager_id, company_id, deadline, comment)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 1, %s, %s, %s, %s) RETURNING id
        """, (
            code, client_id, body.get('dealId'), body.get('proposalId'), body.get('objectAddress'),
            body.get('itemType'), body.get('sum', 0), body.get('managerId') or current['id'],
            body.get('companyId'), body.get('deadline'), body.get('comment')
        ))
        new_id = cur.fetchone()['id']
        cur.execute("INSERT INTO order_comments (order_id, employee_id, text) VALUES (%s, %s, %s)",
                    (new_id, current['id'], 'Заказ создан и запущен в производство.'))
        conn.commit()
        cur.execute(f"SELECT {ORDER_SELECT} {ORDER_JOINS} WHERE o.id = %s", (new_id,))
        return resp(201, {'order': order_row(dict(cur.fetchone()))})

    if method == 'PUT':
        o_id = body.get('id') or params.get('id')
        if not o_id:
            return resp(400, {'error': 'Не указан id заказа'})
        fields, values = [], []
        mapping = {
            'stageId': 'stage_id', 'progressPct': 'progress_pct', 'sum': 'sum',
            'deadline': 'deadline', 'isOverdue': 'is_overdue', 'comment': 'comment',
            'managerId': 'manager_id',
        }
        for key, col in mapping.items():
            if key in body:
                fields.append(f"{col} = %s")
                values.append(body[key])
        if not fields:
            return resp(400, {'error': 'Нет данных для обновления'})
        fields.append("updated_at = now()")
        values.append(o_id)
        cur.execute(f"UPDATE orders SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        cur.execute(f"SELECT {ORDER_SELECT} {ORDER_JOINS} WHERE o.id = %s", (o_id,))
        return resp(200, {'order': order_row(dict(cur.fetchone()))})

    return resp(405, {'error': 'Метод не поддерживается'})


# ============================================================
# TASKS (задачи/планер)
# ============================================================

def task_row(row: dict) -> dict:
    due = row.get('due_date')
    is_overdue = row.get('is_overdue')
    if due and row.get('status') == 'pending' and isinstance(due, date) and due < date.today():
        is_overdue = True
    return {
        'id': row['id'], 'title': row['title'], 'description': row.get('description'),
        'taskType': row.get('task_type'), 'priority': row.get('priority'),
        'status': row.get('status'), 'dueDate': row.get('due_date'),
        'dueTime': str(row['due_time']) if row.get('due_time') else None,
        'assigneeId': row.get('assignee_id'), 'assigneeName': row.get('assignee_name'),
        'createdBy': row.get('created_by'), 'relatedType': row.get('related_type'),
        'relatedId': row.get('related_id'), 'isOverdue': is_overdue,
        'createdAt': row.get('created_at'),
    }


TASK_SELECT = """
    t.id, t.title, t.description, t.task_type, t.priority, t.status, t.due_date, t.due_time,
    t.assignee_id, t.created_by, t.related_type, t.related_id, t.is_overdue, t.created_at,
    e.first_name || ' ' || LEFT(e.last_name,1) || '.' as assignee_name
"""
TASK_JOINS = """
    FROM tasks t
    LEFT JOIN employees e ON e.id = t.assignee_id
"""


def handle_tasks(cur, conn, current, method, params, body):
    if method == 'GET':
        t_id = params.get('id')
        if t_id:
            cur.execute(f"SELECT {TASK_SELECT} {TASK_JOINS} WHERE t.id = %s", (t_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Задача не найдена'})
            return resp(200, {'task': task_row(dict(row))})

        where, values = [], []
        if params.get('assigneeId'):
            where.append('t.assignee_id = %s')
            values.append(params['assigneeId'])
        if params.get('dateFrom'):
            where.append('t.due_date >= %s')
            values.append(params['dateFrom'])
        if params.get('dateTo'):
            where.append('t.due_date <= %s')
            values.append(params['dateTo'])
        if params.get('status'):
            where.append('t.status = %s')
            values.append(params['status'])
        where_clause = f"WHERE {' AND '.join(where)}" if where else ''
        cur.execute(f"SELECT {TASK_SELECT} {TASK_JOINS} {where_clause} ORDER BY t.due_date NULLS LAST, t.due_time NULLS LAST", values)
        return resp(200, {'tasks': [task_row(dict(r)) for r in cur.fetchall()]})

    if method == 'POST':
        title = (body.get('title') or '').strip()
        if not title:
            return resp(400, {'error': 'Укажите название задачи'})
        cur.execute("""
            INSERT INTO tasks (title, description, task_type, priority, due_date, due_time,
                                assignee_id, created_by, related_type, related_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            title, body.get('description'), body.get('taskType', 'task'),
            body.get('priority', 'medium'), body.get('dueDate'), body.get('dueTime'),
            body.get('assigneeId') or current['id'], current['id'],
            body.get('relatedType'), body.get('relatedId')
        ))
        new_id = cur.fetchone()['id']
        conn.commit()
        cur.execute(f"SELECT {TASK_SELECT} {TASK_JOINS} WHERE t.id = %s", (new_id,))
        return resp(201, {'task': task_row(dict(cur.fetchone()))})

    if method == 'PUT':
        t_id = body.get('id') or params.get('id')
        if not t_id:
            return resp(400, {'error': 'Не указан id задачи'})
        fields, values = [], []
        mapping = {
            'title': 'title', 'description': 'description', 'priority': 'priority',
            'status': 'status', 'dueDate': 'due_date', 'dueTime': 'due_time',
            'assigneeId': 'assignee_id', 'isOverdue': 'is_overdue',
        }
        for key, col in mapping.items():
            if key in body:
                fields.append(f"{col} = %s")
                values.append(body[key])
        if not fields:
            return resp(400, {'error': 'Нет данных для обновления'})
        fields.append("updated_at = now()")
        values.append(t_id)
        cur.execute(f"UPDATE tasks SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        cur.execute(f"SELECT {TASK_SELECT} {TASK_JOINS} WHERE t.id = %s", (t_id,))
        return resp(200, {'task': task_row(dict(cur.fetchone()))})

    return resp(405, {'error': 'Метод не поддерживается'})


# ============================================================
# WAREHOUSE (склад: остатки материалов)
# ============================================================

def warehouse_item_row(row: dict) -> dict:
    qty = float(row['qty'])
    min_qty = float(row['min_qty'])
    reserved = float(row['reserved_qty'])
    if qty < min_qty:
        tone = 'crit'
    elif qty < min_qty * 1.3:
        tone = 'warn'
    else:
        tone = 'ok'
    return {
        'id': row['id'], 'sku': row['sku'], 'name': row['name'], 'unit': row['unit'],
        'qty': qty, 'minQty': min_qty, 'reservedQty': reserved, 'available': qty - reserved,
        'price': float(row['price']) if row.get('price') is not None else 0,
        'location': row.get('location'), 'tone': tone,
    }


def handle_warehouse(cur, conn, current, method, params, body, action):
    if method == 'GET':
        cur.execute("SELECT * FROM warehouse_items ORDER BY name")
        items = [warehouse_item_row(dict(r)) for r in cur.fetchall()]
        return resp(200, {'items': items})

    if method == 'POST' and action == 'movement':
        item_id = body.get('itemId')
        movement_type = body.get('movementType')
        qty = body.get('qty')
        if not item_id or not movement_type or not qty:
            return resp(400, {'error': 'Укажите материал, тип и количество'})
        delta = float(qty) if movement_type == 'in' else -float(qty)
        cur.execute("UPDATE warehouse_items SET qty = qty + %s, updated_at = now() WHERE id = %s", (delta, item_id))
        cur.execute("""
            INSERT INTO warehouse_movements (item_id, order_id, movement_type, qty, comment, employee_id)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (item_id, body.get('orderId'), movement_type, qty, body.get('comment'), current['id']))
        conn.commit()
        cur.execute("SELECT * FROM warehouse_items WHERE id = %s", (item_id,))
        return resp(200, {'item': warehouse_item_row(dict(cur.fetchone()))})

    if method == 'POST':
        name = (body.get('name') or '').strip()
        if not name:
            return resp(400, {'error': 'Укажите наименование материала'})
        sku = body.get('sku') or f"SKU-{name[:6].upper()}"
        cur.execute("""
            INSERT INTO warehouse_items (sku, name, unit, qty, min_qty, price, location)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (sku, name, body.get('unit', 'шт.'), body.get('qty', 0), body.get('minQty', 0),
              body.get('price', 0), body.get('location')))
        new_id = cur.fetchone()['id']
        conn.commit()
        cur.execute("SELECT * FROM warehouse_items WHERE id = %s", (new_id,))
        return resp(201, {'item': warehouse_item_row(dict(cur.fetchone()))})

    return resp(405, {'error': 'Метод не поддерживается'})


# ============================================================
# SUPPLY (заявки на материалы)
# ============================================================

def supply_row(row: dict) -> dict:
    return {
        'id': row['id'], 'code': row.get('code'), 'orderId': row.get('order_id'),
        'orderCode': row.get('order_code'), 'materialName': row.get('material_name'),
        'qty': float(row['qty']), 'unit': row.get('unit'), 'supplierId': row.get('supplier_id'),
        'supplierName': row.get('supplier_name'), 'status': row.get('status'),
        'sum': float(row['sum']) if row.get('sum') is not None else 0,
        'createdAt': row.get('created_at'),
    }


SUPPLY_SELECT = """
    sr.id, sr.code, sr.order_id, sr.material_name, sr.qty, sr.unit, sr.supplier_id, sr.status,
    sr.sum, sr.created_at, o.code as order_code, s.name as supplier_name
"""
SUPPLY_JOINS = """
    FROM supply_requests sr
    LEFT JOIN orders o ON o.id = sr.order_id
    LEFT JOIN suppliers s ON s.id = sr.supplier_id
"""


def handle_supply(cur, conn, current, method, params, body):
    if method == 'GET' and params.get('action') == 'suppliers':
        cur.execute("SELECT id, name, phone, contact_person, rating FROM suppliers ORDER BY name")
        return resp(200, {'suppliers': [dict(r) for r in cur.fetchall()]})

    if method == 'GET':
        cur.execute(f"SELECT {SUPPLY_SELECT} {SUPPLY_JOINS} ORDER BY sr.created_at DESC")
        return resp(200, {'requests': [supply_row(dict(r)) for r in cur.fetchall()]})

    if method == 'POST':
        material_name = (body.get('materialName') or '').strip()
        qty = body.get('qty')
        if not material_name or not qty:
            return resp(400, {'error': 'Укажите материал и количество'})
        code = gen_code(cur, 'supply_requests', 'З')
        cur.execute("""
            INSERT INTO supply_requests (code, order_id, material_name, qty, unit, supplier_id, status, sum, requested_by)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending', %s, %s) RETURNING id
        """, (code, body.get('orderId'), material_name, qty, body.get('unit', 'шт.'),
              body.get('supplierId'), body.get('sum', 0), current['id']))
        new_id = cur.fetchone()['id']
        conn.commit()
        cur.execute(f"SELECT {SUPPLY_SELECT} {SUPPLY_JOINS} WHERE sr.id = %s", (new_id,))
        return resp(201, {'request': supply_row(dict(cur.fetchone()))})

    if method == 'PUT':
        s_id = body.get('id') or params.get('id')
        if not s_id:
            return resp(400, {'error': 'Не указан id заявки'})
        fields, values = [], []
        mapping = {'status': 'status', 'supplierId': 'supplier_id', 'sum': 'sum'}
        for key, col in mapping.items():
            if key in body:
                fields.append(f"{col} = %s")
                values.append(body[key])
        if not fields:
            return resp(400, {'error': 'Нет данных для обновления'})
        fields.append("updated_at = now()")
        values.append(s_id)
        cur.execute(f"UPDATE supply_requests SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        cur.execute(f"SELECT {SUPPLY_SELECT} {SUPPLY_JOINS} WHERE sr.id = %s", (s_id,))
        return resp(200, {'request': supply_row(dict(cur.fetchone()))})

    return resp(405, {'error': 'Метод не поддерживается'})


# ============================================================
# PRODUCTION (цеха + задания)
# ============================================================

def handle_production(cur, conn, current, method, params, body):
    if method == 'GET':
        cur.execute("SELECT id, slug, name, icon, workers_count FROM workshops ORDER BY sort_order")
        workshops = [dict(r) for r in cur.fetchall()]
        cur.execute("""
            SELECT pt.id, pt.order_id, pt.workshop_id, pt.stage_name, pt.progress_pct, pt.team_name,
                   pt.is_urgent, pt.deadline, o.code as order_code,
                   c.first_name || ' ' || c.last_name as client_name, o.item_type
            FROM production_tasks pt
            JOIN orders o ON o.id = pt.order_id
            JOIN clients c ON c.id = o.client_id
            ORDER BY pt.is_urgent DESC, pt.deadline
        """)
        tasks = []
        for r in cur.fetchall():
            r = dict(r)
            tasks.append({
                'id': r['id'], 'orderId': r['order_id'], 'orderCode': r['order_code'],
                'clientName': r['client_name'], 'itemType': r['item_type'],
                'workshopId': r['workshop_id'], 'stageName': r['stage_name'],
                'progressPct': r['progress_pct'], 'teamName': r['team_name'],
                'isUrgent': r['is_urgent'], 'deadline': r['deadline'],
            })
        # workshop load = avg progress of active tasks in that workshop, orders count
        for w in workshops:
            w_tasks = [t for t in tasks if t['workshopId'] == w['id']]
            w['ordersCount'] = len(w_tasks)
            w['load'] = round(sum(t['progressPct'] for t in w_tasks) / len(w_tasks)) if w_tasks else 0
        return resp(200, {'workshops': workshops, 'tasks': tasks})

    if method == 'PUT':
        t_id = body.get('id') or params.get('id')
        if not t_id:
            return resp(400, {'error': 'Не указан id задания'})
        fields, values = [], []
        mapping = {'progressPct': 'progress_pct', 'stageName': 'stage_name', 'workshopId': 'workshop_id', 'teamName': 'team_name'}
        for key, col in mapping.items():
            if key in body:
                fields.append(f"{col} = %s")
                values.append(body[key])
        if not fields:
            return resp(400, {'error': 'Нет данных для обновления'})
        fields.append("updated_at = now()")
        values.append(t_id)
        cur.execute(f"UPDATE production_tasks SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        return resp(200, {'ok': True})

    return resp(405, {'error': 'Метод не поддерживается'})


# ============================================================
# LOGISTICS (транспорт + отгрузки)
# ============================================================

def shipment_row(row: dict) -> dict:
    return {
        'id': row['id'], 'orderId': row['order_id'], 'orderCode': row.get('order_code'),
        'clientName': row.get('client_name'), 'address': row.get('address'),
        'shipDate': row.get('ship_date'), 'shipTimeRange': row.get('ship_time_range'),
        'vehicleId': row.get('vehicle_id'), 'vehicleName': row.get('vehicle_name'),
        'status': row.get('status'), 'sum': float(row['sum']) if row.get('sum') is not None else 0,
    }


def handle_logistics(cur, conn, current, method, params, body):
    if method == 'GET':
        cur.execute("SELECT id, name, status, trips_today FROM vehicles ORDER BY name")
        vehicles = [dict(r) for r in cur.fetchall()]
        cur.execute("""
            SELECT s.id, s.order_id, s.address, s.ship_date, s.ship_time_range, s.vehicle_id, s.status,
                   o.code as order_code, c.first_name || ' ' || c.last_name as client_name, o.sum,
                   v.name as vehicle_name
            FROM shipments s
            JOIN orders o ON o.id = s.order_id
            JOIN clients c ON c.id = o.client_id
            LEFT JOIN vehicles v ON v.id = s.vehicle_id
            ORDER BY s.ship_date
        """)
        shipments = [shipment_row(dict(r)) for r in cur.fetchall()]
        return resp(200, {'vehicles': vehicles, 'shipments': shipments})

    if method == 'POST':
        order_id = body.get('orderId')
        ship_date = body.get('shipDate')
        if not order_id or not ship_date:
            return resp(400, {'error': 'Укажите заказ и дату отгрузки'})
        cur.execute("""
            INSERT INTO shipments (order_id, address, ship_date, ship_time_range, vehicle_id, status)
            VALUES (%s, %s, %s, %s, %s, 'scheduled') RETURNING id
        """, (order_id, body.get('address'), ship_date, body.get('shipTimeRange'), body.get('vehicleId')))
        new_id = cur.fetchone()['id']
        conn.commit()
        cur.execute("""
            SELECT s.id, s.order_id, s.address, s.ship_date, s.ship_time_range, s.vehicle_id, s.status,
                   o.code as order_code, c.first_name || ' ' || c.last_name as client_name, o.sum,
                   v.name as vehicle_name
            FROM shipments s
            JOIN orders o ON o.id = s.order_id
            JOIN clients c ON c.id = o.client_id
            LEFT JOIN vehicles v ON v.id = s.vehicle_id
            WHERE s.id = %s
        """, (new_id,))
        return resp(201, {'shipment': shipment_row(dict(cur.fetchone()))})

    if method == 'PUT':
        s_id = body.get('id') or params.get('id')
        if not s_id:
            return resp(400, {'error': 'Не указан id отгрузки'})
        fields, values = [], []
        mapping = {'status': 'status', 'vehicleId': 'vehicle_id', 'shipDate': 'ship_date'}
        for key, col in mapping.items():
            if key in body:
                fields.append(f"{col} = %s")
                values.append(body[key])
        if not fields:
            return resp(400, {'error': 'Нет данных для обновления'})
        fields.append("updated_at = now()")
        values.append(s_id)
        cur.execute(f"UPDATE shipments SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        return resp(200, {'ok': True})

    return resp(405, {'error': 'Метод не поддерживается'})


# ============================================================
# INSTALLATIONS (монтажи + бригады)
# ============================================================

def installation_row(row: dict) -> dict:
    return {
        'id': row['id'], 'orderId': row['order_id'], 'orderCode': row.get('order_code'),
        'clientName': row.get('client_name'), 'itemType': row.get('item_type'),
        'address': row.get('address'), 'installDate': row.get('install_date'),
        'installTimeRange': row.get('install_time_range'), 'teamId': row.get('team_id'),
        'teamName': row.get('team_name'), 'status': row.get('status'),
        'clientRating': float(row['client_rating']) if row.get('client_rating') is not None else None,
        'sum': float(row['sum']) if row.get('sum') is not None else 0,
    }


def handle_installations(cur, conn, current, method, params, body):
    if method == 'GET':
        cur.execute("SELECT id, name, members, status FROM installation_teams ORDER BY name")
        teams = [dict(r) for r in cur.fetchall()]
        cur.execute("""
            SELECT i.id, i.order_id, i.address, i.install_date, i.install_time_range, i.team_id,
                   i.status, i.client_rating, o.code as order_code,
                   c.first_name || ' ' || c.last_name as client_name, o.item_type, o.sum,
                   t.name as team_name
            FROM installations i
            JOIN orders o ON o.id = i.order_id
            JOIN clients c ON c.id = o.client_id
            LEFT JOIN installation_teams t ON t.id = i.team_id
            ORDER BY i.install_date
        """)
        installations = [installation_row(dict(r)) for r in cur.fetchall()]
        return resp(200, {'teams': teams, 'installations': installations})

    if method == 'POST':
        order_id = body.get('orderId')
        install_date = body.get('installDate')
        if not order_id or not install_date:
            return resp(400, {'error': 'Укажите заказ и дату монтажа'})
        cur.execute("""
            INSERT INTO installations (order_id, address, install_date, install_time_range, team_id, status)
            VALUES (%s, %s, %s, %s, %s, 'scheduled') RETURNING id
        """, (order_id, body.get('address'), install_date, body.get('installTimeRange'), body.get('teamId')))
        new_id = cur.fetchone()['id']
        conn.commit()
        cur.execute("""
            SELECT i.id, i.order_id, i.address, i.install_date, i.install_time_range, i.team_id,
                   i.status, i.client_rating, o.code as order_code,
                   c.first_name || ' ' || c.last_name as client_name, o.item_type, o.sum,
                   t.name as team_name
            FROM installations i
            JOIN orders o ON o.id = i.order_id
            JOIN clients c ON c.id = o.client_id
            LEFT JOIN installation_teams t ON t.id = i.team_id
            WHERE i.id = %s
        """, (new_id,))
        return resp(201, {'installation': installation_row(dict(cur.fetchone()))})

    if method == 'PUT':
        i_id = body.get('id') or params.get('id')
        if not i_id:
            return resp(400, {'error': 'Не указан id монтажа'})
        fields, values = [], []
        mapping = {'status': 'status', 'teamId': 'team_id', 'clientRating': 'client_rating', 'installDate': 'install_date'}
        for key, col in mapping.items():
            if key in body:
                fields.append(f"{col} = %s")
                values.append(body[key])
        if not fields:
            return resp(400, {'error': 'Нет данных для обновления'})
        fields.append("updated_at = now()")
        values.append(i_id)
        cur.execute(f"UPDATE installations SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        return resp(200, {'ok': True})

    return resp(405, {'error': 'Метод не поддерживается'})


# ============================================================
# CHECKLIST (универсальный чек-лист по любой сущности)
# ============================================================

def checklist_item_row(row: dict) -> dict:
    return {
        'id': row['id'], 'entityType': row['entity_type'], 'entityId': row['entity_id'],
        'text': row['text'], 'done': row['done'], 'sortOrder': row['sort_order'],
    }


def handle_checklist(cur, conn, current, method, params, body):
    if method == 'GET':
        entity_type = params.get('entityType')
        entity_id = params.get('entityId')
        if not entity_type or not entity_id:
            return resp(400, {'error': 'Укажите entityType и entityId'})
        cur.execute(
            "SELECT * FROM checklist_items WHERE entity_type = %s AND entity_id = %s ORDER BY sort_order, id",
            (entity_type, entity_id)
        )
        items = [checklist_item_row(dict(r)) for r in cur.fetchall()]
        cur.execute("SELECT id, name, items FROM checklist_templates WHERE entity_type = %s ORDER BY sort_order", (entity_type,))
        templates = [dict(r) for r in cur.fetchall()]
        return resp(200, {'items': items, 'templates': templates})

    if method == 'POST' and params.get('action') == 'apply-template':
        entity_type = body.get('entityType')
        entity_id = body.get('entityId')
        template_id = body.get('templateId')
        if not entity_type or not entity_id or not template_id:
            return resp(400, {'error': 'Укажите entityType, entityId и templateId'})
        cur.execute("SELECT items FROM checklist_templates WHERE id = %s", (template_id,))
        tpl = cur.fetchone()
        if not tpl:
            return resp(404, {'error': 'Шаблон не найден'})
        cur.execute("SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM checklist_items WHERE entity_type = %s AND entity_id = %s", (entity_type, entity_id))
        next_order = cur.fetchone()['next']
        for i, text in enumerate(tpl['items']):
            cur.execute(
                "INSERT INTO checklist_items (entity_type, entity_id, text, sort_order, created_by) VALUES (%s, %s, %s, %s, %s)",
                (entity_type, entity_id, text, next_order + i, current['id'])
            )
        conn.commit()
        cur.execute(
            "SELECT * FROM checklist_items WHERE entity_type = %s AND entity_id = %s ORDER BY sort_order, id",
            (entity_type, entity_id)
        )
        return resp(200, {'items': [checklist_item_row(dict(r)) for r in cur.fetchall()]})

    if method == 'POST':
        entity_type = body.get('entityType')
        entity_id = body.get('entityId')
        text = (body.get('text') or '').strip()
        if not entity_type or not entity_id or not text:
            return resp(400, {'error': 'Укажите entityType, entityId и текст пункта'})
        cur.execute("SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM checklist_items WHERE entity_type = %s AND entity_id = %s", (entity_type, entity_id))
        next_order = cur.fetchone()['next']
        cur.execute(
            "INSERT INTO checklist_items (entity_type, entity_id, text, sort_order, created_by) VALUES (%s, %s, %s, %s, %s) RETURNING *",
            (entity_type, entity_id, text, next_order, current['id'])
        )
        new_row = cur.fetchone()
        conn.commit()
        return resp(201, {'item': checklist_item_row(dict(new_row))})

    if method == 'PUT':
        item_id = body.get('id') or params.get('id')
        if not item_id:
            return resp(400, {'error': 'Не указан id пункта'})
        fields, values = [], []
        mapping = {'text': 'text', 'done': 'done', 'sortOrder': 'sort_order'}
        for key, col in mapping.items():
            if key in body:
                fields.append(f"{col} = %s")
                values.append(body[key])
        if not fields:
            return resp(400, {'error': 'Нет данных для обновления'})
        fields.append("updated_at = now()")
        values.append(item_id)
        cur.execute(f"UPDATE checklist_items SET {', '.join(fields)} WHERE id = %s RETURNING *", values)
        row = cur.fetchone()
        conn.commit()
        if not row:
            return resp(404, {'error': 'Пункт не найден'})
        return resp(200, {'item': checklist_item_row(dict(row))})

    if method == 'DELETE':
        item_id = params.get('id') or body.get('id')
        if not item_id:
            return resp(400, {'error': 'Не указан id пункта'})
        cur.execute("DELETE FROM checklist_items WHERE id = %s", (item_id,))
        conn.commit()
        return resp(200, {'ok': True})

    return resp(405, {'error': 'Метод не поддерживается'})


def handler(event: dict, context) -> dict:
    """Операции: заказы, задачи, склад, снабжение, производство, логистика, монтаж, чек-листы.
    Роутинг через ?resource=orders|tasks|warehouse|supply|production|logistics|installations|checklist&action=..."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Authorization') or headers.get('x-authorization') or ''
    if token.lower().startswith('bearer '):
        token = token[7:]

    params = event.get('queryStringParameters') or {}
    resource = params.get('resource', 'orders')
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

        if resource == 'orders':
            return handle_orders(cur, conn, current, method, params, body, action)
        if resource == 'tasks':
            return handle_tasks(cur, conn, current, method, params, body)
        if resource == 'warehouse':
            return handle_warehouse(cur, conn, current, method, params, body, action)
        if resource == 'supply':
            return handle_supply(cur, conn, current, method, params, body)
        if resource == 'production':
            return handle_production(cur, conn, current, method, params, body)
        if resource == 'logistics':
            return handle_logistics(cur, conn, current, method, params, body)
        if resource == 'installations':
            return handle_installations(cur, conn, current, method, params, body)
        if resource == 'checklist':
            return handle_checklist(cur, conn, current, method, params, body)

        return resp(404, {'error': 'Неизвестный ресурс'})
    finally:
        conn.close()
