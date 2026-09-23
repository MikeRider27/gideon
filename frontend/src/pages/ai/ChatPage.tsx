import { FormEvent, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ChatMessage, ChatSession } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

export function ChatPage() {
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: sessions } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async () => (await api.get<ChatSession[]>('/ai/chat/sessions')).data,
  });

  const { data: session } = useQuery({
    queryKey: ['chat-session', sessionId],
    queryFn: async () => (await api.get(`/ai/chat/sessions/${sessionId}`)).data,
    enabled: !!sessionId,
  });

  const messages: ChatMessage[] = session?.messages ?? [];

  const sendMutation = useMutation({
    mutationFn: (content: string) => api.post('/ai/chat/messages', { sessionId, content }),
    onSuccess: ({ data }) => {
      setSessionId(data.sessionId);
      queryClient.invalidateQueries({ queryKey: ['chat-session', data.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      setDraft('');
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMutation.mutate(draft);
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4">
      <aside className="w-56 shrink-0 space-y-2">
        <Button variant="secondary" className="w-full" onClick={() => setSessionId(undefined)}>
          + Nueva conversacion
        </Button>
        <div className="space-y-1">
          {sessions?.map((s) => (
            <button
              key={s.id}
              onClick={() => setSessionId(s.id)}
              className={`block w-full truncate rounded-md px-2 py-1.5 text-left text-xs ${
                s.id === sessionId
                  ? 'bg-series-1/15 text-series-1'
                  : 'text-ink-secondary dark:text-ink-secondary-dark hover:bg-plane dark:hover:bg-plane-dark'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <Card className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="text-sm text-ink-muted">
                Pregunta sobre ventas, inventario, clientes o facturas. Ej: "¿que productos tienen stock bajo?"
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-series-1 text-white'
                      : 'bg-plane dark:bg-plane-dark text-ink-primary dark:text-ink-primary-dark'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sendMutation.isPending && <p className="text-xs text-ink-muted">El asistente esta escribiendo...</p>}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-grid dark:border-grid-dark p-3">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe tu pregunta..."
              disabled={sendMutation.isPending}
            />
            <Button type="submit" disabled={sendMutation.isPending}>
              Enviar
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
