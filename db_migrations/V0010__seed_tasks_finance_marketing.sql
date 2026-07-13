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
