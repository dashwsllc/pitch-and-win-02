import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { useDocuments, DocumentCategory } from '@/hooks/useDocuments'

interface AddDocumentDialogProps {
  categories: DocumentCategory[]
  onDocumentAdded: () => void
}

export function AddDocumentDialog({ categories, onDocumentAdded }: AddDocumentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isNewCategory, setIsNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const { addCategory, addDocument } = useDocuments()

  const resetForm = () => {
    setIsNewCategory(false)
    setNewCategoryName('')
    setSelectedCategory('')
    setTitle('')
    setDescription('')
    setLinkUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let categoryId = selectedCategory

      // Se for nova categoria, criar primeiro
      if (isNewCategory && newCategoryName) {
        const created = await addCategory(newCategoryName)
        if (!created) {
          setLoading(false)
          return
        }
        categoryId = created.id
      }

      if (!categoryId) {
        setLoading(false)
        return
      }

      const success = await addDocument(categoryId, title, description, linkUrl)
      if (success) {
        resetForm()
        setOpen(false)
        onDocumentAdded()
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Documento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <div className="flex gap-2">
              <Select 
                value={isNewCategory ? "new" : selectedCategory} 
                onValueChange={(value) => {
                  if (value === "new") {
                    setIsNewCategory(true)
                    setSelectedCategory('')
                  } else {
                    setIsNewCategory(false)
                    setSelectedCategory(value)
                  }
                }}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Nova Categoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isNewCategory && (
              <Input
                placeholder="Nome da nova categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
                disabled={loading}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título do Documento</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Manual de Processos"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do documento"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link do Documento</Label>
            <Input
              id="link"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://exemplo.com/documento.pdf"
              required
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar Documento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}