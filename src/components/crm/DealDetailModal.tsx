import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import ChecklistWidget from '@/components/ChecklistWidget';
import InlineEditField from '@/components/InlineEditField';
import type { Stage } from '@/components/crm/DealsKanbanBoard';

interface ClientObjectOpt { id: number; objectType?: string; address: string; label?: string; isPrimary?: boolean; }
interface Deal {
  id: number; clientId: number; clientName: string; stageId: number; stageSlug: string; stageName: string;
  objectAddress?: string; clientObjectId?: number | null; sum: number | null; managerId?: number; managerName?: string;
  companyId?: number; source?: string; tag?: string; taskNote?: string; isOverdue?: boolean;
  comment?: string; daysInStage?: number;
}
interface DealDetail extends Deal {
  clientPhone?: string; clientEmail?: string; objectType?: string; clientObjects?: ClientObjectOpt[];
  tasks: { id: number; text: string; done: boolean; tone?: string }[];
  history: { id: number; eventText: string; employeeName?: string; createdAt: string }[];
}
interface EmployeeOpt { id: number; firstName: string; lastName: string; roleSlug?: string; roleName: string; }

interface DealDetailModalProps {
  selectedDealId: number | null;
  detail: DealDetail | null;
  detailLoading: boolean;
  stages: Stage[];
  employees: EmployeeOpt[];
  showChecklist: boolean;
  onClose: () => void;
  onOpenChecklist: () => void;
  onCloseChecklist: () => void;
  onFieldSave: (dealId: number, field: string, value: string) => Promise<void>;
  onMoveStage: (dealId: number, stageId: number) => Promise<void>;
}

const DealDetailModal = ({
  selectedDealId, detail, detailLoading, stages, employees, showChecklist,
  onClose, onOpenChecklist, onCloseChecklist, onFieldSave, onMoveStage,
}: DealDetailModalProps) => {
  return (
    <>
      {/* ── Deal detail modal ── */}
      <Modal
        open={!!selectedDealId}
        onClose={onClose}
        title={detail ? detail.clientName : 'Загрузка...'}
        subtitle={detail?.objectAddress}
        icon="Briefcase"
        size="md"
        badge={detail ? { label: detail.stageName, tone: 'ok' } : undefined}
        headerRight={
          detail && (
            <button
              onClick={onOpenChecklist}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gold/10 border border-gold/25 text-gold text-[11px] font-semibold hover:bg-gold/15 transition-colors"
            >
              <Icon name="ListChecks" size={14} /> Чек-лист
            </button>
          )
        }
      >
        {detailLoading || !detail ? (
          <div className="flex items-center justify-center py-16"><Icon name="Loader2" size={24} className="text-gold animate-spin" /></div>
        ) : (
          <div className="space-y-4 pb-2">
            <div className="space-y-3 text-[13px]">
              <div className="flex gap-3">
                <span className="text-muted-foreground w-20 shrink-0 pt-3">Телефон</span>
                <span className="text-foreground font-medium truncate pt-3">{detail.clientPhone || '—'}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-muted-foreground w-20 shrink-0 pt-3">Email</span>
                <span className="text-foreground font-medium truncate pt-3">{detail.clientEmail || '—'}</span>
              </div>

              {detail.clientObjects && detail.clientObjects.length > 0 ? (
                <InlineEditField
                  label="Объект клиента"
                  icon="Home"
                  type="select"
                  value={detail.clientObjectId ? String(detail.clientObjectId) : ''}
                  options={[
                    { value: '', label: '— не выбран —' },
                    ...detail.clientObjects.map((o) => ({
                      value: String(o.id),
                      label: `${o.address}${o.label ? ` (${o.label})` : ''}${o.isPrimary ? ' · основной' : ''}`,
                    })),
                  ]}
                  onSave={(v) => onFieldSave(detail.id, 'clientObjectId', v)}
                />
              ) : (
                <div className="flex gap-3">
                  <span className="text-muted-foreground w-20 shrink-0 pt-3">Объект</span>
                  <span className="text-foreground font-medium truncate pt-3">{detail.objectType || '—'}</span>
                </div>
              )}

              <InlineEditField
                label="Адрес объекта"
                icon="MapPin"
                type="text"
                value={detail.objectAddress || ''}
                placeholder="Адрес объекта сделки"
                onSave={(v) => onFieldSave(detail.id, 'objectAddress', v)}
              />

              <InlineEditField
                label="Сумма сделки"
                icon="CircleDollarSign"
                type="number"
                value={detail.sum !== null ? String(detail.sum) : ''}
                placeholder="0"
                onSave={(v) => onFieldSave(detail.id, 'sum', v)}
              />

              <InlineEditField
                label="Менеджер"
                icon="UserCircle"
                type="select"
                value={detail.managerId ? String(detail.managerId) : ''}
                options={[
                  { value: '', label: '— не назначен —' },
                  ...employees.map((e) => ({ value: String(e.id), label: `${e.firstName} ${e.lastName}` })),
                ]}
                onSave={(v) => onFieldSave(detail.id, 'managerId', v)}
              />

              <InlineEditField
                label="Источник"
                icon="Share2"
                type="text"
                value={detail.source || ''}
                placeholder="Instagram, ВК..."
                onSave={(v) => onFieldSave(detail.id, 'source', v)}
              />
            </div>

            <InlineEditField
              label="Комментарий"
              icon="MessageSquare"
              type="textarea"
              rows={3}
              value={detail.comment || ''}
              placeholder="Заметки по сделке..."
              onSave={(v) => onFieldSave(detail.id, 'comment', v)}
            />

            {detail.tasks.length > 0 && (
              <div>
                <div className="text-muted-foreground text-[13px] mb-2">Задачи</div>
                <div className="space-y-2">
                  {detail.tasks.map((t) => (
                    <div key={t.id} className={`flex items-center gap-2.5 text-[12px] ${t.done ? 'opacity-50' : ''}`}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${t.done ? 'bg-status-ok border-status-ok' : 'border-border'}`}>
                        {t.done && <Icon name="Check" size={10} className="text-white" />}
                      </div>
                      <span className={t.done ? 'line-through text-muted-foreground' : t.tone === 'warn' ? 'text-status-warn font-medium' : 'text-foreground'}>{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-muted-foreground text-[13px] mb-2">История</div>
              <div className="space-y-2.5 max-h-40 overflow-y-auto scrollbar-thin">
                {detail.history.map((h) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="w-1 rounded-full bg-gold/30 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground">{new Date(h.createdAt).toLocaleString('ru-RU')} {h.employeeName ? `· ${h.employeeName}` : ''}</div>
                      <div className="text-[12px] text-foreground">{h.eventText}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <div className="text-muted-foreground mb-2 text-[13px]">Переместить на этап</div>
              <div className="flex flex-wrap gap-1.5">
                {stages.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => onMoveStage(detail.id, st.id)}
                    disabled={st.id === detail.stageId}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] border transition-all ${st.id === detail.stageId ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30 hover:text-foreground'}`}
                  >
                    {st.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Чек-лист виджет (закрепляемый) ── */}
      {detail && (
        <ChecklistWidget
          open={showChecklist}
          onClose={onCloseChecklist}
          entityType="deal"
          entityId={detail.id}
          title={detail.clientName}
        />
      )}
    </>
  );
};

export default DealDetailModal;