-- ============================================================
-- Блок 2: ВОРОНКА ЗАКАЗА (часть 1)
-- Клиенты, сделки, замеры, КП, заказы
-- ============================================================

-- ── Клиенты ──
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(255),
    object_type VARCHAR(50),
    object_address TEXT,
    segment VARCHAR(50) NOT NULL DEFAULT 'standard',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    manager_id INTEGER,
    company_id INTEGER,
    source VARCHAR(100),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_manager ON clients(manager_id);
CREATE INDEX idx_clients_company ON clients(company_id);

-- ── Воронка продаж: стадии (справочник) ──
CREATE TABLE deal_stages (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(30),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_final BOOLEAN NOT NULL DEFAULT FALSE,
    is_won BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO deal_stages (slug, name, color, sort_order, is_final, is_won) VALUES
('lead', 'Новый лид', 'hsl(199 65% 45%)', 1, FALSE, FALSE),
('contact', 'Первый контакт', 'hsl(178 50% 42%)', 2, FALSE, FALSE),
('measure', 'Замер назначен', 'hsl(150 45% 45%)', 3, FALSE, FALSE),
('kp', 'КП отправлено', 'hsl(95 40% 48%)', 4, FALSE, FALSE),
('agree', 'Согласование', 'hsl(45 60% 55%)', 5, FALSE, FALSE),
('prepay', 'Предоплата', 'hsl(35 65% 52%)', 6, FALSE, FALSE),
('done', 'Закрыто', 'hsl(28 70% 50%)', 7, TRUE, TRUE),
('lost', 'Отказ', 'hsl(4 70% 50%)', 8, TRUE, FALSE);

-- ── Сделки ──
CREATE TABLE deals (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    stage_id INTEGER NOT NULL,
    object_address TEXT,
    sum NUMERIC(14,2),
    manager_id INTEGER,
    company_id INTEGER,
    source VARCHAR(100),
    tag VARCHAR(100),
    task_note VARCHAR(255),
    is_overdue BOOLEAN NOT NULL DEFAULT FALSE,
    comment TEXT,
    stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deals_client ON deals(client_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_manager ON deals(manager_id);

-- История изменений сделки (для карточки)
CREATE TABLE deal_history (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER NOT NULL,
    employee_id INTEGER,
    event_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_history_deal ON deal_history(deal_id);

-- Чек-лист задач по сделке
CREATE TABLE deal_tasks (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER NOT NULL,
    text VARCHAR(255) NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    tone VARCHAR(20),
    due_date DATE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_tasks_deal ON deal_tasks(deal_id);

-- ── Замеры ──
CREATE TABLE measurements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    deal_id INTEGER,
    client_id INTEGER NOT NULL,
    measure_type VARCHAR(20) NOT NULL DEFAULT 'primary',
    object_type VARCHAR(50),
    object_name VARCHAR(255),
    address TEXT,
    measure_date DATE NOT NULL,
    measure_time TIME,
    manager_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
    company_id INTEGER,
    result_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_measurements_deal ON measurements(deal_id);
CREATE INDEX idx_measurements_client ON measurements(client_id);
CREATE INDEX idx_measurements_date ON measurements(measure_date);

-- ── Контрольные замеры (перед производством) ──
CREATE TABLE control_measurements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    order_id INTEGER,
    measurement_id INTEGER,
    client_id INTEGER NOT NULL,
    object_type VARCHAR(100),
    measure_date DATE NOT NULL,
    measure_time TIME,
    manager_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
    result_notes TEXT,
    checklist JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_control_measurements_order ON control_measurements(order_id);

-- ── Коммерческие предложения ──
CREATE TABLE proposals (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deal_id INTEGER,
    client_id INTEGER NOT NULL,
    item_type VARCHAR(150),
    company_id INTEGER,
    sum NUMERIC(14,2),
    discount NUMERIC(14,2) DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    manager_id INTEGER,
    valid_days INTEGER DEFAULT 14,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_proposals_code_version ON proposals(code, version);
CREATE INDEX idx_proposals_deal ON proposals(deal_id);
CREATE INDEX idx_proposals_client ON proposals(client_id);

-- Состав КП (позиции)
CREATE TABLE proposal_items (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    qty NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit VARCHAR(30) NOT NULL DEFAULT 'шт.',
    price NUMERIC(14,2) NOT NULL DEFAULT 0,
    sum NUMERIC(14,2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_proposal_items_proposal ON proposal_items(proposal_id);

-- ── Заказы ──
CREATE TABLE order_stages (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO order_stages (slug, name, sort_order) VALUES
('design', 'Проектирование', 1),
('agreement', 'Согласование', 2),
('production', 'В производстве', 3),
('quality', 'Контроль качества', 4),
('ready', 'Готов к отгрузке', 5),
('delivery', 'Доставка', 6),
('installation', 'Монтаж', 7),
('handover', 'Сдача', 8);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL,
    deal_id INTEGER,
    proposal_id INTEGER,
    object_address TEXT,
    item_type VARCHAR(150),
    sum NUMERIC(14,2) NOT NULL DEFAULT 0,
    stage_id INTEGER NOT NULL DEFAULT 1,
    progress_pct INTEGER NOT NULL DEFAULT 0,
    manager_id INTEGER,
    company_id INTEGER,
    deadline DATE,
    is_overdue BOOLEAN NOT NULL DEFAULT FALSE,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_deal ON orders(deal_id);
CREATE INDEX idx_orders_stage ON orders(stage_id);
CREATE INDEX idx_orders_manager ON orders(manager_id);

-- Комментарии/лог по заказу
CREATE TABLE order_comments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    employee_id INTEGER,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_comments_order ON order_comments(order_id);
