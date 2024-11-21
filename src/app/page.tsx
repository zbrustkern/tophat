import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to income planner for now
  redirect("/income")
}
