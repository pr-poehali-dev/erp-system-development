import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface BaseProps {
  label?: string;
  icon?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onSave: (value: string) => Promise<void>;
}

interface TextFieldProps extends BaseProps {
  type?: 'text' | 'email' | 'tel' | 'date' | 'time' | 'number';
  value: string;
}

interface TextAreaFieldProps extends BaseProps {
  type: 'textarea';
  value: string;
  rows?: number;
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends BaseProps {
  type: 'select';
  value: string;
  options: SelectOption[];
}

type InlineEditFieldProps = TextFieldProps | TextAreaFieldProps | SelectFieldProps;

const DEBOUNCE_MS = 900;

const StatusIcon = ({ status }: { status: SaveStatus }) => {
  if (status === 'saving') return <Icon name="Loader2" size={13} className="text-gold animate-spin shrink-0" />;
  if (status === 'saved') return <Icon name="Check" size={13} className="text-status-ok shrink-0" />;
  if (status === 'error') return <Icon name="AlertCircle" size={13} className="text-status-crit shrink-0" />;
  return null;
};

const InlineEditField = (props: InlineEditFieldProps) => {
  const { label, icon, disabled, placeholder, className, onSave, value } = props;
  const [localValue, setLocalValue] = useState(value);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedValueRef = useRef(value);

  useEffect(() => {
    setLocalValue(value);
    savedValueRef.current = value;
  }, [value]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const doSave = useCallback(async (v: string) => {
    if (v === savedValueRef.current) return;
    setStatus('saving');
    try {
      await onSave(v);
      savedValueRef.current = v;
      setStatus('saved');
      setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 1800);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus((s) => (s === 'error' ? 'idle' : s)), 2500);
    }
  }, [onSave]);

  const scheduleSave = useCallback((v: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSave(v), DEBOUNCE_MS);
  }, [doSave]);

  const handleChange = (v: string) => {
    setLocalValue(v);
    scheduleSave(v);
  };

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    doSave(localValue);
  };

  if (props.type === 'select') {
    return (
      <div className={className}>
        {label && <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">{label}</label>}
        <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
          {icon && <Icon name={icon} size={15} className="text-gold shrink-0" />}
          <select
            value={localValue}
            disabled={disabled}
            onChange={(e) => { handleChange(e.target.value); doSave(e.target.value); }}
            className="bg-transparent text-sm outline-none flex-1 text-foreground min-w-0 disabled:opacity-50"
          >
            {props.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <StatusIcon status={status} />
        </div>
      </div>
    );
  }

  if (props.type === 'textarea') {
    return (
      <div className={className}>
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] text-muted-foreground block font-medium">{label}</label>
            <StatusIcon status={status} />
          </div>
        )}
        <textarea
          value={localValue}
          disabled={disabled}
          placeholder={placeholder}
          rows={props.rows || 3}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border focus:border-gold/50 transition-colors text-sm outline-none text-foreground placeholder:text-muted-foreground/50 resize-none disabled:opacity-50"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {label && <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">{label}</label>}
      <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
        {icon && <Icon name={icon} size={15} className="text-gold shrink-0" />}
        <input
          type={props.type || 'text'}
          value={localValue}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0 disabled:opacity-50"
        />
        <StatusIcon status={status} />
      </div>
    </div>
  );
};

export default InlineEditField;
export type { SelectOption };