"use client"

import { useState } from "react"
import { IncomeChart } from "@/components/IncomeChart"
import { Button, } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Home() {
  
  const newForm = {
    income: 100000,
    raise: .03,
    saveRate: .20,
    balance: 100000,
    taxRate: .45,
    return: .08,
}

    const [formData, setFormData] = useState(newForm)
    const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        if ((evt.target.name === "raise") || (evt.target.name === "saveRate") || (evt.target.name === "taxRate") || (evt.target.name === "return")) {
            setFormData({...formData, [evt.target.name]: parseFloat(evt.target.value) * 0.01 })
        }
        else {
        setFormData({...formData, [evt.target.name]: evt.target.value })
        }
        console.log(formData)
    }

    return (
      <main>
            <div className="mb-4 max-w-96">
              <Card>
                <CardHeader className="flex gap-3">
                  <CardTitle>Savings Planner</CardTitle>
                  <CardDescription>How much passive income are you set to earn?</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p>Enter your details here...</p>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="income">Income in $/year</Label>
                      <Input
                        required
                        type="number"
                        name="income"
                        placeholder="100,000"
                        onChange={handleChange}
                        />
                    </div>

                    <p><Button>Show me my $$</Button></p>
                    <IncomeChart />
                </CardContent>
                <CardFooter>
                  <div className="flex w-100 justify-between">
                  <p>Last Card Footer</p>
                  </div>
                </CardFooter>
              </Card>
            </div>
      </main>
  );
}
