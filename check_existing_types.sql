-- VÉRIFICATION DES TYPES D'ID EXISTANTS
-- Exécutez ce script AVANT de créer les nouvelles tables

SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('guides', 'leads', 'users', 'articles', 'contacts', 'estimations')
  AND column_name = 'id'
ORDER BY table_name;