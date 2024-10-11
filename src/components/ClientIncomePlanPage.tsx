'use client';

import { useEffect, useState } from "react"
import { IncomeChart } from "@/components/IncomeChart"
import { useIncomePlan } from '@/hooks/useIncomePlan';
import { useIncomeChart } from '@/hooks/useIncomeChart';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { IncomePlan } from '@/types/chart';
import { usePlans } from '@/contexts/PlansContext';

export default function ClientIncomePlanPage({ planId }: { planId?: string }) {
    const { plans } = usePlans();
    const [plan, setPlan] = useState<IncomePlan | null>(null);
    const { loading, error, updatePlan, createPlan } = useIncomePlan();
    const { chartData, calculateChartData } = useIncomeChart();

    useEffect(() => {
        const incomePlans = plans.filter(p => p.planType === 'income') as IncomePlan[];
        if (planId && planId !== 'new') {
            const selectedPlan = incomePlans.find(p => p.id === planId);
            if (selectedPlan) {
                setPlan(selectedPlan);
            } else {
                createNewPlan();
            }
        } else if (incomePlans.length > 0) {
            setPlan(incomePlans[0]);
        } else {
            createNewPlan();
        }
    }, [plans, planId]);

    useEffect(() => {
        if (plan) {
            calculateChartData(plan);
        }
    }, [plan, calculateChartData]);

    const createNewPlan = () => {
        const newPlan: IncomePlan = {
            id: 'new',
            planName: 'New Income Plan',
            planType: 'income',
            lastUpdated: new Date(),
            details: {
                income: 0,
                raiseRate: 0,
                saveRate: 0,
                balance: 0,
                taxRate: 0,
                returnRate: 0
            }
        };
        setPlan(newPlan);
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!plan) return <p>No plan available</p>;

    const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = evt.target;
        let newValue: string | number = value;

        if (name === "raiseRate" || name === "saveRate" || name === "taxRate" || name === "returnRate") {
            newValue = parseFloat(value);
        } else if (name !== "planName") {
            newValue = Number(value);
        }

        setPlan(prev => {
            if (!prev) return null;
            if (name === "planName") {
                return { ...prev, planName: value as string };
            } else {
                return {
                    ...prev,
                    details: { ...prev.details, [name]: newValue as number }
                };
            }
        });
    };

    const handleSave = async () => {
        if (!plan) return;
        try {
            const savedPlan = plan.id === 'new' ? await createPlan(plan) : await updatePlan(plan);
            setPlan(savedPlan);
            calculateChartData(savedPlan);
            // Optionally, show a success message
        } catch (error) {
            console.error("Error saving plan:", error);
            // Optionally, show an error message
        }
    };

    const incomePlans = plans.filter(p => p.planType === 'income') as IncomePlan[];

    return (
        <main className="flex flex-col p-4">
            <select onChange={(e) => {
                const selectedPlan = incomePlans.find(p => p.id === e.target.value);
                if (selectedPlan) setPlan(selectedPlan);
            }}>
                {incomePlans.map(p => (
                    <option key={p.id} value={p.id}>{p.planName}</option>
                ))}
            </select>
            <Button onClick={createNewPlan}>Create New Plan</Button>
            <Card>
                <CardHeader>
                    <CardTitle>{plan.id === 'new' ? 'Create New Income Plan' : 'Edit Income Plan'}</CardTitle>
                    <CardDescription>Update your income plan details</CardDescription>
                </CardHeader>
                <CardContent>
                        <form className="space-y-4">
                            <div>
                                <Label htmlFor="planName">Plan Name</Label>
                                <Input
                                id="planName"
                                name="planName"
                                value={plan.planName}
                                onChange={handleChange}
                                placeholder="Enter plan name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="income">Current Annual Income ($)</Label>
                                <Input
                                id="income"
                                name="income"
                                type="number"
                                value={plan.details.income}
                                onChange={handleChange}
                                placeholder="e.g., 50000"
                                />
                            </div>
                            <div>
                                <Label htmlFor="raiseRate">Expected Annual Raise Rate (%)</Label>
                                <Input
                                id="raiseRate"
                                name="raiseRate"
                                type="number"
                                value={plan.details.raiseRate}
                                onChange={handleChange}
                                placeholder="e.g., 3"
                                step="0.1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="saveRate">Savings Rate (%)</Label>
                                <Input
                                id="saveRate"
                                name="saveRate"
                                type="number"
                                value={plan.details.saveRate}
                                onChange={handleChange}
                                placeholder="e.g., 20"
                                step="0.1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="balance">Current Savings Balance ($)</Label>
                                <Input
                                id="balance"
                                name="balance"
                                type="number"
                                value={plan.details.balance}
                                onChange={handleChange}
                                placeholder="e.g., 10000"
                                />
                            </div>
                            <div>
                                <Label htmlFor="taxRate">Estimated Tax Rate (%)</Label>
                                <Input
                                id="taxRate"
                                name="taxRate"
                                type="number"
                                value={plan.details.taxRate}
                                onChange={handleChange}
                                placeholder="e.g., 25"
                                step="0.1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="returnRate">Expected Investment Return Rate (%)</Label>
                                <Input
                                id="returnRate"
                                name="returnRate"
                                type="number"
                                value={plan.details.returnRate}
                                onChange={handleChange}
                                placeholder="e.g., 7"
                                step="0.1"
                                />
                            </div>
                            </form>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave}>{plan.id === 'new' ? 'Create Plan' : 'Update Plan'}</Button>
                </CardFooter>
            </Card>
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Income Projection</CardTitle>
                </CardHeader>
                <CardContent>
                    <IncomeChart chartData={chartData} />
                </CardContent>
            </Card>
        </main>
    );
}