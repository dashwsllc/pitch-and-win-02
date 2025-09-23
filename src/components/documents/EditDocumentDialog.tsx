import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Edit, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface EditDocumentDialogProps {
  document: {
    id: string | number
    title: string
    description?: string
    link_url: string
  }
  isRealDocument: boolean
  onUpdate?: () => void
}

export function EditDocumentDialog({ document, isRealDocument, onUpdate }: EditDocumentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(document.title)
  const [description, setDescription] = useState(document.description || '')
  const [linkUrl, setLinkUrl] = useState(document.link_url)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !linkUrl.trim()) {
      toast.error('Título e link são obrigatórios')
      return
    }

    setLoading(true)
    
    try {
      if (isRealDocument) {
        // Update real document in Supabase
        const { supabase } = await import('@/integrations/supabase/client')
        const { error } = await supabase
          .from('documents')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            link_url: linkUrl.trim()
          })
          .eq('id', String(document.id))

        if (error) throw error
        
        toast.success('Documento atualizado com sucesso!')
        onUpdate?.()
      } else {
        // For mock documents, just show a message since they can't be updated
        toast.info('Este é um documento modelo e não pode ser editado. Crie um novo documento se necessário.')
      }
      
      setOpen(false)
    } catch (error) {
      console.error('Error updating document:', error)
      toast.error('Erro ao atualizar documento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do documento"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do documento (opcional)"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="linkUrl">Link de Acesso</Label>
            <Input
              id="linkUrl"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}