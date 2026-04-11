import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useCreateTrafficMetric } from '@/hooks/useTrafficMetrics'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'

const today = new Date().toISOString().split('T')[0]

const schema = z.object({
  date: z.string().refine(d => new Date(d) <= new Date(), { message: 'Não pode ser data futura' }),
  platform: z.enum(['meta', 'google', 'tiktok', 'youtube', 'other']),
  campaign_name: z.string().min(1, 'Nome da campanha obrigatório'),
  ad_set_name: z.string().optional(),
  spend: z.coerce.number().min(0),
  impressions: z.coerce.number().min(0).default(0),
  clicks: z.coerce.number().min(0).default(0),
  leads_generated: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function TrafficNewPage() {
  const create = useCreateTrafficMetric()
  const navigate = useNavigate()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: today,
      platform: 'meta',
      spend: 0,
      impressions: 0,
      clicks: 0,
      leads_generated: 0,
    },
  })

  const [impressions, clicks, spend, leads_generated] = useWatch({
    control: form.control,
    name: ['impressions', 'clicks', 'spend', 'leads_generated'],
  })

  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '—'
  const cpc = clicks > 0 ? (spend / clicks).toFixed(2) : '—'
  const cpl = leads_generated > 0 ? (spend / leads_generated).toFixed(2) : '—'

  const onSubmit = (data: FormData) => {
    create.mutate(data as any, { onSuccess: () => navigate('/traffic') })
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-5 pb-20 animate-fade-in">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-white">Inserir Métricas</h1>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data *</Label>
              <Input type="date" {...form.register('date')} max={today} className="mt-1" />
            </div>
            <div>
              <Label>Plataforma</Label>
              <select
                {...form.register('platform')}
                className="mt-1 w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="meta">Meta (Facebook/Instagram)</option>
                <option value="google">Google</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Nome da Campanha *</Label>
            <Input {...form.register('campaign_name')} placeholder="Ex: Zyron - Pais de Atletas - SP" className="mt-1" />
          </div>
          <div>
            <Label>Conjunto de Anúncio</Label>
            <Input {...form.register('ad_set_name')} placeholder="Ex: Interesse - Futebol Jovens" className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Investimento (R$) *</Label>
              <Input type="number" step="0.01" {...form.register('spend')} className="mt-1" />
            </div>
            <div>
              <Label>Leads Gerados</Label>
              <Input type="number" {...form.register('leads_generated')} className="mt-1" />
            </div>
            <div>
              <Label>Impressões</Label>
              <Input type="number" {...form.register('impressions')} className="mt-1" />
            </div>
            <div>
              <Label>Cliques no Link</Label>
              <Input type="number" {...form.register('clicks')} className="mt-1" />
            </div>
          </div>

          {/* Calculated */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'CTR (%)', value: ctr },
              { label: 'CPC (R$)', value: cpc !== '—' ? Number(cpc).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—' },
              { label: 'CPL (R$)', value: cpl !== '—' ? Number(cpl).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—' },
            ].map(f => (
              <div key={f.label} className="rounded-lg bg-[#09090E] border border-white/5 p-2">
                <p className="text-[11px] text-white/40">{f.label}</p>
                <p className="text-sm font-semibold text-[#6366F1]">{f.value}</p>
                <p className="text-[10px] text-white/20">calculado</p>
              </div>
            ))}
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea {...form.register('notes')} placeholder="Observações sobre a campanha..." rows={3} className="mt-1" />
          </div>

          <Button type="submit" className="w-full" disabled={create.isPending}>
            Salvar Métricas
          </Button>
        </form>
      </div>
    </DashboardLayout>
  )
}
