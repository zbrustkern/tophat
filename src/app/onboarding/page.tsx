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

export default function OnboardingPage() {
  const { user } = useAuth();
  
  if (!user) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>;

  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}
