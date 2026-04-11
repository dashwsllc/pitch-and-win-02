import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useRoles } from '@/hooks/useRoles'
import {
  useCompanyGoals,
  useAnnouncements,
  useCreateAnnouncement,
  useCreateGoal,
  useUpdateGoal,
} from '@/hooks/useHome'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import { BottomSheet } from '@/components/layout/BottomSheet'
import type { AppRole } from '@/components/layout/BottomNav'
import type { CompanyGoal } from '@/hooks/useHome'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameDay,
  formatDistanceToNow,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts'
import {
  TrendingUp,
  DollarSign,
  Users,
  Phone,
  CheckSquare,
  Plus,
  Pin,
  ChevronRight,
  Megaphone,
  Target,
} from 'lucide-react'

// ─── helpers ───────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function fmtBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function getInitials(name: string | null | undefined) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

const AVATAR_COLORS = ['#6366F1', '#0D9488', '#D97706', '#E05A3A', '#2563EB', '#7C3AED', '#059669']
function avatarColor(name: string | undefined) {
  if (!name) return AVATAR_COLORS[0]
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

// ─── Stats hook ─────────────────────────────────────────────────────────────

function useHomeStats() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['home_stats'],
    queryFn: async () => {
      const now = new Date()
      const monthStart = startOfMonth(now).toISOString()
      const monthEnd = endOfMonth(now).toISOString()
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
      const todayStr = format(now, 'yyyy-MM-dd')

      const [vendasMes, abordagensSem, leadsRes, tasksRes] = await Promise.all([
        supabase
          .from('vendas')
          .select('valor_venda')
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),
        supabase
          .from('abordagens')
          .select('quantidade')
          .gte('created_at', weekStart),
        supabase
          .from('crm_leads')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('workboard_completions')
          .select('id', { count: 'exact', head: true })
          .gte('completed_at', todayStr),
      ])

      const totalVendas = (vendasMes.data || []).reduce(
        (s: number, v: any) => s + (Number(v.valor_venda) || 0), 0
      )
      const totalAbordagens = (abordagensSem.data || []).reduce(
        (s: number, a: any) => s + (Number(a.quantidade) || 1), 0
      )

      return {
        vendasMes: totalVendas,
        abordagensSemana: totalAbordagens,
        leadsTotal: leadsRes.count ?? 0,
        tarefasHoje: tasksRes.count ?? 0,
      }
    },
    enabled: !!user,
  })
}

// ─── Weekly chart hook ───────────────────────────────────────────────────────

function useWeeklyChart() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['weekly_chart'],
    queryFn: async () => {
      const now = new Date()
      const weekStart = startOfWeek(now, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

      const [vendasRes, abordagensRes] = await Promise.all([
        supabase
          .from('vendas')
          .select('created_at, valor_venda')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString()),
        supabase
          .from('abordagens')
          .select('created_at, quantidade')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString()),
      ])

      return days.map(day => {
        const dayAbordagens = (abordagensRes.data || [])
          .filter((a: any) => isSameDay(new Date(a.created_at), day))
          .reduce((s: number, a: any) => s + (Number(a.quantidade) || 1), 0)
        const dayVendas = (vendasRes.data || [])
          .filter((v: any) => isSameDay(new Date(v.created_at), day))
          .length
        return {
          name: format(day, 'EEE', { locale: ptBR }),
          abordagens: dayAbordagens,
          vendas: dayVendas,
          today: isToday(day),
        }
      })
    },
    enabled: !!user,
  })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = '#6366F1',
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#111118] p-4 flex flex-col gap-3 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ background: `radial-gradient(ellipse at top right, ${color}, transparent 70%)` }}
      />
      <div className="flex items-center justify-between relative">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {sub && (
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${color}18`, color }}
          >
            {sub}
          </span>
        )}
      </div>
      <div className="relative">
        <p className="text-[22px] font-bold text-white leading-none tracking-tight">{value}</p>
        <p className="text-[11px] text-white/40 mt-1">{label}</p>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#1A1A26] px-3 py-2 shadow-xl text-xs">
      <p className="text-white/60 mb-1 capitalize">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.dataKey === 'abordagens' ? 'Abordagens' : 'Vendas'}: <b>{p.value}</b>
        </p>
      ))}
    </div>
  )
}

function ActivityItem({ item }: { item: any }) {
  const color = avatarColor(item.userName)
  return (
    <div className="flex items-start gap-3 py-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 text-white"
        style={{ background: color }}
      >
        {getInitials(item.userName)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-white/80 leading-snug">{item.text}</p>
        <p className="text-[11px] text-white/35 mt-0.5">{item.time}</p>
      </div>
    </div>
  )
}

function AnnouncementProjectCard({
  item,
  isExecutive,
  onEdit,
}: {
  item: any
  isExecutive: boolean
  onEdit?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isGoal = 'target' in item
  const pct = isGoal && item.target ? Math.min(100, Math.round((item.current / item.target) * 100)) : null
  const statusColors: Record<string, string> = {
    on_track: '#10B981',
    at_risk: '#F59E0B',
    completed: '#6366F1',
  }
  const statusLabels: Record<string, string> = {
    on_track: 'No caminho',
    at_risk: 'Em risco',
    completed: 'Concluído',
  }
  const color = isGoal ? (statusColors[item.status] ?? '#6366F1') : '#6366F1'

  return (
    <div className="rounded-2xl border border-white/8 bg-[#111118] overflow-hidden">
      {/* colored top strip */}
      <div className="h-1 w-full" style={{ background: color }} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18` }}
            >
              {isGoal ? (
                <Target className="w-3.5 h-3.5" style={{ color }} />
              ) : (
                <Megaphone className="w-3.5 h-3.5" style={{ color }} />
              )}
            </div>
            <p className="text-[13px] font-semibold text-white leading-snug">{item.title}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isGoal && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${color}18`, color }}
              >
                {statusLabels[item.status] ?? 'Em curso'}
              </span>
            )}
            {item.pinned && !isGoal && (
              <Pin className="w-3 h-3 text-[#6366F1]" />
            )}
            {isExecutive && onEdit && (
              <button
                onClick={onEdit}
                className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
              >
                ✏️
              </button>
            )}
          </div>
        </div>

        {/* Progress bar (goals only) */}
        {isGoal && item.target != null && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-white font-semibold">
                {item.unit === 'BRL'
                  ? fmtBRL(item.current)
                  : `${item.current} ${item.unit}`}
              </span>
              <span className="text-white/40">
                de{' '}
                {item.unit === 'BRL'
                  ? fmtBRL(item.target)
                  : `${item.target} ${item.unit}`}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <p className="text-[10px]" style={{ color }}>
              {pct}% concluído
            </p>
          </div>
        )}

        {/* Content (announcements) */}
        {!isGoal && item.content && (
          <div>
            <p className="text-[13px] text-white/60 leading-relaxed">
              {expanded ? item.content : item.content.slice(0, 120) + (item.content.length > 120 ? '…' : '')}
            </p>
            {item.content.length > 120 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[11px] text-[#6366F1] mt-1 hover:underline"
              >
                {expanded ? 'Ver menos' : 'Ver mais'}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-white/30">
            {item.profiles?.display_name || 'Executive'} ·{' '}
            {formatDistanceToNow(new Date(item.created_at), { locale: ptBR, addSuffix: true })}
          </p>
          {item.deadline && (
            <span className="text-[11px] text-white/30">
              Vence {format(new Date(item.deadline), "dd 'de' MMM", { locale: ptBR })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Forms ───────────────────────────────────────────────────────────────────

const annSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  content: z.string().min(1, 'Conteúdo obrigatório'),
  pinned: z.boolean().default(false),
})
type AnnForm = z.infer<typeof annSchema>

const goalSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  period: z.enum(['daily', 'weekly', 'monthly']),
  target: z.coerce.number().positive(),
  unit: z.string().default('BRL'),
  deadline: z.string().optional(),
  description: z.string().optional(),
})
type GoalForm = z.infer<typeof goalSchema>

// ─── Main page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { roles, isExecutive } = useRoles()
  const role = (roles[0] || 'seller') as AppRole

  const userName = profile?.display_name || user?.email?.split('@')[0] || 'Usuário'
  const todayStr = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  const { data: stats } = useHomeStats()
  const { data: chartData = [] } = useWeeklyChart()
  const { data: goals = [] } = useCompanyGoals()
  const { data: announcements = [] } = useAnnouncements()
  const { data: feedItems = [] } = useActivityFeed(8)

  const [annSheet, setAnnSheet] = useState(false)
  const [goalSheet, setGoalSheet] = useState(false)
  const [editGoal, setEditGoal] = useState<CompanyGoal | null>(null)
  const [editCurrent, setEditCurrent] = useState('')
  const [activeTab, setActiveTab] = useState<'workspace' | 'feed'>('workspace')

  const createAnn = useCreateAnnouncement()
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()

  const annForm = useForm<AnnForm>({ resolver: zodResolver(annSchema) })
  const goalForm = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: { period: 'monthly', unit: 'BRL' },
  })

  const handleAnnSubmit = (data: AnnForm) => {
    createAnn.mutate(data, {
      onSuccess: () => { setAnnSheet(false); annForm.reset() },
    })
  }

  const handleGoalSubmit = (data: GoalForm) => {
    createGoal.mutate({ ...data, current: 0, status: 'on_track' }, {
      onSuccess: () => { setGoalSheet(false); goalForm.reset() },
    })
  }

  const handleEditGoalSave = () => {
    if (!editGoal) return
    updateGoal.mutate({ id: editGoal.id, current: Number(editCurrent) }, {
      onSuccess: () => setEditGoal(null),
    })
  }

  // Merge announcements + goals for workspace view, sorted by date
  const workspaceItems = [
    ...announcements,
    ...goals,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto pb-28 space-y-6 animate-fade-in">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-white leading-tight">
              {getGreeting()}, {userName}!
            </h1>
            <p className="text-[13px] text-white/40 mt-0.5 capitalize">{todayStr}</p>
          </div>
          {isExecutive && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAnnSheet(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6366F1]/15 text-[#6366F1] text-[12px] font-medium hover:bg-[#6366F1]/25 transition-colors"
              >
                <Megaphone className="w-3.5 h-3.5" />
                Comunicado
              </button>
              <button
                onClick={() => setGoalSheet(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10B981]/15 text-[#10B981] text-[12px] font-medium hover:bg-[#10B981]/25 transition-colors"
              >
                <Target className="w-3.5 h-3.5" />
                Objetivo
              </button>
            </div>
          )}
        </div>

        {/* ── Stats row ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={DollarSign}
            label="Vendas do Mês"
            value={stats ? fmtBRL(stats.vendasMes) : '—'}
            sub="+mês"
            color="#6366F1"
          />
          <StatCard
            icon={Users}
            label="Leads no CRM"
            value={stats ? String(stats.leadsTotal) : '—'}
            color="#0D9488"
          />
          <StatCard
            icon={Phone}
            label="Abordagens Semana"
            value={stats ? String(stats.abordagensSemana) : '—'}
            color="#D97706"
          />
          <StatCard
            icon={CheckSquare}
            label="Tasks Hoje"
            value={stats ? String(stats.tarefasHoje) : '—'}
            color="#10B981"
          />
        </div>

        {/* ── Chart + Activity ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Bar chart */}
          <div className="lg:col-span-3 rounded-2xl border border-white/8 bg-[#111118] p-5">
            <p className="text-[13px] font-semibold text-white mb-4">Atividade da Semana</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="abordagens" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.today ? '#6366F1' : '#D97706'} fillOpacity={entry.today ? 1 : 0.7} />
                  ))}
                </Bar>
                <Bar dataKey="vendas" radius={[4, 4, 0, 0]} fill="#10B981" fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#D97706]" />
                <span className="text-[11px] text-white/40">Abordagens</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
                <span className="text-[11px] text-white/40">Vendas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#6366F1]" />
                <span className="text-[11px] text-white/40">Hoje</span>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#111118] p-5">
            <p className="text-[13px] font-semibold text-white mb-1">Atividade Recente</p>
            {feedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <TrendingUp className="w-8 h-8 text-white/20" />
                <p className="text-[12px] text-white/30 text-center">Nenhuma atividade ainda</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {feedItems.slice(0, 5).map(item => (
                  <ActivityItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Workspace / Feed tabs ─────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 bg-[#111118] rounded-xl p-1 border border-white/8">
              <button
                onClick={() => setActiveTab('workspace')}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  activeTab === 'workspace'
                    ? 'bg-[#1A1A26] text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                Workspace
              </button>
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  activeTab === 'feed'
                    ? 'bg-[#1A1A26] text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                Feed Completo
              </button>
            </div>
            {isExecutive && activeTab === 'workspace' && (
              <button
                onClick={() => setAnnSheet(true)}
                className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo
              </button>
            )}
          </div>

          {activeTab === 'workspace' ? (
            workspaceItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 py-16 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#6366F1]/10 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-[#6366F1]/60" />
                </div>
                <p className="text-[14px] text-white/30">Nenhum item no workspace</p>
                {isExecutive && (
                  <button
                    onClick={() => setAnnSheet(true)}
                    className="text-[12px] text-[#6366F1] hover:underline"
                  >
                    + Publicar primeiro comunicado
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {workspaceItems.map((item: any) => (
                  <AnnouncementProjectCard
                    key={item.id}
                    item={item}
                    isExecutive={isExecutive}
                    onEdit={
                      'target' in item
                        ? () => {
                            setEditGoal(item as CompanyGoal)
                            setEditCurrent(String(item.current))
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-white/8 bg-[#111118] divide-y divide-white/5 overflow-hidden">
              {feedItems.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-2">
                  <TrendingUp className="w-8 h-8 text-white/20" />
                  <p className="text-[13px] text-white/30">Nenhuma atividade registrada</p>
                </div>
              ) : (
                feedItems.map(item => (
                  <div key={item.id} className="px-5">
                    <ActivityItem item={item} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Sheets ─────────────────────────────────────────────── */}
      <BottomSheet open={annSheet} onClose={() => setAnnSheet(false)} title="Novo Comunicado">
        <form onSubmit={annForm.handleSubmit(handleAnnSubmit)} className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input {...annForm.register('title')} placeholder="Título do comunicado" className="mt-1" />
          </div>
          <div>
            <Label>Conteúdo</Label>
            <Textarea {...annForm.register('content')} placeholder="Escreva o comunicado..." className="mt-1" rows={4} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pinned" {...annForm.register('pinned')} className="rounded" />
            <Label htmlFor="pinned" className="cursor-pointer">Fixar no topo</Label>
          </div>
          <Button type="submit" className="w-full" disabled={createAnn.isPending}>
            Publicar
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet open={goalSheet} onClose={() => setGoalSheet(false)} title="Novo Objetivo">
        <form onSubmit={goalForm.handleSubmit(handleGoalSubmit)} className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input {...goalForm.register('title')} placeholder="Ex: Meta do Mês" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Período</Label>
              <select
                {...goalForm.register('period')}
                className="mt-1 w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
            <div>
              <Label>Unidade</Label>
              <select
                {...goalForm.register('unit')}
                className="mt-1 w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="BRL">R$</option>
                <option value="leads">leads</option>
                <option value="calls">calls</option>
                <option value="%">%</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Meta (valor)</Label>
            <Input type="number" {...goalForm.register('target')} placeholder="Ex: 100000" className="mt-1" />
          </div>
          <div>
            <Label>Prazo</Label>
            <Input type="date" {...goalForm.register('deadline')} className="mt-1" />
          </div>
          <Button type="submit" className="w-full" disabled={createGoal.isPending}>
            Criar Objetivo
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet open={!!editGoal} onClose={() => setEditGoal(null)} title="Atualizar Progresso">
        <div className="space-y-4">
          <p className="text-[13px] text-white/60">{editGoal?.title}</p>
          <div>
            <Label>Valor atual</Label>
            <Input
              type="number"
              value={editCurrent}
              onChange={e => setEditCurrent(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button className="w-full" onClick={handleEditGoalSave} disabled={updateGoal.isPending}>
            Salvar
          </Button>
        </div>
      </BottomSheet>
    </DashboardLayout>
  )
}
