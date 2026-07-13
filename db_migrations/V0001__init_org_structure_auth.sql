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
VALUES ('Дмитрий', 'Горбунов', 'djgorbunov@gmail.com', 'admin', '__PENDING__', FALSE,
        (SELECT id FROM roles WHERE slug = 'owner'), 1, NULL, 'active');
