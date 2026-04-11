import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useRoles } from '@/hooks/useRoles'
import { useCompanyGoals, useAnnouncements, useCreateAnnouncement, useCreateGoal, useUpdateGoal } from '@/hooks/useHome'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import { GoalCard } from '@/components/home/GoalCard'
import { AnnouncementCard } from '@/components/home/AnnouncementCard'
import { ActivityFeed } from '@/components/home/ActivityFeed'
import { TeamChat } from '@/components/home/TeamChat'
import { QuickActions } from '@/components/home/QuickActions'
import { BottomSheet } from '@/components/layout/BottomSheet'
import type { AppRole } from '@/components/layout/BottomNav'
import type { CompanyGoal } from '@/hooks/useHome'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const MOTIVATIONAL = [
  'O clube não vai bater na porta. A Zyron leva até lá.',
  'Cada abordagem hoje é uma família transformada amanhã.',
  'Foco. Consistência. Resultado.',
  'David tem 60% de conversão. O sistema funciona. Alimenta o funil.',
  'Pequenas ações consistentes criam grandes resultados.',
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

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

export default function HomePage() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { roles, isExecutive } = useRoles()
  const role = (roles[0] || 'seller') as AppRole

  const userName = profile?.display_name || user?.email?.split('@')[0] || 'Usuário'
  const todayStr = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })
  const weekNum = Math.ceil(new Date().getDate() / 7)
  const motivation = MOTIVATIONAL[new Date().getDay() % MOTIVATIONAL.length]

  const [goalPeriod, setGoalPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const { data: goals = [] } = useCompanyGoals(goalPeriod)
  const { data: announcements = [] } = useAnnouncements(true)
  const { data: feedItems = [] } = useActivityFeed(20)

  const [annSheet, setAnnSheet] = useState(false)
  const [goalSheet, setGoalSheet] = useState(false)
  const [editGoal, setEditGoal] = useState<CompanyGoal | null>(null)
  const [editCurrent, setEditCurrent] = useState('')

  const createAnn = useCreateAnnouncement()
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()

  const annForm = useForm<AnnForm>({ resolver: zodResolver(annSchema) })
  const goalForm = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: { period: 'monthly', unit: 'BRL' },
  })

  const handleAnnSubmit = (data: AnnForm) => {
    createAnn.mutate(data, { onSuccess: () => { setAnnSheet(false); annForm.reset() } })
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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto pb-24 animate-fade-in">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">
              {getGreeting()}, {userName}
            </h1>
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full capitalize"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}
            >
              {role}
            </span>
          </div>
          <p className="text-sm text-white/50 capitalize">{todayStr} · Semana {weekNum} do mês</p>
          <p className="text-sm text-white/30 italic mt-1">{motivation}</p>
        </div>

        {/* Quick Actions */}
        <QuickActions role={role} />

        {/* Comunicados fixados */}
        {(announcements.length > 0 || isExecutive) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/70">Comunicados</h2>
              {isExecutive && (
                <button onClick={() => setAnnSheet(true)} className="text-xs text-[#6366F1] hover:underline">
                  + Comunicado
                </button>
              )}
            </div>
            {announcements.length === 0 && isExecutive ? (
              <button
                onClick={() => setAnnSheet(true)}
                className="w-full py-3 rounded-xl border border-dashed border-white/20 text-sm text-white/40 hover:border-[#6366F1] hover:text-[#6366F1] transition-colors"
              >
                + Publicar comunicado
              </button>
            ) : (
              announcements.map(a => <AnnouncementCard key={a.id} announcement={a} />)
            )}
          </div>
        )}

        {/* Objetivos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/70">Objetivos</h2>
            <div className="flex items-center gap-2">
              {isExecutive && (
                <button onClick={() => setGoalSheet(true)} className="text-xs text-[#6366F1] hover:underline">
                  + Objetivo
                </button>
              )}
              <div className="flex gap-1">
                {(['daily', 'weekly', 'monthly'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setGoalPeriod(p)}
                    className={`text-xs px-2 py-0.5 rounded-full transition-colors ${goalPeriod === p ? 'bg-[#6366F1] text-white' : 'text-white/40 hover:text-white'}`}
                  >
                    {p === 'daily' ? 'Hoje' : p === 'weekly' ? 'Semana' : 'Mês'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {goals.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="opacity-30">
                <circle cx="20" cy="20" r="16" stroke="#94A3B8" strokeWidth="1.5" />
                <path d="M20 12v8l5 3" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-white/30">Nenhum objetivo para este período</p>
            </div>
          ) : (
            goals.map(g => (
              <GoalCard
                key={g.id}
                goal={g}
                isExecutive={isExecutive}
                onEdit={goal => { setEditGoal(goal); setEditCurrent(String(goal.current)) }}
              />
            ))
          )}
        </div>

        {/* Atividade recente */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white/70">Atividade Recente</h2>
          <div className="rounded-xl border border-white/10 bg-[#111118] overflow-hidden">
            <ActivityFeed items={feedItems} />
          </div>
        </div>

        {/* Chat */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white/70">Chat do Time</h2>
          <div className="rounded-xl border border-white/10 bg-[#111118] p-3">
            <TeamChat />
          </div>
        </div>
      </div>

      {/* Sheets */}
      <BottomSheet open={annSheet} onClose={() => setAnnSheet(false)} title="Novo Comunicado">
        <form onSubmit={annForm.handleSubmit(handleAnnSubmit)} className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input {...annForm.register('title')} placeholder="Título do comunicado" className="mt-1" />
          </div>
          <div>
            <Label>Conteúdo</Label>
            <Textarea {...annForm.register('content')} placeholder="Conteúdo..." className="mt-1" rows={4} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pinned" {...annForm.register('pinned')} />
            <Label htmlFor="pinned">Fixar no topo</Label>
          </div>
          <Button type="submit" className="w-full" disabled={createAnn.isPending}>Publicar</Button>
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
              <select {...goalForm.register('period')} className="mt-1 w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
            <div>
              <Label>Unidade</Label>
              <select {...goalForm.register('unit')} className="mt-1 w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
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
          <Button type="submit" className="w-full" disabled={createGoal.isPending}>Criar Objetivo</Button>
        </form>
      </BottomSheet>

      <BottomSheet open={!!editGoal} onClose={() => setEditGoal(null)} title="Atualizar Progresso">
        <div className="space-y-4">
          <p className="text-sm text-white/60">{editGoal?.title}</p>
          <div>
            <Label>Valor atual</Label>
            <Input type="number" value={editCurrent} onChange={e => setEditCurrent(e.target.value)} className="mt-1" />
          </div>
          <Button className="w-full" onClick={handleEditGoalSave} disabled={updateGoal.isPending}>Salvar</Button>
        </div>
      </BottomSheet>
    </DashboardLayout>
  )
}
