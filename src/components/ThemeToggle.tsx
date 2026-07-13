import Icon from '@/components/ui/icon';
import { useTheme } from '@/hooks/useTheme';

export const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-xl glass-card flex items-center justify-center hover:border-gold/30 transition-all group"
      aria-label="Переключить тему"
      title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
    >
      <Icon
        name={theme === 'dark' ? 'Moon' : 'Sun'}
        size={16}
        className="group-hover:text-gold transition-colors"
      />
    </button>
  );
};

export const ThemeToggleSwitch = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { value: 'dark' as const, label: 'Тёмная', icon: 'Moon', desc: 'Комфортно для глаз в тёмное время' },
        { value: 'light' as const, label: 'Светлая', icon: 'Sun', desc: 'Классический светлый интерфейс' },
      ].map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all ${
            theme === opt.value
              ? 'border-gold bg-gold/8'
              : 'border-border bg-secondary hover:border-gold/30'
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${theme === opt.value ? 'bg-gold/15 text-gold' : 'bg-muted text-muted-foreground'}`}>
            <Icon name={opt.icon} size={22} />
          </div>
          <div className="text-center">
            <div className={`text-[13px] font-semibold ${theme === opt.value ? 'text-gold' : 'text-foreground'}`}>{opt.label}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{opt.desc}</div>
          </div>
          {theme === opt.value && (
            <div className="flex items-center gap-1 text-[11px] text-gold font-medium">
              <Icon name="Check" size={12} /> Активна
            </div>
          )}
        </button>
      ))}
    </div>
  );
};
