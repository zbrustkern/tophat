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
    raiseRate: .03,
    saveRate: .20,
    balance: 100000,
    taxRate: .45,
    returnRate: .08,
}

const defaultIncome = {

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
    const handleClick = () => {

    }

    return (
      <main className="flex flex-col">
        <div className="mb-4 mr-4">
          <Card>
            <CardHeader className="flex gap-3">
              <CardTitle>Savings Planner</CardTitle>
              <CardDescription>How are you preparing currently?</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p>Enter your details here...</p>
              <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
              <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
                <Label htmlFor="income">Income in $/year</Label>
                <Input
                  required
                  type="number"
                  name="income"
                  placeholder="100,000"
                  onChange={handleChange}
                  />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
                <Label htmlFor="income">Starting Balance $</Label>
                <Input
                  required
                  type="number"
                  name="balance"
                  placeholder="25,000"
                  onChange={handleChange}
                  />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
                <Label htmlFor="income">Estimated Long Term Average Portfolio Return (%)</Label>
                <Input
                  required
                  type="number"
                  name="returnRate"
                  placeholder="8%"
                  onChange={handleChange}
                  />
              </div>
              </div>
              <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="income">Estimated Annual Raise (%)</Label>
                <Input
                  required
                  type="number"
                  name="raiseRate"
                  placeholder="3%"
                  onChange={handleChange}
                  />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="income">Annual Savings Rate (%)</Label>
                <Input
                  required
                  type="number"
                  name="saveRate"
                  placeholder="20%"
                  onChange={handleChange}
                  />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="income">Blended Total Tax Rate (%)</Label>
                <Input
                  required
                  type="number"
                  name="balance"
                  placeholder="40%"
                  onChange={handleChange}
                  />
              </div>
              </div>
              <p><Button onClick={handleClick}>Show me my $$</Button></p>
            </CardContent>
            <CardFooter>
              <div className="flex w-100 justify-between">
              <p>Last Card Footer</p>
              </div>
            </CardFooter>
          </Card>
        </div>
        <div className="mb-4 mr-4">
        <Card>
            <CardHeader className="flex gap-3">
              <CardTitle>Income Expectations</CardTitle>
              <CardDescription>How much passive income are you set to earn?</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
        <IncomeChart />
        </CardContent>
            <CardFooter>
              <div className="flex w-100 justify-between">
              <p>Income and Balance by Year</p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
  );
}
