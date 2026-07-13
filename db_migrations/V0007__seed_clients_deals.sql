-- ============================================================
-- СИДЫ: клиенты и сделки (воронка продаж)
-- ============================================================

INSERT INTO clients (id, first_name, last_name, middle_name, phone, email, object_type, object_address, segment, status, manager_id, company_id, source) VALUES
(1, 'Виктория', 'Морозова', NULL, '+7 (978) 100-10-01', 'v.morozova@mail.ru', 'Квартира', 'Симферополь, ЖК «Сити Парк»', 'standard', 'active', 2, 2, 'Instagram'),
(2, 'Антон', 'Гусев', NULL, '+7 (978) 100-10-02', 'a.gusev@mail.ru', 'Дом', 'Симферополь, пос. Строгановка', 'standard', 'active', 3, 2, 'ВКонтакте'),
(3, 'Юлия', 'Белова', NULL, '+7 (978) 100-10-03', 'y.belova@mail.ru', 'Офис', 'Симферополь, ул. Киевская', 'business', 'active', 4, 2, 'Сайт'),
(4, 'Дмитрий', 'Орлов', NULL, '+7 (978) 100-10-04', 'd.orlov@mail.ru', 'Квартира', 'Симферополь, ЖК «Сити Парк»', 'standard', 'active', 5, 2, 'Instagram'),
(5, 'Светлана', 'Крылова', NULL, '+7 (978) 100-10-05', 's.krylova@mail.ru', 'Дом', 'Симферопольский р-н', 'premium', 'active', 2, 2, 'Реферальная'),
(6, 'Роман', 'Фёдоров', NULL, '+7 (978) 100-10-06', 'r.fedorov@mail.ru', 'Квартира', 'Симферополь, ул. Крылова', 'standard', 'active', 3, 2, 'Авито'),
(7, 'Мария', 'Петрова', NULL, '+7 (978) 100-10-07', 'm.petrova@mail.ru', 'Квартира', 'Симферополь, ЖК «Сити Парк», кв. 45', 'premium', 'vip', 2, 2, 'Instagram'),
(8, 'Алексей', 'Смирнов', NULL, '+7 (978) 100-10-08', 'a.smirnov@mail.ru', 'Квартира', 'Симферополь, ЖК «Центральный»', 'standard', 'active', 3, 2, 'ВКонтакте'),
(9, 'Ольга', 'Кузнецова', NULL, '+7 (978) 100-10-09', 'o.kuznetsova@mail.ru', 'Дом', 'Симферопольский р-н', 'standard', 'active', 4, 2, 'Яндекс.Директ'),
(10, 'Наталья', 'Соколова', NULL, '+7 (978) 100-10-10', 'n.sokolova@mail.ru', 'Квартира', 'Новокрымское ш., 25', 'standard', 'active', 2, 2, 'Сайт'),
(11, 'Максим', 'Фролов', NULL, '+7 (978) 100-10-11', 'm.frolov@mail.ru', 'Квартира', 'ЖК «Сердце столицы»', 'premium', 'active', 3, 2, 'Instagram'),
(12, 'Игорь', 'Волков', NULL, '+7 (978) 100-10-12', 'i.volkov@mail.ru', 'Офис', 'БЦ «Москва-Сити»', 'business', 'active', 4, 2, 'Реферальная'),
(13, 'Агаркова', 'Эстет', NULL, '+7 (978) 100-10-13', 'agarkova@mail.ru', 'Квартира', 'Симферополь', 'premium', 'active', 2, 2, 'Сайт');

SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));

-- ── Сделки (воронка) ──
INSERT INTO deals (id, client_id, stage_id, object_address, sum, manager_id, company_id, source, tag, task_note, is_overdue, stage_entered_at) VALUES
(1, 1, 1, 'Квартира, Симферополь', NULL, 2, 2, 'Instagram', 'Сегодня', NULL, FALSE, now()),
(2, 2, 1, 'Дом, Симферополь', NULL, 3, 2, 'ВКонтакте', NULL, 'Перезвонить', FALSE, now() - interval '1 day'),
(3, 3, 1, 'Офис, Симферополь', NULL, 4, 2, 'Сайт', NULL, NULL, FALSE, now() - interval '2 day'),
(4, 4, 2, 'Квартира, Симферополь', 850000, 5, 2, 'Instagram', NULL, 'Назначить замер', FALSE, now() - interval '2 day'),
(5, 5, 2, 'Дом, Симферополь', 1200000, 2, 2, 'Реферальная', NULL, NULL, FALSE, now() - interval '3 day'),
(6, 6, 2, 'Квартира, Симферополь', 780000, 3, 2, 'Авито', NULL, NULL, FALSE, now() - interval '1 day'),
(7, 7, 3, 'Квартира, ЖК «Сити Парк», кв. 45', 1245000, 2, 2, 'Instagram', 'КП-1246', NULL, FALSE, now() - interval '4 day'),
(8, 8, 4, 'Квартира, ЖК «Центральный»', 980000, 3, 2, 'ВКонтакте', NULL, NULL, FALSE, now() - interval '5 day'),
(9, 9, 5, 'Дом, Симферопольский р-н', 750000, 4, 2, 'Яндекс.Директ', NULL, NULL, TRUE, now() - interval '8 day'),
(10, 10, 6, 'Квартира, Новокрымское ш., 25', 675000, 2, 2, 'Сайт', NULL, NULL, FALSE, now() - interval '9 day'),
(11, 11, 7, 'Квартира, ЖК «Сердце столицы»', 1450000, 3, 2, 'Instagram', NULL, NULL, FALSE, now() - interval '12 day'),
(12, 12, 7, 'Офис, БЦ «Москва-Сити»', 620000, 4, 2, 'Реферальная', NULL, NULL, FALSE, now() - interval '14 day');

SELECT setval('deals_id_seq', (SELECT MAX(id) FROM deals));

-- ── История сделки №7 (для примера детальной карточки) ──
INSERT INTO deal_history (deal_id, employee_id, event_text, created_at) VALUES
(7, 2, 'Сделка создана', now() - interval '4 day'),
(7, 2, 'Отправлено портфолио', now() - interval '3 day'),
(7, 2, 'Назначен замер на 23 июня 10:00', now() - interval '1 day');

-- ── Задачи по сделке №7 ──
INSERT INTO deal_tasks (deal_id, text, done, tone, sort_order) VALUES
(7, 'Первый звонок', TRUE, NULL, 1),
(7, 'Отправить портфолио', TRUE, NULL, 2),
(7, 'Замер — 23 июн 10:00', FALSE, 'warn', 3),
(7, 'Подготовить КП после замера', FALSE, NULL, 4);
