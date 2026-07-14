import Modal from '@/components/Modal';
import type { Stage } from '@/components/crm/DealsKanbanBoard';

interface EmployeeOpt { id: number; firstName: string; lastName: string; roleSlug?: string; roleName: string; }

interface DealsFilterModalProps {
  open: boolean;
  onClose: () => void;
  employees: EmployeeOpt[];
  stages: Stage[];
  onApply: () => void;
}

const DealsFilterModal = ({ open, onClose, employees, stages, onApply }: DealsFilterModalProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Фильтры сделок"
      icon="SlidersHorizontal"
      size="sm"
      footer={
        <div className="flex gap-3">
          <button onClick={onApply} className="flex-1 py-3 rounded-xl gold-gradient text-background font-semibold text-sm">Применить</button>
          <button onClick={onClose} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">Сбросить</button>
        </div>
      }
    >
      <div className="space-y-4 pb-2">
        <div>
          <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Менеджер</label>
          <div className="flex flex-wrap gap-2">
            {['Все', ...employees.map((e) => `${e.firstName} ${e.lastName[0]}.`)].map((opt, i) => (
              <button key={opt} className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${i === 0 ? 'gold-gradient text-background font-semibold' : 'bg-secondary border border-border text-muted-foreground hover:border-gold/30 hover:text-foreground'}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Этап воронки</label>
          <div className="flex flex-wrap gap-2">
            {['Все', ...stages.map((s) => s.name)].map((opt, i) => (
              <button key={opt} className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${i === 0 ? 'gold-gradient text-background font-semibold' : 'bg-secondary border border-border text-muted-foreground hover:border-gold/30 hover:text-foreground'}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DealsFilterModal;
