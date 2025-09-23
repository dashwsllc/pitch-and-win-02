import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet, ArrowDownToLine } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

interface WithdrawDialogProps {
  availableAmount: number
  onWithdrawRequest?: () => void
}

export function WithdrawDialog({ availableAmount, onWithdrawRequest }: WithdrawDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [pixKey, setPixKey] = useState("")
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const withdrawAmount = parseFloat(amount)
    
    if (withdrawAmount <= 0 || withdrawAmount > availableAmount) {
      toast({
        title: "Valor inválido",
        description: `O valor deve ser entre R$ 0,01 e R$ ${availableAmount.toFixed(2)}`,
        variant: "destructive",
      })
      return
    }

    if (!pixKey.trim()) {
      toast({
        title: "Chave PIX obrigatória",
        description: "Por favor, informe sua chave PIX para o saque",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('saques')
        .insert({
          user_id: user.id,
          valor_solicitado: withdrawAmount,
          chave_pix: pixKey.trim(),
        })

      if (error) throw error

      toast({
        title: "Saque solicitado com sucesso!",
        description: "Sua solicitação será analisada pelo executive",
      })

      setAmount("")
      setPixKey("")
      setIsOpen(false)
      onWithdrawRequest?.()
      
    } catch (error) {
      console.error('Error requesting withdrawal:', error)
      toast({
        title: "Erro ao solicitar saque",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-gradient-withdraw hover:opacity-90 text-foreground font-medium px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          disabled={availableAmount <= 0}
        >
          <Wallet className="w-4 h-4 mr-2" />
          Sacar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5" />
                Solicitar Saque
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Sua solicitação será enviada para análise do executive
              </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="available">Valor Disponível</Label>
            <Input
              id="available"
              value={new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(availableAmount)}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Saque</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0,00"
              step="0.01"
              min="0.01"
              max={availableAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pix">Chave PIX</Label>
            <Input
              id="pix"
              placeholder="Digite sua chave PIX (CPF, email, telefone ou chave aleatória)"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              required
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-withdraw hover:opacity-90"
            >
              {loading ? "Processando..." : "Solicitar Saque"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}