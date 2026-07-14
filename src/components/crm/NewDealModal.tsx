import { FormEvent } from 'react';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';

export interface DealForm {
  firstName: string; lastName: string; phone: string; itemType: string;
  source: string; objectAddress: string; managerId: string; comment: string;
}
interface EmployeeOpt { id: number; firstName: string; lastName: string; roleSlug?: string; roleName: string; }

interface NewDealModalProps {
  open: boolean;
  onClose: () => void;
  form: DealForm;
  onFormChange: (form: DealForm) => void;
  employees: EmployeeOpt[];
  submitting: boolean;
  onSubmit: (e: FormEvent) => void;
}

const NewDealModal = ({ open, onClose, form, onFormChange, employees, submitting, onSubmit }: NewDealModalProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новая сделка"
      subtitle="Добавить лид в воронку продаж"
      icon="UserPlus"
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4 pb-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Фамилия *</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="User" size={15} className="text-gold shrink-0" />
              <input value={form.lastName} onChange={(e) => onFormChange({ ...form, lastName: e.target.value })} placeholder="Иванова" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Имя *</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="User" size={15} className="text-gold shrink-0" />
              <input value={form.firstName} onChange={(e) => onFormChange({ ...form, firstName: e.target.value })} placeholder="Мария" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
            </div>
          </div>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Телефон</label>
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
            <Icon name="Phone" size={15} className="text-gold shrink-0" />
            <input value={form.phone} onChange={(e) => onFormChange({ ...form, phone: e.target.value })} placeholder="+7 (978) 000-00-00" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Тип мебели</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="Sofa" size={15} className="text-gold shrink-0" />
              <input value={form.itemType} onChange={(e) => onFormChange({ ...form, itemType: e.target.value })} placeholder="Кухня, гостиная..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Источник</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="Share2" size={15} className="text-gold shrink-0" />
              <input value={form.source} onChange={(e) => onFormChange({ ...form, source: e.target.value })} placeholder="Instagram, ВК..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
            </div>
          </div>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Объект / Адрес</label>
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
            <Icon name="MapPin" size={15} className="text-gold shrink-0" />
            <input value={form.objectAddress} onChange={(e) => onFormChange({ ...form, objectAddress: e.target.value })} placeholder="Симферополь, ЖК «Парковый», кв. 45" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
          </div>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Менеджер</label>
          <div className="flex gap-2 flex-wrap">
            {employees.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => onFormChange({ ...form, managerId: String(m.id) })}
                className={`px-3 py-1.5 rounded-lg text-[11px] border transition-all ${form.managerId === String(m.id) ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/40 hover:text-gold'}`}
              >
                {m.firstName} {m.lastName[0]}.
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Комментарий</label>
          <textarea value={form.comment} onChange={(e) => onFormChange({ ...form, comment: e.target.value })} placeholder="Что хочет клиент, пожелания по стилю..." rows={3}
            className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border focus:border-gold/50 transition-colors text-sm outline-none text-foreground placeholder:text-muted-foreground/50 resize-none" />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="UserPlus" size={16} />}
            Создать сделку
          </button>
          <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">
            Отмена
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NewDealModal;
