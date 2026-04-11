import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { FAB } from '@/components/ui/FAB'
import { BottomSheet } from '@/components/layout/BottomSheet'
import { usePlaybooks, useCreatePlaybook, useDeletePlaybook, Playbook } from '@/hooks/usePlaybooks'
import { useRoles } from '@/hooks/useRoles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const TYPE_CONFIG = {
  sdr_approach: { label: 'Script SDR', color: '#D97706', bg: 'rgba(217,119,6,0.15)' },
  closer_inspiration: { label: 'Inspiração', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  objection_handler: { label: 'Objeção', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  general: { label: 'Geral', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
}

const ROLE_OPTIONS = ['sdr', 'closer', 'bdr', 'seller', 'traffic_manager']

function PlaybookCard({ pb, isExecutive, onDelete }: { pb: Playbook; isExecutive: boolean; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = TYPE_CONFIG[pb.type]
  const lines = pb.content.split('\n')
  const preview = lines.slice(0, 2).join('\n')

  return (
    <div className="rounded-xl border border-white/10 bg-[#1A1A26] overflow-hidden">
      <button className="w-full p-4 text-left space-y-2" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-white leading-snug">{pb.title}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isExecutive && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(pb.id) }}
                className="p-1 rounded hover:bg-red-500/20 text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
          {pb.tags?.map(t => (
            <span key={t} className="text-[11px] bg-white/10 text-white/40 px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
        {!expanded && <p className="text-xs text-white/50 whitespace-pre-wrap">{preview}</p>}
      </button>
      {expanded && (
        <div className="px-4 pb-4 text-sm text-white/70 whitespace-pre-wrap border-t border-white/10 pt-3">
          {pb.content}
        </div>
      )}
    </div>
  )
}

const pbSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['sdr_approach', 'closer_inspiration', 'objection_handler', 'general']),
  target_roles: z.array(z.string()).default([]),
  tags: z.string().optional(),
  is_active: z.boolean().default(true),
})
type PBForm = z.infer<typeof pbSchema>

export default function PlaybooksPage() {
  const { isExecutive, roles } = useRoles()
  const role = roles[0] || 'seller'
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const { data: playbooks = [], isLoading } = usePlaybooks(typeFilter === 'all' ? undefined : typeFilter)
  const createPb = useCreatePlaybook()
  const deletePb = useDeletePlaybook()
  const [sheet, setSheet] = useState(false)

  const form = useForm<PBForm>({
    resolver: zodResolver(pbSchema),
    defaultValues: { type: 'general', target_roles: [], is_active: true },
  })

  const onSubmit = (data: PBForm) => {
    const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    createPb.mutate({ ...data, tags } as any, { onSuccess: () => { setSheet(false); form.reset() } })
  }

  const types = isExecutive
    ? [{ k: 'all', label: 'Todos' }, ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ k, label: v.label }))]
    : role === 'sdr'
      ? [{ k: 'all', label: 'Todos' }, { k: 'sdr_approach', label: 'Scripts SDR' }, { k: 'general', label: 'Geral' }]
      : [{ k: 'all', label: 'Todos' }, { k: 'closer_inspiration', label: 'Inspirações' }, { k: 'objection_handler', label: 'Objeções' }, { k: 'general', label: 'Geral' }]

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-24 animate-fade-in">
        <h1 className="text-xl font-bold text-white">Playbooks</h1>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {types.map(t => (
            <button
              key={t.k}
              onClick={() => setTypeFilter(t.k)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-sm transition-colors ${typeFilter === t.k ? 'bg-[#6366F1] text-white' : 'bg-[#1A1A26] border border-white/10 text-white/60'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]" />
          </div>
        ) : playbooks.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-30">
              <rect x="8" y="8" width="32" height="32" rx="4" stroke="#94A3B8" strokeWidth="1.5" />
              <path d="M16 16h16M16 24h12M16 32h8" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-[15px] text-white/40">Nenhum playbook ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {playbooks.map(pb => (
              <PlaybookCard
                key={pb.id}
                pb={pb}
                isExecutive={isExecutive}
                onDelete={id => { if (confirm('Remover playbook?')) deletePb.mutate(id) }}
              />
            ))}
          </div>
        )}
      </div>

      {isExecutive && (
        <FAB onClick={() => setSheet(true)}>
          <Plus className="w-5 h-5 text-white" />
        </FAB>
      )}

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Novo Playbook">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input {...form.register('title')} placeholder="Título" className="mt-1" />
          </div>
          <div>
            <Label>Tipo</Label>
            <select {...form.register('type')} className="mt-1 w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              <option value="sdr_approach">Script SDR</option>
              <option value="closer_inspiration">Inspiração Closer</option>
              <option value="objection_handler">Tratamento de Objeção</option>
              <option value="general">Geral</option>
            </select>
          </div>
          <div>
            <Label>Roles-alvo</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {ROLE_OPTIONS.map(r => (
                <label key={r} className="flex items-center gap-1 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    value={r}
                    onChange={e => {
                      const current = form.getValues('target_roles') || []
                      form.setValue('target_roles', e.target.checked ? [...current, r] : current.filter(x => x !== r))
                    }}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Conteúdo</Label>
            <Textarea {...form.register('content')} placeholder="Conteúdo..." rows={6} className="mt-1" />
          </div>
          <div>
            <Label>Tags (vírgula)</Label>
            <Input {...form.register('tags')} placeholder="prospecção, fechamento" className="mt-1" />
          </div>
          <Button type="submit" className="w-full" disabled={createPb.isPending}>Criar Playbook</Button>
        </form>
      </BottomSheet>
    </DashboardLayout>
  )
}
