import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { matchV3Question, parseMention } from '../utils/matchV3Question';
import { getChipsForPage } from '../data/cannedResponses';
import { getAgent, CFO_AGENT_ID } from '../data/agentsMockData';
import { INLINE_ACTIONS } from '../data/inlineActionsMockData';
import { ChatArtifact } from './ChatArtifact';
import { HOME_KRISHAN_OPENING, WHATSAPP_KRISHAN } from '../data/homeMockData';
import type { AgentId, ChatPage, OfficeDeepLink, V3CannedResponse } from '../v3Types';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  agentId?: AgentId;
  ts?: string;
  response?: V3CannedResponse;
};

type TeamChatPanelProps = {
  page: ChatPage;
  scopedAgent?: AgentId;
  embedded?: boolean;
  fillHeight?: boolean;
  title?: string;
  onClose?: () => void;
  onDeepLink?: (link: OfficeDeepLink) => void;
};

function renderMessageLine(line: string, lineIndex: number) {
  if (line.trim() === '') {
    return <div key={lineIndex} className="h-2" aria-hidden />;
  }
  const isHeadingOnly = /^\*\*[^*]+\*\*$/.test(line.trim());
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <p
      key={lineIndex}
      className={cn(
        lineIndex > 0 && !isHeadingOnly ? 'mt-1' : '',
        isHeadingOnly ? 'mt-3 font-semibold text-gray-900' : ''
      )}
    >
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <span key={i} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

const AgentAvatar = ({ id, size = 'sm' }: { id: AgentId; size?: 'sm' | 'md' | 'lg' }) => {
  const a = getAgent(id);
  const dim =
    size === 'lg' ? 'w-8 h-8 text-[13px]' : size === 'md' ? 'w-8 h-8 text-[13px]' : 'w-7 h-7 text-[12px]';
  return (
    <div
      className={cn(
        dim,
        a.avatarBg,
        'rounded-full flex items-center justify-center text-white font-semibold shrink-0'
      )}
    >
      {a.name[0]}
    </div>
  );
};

function WhatsAppChip() {
  return (
    <a
      href={WHATSAPP_KRISHAN.href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 px-4 h-11 bg-green-50 border-t border-green-200 hover:bg-green-100 transition-colors shrink-0"
    >
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#25D366" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      <span className="text-[13px] text-gray-800 flex-1">{WHATSAPP_KRISHAN.label}</span>
      <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
    </a>
  );
}

export function TeamChatPanel({
  page,
  scopedAgent,
  embedded,
  fillHeight,
  title,
  onClose,
  onDeepLink,
}: TeamChatPanelProps) {
  const isHome = page === 'home';
  const defaultAgent = scopedAgent ?? CFO_AGENT_ID;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mention = scopedAgent ?? parseMention(input).agent;

  const chips = getChipsForPage(page, mention ?? undefined);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const respond = (text: string) => {
    const userMsg = text.trim();
    if (!userMsg) return;
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      const { text: stripped, agent: mentioned } = parseMention(userMsg);
      const resolvedMention = scopedAgent ?? mentioned;
      const canned = matchV3Question(stripped, resolvedMention);
      // On the main page Krishan represents the whole team — every reply is his.
      const agentId = isHome ? CFO_AGENT_ID : (canned?.agentId ?? resolvedMention ?? defaultAgent);
      if (canned) {
        setMessages(prev => [...prev, { role: 'assistant', content: canned.headline, agentId, response: canned }]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: "I don't have a canned answer for that yet — I'll log it and Krishan will follow up in the next brief.",
            agentId,
          },
        ]);
      }
      setThinking(false);
    }, 700);
  };

  const renderAssistantBubble = (msg: ChatMessage) => {
    const r = msg.response;
    const isJargon = r?.kind === 'jargon';
    return (
      <div className="flex gap-3">
        {msg.agentId && <AgentAvatar id={msg.agentId} size={isHome ? 'lg' : 'sm'} />}
        <div
          className={cn(
            'relative max-w-[95%] rounded-xl px-4 py-3 text-sm leading-relaxed',
            'bg-white border border-gray-200 text-gray-700 rounded-bl-[4px]'
          )}
        >
          {isJargon && (
            <span className="absolute top-2 right-2 bg-purple-50 text-primary text-[11px] font-medium px-2 py-0.5 rounded-full">
              📘 Glossary
            </span>
          )}
          {msg.agentId && (
            <div className={cn('text-xs text-gray-500 mb-1.5', isJargon && 'pr-20')}>
              <span className="font-semibold text-gray-700">{getAgent(msg.agentId).name}</span>
              {msg.ts && <span> · {msg.ts}</span>}
            </div>
          )}

          {r ? (
            <>
              <p className={cn('font-semibold text-gray-900', isJargon && 'pr-20')}>{r.headline}</p>
              {r.body && <p className="mt-1">{r.body}</p>}
              {!isJargon && r.artifact && (
                <div className="mt-3">
                  <ChatArtifact artifact={r.artifact} />
                </div>
              )}
              {r.sources && r.sources.length > 0 && (
                <div className="text-xs text-gray-500 mt-3">Sources: {r.sources.join(', ')}</div>
              )}
              {!isJargon && r.drillLink && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => onDeepLink?.(r.drillLink!.deepLink)}
                    className="text-primary text-[13px] font-medium underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
                  >
                    {r.drillLink.label}
                  </button>
                </div>
              )}
            </>
          ) : (
            msg.content.split('\n').map((line, j) => renderMessageLine(line, j))
          )}
        </div>
      </div>
    );
  };

  const inner = (
    <div className={cn('flex flex-col', fillHeight ? 'h-full min-h-[480px]' : embedded ? 'h-[420px]' : 'h-full')}>
      {isHome && embedded && (
        <div className="px-5 py-4 border-b border-gray-100 shrink-0 flex items-center gap-3">
          <AgentAvatar id="krishan" size="lg" />
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">Chat with Krishan</h2>
            <p className="text-[12px] text-gray-500">Your AI CFO — he speaks for the finance team</p>
          </div>
        </div>
      )}

      {!embedded && onClose && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <span className="text-[14px] font-semibold text-gray-900">
            {title ?? `Ask ${getAgent(defaultAgent).name}`}
          </span>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {isHome && (
          <div className="flex gap-3">
            <AgentAvatar id="krishan" size="lg" />
            <div className="max-w-[95%] rounded-xl px-4 py-3 text-sm leading-relaxed bg-white border border-gray-200 text-gray-700 rounded-bl-[4px]">
              <div className="text-xs text-gray-500 mb-1.5">
                <span className="font-semibold text-gray-700">Krishan</span>
                <span> · 08:00</span>
              </div>
              <p>{HOME_KRISHAN_OPENING}</p>
              <ul className="mt-3 space-y-2">
                {INLINE_ACTIONS.map(action => (
                  <li key={action.id} className="flex gap-2">
                    <span className="text-primary shrink-0">•</span>
                    <span>
                      {action.body}{' '}
                      <button
                        type="button"
                        onClick={() => onDeepLink?.(action.cta.deepLink)}
                        className="text-primary font-medium underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
                      >
                        {action.cta.label}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {messages.map((msg, i) =>
          msg.role === 'user' ? (
            <div key={i} className="flex gap-3 flex-row-reverse">
              <div className="max-w-[85%] rounded-xl px-4 py-3 text-sm bg-primary text-white rounded-br-[4px]">
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={i}>{renderAssistantBubble(msg)}</div>
          )
        )}

        {thinking && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex gap-1">
              {[0, 1, 2].map(d => (
                <motion.div
                  key={d}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: d * 0.2 }}
                  className="w-1.5 h-1.5 bg-primary rounded-full"
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {chips.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2 shrink-0">
          <span className="text-[12px] text-gray-500 w-full mb-0.5">Suggested:</span>
          {chips.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => respond(c)}
              className="text-[12px] px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary font-medium"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-gray-200 flex gap-2 shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && respond(input)}
          placeholder="Type your message… try @priya or @krishan"
          className="flex-1 h-10 px-4 border border-gray-200 rounded-[8px] text-[14px] outline-none focus:border-primary"
        />
        <button type="button" onClick={() => respond(input)} className="btn-primary h-10 w-10 p-0 shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>

      {isHome && embedded && <WhatsAppChip />}
    </div>
  );

  if (embedded) {
    return (
      <div className={cn('card p-0 overflow-hidden flex flex-col', fillHeight && 'h-full')}>
        {inner}
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed right-0 top-14 bottom-0 w-[400px] bg-white border-l border-gray-200 z-[90] shadow-xl flex flex-col"
      >
        {inner}
      </motion.div>
    </AnimatePresence>
  );
}
