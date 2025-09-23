import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Target, 
  TrendingUp,
  Calendar,
  CheckCircle
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export default function WorkBoard() {
  const { user } = useAuth()
  const [weeklyCount, setWeeklyCount] = useState(0)
  const [monthlyCount, setMonthlyCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Metas
  const WEEKLY_GOAL = 5
  const MONTHLY_GOAL = 20

  useEffect(() => {
    if (user) {
      fetchSalesData()
    }
  }, [user])

  const fetchSalesData = async () => {
    if (!user) return
    
    try {
      const now = new Date()
      
      // Início da semana (domingo)
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      
      // Início do mês
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      // Buscar vendas da semana
      const { data: weeklyData } = await supabase
        .from('vendas')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', startOfWeek.toISOString())

      // Buscar vendas do mês  
      const { data: monthlyData } = await supabase
        .from('vendas')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())

      setWeeklyCount(weeklyData?.length || 0)
      setMonthlyCount(monthlyData?.length || 0)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const weeklyProgress = Math.min((weeklyCount / WEEKLY_GOAL) * 100, 100)
  const monthlyProgress = Math.min((monthlyCount / MONTHLY_GOAL) * 100, 100)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded mb-6"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">WorkBoard</h1>
            <p className="text-muted-foreground">
              Acompanhe seu progresso e alcance suas metas de vendas
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Meta Semanal */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Meta Semanal
                </CardTitle>
                <Badge variant={weeklyProgress >= 100 ? "default" : "secondary"}>
                  Esta semana
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-semibold">
                  {weeklyCount}/{WEEKLY_GOAL} vendas
                </span>
              </div>
              
              <Progress value={weeklyProgress} className="h-3" />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {weeklyProgress.toFixed(0)}% concluído
                </span>
                {weeklyProgress >= 100 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Meta alcançada!</span>
                  </div>
                )}
              </div>

              {weeklyProgress < 100 && (
                <div className="text-xs text-muted-foreground">
                  Faltam {WEEKLY_GOAL - weeklyCount} vendas para atingir a meta
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meta Mensal */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Meta Mensal
                </CardTitle>
                <Badge variant={monthlyProgress >= 100 ? "default" : "secondary"}>
                  Este mês
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-semibold">
                  {monthlyCount}/{MONTHLY_GOAL} vendas
                </span>
              </div>
              
              <Progress value={monthlyProgress} className="h-3" />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {monthlyProgress.toFixed(0)}% concluído
                </span>
                {monthlyProgress >= 100 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Meta alcançada!</span>
                  </div>
                )}
              </div>

              {monthlyProgress < 100 && (
                <div className="text-xs text-muted-foreground">
                  Faltam {MONTHLY_GOAL - monthlyCount} vendas para atingir a meta
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Resumo de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">{weeklyCount}</div>
                <div className="text-sm text-muted-foreground">Vendas esta semana</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">{monthlyCount}</div>
                <div className="text-sm text-muted-foreground">Vendas este mês</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground text-center">
                {weeklyProgress >= 100 && monthlyProgress >= 100 
                  ? "🎉 Parabéns! Você alcançou ambas as metas!"
                  : weeklyProgress >= 100
                  ? "✨ Meta semanal concluída! Continue assim para atingir a meta mensal."
                  : "💪 Continue trabalhando duro para alcançar suas metas!"
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}