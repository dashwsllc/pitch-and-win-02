-- Fix critical security issues with document access - proper approach

-- Drop ALL existing policies for documents and document_categories
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Todos podem visualizar documentos" ON public.documents;
DROP POLICY IF EXISTS "Executives podem criar documentos" ON public.documents;
DROP POLICY IF EXISTS "Executives podem atualizar documentos" ON public.documents;
DROP POLICY IF EXISTS "Executives podem deletar documentos" ON public.documents;

DROP POLICY IF EXISTS "Authenticated users can view document categories" ON public.document_categories;
DROP POLICY IF EXISTS "Todos podem visualizar categorias" ON public.document_categories;
DROP POLICY IF EXISTS "Executives podem criar categorias" ON public.document_categories;
DROP POLICY IF EXISTS "Executives podem atualizar categorias" ON public.document_categories;
DROP POLICY IF EXISTS "Executives podem deletar categorias" ON public.document_categories;

-- Create secure policies for documents - only authenticated users can view
CREATE POLICY "Authenticated users can view documents" 
ON public.documents 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Executives can create documents" 
ON public.documents 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_executive(auth.uid()));

CREATE POLICY "Executives can update documents" 
ON public.documents 
FOR UPDATE 
TO authenticated
USING (public.is_executive(auth.uid()));

CREATE POLICY "Executives can delete documents" 
ON public.documents 
FOR DELETE 
TO authenticated
USING (public.is_executive(auth.uid()));

-- Create secure policies for document categories - only authenticated users can view
CREATE POLICY "Authenticated users can view document categories" 
ON public.document_categories 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Executives can create document categories" 
ON public.document_categories 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_executive(auth.uid()));

CREATE POLICY "Executives can update document categories" 
ON public.document_categories 
FOR UPDATE 
TO authenticated
USING (public.is_executive(auth.uid()));

CREATE POLICY "Executives can delete document categories" 
ON public.document_categories 
FOR DELETE 
TO authenticated
USING (public.is_executive(auth.uid()));

-- Fix hardcoded super admin email in is_executive function
CREATE OR REPLACE FUNCTION public.is_executive(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.has_role(_user_id, 'executive')
$function$;