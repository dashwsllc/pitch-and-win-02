-- Criar tabela para categorias de documentos
CREATE TABLE public.document_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Criar tabela para documentos/links
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.document_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias
CREATE POLICY "Todos podem visualizar categorias"
ON public.document_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Executives podem criar categorias"
ON public.document_categories 
FOR INSERT 
WITH CHECK (is_executive(auth.uid()));

CREATE POLICY "Executives podem atualizar categorias"
ON public.document_categories 
FOR UPDATE 
USING (is_executive(auth.uid()));

CREATE POLICY "Executives podem deletar categorias"
ON public.document_categories 
FOR DELETE 
USING (is_executive(auth.uid()));

-- Políticas para documentos
CREATE POLICY "Todos podem visualizar documentos"
ON public.documents 
FOR SELECT 
USING (true);

CREATE POLICY "Executives podem criar documentos"
ON public.documents 
FOR INSERT 
WITH CHECK (is_executive(auth.uid()));

CREATE POLICY "Executives podem atualizar documentos"
ON public.documents 
FOR UPDATE 
USING (is_executive(auth.uid()));

CREATE POLICY "Executives podem deletar documentos"
ON public.documents 
FOR DELETE 
USING (is_executive(auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER update_document_categories_updated_at
BEFORE UPDATE ON public.document_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir categorias padrão
INSERT INTO public.document_categories (name, created_by) VALUES 
('vendas', 'fecaeedc-9b3a-4f26-8e88-1234567890ab'),
('regimento', 'fecaeedc-9b3a-4f26-8e88-1234567890ab'),
('operacional', 'fecaeedc-9b3a-4f26-8e88-1234567890ab');