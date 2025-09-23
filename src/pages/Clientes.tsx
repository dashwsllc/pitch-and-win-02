import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Users, UserPlus, Check, X, Plus, ShoppingBag } from "lucide-react"

interface Assinatura {
  id: string
  nome_produto: string
  valor_assinatura: string
  nome_cliente: string
  whatsapp_cliente: string
  email_cliente: string
  status: 'ativa' | 'inativa'
  created_at: string
}

interface VendaCliente {
  id: string
  nome_produto: string
  nome_comprador: string
  email_comprador: string
  whatsapp_comprador: string
  created_at: string
  valor_venda: string
  na_area_membros: boolean
}

export default function Clientes() {
  const { user } = useAuth()
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [vendasClientes, setVendasClientes] = useState<VendaCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Formulário
  const [nomeProduto, setNomeProduto] = useState("")
  const [valorAssinatura, setValorAssinatura] = useState("")
  const [nomeCliente, setNomeCliente] = useState("")
  const [whatsappCliente, setWhatsappCliente] = useState("")
  const [emailCliente, setEmailCliente] = useState("")

  const valorAssinaturas = [
    "R$ 37,90/m",
    "R$ 27,90/m", 
    "R$ 47,90/m"
  ]

  const produtosAssinatura = [
    "Mentoria Jogador de Elite",
    "Mentoria Jogador Milionário"
  ]

  // Carregar assinaturas e vendas
  const fetchAssinaturas = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('assinaturas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAssinaturas((data || []) as Assinatura[])
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error)
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  const fetchVendasClientes = async () => {
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
        created_at: venda.created_at,
        valor_venda: String(venda.valor_venda),
        na_area_membros: false // Default to false since column doesn't exist yet
      }))
      
      setVendasClientes(vendasFormatadas)
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
      toast.error('Erro ao carregar vendas')
    }
  }

  useEffect(() => {
    fetchAssinaturas()
    fetchVendasClientes()
  }, [user])

  // Cadastrar nova assinatura
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!nomeProduto || !valorAssinatura || !nomeCliente || !whatsappCliente || !emailCliente) {
      toast.error('Todos os campos são obrigatórios')
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase
        .from('assinaturas')
        .insert({
          user_id: user.id,
          nome_produto: nomeProduto,
          valor_assinatura: valorAssinatura,
          nome_cliente: nomeCliente,
          whatsapp_cliente: whatsappCliente,
          email_cliente: emailCliente,
          status: 'ativa'
        })

      if (error) throw error

      toast.success('Cliente cadastrado com sucesso!')
      
      // Limpar formulário
      setNomeProduto("")
      setValorAssinatura("")
      setNomeCliente("")
      setWhatsappCliente("")
      setEmailCliente("")
      
      // Recarregar lista
      fetchAssinaturas()
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error)
      toast.error('Erro ao cadastrar cliente')
    } finally {
      setSaving(false)
    }
  }

  // Alterar status da assinatura
  const toggleStatus = async (id: string, novoStatus: 'ativa' | 'inativa') => {
    try {
      const { error } = await supabase
        .from('assinaturas')
        .update({ status: novoStatus })
        .eq('id', id)

      if (error) throw error

      toast.success(`Assinatura ${novoStatus === 'ativa' ? 'ativada' : 'desativada'} com sucesso!`)
      fetchAssinaturas()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status da assinatura')
    }
  }

  // Alterar status de área de membros da venda - simulado localmente
  const toggleAreaMembros = async (id: string, novoStatus: boolean) => {
    try {
      // Como a coluna ainda não existe no banco, vamos atualizar apenas localmente
      setVendasClientes(prevVendas => 
        prevVendas.map(venda => 
          venda.id === id 
            ? { ...venda, na_area_membros: novoStatus }
            : venda
        )
      )

      toast.success(`Cliente ${novoStatus ? 'adicionado à' : 'removido da'} área de membros!`)
      
      // TODO: Quando a coluna na_area_membros for adicionada ao banco, descomente:
      // const { error } = await supabase
      //   .from('vendas')
      //   .update({ na_area_membros: novoStatus })
      //   .eq('id', id)
      // if (error) throw error
      
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status da área de membros')
    }
  }

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
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Clientes de Assinatura
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus clientes de assinatura mensal
          </p>
        </div>

        {/* Formulário de Cadastro */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Cadastrar Nova Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome-produto">Nome do Produto Vendido</Label>
                  <Select value={nomeProduto} onValueChange={setNomeProduto}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtosAssinatura.map((produto) => (
                        <SelectItem key={produto} value={produto}>
                          {produto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor-assinatura">Valor da Assinatura</Label>
                  <Select value={valorAssinatura} onValueChange={setValorAssinatura}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o valor" />
                    </SelectTrigger>
                    <SelectContent>
                      {valorAssinaturas.map((valor) => (
                        <SelectItem key={valor} value={valor}>
                          {valor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="nome-cliente">Nome do Cliente</Label>
                  <Input
                    id="nome-cliente"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp-cliente">WhatsApp</Label>
                  <Input
                    id="whatsapp-cliente"
                    value={whatsappCliente}
                    onChange={(e) => setWhatsappCliente(e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-cliente">Email</Label>
                  <Input
                    id="email-cliente"
                    type="email"
                    value={emailCliente}
                    onChange={(e) => setEmailCliente(e.target.value)}
                    placeholder="cliente@email.com"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={saving}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                {saving ? 'Cadastrando...' : 'Cadastrar Cliente'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Vendas - Clientes que Compraram */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Todos os Clientes ({vendasClientes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendasClientes.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma venda cadastrada ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {vendasClientes.map((venda) => (
                  <div
                    key={venda.id}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {venda.na_area_membros ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                          <h3 className="font-semibold text-foreground">
                            {venda.nome_comprador}
                          </h3>
                        </div>
                        <Badge 
                          variant={venda.na_area_membros ? 'default' : 'secondary'}
                        >
                          {venda.na_area_membros ? 'Na Área de Membros' : 'Fora da Área'}
                        </Badge>
                      </div>
                      
                      <div className="grid gap-1 text-sm text-muted-foreground md:grid-cols-3">
                        <span><strong>Produto:</strong> {venda.nome_produto}</span>
                        <span><strong>Email:</strong> {venda.email_comprador}</span>
                        <span><strong>WhatsApp:</strong> {venda.whatsapp_comprador}</span>
                      </div>
                      
                      <div className="mt-1 text-sm text-muted-foreground">
                        <strong>Data da Venda:</strong> {new Date(venda.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Label htmlFor={`area-${venda.id}`} className="text-sm">
                        Área de Membros
                      </Label>
                      <Switch
                        id={`area-${venda.id}`}
                        checked={venda.na_area_membros}
                        onCheckedChange={(checked) => 
                          toggleAreaMembros(venda.id, checked)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Assinaturas */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Users className="w-5 h-5" />
              Lista de Assinaturas ({assinaturas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assinaturas.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma assinatura cadastrada ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assinaturas.map((assinatura) => (
                  <div
                    key={assinatura.id}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {assinatura.status === 'ativa' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                          <h3 className="font-semibold text-foreground">
                            {assinatura.nome_cliente}
                          </h3>
                        </div>
                        <Badge 
                          variant={assinatura.status === 'ativa' ? 'default' : 'destructive'}
                        >
                          {assinatura.status === 'ativa' ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      
                      <div className="grid gap-1 text-sm text-muted-foreground md:grid-cols-3">
                        <span><strong>Produto:</strong> {assinatura.nome_produto}</span>
                        <span><strong>Valor:</strong> {assinatura.valor_assinatura}</span>
                        <span><strong>WhatsApp:</strong> {assinatura.whatsapp_cliente}</span>
                      </div>
                      
                      <div className="mt-1 text-sm text-muted-foreground">
                        <strong>Email:</strong> {assinatura.email_cliente}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Label htmlFor={`status-${assinatura.id}`} className="text-sm">
                        {assinatura.status === 'ativa' ? 'Ativa' : 'Inativa'}
                      </Label>
                      <Switch
                        id={`status-${assinatura.id}`}
                        checked={assinatura.status === 'ativa'}
                        onCheckedChange={(checked) => 
                          toggleStatus(assinatura.id, checked ? 'ativa' : 'inativa')
                        }
                      />
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