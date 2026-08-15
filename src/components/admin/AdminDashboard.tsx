"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, ShieldCheck, UserCheck, Sparkles, Copy, Check, Eye } from 'lucide-react';
import { generateAccessCode, UserRole } from '@/lib/licensing';
import { useToast } from '@/hooks/use-toast';
import { usePlans } from '@/contexts/PlansContext';

export default function AdminDashboard({ currentRole = 'admin', onRoleChange }: { currentRole?: UserRole; onRoleChange?: (role: UserRole) => void }) {
  const { isDemoMode, toggleDemoMode } = usePlans();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const code = generateAccessCode(recipientEmail);
    setGeneratedKey(code);
    toast({
      title: "License Key Generated",
      description: `Key generated for ${recipientEmail || 'user'}: ${code}`,
    });
  };

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.startsWith('TOPHAT-2026-')) {
      if (onRoleChange) onRoleChange('paid');
      toast({
        title: "License Upgraded!",
        description: "Your account has been upgraded to Tophat Pro Paid Tier.",
      });
      setInputKey('');
    } else {
      toast({
        title: "Invalid Key",
        description: "The access code entered is invalid or expired.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Indicator Banner */}
      <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/30 rounded-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-xl font-display uppercase tracking-widest text-deco-gold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-deco-gold" /> Account & Security Management
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs font-light">
              Current License Tier: <span className="text-deco-gold font-semibold uppercase">{currentRole}</span>
            </CardDescription>
          </div>
          {onRoleChange && (
            <div className="flex items-center gap-2">
              <Label className="text-xs font-display uppercase tracking-widest text-muted-foreground">Toggle Role:</Label>
              {(['free', 'paid', 'admin'] as UserRole[]).map(r => (
                <Button
                  key={r}
                  size="sm"
                  variant={currentRole === r ? 'default' : 'outline'}
                  onClick={() => onRoleChange(r)}
                  className={`text-xs font-display uppercase tracking-wider ${currentRole === r ? 'bg-deco-gold text-slate-950 font-semibold' : 'border-white/20 text-white'}`}
                >
                  {r}
                </Button>
              ))}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Demo Profile Mode Switcher Card */}
      <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/30 rounded-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-display uppercase tracking-widest text-deco-gold flex items-center gap-2">
              <Eye className="h-4 w-4 text-deco-gold" /> Interactive Demo Profile Mode
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Switch Tophat into Demo Profile Mode ($1.25M Multi-Asset Portfolio) to test features and demonstrate app capabilities.
            </CardDescription>
          </div>
          <Button
            onClick={() => toggleDemoMode()}
            className={`font-display uppercase tracking-wider text-xs font-semibold px-4 ${
              isDemoMode 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30' 
                : 'bg-deco-gold hover:bg-deco-brass text-slate-950 shadow-md'
            }`}
          >
            {isDemoMode ? "Exit Demo Profile" : "Activate $1.25M Demo Profile"}
          </Button>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin License Generator (Admin Only) */}
        {currentRole === 'admin' && (
          <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/30 rounded-sm">
            <CardHeader>
              <CardTitle className="text-base font-display uppercase tracking-widest text-deco-gold flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> Generate Access Key
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Issue a single-use Tophat Pro activation key for a paid user.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-display uppercase tracking-widest text-muted-foreground">Recipient Email</Label>
                  <Input
                    type="email"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="bg-slate-900 border-white/20 text-white font-sans text-xs focus:border-deco-gold"
                  />
                </div>
                <Button type="submit" className="w-full bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest text-xs font-semibold">
                  <Sparkles className="h-4 w-4 mr-2" /> Generate Key
                </Button>
              </form>

              {generatedKey && (
                <div className="mt-4 p-3 bg-slate-900 border border-deco-gold/40 rounded-sm flex items-center justify-between">
                  <span className="font-mono text-xs text-deco-gold font-bold">{generatedKey}</span>
                  <Button size="sm" variant="ghost" onClick={handleCopy} className="text-white hover:text-deco-gold">
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* User Key Redemption */}
        <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/30 rounded-sm">
          <CardHeader>
            <CardTitle className="text-base font-display uppercase tracking-widest text-deco-gold flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> Redeem Access Code
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Enter your Tophat Pro key to unlock premium Master Dashboard features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRedeem} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-display uppercase tracking-widest text-muted-foreground">Access Code</Label>
                <Input
                  type="text"
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  placeholder="TOPHAT-2026-XXXXXX"
                  className="bg-slate-900 border-white/20 text-white font-mono text-xs focus:border-deco-gold"
                />
              </div>
              <Button type="submit" variant="outline" className="w-full border-deco-gold/40 text-deco-gold hover:bg-deco-gold/10 font-display uppercase tracking-widest text-xs">
                Redeem Code
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
