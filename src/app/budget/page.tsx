"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BudgetPlaceholder() {
  const [housing, setHousing] = useState(2000);
  const [food, setFood] = useState(800);
  const [transportation, setTransportation] = useState(400);
  const [utilities, setUtilities] = useState(300);
  
  const totalExpenses = housing + food + transportation + utilities;

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Monthly Budget (Preview)</h1>
        <p className="text-muted-foreground mt-2">
          This is a foundational placeholder for the new Budgeting module. 
          It will eventually tie into your categorical spend and aggregate into the Master Dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Core Expenses</CardTitle>
            <CardDescription>Enter your baseline monthly costs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="housing">Housing (Rent/Mortgage)</Label>
              <Input 
                id="housing" 
                type="number" 
                value={housing} 
                onChange={(e) => setHousing(Number(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="food">Food & Dining</Label>
              <Input 
                id="food" 
                type="number" 
                value={food} 
                onChange={(e) => setFood(Number(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transportation">Transportation</Label>
              <Input 
                id="transportation" 
                type="number" 
                value={transportation} 
                onChange={(e) => setTransportation(Number(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utilities">Utilities & Bills</Label>
              <Input 
                id="utilities" 
                type="number" 
                value={utilities} 
                onChange={(e) => setUtilities(Number(e.target.value))} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle>Budget Summary</CardTitle>
            <CardDescription>Your total estimated monthly outflow.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <h2 className="text-5xl font-bold text-primary">
                ${totalExpenses.toLocaleString()}
              </h2>
              <p className="text-muted-foreground text-sm uppercase tracking-wider">Total Monthly Expenses</p>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-center text-muted-foreground">
                In the next iteration, this will automatically link to the Master Dashboard to calculate your true net cash flow alongside your income and savings plans.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
