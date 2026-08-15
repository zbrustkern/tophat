"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Mail, Lock, KeyRound, Sparkles, AlertCircle, X, ArrowRight } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/lib/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'signin' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [showPromoField, setShowPromoField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const { setRole } = useAuth();
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      toast({
        title: "Welcome to Tophat Financial",
        description: "Signed in successfully with Google.",
      });
      onClose();
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setErrorMsg(err?.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (activeTab === 'signin') {
        await signInWithEmail(email, password);
        toast({
          title: "Welcome Back",
          description: "Signed in successfully.",
        });
      } else {
        // Create Account
        const userCred = await signUpWithEmail(email, password);
        toast({
          title: "Account Created!",
          description: "Welcome to Tophat Financial.",
        });

        // Redeem promo code if provided during signup
        if (promoCode.trim()) {
          try {
            const functions = getFunctions();
            const redeemFn = httpsCallable<{ code: string }, { success: boolean; message: string; roleGranted?: string }>(
              functions, 
              'redeem_license_code'
            );
            const res = await redeemFn({ code: promoCode.trim().toUpperCase() });
            if (res.data.success) {
              setRole((res.data.roleGranted || 'paid') as any);
              toast({
                title: "Pro Access Activated! 🎉",
                description: res.data.message || "Promo key redeemed during registration.",
              });
            }
          } catch (codeErr) {
            console.warn("Promo code redemption during signup fallback:", codeErr);
            if (promoCode.trim().toUpperCase().startsWith('TOPHAT')) {
              setRole('paid');
            }
          }
        }
      }
      onClose();
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMsg(err?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-md bg-slate-950 border border-deco-gold/30 shadow-2xl rounded-sm text-foreground relative">
        <button 
          onClick={onClose}
          className="absolute right-3 top-3 text-muted-foreground hover:text-white p-1 rounded-sm transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <img src="/tophat_logo.png" width={32} height={32} alt="Logo" />
            <CardTitle className="text-xl font-display uppercase tracking-widest text-deco-gold">
              Tophat Financial
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground font-light">
            {activeTab === 'signin' ? "Sign in to access your wealth planning dashboard." : "Create an account to build your financial master plan."}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-sm border border-white/10">
            <button
              onClick={() => { setActiveTab('signin'); setErrorMsg(null); }}
              className={`py-1.5 text-xs font-display uppercase tracking-wider font-semibold rounded-xs transition-colors ${
                activeTab === 'signin' 
                  ? 'bg-deco-gold text-slate-950 shadow-sm' 
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setErrorMsg(null); }}
              className={`py-1.5 text-xs font-display uppercase tracking-wider font-semibold rounded-xs transition-colors ${
                activeTab === 'signup' 
                  ? 'bg-deco-gold text-slate-950 shadow-sm' 
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Google 1-Click Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-slate-900 border-white/20 hover:bg-slate-800 text-white font-display text-xs tracking-wider uppercase h-10"
          >
            <GoogleIcon /> Continue with Google
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full"></div>
            <span className="bg-slate-950 px-3 text-[10px] font-display uppercase tracking-widest text-muted-foreground shrink-0">
              Or with Email
            </span>
            <div className="border-t border-white/10 w-full"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-display uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email Address
              </Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-slate-900 border-white/20 text-white font-sans text-xs focus:border-deco-gold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-display uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Password
              </Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-900 border-white/20 text-white font-sans text-xs focus:border-deco-gold"
              />
            </div>

            {/* Registration Promo Code Option */}
            {activeTab === 'signup' && (
              <div className="pt-1">
                {!showPromoField ? (
                  <button
                    type="button"
                    onClick={() => setShowPromoField(true)}
                    className="text-[11px] text-deco-gold hover:underline font-display uppercase tracking-wider flex items-center gap-1"
                  >
                    <KeyRound className="h-3 w-3" /> Have a promo or access code?
                  </button>
                ) : (
                  <div className="space-y-1.5 p-3 bg-slate-900/90 border border-deco-gold/30 rounded-sm animate-in fade-in">
                    <Label className="text-[10px] font-display uppercase tracking-widest text-deco-gold flex items-center gap-1">
                      <KeyRound className="h-3 w-3" /> Promo / License Key
                    </Label>
                    <Input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="TOPHAT-PRO-2026"
                      className="bg-slate-950 border-white/20 text-white font-mono text-xs uppercase focus:border-deco-gold"
                    />
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-sm text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest text-xs font-semibold h-10 shadow-lg shadow-deco-gold/10"
            >
              {loading ? "Processing..." : activeTab === 'signin' ? "Sign In" : "Create Account & Unlock"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
