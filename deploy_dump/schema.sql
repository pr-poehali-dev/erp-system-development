-- ============================================================
-- Territory ERP — Полная структура базы данных PostgreSQL
-- Сгенерировано автоматически из миграций проекта
-- Версия PostgreSQL: 13+
-- ============================================================

-- ===== V0001__init_org_structure_auth.sql =====
-- ============================================================
-- Блок 1: ОРГАНИЗАЦИОННАЯ СТРУКТУРА + АВТОРИЗАЦИЯ
-- ============================================================

CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    tagline VARCHAR(255),
    segment VARCHAR(255),
    description TEXT,
    logo_text VARCHAR(10),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER,
    name VARCHAR(200) NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    responsibilities JSONB NOT NULL DEFAULT '[]',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30),
    login VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    role_id INTEGER NOT NULL,
    department_id INTEGER,
    company_id INTEGER,
    avatar_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    hired_at DATE NOT NULL DEFAULT CURRENT_DATE,
    fired_at DATE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_employee ON sessions(employee_id);
CREATE INDEX idx_employees_login ON employees(login);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_departments_parent ON departments(parent_id);

-- ============================================================
-- Сиды: компании
-- ============================================================
INSERT INTO companies (slug, name, tagline, segment, description, logo_text, is_active) VALUES
('kontur', 'КОНТУР+', 'МЕБЕЛЬ НА ПРАКТИКЕ', 'СЕГМЕНТ: НИЖЕ СРЕДНЕГО', 'Практичные мебельные решения по доступным ценам.', 'K+', TRUE),
('territory', 'ТЕРРИТОРИЯ МЕБЕЛИ', 'ИНДИВИДУАЛЬНЫЕ РЕШЕНИЯ ПРЕМИУМ-КЛАССА', 'СЕГМЕНТ: ВЫШЕ СРЕДНЕГО / ПРЕМИУМ', 'Индивидуальный подход, премиальные материалы и безупречный сервис.', 'ТМ', TRUE);

-- ============================================================
-- Сиды: организационная структура (дерево отделов)
-- ============================================================
INSERT INTO departments (id, parent_id, name, icon, responsibilities, sort_order) VALUES
(1, NULL, 'Главный офис / Управление', 'Building2', '["Стратегия и развитие компании","Управление процессами и ресурсами","Контроль KPI и аналитика"]', 0);

INSERT INTO departments (id, parent_id, name, icon, responsibilities, sort_order) VALUES
(2, 1, 'Отдел продаж', 'Users', '["Работа с клиентами","Подготовка КП и договоров","Формирование заказов","Ведение базы клиентов"]', 1),
(3, 1, 'Производство', 'Factory', '["Планирование производства","Координация цехов и участков","Контроль сроков и процессов","Управление загрузкой"]', 2),
(4, 1, 'Технический отдел', 'Wrench', '["Разработка технических решений","Конструирование изделий","Чертежи и спецификации","Технологии и стандарты"]', 3),
(5, 1, 'Отдел снабжения и закупок', 'ShoppingCart', '["Поиск и закупка материалов","Работа с поставщиками","Согласование условий","Логистика и поставки"]', 4),
(6, 1, 'Отдел маркетинга', 'Megaphone', '["Продвижение и реклама","SMM и контент-маркетинг","Ведение сайта и бренда","Аналитика и лидогенерация"]', 5);

INSERT INTO departments (id, parent_id, name, icon, responsibilities, sort_order) VALUES
(7, 1, 'Финансовый отдел', 'Coins', '["Бюджетирование и планирование","Учет доходов и расходов","Контроль рентабельности","Финансовая отчетность"]', 6),
(8, 3, 'Цех мягкой мебели', 'Sofa', '["Изготовление мягкой мебели","Раскрой и пошив материалов","Сборка и обивка изделий","Контроль качества"]', 7),
(9, 3, 'Цех корпусной мебели', 'Archive', '["Изготовление корпусной мебели","Обработка кромки и присадка","Сборка и упаковка изделий","Контроль качества"]', 8);

SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));

-- ============================================================
-- Сиды: роли
-- ============================================================
INSERT INTO roles (slug, name, description, permissions, is_system) VALUES
('owner', 'Собственник', 'Полный доступ ко всей системе, всем компаниям и настройкам', '["*"]', TRUE),
('admin', 'Администратор', 'Полный доступ к системе и управлению пользователями', '["*"]', TRUE),
('sales_manager', 'Менеджер продаж', 'Работа со сделками, клиентами, КП', '["crm.view","crm.edit","clients.view","clients.edit","proposals.view","proposals.edit"]', FALSE),
('measurer', 'Замерщик', 'Проведение и учёт замеров объектов', '["measurements.view","measurements.edit"]', FALSE),
('technologist', 'Технолог', 'Технические решения, чертежи и спецификации', '["technology.view","technology.edit","orders.view"]', FALSE),
('supply_manager', 'Снабженец', 'Закупки материалов и работа с поставщиками', '["supply.view","supply.edit","warehouse.view"]', FALSE),
('marketer', 'Маркетолог', 'Маркетинг, реклама, аналитика лидов', '["marketing.view","marketing.edit"]', FALSE),
('finance_manager', 'Финансист', 'Финансовый учёт и отчётность', '["finance.view","finance.edit","reports.view"]', FALSE),
('production_master', 'Мастер цеха', 'Контроль производства и цехов', '["production.view","production.edit","orders.view"]', FALSE),
('installer', 'Монтажник', 'Выполнение монтажных работ на объектах', '["installation.view","installation.edit"]', FALSE);

-- ============================================================
-- Сид: главный администратор (пароль будет установлен backend-скриптом)
-- ============================================================
INSERT INTO employees (first_name, last_name, email, login, password_hash, must_change_password, role_id, department_id, company_id, status)
VALUES ('Дмитрий', 'Горбунов', 'djgorbunov@gmail.com', 'admin', 'ebfaa74675ce45cdc019826f14418941$938760bba6dbadccef213f674b02924685ef3073c018a0d78b8b2a74e3742697', FALSE,
        (SELECT id FROM roles WHERE slug = 'owner'), 1, NULL, 'active');


-- ===== V0002__set_admin_password.sql =====
UPDATE employees
SET password_hash = 'ebfaa74675ce45cdc019826f14418941$938760bba6dbadccef213f674b02924685ef3073c018a0d78b8b2a74e3742697',
    must_change_password = FALSE
WHERE login = 'admin';


-- ===== V0003__crm_deals_measurements_proposals_orders.sql =====
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


-- ===== V0004__technology_supply_warehouse_production_logistics_installation.sql =====
-- ============================================================
-- Блок 2: ВОРОНКА ЗАКАЗА (часть 2)
-- Технология, снабжение, склад, производство, логистика, монтаж
-- ============================================================

-- ── Технические задания ──
CREATE TABLE specifications (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    order_id INTEGER NOT NULL,
    designer_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    materials TEXT,
    progress_pct INTEGER NOT NULL DEFAULT 0,
    deadline DATE,
    drawing_file_url TEXT,
    spec_file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_specifications_order ON specifications(order_id);

-- ── Поставщики ──
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(255),
    contact_person VARCHAR(150),
    rating NUMERIC(2,1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Заявки на материалы (снабжение) ──
CREATE TABLE supply_requests (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    order_id INTEGER,
    material_name VARCHAR(255) NOT NULL,
    qty NUMERIC(12,2) NOT NULL,
    unit VARCHAR(30) NOT NULL DEFAULT 'шт.',
    supplier_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    sum NUMERIC(14,2),
    requested_by INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_supply_requests_order ON supply_requests(order_id);
CREATE INDEX idx_supply_requests_supplier ON supply_requests(supplier_id);

-- ── Склад: материалы (остатки) ──
CREATE TABLE warehouse_items (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(30) NOT NULL DEFAULT 'шт.',
    qty NUMERIC(12,2) NOT NULL DEFAULT 0,
    min_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
    reserved_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
    price NUMERIC(14,2) DEFAULT 0,
    location VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Движения склада (приход/расход/резерв)
CREATE TABLE warehouse_movements (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL,
    order_id INTEGER,
    movement_type VARCHAR(20) NOT NULL,
    qty NUMERIC(12,2) NOT NULL,
    comment TEXT,
    employee_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_warehouse_movements_item ON warehouse_movements(item_id);
CREATE INDEX idx_warehouse_movements_order ON warehouse_movements(order_id);

-- ── Производство: цеха ──
CREATE TABLE workshops (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    icon VARCHAR(50),
    workers_count INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO workshops (slug, name, icon, workers_count, sort_order) VALUES
('cutting', 'Корпусной цех', 'Package', 8, 1),
('painting', 'Малярный цех', 'Paintbrush', 5, 2),
('assembly', 'Сборочный цех', 'Wrench', 6, 3),
('packing', 'Упаковочный цех', 'PackageCheck', 4, 4),
('soft', 'Цех мягкой мебели', 'Sofa', 6, 5),
('hard', 'Цех корпусной мебели', 'Archive', 7, 6);

-- Задания в производстве (привязка заказа к цеху и этапу)
CREATE TABLE production_tasks (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    workshop_id INTEGER NOT NULL,
    stage_name VARCHAR(100),
    progress_pct INTEGER NOT NULL DEFAULT 0,
    team_name VARCHAR(100),
    is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
    deadline DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_production_tasks_order ON production_tasks(order_id);
CREATE INDEX idx_production_tasks_workshop ON production_tasks(workshop_id);

-- ── Логистика: транспорт ──
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    driver_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'free',
    trips_today INTEGER NOT NULL DEFAULT 0
);

-- Отгрузки/доставки
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    address TEXT,
    ship_date DATE NOT NULL,
    ship_time_range VARCHAR(30),
    vehicle_id INTEGER,
    driver_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_vehicle ON shipments(vehicle_id);

-- ── Монтаж: бригады ──
CREATE TABLE installation_teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    members TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Монтажи
CREATE TABLE installations (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    address TEXT,
    install_date DATE NOT NULL,
    install_time_range VARCHAR(30),
    team_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
    client_rating NUMERIC(2,1),
    complaint_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_installations_order ON installations(order_id);
CREATE INDEX idx_installations_team ON installations(team_id);


-- ===== V0005__tasks_finance_marketing.sql =====
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


-- ===== V0006__seed_employees_test_data.sql =====
-- Дополнительные тестовые сотрудники для реалистичности данных
INSERT INTO employees (first_name, last_name, middle_name, email, phone, login, password_hash, must_change_password, role_id, department_id, company_id, status) VALUES
('Елена', 'Петрова', 'Викторовна', 'petrova@company.ru', '+7 (978) 222-33-44', 'petrova.elena', '9a4d03c6ea92c0f0c5ab98cc882ec0e0$83a4fc3ae7512f8e13d76f616e2a4c247b41fe3077992d5af3d2b71daae77b3b', TRUE, 3, 2, 2, 'active'),
('Дмитрий', 'Кузнецов', 'Андреевич', 'kuznetsov@company.ru', '+7 (978) 333-44-55', 'kuznetsov.dmitriy', 'd53d1359595f44f5269b07d995475485$5478fb991fc2d7a5dc99d93404f17301ce90c7c78bfacba49e0394ab860cf903', TRUE, 3, 2, 2, 'active'),
('Павел', 'Смирнов', 'Александрович', 'smirnov@company.ru', '+7 (978) 444-55-66', 'smirnov.pavel', 'ed5ad2c8f89595a53b7dde1c9951bce5$e4496b87248edeeda2ba1d08e5770c94fd6ad51995cf287672dabe01988d842c', TRUE, 4, 4, 2, 'active'),
('Валентина', 'Морозова', 'Александровна', 'morozova@company.ru', '+7 (978) 555-66-77', 'morozova.valentina', '3f321d48490bcd0a4d908fd86f473046$f678d975e3ea8279567998b9c6910c3d458f9f92e1b8a2f61787402a83921070', TRUE, 5, 4, 2, 'vacation'),
('Артём', 'Кириллов', NULL, 'kirillov@company.ru', '+7 (978) 666-77-88', 'kirillov.artem', '9d04b2bf96310aecbe1d9ee515444ed3$c589c0aaa03c93c0a88375dfaa39c893663da386472ca702ca49b7b58e916781', TRUE, 10, 3, 2, 'active'),
('Николай', 'Волков', NULL, 'volkov@company.ru', '+7 (978) 777-88-99', 'volkov.nikolay', '74dd9afab460e1e11e002142fd59e64d$ee2ec13d1dfb243f78f97c98eea37d67d13c67d16bf63b0b7a038e836388a85b', TRUE, 10, 3, 2, 'active'),
('Наталья', 'Соколова', 'Игоревна', 'sokolova@company.ru', '+7 (978) 888-99-00', 'sokolova.natalya', '4f22c0a3579e91a6ded7fbe71e782f88$1137ae16076e3f79a79fa85587727afcd71b1a4c6fb32b68164306e175b61a5d', TRUE, 4, 4, 2, 'active');


-- ===== V0007__seed_clients_deals.sql =====
-- ============================================================
-- СИДЫ: клиенты и сделки (воронка продаж)
-- ============================================================

INSERT INTO clients (id, first_name, last_name, middle_name, phone, email, object_type, object_address, segment, status, manager_id, company_id, source) VALUES
(1, 'Виктория', 'Морозова', NULL, '+7 (978) 100-10-01', 'v.morozova@mail.ru', 'Квартира', 'Симферополь, ЖК «Сити Парк»', 'standard', 'active', 2, 2, 'Instagram'),
(2, 'Антон', 'Гусев', NULL, '+7 (978) 100-10-02', 'a.gusev@mail.ru', 'Дом', 'Симферополь, пос. Строгановка', 'standard', 'active', 3, 2, 'ВКонтакте'),
(3, 'Юлия', 'Белова', NULL, '+7 (978) 100-10-03', 'y.belova@mail.ru', 'Офис', 'Симферополь, ул. Киевская', 'business', 'active', 4, 2, 'Сайт'),
(4, 'Дмитрий', 'Орлов', NULL, '+7 (978) 100-10-04', 'd.orlov@mail.ru', 'Квартира', 'Симферополь, ЖК «Сити Парк»', 'standard', 'active', 5, 2, 'Instagram'),
(5, 'Светлана', 'Крылова', NULL, '+7 (978) 100-10-05', 's.krylova@mail.ru', 'Дом', 'Симферопольский р-н', 'premium', 'active', 2, 2, 'Реферальная'),
(6, 'Роман', 'Фёдоров', NULL, '+7 (978) 100-10-06', 'r.fedorov@mail.ru', 'Квартира', 'Симферополь, ул. Крылова', 'standard', 'active', 3, 2, 'Авито'),
(7, 'Мария', 'Петрова', NULL, '+7 (978) 100-10-07', 'm.petrova@mail.ru', 'Квартира', 'Симферополь, ЖК «Сити Парк», кв. 45', 'premium', 'vip', 2, 2, 'Instagram'),
(8, 'Алексей', 'Смирнов', NULL, '+7 (978) 100-10-08', 'a.smirnov@mail.ru', 'Квартира', 'Симферополь, ЖК «Центральный»', 'standard', 'active', 3, 2, 'ВКонтакте'),
(9, 'Ольга', 'Кузнецова', NULL, '+7 (978) 100-10-09', 'o.kuznetsova@mail.ru', 'Дом', 'Симферопольский р-н', 'standard', 'active', 4, 2, 'Яндекс.Директ'),
(10, 'Наталья', 'Соколова', NULL, '+7 (978) 100-10-10', 'n.sokolova@mail.ru', 'Квартира', 'Новокрымское ш., 25', 'standard', 'active', 2, 2, 'Сайт'),
(11, 'Максим', 'Фролов', NULL, '+7 (978) 100-10-11', 'm.frolov@mail.ru', 'Квартира', 'ЖК «Сердце столицы»', 'premium', 'active', 3, 2, 'Instagram'),
(12, 'Игорь', 'Волков', NULL, '+7 (978) 100-10-12', 'i.volkov@mail.ru', 'Офис', 'БЦ «Москва-Сити»', 'business', 'active', 4, 2, 'Реферальная'),
(13, 'Агаркова', 'Эстет', NULL, '+7 (978) 100-10-13', 'agarkova@mail.ru', 'Квартира', 'Симферополь', 'premium', 'active', 2, 2, 'Сайт');

SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));

-- ── Сделки (воронка) ──
INSERT INTO deals (id, client_id, stage_id, object_address, sum, manager_id, company_id, source, tag, task_note, is_overdue, stage_entered_at) VALUES
(1, 1, 1, 'Квартира, Симферополь', NULL, 2, 2, 'Instagram', 'Сегодня', NULL, FALSE, now()),
(2, 2, 1, 'Дом, Симферополь', NULL, 3, 2, 'ВКонтакте', NULL, 'Перезвонить', FALSE, now() - interval '1 day'),
(3, 3, 1, 'Офис, Симферополь', NULL, 4, 2, 'Сайт', NULL, NULL, FALSE, now() - interval '2 day'),
(4, 4, 2, 'Квартира, Симферополь', 850000, 5, 2, 'Instagram', NULL, 'Назначить замер', FALSE, now() - interval '2 day'),
(5, 5, 2, 'Дом, Симферополь', 1200000, 2, 2, 'Реферальная', NULL, NULL, FALSE, now() - interval '3 day'),
(6, 6, 2, 'Квартира, Симферополь', 780000, 3, 2, 'Авито', NULL, NULL, FALSE, now() - interval '1 day'),
(7, 7, 3, 'Квартира, ЖК «Сити Парк», кв. 45', 1245000, 2, 2, 'Instagram', 'КП-1246', NULL, FALSE, now() - interval '4 day'),
(8, 8, 4, 'Квартира, ЖК «Центральный»', 980000, 3, 2, 'ВКонтакте', NULL, NULL, FALSE, now() - interval '5 day'),
(9, 9, 5, 'Дом, Симферопольский р-н', 750000, 4, 2, 'Яндекс.Директ', NULL, NULL, TRUE, now() - interval '8 day'),
(10, 10, 6, 'Квартира, Новокрымское ш., 25', 675000, 2, 2, 'Сайт', NULL, NULL, FALSE, now() - interval '9 day'),
(11, 11, 7, 'Квартира, ЖК «Сердце столицы»', 1450000, 3, 2, 'Instagram', NULL, NULL, FALSE, now() - interval '12 day'),
(12, 12, 7, 'Офис, БЦ «Москва-Сити»', 620000, 4, 2, 'Реферальная', NULL, NULL, FALSE, now() - interval '14 day');

SELECT setval('deals_id_seq', (SELECT MAX(id) FROM deals));

-- ── История сделки №7 (для примера детальной карточки) ──
INSERT INTO deal_history (deal_id, employee_id, event_text, created_at) VALUES
(7, 2, 'Сделка создана', now() - interval '4 day'),
(7, 2, 'Отправлено портфолио', now() - interval '3 day'),
(7, 2, 'Назначен замер на 23 июня 10:00', now() - interval '1 day');

-- ── Задачи по сделке №7 ──
INSERT INTO deal_tasks (deal_id, text, done, tone, sort_order) VALUES
(7, 'Первый звонок', TRUE, NULL, 1),
(7, 'Отправить портфолио', TRUE, NULL, 2),
(7, 'Замер — 23 июн 10:00', FALSE, 'warn', 3),
(7, 'Подготовить КП после замера', FALSE, NULL, 4);


-- ===== V0008__seed_measurements_proposals_orders.sql =====
-- ============================================================
-- СИДЫ: замеры, контрольные замеры, КП, заказы
-- ============================================================

INSERT INTO measurements (id, code, deal_id, client_id, measure_type, object_type, object_name, address, measure_date, measure_time, manager_id, status, company_id) VALUES
(1, 'Z-1258', 7, 7, 'primary', 'Квартира', 'ЖК «Сити Парк»', 'кв. 45', CURRENT_DATE, '09:00', 2, 'scheduled', 2),
(2, 'Z-1259', 4, 4, 'control', NULL, 'Рублёво-Успенское ш.', 'д. 12', CURRENT_DATE, '08:30', 6, 'scheduled', 2),
(3, 'Z-1260', 6, 6, 'primary', 'Квартира', 'Новокрымское ш.', 'д. 25', CURRENT_DATE + 1, '09:00', 3, 'scheduled', 2),
(4, 'Z-1261', 11, 11, 'primary', 'Квартира', 'ЖК «Сердце столицы»', NULL, CURRENT_DATE + 1, '11:00', 2, 'scheduled', 2),
(5, 'Z-1262', 8, 8, 'control', 'Офис', 'БЦ «Москва-Сити»', NULL, CURRENT_DATE + 2, '11:30', 5, 'done', 2),
(6, 'Z-1264', NULL, 4, 'primary', NULL, NULL, NULL, CURRENT_DATE - 1, '10:00', 3, 'done', 2);

SELECT setval('measurements_id_seq', (SELECT MAX(id) FROM measurements));

-- ── КП ──
INSERT INTO proposals (id, code, version, deal_id, client_id, item_type, company_id, sum, discount, status, manager_id, created_at) VALUES
(1, 'КП-1258', 2, 7, 7, 'Кухня и остров', 2, 1850000, 310000, 'agreement', 2, now() - interval '1 day'),
(2, 'КП-1246', 1, 8, 8, 'Гостиная', 2, 980000, 50000, 'sent', 3, now() - interval '3 day'),
(3, 'КП-1250', 1, 9, 9, 'Кухня классика', 2, 750000, 0, 'accepted', 4, now() - interval '6 day');

SELECT setval('proposals_id_seq', (SELECT MAX(id) FROM proposals));

INSERT INTO proposal_items (proposal_id, name, qty, unit, price, sum, sort_order) VALUES
(1, 'Кухонный гарнитур П-образный', 1, 'компл.', 1250000, 1250000, 1),
(1, 'Остров с барной стойкой', 1, 'компл.', 480000, 480000, 2),
(1, 'Столешница кварц 40мм', 6.5, 'п.м.', 20000, 130000, 3),
(1, 'Фурнитура Blum', 1, 'компл.', 150000, 150000, 4),
(2, 'Диван модульный', 1, 'шт.', 420000, 420000, 1),
(2, 'Стенка под ТВ', 1, 'компл.', 380000, 380000, 2),
(2, 'Журнальный стол', 1, 'шт.', 180000, 180000, 3),
(3, 'Кухонный гарнитур классика', 1, 'компл.', 620000, 620000, 1),
(3, 'Столешница ДСП 38мм', 5, 'п.м.', 26000, 130000, 2);

-- ── Заказы ──
INSERT INTO orders (id, code, client_id, deal_id, proposal_id, object_address, item_type, sum, stage_id, progress_pct, manager_id, company_id, deadline, is_overdue) VALUES
(1, '№1258', 7, 7, 1, 'Квартира, ЖК «Парковый», Симферополь', 'Кухня и остров', 1245000, 3, 65, 2, 2, CURRENT_DATE + 20, FALSE),
(2, '№1256', 8, 8, 2, 'Квартира, ЖК «Центральный», Симферополь', 'Гостиная', 980000, 5, 100, 3, 2, CURRENT_DATE + 3, FALSE),
(3, '№1261', 9, 9, 3, 'Дом, Симферопольский р-н', 'Кухня классика', 750000, 2, 20, 4, 2, CURRENT_DATE + 25, FALSE),
(4, '№1263', 12, 12, NULL, 'Офис, БЦ «Москва-Сити»', 'Шкафы и стеллажи', 1130000, 1, 10, 4, 2, CURRENT_DATE + 30, FALSE),
(5, '№1255', 5, 5, NULL, 'Дом, Симферопольский р-н', 'Спальня', 680000, 3, 80, 2, 2, CURRENT_DATE - 2, TRUE),
(6, '№1253', 3, 3, NULL, 'Офис, ул. Киевская', 'Гардеробная', 420000, 6, 100, 4, 2, CURRENT_DATE - 5, FALSE),
(7, '№1250', 11, 11, NULL, 'Квартира, ЖК «Сердце столицы»', 'Кухня и остров', 675000, 7, 95, 3, 2, CURRENT_DATE + 1, FALSE);

SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));

INSERT INTO order_comments (order_id, employee_id, text, created_at) VALUES
(1, 2, 'Клиент подтвердил цвет фасадов — серый матовый RAL 7016.', now() - interval '1 day'),
(1, 4, 'Передан чертёж технологу. Ждём согласования.', now() - interval '2 day'),
(1, 1, 'Заказ создан и запущен в производство.', now() - interval '3 day');


-- ===== V0009__seed_production_chain.sql =====
-- ============================================================
-- СИДЫ: технология, снабжение, склад, производство, логистика, монтаж
-- ============================================================

-- ── Технические задания ──
INSERT INTO specifications (code, order_id, designer_id, status, materials, progress_pct, deadline) VALUES
('ТЗ-1258', 1, 9, 'in_progress', 'МДФ 18мм, Кварц, Blum', 60, CURRENT_DATE + 3),
('ТЗ-1263', 4, 9, 'draft', 'ДСП 16мм, Фурнитура эконом', 15, CURRENT_DATE + 7),
('ТЗ-1261', 3, 6, 'review', 'МДФ 16мм, Столешница ДСП', 90, CURRENT_DATE + 1);

-- ── Поставщики ──
INSERT INTO suppliers (id, name, phone, contact_person, rating) VALUES
(1, 'ООО «ЛесПромТорг»', '+7 (978) 200-10-01', 'Сергей Петров', 4.7),
(2, 'Blum Крым', '+7 (978) 200-10-02', 'Ирина Ковалёва', 4.9),
(3, 'КварцСтоун', '+7 (978) 200-10-03', 'Андрей Белов', 4.5);

SELECT setval('suppliers_id_seq', (SELECT MAX(id) FROM suppliers));

-- ── Заявки снабжения ──
INSERT INTO supply_requests (code, order_id, material_name, qty, unit, supplier_id, status, sum, requested_by) VALUES
('З-1045', 1, 'МДФ 18мм белый глянец', 150, 'листов', 1, 'confirmed', 675000, 4),
('З-1046', 1, 'Фурнитура Blum Legrabox', 12, 'компл.', 2, 'pending', 240000, 4),
('З-1047', 3, 'Столешница кварц 40мм', 8, 'п.м.', 3, 'in_transit', 160000, 4),
('З-1048', 4, 'ДСП 16мм дуб сонома', 60, 'листов', 1, 'out_of_stock', 210000, 4);

-- ── Склад ──
INSERT INTO warehouse_items (sku, name, unit, qty, min_qty, reserved_qty, price, location) VALUES
('MDF-18-W', 'МДФ 18мм белый глянец', 'листов', 220, 100, 150, 4500, 'Стеллаж А-3'),
('MDF-16', 'МДФ 16мм', 'листов', 45, 80, 30, 3800, 'Стеллаж А-4'),
('DSP-16-DS', 'ДСП 16мм дуб сонома', 'листов', 12, 50, 0, 3500, 'Стеллаж Б-1'),
('BLUM-LB', 'Фурнитура Blum Legrabox', 'компл.', 8, 15, 12, 20000, 'Стеллаж С-2'),
('QUARTZ-40', 'Столешница кварц 40мм', 'п.м.', 22, 20, 8, 20000, 'Стеллаж Д-1'),
('EDGE-2MM', 'Кромка ПВХ 2мм', 'рулон', 34, 10, 0, 1200, 'Стеллаж А-5');

-- ── Производство: задания по цехам ──
INSERT INTO production_tasks (order_id, workshop_id, stage_name, progress_pct, team_name, is_urgent, deadline) VALUES
(1, 1, 'Распил', 65, 'Бригада №1', FALSE, CURRENT_DATE + 20),
(3, 3, 'Сборка', 20, 'Бригада №2', FALSE, CURRENT_DATE + 25),
(4, 1, 'Проектирование', 10, 'Бригада №1', FALSE, CURRENT_DATE + 30),
(5, 4, 'Упаковка', 80, 'Бригада №3', TRUE, CURRENT_DATE - 2);

-- ── Логистика: транспорт ──
INSERT INTO vehicles (id, name, driver_id, status, trips_today) VALUES
(1, 'Газель ВС 123 РК', NULL, 'in_route', 2),
(2, 'Газель ВС 456 РК', NULL, 'free', 0),
(3, 'Ford Transit ВС 789 РК', NULL, 'maintenance', 0);

SELECT setval('vehicles_id_seq', (SELECT MAX(id) FROM vehicles));

-- ── Отгрузки ──
INSERT INTO shipments (order_id, address, ship_date, ship_time_range, vehicle_id, status) VALUES
(2, 'Симферополь, ЖК «Центральный»', CURRENT_DATE, '09:00–16:00', 1, 'confirmed'),
(6, 'Симферополь, ул. Киевская', CURRENT_DATE + 1, '10:00–18:00', 1, 'confirmed'),
(7, 'ЖК «Сердце столицы»', CURRENT_DATE + 2, '09:00–16:00', 2, 'in_transit'),
(4, 'БЦ «Москва-Сити»', CURRENT_DATE + 4, '10:00–14:00', NULL, 'scheduled');

-- ── Монтаж: бригады ──
INSERT INTO installation_teams (id, name, members, status) VALUES
(1, 'Бригада №1', 'Артём Кириллов, Сергей Лапин', 'on_site'),
(2, 'Бригада №2', 'Николай Волков, Игорь Титов', 'free'),
(3, 'Бригада №3', 'Совместная бригада 1+2', 'free');

SELECT setval('installation_teams_id_seq', (SELECT MAX(id) FROM installation_teams));

-- ── Монтажи ──
INSERT INTO installations (order_id, address, install_date, install_time_range, team_id, status, client_rating) VALUES
(2, 'Симферополь, ЖК «Центральный»', CURRENT_DATE, '10:00–18:00', 1, 'in_progress', NULL),
(7, 'ЖК «Сердце столицы», наб. Салгирная', CURRENT_DATE + 1, '09:00–16:00', 2, 'scheduled', NULL),
(6, 'пос. Строгановка, Коттедж', CURRENT_DATE + 2, '10:00–17:00', 3, 'scheduled', NULL),
(5, 'ЖК «Парковый», Симферополь', CURRENT_DATE - 3, '09:00–15:00', 2, 'completed', 4.8);


-- ===== V0010__seed_tasks_finance_marketing.sql =====
-- ============================================================
-- СИДЫ: задачи/планер, финансы, маркетинг
-- ============================================================

INSERT INTO tasks (title, description, task_type, priority, status, due_date, due_time, assignee_id, created_by, related_type, related_id, is_overdue) VALUES
('Замер у клиента', 'Мария Петрова, ЖК «Сити Парк», кв. 45', 'measurement', 'low', 'pending', CURRENT_DATE, '09:00', 2, 2, 'deal', 7, FALSE),
('Отгрузка заказа №1258', 'Кухня и остров', 'delivery', 'high', 'pending', CURRENT_DATE, '10:00', 3, 3, 'order', 1, FALSE),
('Подготовить КП', 'Алексей Смирнов', 'proposal', 'medium', 'pending', CURRENT_DATE, '11:00', 2, 2, 'deal', 8, FALSE),
('Передача заказа технологу', 'Заказ №1261', 'production', 'low', 'pending', CURRENT_DATE, '14:00', 4, 4, 'order', 3, FALSE),
('Просроченная задача', 'Подготовить чертежи', 'design', 'critical', 'pending', CURRENT_DATE - 2, '16:00', 6, 4, 'order', 4, TRUE),
('Контрольный замер', 'Ольга Кузнецова', 'measurement', 'medium', 'pending', CURRENT_DATE + 1, '08:30', 6, 4, 'deal', 9, FALSE),
('Согласование чертежей', 'Технология', 'design', 'medium', 'pending', CURRENT_DATE + 1, '12:00', 6, 6, 'order', 3, FALSE),
('Маркетинговая кампания VK', NULL, 'marketing', 'medium', 'pending', CURRENT_DATE + 2, NULL, 1, 1, NULL, NULL, FALSE),
('Обучение менеджеров', NULL, 'meeting', 'low', 'pending', CURRENT_DATE + 3, NULL, 1, 1, NULL, NULL, FALSE),
('Проверка склада', NULL, 'warehouse', 'low', 'pending', CURRENT_DATE + 3, NULL, 9, 1, NULL, NULL, FALSE);

-- ── Финансы: платежи ──
INSERT INTO payments (order_id, payment_type, category, sum, payment_date, company_id, comment, created_by) VALUES
(1, 'income', 'Предоплата от клиента', 622500, CURRENT_DATE - 5, 2, 'Предоплата 50% по заказу №1258', 2),
(2, 'income', 'Оплата по акту', 980000, CURRENT_DATE - 1, 2, 'Полная оплата заказа №1256', 3),
(1, 'expense', 'Материалы', 675000, CURRENT_DATE - 4, 2, 'Закупка МДФ по заявке З-1045', 4),
(3, 'income', 'Предоплата от клиента', 375000, CURRENT_DATE - 6, 2, 'Предоплата 50% заказ №1261', 4),
(5, 'expense', 'Зарплата бригады', 85000, CURRENT_DATE - 2, 2, 'Монтажная бригада №2', 1),
(6, 'income', 'Оплата по акту', 420000, CURRENT_DATE - 5, 2, 'Полная оплата заказа №1253', 4);

-- ── Себестоимость заказов ──
INSERT INTO order_costs (order_id, materials_cost, labor_cost, other_cost) VALUES
(1, 675000, 120000, 25000),
(2, 480000, 95000, 15000),
(3, 320000, 80000, 10000),
(6, 210000, 60000, 8000),
(7, 340000, 90000, 12000);

-- ── Маркетинг: бюджеты по источникам ──
INSERT INTO marketing_budgets (source_id, company_id, period_month, budget_sum, leads_count) VALUES
(1, 2, date_trunc('month', CURRENT_DATE), 62000, 18),
(2, 2, date_trunc('month', CURRENT_DATE), 39000, 11),
(3, 2, date_trunc('month', CURRENT_DATE), 31000, 8),
(4, 2, date_trunc('month', CURRENT_DATE), 24000, 6),
(5, 2, date_trunc('month', CURRENT_DATE), 18000, 5),
(6, 2, date_trunc('month', CURRENT_DATE), 0, 3);


-- ===== V0011__checklist_items.sql =====
-- Универсальный чек-лист по любой сущности (заказ, сделка и т.д.)
CREATE TABLE checklist_items (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(30) NOT NULL,
    entity_id INTEGER NOT NULL,
    text VARCHAR(255) NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_entity ON checklist_items(entity_type, entity_id);

-- Шаблоны чек-листов (готовые наборы пунктов для быстрого применения)
CREATE TABLE checklist_templates (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO checklist_templates (entity_type, name, items, sort_order) VALUES
('order', 'Стандартный цикл заказа', '[
  "Проверить оплату / предоплату",
  "Согласовать чертежи с клиентом",
  "Передать ТЗ технологу",
  "Заказать материалы и фурнитуру",
  "Запустить в производство",
  "Контроль качества перед отгрузкой",
  "Согласовать дату доставки",
  "Назначить монтажную бригаду",
  "Получить подпись акта сдачи",
  "Закрыть финансовые документы"
]', 1),
('deal', 'Быстрый старт сделки', '[
  "Первый звонок клиенту",
  "Уточнить бюджет и пожелания",
  "Назначить замер",
  "Подготовить КП",
  "Отправить КП клиенту",
  "Согласовать условия",
  "Получить предоплату"
]', 1);


-- ===== V0012__client_objects.sql =====
-- Мультиобъекты клиента: у клиента может быть несколько объектов (квартиры/дома/офисы)
CREATE TABLE client_objects (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    object_type VARCHAR(50),
    address TEXT,
    label VARCHAR(150),
    comment TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_objects_client ON client_objects(client_id);

-- Переносим текущий единственный объект каждого клиента в новую таблицу как основной
INSERT INTO client_objects (client_id, object_type, address, is_primary, created_at)
SELECT id, object_type, object_address, TRUE, created_at
FROM clients
WHERE object_address IS NOT NULL OR object_type IS NOT NULL;

-- Добавляем ссылку на конкретный объект клиента в сделки, замеры и заказы
ALTER TABLE deals ADD COLUMN client_object_id INTEGER;
ALTER TABLE measurements ADD COLUMN client_object_id INTEGER;
ALTER TABLE orders ADD COLUMN client_object_id INTEGER;

CREATE INDEX idx_deals_client_object ON deals(client_object_id);
CREATE INDEX idx_measurements_client_object ON measurements(client_object_id);
CREATE INDEX idx_orders_client_object ON orders(client_object_id);


-- ============================================================
-- Дополнительные демонстрационные данные (добавлены через работу в системе)
-- ============================================================

-- Второй объект клиента №1 (демонстрация мультиобъектов)
INSERT INTO client_objects (client_id, object_type, address, label, is_primary) VALUES
(1, 'Дача', 'Симферополь, ул. Тестовая, 5', 'Второй объект', FALSE);

-- Чек-лист по заказу №1 (демонстрация применения шаблона "Стандартный цикл заказа")
INSERT INTO checklist_items (entity_type, entity_id, text, done, sort_order) VALUES
('order', 1, 'Проверить оплату / предоплату', FALSE, 0),
('order', 1, 'Согласовать чертежи с клиентом', FALSE, 1),
('order', 1, 'Передать ТЗ технологу', FALSE, 2),
('order', 1, 'Заказать материалы и фурнитуру', FALSE, 3),
('order', 1, 'Запустить в производство', FALSE, 4),
('order', 1, 'Контроль качества перед отгрузкой', FALSE, 5),
('order', 1, 'Согласовать дату доставки', FALSE, 6),
('order', 1, 'Назначить монтажную бригаду', FALSE, 7),
('order', 1, 'Получить подпись акта сдачи', FALSE, 8),
('order', 1, 'Закрыть финансовые документы', FALSE, 9);
