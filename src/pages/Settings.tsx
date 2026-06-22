import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const sections = ['Компании', 'Пользователи и роли', 'Уведомления', 'Интеграции', 'Шаблоны', 'Безопасность'];

const Settings = () => {
  const [activeSection, setActiveSection] = useState('Компании');
  const [notif, setNotif] = useState({ newLead: true, taskDue: true, orderReady: true, overdue: true, sms: false, email: true });

  return (
    <Layout title="Настройки" titleIcon="Settings">
      <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-5">
        {/* Menu */}
        <div className="glass-card rounded-2xl p-3 h-fit animate-fade-in opacity-0">
          {sections.map((s) => (
            <button key={s} onClick={() => setActiveSection(s)} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-0.5 text-[13px] text-left transition-colors ${activeSection === s ? 'bg-gold/12 text-gold font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
              <Icon name={{ 'Компании': 'Building2', 'Пользователи и роли': 'Users', 'Уведомления': 'Bell', 'Интеграции': 'Puzzle', 'Шаблоны': 'FileText', 'Безопасность': 'Shield' }[s] || 'Settings'} size={16} />
              {s}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-5 animate-fade-in opacity-0">
          {activeSection === 'Компании' && (
            <>
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-display font-bold text-base mb-4">Территория Мебели</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[{ l: 'Название компании', v: 'Территория Мебели' }, { l: 'ИНН', v: '9102123456' }, { l: 'Телефон', v: '+7 (978) 500-10-20' }, { l: 'Email', v: 'info@неостандарт.рф' }, { l: 'Адрес', v: 'Симферополь, ул. Ленина, 15' }, { l: 'Сегмент', v: 'Выше среднего / Премиум' }].map((f) => (
                    <div key={f.l}>
                      <label className="text-[11px] text-muted-foreground mb-1 block">{f.l}</label>
                      <input defaultValue={f.v} className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-gold/50 transition-colors" />
                    </div>
                  ))}
                </div>
                <button className="mt-4 px-5 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm">Сохранить</button>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-display font-bold text-base mb-4">Контур+</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[{ l: 'Название компании', v: 'Контур+' }, { l: 'ИНН', v: '9102654321' }, { l: 'Телефон', v: '+7 (978) 500-30-40' }, { l: 'Email', v: 'info@kontur-plus.ru' }, { l: 'Адрес', v: 'Симферополь, ул. Гагарина, 8' }, { l: 'Сегмент', v: 'Ниже среднего' }].map((f) => (
                    <div key={f.l}>
                      <label className="text-[11px] text-muted-foreground mb-1 block">{f.l}</label>
                      <input defaultValue={f.v} className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-gold/50 transition-colors" />
                    </div>
                  ))}
                </div>
                <button className="mt-4 px-5 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm">Сохранить</button>
              </div>
            </>
          )}

          {activeSection === 'Уведомления' && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-display font-bold text-base mb-4">Настройки уведомлений</h3>
              <div className="space-y-4">
                {[
                  { key: 'newLead', label: 'Новый лид', sub: 'Уведомление при появлении нового лида' },
                  { key: 'taskDue', label: 'Задача на сегодня', sub: 'Напоминание о задачах, которые нужно выполнить' },
                  { key: 'orderReady', label: 'Заказ готов к монтажу', sub: 'Когда производство завершено' },
                  { key: 'overdue', label: 'Просроченные задачи', sub: 'Ежедневный отчет по просроченным задачам' },
                  { key: 'sms', label: 'SMS-уведомления', sub: 'Отправка важных уведомлений по SMS' },
                  { key: 'email', label: 'Email-рассылка', sub: 'Ежедневный дайджест на info@неостандарт.рф' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-secondary">
                    <div>
                      <div className="text-[13px] font-semibold text-foreground">{item.label}</div>
                      <div className="text-[11px] text-muted-foreground">{item.sub}</div>
                    </div>
                    <button
                      onClick={() => setNotif((p) => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                      className={`w-11 h-6 rounded-full transition-colors relative ${notif[item.key as keyof typeof notif] ? 'bg-gold' : 'bg-muted'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${notif[item.key as keyof typeof notif] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'Пользователи и роли' && (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-base">Пользователи системы</h3>
                <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl gold-gradient text-background font-semibold text-sm">
                  <Icon name="Plus" size={15} /> Добавить
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'Александр (Собственник)', email: 'a@неостандарт.рф', role: 'Администратор', active: true },
                  { name: 'Иванова А.С.', email: 'ivanova@неостандарт.рф', role: 'Менеджер', active: true },
                  { name: 'Петрова Е.В.', email: 'petrova@неостандарт.рф', role: 'Менеджер', active: true },
                  { name: 'Кузнецов Д.А.', email: 'kuznetsov@неостандарт.рф', role: 'Менеджер', active: true },
                  { name: 'Морозова В.А.', email: 'morozova@неостандарт.рф', role: 'Дизайнер', active: false },
                ].map((u) => (
                  <div key={u.email} className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                    <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-background font-bold text-[11px] shrink-0">{u.name.slice(0, 2).toUpperCase()}</div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-foreground">{u.name}</div>
                      <div className="text-[11px] text-muted-foreground">{u.email}</div>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground">{u.role}</span>
                    <span className={`text-[11px] px-2 py-1 rounded-md ${u.active ? 'bg-status-ok/15 text-status-ok' : 'bg-muted text-muted-foreground'}`}>{u.active ? 'Активен' : 'Неактивен'}</span>
                    <button className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"><Icon name="MoreVertical" size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!['Компании', 'Уведомления', 'Пользователи и роли'].includes(activeSection) && (
            <div className="glass-card rounded-2xl p-12 text-center animate-fade-in opacity-0">
              <Icon name="Settings" size={40} className="text-gold mx-auto mb-4 opacity-50" />
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Раздел «{activeSection}»</h3>
              <p className="text-muted-foreground text-sm">Настройки этого раздела в разработке.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
