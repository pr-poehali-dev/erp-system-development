import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import Icon from '@/components/ui/icon';

interface SearchEntry {
  label: string;
  sub: string;
  icon: string;
  path: string;
  group: string;
}

const ENTRIES: SearchEntry[] = [
  { label: 'Главная', sub: 'Персональная сводка', icon: 'LayoutDashboard', path: '/dashboard', group: 'Разделы' },
  { label: 'Все клиенты', sub: 'Реестр клиентов', icon: 'Users', path: '/clients', group: 'Клиенты' },
  { label: 'Создать клиента', sub: 'Новая карточка клиента', icon: 'UserPlus', path: '/clients?new=1', group: 'Клиенты' },
  { label: 'Заявки', sub: 'Воронка продаж CRM', icon: 'ClipboardList', path: '/crm', group: 'Продажи' },
  { label: 'Замеры', sub: 'Первичные замеры объектов', icon: 'Ruler', path: '/measurements', group: 'Продажи' },
  { label: 'Коммерческие предложения', sub: 'КП по клиентам', icon: 'FileText', path: '/proposals', group: 'Продажи' },
  { label: 'Маркетинг', sub: 'Источники лидов и бюджеты', icon: 'Megaphone', path: '/marketing', group: 'Продажи' },
  { label: 'Заказы', sub: 'Производственные заказы', icon: 'ClipboardList', path: '/orders', group: 'Производство' },
  { label: 'Заказы в работе', sub: 'Цеха и прогресс изготовления', icon: 'Factory', path: '/production', group: 'Производство' },
  { label: 'Контрольные замеры', sub: 'Замеры перед монтажом', icon: 'ClipboardCheck', path: '/control-measurements', group: 'Производство' },
  { label: 'Монтаж', sub: 'Монтажные бригады и графики', icon: 'Wrench', path: '/installation', group: 'Производство' },
  { label: 'Материалы', sub: 'Остатки склада', icon: 'Package', path: '/warehouse', group: 'Склад' },
  { label: 'Спецификации', sub: 'Технические задания', icon: 'Cog', path: '/technology', group: 'Склад' },
  { label: 'Поставщики и поставки', sub: 'Заявки на закупку', icon: 'PackageSearch', path: '/supply', group: 'Склад' },
  { label: 'Доставка', sub: 'Логистика и отгрузки', icon: 'Truck', path: '/logistics', group: 'Логистика' },
  { label: 'Сотрудники', sub: 'Реестр персонала', icon: 'UserCog', path: '/staff', group: 'Компания' },
  { label: 'Планер', sub: 'Задачи и календарь', icon: 'CalendarCheck', path: '/planner', group: 'Планер' },
  { label: 'Аналитика и отчёты', sub: 'Сводная аналитика', icon: 'BarChart3', path: '/reports', group: 'Отчёты' },
  { label: 'Финансы и себестоимость', sub: 'Доход, расход, маржа', icon: 'CircleDollarSign', path: '/finance', group: 'Отчёты' },
  { label: 'Настройки', sub: 'Компания, безопасность, роли', icon: 'Settings', path: '/settings', group: 'Система' },
];

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

const GlobalSearch = ({ open, onClose }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const groups = Array.from(new Set(ENTRIES.map((e) => e.group)));

  return (
    <CommandDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <CommandInput placeholder="Искать разделы, клиентов, заказы…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-6">
            <Icon name="SearchX" size={22} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Ничего не найдено</span>
          </div>
        </CommandEmpty>
        {groups.map((group, gi) => (
          <div key={group}>
            {gi > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {ENTRIES.filter((e) => e.group === group).map((entry) => (
                <CommandItem
                  key={entry.label + entry.path}
                  value={`${entry.label} ${entry.sub} ${entry.group}`}
                  onSelect={() => go(entry.path)}
                  className="gap-3 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <Icon name={entry.icon} size={14} className="text-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-foreground truncate">{entry.label}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{entry.sub}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
