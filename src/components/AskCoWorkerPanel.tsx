import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ArrowUpRight, Database } from 'lucide-react';
import { cn } from '../lib/utils';
import { matchCannedQuestion } from '../utils/matchCannedQuestion';
import {
  RESPONSES,
  CannedResponse,
  CoWorkerTab,
  getResponseById,
} from '../data/askCoWorkerResponses';

type Message = {
  role: 'user' | 'assistant';
  content: string | CannedResponse;
};

type AskCoWorkerPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  currentPage: CoWorkerTab;
};

const ThinkingIndicator = () => (
  <motion.div layout className="flex items-start gap-3 mb-6">
    <motion.div layout className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
      <Sparkles className="w-4 h-4 text-primary" />
    </motion.div>
    <motion.div layout className="bg-white border border-gray-200 rounded-xl rounded-bl-[4px] px-4 py-2.5 shadow-sm flex items-center gap-1.5 min-w-[60px] h-[34px]">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
        className="w-1.5 h-1.5 bg-primary rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
        className="w-1.5 h-1.5 bg-primary rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
        className="w-1.5 h-1.5 bg-primary rounded-full"
      />
    </motion.div>
  </motion.div>
);

const ArtifactTable = ({ artifact }: { artifact: { kind: "table"; columns: string[]; rows: (string | number)[][]; highlightLastRow?: boolean } }) => (
  <div className="w-full border border-gray-100 rounded-[8px] overflow-hidden my-3 shadow-sm">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-100">
          {artifact.columns.map((col, i) => (
            <th key={i} className="px-3 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-tight">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {artifact.rows.map((row, i) => (
          <tr
            key={i}
            className={cn(
              "border-b border-gray-50 last:border-0 transition-colors",
              artifact.highlightLastRow && i === artifact.rows.length - 1 ? "bg-primary text-white" : "hover:bg-gray-50"
            )}
          >
            {row.map((cell, j) => {
              const cellStr = String(cell);
              const isNegative = cellStr.startsWith('-') && !cellStr.startsWith('-₹');
              const isPositiveDelta = cellStr.startsWith('+');
              const isMoneyNegative = cellStr.includes('-₹');

              return (
                <td key={j} className={cn(
                  "px-3 py-2 text-[13px] font-medium transition-colors",
                  artifact.highlightLastRow && i === artifact.rows.length - 1 ? "text-white" :
                  (isNegative || isMoneyNegative) ? "text-error" : isPositiveDelta ? "text-success" : "text-gray-900"
                )}>
                  {cell}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ArtifactBars = ({ artifact }: { artifact: { kind: "bars"; data: { label: string; value: number; color?: string }[]; unit: string } }) => {
  const maxValue = Math.max(...artifact.data.map(d => Math.abs(d.value)));
  return (
    <div className="w-full space-y-3 my-3">
      {artifact.data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-20 text-[13px] text-gray-600 font-medium truncate">{item.label}</div>
          <div className="flex-grow h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(Math.abs(item.value) / maxValue) * 100}%` }}
              className="h-full rounded-full"
              style={{ backgroundColor: item.color || '#7C3AED' }}
            />
          </div>
          <div className="w-12 text-right text-[13px] font-bold text-gray-900">{item.value}%</div>
        </div>
      ))}
      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest text-center mt-2">{artifact.unit}</div>
    </div>
  );
};

const ArtifactCompare = ({ artifact }: { artifact: { kind: "compare"; rows: { label: string; before: string; after: string; delta: string; positive: boolean }[] } }) => (
  <div className="w-full border border-gray-100 rounded-[8px] overflow-hidden my-3 shadow-sm">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-100">
          <th className="px-3 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-tight">Metric</th>
          <th className="px-3 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-tight text-right">Before</th>
          <th className="px-3 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-tight text-right">After</th>
          <th className="px-3 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-tight text-right">Delta</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {artifact.rows.map((row, i) => (
          <tr key={i} className="hover:bg-gray-50 transition-colors">
            <td className="px-3 py-2 text-[13px] font-bold text-gray-900 uppercase tracking-tight">{row.label}</td>
            <td className="px-3 py-2 text-[13px] text-gray-400 text-right tabular-nums font-medium">{row.before}</td>
            <td className="px-3 py-2 text-[13px] text-gray-900 font-bold text-right tabular-nums">{row.after}</td>
            <td className="px-3 py-2 text-right">
              <span className={cn(
                "px-2 py-0.5 rounded-[4px] text-[11px] font-bold tabular-nums",
                row.positive ? "bg-success-50 text-success border border-success-100" : "bg-error-50 text-error border border-error-100"
              )}>
                {row.delta}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Chip = ({ text, onClick }: { text: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-[13px] text-gray-600 whitespace-nowrap hover:bg-purple-50 hover:text-primary hover:border-primary transition-all shadow-sm"
  >
    {text}
  </button>
);

const FALLBACK_MARKER = '__ASK_COWORKER_FALLBACK__';

export const AskCoWorkerPanel = ({ isOpen, onClose, onNavigate, currentPage }: AskCoWorkerPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your AI CoWorker. Ask me anything about your settlements, marketplace P&L, or returns." }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleChips = useMemo(
    () =>
      RESPONSES.filter(
        r => r.pages.includes(currentPage) && r.kind !== 'jargon'
      ).slice(0, 5),
    [currentPage]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSubmit = (text: string) => {
    const trimmedInput = text.trim();
    if (!trimmedInput) return;

    setMessages(prev => [...prev, { role: 'user', content: trimmedInput }]);
    setInput('');
    setIsThinking(true);

    setTimeout(() => {
      const matchId = matchCannedQuestion(trimmedInput);
      const response = matchId ? getResponseById(matchId) : undefined;
      if (response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `${FALLBACK_MARKER}I don't have a ready answer for that yet. Try one of these for this page — or rephrase and I'll try again.`,
        }]);
      }
      setIsThinking(false);
    }, 1200);
  };

  const renderAssistantContent = (content: string | CannedResponse) => {
    if (typeof content === 'string') {
      const isFallback = content.startsWith(FALLBACK_MARKER);
      const text = isFallback ? content.slice(FALLBACK_MARKER.length) : content;
      return (
        <motion.div layout className="space-y-4">
          <p>{text}</p>
          {isFallback && (
            <div className="flex flex-wrap gap-2 pt-2">
              {visibleChips.map(r => (
                <Chip key={r.id} text={r.question} onClick={() => handleSubmit(r.question)} />
              ))}
            </div>
          )}
        </motion.div>
      );
    }

    if (content.kind === 'jargon') {
      return (
        <motion.div layout className="space-y-3 relative">
          <span className="absolute top-0 right-0 bg-purple-50 text-primary text-[11px] font-medium px-2 py-0.5 rounded-full">
            Glossary
          </span>
          <h4 className="text-[14px] font-bold text-primary leading-tight pr-20">{content.headline}</h4>
          <p className="text-[14px] text-gray-700 leading-relaxed">{content.body}</p>
          {content.sources[0] && (
            <p className="text-[12px] text-gray-500">{content.sources[0]}</p>
          )}
          <motion.div className="pt-2 border-t border-gray-100 space-y-2">
            <p className="text-[13px] text-gray-600">
              Want to see how this affects your business? Try asking a data question.
            </p>
            <button
              type="button"
              onClick={() => {
                setMessages(prev => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: `${FALLBACK_MARKER}Here are data questions for this page:`,
                  },
                ]);
              }}
              className="btn-tertiary text-[13px]"
            >
              See examples →
            </button>
          </motion.div>
        </motion.div>
      );
    }

    return (
      <motion.div layout className="space-y-3">
        <h4 className="text-[14px] font-bold text-primary leading-tight">{content.headline}</h4>
        <p className="text-[14px] text-gray-700 leading-relaxed">{content.body}</p>

        {content.artifact?.kind === 'table' && <ArtifactTable artifact={content.artifact} />}
        {content.artifact?.kind === 'bars' && <ArtifactBars artifact={content.artifact} />}
        {content.artifact?.kind === 'compare' && <ArtifactCompare artifact={content.artifact} />}

        <div className="flex flex-wrap gap-1.5 pt-1">
          <div className="flex items-center gap-1 mr-2 opacity-40">
            <Database className="w-3 h-3 text-primary" />
          </div>
          {content.sources.map((s, i) => (
            <span key={i} className="px-2 py-0.5 bg-purple-50 text-primary text-[11px] font-medium rounded-[4px]">{s}</span>
          ))}
        </div>

        {content.drillLink && (
          <button
            onClick={() => {
              onNavigate(content.drillLink!.route);
              onClose();
            }}
            className="flex items-center gap-1 text-primary text-[13px] font-bold hover:translate-x-1 transition-all pt-2"
          >
            {content.drillLink.label} <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[150]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-[160] flex flex-col font-sans"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div layout className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-100">
                  <Sparkles className="w-6 h-6" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">CoWorker AI</h3>
                  <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">Always online · ready to scan</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-all border border-transparent hover:border-gray-100">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto bg-gray-50/50 space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex items-start gap-3",
                  m.role === 'user' ? "flex-row-reverse" : ""
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                    m.role === 'user' ? "bg-primary text-white" : "bg-white border border-gray-100 text-primary"
                  )}>
                    {m.role === 'user' ? <span className="text-[10px] font-bold">YU</span> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "max-w-[92%] p-5 rounded-2xl shadow-sm text-[14px] leading-relaxed transition-all",
                    m.role === 'user'
                      ? "bg-primary text-white rounded-tr-[4px] ml-auto max-w-[80%] font-medium"
                      : "bg-white border border-gray-200 text-gray-700 rounded-tl-[4px]"
                  )}>
                    {renderAssistantContent(m.content)}
                  </div>
                </div>
              ))}
              {isThinking && <ThinkingIndicator />}
            </div>

            <div className="p-6 border-t border-gray-100 space-y-4 bg-white shadow-2xl">
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar">
                {visibleChips.map(r => (
                  <Chip key={r.id} text={r.question} onClick={() => handleSubmit(r.question)} />
                ))}
              </div>
              <div className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(input)}
                  placeholder="Ask about margins, claims, or P&L..."
                  className="w-full h-14 pl-6 pr-16 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white focus:ring-0 transition-all text-sm font-medium placeholder:text-gray-300"
                />
                <button
                  onClick={() => handleSubmit(input)}
                  className="absolute right-2 top-2 w-10 h-10 bg-primary text-white flex items-center justify-center rounded-xl hover:bg-navy-950 transition-all shadow-lg shadow-purple-100 group-hover:scale-105"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest text-center">CoWorker AI scans settlements and ads to find discrepancies</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
