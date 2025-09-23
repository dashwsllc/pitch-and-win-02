import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export interface DocumentCategory {
  id: string
  name: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface Document {
  id: string
  category_id: string
  title: string
  description?: string
  link_url: string
  created_at: string
  updated_at: string
  created_by: string
}

export function useDocuments() {
  const [categories, setCategories] = useState<DocumentCategory[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching categories:', error)
        toast.error('Erro ao carregar categorias')
        return
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Erro ao carregar categorias')
    }
  }

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching documents:', error)
        toast.error('Erro ao carregar documentos')
        return
      }

      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error('Erro ao carregar documentos')
    }
  }

  const addCategory = async (name: string): Promise<DocumentCategory | null> => {
    if (!user?.id) {
      toast.error('Usuário não encontrado')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('document_categories')
        .insert({ name, created_by: user.id })
        .select()
        .single()

      if (error) {
        console.error('Error adding category:', error)
        toast.error('Erro ao adicionar categoria')
        return null
      }

      setCategories(prev => [...prev, data])
      toast.success('Categoria adicionada com sucesso!')
      return data
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('Erro ao adicionar categoria')
      return null
    }
  }

  const addDocument = async (categoryId: string, title: string, description: string, linkUrl: string) => {
    if (!user?.id) {
      toast.error('Usuário não encontrado')
      return false
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          category_id: categoryId,
          title,
          description,
          link_url: linkUrl,
          created_by: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding document:', error)
        toast.error('Erro ao adicionar documento')
        return false
      }

      setDocuments(prev => [data, ...prev])
      toast.success('Documento adicionado com sucesso!')
      return true
    } catch (error) {
      console.error('Error adding document:', error)
      toast.error('Erro ao adicionar documento')
      return false
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([fetchCategories(), fetchDocuments()])
      setLoading(false)
    }

    fetchData()
  }, [])

  const getDocumentsByCategory = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName)
    if (!category) return []
    return documents.filter(doc => doc.category_id === category.id)
  }

  return {
    categories,
    documents,
    loading,
    addCategory,
    addDocument,
    getDocumentsByCategory,
    refetch: () => Promise.all([fetchCategories(), fetchDocuments()])
  }
}