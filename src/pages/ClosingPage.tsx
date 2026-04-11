import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useClosingForms, useCreateClosingForm } from '@/hooks/useClosingForms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'

const PRODUCTS = [
  { value: 'Zyron', label: 'Zyron', price: 497 },
  { value: 'Mentoria Jogador de Elite', label: 'Mentoria Jogador de Elite', price: 2997 },
  { value: 'Mentoria Jogador Milionário', label: 'Mentoria Jogador Milionário', price: 500 },
  { value: 'outro', label: 'Outro', price: 0 },
]

const STATUS_CONFIG = {
  won: { label: '🟢 Ganho', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  lost: { label: '🔴 Perdido', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  pending: { label: '🟡 Pendente', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
}

const schema = z.object({
  lead_name: z.string().min(1, 'Nome obrigatório'),
  lead_whatsapp: z.string().optional(),
  product: z.string().min(1, 'Produto obrigatório'),
  value: z.coerce.number().positive('Valor deve ser positivo'),
  objections_raised: z.string().optional(),
  how_closed: z.string().optional(),
  next_steps: z.string().optional(),
  status: z.enum(['won', 'lost', 'pending']),
})
type FormData = z.infer<typeof schema>

export default function ClosingPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { data: forms = [], isLoading } = useClosingForms(statusFilter === 'all' ? undefined : statusFilter)
  const create = useCreateClosingForm()
  const [status, setStatus] = useState<'won' | 'lost' | 'pending'>('pending')

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'pending', value: 0 },
  })

  const onSubmit = (data: FormData) => {
    create.mutate({ ...data, status }, { onSuccess: () => form.reset() })
  }

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const product = PRODUCTS.find(p => p.value === e.target.value)
    if (product && product.price > 0) form.setValue('value', product.price)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto pb-20 animate-fade-in">
        <h1 className="text-xl font-bold text-white">Formulário de Fechamento</h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-xl border border-white/10 bg-[#111118] p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome do Lead *</Label>
              <Input {...form.register('lead_name')} placeholder="Nome completo" className="mt-1" />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input {...form.register('lead_whatsapp')} placeholder="11999999999" className="mt-1" />
            </div>
            <div>
              <Label>Status</Label>
              <div className="flex gap-1 mt-1">
                {(['won', 'lost', 'pending'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className="flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition-colors"
                    style={status === s
                      ? { background: STATUS_CONFIG[s].bg, color: STATUS_CONFIG[s].color, border: 'none' }
                      : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
                    }
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Produto *</Label>
              <select
                {...form.register('product')}
                onChange={e => { form.register('product').onChange(e); handleProductChange(e) }}
                className="mt-1 w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">Selecionar...</option>
                {PRODUCTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" {...form.register('value')} className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Objeções Levantadas</Label>
            <Textarea {...form.register('objections_raised')} placeholder="O que o lead disse durante a call..." rows={2} className="mt-1" />
          </div>
          <div>
            <Label>Como foi Fechado</Label>
            <Textarea {...form.register('how_closed')} placeholder="O que funcionou para fechar..." rows={2} className="mt-1" />
          </div>
          <div>
            <Label>Próximos Passos</Label>
            <Textarea {...form.register('next_steps')} placeholder="O que acontece após o fechamento..." rows={2} className="mt-1" />
          </div>
          <Button type="submit" className="w-full" disabled={create.isPending}>Registrar Fechamento</Button>
        </form>

        {/* Lista */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/70">Histórico</h2>
            <div className="flex gap-1">
              {['all', 'won', 'lost', 'pending'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2 py-0.5 rounded-full text-xs transition-colors ${statusFilter === s ? 'bg-[#6366F1] text-white' : 'text-white/40 hover:text-white'}`}
                >
                  {s === 'all' ? 'Todos' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6366F1]" />
            </div>
          ) : forms.length === 0 ? (
            <p className="text-center text-sm text-white/30 py-8">Nenhum fechamento encontrado</p>
          ) : (
            forms.map(f => {
              const s = STATUS_CONFIG[f.status]
              return (
                <div key={f.id} className="rounded-xl border border-white/10 bg-[#1A1A26] p-3 flex items-center gap-3">
                  <span className="text-lg">{f.status === 'won' ? '🟢' : f.status === 'lost' ? '🔴' : '🟡'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{f.lead_name}</p>
                    <p className="text-xs text-white/40">{f.product}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: s.color }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.value)}
                    </p>
                    <p className="text-xs text-white/30">{format(new Date(f.created_at), 'dd/MM/yy')}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
