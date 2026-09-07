-- Add plural task label for contributor-facing copy
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS task_label_plural text DEFAULT 'tasks';

UPDATE projects
SET task_label_plural = task_label
WHERE task_label IS NOT NULL
  AND trim(task_label) <> ''
  AND (task_label_plural IS NULL OR task_label_plural = 'tasks');

COMMENT ON COLUMN projects.task_label_plural IS 'Plural form of task_label used in contributor-facing copy';
