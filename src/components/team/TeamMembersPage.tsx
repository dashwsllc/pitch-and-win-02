import { useState } from "react"
import { useAllUsers } from "@/hooks/useRoles"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RefreshCw, Circle } from "lucide-react"

const ROLE_CONFIG: Record<string, { label: string; color: string; dept: string }> = {
  super_admin:     { label: "Super Admin",       color: "#6366F1", dept: "Administração" },
  executive:       { label: "Executive",         color: "#6366F1", dept: "Administração" },
  closer:          { label: "Closer",            color: "#0D9488", dept: "Comercial" },
  sdr:             { label: "SDR",               color: "#D97706", dept: "Comercial" },
  bdr:             { label: "BDR",               color: "#E05A3A", dept: "Prospecção" },
  traffic_manager: { label: "Gestor de Tráfego", color: "#2563EB", dept: "Tráfego" },
  seller:          { label: "Vendedor",          color: "#059669", dept: "Vendas" },
}

const DEPT_ORDER = ["Administração", "Comercial", "Prospecção", "Tráfego", "Vendas"]

function getInitials(name?: string | null) {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
}

function isOnline(lastSeen?: string | null) {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000
}

export function TeamMembersPage() {
  const { users, loading, refetch } = useAllUsers()
  const [updating, setUpdating] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId)
    try {
      // Remove all existing roles for this user
      await supabase.from("user_roles").delete().eq("user_id", userId)

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole })

      if (error) throw error

      // If executive, also insert executive role alongside super_admin
      if (newRole === "super_admin") {
        await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "executive" })
          .then(() => {}) // ignore duplicate
      }

      toast.success("Role atualizado com sucesso!")
      refetch()
    } catch (err) {
      console.error(err)
      toast.error("Erro ao atualizar role")
    } finally {
      setUpdating(null)
    }
  }

  const handleCanViewSales = async (userId: string, value: boolean) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ can_view_sales: value })
      .eq("user_id", userId)

    if (error) {
      toast.error("Erro ao atualizar permissão")
    } else {
      toast.success(value ? "Acesso a vendas ativado" : "Acesso a vendas removido")
      refetch()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]" />
      </div>
    )
  }

  // Group users by department
  const grouped = DEPT_ORDER.reduce((acc, dept) => {
    acc[dept] = users.filter(u => {
      const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.seller
      return cfg.dept === dept
    })
    return acc
  }, {} as Record<string, typeof users>)

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Gestão do Time</h1>
        <button
          onClick={refetch}
          className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-30">
            <circle cx="24" cy="20" r="8" stroke="#94A3B8" strokeWidth="1.5" />
            <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#94A3B8" strokeWidth="1.5" />
          </svg>
          <p className="text-[15px] text-white/40">Nenhum usuário cadastrado ainda</p>
          <p className="text-[13px] text-white/25">
            Quando alguém criar uma conta no sistema, aparecerá aqui
          </p>
        </div>
      ) : (
        DEPT_ORDER.map(dept => {
          const deptUsers = grouped[dept]
          if (!deptUsers || deptUsers.length === 0) return null

          return (
            <div key={dept} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 px-1">
                {dept}
              </h2>
              <div className="space-y-2">
                {deptUsers.map(user => {
                  const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.seller
                  const online = isOnline(user.last_seen_at)
                  const isTrafficManager = user.role === "traffic_manager"

                  return (
                    <div
                      key={user.user_id}
                      className="rounded-xl border border-white/10 bg-[#1A1A26] p-3 flex items-center gap-3"
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-[#09090E] border border-white/15 flex items-center justify-center text-xs font-bold text-white/70">
                          {getInitials(user.display_name)}
                        </div>
                        <Circle
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3"
                          fill={online ? "#10B981" : "#475569"}
                          stroke="none"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">
                            {user.display_name || user.email || "Sem nome"}
                          </p>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                            style={{ background: `${cfg.color}20`, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-white/30 truncate">{user.email}</p>
                      </div>

                      {/* Role selector */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isTrafficManager && (
                          <div className="flex items-center gap-1.5 mr-1">
                            <Switch
                              id={`sales-${user.user_id}`}
                              checked={!!user.can_view_sales}
                              onCheckedChange={v => handleCanViewSales(user.user_id, v)}
                            />
                            <Label htmlFor={`sales-${user.user_id}`} className="text-[10px] text-white/40 cursor-pointer">
                              Ver vendas
                            </Label>
                          </div>
                        )}

                        <Select
                          value={user.role}
                          onValueChange={v => handleRoleChange(user.user_id, v)}
                          disabled={updating === user.user_id}
                        >
                          <SelectTrigger className="h-7 w-36 text-xs bg-[#09090E] border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A26] border-white/10">
                            {Object.entries(ROLE_CONFIG).map(([key, val]) => (
                              <SelectItem key={key} value={key} className="text-xs">
                                {val.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
