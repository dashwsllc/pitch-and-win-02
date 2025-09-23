import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, MessageSquare, ShoppingCart } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={() => navigate('/abordagens?new=true')}
          className="w-full justify-start gap-3 bg-gradient-primary hover:bg-primary-hover text-white"
        >
          <MessageSquare className="w-5 h-5" />
          Nova Abordagem
        </Button>
        
        <Button 
          onClick={() => navigate('/vendas?new=true')}
          className="w-full justify-start gap-3 bg-gradient-success hover:opacity-90"
        >
          <ShoppingCart className="w-5 h-5" />
          Registrar Venda
        </Button>
        
        <Button 
          onClick={() => navigate('/ranking')}
          variant="outline"
          className="w-full justify-start gap-3 border-primary/20 hover:bg-primary/10"
        >
          <Plus className="w-5 h-5" />
          Ver Ranking
        </Button>
      </CardContent>
    </Card>
  )
}