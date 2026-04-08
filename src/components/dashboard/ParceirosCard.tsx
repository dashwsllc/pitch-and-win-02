import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Users } from "lucide-react"

const PARCEIROS = [
  {
    id: 1,
    nome: "Breno Mendes",
    inicial: "R",
    faturamento: 7450,
    vendas: 15,
    comissao: 7450,
  },
  {
    id: 2,
    nome: "Bruno Carvalho",
    inicial: "B",
    faturamento: 6800,
    vendas: 13,
    comissao: 6800,
  },
  {
    id: 3,
    nome: "Thiago Monteiro",
    inicial: "T",
    faturamento: 7200,
    vendas: 14,
    comissao: 7200,
  },
]

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

export function ParceirosCard() {
  const [ocultarNomes, setOcultarNomes] = useState(false)

  const totalComissao = PARCEIROS.reduce((s, p) => s + p.comissao, 0)

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <CardTitle className="text-foreground text-base">
            Parceiros
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              últimos 30 dias
            </span>
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-muted-foreground hover:text-foreground text-xs"
          onClick={() => setOcultarNomes((v) => !v)}
        >
          {ocultarNomes ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              Mostrar nomes
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              Ocultar nomes
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {PARCEIROS.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors"
          >
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">
                {ocultarNomes ? (i + 1) : p.inicial}
              </span>
            </div>

            {/* Nome */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {ocultarNomes ? `Parceiro ${i + 1}` : p.nome}
              </p>
            </div>

            {/* Comissão */}
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-foreground">
                {fmt(p.comissao)}
              </p>
              <p className="text-xs text-muted-foreground">comissão</p>
            </div>
          </div>
        ))}

        {/* Total */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <span className="text-xs text-muted-foreground">Total da equipe</span>
          <div className="text-right">
            <span className="text-sm font-semibold text-foreground">
              {fmt(totalComissao)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
