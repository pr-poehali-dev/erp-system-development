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
