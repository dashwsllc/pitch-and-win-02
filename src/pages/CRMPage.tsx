import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { FAB } from '@/components/ui/FAB'
import { BottomSheet } from '@/components/layout/BottomSheet'
import { useCRMLeads, useCreateLead, useUpdateLead, useCRMActivities, useCreateActivity, CRMLead } from '@/hooks/useCRM'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Phone, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const QUAL_CONFIG = {
  cold: { emoji: '🧊', label: 'Frio', color: '#93C5FD', bg: 'rgba(37,99,235,0.15)' },
  warm: { emoji: '🔥', label: 'Morno', color: '#FCD34D', bg: 'rgba(217,119,6,0.15)' },
  hot: { emoji: '✨', label: 'Quente', color: '#6EE7B7', bg: 'rgba(16,185,129,0.15)' },
}

const newLeadSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  source: z.string().optional(),
  qualification: z.enum(['cold', 'warm', 'hot']),
})
type NewLeadForm = z.infer<typeof newLeadSchema>

function LeadCard({ lead, onClick }: { lead: CRMLead; onClick: () => void }) {
  const cfg = QUAL_CONFIG[lead.qualification]
  const daysSince = lead.last_contact_at
    ? Math.floor((Date.now() - new Date(lead.last_contact_at).getTime()) / 86400000)
    : null

  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-[#1A1A26] p-3 space-y-2 cursor-pointer hover:border-white/20 active:scale-[0.99] transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-white">{lead.name}</p>
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {cfg.emoji} {cfg.label}
        </span>
      </div>
      {lead.source && (
        <span className="text-[11px] bg-white/10 text-white/50 px-2 py-0.5 rounded-full">{lead.source}</span>
      )}
      {daysSince !== null && (
        <p className={`text-xs ${daysSince > 3 ? 'text-red-400' : 'text-white/40'}`}>
          Último contato há {daysSince} dia{daysSince !== 1 ? 's' : ''}
        </p>
      )}
      {lead.whatsapp && (
        <a
          href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-green-400 hover:underline"
        >
          <Phone className="w-3 h-3" /> WhatsApp
        </a>
      )}
    </div>
  )
}

function LeadDetail({ lead }: { lead: CRMLead }) {
  const updateLead = useUpdateLead()
  const { data: activities = [] } = useCRMActivities(lead.id)
  const createActivity = useCreateActivity()
  const [actType, setActType] = useState<'call' | 'message' | 'meeting' | 'note' | 'status_change'>('call')
  const [actDesc, setActDesc] = useState('')
  const [qual, setQual] = useState(lead.qualification)

  const handleQualChange = (q: CRMLead['qualification']) => {
    setQual(q)
    updateLead.mutate({ id: lead.id, qualification: q })
    createActivity.mutate({ lead_id: lead.id, type: 'status_change', description: `Movido para ${QUAL_CONFIG[q].label}` })
  }

  const handleActivity = () => {
    if (!actDesc.trim()) return
    createActivity.mutate({ lead_id: lead.id, type: actType, description: actDesc }, {
      onSuccess: () => setActDesc(''),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white">{lead.name}</p>
        {lead.whatsapp && (
          <a
            href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-green-400"
          >
            <ExternalLink className="w-3 h-3" /> WhatsApp
          </a>
        )}
      </div>

      <div>
        <Label className="text-xs text-white/50">Qualificação</Label>
        <div className="flex gap-2 mt-1">
          {(Object.entries(QUAL_CONFIG) as [CRMLead['qualification'], typeof QUAL_CONFIG.cold][]).map(([k, v]) => (
            <button
              key={k}
              onClick={() => handleQualChange(k)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={qual === k
                ? { background: v.bg, color: v.color, border: 'none' }
                : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
              }
            >
              {v.emoji} {v.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs text-white/50">Histórico</Label>
        <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
          {activities.length === 0 && <p className="text-xs text-white/30">Sem atividades ainda</p>}
          {activities.map(a => (
            <div key={a.id} className="flex gap-2 text-xs text-white/60 py-1 border-b border-white/5">
              <span className="font-medium text-white/80 capitalize">{a.type}</span>
              <span className="flex-1">{a.description}</span>
              <span className="text-white/30 flex-shrink-0">
                {formatDistanceToNow(new Date(a.created_at), { locale: ptBR, addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-white/50">Registrar Atividade</Label>
        <select
          value={actType}
          onChange={e => setActType(e.target.value as any)}
          className="w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="call">Ligação</option>
          <option value="message">Mensagem</option>
          <option value="meeting">Reunião</option>
          <option value="note">Nota</option>
        </select>
        <Textarea value={actDesc} onChange={e => setActDesc(e.target.value)} placeholder="Descrição..." rows={2} />
        <Button className="w-full" size="sm" onClick={handleActivity} disabled={createActivity.isPending}>
          Registrar
        </Button>
      </div>
    </div>
  )
}

export default function CRMPage() {
  const [filter, setFilter] = useState<string>('all')
  const { data: leads = [], isLoading } = useCRMLeads(filter === 'all' ? undefined : filter)
  const createLead = useCreateLead()
  const [newSheet, setNewSheet] = useState(false)
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null)

  const form = useForm<NewLeadForm>({
    resolver: zodResolver(newLeadSchema),
    defaultValues: { qualification: 'cold' },
  })

  const onSubmit = (data: NewLeadForm) => {
    createLead.mutate(data as any, { onSuccess: () => { setNewSheet(false); form.reset() } })
  }

  const filters = [
    { key: 'all', label: 'Todos' },
    { key: 'cold', label: '🧊 Frio' },
    { key: 'warm', label: '🔥 Morno' },
    { key: 'hot', label: '✨ Quente' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-24 animate-fade-in">
        <h1 className="text-xl font-bold text-white">CRM de Leads</h1>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-sm transition-colors ${filter === f.key ? 'bg-[#6366F1] text-white' : 'bg-[#1A1A26] border border-white/10 text-white/60'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-30">
              <circle cx="24" cy="20" r="8" stroke="#94A3B8" strokeWidth="1.5" />
              <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#94A3B8" strokeWidth="1.5" />
            </svg>
            <p className="text-[15px] text-white/40">Nenhum lead ainda</p>
            <p className="text-[13px] text-white/25">Toque no + para adicionar</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {leads.map(lead => (
              <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
            ))}
          </div>
        )}
      </div>

      <FAB onClick={() => setNewSheet(true)}>
        <Plus className="w-5 h-5 text-white" />
      </FAB>

      <BottomSheet open={newSheet} onClose={() => setNewSheet(false)} title="Novo Lead">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input {...form.register('name')} placeholder="Nome do pai/atleta" className="mt-1" />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input {...form.register('whatsapp')} placeholder="11999999999" className="mt-1" />
          </div>
          <div>
            <Label>Origem</Label>
            <select {...form.register('source')} className="mt-1 w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Selecionar...</option>
              <option value="instagram">Instagram</option>
              <option value="indicacao">Indicação</option>
              <option value="grupo_whatsapp">Grupo WhatsApp</option>
              <option value="escolinha">Escolinha</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <Label>Qualificação inicial</Label>
            <div className="flex gap-2 mt-1">
              {(['cold', 'warm', 'hot'] as const).map(k => (
                <label key={k} className="flex-1">
                  <input type="radio" value={k} {...form.register('qualification')} className="sr-only" />
                  <div className={`text-center py-2 rounded-lg border cursor-pointer text-xs font-medium transition-colors ${form.watch('qualification') === k ? 'border-[#6366F1] bg-[#6366F1]/20 text-white' : 'border-white/10 text-white/40'}`}>
                    {QUAL_CONFIG[k].emoji} {QUAL_CONFIG[k].label}
                  </div>
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={createLead.isPending}>Criar Lead</Button>
        </form>
      </BottomSheet>

      <BottomSheet open={!!selectedLead} onClose={() => setSelectedLead(null)} title="Detalhe do Lead">
        {selectedLead && <LeadDetail lead={selectedLead} />}
      </BottomSheet>
    </DashboardLayout>
  )
}
