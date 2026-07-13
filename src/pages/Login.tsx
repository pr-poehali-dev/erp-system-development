import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginValue.trim() || !password) {
      setError('Введите логин и пароль');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(loginValue.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось выполнить вход. Проверьте соединение.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[420px] h-[420px] rounded-full bg-gold/[0.06] blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[420px] h-[420px] rounded-full bg-[hsl(210,70%,45%)]/[0.06] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px] animate-fade-in opacity-0">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-gold/20 mb-4">
            <Icon name="Box" size={30} className="text-[hsl(222,30%,8%)]" />
          </div>
          <h1 className="font-display font-black text-2xl text-foreground text-center">Territory ERP</h1>
          <p className="text-[13px] text-muted-foreground text-center mt-1">Система управления мебельным производством</p>
        </div>

        {/* Login card */}
        <form
          onSubmit={handleSubmit}
          className="glass-modal rounded-2xl p-6 sm:p-8"
        >
          <h2 className="font-display font-bold text-lg text-foreground mb-1">Вход в систему</h2>
          <p className="text-[13px] text-muted-foreground mb-6">Введите логин и пароль вашей учётной записи</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-status-crit/10 border border-status-crit/25 flex items-start gap-2.5">
              <Icon name="AlertCircle" size={16} className="text-status-crit shrink-0 mt-0.5" />
              <span className="text-[13px] text-status-crit leading-snug">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[12px] text-muted-foreground mb-1.5 block font-medium">Логин или email</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="User" size={16} className="text-gold shrink-0" />
                <input
                  autoFocus
                  value={loginValue}
                  onChange={(e) => setLoginValue(e.target.value)}
                  placeholder="admin"
                  className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] text-muted-foreground mb-1.5 block font-medium">Пароль</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="Lock" size={16} className="text-gold shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={16} />
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 rounded-xl gold-gradient btn-gold text-[hsl(222,30%,8%)] font-display font-bold text-sm shadow-lg shadow-gold/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Icon name="Loader2" size={18} className="animate-spin" />
                Входим...
              </>
            ) : (
              <>
                Войти в систему
                <Icon name="ArrowRight" size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[12px] text-muted-foreground mt-6">
          Доступ предоставляется администратором системы
        </p>
      </div>
    </div>
  );
};

export default Login;