BEGIN;

CREATE SCHEMA recruitment;
REVOKE ALL ON SCHEMA recruitment FROM PUBLIC;

CREATE TABLE recruitment.batch (
    version text PRIMARY KEY,
    requirements jsonb NOT NULL,
    sources jsonb NOT NULL,
    status text NOT NULL DEFAULT 'pending_review'
        CHECK (status IN ('pending_review', 'returned', 'approved')),
    imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recruitment.active_release (
    singleton boolean PRIMARY KEY CHECK (singleton),
    version text REFERENCES recruitment.batch(version)
);
INSERT INTO recruitment.active_release VALUES (true, NULL);

CREATE TABLE recruitment.audit (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    action text NOT NULL,
    version text REFERENCES recruitment.batch(version),
    actor name NOT NULL DEFAULT session_user,
    reason text NOT NULL CHECK (btrim(reason) <> ''),
    recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE FUNCTION recruitment.import_batch(seed jsonb, source_index jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    batch_version text := seed->>'version';
    existing recruitment.batch%ROWTYPE;
BEGIN
    IF batch_version IS NULL OR batch_version !~ '^[a-z0-9][a-z0-9-]+$'
        OR seed->>'status' IS DISTINCT FROM 'pending_review'
        OR jsonb_typeof(seed->'requirements') IS DISTINCT FROM 'array'
        OR jsonb_array_length(seed->'requirements') = 0
        OR jsonb_typeof(source_index->'sources') IS DISTINCT FROM 'object'
    THEN
        RAISE EXCEPTION 'Invalid recruitment bundle';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(seed->'requirements') AS requirement(item)
        WHERE jsonb_typeof(item) IS DISTINCT FROM 'object'
            OR item - ARRAY['id', 'careerId', 'summary', 'category', 'sourceIds'] <> '{}'::jsonb
            OR nullif(btrim(item->>'id'), '') IS NULL
            OR nullif(btrim(item->>'careerId'), '') IS NULL
            OR nullif(btrim(item->>'summary'), '') IS NULL
            OR NOT coalesce(item->>'category' IN ('task', 'skill', 'portfolio'), false)
            OR jsonb_typeof(item->'sourceIds') IS DISTINCT FROM 'array'
            OR jsonb_array_length(item->'sourceIds') = 0
            OR EXISTS (
                SELECT 1 FROM jsonb_array_elements_text(item->'sourceIds') AS provenance(source_id)
                WHERE NOT ((source_index->'sources') ? source_id)
            )
    ) OR (
        SELECT count(*) <> count(DISTINCT item->>'id')
        FROM jsonb_array_elements(seed->'requirements') AS requirement(item)
    ) THEN
        RAISE EXCEPTION 'Invalid or duplicate recruitment requirement or source reference';
    END IF;

    INSERT INTO recruitment.batch(version, requirements, sources)
    VALUES (batch_version, seed->'requirements', source_index)
    ON CONFLICT (version) DO NOTHING;
    IF FOUND THEN
        INSERT INTO recruitment.audit(action, version, reason)
        VALUES ('import', batch_version, 'Imported candidate bundle');
        RETURN true;
    END IF;

    SELECT * INTO STRICT existing FROM recruitment.batch WHERE version = batch_version;
    IF existing.requirements IS DISTINCT FROM seed->'requirements'
        OR existing.sources IS DISTINCT FROM source_index
    THEN
        RAISE EXCEPTION 'Version % already exists with different data', batch_version;
    END IF;
    RETURN false;
END;
$$;

CREATE FUNCTION recruitment.review_batch(batch_version text, decision text, review_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
    IF decision IS NULL OR decision NOT IN ('approved', 'returned') THEN
        RAISE EXCEPTION 'Unknown review decision';
    END IF;
    UPDATE recruitment.batch SET status = decision
    WHERE version = batch_version AND status = 'pending_review';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Version must exist and be pending review';
    END IF;
    INSERT INTO recruitment.audit(action, version, reason)
    VALUES (decision, batch_version, review_reason);
END;
$$;

CREATE FUNCTION recruitment.set_active_release(batch_version text, release_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    previous_version text;
BEGIN
    SELECT version INTO STRICT previous_version
    FROM recruitment.active_release WHERE singleton FOR UPDATE;

    IF batch_version IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM recruitment.batch WHERE version = batch_version AND status = 'approved'
    ) THEN
        RAISE EXCEPTION 'Only an approved version can become active';
    END IF;
    IF previous_version IS NOT DISTINCT FROM batch_version THEN
        RAISE EXCEPTION 'Selected version is already active';
    END IF;

    UPDATE recruitment.active_release SET version = batch_version WHERE singleton;
    INSERT INTO recruitment.audit(action, version, reason)
    VALUES (CASE WHEN batch_version IS NULL THEN 'withdraw' ELSE 'activate' END,
            coalesce(batch_version, previous_version), release_reason);
END;
$$;

CREATE VIEW recruitment.released_requirements AS
SELECT batch.version, item->>'id' AS id, item->>'careerId' AS career_id,
       item->>'category' AS category, item->>'summary' AS summary,
       item->'sourceIds' AS source_ids
FROM recruitment.active_release AS active
JOIN recruitment.batch AS batch ON batch.version = active.version
CROSS JOIN LATERAL jsonb_array_elements(batch.requirements) AS requirement(item)
WHERE batch.status = 'approved';

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA recruitment FROM PUBLIC;
COMMIT;
