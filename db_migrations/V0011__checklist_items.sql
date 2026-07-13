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
