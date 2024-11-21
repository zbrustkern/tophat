"use client"

import Link from "next/link"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Home() {
  return (
    <main className="flex flex-col p-4">
      <h1 className="text-3xl font-bold">Welcome to Tophat Financial</h1>
      <p className="mt-4">Choose a planning tool from the sidebar to get started:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Link href="/income">
          <Card>
            <CardHeader>
              <CardTitle>Income Planner</CardTitle>
              <CardDescription>Plan your income and savings strategy</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/savings">
          <Card>
            <CardHeader>
              <CardTitle>Savings Planner</CardTitle>
              <CardDescription>Calculate your retirement savings needs</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </main>
  )
}