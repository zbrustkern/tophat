"use client"

import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlobalSettings } from '@/types/chart';

export default function SettingsPage() {
  const { settings, loading, error, updateSettings } = useSettings();
  const [formData, setFormData] = useState<GlobalSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings && !formData) {
      setFormData(settings);
    }
  }, [settings, formData]);

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    try {
      await updateSettings(formData);
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
    setIsSaving(false);
  };

  if (loading || !formData) {
    return <main className="max-w-4xl mx-auto p-4"><p>Loading settings...</p></main>;
  }

  if (error) {
    return <main className="max-w-4xl mx-auto p-4"><p className="text-red-500">{error}</p></main>;
  }

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Global Settings</h1>
          <p className="text-muted-foreground mt-2">
            Set your default financial assumptions here. These will be inherited by all your new plans, 
            but you can override them on a per-plan basis.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Economic Assumptions</CardTitle>
            <CardDescription>Default rates for markets and taxes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Effective Tax Rate (%)</Label>
              <Input 
                id="taxRate" 
                type="number" 
                step="0.1"
                value={formData.taxRate * 100} 
                onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) / 100 })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="returnRate">Expected Portfolio Return (%)</Label>
              <Input 
                id="returnRate" 
                type="number" 
                step="0.1"
                value={formData.returnRate * 100} 
                onChange={(e) => setFormData({ ...formData, returnRate: Number(e.target.value) / 100 })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inflationRate">Inflation Rate (%)</Label>
              <Input 
                id="inflationRate" 
                type="number" 
                step="0.1"
                value={formData.inflationRate * 100} 
                onChange={(e) => setFormData({ ...formData, inflationRate: Number(e.target.value) / 100 })} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retirement Assumptions</CardTitle>
            <CardDescription>Default age and withdrawal rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentAge">Current Age</Label>
              <Input 
                id="currentAge" 
                type="number" 
                value={formData.currentAge} 
                onChange={(e) => setFormData({ ...formData, currentAge: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retirementAge">Target Retirement Age</Label>
              <Input 
                id="retirementAge" 
                type="number" 
                value={formData.retirementAge} 
                onChange={(e) => setFormData({ ...formData, retirementAge: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawalRate">Safe Withdrawal Rate (%)</Label>
              <Input 
                id="withdrawalRate" 
                type="number" 
                step="0.1"
                value={formData.withdrawalRate * 100} 
                onChange={(e) => setFormData({ ...formData, withdrawalRate: Number(e.target.value) / 100 })} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
