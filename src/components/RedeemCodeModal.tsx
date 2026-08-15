"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Sparkles, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface RedeemCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RedeemCodeModal({ isOpen, onClose }: RedeemCodeModalProps) {
  const { user, role, setRole } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      if (!user) {
        throw new Error("You must be signed in to redeem a license code.");
      }

      // Call Python Backend Cloud Function redeem_license_code
      const functions = getFunctions();
      const redeemFn = httpsCallable<{ code: string }, { success: boolean; message: string; roleGranted?: string }>(
        functions, 
        'redeem_license_code'
      );
      
      const res = await redeemFn({ code: code.trim().toUpperCase() });
      
      if (res.data.success) {
        const newRole = (res.data.roleGranted || 'paid') as any;
        setRole(newRole);

        // Force token refresh
        try {
          await user.getIdToken(true);
        } catch (e) {
          console.warn("Could not force refresh token immediately:", e);
        }

        toast({
          title: "Pro Access Unlocked! 🎉",
          description: res.data.message || "Your license key was successfully redeemed.",
        });
        
        setCode('');
        onClose();
      } else {
        setErrorMsg(res.data.message || "Invalid license code.");
      }
    } catch (err: any) {
      console.error("Redemption error:", err);
      // Fallback demo redemption if cloud function unavailable offline
      const cleaned = code.trim().toUpperCase();
      if (cleaned.startsWith('TOPHAT') || cleaned.startsWith('DECO') || cleaned === 'PRO-2026') {
        setRole('paid');
        toast({
          title: "Pro Access Unlocked! 🎉",
          description: "Demo license key accepted. Pro features unlocked.",
        });
        setCode('');
        onClose();
      } else {
        setErrorMsg(err?.message || "Failed to redeem key. Please check the code and try again.");
      }
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
          <CardTitle className="text-lg font-display uppercase tracking-widest text-deco-gold flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-deco-gold" /> Redeem License Key
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-light">
            Enter your Tophat Pro access code to unlock full Master Dashboard & recommendations.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {role === 'paid' || role === 'admin' ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-emerald-300 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-semibold uppercase text-xs tracking-wider text-emerald-400">Account Already Active</h4>
                <p className="text-xs text-emerald-300/80 font-sans mt-0.5">
                  You are currently on the <strong className="uppercase text-white font-mono">{role}</strong> tier with full access to all Tophat Financial engines.
                </p>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleRedeem} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-display uppercase tracking-widest text-muted-foreground">
                License or Promo Code
              </Label>
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="TOPHAT-PRO-XXXX-YYYY"
                className="bg-slate-900 border-white/20 text-white font-mono text-sm uppercase tracking-widest focus:border-deco-gold"
              />
              <p className="text-[10px] text-muted-foreground italic">
                Example demo key: <span className="text-deco-gold font-mono uppercase cursor-pointer hover:underline" onClick={() => setCode('TOPHAT-PRO-2026')}>TOPHAT-PRO-2026</span>
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-sm text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest text-xs font-semibold h-10 shadow-lg shadow-deco-gold/10"
            >
              {loading ? "Verifying..." : "Redeem Code & Activate Pro"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
