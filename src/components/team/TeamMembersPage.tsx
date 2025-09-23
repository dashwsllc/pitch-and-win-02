import { useState, useEffect } from "react"
import { Plus, Crown, Star, Edit, Trash2, Save, X, History, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface TeamMember {
  id: string
  name: string
  position: string
  date_added: string
  status: string
  custom_tags: string[]
  status_reason?: string
}

interface HistoryRecord {
  id: string
  action_type: string
  old_values: any
  new_values: any
  reason?: string
  created_at: string
}

interface CustomPosition {
  id: string
  name: string
  max_members: number
}

const POSITION_LIMITS = {
  "Co-Founders": 2,
  "Executive": 2,
  "Seller": 4,
  "Operator": 4
}

const POSITIONS = Object.keys(POSITION_LIMITS)

export function TeamMembersPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [customPositions, setCustomPositions] = useState<CustomPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showPositionDialog, setShowPositionDialog] = useState(false)
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [newMember, setNewMember] = useState({ name: "", position: "", date_added: "", status: "Ativo" })
  const [newPosition, setNewPosition] = useState({ name: "", max_members: 1 })
  const [historyPage, setHistoryPage] = useState(1)
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [statusUpdate, setStatusUpdate] = useState({ status: "", reason: "" })
  const { toast } = useToast()

  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    fetchMembers()
    fetchHistory()
    fetchCustomPositions()
  }, [])

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('position', { ascending: true })
        .order('date_added', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar membros da equipe",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('team_member_history')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setHistory(data || [])
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  const fetchCustomPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_positions')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setCustomPositions(data || [])
    } catch (error) {
      console.error('Error fetching custom positions:', error)
    }
  }

  const addToHistory = async (memberId: string, actionType: string, oldValues: any, newValues: any, reason?: string) => {
    try {
      await supabase
        .from('team_member_history')
        .insert([{
          member_id: memberId,
          action_type: actionType,
          old_values: oldValues,
          new_values: newValues,
          reason: reason
        }])
    } catch (error) {
      console.error('Error adding to history:', error)
    }
  }

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.position) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    const allPositions = { ...POSITION_LIMITS }
    customPositions.forEach(pos => {
      allPositions[pos.name] = pos.max_members
    })

    const positionCount = members.filter(m => m.position === newMember.position).length
    if (positionCount >= allPositions[newMember.position as keyof typeof allPositions]) {
      toast({
        title: "Erro",
        description: `Limite de vagas para ${newMember.position} atingido`,
        variant: "destructive"
      })
      return
    }

    try {
      const memberData = {
        name: newMember.name,
        position: newMember.position,
        date_added: newMember.date_added || new Date().toISOString(),
        status: "Ativo",
        custom_tags: ["Ativo"]
      }

      const { data, error } = await supabase
        .from('team_members')
        .insert([memberData])
        .select()
        .single()

      if (error) throw error

      await addToHistory(data.id, 'created', null, memberData)

      toast({
        title: "Sucesso",
        description: "Membro adicionado com sucesso"
      })
      
      setNewMember({ name: "", position: "", date_added: "", status: "Ativo" })
      setShowAddDialog(false)
      fetchMembers()
      fetchHistory()
    } catch (error) {
      console.error('Error adding member:', error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar membro",
        variant: "destructive"
      })
    }
  }

  const handleAddPosition = async () => {
    if (!newPosition.name || newPosition.max_members < 1) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos corretamente",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from('custom_positions')
        .insert([newPosition])

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Cargo criado com sucesso"
      })
      
      setNewPosition({ name: "", max_members: 1 })
      setShowPositionDialog(false)
      fetchCustomPositions()
    } catch (error) {
      console.error('Error adding position:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar cargo",
        variant: "destructive"
      })
    }
  }

  const handleUpdateMember = async (id: string, updates: Partial<TeamMember>) => {
    try {
      const oldMember = members.find(m => m.id === id)
      
      const { error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await addToHistory(id, 'updated', oldMember, updates)

      toast({
        title: "Sucesso",
        description: "Membro atualizado com sucesso"
      })
      
      setEditingMember(null)
      fetchMembers()
      fetchHistory()
    } catch (error) {
      console.error('Error updating member:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar membro",
        variant: "destructive"
      })
    }
  }

  const handleStatusUpdate = async (id: string) => {
    if (!statusUpdate.status) {
      toast({
        title: "Erro",
        description: "Selecione um status",
        variant: "destructive"
      })
      return
    }

    if ((statusUpdate.status === "Inativo" || statusUpdate.status === "Desligado") && !statusUpdate.reason) {
      toast({
        title: "Erro",
        description: "Motivo é obrigatório para status Inativo ou Desligado",
        variant: "destructive"
      })
      return
    }

    try {
      const oldMember = members.find(m => m.id === id)
      const updates = { 
        status: statusUpdate.status, 
        status_reason: statusUpdate.reason || null 
      }
      
      const { error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await addToHistory(id, 'status_changed', oldMember, updates, statusUpdate.reason)

      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso"
      })
      
      setEditingStatus(null)
      setStatusUpdate({ status: "", reason: "" })
      fetchMembers()
      fetchHistory()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive"
      })
    }
  }

  const handleDeleteMember = async (id: string) => {
    try {
      const oldMember = members.find(m => m.id === id)
      
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id)

      if (error) throw error

      await addToHistory(id, 'deleted', oldMember, null)

      toast({
        title: "Sucesso",
        description: "Membro removido com sucesso"
      })
      
      fetchMembers()
      fetchHistory()
    } catch (error) {
      console.error('Error deleting member:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover membro",
        variant: "destructive"
      })
    }
  }

  const getPositionIcon = (name: string) => {
    if (name === "Sinclair") return <Crown className="w-3 h-3 text-amber-500" />
    if (name === "Willer") return <Star className="w-3 h-3 text-blue-500" />
    return null
  }

  const getTags = (member: TeamMember) => {
    const tags = [...(member.custom_tags || [])]
    
    // Remove tag de status se já existe
    const statusTags = ["Ativo", "Inativo", "Desligado"]
    const filteredTags = tags.filter(tag => !statusTags.includes(tag))
    
    // Adiciona o status atual
    if (member.status) {
      filteredTags.push(member.status)
    }
    
    return filteredTags
  }

  const getTagVariant = (tag: string) => {
    switch (tag) {
      case "Ativo": return "default"
      case "Inativo": return "secondary" 
      case "Desligado": return "destructive"
      case "Co-Founder": return "default"
      case "Dev": return "secondary"
      case "Expert": return "outline"
      default: return "outline"
    }
  }

  const allPositions = [...POSITIONS, ...customPositions.map(p => p.name)]
  const groupedMembers = allPositions.reduce((acc, position) => {
    acc[position] = members.filter(member => member.position === position)
    return acc
  }, {} as Record<string, TeamMember[]>)

  const getAvailableSlots = (position: string) => {
    const currentCount = groupedMembers[position]?.length || 0
    const defaultLimit = POSITION_LIMITS[position as keyof typeof POSITION_LIMITS]
    const customLimit = customPositions.find(p => p.name === position)?.max_members
    const limit = customLimit || defaultLimit || 1
    return limit - currentCount
  }

  const paginatedHistory = history.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE)
  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE)

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Listagem de Membros</h1>
          <p className="text-muted-foreground">Gerencie os membros da equipe</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Cargo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Cargo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="positionName">Nome do Cargo</Label>
                  <Input
                    id="positionName"
                    value={newPosition.name}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome do cargo"
                  />
                </div>
                <div>
                  <Label htmlFor="maxMembers">Número Máximo de Membros</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    min="1"
                    value={newPosition.max_members}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, max_members: parseInt(e.target.value) || 1 }))}
                    placeholder="1"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddPosition} className="flex-1">
                    Criar Cargo
                  </Button>
                  <Button variant="outline" onClick={() => setShowPositionDialog(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <History className="w-4 h-4" />
                Histórico
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registro de Requerimentos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {paginatedHistory.map(record => (
                  <Card key={record.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline">{record.action_type}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(record.created_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                        {record.reason && (
                          <p className="text-sm mt-2"><strong>Motivo:</strong> {record.reason}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {record.old_values && <div>Antes: {JSON.stringify(record.old_values)}</div>}
                        {record.new_values && <div>Depois: {JSON.stringify(record.new_values)}</div>}
                      </div>
                    </div>
                  </Card>
                ))}
                
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={historyPage === 1}
                      onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground self-center">
                      Página {historyPage} de {totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={historyPage === totalPages}
                      onClick={() => setHistoryPage(prev => Math.min(totalPages, prev + 1))}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Requerimento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Membro</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newMember.name}
                    onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome"
                  />
                </div>
                <div>
                  <Label htmlFor="position">Cargo</Label>
                  <Select 
                    value={newMember.position} 
                    onValueChange={(value) => setNewMember(prev => ({ ...prev, position: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50">
                      {allPositions.map(position => (
                        <SelectItem 
                          key={position} 
                          value={position}
                          disabled={getAvailableSlots(position) === 0}
                        >
                          {position} ({getAvailableSlots(position)} vagas disponíveis)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Data de Inclusão</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={newMember.date_added}
                    onChange={(e) => setNewMember(prev => ({ ...prev, date_added: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddMember} className="flex-1">
                    Adicionar Membro
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        {allPositions.map(position => (
          <Card key={position} className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-card-foreground">
                  {position}
                </CardTitle>
                <Badge variant="secondary">
                  {groupedMembers[position]?.length || 0}/{getAvailableSlots(position) + (groupedMembers[position]?.length || 0)} vagas
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groupedMembers[position]?.length ? (
                  groupedMembers[position].map(member => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
                    >
                      {editingMember === member.id ? (
                        <EditMemberForm 
                          member={member}
                          onSave={(updates) => handleUpdateMember(member.id, updates)}
                          onCancel={() => setEditingMember(null)}
                        />
                      ) : editingStatus === member.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                              <Select 
                                value={statusUpdate.status} 
                                onValueChange={(value) => setStatusUpdate(prev => ({ ...prev, status: value }))}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border shadow-lg z-50">
                                  <SelectItem value="Ativo">Ativo</SelectItem>
                                  <SelectItem value="Inativo">Inativo</SelectItem>
                                  <SelectItem value="Desligado">Desligado</SelectItem>
                                </SelectContent>
                              </Select>
                              {(statusUpdate.status === "Inativo" || statusUpdate.status === "Desligado") && (
                                <Input
                                  placeholder="Motivo obrigatório"
                                  value={statusUpdate.reason}
                                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, reason: e.target.value }))}
                                  className="flex-1"
                                />
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleStatusUpdate(member.id)}>
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditingStatus(null)
                              setStatusUpdate({ status: "", reason: "" })
                            }}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{member.name}</span>
                                {getPositionIcon(member.name)}
                                <div className="flex gap-1 ml-2">
                                  {getTags(member).map((tag, index) => (
                                    <Badge key={index} variant={getTagVariant(tag)} className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                Incluído em: {format(new Date(member.date_added), 'dd/MM/yyyy HH:mm')}
                              </span>
                              {member.status_reason && (
                                <div className="flex items-center gap-1 mt-1">
                                  <AlertCircle className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{member.status_reason}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingStatus(member.id)
                                setStatusUpdate({ status: member.status, reason: member.status_reason || "" })
                              }}
                              title="Alterar Status"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingMember(member.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMember(member.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum membro neste cargo
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

interface EditMemberFormProps {
  member: TeamMember
  onSave: (updates: Partial<TeamMember>) => void
  onCancel: () => void
}

function EditMemberForm({ member, onSave, onCancel }: EditMemberFormProps) {
  const [name, setName] = useState(member.name)
  const [position, setPosition] = useState(member.position)
  const [dateAdded, setDateAdded] = useState(
    format(new Date(member.date_added), "yyyy-MM-dd'T'HH:mm")
  )

  const handleSave = () => {
    onSave({
      name,
      position,
      date_added: new Date(dateAdded).toISOString()
    })
  }

  // Get all positions including custom ones
  const allPositions = [...POSITIONS]
  
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="grid grid-cols-3 gap-2 flex-1">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome"
        />
        <Select value={position} onValueChange={setPosition}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-lg z-50">
            {allPositions.map(pos => (
              <SelectItem key={pos} value={pos}>
                {pos}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="datetime-local"
          value={dateAdded}
          onChange={(e) => setDateAdded(e.target.value)}
        />
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={handleSave}>
          <Save className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}