-- ============================================================
-- ERP System — MySQL схема: организационная структура + авторизация
-- Модуль 1 из 5 (Auth + Employees). Без демо-данных — только
-- структурные справочники (компании, отделы, роли) и аккаунт admin.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Компании (бренды/юрлица) ──
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    tagline VARCHAR(255),
    segment VARCHAR(255),
    description TEXT,
    logo_text VARCHAR(10),
    image_url TEXT,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Отделы (дерево) ──
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NULL,
    name VARCHAR(200) NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    responsibilities JSON NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_departments_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Роли и права ──
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    permissions JSON NOT NULL,
    is_system TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Сотрудники ──
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30),
    login VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    must_change_password TINYINT(1) NOT NULL DEFAULT 1,
    role_id INT NOT NULL,
    department_id INT NULL,
    company_id INT NULL,
    avatar_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    hired_at DATE NOT NULL DEFAULT (CURRENT_DATE),
    fired_at DATE NULL,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_employees_login (login),
    INDEX idx_employees_email (email),
    CONSTRAINT fk_employees_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT fk_employees_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Сессии (токены авторизации) ──
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    INDEX idx_sessions_token (token),
    INDEX idx_sessions_employee (employee_id),
    CONSTRAINT fk_sessions_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Структурные данные (НЕ демо) — компании
-- ============================================================
INSERT INTO companies (slug, name, tagline, segment, description, logo_text, is_active) VALUES
('kontur', 'КОНТУР+', 'МЕБЕЛЬ НА ПРАКТИКЕ', 'СЕГМЕНТ: НИЖЕ СРЕДНЕГО', 'Практичные мебельные решения по доступным ценам.', 'K+', 1),
('territory', 'ТЕРРИТОРИЯ МЕБЕЛИ', 'ИНДИВИДУАЛЬНЫЕ РЕШЕНИЯ ПРЕМИУМ-КЛАССА', 'СЕГМЕНТ: ВЫШЕ СРЕДНЕГО / ПРЕМИУМ', 'Индивидуальный подход, премиальные материалы и безупречный сервис.', 'ТМ', 1);

-- ============================================================
-- Структурные данные (НЕ демо) — дерево отделов
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

-- ============================================================
-- Структурные данные (НЕ демо) — роли и права
-- ============================================================
INSERT INTO roles (slug, name, description, permissions, is_system) VALUES
('owner', 'Собственник', 'Полный доступ ко всей системе, всем компаниям и настройкам', '["*"]', 1),
('admin', 'Администратор', 'Полный доступ к системе и управлению пользователями', '["*"]', 1),
('sales_manager', 'Менеджер продаж', 'Работа со сделками, клиентами, КП', '["crm.view","crm.edit","clients.view","clients.edit","proposals.view","proposals.edit"]', 0),
('measurer', 'Замерщик', 'Проведение и учёт замеров объектов', '["measurements.view","measurements.edit"]', 0),
('technologist', 'Технолог', 'Технические решения, чертежи и спецификации', '["technology.view","technology.edit","orders.view"]', 0),
('supply_manager', 'Снабженец', 'Закупки материалов и работа с поставщиками', '["supply.view","supply.edit","warehouse.view"]', 0),
('marketer', 'Маркетолог', 'Маркетинг, реклама, аналитика лидов', '["marketing.view","marketing.edit"]', 0),
('finance_manager', 'Финансист', 'Финансовый учёт и отчётность', '["finance.view","finance.edit","reports.view"]', 0),
('production_master', 'Мастер цеха', 'Контроль производства и цехов', '["production.view","production.edit","orders.view"]', 0),
('installer', 'Монтажник', 'Выполнение монтажных работ на объектах', '["installation.view","installation.edit"]', 0);

-- ============================================================
-- Аккаунт администратора (пароль будет установлен install.sh)
-- ============================================================
INSERT INTO employees (first_name, last_name, email, login, password_hash, must_change_password, role_id, department_id, company_id, status)
VALUES ('Администратор', 'Системы', 'admin@example.com', 'admin', '__PENDING__', 0,
        (SELECT id FROM roles WHERE slug = 'owner'), 1, NULL, 'active');
