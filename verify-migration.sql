-- Verify the migration was successful
-- Run this query to check if the new columns exist

SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('description', 'allow_contributors_add_names', 'allow_contributors_add_tasks')
ORDER BY column_name;

-- You should see 3 rows returned with the new columns
