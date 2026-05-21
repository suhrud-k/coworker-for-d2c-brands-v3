export type ConnectionCategory = 'marketplaces' | 'banks' | 'pgs' | 'ad_platforms' | 'accounting';
export type ConnectionCategoryFilter = 'all' | ConnectionCategory;
export type ConnectionStatus = 'connected' | 'error' | 'disconnected';
export type ProviderAuthType = 'credentials' | 'oauth' | 'bank_otp' | 'api_key';

export interface Connection {
  id: string;
  name: string;
  category: ConnectionCategory;
  status: ConnectionStatus;
  lastSync: string;
  type: string;
  authMethod: string;
}

export interface UnconnectedProvider {
  id: string;
  name: string;
  initials: string;
  category: ConnectionCategory;
  description: string;
  authType: ProviderAuthType;
  oauthLabel?: string;
}

export const CATEGORY_TABS: { id: ConnectionCategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'marketplaces', label: 'Marketplaces' },
  { id: 'banks', label: 'Banks' },
  { id: 'pgs', label: 'PGs' },
  { id: 'ad_platforms', label: 'Ad Platforms' },
  { id: 'accounting', label: 'Accounting' },
];

export const CATEGORY_HEADINGS: Record<ConnectionCategory, string> = {
  marketplaces: 'Marketplaces',
  banks: 'Banks',
  pgs: 'Payment gateways',
  ad_platforms: 'Ad platforms',
  accounting: 'Accounting',
};

export const CATEGORY_ORDER: ConnectionCategory[] = [
  'marketplaces',
  'banks',
  'pgs',
  'ad_platforms',
  'accounting',
];

export const INITIAL_CONNECTIONS: Connection[] = [
  { id: 'amazon', name: 'Amazon India', category: 'marketplaces', status: 'connected', lastSync: 'May 18, 4:12 PM', type: 'Marketplace', authMethod: 'API key' },
  { id: 'flipkart', name: 'Flipkart', category: 'marketplaces', status: 'connected', lastSync: 'May 18, 4:08 PM', type: 'Marketplace', authMethod: 'Username/password' },
  { id: 'myntra', name: 'Myntra', category: 'marketplaces', status: 'error', lastSync: 'May 16, 2:12 PM', type: 'Marketplace', authMethod: 'API key' },
  { id: 'shopify', name: 'Shopify Store', category: 'marketplaces', status: 'connected', lastSync: 'May 18, 4:10 PM', type: 'Own store', authMethod: 'OAuth' },
  { id: 'hdfc', name: 'HDFC Bank', category: 'banks', status: 'connected', lastSync: 'May 18, 4:00 PM', type: 'Current account · ··2847', authMethod: 'Account aggregator' },
  { id: 'axis', name: 'Axis Bank', category: 'banks', status: 'connected', lastSync: 'May 18, 3:55 PM', type: 'Current account · ··5621', authMethod: 'Account aggregator' },
  { id: 'cashfree', name: 'Cashfree', category: 'pgs', status: 'connected', lastSync: 'Just now', type: 'Native · auto-linked', authMethod: 'Native' },
  { id: 'razorpay', name: 'Razorpay', category: 'pgs', status: 'connected', lastSync: 'May 18, 4:02 PM', type: 'PG settlements', authMethod: 'API key' },
  { id: 'meta-ads', name: 'Meta Ads', category: 'ad_platforms', status: 'connected', lastSync: 'May 18, 4:05 PM', type: 'Facebook + Instagram · Business Manager', authMethod: 'OAuth (Facebook)' },
  { id: 'google-ads', name: 'Google Ads', category: 'ad_platforms', status: 'connected', lastSync: 'May 18, 4:01 PM', type: 'Search + YouTube + Display · MCC linked', authMethod: 'OAuth (Google)' },
  { id: 'amazon-ads', name: 'Amazon Ads', category: 'ad_platforms', status: 'connected', lastSync: 'May 18, 2:48 PM', type: 'Sponsored Products + Brands + Display', authMethod: 'OAuth (Login with Amazon)' },
  { id: 'tally', name: 'Tally Prime', category: 'accounting', status: 'connected', lastSync: 'May 18, 3:30 PM', type: 'On-prem via Tally plugin', authMethod: 'Tally connector' },
];

export const UNCONNECTED_PROVIDERS: UnconnectedProvider[] = [
  { id: 'meesho', name: 'Meesho', initials: 'MS', category: 'marketplaces', description: 'Reseller-focused marketplace · 1M+ sellers, 13.3M+ resellers', authType: 'credentials' },
  { id: 'zepto', name: 'Zepto', initials: 'ZP', category: 'marketplaces', description: 'Quick-commerce platform · 10-minute delivery', authType: 'credentials' },
  { id: 'icici', name: 'ICICI Bank', initials: 'IC', category: 'banks', description: 'Current account via account aggregator', authType: 'bank_otp' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', initials: 'KM', category: 'banks', description: 'Current account via account aggregator', authType: 'bank_otp' },
  { id: 'payu', name: 'PayU', initials: 'PU', category: 'pgs', description: 'Payment gateway settlements', authType: 'api_key' },
  { id: 'easebuzz', name: 'Easebuzz', initials: 'EB', category: 'pgs', description: 'Payment gateway settlements', authType: 'api_key' },
  { id: 'linkedin-ads', name: 'LinkedIn Ads', initials: 'LI', category: 'ad_platforms', description: 'B2B campaigns · Lead gen and brand awareness', authType: 'oauth', oauthLabel: 'LinkedIn' },
  { id: 'snapchat-ads', name: 'Snapchat Ads', initials: 'SC', category: 'ad_platforms', description: 'Gen-Z reach · AR lenses and story ads', authType: 'oauth', oauthLabel: 'Snapchat' },
  { id: 'zoho', name: 'Zoho Books', initials: 'ZB', category: 'accounting', description: 'Cloud accounting · chart of accounts sync', authType: 'oauth', oauthLabel: 'Zoho' },
];

export const SYNC_OPTIONS_BY_CATEGORY: Record<ConnectionCategory, string[]> = {
  marketplaces: ['Orders', 'Settlements', 'Returns', 'Inventory', 'Ad spend'],
  banks: ['Daily statements', 'Transaction-level pulls'],
  pgs: ['Settlement batches', 'Transaction-level data'],
  ad_platforms: ['Campaigns', 'Ad sets', 'Daily spend', 'Conversions (by attribution window)', 'Audience insights'],
  accounting: ['Chart of Accounts', 'Ledgers', 'Vouchers'],
};

export const ADD_SYNC_OPTIONS_BY_CATEGORY: Record<ConnectionCategory, string[]> = {
  marketplaces: ['Orders', 'Settlements', 'Returns', 'Inventory levels', 'Ad spend (PLAs)'],
  banks: ['Daily statements', 'Transaction-level pulls'],
  pgs: ['Settlement batches', 'Transaction-level data'],
  ad_platforms: ['Campaigns', 'Ad sets', 'Daily spend', 'Conversions (by attribution window)', 'Audience insights'],
  accounting: ['Chart of Accounts', 'Ledgers', 'Vouchers'],
};

export const SYNC_HISTORY = [
  { at: 'May 18, 4:12 PM', records: 42, status: 'Success' },
  { at: 'May 18, 3:57 PM', records: 38, status: 'Success' },
  { at: 'May 18, 3:42 PM', records: 41, status: 'Success' },
  { at: 'May 18, 3:27 PM', records: 0, status: 'Partial' },
  { at: 'May 18, 3:12 PM', records: 39, status: 'Success' },
];

export function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function countByCategory(connections: Connection[], cat: ConnectionCategoryFilter): number {
  if (cat === 'all') return connections.length;
  return connections.filter((c) => c.category === cat).length;
}

export function getManageExtras(conn: Connection): { label: string; value: string }[] {
  if (conn.category === 'banks') {
    const acct = conn.id === 'hdfc' ? '··2847' : '··5621';
    const ifsc = conn.id === 'hdfc' ? 'HDFC0001234' : 'UTIB0000456';
    return [
      { label: 'Account number', value: acct },
      { label: 'IFSC', value: ifsc },
    ];
  }
  if (conn.category === 'pgs' && conn.id === 'cashfree') {
    return [{ label: 'Merchant ID', value: 'CF_M_92847' }];
  }
  if (conn.category === 'pgs') {
    return [{ label: 'Merchant ID', value: 'RZ_M_44102' }];
  }
  if (conn.category === 'accounting') {
    return [
      { label: 'Tally instance host', value: '192.168.1.42:9000' },
      { label: 'Plugin version', value: 'v2.4.1' },
    ];
  }
  return [];
}

export function connectionFromProvider(provider: UnconnectedProvider): Connection {
  const typeByCategory: Record<ConnectionCategory, string> = {
    marketplaces: 'Marketplace',
    banks: 'Current account',
    pgs: 'PG settlements',
    ad_platforms: 'Ad platform',
    accounting: 'Accounting',
  };
  const authByType: Record<ProviderAuthType, string> = {
    credentials: 'Username/password',
    oauth: `OAuth (${provider.oauthLabel ?? provider.name})`,
    bank_otp: 'Account aggregator',
    api_key: 'API key',
  };
  return {
    id: provider.id,
    name: provider.name,
    category: provider.category,
    status: 'connected',
    lastSync: 'Just now',
    type: typeByCategory[provider.category],
    authMethod: authByType[provider.authType],
  };
}
