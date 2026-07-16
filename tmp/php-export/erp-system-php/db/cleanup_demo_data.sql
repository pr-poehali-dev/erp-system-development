-- ============================================================
-- Очистка демо-данных в текущей базе на poehali.dev
-- Выполнить в: Ядро → База данных → SQL-консоль
--
-- Оставляет: роли, отделы, компании, стадии сделок, этапы заказов,
--            цеха, источники маркетинга, шаблоны чек-листов, аккаунт admin
-- Удаляет: всех тестовых сотрудников, клиентов, сделки, заказы, замеры,
--          КП, склад, снабжение, производство, логистику, монтажи,
--          задачи, финансы, маркетинг-бюджеты, демо-сообщения чата
-- ============================================================

DELETE FROM chat_messages;
DELETE FROM chat_members;
DELETE FROM checklist_items;
DELETE FROM production_tasks;
DELETE FROM shipments;
DELETE FROM installations;
DELETE FROM warehouse_movements;
DELETE FROM warehouse_items;
DELETE FROM supply_requests;
DELETE FROM order_costs;
DELETE FROM order_comments;
DELETE FROM orders;
DELETE FROM specifications;
DELETE FROM proposal_items;
DELETE FROM proposals;
DELETE FROM control_measurements;
DELETE FROM measurements;
DELETE FROM deal_tasks;
DELETE FROM deal_history;
DELETE FROM deals;
DELETE FROM client_objects;
DELETE FROM clients;
DELETE FROM tasks;
DELETE FROM payments;
DELETE FROM marketing_budgets;
DELETE FROM vehicles;
DELETE FROM suppliers;
DELETE FROM installation_teams;

-- Сессии тестовых сотрудников (оставляем только сессии admin, id=1)
DELETE FROM sessions WHERE employee_id != 1;

-- Тестовые сотрудники (оставляем только admin, id=1)
DELETE FROM employees WHERE id != 1;

-- Восстанавливаем admin в общем чат-канале
INSERT INTO chat_members (channel_id, employee_id)
SELECT 1, id FROM employees WHERE id = 1
ON CONFLICT DO NOTHING;
