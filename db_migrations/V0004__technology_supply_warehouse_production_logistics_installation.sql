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
