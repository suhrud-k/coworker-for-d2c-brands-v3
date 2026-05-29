import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, SectionHeader, StatusPill, DeltaArrow } from './shared/ui';

export function KrishanBriefPanel() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <SectionHeader title="Weekly brief for Akash" subtitle="Week of May 18, 2026">
        <StatusPill status="success" text="Network Healthy" />
      </SectionHeader>

      <Card className="border-l-4 border-l-primary">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          <span className="text-[12px] font-medium uppercase tracking-wider text-gray-500">Weekly performance summary</span>
        </div>
        <p className="text-[16px] text-gray-900 leading-relaxed font-medium">
          <span className="text-primary font-bold">₹62.4 L</span> net this week on{' '}
          <span className="text-gray-500">₹4.18 cr GMV</span> —{' '}
          <span className="text-error font-bold">14.9% margin</span>, down 180 bps WoW. Myntra is the bleeder.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'GMV consolidated', value: '₹4.18 Cr', delta: 4.2 },
          { label: 'Realized revenue', value: '₹3.72 Cr', delta: 2.8 },
          { label: 'Operating margin', value: '14.9%', delta: -1.8 },
          { label: 'Liquidity runway', value: '11.4 mo', delta: 0, ok: true },
        ].map(s => (
          <Card key={s.label}>
            <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-3">{s.label}</div>
            <div className={cn('text-[28px] font-bold tabular-nums mb-2', s.ok ? 'text-success' : 'text-gray-900')}>{s.value}</div>
            <DeltaArrow value={s.delta} />
          </Card>
        ))}
      </div>

      <Card title="Things to act on" subtitle="Sorted by urgency">
        <div className="space-y-3 mt-2">
          {[
            { title: 'GSTR-2B data mismatch', why: '12 invoices · ₹47K at risk', urgent: 'error' },
            { title: 'Approve 3 vendor payments', why: '₹2.42L · Priya', urgent: 'warning' },
            { title: "Review Maya's reallocation", why: '₹3.8L/wk', urgent: 'normal' },
          ].map(item => (
            <div
              key={item.title}
              className={cn(
                'p-4 rounded-xl border flex flex-col gap-2',
                item.urgent === 'error' ? 'bg-error-50 border-error-50' : item.urgent === 'warning' ? 'bg-warning-50 border-warning-50' : 'bg-gray-50 border-gray-100'
              )}
            >
              <div className="flex items-start gap-2">
                {item.urgent === 'error' && <AlertCircle className="w-4 h-4 text-error shrink-0" />}
                <div>
                  <div className="text-[13px] font-semibold text-gray-900">{item.title}</div>
                  <div className="text-[12px] text-gray-600">{item.why}</div>
                </div>
              </div>
              <button type="button" className="btn-secondary w-full h-8 text-[12px]">
                Review <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
