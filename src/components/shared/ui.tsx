import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, Info, ArrowUpRight, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const DeltaArrow = ({ value, className }: { value: number; className?: string }) => {
  const isPositive = value >= 0;
  return (
    <div className={cn('flex items-center gap-1 text-[13px] font-medium', isPositive ? 'text-success' : 'text-error', className)}>
      {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {isPositive ? '+' : '-'}
      {Math.abs(value)}%
    </div>
  );
};

export const StatusPill = ({
  status,
  type,
  text,
  label,
}: {
  status?: 'emerald' | 'amber' | 'rose' | 'slate' | 'success' | 'error' | 'warning' | 'info';
  type?: string;
  text?: string;
  label?: string;
}) => {
  const statusToUse = status || type || 'slate';
  const textToUse = text || label || '';
  const colors: Record<string, string> = {
    emerald: 'bg-success-50 text-success border-success-50',
    success: 'bg-success-50 text-success border-success-50',
    amber: 'bg-warning-50 text-warning border-warning-50',
    warning: 'bg-warning-50 text-warning border-warning-50',
    rose: 'bg-error-50 text-error border-error-50',
    error: 'bg-error-50 text-error border-error-50',
    slate: 'bg-gray-100 text-gray-600 border-gray-200',
    info: 'bg-purple-50 text-primary border-purple-100',
  };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[12px] font-medium border', colors[statusToUse as string] || colors.slate)}>
      {textToUse}
    </span>
  );
};

const InfoIcon = ({ tooltip }: { tooltip?: string }) => (
  <div className="relative group inline-block ml-1">
    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
    {tooltip && (
      <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white p-3 rounded-lg text-[12px] shadow-xl z-50 pointer-events-none leading-relaxed">
        {tooltip}
      </div>
    )}
  </div>
);

export const SectionHeader = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between mt-6 mb-6 px-1">
    <div className="space-y-1">
      <h2 className="text-[22px] font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-[13px] text-gray-400">{subtitle}</p>}
    </div>
    {children && <div className="flex items-center gap-3">{children}</div>}
  </div>
);

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  onOpenView?: () => void;
}

export const Card = ({ title, subtitle, children, className, onOpenView }: CardProps) => (
  <div className={cn('card flex flex-col gap-3 group relative', className)}>
    {title && (
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[16px] font-semibold text-gray-900">{title}</h3>
            <InfoIcon tooltip={`Insights for ${title}`} />
          </div>
          {subtitle && <p className="text-[13px] text-gray-400">Last updated — {subtitle}</p>}
        </div>
        {onOpenView && (
          <button type="button" onClick={onOpenView} className="p-1 text-gray-400 hover:text-primary transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </button>
        )}
      </div>
    )}
    <div className={cn('flex-grow', !title && 'mt-0')}>{children}</div>
  </div>
);

export const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-navy-950/20 backdrop-blur-[2px] z-[200]"
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-2xl z-[201] flex flex-col"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-[16px] font-bold text-gray-900">{title}</h2>
            <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-grow overflow-y-auto p-6">{children}</div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
