import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardList, MessageSquare, ShoppingCart, Target } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Formularios() {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 overflow-x-hidden animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Formulários</h1>
            <p className="text-muted-foreground">Acesse rapidamente os formulários e acompanhe suas metas</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Registre novas vendas e acompanhe seu histórico.</p>
              <Button asChild className="bg-gradient-primary hover:opacity-90 w-full">
                <Link to="/vendas">
                  Ir para Vendas
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Abordagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Cadastre abordagens e acompanhe sua performance.</p>
              <Button asChild className="bg-gradient-primary hover:opacity-90 w-full">
                <Link to="/abordagens">
                  Ir para Abordagens
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Metas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Acompanhe suas metas semanais e mensais.</p>
              <Button asChild className="bg-gradient-primary hover:opacity-90 w-full">
                <Link to="/workboard">
                  Ir para Metas
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
