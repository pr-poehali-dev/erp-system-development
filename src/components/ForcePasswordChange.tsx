import { useState, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/lib/api';

const ForcePasswordChange = () => {
  const { changePassword, employee } = useAuth();
  const { success } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await changePassword(password);
      success('Пароль изменён', 'Теперь используйте новый пароль для входа');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сменить пароль');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay animate-overlay-in">
      <div className="relative w-full max-w-md glass-modal rounded-2xl p-6 sm:p-8 animate-modal-in">
        <div className="absolute top-0 left-0 right-0 h-px gold-gradient opacity-60" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gold/12 border border-gold/25 flex items-center justify-center mb-4">
            <Icon name="KeyRound" size={26} className="text-gold" />
          </div>
          <h2 className="font-display font-bold text-lg text-foreground">Смена пароля</h2>
          <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
            Здравствуйте, {employee?.firstName}! При первом входе необходимо установить новый пароль для вашей учётной записи.
          </p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-status-crit/10 border border-status-crit/25 flex items-start gap-2.5">
            <Icon name="AlertCircle" size={16} className="text-status-crit shrink-0 mt-0.5" />
            <span className="text-[13px] text-status-crit leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[12px] text-muted-foreground mb-1.5 block font-medium">Новый пароль</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="Lock" size={16} className="text-gold shrink-0" />
              <input
                autoFocus
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div>
            <label className="text-[12px] text-muted-foreground mb-1.5 block font-medium">Повторите пароль</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="Lock" size={16} className="text-gold shrink-0" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Повторите новый пароль"
                className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-xl gold-gradient btn-gold text-[hsl(222,30%,8%)] font-display font-bold text-sm shadow-lg shadow-gold/20 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Icon name="Loader2" size={18} className="animate-spin" />
                Сохраняем...
              </>
            ) : (
              <>
                Установить пароль
                <Icon name="Check" size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default ForcePasswordChange;