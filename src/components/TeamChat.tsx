import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/icon';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

interface ChatChannel {
  id: number;
  name: string | null;
  channelType: 'group' | 'direct';
  icon?: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageAt?: string;
  memberCount: number;
}

interface ChatMessage {
  id: number;
  channelId: number;
  employeeId: number;
  employeeName: string;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  createdAt: string;
}

interface EmployeeOpt {
  id: number;
  first_name: string;
  last_name: string;
}

const totalUnread = (channels: ChatChannel[]) => channels.reduce((acc, c) => acc + c.unreadCount, 0);

const fmtTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const fmtFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};

const initialsOf = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();

interface TeamChatProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const TeamChat = ({ open, onOpen, onClose }: TeamChatProps) => {
  const { employee } = useAuth();
  const { error: toastError } = useToast();
  const [collapsed, setCollapsed] = useState(true);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [employees, setEmployees] = useState<EmployeeOpt[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadChannels = useCallback(async () => {
    try {
      const data = await api<{ channels: ChatChannel[] }>('crm', { params: { resource: 'chat', action: 'channels' } });
      setChannels(data.channels);
      if (!activeChannelId && data.channels.length > 0) setActiveChannelId(data.channels[0].id);
    } catch {
      // silent background poll
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMessages = useCallback(async (channelId: number) => {
    setMessagesLoading(true);
    try {
      const data = await api<{ messages: ChatMessage[] }>('crm', { params: { resource: 'chat', channelId: String(channelId) } });
      setMessages(data.messages);
    } catch (e) {
      toastError('Не удалось загрузить сообщения', e instanceof ApiError ? e.message : undefined);
    } finally {
      setMessagesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    loadChannels();
    pollRef.current = setInterval(loadChannels, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [open, loadChannels]);

  useEffect(() => {
    if (open && activeChannelId) loadMessages(activeChannelId);
  }, [open, activeChannelId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (showNewChannel && employees.length === 0) {
      api<{ employees: EmployeeOpt[] }>('crm', { params: { resource: 'chat', action: 'employees-for-chat' } })
        .then((data) => setEmployees(data.employees))
        .catch(() => {});
    }
  }, [showNewChannel, employees.length]);

  const handleToggleOpen = () => {
    if (open) {
      setCollapsed((c) => !c);
    } else {
      onOpen();
      setCollapsed(false);
    }
  };

  const handleSend = async () => {
    if (!activeChannelId || !text.trim()) return;
    setSending(true);
    try {
      const data = await api<{ message: ChatMessage }>('crm', {
        method: 'POST',
        params: { resource: 'chat', action: 'send' },
        body: { channelId: activeChannelId, text: text.trim() },
      });
      setMessages((prev) => [...prev, data.message]);
      setText('');
      loadChannels();
    } catch (e) {
      toastError('Не удалось отправить сообщение', e instanceof ApiError ? e.message : undefined);
    } finally {
      setSending(false);
    }
  };

  const handleFilePick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChannelId) return;
    if (file.size > 8 * 1024 * 1024) {
      toastError('Файл слишком большой', 'Максимум 8 МБ');
      return;
    }
    setSending(true);
    try {
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const data = await api<{ message: ChatMessage }>('crm', {
        method: 'POST',
        params: { resource: 'chat', action: 'send' },
        body: { channelId: activeChannelId, fileData, fileName: file.name, fileType: file.type },
      });
      setMessages((prev) => [...prev, data.message]);
      loadChannels();
    } catch (err) {
      toastError('Не удалось отправить файл', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      toastError('Укажите название группы');
      return;
    }
    try {
      const data = await api<{ channelId: number }>('crm', {
        method: 'POST',
        params: { resource: 'chat', action: 'create-channel' },
        body: { name: newChannelName.trim(), channelType: 'group', memberIds: selectedMembers, icon: 'Users' },
      });
      setShowNewChannel(false);
      setNewChannelName('');
      setSelectedMembers([]);
      await loadChannels();
      setActiveChannelId(data.channelId);
    } catch (e) {
      toastError('Не удалось создать группу', e instanceof ApiError ? e.message : undefined);
    }
  };

  const unread = totalUnread(channels);
  const activeChannel = channels.find((c) => c.id === activeChannelId);

  // Свёрнутая "таблетка" — закреплена в углу, поверх всего
  if (!open || collapsed) {
    return createPortal(
      <button
        onClick={handleToggleOpen}
        className="fixed bottom-6 right-6 z-[80] flex items-center gap-2.5 pl-3.5 pr-4 py-3 rounded-2xl glass-modal border-gold-gradient shadow-2xl shadow-black/40 hover:scale-105 transition-transform"
      >
        <div className="relative w-8 h-8 rounded-xl gold-gradient flex items-center justify-center shrink-0">
          <Icon name="MessageCircle" size={16} className="text-[hsl(222,30%,8%)]" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-status-crit text-white text-[9px] font-bold flex items-center justify-center border-2 border-background">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
        <span className="text-[12px] font-semibold text-foreground hidden sm:inline">Чат компании</span>
      </button>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[80] w-[380px] max-w-[calc(100vw-2rem)] animate-fade-in">
      <div className="glass-modal rounded-2xl overflow-hidden flex flex-col shadow-2xl shadow-black/50" style={{ height: 'min(560px, 75vh)' }}>
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-xl gold-gradient flex items-center justify-center shrink-0">
            <Icon name="MessageCircle" size={16} className="text-[hsl(222,30%,8%)]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-foreground truncate">Чат компании</div>
            {activeChannel && <div className="text-[11px] text-muted-foreground truncate">{activeChannel.name || 'Личные сообщения'} · {activeChannel.memberCount} участ.</div>}
          </div>
          <button onClick={() => setShowNewChannel(true)} title="Новая группа" className="w-7 h-7 rounded-lg bg-secondary hover:bg-muted flex items-center justify-center shrink-0">
            <Icon name="Plus" size={14} className="text-muted-foreground" />
          </button>
          <button onClick={() => setCollapsed(true)} title="Свернуть" className="w-7 h-7 rounded-lg bg-secondary hover:bg-muted flex items-center justify-center shrink-0">
            <Icon name="Minus" size={14} className="text-muted-foreground" />
          </button>
          <button onClick={onClose} title="Закрыть" className="w-7 h-7 rounded-lg bg-secondary hover:bg-muted flex items-center justify-center shrink-0">
            <Icon name="X" size={14} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Channels list */}
          <div className="w-[110px] shrink-0 border-r border-border overflow-y-auto scrollbar-thin py-2">
            {channels.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveChannelId(c.id)}
                className={`w-full flex flex-col items-center gap-1 py-2.5 px-1 transition-colors relative ${activeChannelId === c.id ? 'bg-gold/10' : 'hover:bg-secondary/60'}`}
              >
                <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold ${activeChannelId === c.id ? 'gold-gradient text-[hsl(222,30%,8%)]' : 'bg-secondary text-muted-foreground'}`}>
                  {c.name ? initialsOf(c.name) : <Icon name="User" size={13} />}
                  {c.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-status-crit text-white text-[8px] font-bold flex items-center justify-center border border-background">
                      {c.unreadCount > 9 ? '9+' : c.unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground text-center leading-tight truncate w-full px-0.5">{c.name || 'Личка'}</span>
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8"><Icon name="Loader2" size={20} className="text-gold animate-spin" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-[12px] text-muted-foreground">Сообщений пока нет</div>
              ) : (
                messages.map((m) => {
                  const isMine = m.employeeId === employee?.id;
                  return (
                    <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      {!isMine && <span className="text-[10px] text-gold/80 mb-0.5 px-1">{m.employeeName}</span>}
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${isMine ? 'gold-gradient text-[hsl(222,30%,8%)]' : 'bg-secondary text-foreground'}`}>
                        {m.text && <div className="text-[13px] leading-snug whitespace-pre-wrap break-words">{m.text}</div>}
                        {m.fileUrl && (
                          <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 mt-1 px-2 py-1.5 rounded-lg ${isMine ? 'bg-black/10' : 'bg-background/60'}`}>
                            <Icon name="Paperclip" size={13} className="shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[11px] font-medium truncate">{m.fileName}</div>
                              <div className="text-[10px] opacity-70">{fmtFileSize(m.fileSize)}</div>
                            </div>
                          </a>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-0.5 px-1">{fmtTime(m.createdAt)}</span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-2.5 border-t border-border shrink-0">
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                <button onClick={handleFilePick} disabled={sending || !activeChannelId} className="w-8 h-8 rounded-xl bg-secondary hover:bg-muted flex items-center justify-center shrink-0 disabled:opacity-40">
                  <Icon name="Paperclip" size={14} className="text-muted-foreground" />
                </button>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Сообщение..."
                  disabled={!activeChannelId}
                  className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-[12px] outline-none focus:border-gold/50 transition-colors text-foreground placeholder:text-muted-foreground/50 min-w-0 disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !text.trim() || !activeChannelId}
                  className="w-8 h-8 rounded-xl gold-gradient btn-gold flex items-center justify-center shrink-0 disabled:opacity-40"
                >
                  {sending ? <Icon name="Loader2" size={14} className="text-[hsl(222,30%,8%)] animate-spin" /> : <Icon name="Send" size={14} className="text-[hsl(222,30%,8%)]" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New channel mini-modal */}
      {showNewChannel && (
        <div className="absolute inset-0 rounded-2xl glass-modal flex flex-col p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-foreground">Новая группа</span>
            <button onClick={() => setShowNewChannel(false)} className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center">
              <Icon name="X" size={12} className="text-muted-foreground" />
            </button>
          </div>
          <input
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="Название группы"
            className="px-3 py-2.5 rounded-xl bg-secondary border border-border text-[13px] outline-none focus:border-gold/50 transition-colors text-foreground placeholder:text-muted-foreground/50 mb-3"
          />
          <div className="text-[11px] text-muted-foreground mb-2">Участники</div>
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1 mb-3">
            {employees.map((e) => {
              const checked = selectedMembers.includes(e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => setSelectedMembers((prev) => checked ? prev.filter((id) => id !== e.id) : [...prev, e.id])}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors ${checked ? 'bg-gold/10' : 'hover:bg-secondary'}`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${checked ? 'bg-status-ok border-status-ok' : 'border-border'}`}>
                    {checked && <Icon name="Check" size={10} className="text-white" />}
                  </div>
                  <span className="text-[12px] text-foreground truncate">{e.first_name} {e.last_name}</span>
                </button>
              );
            })}
          </div>
          <button onClick={handleCreateChannel} className="w-full py-2.5 rounded-xl gold-gradient btn-gold text-[hsl(222,30%,8%)] font-semibold text-[13px]">
            Создать группу
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
};

export default TeamChat;
