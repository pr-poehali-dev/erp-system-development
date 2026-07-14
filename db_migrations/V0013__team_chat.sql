-- ============================================================
-- Внутренний чат сотрудников (группы + личные сообщения + файлы)
-- ============================================================

CREATE TABLE chat_channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150),
    channel_type VARCHAR(20) NOT NULL DEFAULT 'group', -- 'group' | 'direct'
    icon VARCHAR(50),
    created_by INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_members (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    last_read_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_chat_members_unique ON chat_members(channel_id, employee_id);
CREATE INDEX idx_chat_members_employee ON chat_members(employee_id);

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    text TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    file_type VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_channel ON chat_messages(channel_id, created_at);

-- Дефолтный общий канал компании для всех сотрудников
INSERT INTO chat_channels (id, name, channel_type, icon) VALUES
(1, 'Общий чат компании', 'group', 'Building2');
SELECT setval('chat_channels_id_seq', (SELECT MAX(id) FROM chat_channels));

INSERT INTO chat_members (channel_id, employee_id)
SELECT 1, id FROM employees;

INSERT INTO chat_messages (channel_id, employee_id, text) VALUES
(1, (SELECT id FROM employees WHERE login = 'admin'), 'Добро пожаловать во внутренний чат компании! Здесь можно обсуждать рабочие вопросы и делиться файлами.');
