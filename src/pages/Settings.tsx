import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import { ThemeToggleSwitch } from '@/components/ThemeToggle';
import { api } from '@/lib/api';

interface CompanyOpt { id: number; slug: string; name: string; }

const sections = ['Компании', 'Внешний вид', 'Пользователи и роли', 'Уведомления', 'Интеграции', 'Шаблоны', 'Безопасность'];
const sectionIcons: Record<string, string> = { 'Компании': 'Building2', 'Внешний вид': 'Palette', 'Пользователи и роли': 'Users', 'Уведомления': 'Bell', 'Интеграции': 'Puzzle', 'Шаблоны': 'FileText', 'Безопасность': 'Shield' };

const Settings = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('Компании');
  const [notif, setNotif] = useState({ newLead: true, taskDue: true, orderReady: true, overdue: true, sms: false, email: true });
  const [companies, setCompanies] = useState<CompanyOpt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ companies: CompanyOpt[] }>('employees');
      setCompanies(data.companies);
    } catch (e) {
      // silent — секция всё равно покажет заглушку при пустом списке
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Layout title="Настройки" titleIcon="Settings">
      <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-5">
        {/* Menu */}
        <div className="glass-card rounded-2xl p-3 h-fit animate-fade-in opacity-0">
          {sections.map((s) => (
            <button key={s} onClick={() => setActiveSection(s)} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-0.5 text-[13px] text-left transition-colors ${activeSection === s ? 'bg-gold/12 text-gold font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
              <Icon name={sectionIcons[s] || 'Settings'} size={16} />
              {s}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-5 animate-fade-in opacity-0">
          {activeSection === 'Компании' && (
            <>
              {loading ? (
                <div className="glass-card rounded-2xl p-12 flex items-center justify-center"><Icon name="Loader2" size={28} className="text-gold animate-spin" /></div>
              ) : companies.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <Icon name="Building2" size={40} className="text-gold mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground text-sm">Компании не найдены</p>
                </div>
              ) : (
                companies.map((c) => (
                  <div key={c.id} className="glass-card rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center text-background font-bold text-[12px] shrink-0">{c.name.slice(0, 2).toUpperCase()}</div>
                      <h3 className="font-display font-bold text-base">{c.name}</h3>
                    </div>
                    <p className="text-[12px] text-muted-foreground">Идентификатор: {c.slug}</p>
                  </div>
                ))
              )}
            </>
          )}

          {activeSection === 'Внешний вид' && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-display font-bold text-base mb-1">Тема оформления</h3>
              <p className="text-[12px] text-muted-foreground mb-5">Выберите комфортную цветовую схему интерфейса</p>
              <ThemeToggleSwitch />
            </div>
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
                  { key: 'email', label: 'Email-рассылка', sub: 'Ежедневный дайджест на почту' },
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
            <div className="glass-card rounded-2xl p-8 text-center">
              <Icon name="Users" size={40} className="text-gold mx-auto mb-4 opacity-50" />
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Управление сотрудниками</h3>
              <p className="text-muted-foreground text-sm mb-5">Добавление, редактирование и роли сотрудников — в разделе «Сотрудники»</p>
              <button onClick={() => navigate('/staff')} className="px-5 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm inline-flex items-center gap-2">
                <Icon name="UserCog" size={15} /> Перейти к сотрудникам
              </button>
            </div>
          )}

          {!['Компании', 'Внешний вид', 'Уведомления', 'Пользователи и роли'].includes(activeSection) && (
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