export type UserRole = 'guest' | 'free' | 'paid' | 'admin';

export type FeatureKey = 
  | 'master_dashboard'
  | 'float_maximization'
  | 'next_dollar_recommendations'
  | 'disaster_simulator'
  | 'demo_mode'
  | 'admin_panel';

export interface LicenseConfig {
  role: UserRole;
  licenseKey?: string;
  expiresAt?: string;
}

const FREE_FEATURES: FeatureKey[] = ['demo_mode', 'master_dashboard'];
const PAID_FEATURES: FeatureKey[] = [
  'master_dashboard',
  'float_maximization',
  'next_dollar_recommendations',
  'disaster_simulator',
  'demo_mode'
];

export function hasFeatureAccess(role: UserRole = 'free', feature: FeatureKey): boolean {
  if (role === 'admin') return true;
  if (role === 'paid') return PAID_FEATURES.includes(feature);
  if (role === 'free') return FREE_FEATURES.includes(feature);
  return feature === 'demo_mode';
}

export function generateAccessCode(recipientEmail: string): string {
  const prefix = 'TOPHAT-2026';
  const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${hash}`;
}
