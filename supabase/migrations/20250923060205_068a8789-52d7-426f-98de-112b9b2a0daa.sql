-- Fix critical security issues with document access

-- Drop the overly permissive policies for documents
DROP POLICY IF EXISTS "Todos podem visualizar documentos" ON public.documents;
DROP POLICY IF EXISTS "Todos podem visualizar categorias" ON public.document_categories;

-- Create secure policies for documents - only authenticated users can view
CREATE POLICY "Authenticated users can view documents" 
ON public.documents 
FOR SELECT 
TO authenticated
USING (true);

-- Create secure policies for document categories - only authenticated users can view
CREATE POLICY "Authenticated users can view document categories" 
ON public.document_categories 
FOR SELECT 
TO authenticated
USING (true);

-- Fix hardcoded super admin email in is_executive function
CREATE OR REPLACE FUNCTION public.is_executive(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
  SELECT public.has_role(_user_id, 'executive')
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = 'executive'
  );
$function$;