import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, RefreshCw, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  Connection,
  ConnectionCategory,
  ConnectionCategoryFilter,
  UnconnectedProvider,
  INITIAL_CONNECTIONS,
  UNCONNECTED_PROVIDERS,
  CATEGORY_TABS,
  CATEGORY_HEADINGS,
  CATEGORY_ORDER,
  SYNC_OPTIONS_BY_CATEGORY,
  ADD_SYNC_OPTIONS_BY_CATEGORY,
  SYNC_HISTORY,
  countByCategory,
  getInitials,
  getManageExtras,
  connectionFromProvider,
} from '../data/connectionsMockData';

const StatusPill = ({
  status,
  text,
}: {
  status: 'success' | 'error' | 'warning' | 'slate' | 'info';
  text: string;
}) => {
  const colors: Record<string, string> = {
    success: 'bg-success-50 text-success border-success-50',
    error: 'bg-error-50 text-error border-error-50',
    warning: 'bg-warning-50 text-warning border-warning-50',
    slate: 'bg-gray-100 text-gray-600 border-gray-200',
    info: 'bg-purple-50 text-primary border-purple-100',
  };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[12px] font-medium border', colors[status])}>
      {text}
    </span>
  );
};

const Card = ({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <motion.div
    className={cn('card', onClick && 'cursor-pointer', className)}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
  >
    {children}
  </motion.div>
);

const SectionHeader = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between mt-6 mb-6 px-1 flex-wrap gap-4">
    <div className="space-y-1">
      <h2 className="text-[22px] font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-[13px] text-gray-400">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const LogoPlaceholder = ({ name, size = 40 }: { name: string; size?: number }) => (
  <div
    className="rounded-[8px] bg-gray-100 flex items-center justify-center shrink-0 font-semibold text-gray-400"
    style={{ width: size, height: size, fontSize: size === 48 ? 16 : 14 }}
  >
    {getInitials(name)}
  </div>
);

function statusPillProps(status: Connection['status']) {
  if (status === 'connected') return { status: 'success' as const, text: 'Connected' };
  if (status === 'error') return { status: 'error' as const, text: 'Action needed' };
  return { status: 'slate' as const, text: 'Disconnected' };
}

const ManageConnectionModal = ({
  connection,
  onClose,
  onDisconnect,
  onToast,
}: {
  connection: Connection;
  onClose: () => void;
  onDisconnect: (id: string) => void;
  onToast: (msg: string) => void;
}) => {
  const [syncOptions, setSyncOptions] = useState<string[]>(() => [...SYNC_OPTIONS_BY_CATEGORY[connection.category]]);
  const [frequency, setFrequency] = useState('Every 15 min');
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isCashfree = connection.id === 'cashfree';
  const extras = getManageExtras(connection);
  const pill = statusPillProps(connection.status);

  const handleSyncNow = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      onClose();
      onToast(`Sync complete · 42 new records`);
    }, 1200);
  };

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      onToast('Connection test passed ✓');
    }, 800);
  };

  const toggleSyncOption = (opt: string) => {
    setSyncOptions((prev) => (prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]));
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-navy-950/20 backdrop-blur-[2px] z-[200]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-white rounded-[12px] shadow-2xl z-[201] p-8"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <LogoPlaceholder name={connection.name} size={48} />
            <div>
              <h3 className="text-[20px] font-semibold text-navy-950">{connection.name}</h3>
              <div className="mt-1">
                <StatusPill {...pill} />
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <section className="pt-6 border-t border-gray-100 space-y-3">
          <h4 className="text-[12px] font-medium uppercase tracking-wider text-gray-500">Connection details</h4>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
            <dt className="text-gray-500">Status</dt>
            <dd className="text-navy-950 font-medium">Connected since May 14, 2026</dd>
            <dt className="text-gray-500">Authentication</dt>
            <dd className="text-navy-950">{connection.authMethod} (last rotated 8 days ago)</dd>
            <dt className="text-gray-500">Last sync</dt>
            <dd className="text-navy-950">2 min ago · 218 records pulled</dd>
            <dt className="text-gray-500">Next sync</dt>
            <dd className="text-navy-950">In 13 min (auto · every 15 min)</dd>
            {extras.map((e) => (
              <React.Fragment key={e.label}>
                <dt className="text-gray-500">{e.label}</dt>
                <dd className="text-navy-950 font-medium tabular-nums">{e.value}</dd>
              </React.Fragment>
            ))}
          </dl>
        </section>

        <section className="pt-6 border-t border-gray-100 space-y-3">
          <h4 className="text-[12px] font-medium uppercase tracking-wider text-gray-500">Sync configuration</h4>
          <div className="flex flex-wrap gap-2">
            {SYNC_OPTIONS_BY_CATEGORY[connection.category].map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-[6px] text-[13px] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={syncOptions.includes(opt)}
                  onChange={() => toggleSyncOption(opt)}
                  className="rounded text-primary"
                />
                {opt}
              </label>
            ))}
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase block mb-1">Sync frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] w-full max-w-xs"
            >
              <option>Every 15 min</option>
              <option>Hourly</option>
              <option>Daily</option>
            </select>
          </div>
        </section>

        <section className="pt-6 border-t border-gray-100">
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={handleSyncNow} disabled={syncing} className="btn-primary h-9 px-4 text-[13px]">
              {syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Pulling {connection.name} settlements…
                </>
              ) : (
                'Sync now'
              )}
            </button>
            <button type="button" onClick={handleTest} disabled={testing} className="btn-secondary h-9 px-4 text-[13px]">
              {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Test connection'}
            </button>
            <button type="button" onClick={() => setShowHistory((v) => !v)} className="btn-tertiary text-[13px]">
              View sync history
            </button>
            <button type="button" onClick={() => setShowCredentials((v) => !v)} className="btn-tertiary text-[13px]">
              Edit credentials
            </button>
          </div>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="bg-gray-50 rounded-[8px] p-3 space-y-2">
                  {SYNC_HISTORY.map((h) => (
                    <div key={h.at} className="flex justify-between text-[12px]">
                      <span className="text-gray-600">{h.at}</span>
                      <span className="text-gray-500">
                        {h.records} records · {h.status}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            {showCredentials && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 space-y-3 overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Username / API key"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-[6px] text-[13px]"
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password / secret"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 px-3 pr-10 border border-gray-200 rounded-[6px] text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button type="button" className="btn-secondary h-9 px-4 text-[13px]" onClick={() => onToast('Credentials updated')}>
                  Save credentials
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <footer className="pt-6 mt-6 border-t border-gray-100">
          {confirmDisconnect ? (
            <div className="space-y-3">
              <p className="text-[13px] text-gray-600">
                Disconnecting {connection.name} will stop syncing orders, settlements, and returns. Reports that
                reference {connection.name} data may have stale numbers until you reconnect. Are you sure?
              </p>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setConfirmDisconnect(false)} className="btn-secondary h-9 px-4 text-[13px]">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDisconnect(connection.id);
                    onClose();
                    onToast(`${connection.name} disconnected`);
                  }}
                  className="btn-destructive h-9 px-4 text-[13px]"
                >
                  Yes, disconnect
                </button>
              </div>
            </div>
          ) : (
            <span className="relative group inline-block w-full">
              <button
                type="button"
                disabled={isCashfree}
                onClick={() => !isCashfree && setConfirmDisconnect(true)}
                className={cn('btn-destructive w-full h-10', isCashfree && 'opacity-50 cursor-not-allowed')}
              >
                Disconnect this source
              </button>
              {isCashfree && (
                <span className="pointer-events-none absolute left-0 bottom-full mb-1 hidden group-hover:block w-64 p-2 bg-white border border-gray-200 rounded-[6px] shadow-lg text-[11px] text-gray-600 z-10">
                  Cashfree is auto-linked and can&apos;t be disconnected from CoWorker.
                </span>
              )}
            </span>
          )}
        </footer>
      </motion.div>
    </>
  );
};

const AddConnectionModal = ({
  initialCategory,
  onClose,
  onComplete,
  onDiscardConfirm,
}: {
  initialCategory: ConnectionCategoryFilter;
  onClose: () => void;
  onComplete: (provider: UnconnectedProvider) => void;
  onDiscardConfirm: () => boolean;
}) => {
  const [step, setStep] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<ConnectionCategoryFilter>(
    initialCategory === 'all' ? 'marketplaces' : initialCategory
  );
  const [selected, setSelected] = useState<UnconnectedProvider | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tested, setTested] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncOpts, setSyncOpts] = useState<string[]>([]);
  const [frequency, setFrequency] = useState('Every 15 minutes');
  const [finishing, setFinishing] = useState(false);
  const [oauthConnecting, setOauthConnecting] = useState(false);
  const [oauthDone, setOauthDone] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  const providers = useMemo(
    () => UNCONNECTED_PROVIDERS.filter((p) => categoryFilter === 'all' || p.category === categoryFilter),
    [categoryFilter]
  );

  const resetStep2 = () => {
    setUsername('');
    setPassword('');
    setTested(false);
    setOauthDone(false);
    setApiKey('');
    setApiSecret('');
    setAccountNumber('');
    setIfsc('');
  };

  const initSyncOpts = (cat: ConnectionCategory) => {
    setSyncOpts([...ADD_SYNC_OPTIONS_BY_CATEGORY[cat]]);
  };

  const step2Valid = useMemo(() => {
    if (!selected) return false;
    if (selected.authType === 'credentials') return tested;
    if (selected.authType === 'oauth') return oauthDone;
    if (selected.authType === 'bank_otp') return oauthDone;
    if (selected.authType === 'api_key') return tested;
    return false;
  }, [selected, tested, oauthDone, accountNumber, ifsc]);

  const handleClose = () => {
    if (step > 1 || selected) {
      if (!onDiscardConfirm()) return;
    }
    onClose();
  };

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      setTested(true);
    }, 1200);
  };

  const handleOAuth = () => {
    setOauthConnecting(true);
    setTimeout(() => {
      setOauthConnecting(false);
      setOauthDone(true);
    }, 1500);
  };

  const handleFinish = () => {
    if (!selected || syncOpts.length === 0) return;
    setFinishing(true);
    setTimeout(() => {
      onComplete(selected);
    }, 1000);
  };

  const categoryChips: ConnectionCategory[] = CATEGORY_ORDER;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-navy-950/20 backdrop-blur-[2px] z-[200]"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-white rounded-[12px] shadow-2xl z-[201] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold',
                  step === s ? 'bg-primary text-white' : step > s ? 'bg-success-50 text-success' : 'bg-gray-100 text-gray-400'
                )}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
          <button type="button" onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-[18px] font-semibold text-navy-950">Connect a new source</h3>
            <div className="flex flex-wrap gap-2">
              {categoryChips.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(c);
                    setSelected(null);
                    resetStep2();
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-[12px] font-semibold border',
                    categoryFilter === c ? 'bg-purple-50 text-primary border-primary' : 'border-gray-200 text-gray-500'
                  )}
                >
                  {CATEGORY_HEADINGS[c]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelected(p);
                    resetStep2();
                    initSyncOpts(p.category);
                  }}
                  className={cn(
                    'p-4 rounded-[8px] border text-left transition-all',
                    selected?.id === p.id ? 'border-2 border-primary bg-purple-50' : 'border-gray-200 hover:border-primary/40'
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-[8px] bg-gray-100 flex items-center justify-center text-[12px] font-semibold text-gray-500">
                      {p.initials}
                    </div>
                    <span className="text-[15px] font-semibold text-navy-950">{p.name}</span>
                  </div>
                  <p className="text-[12px] text-gray-500 leading-snug">{p.description}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <button type="button" disabled={!selected} onClick={() => setStep(2)} className="btn-primary h-10 px-6 disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && selected && (
          <div className="space-y-4">
            <h3 className="text-[18px] font-semibold text-navy-950">Sign in to {selected.name}</h3>

            {selected.authType === 'credentials' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[12px] font-medium text-gray-500 block mb-1">Seller portal username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setTested(false);
                    }}
                    className="w-full h-10 px-3 border border-gray-200 rounded-[6px] text-[14px]"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-gray-500 block mb-1">Seller portal password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setTested(false);
                      }}
                      className="w-full h-10 px-3 pr-10 border border-gray-200 rounded-[6px] text-[14px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !username || !password}
                  className="btn-secondary h-10 px-4 text-[13px] gap-2 flex items-center"
                >
                  {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : tested ? <Check className="w-4 h-4 text-success" /> : null}
                  Test connection
                </button>
              </div>
            )}

            {selected.authType === 'oauth' && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleOAuth}
                  disabled={oauthConnecting || oauthDone}
                  className="btn-primary w-full h-11 text-[14px] flex items-center justify-center gap-2"
                >
                  {oauthConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Connecting via OAuth…
                    </>
                  ) : oauthDone ? (
                    <>
                      <Check className="w-4 h-4" />
                      Connected via {selected.oauthLabel ?? selected.name}
                    </>
                  ) : (
                    `Continue with ${selected.oauthLabel ?? selected.name}`
                  )}
                </button>
                <p className="text-[12px] text-gray-500 leading-relaxed">
                  {selected.category === 'accounting'
                    ? "We'll request read-only access to your books. You can revoke from Zoho account settings at any time."
                    : `We'll request read-only access to your ad accounts. You can revoke from your ${selected.oauthLabel ?? selected.name} account settings at any time.`}
                </p>
              </div>
            )}

            {selected.authType === 'bank_otp' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[12px] font-medium text-gray-500 block mb-1">Account number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                    className="w-full h-10 px-3 border border-gray-200 rounded-[6px] text-[14px]"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-gray-500 block mb-1">IFSC</label>
                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. ICIC0001234"
                    className="w-full h-10 px-3 border border-gray-200 rounded-[6px] text-[14px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleOAuth}
                  disabled={oauthConnecting || oauthDone || !accountNumber || !ifsc}
                  className="btn-primary w-full h-11 text-[14px]"
                >
                  {oauthConnecting ? 'Redirecting to bank for OTP…' : oauthDone ? 'Bank verified ✓' : "Continue to bank's site for OTP"}
                </button>
              </div>
            )}

            {selected.authType === 'api_key' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[12px] font-medium text-gray-500 block mb-1">API key</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setTested(false);
                    }}
                    className="w-full h-10 px-3 border border-gray-200 rounded-[6px] text-[14px]"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-gray-500 block mb-1">API secret</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={apiSecret}
                      onChange={(e) => {
                        setApiSecret(e.target.value);
                        setTested(false);
                      }}
                      className="w-full h-10 px-3 pr-10 border border-gray-200 rounded-[6px] text-[14px]"
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !apiKey || !apiSecret}
                  className="btn-secondary h-10 px-4 text-[13px] gap-2 flex items-center"
                >
                  {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : tested ? <Check className="w-4 h-4 text-success" /> : null}
                  Test connection
                </button>
              </div>
            )}

            <p className="text-[12px] text-gray-500 leading-relaxed">
              We use read-only access. Credentials are encrypted at rest and never reused. You can revoke any time.
            </p>

            <div className="flex justify-between pt-4">
              <button type="button" onClick={() => setStep(1)} className="btn-tertiary text-[13px]">
                ← Back
              </button>
              <button type="button" disabled={!step2Valid} onClick={() => setStep(3)} className="btn-primary h-10 px-6 disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && selected && (
          <div className="space-y-4">
            <h3 className="text-[18px] font-semibold text-navy-950">What should we pull from {selected.name}?</h3>
            <div className="space-y-2">
              {ADD_SYNC_OPTIONS_BY_CATEGORY[selected.category].map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-[14px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncOpts.includes(opt)}
                    onChange={() =>
                      setSyncOpts((prev) => (prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]))
                    }
                    className="rounded text-primary"
                  />
                  {opt}
                </label>
              ))}
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-500 uppercase block mb-1">Sync frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-[6px] text-[13px] w-full max-w-xs"
              >
                <option>Every 15 minutes</option>
                <option>Hourly</option>
                <option>Daily</option>
              </select>
            </div>
            <div className="flex justify-between pt-4">
              <button type="button" onClick={() => setStep(2)} className="btn-tertiary text-[13px]">
                ← Back
              </button>
              <button
                type="button"
                disabled={syncOpts.length === 0 || finishing}
                onClick={handleFinish}
                className="btn-primary h-10 px-6 disabled:opacity-50"
              >
                {finishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Setting up {selected.name} connection…
                  </>
                ) : (
                  'Finish setup'
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

const ConnectionCard = ({
  connection,
  onManage,
  onConnect,
}: {
  connection: Connection;
  onManage: (c: Connection) => void;
  onConnect: (c: Connection) => void;
}) => {
  const pill = statusPillProps(connection.status);
  const isCashfree = connection.id === 'cashfree';

  return (
    <Card className="flex flex-col gap-3" onClick={() => onManage(connection)}>
      <div className="flex items-start justify-between">
        <LogoPlaceholder name={connection.name} size={40} />
        <StatusPill {...pill} />
      </div>
      <div>
        <h3 className="text-[16px] font-semibold text-navy-950">{connection.name}</h3>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {connection.type} · {connection.lastSync}
        </p>
        <p className="text-[12px] text-gray-500 mt-1">Auth: {connection.authMethod}</p>
      </div>
      {isCashfree && (
        <p className="text-[11px] text-primary bg-purple-50 px-3 py-2 rounded-[6px]">
          Auto-linked to your Cashfree merchant account — no setup needed.
        </p>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          connection.status === 'disconnected' ? onConnect(connection) : onManage(connection);
        }}
        className={cn(
          'w-full h-9 text-[13px] rounded-[6px] font-semibold',
          connection.status === 'disconnected' ? 'btn-primary' : 'btn-secondary'
        )}
      >
        {connection.status === 'disconnected' ? 'Connect' : 'Manage'}
      </button>
    </Card>
  );
};

const AddTile = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="min-h-[180px] border-2 border-dashed border-gray-200 rounded-[12px] flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary hover:bg-purple-50/30 transition-all"
  >
    <Plus className="w-8 h-8" />
    <span className="text-[14px] font-semibold">+ Add connection</span>
  </button>
);

export const ConnectionsScreen = () => {
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [selectedCategory, setSelectedCategory] = useState<ConnectionCategoryFilter>('all');
  const [manageConnection, setManageConnection] = useState<Connection | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addCategory, setAddCategory] = useState<ConnectionCategoryFilter>('all');
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (selectedCategory === 'all') return connections;
    return connections.filter((c) => c.category === selectedCategory);
  }, [connections, selectedCategory]);

  const grouped = useMemo(() => {
    if (selectedCategory !== 'all') return null;
    const cats: ConnectionCategory[] = CATEGORY_ORDER;
    return cats.map((cat) => ({
      cat,
      items: connections.filter((c) => c.category === cat),
    }));
  }, [connections, selectedCategory]);

  const openAdd = (cat: ConnectionCategoryFilter = selectedCategory) => {
    setAddCategory(cat);
    setAddOpen(true);
  };

  const handleDisconnect = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    setManageConnection(null);
  };

  const handleAddComplete = (provider: UnconnectedProvider) => {
    const exists = connections.some((c) => c.id === provider.id);
    if (!exists) {
      setConnections((prev) => [...prev, connectionFromProvider(provider)]);
    }
    setAddOpen(false);
    setToast(`${provider.name} connected · first sync starts in a few seconds.`);
  };

  const discardAdd = () => window.confirm('Discard new connection setup?');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const renderGrid = (items: Connection[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((c) => (
        <ConnectionCard
          key={c.id}
          connection={c}
          onManage={setManageConnection}
          onConnect={() => openAdd(c.category)}
        />
      ))}
      <AddTile onClick={() => openAdd(selectedCategory)} />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12 max-w-[1280px] mx-auto">
      <SectionHeader title="Connections" subtitle="Every source of money-moving data CoWorker can access">
        <button type="button" onClick={() => openAdd()} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Add Connection
        </button>
      </SectionHeader>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-8 z-[220] bg-success-50 border border-success-100 text-success px-4 py-3 rounded-[8px] shadow-lg text-[13px] font-medium max-w-sm"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {CATEGORY_TABS.map((tab) => {
          const count = countByCategory(connections, tab.id);
          const active = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={cn(
                'px-4 py-2.5 text-[13px] font-semibold transition-all border-b-2 -mb-px',
                active
                  ? 'bg-purple-50 text-primary border-primary'
                  : 'text-gray-500 border-transparent hover:text-gray-900'
              )}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {selectedCategory === 'all' && grouped
        ? grouped.map(({ cat, items }) => (
            <div key={cat}>
              <h3 className="text-[14px] font-medium uppercase tracking-wider text-gray-500 mt-8 mb-3 first:mt-0">
                {CATEGORY_HEADINGS[cat]}
              </h3>
              {renderGrid(items)}
            </div>
          ))
        : renderGrid(filtered)}

      <AnimatePresence>
        {manageConnection && (
          <ManageConnectionModal
            connection={manageConnection}
            onClose={() => setManageConnection(null)}
            onDisconnect={handleDisconnect}
            onToast={(msg) => {
              setToast(msg);
              setManageConnection(null);
            }}
          />
        )}
        {addOpen && (
          <AddConnectionModal
            initialCategory={addCategory}
            onClose={() => setAddOpen(false)}
            onComplete={handleAddComplete}
            onDiscardConfirm={discardAdd}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
