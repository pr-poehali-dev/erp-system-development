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
