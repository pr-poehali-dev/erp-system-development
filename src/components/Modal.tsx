import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/icon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  badge?: { label: string; tone: 'ok' | 'warn' | 'crit' | 'info' | 'gold' | 'muted' };
  headerRight?: React.ReactNode;
  noPadding?: boolean;
}

const sizeClass: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[90vw]',
};

const badgeClass: Record<string, string> = {
  ok:    'badge-ok',
  warn:  'badge-warn',
  crit:  'badge-crit',
  info:  'badge-info',
  gold:  'badge-gold',
  muted: 'badge-muted',
};

const Modal = ({
  open, onClose, title, subtitle, icon, size = 'md',
  children, footer, badge, headerRight, noPadding,
}: ModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-overlay-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Decorative background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-gold/[0.03] blur-3xl" />
      </div>

      <div className={`relative w-full ${sizeClass[size]} glass-modal rounded-2xl animate-modal-in overflow-hidden max-h-[90vh] flex flex-col`}>
        {/* Decorative top line */}
        <div className="absolute top-0 left-0 right-0 h-px gold-gradient opacity-60" />

        {/* Header */}
        {(title || icon) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="w-10 h-10 rounded-xl bg-gold/12 border border-gold/20 flex items-center justify-center shrink-0 animate-float">
                  <Icon name={icon} size={20} className="text-gold" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {title && <h2 className="font-display font-extrabold text-lg text-foreground">{title}</h2>}
                  {badge && (
                    <span className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold tracking-wide ${badgeClass[badge.tone]}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              {headerRight}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-secondary hover:bg-muted border border-border hover:border-gold/30 flex items-center justify-center transition-all duration-200 group"
              >
                <Icon name="X" size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className={`flex-1 overflow-y-auto scrollbar-thin ${noPadding ? '' : 'px-6 pb-4'}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border bg-secondary/30 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;

/* === Preset modal forms === */

interface QuickCreateModalProps {
  open: boolean;
  onClose: () => void;
}

export const QuickCreateModal = ({ open, onClose }: QuickCreateModalProps) => {
  const actions = [
    { icon: 'UserPlus', label: 'Новая сделка', sub: 'CRM / воронка продаж', tone: 'info' as const },
    { icon: 'Ruler', label: 'Назначить замер', sub: 'Первичный или контрольный', tone: 'ok' as const },
    { icon: 'FileText', label: 'Создать КП', sub: 'Коммерческое предложение', tone: 'gold' as const },
    { icon: 'ClipboardList', label: 'Новый заказ', sub: 'Запустить в производство', tone: 'warn' as const },
    { icon: 'CalendarCheck', label: 'Новая задача', sub: 'В планер и задачи', tone: 'ok' as const },
    { icon: 'Wrench', label: 'Назначить монтаж', sub: 'Бригада и дата', tone: 'crit' as const },
    { icon: 'Contact', label: 'Новый клиент', sub: 'Добавить в базу', tone: 'info' as const },
    { icon: 'PackageSearch', label: 'Заявка снабжению', sub: 'Материалы и комплектующие', tone: 'muted' as const },
  ];

  const toneGrad: Record<string, string> = {
    ok: 'from-status-ok/10 to-transparent border-status-ok/20 hover:border-status-ok/40',
    warn: 'from-status-warn/10 to-transparent border-status-warn/20 hover:border-status-warn/40',
    crit: 'from-status-crit/10 to-transparent border-status-crit/20 hover:border-status-crit/40',
    info: 'from-[hsl(199_60%_50%)]/10 to-transparent border-[hsl(199_60%_50%)]/20 hover:border-[hsl(199_60%_50%)]/40',
    gold: 'from-gold/10 to-transparent border-gold/20 hover:border-gold/40',
    muted: 'from-muted/50 to-transparent border-border hover:border-gold/30',
  };
  const toneIcon: Record<string, string> = {
    ok: 'text-status-ok', warn: 'text-status-warn', crit: 'text-status-crit',
    info: 'text-[hsl(199_60%_60%)]', gold: 'text-gold', muted: 'text-muted-foreground',
  };

  return (
    <Modal open={open} onClose={onClose} title="Быстрое создание" subtitle="Выберите действие для быстрого старта" icon="Zap" size="lg">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-2">
        {actions.map((a, i) => (
          <button
            key={a.label}
            onClick={onClose}
            className={`flex flex-col items-center text-center p-4 rounded-xl bg-gradient-to-b border card-hover animate-slide-bottom opacity-0 ${toneGrad[a.tone]}`}
            style={{ animationDelay: `${i * 45}ms` }}
          >
            <div className={`w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center mb-3 ${toneIcon[a.tone]}`} style={{ background: 'currentColor', opacity: 0.12 }}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneIcon[a.tone]}`} style={{ position: 'absolute' }}>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 -mt-12 ${toneIcon[a.tone]} bg-current/[0.08]`}>
              <Icon name={a.icon} size={22} />
            </div>
            <div className="font-semibold text-[13px] text-foreground mb-1">{a.label}</div>
            <div className="text-[11px] text-muted-foreground">{a.sub}</div>
          </button>
        ))}
      </div>
    </Modal>
  );
};

export const NotificationsModal = ({ open, onClose }: QuickCreateModalProps) => {
  const notifs = [
    { icon: 'UserPlus', title: 'Новый лид', sub: 'Виктория Морозова — квартира в Симферополе', time: '2 мин назад', tone: 'info' as const, read: false },
    { icon: 'Clock', title: 'Просроченная задача', sub: 'Подготовить КП для Кузнецовой О.', time: '15 мин назад', tone: 'crit' as const, read: false },
    { icon: 'CheckCircle', title: 'Замер выполнен', sub: 'Замер №Z-1264 — Максим Фролов', time: '1 час назад', tone: 'ok' as const, read: false },
    { icon: 'Factory', title: 'Заказ готов к монтажу', sub: 'Заказ №1256 — Алексей Смирнов', time: '2 часа назад', tone: 'ok' as const, read: true },
    { icon: 'AlertTriangle', title: 'Нехватка материалов', sub: 'МДФ 18мм — остаток ниже минимума', time: '3 часа назад', tone: 'warn' as const, read: true },
    { icon: 'Truck', title: 'Доставка в пути', sub: 'Заказ №1250 — выехал к клиенту', time: '4 часа назад', tone: 'info' as const, read: true },
    { icon: 'FileText', title: 'КП согласовано', sub: 'КП-1258 принято клиентом', time: '5 часов назад', tone: 'ok' as const, read: true },
    { icon: 'MessageSquare', title: 'Комментарий к сделке', sub: 'Иванова А.С.: «Клиент перезвонит завтра»', time: '6 часов назад', tone: 'muted' as const, read: true },
  ];

  const toneIcon: Record<string, string> = {
    ok: 'text-status-ok bg-status-ok/10', warn: 'text-status-warn bg-status-warn/10',
    crit: 'text-status-crit bg-status-crit/10', info: 'text-[hsl(199_60%_60%)] bg-[hsl(199_60%_50%)]/10',
    muted: 'text-muted-foreground bg-muted',
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Уведомления"
      icon="Bell"
      size="md"
      headerRight={
        <button className="text-[11px] text-gold/80 hover:text-gold transition-colors px-2">Прочитать все</button>
      }
      footer={
        <button className="w-full text-center text-sm text-gold/80 hover:text-gold transition-colors">Все уведомления →</button>
      }
    >
      <div className="space-y-1">
        {notifs.map((n, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer ${n.read ? 'hover:bg-secondary/50' : 'bg-gold/[0.04] border border-gold/10 hover:border-gold/20'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${toneIcon[n.tone]}`}>
              <Icon name={n.icon} size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[13px] font-semibold ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>{n.title}</span>
                {!n.read && <span className="w-2 h-2 rounded-full bg-gold shrink-0 animate-gold-pulse" />}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">{n.sub}</div>
              <div className="text-[10px] text-muted-foreground/60 mt-0.5">{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
