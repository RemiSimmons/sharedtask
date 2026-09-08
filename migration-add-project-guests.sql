-- Per-contributor extra guest counts (not including the contributor).
-- Distinct from task_assignments.headcount, which is per-claim and double-counts
-- anyone who claims more than one task. Leave headcount in place.

CREATE TABLE IF NOT EXISTS public.project_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contributor_name text NOT NULL,
  guest_count integer NOT NULL DEFAULT 0 CHECK (guest_count >= 0 AND guest_count <= 20),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (project_id, contributor_name)
);

CREATE INDEX IF NOT EXISTS idx_project_guests_project_id
  ON public.project_guests(project_id);

ALTER TABLE public.project_guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to project_guests" ON public.project_guests;
CREATE POLICY "Allow public access to project_guests"
  ON public.project_guests FOR ALL USING (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.project_guests;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- Keep guest rows in sync when a host renames or removes a contributor.
CREATE OR REPLACE FUNCTION public.rename_project_contributor(
  p_project_id uuid,
  p_old_name text,
  p_new_name text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  names_arr text[];
  i int;
BEGIN
  IF trim(p_new_name) = '' THEN
    RAISE EXCEPTION 'Name cannot be empty';
  END IF;

  IF p_old_name = p_new_name THEN
    RETURN;
  END IF;

  SELECT public.parse_contributor_names(contributor_names)
  INTO names_arr
  FROM projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF p_new_name = ANY(names_arr) THEN
    RAISE EXCEPTION 'NAME_COLLISION';
  END IF;

  IF names_arr IS NULL THEN
    names_arr := ARRAY[]::text[];
  END IF;

  FOR i IN 1..COALESCE(array_length(names_arr, 1), 0) LOOP
    IF names_arr[i] = p_old_name THEN
      names_arr[i] := p_new_name;
    END IF;
  END LOOP;

  IF NOT (p_old_name = ANY(names_arr)) AND NOT (p_new_name = ANY(names_arr)) THEN
    names_arr := array_append(names_arr, p_new_name);
  END IF;

  UPDATE projects
  SET contributor_names = to_json(names_arr)
  WHERE id = p_project_id;

  UPDATE task_assignments
  SET contributor_name = p_new_name
  WHERE project_id = p_project_id
    AND contributor_name = p_old_name;

  UPDATE project_guests
  SET contributor_name = p_new_name, updated_at = now()
  WHERE project_id = p_project_id
    AND contributor_name = p_old_name
    AND NOT EXISTS (
      SELECT 1 FROM project_guests g
      WHERE g.project_id = p_project_id AND g.contributor_name = p_new_name
    );

  DELETE FROM project_guests
  WHERE project_id = p_project_id
    AND contributor_name = p_old_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_project_contributor(
  p_project_id uuid,
  p_name text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  names_arr text[];
BEGIN
  SELECT public.parse_contributor_names(contributor_names)
  INTO names_arr
  FROM projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  names_arr := ARRAY(
    SELECT n FROM unnest(COALESCE(names_arr, ARRAY[]::text[])) AS n WHERE n <> p_name
  );

  UPDATE projects
  SET contributor_names = to_json(names_arr)
  WHERE id = p_project_id;

  DELETE FROM task_assignments
  WHERE project_id = p_project_id
    AND contributor_name = p_name;

  DELETE FROM project_guests
  WHERE project_id = p_project_id
    AND contributor_name = p_name;

  UPDATE tasks t
  SET status = 'available'
  WHERE t.project_id = p_project_id
    AND t.status = 'claimed'
    AND NOT EXISTS (
      SELECT 1 FROM task_assignments ta WHERE ta.task_id = t.id
    );
END;
$$;
