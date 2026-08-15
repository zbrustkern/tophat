"use client";

import React from 'react';
import { usePlans } from '@/contexts/PlansContext';
import { Sparkles, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DemoBanner() {
  const { isDemoMode, toggleDemoMode } = usePlans();

  if (!isDemoMode) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600/90 via-deco-gold/90 to-amber-600/90 border-b border-deco-gold/40 text-slate-950 px-4 py-2 text-xs font-display flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg z-40 sticky top-0">
      <div className="flex items-center gap-2 font-semibold tracking-wider uppercase">
        <Sparkles className="h-4 w-4 shrink-0 text-slate-950 animate-pulse" />
        <span>Interactive Demo Profile Active — Simulating $1.25M Multi-Asset Portfolio (Alex & Sam)</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            toggleDemoMode(false);
            window.location.reload();
          }}
          className="h-6 text-[10px] bg-slate-950 text-deco-gold border-slate-950 hover:bg-slate-900 font-display uppercase tracking-widest font-bold px-2.5"
        >
          <X className="h-3 w-3 mr-1" /> Exit Demo Profile
        </Button>
      </div>
    </div>
  );
}
