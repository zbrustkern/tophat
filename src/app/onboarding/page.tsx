"use client"

import React, { useEffect, useState } from 'react';
import { WizardProvider, useWizard } from '@/components/onboarding/WizardProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Step1Welcome from '@/components/onboarding/Step1_Welcome';
import Step2Income from '@/components/onboarding/Step2_Income';
import Step3Assets from '@/components/onboarding/Step3_Assets';
import Step4Debts from '@/components/onboarding/Step4_Debts';
import Step5Budget from '@/components/onboarding/Step5_Budget';
import Step6Goals from '@/components/onboarding/Step6_Goals';
import Step7Processing from '@/components/onboarding/Step7_Processing';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

function WizardContent() {
  const { state } = useWizard();
  const router = useRouter();

  const steps = [
    <Step1Welcome key="1" />,
    <Step2Income key="2" />,
    <Step3Assets key="3" />,
    <Step4Debts key="4" />,
    <Step5Budget key="5" />,
    <Step6Goals key="6" />,
    <Step7Processing key="7" />
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col items-center justify-center p-4">
      {/* Absolute Exit Button */}
      <div className="absolute top-6 right-6">
        <Button variant="ghost" className="text-white/70 hover:text-white" onClick={() => router.push('/')}>
          Exit Setup
        </Button>
      </div>

      <div className="w-full max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {steps[state.currentStep - 1]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      <div className="fixed bottom-10 flex gap-2">
        {steps.map((_, i) => (
          <div 
            key={i} 
            className={`h-2 rounded-full transition-all duration-300 ${i + 1 === state.currentStep ? 'w-8 bg-indigo-500' : 'w-2 bg-white/20'}`} 
          />
        ))}
      </div>
    </div>
  );
}

import SignInButton from '@/components/SignInButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Sparkles, TrendingUp, Wallet } from 'lucide-react';

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const [guestMode, setGuestMode] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 bg-deco-pattern">
        <div className="flex items-center gap-3 text-deco-gold font-display uppercase tracking-widest text-lg animate-pulse">
          <Sparkles className="h-6 w-6" /> Loading Tophat Financial...
        </div>
      </div>
    );
  }

  if (!user && !guestMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-foreground flex flex-col items-center justify-center p-6 bg-deco-pattern relative overflow-hidden">
        <div className="w-full max-w-2xl text-center space-y-8 z-10">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center gap-3">
            <img
              src="/tophat_logo.png"
              width={140}
              height={140}
              alt="Tophat Logo"
              className="drop-shadow-[0_0_20px_rgba(212,175,55,0.3)] mb-2"
            />
            <h1 className="text-4xl md:text-5xl font-display font-semibold uppercase tracking-widest text-deco-gold">
              Tophat Financial
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto font-light">
              Tailored Wealth Engineering & Holistic Financial Planning
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left my-6">
            <Card className="bg-card/40 border-white/10 backdrop-blur-md">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs text-deco-gold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Single Master Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                Aggregate portfolios, debts, real estate, and goals into one holistic plan.
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-white/10 backdrop-blur-md">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs text-deco-gold flex items-center gap-2">
                  <Wallet className="h-4 w-4" /> Float Maximization
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                Optimize credit card grace periods to earn passive HYSA interest on operating cash.
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-white/10 backdrop-blur-md">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs text-deco-gold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Granular Holdings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                Model ticker-level risk tiers across 401(k)s, IRAs, and speculative accounts.
              </CardContent>
            </Card>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <SignInButton variant="hero" />
            <Button
              variant="outline"
              onClick={() => setGuestMode(true)}
              className="border-white/20 hover:border-deco-gold/50 text-muted-foreground hover:text-foreground font-display uppercase tracking-wider text-xs px-6 py-6"
            >
              Continue as Guest
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60 pt-4">
            Sign in to sync your plans seamlessly across devices via secure Firebase Authentication.
          </p>
        </div>
      </div>
    );
  }

  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}
