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
import { MessageSquare, Plus, Search, Clock, Users, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Abordagem {
  id: string
  nomes_abordados: string
  dados_abordados: string
  tempo_medio_abordagem: number
  mostrou_ia: boolean
  visao_geral: string
  created_at: string
}

export default function Abordagens() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [abordagens, setAbordagens] = useState<Abordagem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [totalAbordagens, setTotalAbordagens] = useState(0)
  const [tempoMedioTotal, setTempoMedioTotal] = useState(0)

  const fetchAbordagens = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('abordagens')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const abordagensFormatadas = (data || []).map(abordagem => ({
        id: abordagem.id,
        nomes_abordados: abordagem.nomes_abordados,
        dados_abordados: abordagem.dados_abordados,
        tempo_medio_abordagem: abordagem.tempo_medio_abordagem,
        mostrou_ia: abordagem.mostrou_ia,
        visao_geral: abordagem.visao_geral,
        created_at: abordagem.created_at
      }))
      
      setAbordagens(abordagensFormatadas)
      setTotalAbordagens(abordagensFormatadas.length)
      
      // Calcular tempo médio total
      if (abordagensFormatadas.length > 0) {
        const tempoTotal = abordagensFormatadas.reduce((sum, abordagem) => sum + abordagem.tempo_medio_abordagem, 0)
        setTempoMedioTotal(Math.round(tempoTotal / abordagensFormatadas.length))
      }
      
    } catch (error) {
      console.error('Erro ao carregar abordagens:', error)
      toast.error('Erro ao carregar abordagens')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAbordagens()
  }, [user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredAbordagens = abordagens.filter(abordagem =>
    abordagem.nomes_abordados.toLowerCase().includes(searchTerm.toLowerCase()) ||
    abordagem.visao_geral.toLowerCase().includes(searchTerm.toLowerCase()) ||
    abordagem.dados_abordados.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const abordagensComIA = abordagens.filter(a => a.mostrou_ia).length

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
      <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 overflow-x-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              Abordagens Realizadas
            </h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe todas as suas abordagens comerciais e performance
            </p>
          </div>
          <Button 
            onClick={() => navigate('/abordagens/nova')}
            className="bg-gradient-primary hover:opacity-90"
          >
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Nova Abordagem</span>
          </Button>
        </div>

        {/* Métricas Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Abordagens</p>
                  <p className="text-2xl font-bold text-foreground">{totalAbordagens}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tempo Médio</p>
                  <p className="text-2xl font-bold text-foreground">{tempoMedioTotal} min</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mostraram IA</p>
                  <p className="text-2xl font-bold text-foreground">{abordagensComIA}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-success/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taxa IA</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalAbordagens > 0 ? Math.round((abordagensComIA / totalAbordagens) * 100) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-accent/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
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
                <Label htmlFor="search" className="sr-only">Buscar abordagens</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Buscar por nome dos abordados, visão geral ou dados..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Abordagens */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Últimas Abordagens ({filteredAbordagens.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAbordagens.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  {searchTerm ? 'Nenhuma abordagem encontrada' : 'Nenhuma abordagem cadastrada ainda'}
                </p>
                <p className="text-muted-foreground mb-6">
                  {searchTerm ? 'Tente alterar os filtros de busca' : 'Comece registrando sua primeira abordagem'}
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => navigate('/abordagens/nova')}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Primeira Abordagem
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAbordagens.map((abordagem) => (
                  <div
                    key={abordagem.id}
                    className="p-6 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-foreground">
                            {abordagem.nomes_abordados}
                          </h3>
                          <Badge 
                            variant={abordagem.mostrou_ia ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {abordagem.mostrou_ia ? (
                              <><CheckCircle className="w-3 h-3 mr-1" />Mostrou IA</>
                            ) : (
                              <><XCircle className="w-3 h-3 mr-1" />Não mostrou IA</>
                            )}
                          </Badge>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Visão Geral:</strong>
                          </p>
                          <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md">
                            {abordagem.visao_geral}
                          </p>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Dados dos Abordados:</strong>
                          </p>
                          <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md">
                            {abordagem.dados_abordados}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{abordagem.tempo_medio_abordagem} min</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(abordagem.created_at)}</span>
                          </div>
                        </div>
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