import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CommissionCardProps {
  title: string
  value: string | number
  availableAmount: number
  icon: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  loading?: boolean
}

export function CommissionCard({ 
  title, 
  value, 
  availableAmount,
  icon, 
  trend, 
  className,
  loading = false
}: CommissionCardProps) {
  if (loading) {
    return (
      <Card className={cn(
        "relative overflow-hidden border-border/50 animate-pulse",
        className
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-8 bg-muted rounded w-24"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </div>
            <div className="w-12 h-12 bg-muted rounded-xl ml-4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "relative overflow-hidden border-border/50 transition-all hover:scale-105 hover:shadow-lg",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground leading-none">
              {value}
            </p>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Disponível para saque
              </p>
              <p className="text-sm font-semibold text-success">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(availableAmount)}
              </p>
            </div>
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                <span className={trend.isPositive ? "↗" : "↘"}>
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
                <span className="text-muted-foreground">vs período anterior</span>
              </div>
            )}
          </div>
          
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary ml-4">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}