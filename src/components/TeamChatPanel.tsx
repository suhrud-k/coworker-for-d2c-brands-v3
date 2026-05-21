import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { matchV3Question, parseMention } from '../utils/matchV3Question';
import { getCannedById, getChipsForPage } from '../data/cannedResponses';
import { getAgent, CFO_AGENT_ID } from '../data/agentsMockData';
import { HOME_KRISHAN_BRIEF } from '../data/homeMockData';
import type { AgentId, ChatPage } from '../v3Types';

type Message = { role: 'user' | 'assistant'; content: string; agentId?: AgentId };

type TeamChatPanelProps = {
  page: ChatPage;
  scopedAgent?: AgentId;
  embedded?: boolean;
  fillHeight?: boolean;
  title?: string;
  embeddedTitle?: string;
  initialBrief?: string;
  onClose?: () => void;
};

/** Renders a chat line; supports **bold** markers for section headings */
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

const AgentAvatar = ({ id, size = 'sm' }: { id: AgentId; size?: 'sm' | 'md' }) => {
  const a = getAgent(id);
  const dim = size === 'md' ? 'w-8 h-8 text-[13px]' : 'w-7 h-7 text-[12px]';
  return (
    <div className={cn(dim, a.avatarBg, 'rounded-full flex items-center justify-center text-white font-semibold shrink-0')}>
      {a.name[0]}
    </div>
  );
};

export function TeamChatPanel({
  page,
  scopedAgent,
  embedded,
  fillHeight,
  title,
  embeddedTitle,
  initialBrief,
  onClose,
}: TeamChatPanelProps) {
  const defaultAgent = scopedAgent ?? CFO_AGENT_ID;
  const openingBrief =
    initialBrief ?? (page === 'home' ? HOME_KRISHAN_BRIEF : 'Cash position ₹1.42 cr. Runway 11.2 weeks. 3 items need your call today.');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      agentId: defaultAgent,
      content: openingBrief,
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mention = scopedAgent ?? parseMention(input).agent;
  const chips = getChipsForPage(page, mention ?? (page === 'home' ? CFO_AGENT_ID : undefined));

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
      const { id, mention: m } = matchV3Question(userMsg);
      const canned = id ? getCannedById(id) : null;
      const agentId = m ?? scopedAgent ?? canned?.agentId ?? defaultAgent;
      const body = canned
        ? `${canned.headline}\n\n${canned.body}`
        : "I don't have a canned answer for that yet — I'll log it and Krishan will follow up in the next brief.";
      setMessages(prev => [...prev, { role: 'assistant', content: body, agentId }]);
      setThinking(false);
    }, 700);
  };

  const inner = (
    <div className={cn('flex flex-col', fillHeight ? 'h-full min-h-[480px]' : embedded ? 'h-[420px]' : 'h-full')}>
      {embedded && embeddedTitle && (
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-[16px] font-semibold text-gray-900">{embeddedTitle}</h2>
        </div>
      )}
      {!embedded && onClose && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <span className="text-[14px] font-semibold text-gray-900">
            {title ?? `Ask ${getAgent(defaultAgent).name}`}
          </span>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '')}>
            {msg.role === 'assistant' && msg.agentId && <AgentAvatar id={msg.agentId} />}
            <div
              className={cn(
                'max-w-[90%] rounded-xl px-4 py-3 text-[14px] leading-relaxed',
                msg.role === 'assistant' && page === 'home' && 'max-w-[95%]',
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-[4px]'
                  : 'bg-white border border-gray-200 text-gray-700 rounded-bl-[4px]'
              )}
            >
              {msg.role === 'assistant' && msg.agentId && (
                <div className="text-[12px] font-semibold text-primary mb-1">
                  {getAgent(msg.agentId).name} ({getAgent(msg.agentId).role})
                </div>
              )}
              {msg.content.split('\n').map((line, j) => renderMessageLine(line, j))}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
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
    </div>
  );

  if (embedded) {
    return (
      <div className={cn('card p-0 overflow-hidden flex flex-col', fillHeight && 'h-full')}>{inner}</div>
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
