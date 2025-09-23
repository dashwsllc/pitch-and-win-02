import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { ShoppingCart, Plus, Search, DollarSign, Calendar, User, Mail, Phone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Venda {
  id: string
  nome_produto: string
  nome_comprador: string
  email_comprador: string
  whatsapp_comprador: string
  valor_venda: number
  created_at: string
}

export default function Vendas() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [totalRevenue, setTotalRevenue] = useState(0)

  const fetchVendas = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const vendasFormatadas = (data || []).map(venda => ({
        id: venda.id,
        nome_produto: venda.nome_produto,
        nome_comprador: venda.nome_comprador,
        email_comprador: venda.email_comprador,
        whatsapp_comprador: venda.whatsapp_comprador,
        valor_venda: Number(venda.valor_venda),
        created_at: venda.created_at
      }))
      
      setVendas(vendasFormatadas)
      
      // Calcular receita total
      const total = vendasFormatadas.reduce((sum, venda) => sum + venda.valor_venda, 0)
      setTotalRevenue(total)
      
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
      toast.error('Erro ao carregar vendas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendas()
  }, [user])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredVendas = vendas.filter(venda =>
    venda.nome_comprador.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venda.nome_produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venda.email_comprador.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-2 sm:px-4 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              Vendas Realizadas
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Acompanhe todas as suas vendas e performance
            </p>
          </div>
          <Button 
            onClick={() => navigate('/vendas/nova')}
            className="bg-gradient-primary hover:opacity-90 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Venda
          </Button>
        </div>

        {/* Métricas Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Vendas</p>
                  <p className="text-2xl font-bold text-foreground">{vendas.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-primary/10 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-success/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold text-foreground">
                    {vendas.length > 0 ? formatCurrency(totalRevenue / vendas.length) : formatCurrency(0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-warning/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">Buscar vendas</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Buscar por nome do cliente, produto ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Vendas */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Últimas Vendas ({filteredVendas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredVendas.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  {searchTerm ? 'Nenhuma venda encontrada' : 'Nenhuma venda cadastrada ainda'}
                </p>
                <p className="text-muted-foreground mb-6">
                  {searchTerm ? 'Tente alterar os filtros de busca' : 'Comece registrando sua primeira venda'}
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => navigate('/vendas/nova')}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Primeira Venda
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVendas.map((venda) => (
                  <div
                    key={venda.id}
                    className="p-6 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row items-start justify-between mb-4 gap-4">
                      <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row items-start gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {venda.nome_comprador}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {venda.nome_produto}
                          </Badge>
                        </div>
                        
                        <div className="grid gap-2 text-sm text-muted-foreground grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{venda.email_comprador}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{venda.whatsapp_comprador}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-2 md:col-span-1">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{formatDate(venda.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-col items-end">
                        <div className="text-base sm:text-lg md:text-2xl font-bold text-green-600 mb-1">
                          {formatCurrency(venda.valor_venda)}
                        </div>
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          <DollarSign className="w-3 h-3 mr-1" />
                          Vendido
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}