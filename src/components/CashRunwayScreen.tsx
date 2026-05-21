import React from 'react';
import { motion } from 'motion/react';
import { Landmark, RefreshCw, TrendingDown, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import { Card, SectionHeader } from './shared/ui';

export const CashRunwayScreen = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-12 max-w-[1280px] mx-auto"
    >
      <SectionHeader 
        title="Cash Runway" 
        subtitle="Liquidity & Burn Forecast"
      >
        <div className="px-4 py-2 bg-success-50 border border-success-100 rounded-[8px] text-success font-bold text-[14px]">
          Runway: 11.4 Months
        </div>
      </SectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Bank Cash Balance', val: '₹3.84 Cr', icon: Landmark },
          { label: 'Settlement Pipeline', val: '₹52.4 L', icon: RefreshCw },
          { label: 'Weekly Burn', val: '₹22.1 L', icon: TrendingDown, error: true },
          { label: 'Liquid Reserve Pool', val: '₹1.10 Cr', icon: Target },
        ].map(stat => (
          <Card key={stat.label}>
             <div className="flex justify-between items-start mb-4">
               <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">{stat.label}</div>
               <stat.icon className="w-4 h-4 text-gray-300" />
             </div>
             <div className={cn("text-[28px] font-bold tabular-nums", stat.error ? "text-error" : "text-navy-950")}>{stat.val}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="13-Week Cash Flow Projection" className="lg:col-span-2">
           <div className="mt-8 h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={[
                   { name: 'W1', actual: 3.84, forecast: 3.84 },
                   { name: 'W2', actual: 3.92, forecast: 4.10 },
                   { name: 'W3', actual: 3.70, forecast: 3.85 },
                   { name: 'W4', actual: 3.52, forecast: 3.62 },
                   { name: 'W5', actual: null, forecast: 3.40 },
                   { name: 'W6', actual: null, forecast: 3.10 },
                   { name: 'W7', actual: null, forecast: 3.12 },
                   { name: 'W8', actual: null, forecast: 2.95 },
                   { name: 'W9', actual: null, forecast: 2.80 },
                 ]}>
                   <defs>
                     <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                       <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                   <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#9CA3AF' }}
                      dy={10}
                   />
                   <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#9CA3AF' }} 
                      unit=" Cr"
                      dx={-10}
                   />
                   <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '12px' }}
                      itemStyle={{ fontSize: '13px', fontWeight: '600', textTransform: 'capitalize' }}
                    />
                   <Area type="monotone" dataKey="actual" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAct)" />
                   <Area type="monotone" dataKey="forecast" stroke="var(--color-primary)" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </Card>

        <Card title="Sources & Uses (MTD)">
           <div className="space-y-6 mt-6">
              {[
                { label: 'Shopify Payouts', val: '+₹4.82 Cr', success: true },
                { label: 'COGS & Materials', val: '−₹5.24 Cr', error: true },
                { label: 'Marketplace Fees', val: '−₹2.18 Cr', error: true },
                { label: 'Ad Spend', val: '−₹1.10 Cr', error: true },
                { label: 'GST Refunds', val: '+₹42.1 L', success: true },
                { label: 'Payroll', val: '−₹58.2 L', error: true },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center group">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-tight">{row.label}</span>
                  <span className={cn("text-[14px] font-bold tabular-nums", row.success ? "text-success" : "text-error")}>{row.val}</span>
                </div>
              ))}
              <div className="pt-6">
                <button className="btn-secondary w-full h-10">Audit Weekly Ledger</button>
              </div>
           </div>
        </Card>
      </div>
    </motion.div>
  );
};