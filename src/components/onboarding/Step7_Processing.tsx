"use client"

import React, { useEffect, useState } from 'react';
import { useWizardGenerator } from '@/hooks/useWizardGenerator';
import { useRouter } from 'next/navigation';

export default function Step7Processing() {
  const { generateAndSave } = useWizardGenerator();
  const router = useRouter();
  const [status, setStatus] = useState('Analyzing your finances...');

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setStatus('Building your Master Plan...');
      try {
        await generateAndSave();
        if (mounted) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error("Failed to generate plan:", err);
        if (mounted) setStatus('Error generating plan. Please try again.');
      }
    };

    run();

    return () => { mounted = false; };
  }, [generateAndSave, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 animate-in fade-in duration-500">
      <div className="relative">
        {/* Pulsing rings */}
        <div className="absolute inset-0 rounded-full animate-ping bg-indigo-500/20 opacity-75"></div>
        <div className="absolute inset-[-10px] rounded-full animate-pulse bg-sky-500/10"></div>
        <div className="relative bg-gradient-to-tr from-indigo-600 to-sky-400 w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)]">
          <svg className="w-10 h-10 text-white animate-spin-slow" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
      
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-white">Hold Tight</h2>
        <p className="text-indigo-200 transition-all duration-300">{status}</p>
      </div>
    </div>
  );
}
