import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { cn } from "@/lib/utils"
  
  interface CardWrapperProps extends React.ComponentProps<typeof Card> {
    title?: string
    description?: string
    headerClassName?: string
    contentClassName?: string
    footerClassName?: string
    children?: React.ReactNode
    footer?: React.ReactNode
  }
  
  export function CardWrapper({
    title,
    description,
    headerClassName,
    contentClassName,
    footerClassName,
    children,
    footer,
    className,
    ...props
  }: CardWrapperProps) {
    return (
      <Card 
        className={cn(
          "bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-none",
          className
        )} 
        {...props}
      >
        {(title || description) && (
          <CardHeader className={cn("space-y-1 pb-4", headerClassName)}>
            {title && (
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-gray-500 font-medium">
                {description}
              </CardDescription>
            )}
          </CardHeader>
        )}
        <CardContent className={cn("bg-gray-50/50", contentClassName)}>
          {children}
        </CardContent>
        {footer && (
          <CardFooter className={cn("bg-white border-t", footerClassName)}>
            {footer}
          </CardFooter>
        )}
      </Card>
    )
  }