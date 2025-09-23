import { useState, useEffect } from "react"
import { Plus, Crown, Star, Edit, Trash2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface TeamMember {
  id: string
  name: string
  position: string
  date_added: string
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
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [newMember, setNewMember] = useState({ name: "", position: "", date_added: "" })
  const { toast } = useToast()

  useEffect(() => {
    fetchMembers()
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

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.position) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    const positionCount = members.filter(m => m.position === newMember.position).length
    if (positionCount >= POSITION_LIMITS[newMember.position as keyof typeof POSITION_LIMITS]) {
      toast({
        title: "Erro",
        description: `Limite de vagas para ${newMember.position} atingido`,
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from('team_members')
        .insert([{
          name: newMember.name,
          position: newMember.position,
          date_added: newMember.date_added || new Date().toISOString()
        }])

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Membro adicionado com sucesso"
      })
      
      setNewMember({ name: "", position: "", date_added: "" })
      setShowAddDialog(false)
      fetchMembers()
    } catch (error) {
      console.error('Error adding member:', error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar membro",
        variant: "destructive"
      })
    }
  }

  const handleUpdateMember = async (id: string, updates: Partial<TeamMember>) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Membro atualizado com sucesso"
      })
      
      setEditingMember(null)
      fetchMembers()
    } catch (error) {
      console.error('Error updating member:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar membro",
        variant: "destructive"
      })
    }
  }

  const handleDeleteMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Membro removido com sucesso"
      })
      
      fetchMembers()
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

  const groupedMembers = POSITIONS.reduce((acc, position) => {
    acc[position] = members.filter(member => member.position === position)
    return acc
  }, {} as Record<string, TeamMember[]>)

  const getAvailableSlots = (position: string) => {
    const currentCount = groupedMembers[position]?.length || 0
    const limit = POSITION_LIMITS[position as keyof typeof POSITION_LIMITS]
    return limit - currentCount
  }

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
                  <SelectContent>
                    {POSITIONS.map(position => (
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

      <div className="grid gap-6">
        {POSITIONS.map(position => (
          <Card key={position} className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-card-foreground">
                  {position}
                </CardTitle>
                <Badge variant="secondary">
                  {groupedMembers[position]?.length || 0}/{POSITION_LIMITS[position as keyof typeof POSITION_LIMITS]} vagas
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
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{member.name}</span>
                                {getPositionIcon(member.name)}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                Incluído em: {format(new Date(member.date_added), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
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
          <SelectContent>
            {POSITIONS.map(pos => (
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