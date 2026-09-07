-- Atomic guest rename/remove so assignments cannot be orphaned

CREATE OR REPLACE FUNCTION public.parse_contributor_names(raw json)
RETURNS text[]
LANGUAGE plpgsql
AS $$
BEGIN
  IF raw IS NULL THEN
    RETURN ARRAY[]::text[];
  END IF;
  IF json_typeof(raw) = 'array' THEN
    RETURN ARRAY(SELECT json_array_elements_text(raw));
  END IF;
  IF json_typeof(raw) = 'string' THEN
    BEGIN
      RETURN ARRAY(SELECT json_array_elements_text((raw #>> '{}')::json));
    EXCEPTION WHEN others THEN
      RETURN ARRAY[]::text[];
    END;
  END IF;
  RETURN ARRAY[]::text[];
END;
$$;

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

  UPDATE tasks t
  SET status = 'available'
  WHERE t.project_id = p_project_id
    AND t.status = 'claimed'
    AND NOT EXISTS (
      SELECT 1 FROM task_assignments ta WHERE ta.task_id = t.id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.parse_contributor_names(json) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rename_project_contributor(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.remove_project_contributor(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.parse_contributor_names(json) TO service_role;
GRANT EXECUTE ON FUNCTION public.rename_project_contributor(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.remove_project_contributor(uuid, text) TO service_role;
