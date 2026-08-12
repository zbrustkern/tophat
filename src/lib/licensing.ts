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

export const ADMIN_EMAILS: string[] = [
  'sentral@gmail.com',
  ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
].filter(Boolean);

export function getUserRole(userEmail?: string | null, customRoleOverride?: UserRole | null): UserRole {
  if (customRoleOverride) return customRoleOverride;
  if (!userEmail) return 'guest';
  
  const normalizedEmail = userEmail.toLowerCase();
  if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(normalizedEmail)) {
    return 'admin';
  }
  
  // Default logged-in user role
  return 'paid';
}

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
