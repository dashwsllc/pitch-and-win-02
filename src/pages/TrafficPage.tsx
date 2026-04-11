import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useTrafficMetrics } from '@/hooks/useTrafficMetrics'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PERIODS = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
]

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function TrafficPage() {
  const [days, setDays] = useState(30)
  const { data: metrics = [], isLoading } = useTrafficMetrics(days)

  const totalSpend = metrics.reduce((a, m) => a + (m.spend || 0), 0)
  const totalLeads = metrics.reduce((a, m) => a + (m.leads_generated || 0), 0)
  const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0
  const avgCTR =
    metrics.length > 0 ? metrics.reduce((a, m) => a + (m.ctr || 0), 0) / metrics.length : 0

  const byDate = metrics.reduce(
    (acc, m) => {
      const d = m.date
      if (!acc[d]) acc[d] = { date: d, leads: 0, spend: 0 }
      acc[d].leads += m.leads_generated || 0
      acc[d].spend += m.spend || 0
      return acc
    },
    {} as Record<string, { date: string; leads: number; spend: number }>
  )

  const chartData = Object.values(byDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map(d => ({ ...d, label: format(parseISO(d.date), 'dd/MM') }))

  const kpis = [
    { label: 'Total Investido', value: BRL(totalSpend), color: '#F59E0B' },
    { label: 'Leads Gerados', value: totalLeads.toLocaleString(), color: '#6366F1' },
    { label: 'CPL Médio', value: BRL(avgCPL), color: '#10B981' },
    { label: 'CTR Médio', value: `${avgCTR.toFixed(2)}%`, color: '#94A3B8' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-20 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Dashboard de Tráfego</h1>
          <Button asChild size="sm">
            <Link to="/traffic/new">
              <Plus className="w-4 h-4 mr-1" /> Inserir
            </Link>
          </Button>
        </div>

        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.label}
              onClick={() => setDays(p.days)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${days === p.days ? 'bg-[#6366F1] text-white' : 'bg-[#1A1A26] border border-white/10 text-white/60'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {kpis.map(k => (
            <div key={k.label} className="rounded-xl border border-white/10 bg-[#1A1A26] p-3">
              <p className="text-xs text-white/40">{k.label}</p>
              <p className="text-lg font-bold mt-0.5" style={{ color: k.color }}>
                {k.value}
              </p>
            </div>
          ))}
        </div>

        {chartData.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-[#111118] p-4">
            <p className="text-sm font-medium text-white/70 mb-3">Leads x Investimento</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#1A1A26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  labelStyle={{ color: '#94A3B8' }}
                  formatter={(value: any, name: string) => [
                    name === 'spend' ? BRL(value) : value,
                    name === 'spend' ? 'Investido' : 'Leads',
                  ]}
                />
                <Bar dataKey="leads" fill="#6366F1" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
                <Bar dataKey="spend" fill="#F59E0B" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]" />
          </div>
        ) : metrics.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-30">
              <rect x="6" y="6" width="36" height="36" rx="4" stroke="#94A3B8" strokeWidth="1.5" />
              <path d="M14 32l8-10 6 8 6-12" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[15px] text-white/40">Nenhuma métrica ainda</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-[#111118] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Data', 'Campanha', 'Plataforma', 'Leads', 'Investido', 'CPL', 'CTR'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-white/40 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.slice(0, 30).map(m => (
                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-3 py-2 text-white/60">{m.date}</td>
                      <td className="px-3 py-2 text-white/80 max-w-[120px] truncate">{m.campaign_name}</td>
                      <td className="px-3 py-2 text-white/60 capitalize">{m.platform}</td>
                      <td className="px-3 py-2 text-[#6366F1] font-medium">{m.leads_generated}</td>
                      <td className="px-3 py-2 text-[#F59E0B]">{BRL(m.spend)}</td>
                      <td className="px-3 py-2 text-[#10B981]">{m.cpl ? BRL(m.cpl) : '—'}</td>
                      <td className="px-3 py-2 text-white/60">{m.ctr ? `${m.ctr}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
