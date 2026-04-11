import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { FAB } from '@/components/ui/FAB'
import { BottomSheet } from '@/components/layout/BottomSheet'
import { useWorkboardTasks, useCreateTask, useArchiveTask, WorkboardTask } from '@/hooks/useWorkboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Archive } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const PRIORITY_CONFIG = {
  high: { label: 'Alta', color: '#EF4444' },
  medium: { label: 'Média', color: '#F59E0B' },
  low: { label: 'Baixa', color: '#94A3B8' },
}

const ROLES = ['closer', 'sdr', 'bdr', 'seller', 'traffic_manager']

const schema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().optional(),
  deadline: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  target_roles: z.array(z.string()).default([]),
})
type FormData = z.infer<typeof schema>

function TaskAdminCard({ task, onArchive }: { task: WorkboardTask; onArchive: (id: string) => void }) {
  const cfg = PRIORITY_CONFIG[task.priority]
  const daysLeft = task.deadline ? differenceInDays(parseISO(task.deadline), new Date()) : null

  return (
    <div className="rounded-xl border border-white/10 bg-[#1A1A26] p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-white">{task.title}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: `${cfg.color}20`, color: cfg.color }}
          >
            {cfg.label}
          </span>
          <button
            onClick={() => onArchive(task.id)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80"
            title="Arquivar"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {task.description && <p className="text-xs text-white/50">{task.description}</p>}
      <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
        {task.target_roles && task.target_roles.length > 0 && (
          <span>Roles: {task.target_roles.join(', ')}</span>
        )}
        {daysLeft !== null && (
          <span className={daysLeft < 3 ? 'text-red-400' : ''}>
            Prazo: {task.deadline} ({daysLeft < 0 ? 'vencido' : `${daysLeft}d restantes`})
          </span>
        )}
      </div>
    </div>
  )
}

export default function WorkboardAdminPage() {
  const { data: tasks = [], isLoading } = useWorkboardTasks()
  const createTask = useCreateTask()
  const archiveTask = useArchiveTask()
  const [sheet, setSheet] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium', target_roles: [] },
  })

  const onSubmit = (data: FormData) => {
    createTask.mutate({ ...data, is_active: true }, {
      onSuccess: () => { setSheet(false); form.reset() },
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-24 animate-fade-in">
        <h1 className="text-xl font-bold text-white">WorkBoard — Admin</h1>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-30">
              <rect x="8" y="8" width="32" height="32" rx="4" stroke="#94A3B8" strokeWidth="1.5" />
              <path d="M16 24l6 6 12-12" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[15px] text-white/40">Nenhuma task ainda</p>
            <p className="text-[13px] text-white/25">Toque no + para criar uma task</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(t => (
              <TaskAdminCard key={t.id} task={t} onArchive={id => archiveTask.mutate(id)} />
            ))}
          </div>
        )}
      </div>

      <FAB onClick={() => setSheet(true)}>
        <Plus className="w-5 h-5 text-white" />
      </FAB>

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Nova Task">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input {...form.register('title')} placeholder="Título da task" className="mt-1" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea {...form.register('description')} placeholder="Detalhes..." rows={3} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prazo</Label>
              <Input
                type="date"
                {...form.register('deadline')}
                className="mt-1"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label>Prioridade</Label>
              <select
                {...form.register('priority')}
                className="mt-1 w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Roles-alvo</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {ROLES.map(r => (
                <label key={r} className="flex items-center gap-1 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    value={r}
                    onChange={e => {
                      const current = form.getValues('target_roles') || []
                      form.setValue(
                        'target_roles',
                        e.target.checked ? [...current, r] : current.filter(x => x !== r)
                      )
                    }}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={createTask.isPending}>
            Criar Task
          </Button>
        </form>
      </BottomSheet>
    </DashboardLayout>
  )
}
