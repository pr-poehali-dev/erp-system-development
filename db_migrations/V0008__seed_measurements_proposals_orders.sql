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
