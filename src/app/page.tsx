import { Button, } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Home() {
  return (
    <main>
          <div>
            <Button>Click me</Button>
            <Card>
              <CardHeader>
                <CardTitle>Titular Card Title</CardTitle>
                <CardDescription>Card Description</CardDescription>
              </CardHeader>
              <CardContent>
                <p>BIG Card Content</p>
              </CardContent>
              <CardFooter>
                <p>Last Card Footer</p>
              </CardFooter>
            </Card>
          </div>
    </main>
  );
}
