import { AlertCircle, AlertTriangle, BarChart3, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { THREAD_STATUS } from '../data/threadStatusMockData';
import { getAgent } from '../data/agentsMockData';
import type { OfficeDeepLink, ThreadStatusSignal } from '../v3Types';

const SIGNAL_ICON: Record<
  ThreadStatusSignal,
  { Icon: typeof CheckCircle2; className: string }
> = {
  green: { Icon: CheckCircle2, className: 'text-emerald-600' },
  amber: { Icon: AlertTriangle, className: 'text-amber-500' },
  red: { Icon: AlertCircle, className: 'text-rose-600' },
  neutral: { Icon: BarChart3, className: 'text-purple-600' },
};

type StatusRailProps = {
  onDeepLink: (link: OfficeDeepLink) => void;
  layout?: 'vertical' | 'horizontal';
};

export function StatusRail({ onDeepLink, layout = 'vertical' }: StatusRailProps) {
  const isHorizontal = layout === 'horizontal';

  return (
    <div className={cn(isHorizontal ? 'w-full' : 'w-full lg:w-[280px] shrink-0')}>
      <div
        className={cn(
          'flex items-baseline justify-between gap-2 mb-3',
          isHorizontal && 'px-1'
        )}
      >
        <h2 className="text-sm font-medium text-slate-600">Today&apos;s status</h2>
        <span className="text-[11px] text-slate-400 shrink-0">updated 2 min ago</span>
      </div>

      <div
        className={cn(
          isHorizontal
            ? 'flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory'
            : 'flex flex-col gap-3'
        )}
      >
        {THREAD_STATUS.map(thread => {
          const { Icon, className } = SIGNAL_ICON[thread.signal];
          const agent = getAgent(thread.agentId);

          return (
            <button
              key={thread.id}
              type="button"
              onClick={() => onDeepLink(thread.deepLink)}
              className={cn(
                'bg-white rounded-xl border border-slate-200 p-4 text-left transition-all',
                'hover:border-purple-300 hover:shadow-sm',
                'flex gap-3 items-start w-full',
                isHorizontal && 'min-w-[240px] max-w-[260px] shrink-0 snap-start'
              )}
            >
              <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', className)} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-[14px]">{thread.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{agent.name}</div>
                <div className="text-sm text-slate-700 mt-2 line-clamp-2">{thread.statusLine}</div>
                <div className="text-xs text-purple-700 mt-2 hover:underline text-right">→</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
