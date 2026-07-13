-- ============================================================
-- Блок 2: ВОРОНКА ЗАКАЗА (часть 3)
-- Задачи/планер, финансы, маркетинг
-- ============================================================

-- ── Задачи (планер) ──
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(30) NOT NULL DEFAULT 'task',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    due_date DATE,
    due_time TIME,
    assignee_id INTEGER,
    created_by INTEGER,
    related_type VARCHAR(30),
    related_id INTEGER,
    is_overdue BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_related ON tasks(related_type, related_id);

-- ── Финансы: платежи (движение денежных средств) ──
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER,
    payment_type VARCHAR(20) NOT NULL,
    category VARCHAR(100),
    sum NUMERIC(14,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    company_id INTEGER,
    comment TEXT,
    created_by INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Себестоимость заказа (для расчёта маржи)
CREATE TABLE order_costs (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE,
    materials_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    labor_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    other_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Маркетинг: источники лидов ──
CREATE TABLE marketing_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    channel_type VARCHAR(50),
    color VARCHAR(30)
);

INSERT INTO marketing_sources (name, channel_type, color) VALUES
('Instagram', 'social', 'hsl(40 60% 55%)'),
('ВКонтакте', 'social', 'hsl(199 60% 50%)'),
('Яндекс.Директ', 'ads', 'hsl(150 45% 48%)'),
('Авито', 'marketplace', 'hsl(35 65% 52%)'),
('Реферальная', 'referral', 'hsl(280 40% 55%)'),
('Сайт', 'organic', 'hsl(210 50% 50%)');

-- Маркетинговые бюджеты по месяцам
CREATE TABLE marketing_budgets (
    id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL,
    company_id INTEGER,
    period_month DATE NOT NULL,
    budget_sum NUMERIC(14,2) NOT NULL DEFAULT 0,
    leads_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_budgets_period ON marketing_budgets(period_month);
