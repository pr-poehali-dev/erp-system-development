import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutocompleteOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface InlineAutocompleteProps {
  label?: string;
  icon?: string;
  placeholder?: string;
  className?: string;
  value: string;
  options: AutocompleteOption[];
  onSave: (value: string) => Promise<void>;
  allowCustom?: boolean;
}

const StatusIcon = ({ status }: { status: SaveStatus }) => {
  if (status === 'saving') return <Icon name="Loader2" size={13} className="text-gold animate-spin shrink-0" />;
  if (status === 'saved') return <Icon name="Check" size={13} className="text-status-ok shrink-0" />;
  if (status === 'error') return <Icon name="AlertCircle" size={13} className="text-status-crit shrink-0" />;
  return null;
};

const InlineAutocomplete = ({ label, icon, placeholder, className, value, options, onSave, allowCustom }: InlineAutocompleteProps) => {
  const selectedOption = options.find((o) => o.value === value);
  const [query, setQuery] = useState(selectedOption?.label || value || '');
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const savedValueRef = useRef(value);

  useEffect(() => {
    const opt = options.find((o) => o.value === value);
    setQuery(opt?.label || value || '');
    savedValueRef.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

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

  const handlePick = (opt: AutocompleteOption) => {
    setQuery(opt.label);
    setOpen(false);
    doSave(opt.value);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (allowCustom && query.trim() && !options.find((o) => o.label === query)) {
        doSave(query.trim());
      } else if (!query.trim()) {
        doSave('');
      }
    }, 150);
  };

  return (
    <div className={className} ref={containerRef}>
      {label && <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">{label}</label>}
      <div className="relative">
        <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
          {icon && <Icon name={icon} size={15} className="text-gold shrink-0" />}
          <input
            value={query}
            placeholder={placeholder}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onBlur={handleBlur}
            className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0"
          />
          <StatusIcon status={status} />
          <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-muted-foreground shrink-0" />
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1.5 rounded-xl bg-popover border border-border shadow-lg max-h-56 overflow-y-auto scrollbar-thin">
            {filtered.map((o) => (
              <button
                type="button"
                key={o.value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(o)}
                className="w-full flex flex-col items-start px-3.5 py-2.5 text-left hover:bg-secondary transition-colors border-b border-border/50 last:border-b-0"
              >
                <span className="text-[13px] text-foreground">{o.label}</span>
                {o.sublabel && <span className="text-[11px] text-muted-foreground">{o.sublabel}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineAutocomplete;
